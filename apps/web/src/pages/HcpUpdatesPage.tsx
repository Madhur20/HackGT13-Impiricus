import { useMemo, useState } from "react";
import { ArrowRight, BellRing, Check, Clock3, History, Network, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { readConnectCandidates, readPracticeUpdates } from "@relay/relay-core";
import { useDemo } from "../demo-context";
import { DemoNotice, PageHeading, ProvenanceBadge } from "../components/ui";

const formatDemoDate = (value: string, options?: Intl.DateTimeFormatOptions) => new Date(`${value}T12:00:00`).toLocaleDateString([], options);

export function HcpUpdatesPage() {
  const navigate = useNavigate();
  const { persona, record } = useDemo();
  const specialty = persona.subtitle.split(" · ")[0];
  const updateRead = useMemo(() => readPracticeUpdates({ actorId: persona.id, specialty }), [persona.id, specialty]);
  const specialistRead = useMemo(() => readConnectCandidates(), []);
  const updates = updateRead.data;
  const [selectedId, setSelectedId] = useState(updates[0]?.id ?? "");
  const [reviewedIds, setReviewedIds] = useState<string[]>([]);
  const selected = updates.find((update) => update.id === selectedId) ?? updates[0];
  const specialists = selected.specialistIds
    .map((id) => specialistRead.data.find((profile) => profile.id === id))
    .filter((profile): profile is NonNullable<typeof profile> => Boolean(profile))
    .slice(0, 4);

  if (!selected) return <div className="empty-updates"><BellRing size={30} /><h1>No reviewed updates right now</h1><p>Relay will show relevant, permitted updates here when they are available.</p></div>;

  const chooseUpdate = (id: string) => {
    setSelectedId(id);
    const update = updates.find((item) => item.id === id);
    if (update) record({ product: "Ledger", action: "PRACTICE_UPDATE_VIEWED", purpose: "SELF_INSIGHT", decision: updateRead.decision.decision, summary: `Viewed synthetic update ${update.id}.` });
  };

  const askPeer = () => {
    record({ product: "Ledger", action: "UPDATE_TOPIC_EXPLORED", purpose: "SELF_INSIGHT", decision: "allow", summary: `Opened Doctor Connect from synthetic update ${selected.id}.` });
    navigate(`/connect?area=${encodeURIComponent(selected.therapeuticArea)}&topic=${encodeURIComponent(selected.suggestedTopics[0])}`);
  };

  const markReviewed = () => {
    if (!reviewedIds.includes(selected.id)) setReviewedIds((current) => [...current, selected.id]);
    record({ product: "Ledger", action: "PRACTICE_UPDATE_REVIEWED", purpose: "SELF_INSIGHT", decision: "allow", summary: `Marked synthetic update ${selected.id} as reviewed.` });
  };

  return <div className="stack-lg">
    <PageHeading eyebrow="Ledger Updates" title="What changed in medicines you follow" description="Reviewed pharma and drug-product changes matched to your specialty. Use them to start an informed discussion with specialists, not as prescribing instructions." />
    <div className="spark-banner"><BellRing size={20} /><div><strong>Opened from a Spark-style notification</strong><span>A reviewed update matched your professional interests.</span></div><DemoNotice /></div>

    <div className="updates-layout">
      <section className="panel updates-list" aria-label="Practice updates">
        <div className="panel-heading"><div><span>Recent</span><h2>{updates.length} relevant updates</h2></div></div>
        <div className="update-items">
          {updates.map((update) => <button key={update.id} onClick={() => chooseUpdate(update.id)} className={update.id === selected.id ? "update-item active" : "update-item"}>
            <span className="update-dot" />
            <span className="update-item-copy"><small>{update.therapeuticArea}</small><strong>{update.title}</strong><time>{formatDemoDate(update.publishedAt, { month: "short", day: "numeric" })}</time></span>
            {reviewedIds.includes(update.id) && <Check size={16} />}
          </button>)}
        </div>
      </section>

      <section className="panel update-detail">
        <div className="update-detail-top"><div><span>{selected.therapeuticArea}</span><h2>{selected.title}</h2></div><ProvenanceBadge tone="gray">Synthetic demo data</ProvenanceBadge></div>
        <p className="update-summary">{selected.changeSummary}</p>
        <div className="version-change">
          <div><span>Before</span><strong>{selected.previousVersion}</strong></div>
          <ArrowRight size={18} />
          <div><span>Now</span><strong>{selected.currentVersion}</strong></div>
        </div>
        <div className="why-shown"><Sparkles size={18} /><div><span>Why you are seeing this</span>{selected.relevanceReasons.map((reason) => <strong key={reason}>{reason}</strong>)}</div></div>
        <p className="update-detail-copy">{selected.detail}</p>
        <div className="specialist-section"><div><span>Discuss this change with</span><h3>{specialists.length} eligible specialists</h3></div><div className="specialist-grid">{specialists.map((specialist) => <div className="specialist-card" key={specialist.id}><strong>{specialist.displayName}</strong><span>{specialist.specialty} · {specialist.state}</span><small>Verified · opted in</small></div>)}</div></div>
        <div className="update-meta"><span><Clock3 size={14} /> Reviewed {formatDemoDate(selected.publishedAt)}</span><span><History size={14} /> Version history preserved</span></div>
        <div className="panel-actions"><button className="text-button" onClick={markReviewed}>{reviewedIds.includes(selected.id) ? "Reviewed" : "Mark as reviewed"}</button><button className="button primary" onClick={askPeer}><Network size={17} /> Ask a peer about this <ArrowRight size={17} /></button></div>
      </section>
    </div>
  </div>;
}
