import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, ChevronRight, CircleHelp, Info, Network, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { mirrorClassesByPersona } from "@relay/demo-seed";
import { computeCohortComparison } from "@relay/practice-mirror";
import { readMirrorDataset } from "@relay/relay-core";
import { useDemo } from "../demo-context";
import { DemoNotice, PageHeading, ProvenanceBadge } from "../components/ui";

export function MirrorPage() {
  const navigate = useNavigate();
  const { persona, record } = useDemo();
  const [selectedId, setSelectedId] = useState("sglt2");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const mirrorClasses = mirrorClassesByPersona[persona.id] ?? mirrorClassesByPersona["hcp-maya"];
  const selected = mirrorClasses.find((item) => item.id === selectedId) ?? mirrorClasses[0];
  const mirrorRead = useMemo(() => readMirrorDataset(), []);
  const computed = useMemo(() => computeCohortComparison({ subject: mirrorRead.data[0], records: mirrorRead.data }), [mirrorRead]);
  const cohortSize = selectedId === "sglt2" ? computed?.cohortSize ?? 13 : 14;

  const openDetails = () => {
    setDetailsOpen(true);
    record({ product: "Mirror", action: "VIEW_COHORT_DETAILS", purpose: "SELF_INSIGHT", decision: "allow", summary: `Opened calculation details for ${selected.label}.` });
  };

  const askPeer = () => {
    record({ product: "Mirror", action: "EXPLORE_TOPIC", purpose: "SELF_INSIGHT", decision: "allow", summary: `Physician chose to explore ${selected.label} through Doctor Connect.` });
    navigate(`/connect?area=${encodeURIComponent(selected.label)}`);
  };

  return (
    <div className="stack-lg">
      <PageHeading eyebrow="Practice Mirror" title="See how your prescribing mix compares" description="A private snapshot of public Medicare Part D data. It does not judge your care." action={<button className="button secondary" onClick={openDetails}><CircleHelp size={17} /> About this comparison</button>} />
      <DemoNotice />

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

      {detailsOpen && <div className="drawer-backdrop" role="presentation" onClick={() => setDetailsOpen(false)}>
        <aside className="detail-drawer" role="dialog" aria-modal="true" aria-labelledby="calculation-title" onClick={(event) => event.stopPropagation()}>
          <button className="icon-button close" onClick={() => setDetailsOpen(false)} aria-label="Close details"><X /></button>
          <div className="eyebrow">Calculation details</div><h2 id="calculation-title">Why this comparison</h2>
          <div className="detail-section"><h3>Cohort definition</h3><dl><div><dt>Specialty</dt><dd>{persona.subtitle.split(" · ")[0]}</dd></div><div><dt>Geography</dt><dd>Georgia</dd></div><div><dt>Data year</dt><dd>2024</dd></div><div><dt>Minimum activity</dt><dd>150 eligible claims</dd></div><div><dt>Minimum cohort</dt><dd>11 physicians · Relay demo rule</dd></div></dl></div>
          <div className="detail-section"><h3>Included sources</h3><div className="badge-row"><ProvenanceBadge tone="blue">Public registry</ProvenanceBadge><ProvenanceBadge>Aggregate benchmark</ProvenanceBadge><ProvenanceBadge tone="gray">Synthetic demo data</ProvenanceBadge></div></div>
          <div className="detail-section"><h3>Not included</h3><ul className="plain-list"><li>Diagnosis or indication</li><li>Contraindications or clinical outcomes</li><li>Patients outside Medicare Part D</li><li>A complete practice denominator</li></ul></div>
          <div className="drawer-disclaimer">This comparison supports reflection. Relay has not determined whether a therapy is appropriate for any patient.</div>
        </aside>
      </div>}
    </div>
  );
}
