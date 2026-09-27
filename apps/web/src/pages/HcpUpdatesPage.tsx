import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BellRing, Check, Clock3, History, Network, ShieldCheck, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { readConnectCandidates, readPracticeUpdates } from "@relay/relay-core";
import { useDemo } from "../demo-context";
import { ProvenanceBadge } from "../components/ui";

const formatDate = (value: string, options?: Intl.DateTimeFormatOptions) => new Date(`${value}T12:00:00`).toLocaleDateString([], options);

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
  const selectedIndex = Math.max(0, updates.findIndex((update) => update.id === selected.id));
  const specialists = selected.specialistIds
    .map((id) => specialistRead.data.find((profile) => profile.id === id))
    .filter((profile): profile is NonNullable<typeof profile> => Boolean(profile))
    .slice(0, 4);

  useEffect(() => {
    setSelectedId(updates[0]?.id ?? "");
  }, [persona.id, updates]);

  if (!selected) return <div className="empty-updates"><BellRing size={30} /><h1>No reviewed updates right now</h1><p>Relay will show relevant, permitted updates here when they are available.</p></div>;

  const chooseUpdate = (id: string) => {
    setSelectedId(id);
    const update = updates.find((item) => item.id === id);
    if (update) record({ product: "Ledger", action: "PRACTICE_UPDATE_VIEWED", purpose: "SELF_INSIGHT", decision: updateRead.decision.decision, summary: `Viewed reviewed update ${update.id}.` });
  };

  const askPeer = () => {
    record({ product: "Ledger", action: "UPDATE_TOPIC_EXPLORED", purpose: "SELF_INSIGHT", decision: "allow", summary: `Opened Doctor Connect from reviewed update ${selected.id}.` });
    navigate(`/connect?area=${encodeURIComponent(selected.therapeuticArea)}&topic=${encodeURIComponent(selected.suggestedTopics[0])}`);
  };

  const markReviewed = () => {
    if (!reviewedIds.includes(selected.id)) setReviewedIds((current) => [...current, selected.id]);
    record({ product: "Ledger", action: "PRACTICE_UPDATE_REVIEWED", purpose: "SELF_INSIGHT", decision: "allow", summary: `Marked update ${selected.id} as reviewed.` });
  };

  const showAdjacentUpdate = (direction: -1 | 1) => {
    const nextIndex = (selectedIndex + direction + updates.length) % updates.length;
    chooseUpdate(updates[nextIndex].id);
  };

  return <div className="updates-page">
    <section className="updates-hero">
      <div className="updates-hero-copy">
        <div className="eyebrow">Medicine updates</div>
        <h1>What changed,<br />clearly explained.</h1>
        <p>Review recent pharma and drug-product changes matched to your professional interests, then discuss the practical questions with an eligible specialist.</p>
        <div className="updates-hero-meta"><span><ShieldCheck size={15} /> Reviewed records · no patient data</span></div>
      </div>
      <div className="updates-hero-art" aria-hidden="true">
        <span className="shape shape-one" /><span className="shape shape-two" /><span className="shape shape-three" />
        <div className="update-signal"><BellRing size={24} /><strong>{updates.length}</strong><small>recent updates</small></div>
      </div>
    </section>

    <section className="updates-feed" aria-labelledby="updates-feed-title">
      <div className="editorial-heading"><div><span>Recently reviewed</span><h2 id="updates-feed-title">Updates selected for you</h2></div><p>Choose an update to see the reviewed before-and-after record.</p></div>
      <div className="updates-browser">
        <div className="update-selector" aria-label="Available medicine updates">
          {updates.map((update, index) => <button key={update.id} onClick={() => chooseUpdate(update.id)} className={update.id === selected.id ? "update-selector-item active" : "update-selector-item"} aria-pressed={update.id === selected.id}>
            <span className={`selector-number visual-${index + 1}`}>{String(index + 1).padStart(2, "0")}</span>
            <span className="selector-copy"><small>{update.therapeuticArea}</small><strong>{update.title}</strong><time>{formatDate(update.publishedAt, { month: "short", day: "numeric", year: "numeric" })}</time></span>
            {reviewedIds.includes(update.id) ? <Check size={17} /> : <ArrowRight size={17} />}
          </button>)}
        </div>

        <article className="update-modal" aria-live="polite">
          <div className="update-modal-toolbar"><span>{selectedIndex + 1} of {updates.length}</span><div><button onClick={() => showAdjacentUpdate(-1)} aria-label="Previous update"><ArrowLeft size={18} /></button><button onClick={() => showAdjacentUpdate(1)} aria-label="Next update"><ArrowRight size={18} /></button></div></div>
          <div className="badge-row"><ProvenanceBadge tone="gray">Illustrative product record</ProvenanceBadge><span className="reviewed-pill"><Check size={13} /> Reviewed update</span></div>
          <span className="story-kicker">{selected.therapeuticArea}</span>
          <h3>{selected.title}</h3>
          <p className="update-summary">{selected.changeSummary}</p>
          <div className="modal-version-pair">
            <div className="version-card before"><span>Before</span><strong>{selected.previousVersion}</strong></div>
            <div className="version-divider"><ArrowRight size={18} /><span>What changed</span></div>
            <div className="version-card now"><span>Current</span><strong>{selected.currentVersion}</strong></div>
          </div>
          <div className="why-shown"><Sparkles size={19} /><div><span>Why this is in your feed</span>{selected.relevanceReasons.map((reason) => <strong key={reason}>{reason}</strong>)}</div></div>
          <p className="update-detail-copy">{selected.detail}</p>
          <div className="update-meta"><span><Clock3 size={14} /> Reviewed {formatDate(selected.publishedAt)}</span><span><History size={14} /> History preserved</span></div>
        </article>
      </div>
    </section>

    <section className="specialist-section" aria-labelledby="specialists-title">
      <div className="editorial-heading"><div><span>Guided by real experience</span><h2 id="specialists-title">Discuss this change with a specialist</h2></div><p>{specialists.length} verified, opted-in {specialists.length === 1 ? "physician is" : "physicians are"} available through the governed Doctor Connect flow.</p></div>
      <div className="specialist-grid">{specialists.map((specialist, index) => <article className={`specialist-card specialist-${index + 1}`} key={specialist.id}>
        <div className="specialist-portrait" aria-hidden="true"><span>{specialist.displayName.split(" ").slice(1, 3).map((word) => word[0]).join("")}</span></div>
        <strong>{specialist.displayName}</strong><span>{specialist.specialty}</span><small>{specialist.state} · Verified and opted in</small>
      </article>)}</div>
      <div className="discussion-bar"><div><Network size={21} /><span><strong>Professional discussion, not prescribing advice</strong><small>Only the therapeutic area and approved discussion topic continue to Doctor Connect.</small></span></div><div className="discussion-actions"><button className="text-button" onClick={markReviewed}>{reviewedIds.includes(selected.id) ? "Marked as reviewed" : "Mark as reviewed"}</button><button className="button primary" onClick={askPeer}>Ask a peer about this <ArrowRight size={17} /></button></div></div>
    </section>
  </div>;
}
