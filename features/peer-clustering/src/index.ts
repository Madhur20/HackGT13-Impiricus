import type {
  ClusterAssignment,
  DomainCluster,
  DomainClusteringResult,
  DomainPeerSuggestion,
  DrugClassId,
  DrugClassRef,
  HcpProfile,
  PrescribingProfile,
} from "@relay/domain";
import { authorizeUse } from "@relay/relay-core";

// Peer domain clustering groups physicians by their prescribing mix using a
// deterministic k-means. It is a DESCRIPTIVE overlap signal used to suggest
// peers who practice in a similar domain. It never claims expertise, quality,
// adherence, or treatment appropriateness, and Doctor Connect's hard
// eligibility filters and transparent ranking still apply before any contact.

const DEFAULT_CLASS_LABELS: Record<string, string> = {
  sglt2: "SGLT2 inhibitors",
  glp1: "GLP-1 receptor agonists",
  dpp4: "DPP-4 inhibitors",
  basal: "Basal insulin",
  metformin: "Metformin & other orals",
};

const DOMINANT_SHARE_FLOOR = 0.15;

export type ClusterOptions = {
  k?: number;
  maxIterations?: number;
  seed?: number;
  classLabels?: Record<string, string>;
};

// Small seeded PRNG (mulberry32) so k-means++ initialization is reproducible.
function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function deriveClassIds(profiles: PrescribingProfile[]): DrugClassId[] {
  const seen = new Set<DrugClassId>();
  for (const profile of profiles) {
    for (const classId of Object.keys(profile.classShares) as DrugClassId[]) {
      seen.add(classId);
    }
  }
  return [...seen].sort();
}

function toVector(profile: PrescribingProfile, classIds: DrugClassId[]): number[] {
  return classIds.map((classId) => profile.classShares[classId] ?? 0);
}

function euclidean(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function nearestCentroid(vector: number[], centroids: number[][]): number {
  let best = 0;
  let bestDistance = Infinity;
  for (let c = 0; c < centroids.length; c += 1) {
    const distance = euclidean(vector, centroids[c]);
    if (distance < bestDistance - 1e-12) {
      bestDistance = distance;
      best = c;
    }
  }
  return best;
}

// Deterministic k-means++ seeding.
function initCentroids(vectors: number[][], k: number, rng: () => number): number[][] {
  const centroids: number[][] = [];
  const first = Math.floor(rng() * vectors.length);
  centroids.push([...vectors[first]]);
  while (centroids.length < k) {
    const distances = vectors.map((vector) => {
      let min = Infinity;
      for (const centroid of centroids) {
        min = Math.min(min, euclidean(vector, centroid) ** 2);
      }
      return min;
    });
    const total = distances.reduce((sum, value) => sum + value, 0);
    if (total === 0) {
      centroids.push([...vectors[centroids.length % vectors.length]]);
      continue;
    }
    let target = rng() * total;
    let chosen = 0;
    for (let i = 0; i < distances.length; i += 1) {
      target -= distances[i];
      if (target <= 0) {
        chosen = i;
        break;
      }
    }
    centroids.push([...vectors[chosen]]);
  }
  return centroids;
}

function meanVector(vectors: number[][], dimensions: number): number[] {
  const sums = new Array(dimensions).fill(0);
  for (const vector of vectors) {
    for (let i = 0; i < dimensions; i += 1) {
      sums[i] += vector[i];
    }
  }
  return sums.map((value) => value / vectors.length);
}

function toRecord(vector: number[], classIds: DrugClassId[]): Record<DrugClassId, number> {
  return classIds.reduce((acc, classId, index) => {
    acc[classId] = Number(vector[index].toFixed(4));
    return acc;
  }, {} as Record<DrugClassId, number>);
}

function dominantClasses(
  centroid: Record<DrugClassId, number>,
  classIds: DrugClassId[],
  labels: Record<string, string>,
): DomainCluster["dominantClasses"] {
  return classIds
    .map((classId) => ({ classId, classLabel: labels[classId] ?? classId, share: centroid[classId] ?? 0 }))
    .sort((a, b) => b.share - a.share)
    .filter((entry, index) => index === 0 || entry.share >= DOMINANT_SHARE_FLOOR)
    .slice(0, 3);
}

function describeDomain(dominant: DomainCluster["dominantClasses"]): string {
  if (dominant.length === 0) return "General diabetes prescribing domain";
  const primary = dominant[0];
  const secondary = dominant[1];
  if (secondary && secondary.share >= primary.share * 0.75) {
    return `${primary.classLabel} & ${secondary.classLabel} domain`;
  }
  return `${primary.classLabel}-led prescribing domain`;
}

export function clusterDoctorsByDomain(profiles: PrescribingProfile[], options: ClusterOptions = {}): DomainClusteringResult {
  const seed = options.seed ?? 42;
  const maxIterations = options.maxIterations ?? 50;
  const labels = { ...DEFAULT_CLASS_LABELS, ...options.classLabels };

  const sorted = [...profiles].sort((a, b) => a.hcpId.localeCompare(b.hcpId));
  const classIds = deriveClassIds(sorted);
  const featureClasses: DrugClassRef[] = classIds.map((classId) => ({ classId, classLabel: labels[classId] ?? classId }));

  const k = Math.min(options.k ?? 3, sorted.length);
  const vectors = sorted.map((profile) => toVector(profile, classIds));

  if (k <= 0 || vectors.length === 0) {
    return { clusters: [], assignments: [], featureClasses, iterations: 0, seed };
  }

  const rng = createRng(seed);
  let centroids = initCentroids(vectors, k, rng);
  let assignments = vectors.map((vector) => nearestCentroid(vector, centroids));
  let iterations = 0;

  for (iterations = 0; iterations < maxIterations; iterations += 1) {
    const next = vectors.map((vector) => nearestCentroid(vector, centroids));
    const stable = next.every((clusterIndex, i) => clusterIndex === assignments[i]);
    assignments = next;
    // Recompute centroids from the current assignments; keep the prior centroid
    // for any empty cluster so the model stays deterministic.
    centroids = centroids.map((centroid, clusterIndex) => {
      const members = vectors.filter((_, i) => assignments[i] === clusterIndex);
      return members.length > 0 ? meanVector(members, classIds.length) : centroid;
    });
    if (stable && iterations > 0) break;
  }

  const clusters: DomainCluster[] = centroids.map((centroid, clusterIndex) => {
    const memberIndexes = assignments.map((assigned, i) => (assigned === clusterIndex ? i : -1)).filter((i) => i >= 0);
    const centroidRecord = toRecord(centroid, classIds);
    const dominant = dominantClasses(centroidRecord, classIds, labels);
    return {
      id: `cluster-${clusterIndex + 1}`,
      label: describeDomain(dominant),
      dominantClasses: dominant,
      centroid: centroidRecord,
      memberIds: memberIndexes.map((i) => sorted[i].hcpId),
      size: memberIndexes.length,
    };
  });

  const assignmentRecords: ClusterAssignment[] = sorted.map((profile, i) => {
    const clusterIndex = assignments[i];
    return {
      hcpId: profile.hcpId,
      clusterId: `cluster-${clusterIndex + 1}`,
      distanceToCentroid: Number(euclidean(vectors[i], centroids[clusterIndex]).toFixed(4)),
    };
  });

  return { clusters, assignments: assignmentRecords, featureClasses, iterations, seed };
}

function sharedDomainClasses(
  subject: PrescribingProfile,
  peer: PrescribingProfile,
  featureClasses: DrugClassRef[],
): string[] {
  return featureClasses
    .filter(({ classId }) => (subject.classShares[classId] ?? 0) >= DOMINANT_SHARE_FLOOR && (peer.classShares[classId] ?? 0) >= DOMINANT_SHARE_FLOOR)
    .map((entry) => ({ label: entry.classLabel, combined: (subject.classShares[entry.classId] ?? 0) + (peer.classShares[entry.classId] ?? 0) }))
    .sort((a, b) => b.combined - a.combined)
    .slice(0, 3)
    .map((entry) => entry.label);
}

export function suggestDomainPeers(input: {
  subjectId: string;
  profiles: PrescribingProfile[];
  candidates: HcpProfile[];
  clustering?: DomainClusteringResult;
  clusterOptions?: ClusterOptions;
  limit?: number;
}): DomainPeerSuggestion[] {
  const clustering = input.clustering ?? clusterDoctorsByDomain(input.profiles, input.clusterOptions);
  const classIds = clustering.featureClasses.map((entry) => entry.classId);

  const subjectAssignment = clustering.assignments.find((assignment) => assignment.hcpId === input.subjectId);
  const subjectProfile = input.profiles.find((profile) => profile.hcpId === input.subjectId);
  if (!subjectAssignment || !subjectProfile) return [];

  const cluster = clustering.clusters.find((entry) => entry.id === subjectAssignment.clusterId);
  if (!cluster) return [];

  const candidateById = new Map(input.candidates.map((candidate) => [candidate.id, candidate]));
  const profileById = new Map(input.profiles.map((profile) => [profile.hcpId, profile]));
  const subjectVector = toVector(subjectProfile, classIds);

  return cluster.memberIds
    .filter((id) => id !== input.subjectId)
    .map((id): DomainPeerSuggestion | null => {
      const candidate = candidateById.get(id);
      const peerProfile = profileById.get(id);
      if (!candidate || !peerProfile) return null;
      // Peer identity is only suggested for physicians with active matching consent.
      if (authorizeUse({ purpose: "PEER_MATCHING", candidate }).decision !== "allow") return null;

      const similarity = Number(cosineSimilarity(subjectVector, toVector(peerProfile, classIds)).toFixed(4));
      const shared = sharedDomainClasses(subjectProfile, peerProfile, clustering.featureClasses);
      const reasons = [
        `Practices in the ${cluster.label}`,
        shared.length > 0 ? `Similar ${shared[0]} prescribing emphasis` : "Overlapping prescribing mix",
        candidate.specialty === subjectProfile.specialty ? `Same specialty (${candidate.specialty})` : `Related specialty (${candidate.specialty})`,
      ].slice(0, 3);

      return {
        profile: candidate,
        similarity,
        clusterId: cluster.id,
        clusterLabel: cluster.label,
        sharedDomainClasses: shared,
        reasons,
      };
    })
    .filter((suggestion): suggestion is DomainPeerSuggestion => suggestion !== null)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, input.limit ?? 4);
}
