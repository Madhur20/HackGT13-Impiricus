import type { MirrorComparison, PrescribingStat } from "@relay/domain";

function percentile(values: number[], fraction: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

export function computeCohortComparison(input: {
  subject: PrescribingStat;
  records: PrescribingStat[];
  minimumCohortSize?: number;
}): MirrorComparison | null {
  const minimum = input.minimumCohortSize ?? 11;
  const valid = input.records.filter((record) =>
    !record.suppressed
    && record.classId === input.subject.classId
    && record.year === input.subject.year
    && record.specialty === input.subject.specialty
    && record.hcpId !== input.subject.hcpId
  );
  const stateCohort = valid.filter((record) => record.state === input.subject.state);
  const cohort = stateCohort.length >= minimum ? stateCohort : valid;
  if (cohort.length < minimum) return null;
  const values = cohort.map((record) => record.classShare);
  return {
    classId: input.subject.classId,
    classLabel: input.subject.classLabel,
    subjectValue: input.subject.classShare,
    cohortMedian: percentile(values, 0.5),
    cohortQ1: percentile(values, 0.25),
    cohortQ3: percentile(values, 0.75),
    cohortSize: cohort.length,
    year: input.subject.year,
    geography: stateCohort.length >= minimum ? input.subject.state : "National",
    usedFallback: stateCohort.length < minimum,
  };
}
