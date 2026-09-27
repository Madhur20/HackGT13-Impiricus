import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, ChevronRight, CircleHelp, Info, Network, ShieldCheck, Users, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { mirrorClassesByPersona } from "@relay/demo-seed";
import type { DrugClassId } from "@relay/domain";
import { computeCohortComparison } from "@relay/practice-mirror";
import { clusterDoctorsByDomain, suggestDomainPeers, suggestSimilarPrescribers } from "@relay/peer-clustering";
import { readClusteringDataset, readConnectCandidates, readMirrorDataset } from "@relay/relay-core";
import { useDemo } from "../demo-context";
import { PageHeading, ProvenanceBadge } from "../components/ui";

export function MirrorPage() {
  const navigate = useNavigate();
  const { persona, record } = useDemo();
  const [selectedId, setSelectedId] = useState("sglt2");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const mirrorClasses = mirrorClassesByPersona[persona.id] ?? mirrorClassesByPersona["hcp-maya"];
  const [peersRevealed, setPeersRevealed] = useState(false);
  const [peerView, setPeerView] = useState<"drug" | "domain">("drug");
  const selected = mirrorClasses.find((item) => item.id === selectedId) ?? mirrorClasses[0];
  const mirrorRead = useMemo(() => readMirrorDataset(), []);
  const computed = useMemo(() => computeCohortComparison({ subject: mirrorRead.data[0], records: mirrorRead.data }), [mirrorRead]);
  const cohortSize = selectedId === "sglt2" ? computed?.cohortSize ?? 13 : 14;

  // Peer domain discovery. Prescribing vectors and eligible candidates are read
  // through the governed data broker; peer identity is only surfaced for
  // physicians with an active matching-consent grant.
  const clusterProfiles = useMemo(() => readClusteringDataset().data, []);
  const candidates = useMemo(() => readConnectCandidates().data, []);
  const clustering = useMemo(() => clusterDoctorsByDomain(clusterProfiles), [clusterProfiles]);
  const subjectCluster = useMemo(() => {
    const assignment = clustering.assignments.find((item) => item.hcpId === persona.id);
    return clustering.clusters.find((cluster) => cluster.id === assignment?.clusterId) ?? null;
  }, [clustering, persona.id]);
  const drugPeers = useMemo(
    () => suggestSimilarPrescribers({ subjectId: persona.id, classId: selectedId as DrugClassId, profiles: clusterProfiles, candidates, limit: 4 }),
    [persona.id, selectedId, clusterProfiles, candidates],
  );
  const domainPeers = useMemo(
    () => suggestDomainPeers({ subjectId: persona.id, profiles: clusterProfiles, candidates, clustering, limit: 4 }),
    [persona.id, clusterProfiles, candidates, clustering],
  );

  const openDetails = () => {
    setDetailsOpen(true);
    record({ product: "Mirror", action: "VIEW_COHORT_DETAILS", purpose: "SELF_INSIGHT", decision: "allow", summary: `Opened calculation details for ${selected.label}.` });
  };

  const askPeer = () => {
    record({ product: "Mirror", action: "EXPLORE_TOPIC", purpose: "SELF_INSIGHT", decision: "allow", summary: `Physician chose to explore ${selected.label} through Doctor Connect.` });
    navigate(`/connect?area=${encodeURIComponent(selected.label)}`);
  };

  const revealPeers = () => {
    setPeersRevealed(true);
    record({ product: "Connect", action: "PEER_DISCOVERY", purpose: "PEER_MATCHING", decision: "allow", summary: `Viewed opted-in peers who prescribe ${selected.label} similarly and share the ${subjectCluster?.label ?? "practice"}.` });
  };

  const discussPeer = (name: string) => {
    record({ product: "Connect", action: "PEER_MATCHING", purpose: "PEER_MATCHING", decision: "allow", summary: `Opened Doctor Connect from a peer suggestion for ${selected.label}.` });
    navigate(`/connect?area=${encodeURIComponent(selected.label)}`);
    void name;
  };

  const activePeers = peerView === "drug"
    ? drugPeers.map((peer) => ({
        id: peer.profile.id,
        name: peer.profile.displayName,
        specialty: peer.profile.specialty,
        state: peer.profile.state,
        metricValue: `${Math.round(peer.peerShare * 100)}%`,
        metricLabel: `${peer.classLabel} share`,
        reasons: peer.reasons,
      }))
    : domainPeers.map((peer) => ({
        id: peer.profile.id,
        name: peer.profile.displayName,
        specialty: peer.profile.specialty,
        state: peer.profile.state,
        metricValue: `${Math.round(peer.similarity * 100)}%`,
        metricLabel: "domain match",
        reasons: peer.reasons,
      }));

  return (
    <div className="stack-lg">
      <PageHeading eyebrow="Practice Mirror" title="See how your prescribing mix compares" description="A private snapshot of public Medicare Part D data. It does not judge your care." action={<button className="button secondary" onClick={openDetails}><CircleHelp size={17} /> About this comparison</button>} />
      <div className="mirror-layout">
        <section className="panel mirror-list-panel">
          <div className="panel-heading"><div><span>Choose a class</span><h2>Medication classes</h2></div><span className="year-chip">2024</span></div>
          <div className="class-list">
            {mirrorClasses.map((item) => (
              <button key={item.id} className={item.id === selectedId ? "class-row active" : "class-row"} onClick={() => setSelectedId(item.id)}>
                <span className="class-symbol">{item.label.slice(0, 2).toUpperCase()}</span>
                <span className="class-copy"><strong>{item.label}</strong><small>Your reported share</small></span>
                <span className="class-value"><strong>{item.subject}%</strong><small>your share</small></span>
                <ChevronRight size={17} />
              </button>
            ))}
          </div>
          <div className="coverage-note"><Info size={16} /><span>CMS Part D represents only part of a physician's practice. Suppressed records are not treated as zero.</span></div>
        </section>

        <section className="panel comparison-panel">
          <div className="comparison-topline"><div><span>Your snapshot</span><h2>{selected.label}</h2></div><span className="private-label">Visible only to you</span></div>
          <div className="comparison-numbers">
            <div className="subject-number"><strong>{selected.subject}%</strong><span>Your reported class share</span></div>
            <div className="median-number"><strong>{selected.median}%</strong><span>Peer median</span></div>
          </div>
          <div className="range-chart" aria-label={`Your share ${selected.subject} percent, peer middle range ${selected.q1} to ${selected.q3} percent`}>
            <div className="range-axis"><span>0%</span><span>10%</span><span>20%</span><span>30%</span><span>40%</span></div>
            <div className="range-track">
              <span className="iqr" style={{ left: `${selected.q1 * 2.5}%`, width: `${(selected.q3 - selected.q1) * 2.5}%` }} />
              <span className="median-marker" style={{ left: `${selected.median * 2.5}%` }}><i /><b>Peer median</b></span>
              <span className="subject-marker" style={{ left: `${selected.subject * 2.5}%` }}><i /><b>You</b></span>
            </div>
            <div className="range-caption"><span>Peer middle 50%</span><strong>{selected.q1}%–{selected.q3}%</strong></div>
          </div>
          <div className="neutral-insight"><BookOpen size={19} /><p>Your reported share is {selected.subject < selected.median ? "lower" : "higher"} than the peer median. That difference is not automatically good or bad.</p></div>
          <div className="comparison-meta">
            <div><span>Cohort</span><strong>{persona.subtitle.split(" · ")[0]} · Georgia</strong></div>
            <div><span>Eligible peers</span><strong>{cohortSize} physicians</strong></div>
            <div><span>Metric</span><strong>Share of configured basket</strong></div>
          </div>
          <div className="panel-actions"><button className="text-button" onClick={openDetails}>View data and limitations</button><button className="button primary" onClick={askPeer}><Network size={17} /> Discuss with a peer <ArrowRight size={17} /></button></div>
        </section>
      </div>

      <section className="panel peer-discovery-panel">
        <div className="panel-heading">
          <div><span>Peers like you</span><h2>Physicians who prescribe like you</h2></div>
          {peersRevealed && <div className="peer-view-toggle" role="tablist" aria-label="Peer view">
            <button role="tab" aria-selected={peerView === "drug"} className={peerView === "drug" ? "active" : ""} onClick={() => setPeerView("drug")}>Similar on {selected.label}</button>
            <button role="tab" aria-selected={peerView === "domain"} className={peerView === "domain" ? "active" : ""} onClick={() => setPeerView("domain")}>Your overall domain</button>
          </div>}
        </div>

        {!peersRevealed
          ? <div className="peer-reveal">
              <Users size={22} />
              <p>See opted-in physicians who prescribe <strong>{selected.label}</strong> at a similar rate, or who share your overall prescribing domain{subjectCluster ? <> — the <strong>{subjectCluster.label}</strong></> : null}.</p>
              <button className="button primary" onClick={revealPeers}><Users size={17} /> Find similar peers</button>
            </div>
          : <div className="stack-md">
              <div className="filter-proof"><ShieldCheck size={18} /><span><strong>{activePeers.length} opted-in peers</strong>{peerView === "drug" ? `Ranked by how close their ${selected.label} share is to yours.` : `Grouped by prescribing mix into the ${subjectCluster?.label ?? "practice domain"}.`} Identity is shown only for physicians who consented to matching; contact still requires mutual consent in Doctor Connect.</span></div>
              {activePeers.length === 0
                ? <div className="peer-empty"><Info size={16} /><span>No opted-in peers match this view right now.</span></div>
                : <div className="match-grid">
                    {activePeers.map((peer) => (
                      <article className="panel match-card" key={peer.id}>
                        <div className="peer-avatar">{peer.name.split(" ").slice(1, 3).map((word) => word[0]).join("")}</div>
                        <h3>{peer.name}</h3>
                        <p>{peer.specialty} · {peer.state}</p>
                        <div className="match-score"><strong>{peer.metricValue}</strong><span>{peer.metricLabel}</span></div>
                        <ul>{peer.reasons.slice(0, 3).map((reason) => <li key={reason}><ChevronRight size={14} />{reason}</li>)}</ul>
                        <div className="badge-row"><ProvenanceBadge tone="mint">Permitted for matching</ProvenanceBadge><ProvenanceBadge tone="gray">Synthetic demo data</ProvenanceBadge></div>
                        <button className="button secondary wide" onClick={() => discussPeer(peer.name)}><Network size={15} /> Discuss via Doctor Connect</button>
                      </article>
                    ))}
                  </div>}
              <p className="peer-boundary-note">These groupings describe prescribing overlap only. They do not measure quality, adherence, or the right treatment for any patient.</p>
            </div>}
      </section>

      {detailsOpen && <div className="drawer-backdrop" role="presentation" onClick={() => setDetailsOpen(false)}>
        <aside className="detail-drawer" role="dialog" aria-modal="true" aria-labelledby="calculation-title" onClick={(event) => event.stopPropagation()}>
          <button className="icon-button close" onClick={() => setDetailsOpen(false)} aria-label="Close details"><X /></button>
          <div className="eyebrow">Calculation details</div><h2 id="calculation-title">Why this comparison</h2>
          <div className="detail-section"><h3>Cohort definition</h3><dl><div><dt>Specialty</dt><dd>{persona.subtitle.split(" · ")[0]}</dd></div><div><dt>Geography</dt><dd>Georgia</dd></div><div><dt>Data year</dt><dd>2024</dd></div><div><dt>Minimum activity</dt><dd>150 eligible claims</dd></div><div><dt>Minimum cohort</dt><dd>11 physicians · Relay cohort rule</dd></div></dl></div>
          <div className="detail-section"><h3>Included sources</h3><div className="badge-row"><ProvenanceBadge tone="blue">Public registry</ProvenanceBadge><ProvenanceBadge>Aggregate benchmark</ProvenanceBadge><ProvenanceBadge tone="gray">Illustrative record</ProvenanceBadge></div></div>
          <div className="detail-section"><h3>Not included</h3><ul className="plain-list"><li>Diagnosis or indication</li><li>Contraindications or clinical outcomes</li><li>Patients outside Medicare Part D</li><li>A complete practice denominator</li></ul></div>
          <div className="drawer-disclaimer">This comparison supports reflection. Relay has not determined whether a therapy is appropriate for any patient.</div>
        </aside>
      </div>}
    </div>
  );
}
