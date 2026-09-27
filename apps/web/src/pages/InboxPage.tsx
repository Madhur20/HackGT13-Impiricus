import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, Check, Inbox, LockKeyhole, MessageSquareText, ShieldCheck, X } from "lucide-react";
import { authorizeUse, readConnectCandidates } from "@relay/relay-core";
import { useConsults } from "../consult-context";
import { useDemo } from "../demo-context";
import { useAccountAuth } from "../auth-context";
import { LockedValue, PageHeading, StatusBadge } from "../components/ui";

const monitoringOptions = ["Renal trend", "Tolerance", "Volume status", "Follow-up cadence"];

export function InboxPage() {
  const { persona, record } = useDemo();
  const auth = useAccountAuth();
  const { requests, setStatus, submitAnswer, setContactApproval, markRead } = useConsults();
  const actorId = persona.id;
  const profiles = useMemo(() => readConnectCandidates().data, []);
  const recipient = profiles.find((profile) => profile.id === actorId);
  const received = requests.filter((request) => request.recipientId === actorId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Nothing opens automatically: a request only counts as read once the physician clicks it.
  const selected = received.find((request) => request.id === selectedId);
  const [approach, setApproach] = useState("Review baseline context and current monitoring cadence");
  const [monitoring, setMonitoring] = useState<string[]>(["Renal trend", "Tolerance"]);
  const [escalation, setEscalation] = useState("Unexpected change or persistent symptoms");

  useEffect(() => {
    if (selected && !selected.recipientReadAt) markRead(selected.id, "recipient");
  }, [markRead, selected?.id, selected?.recipientReadAt]);

  useEffect(() => {
    if (!selected?.answer) return;
    setApproach(selected.answer.approach);
    setMonitoring(selected.answer.monitoring);
    setEscalation(selected.answer.escalation);
  }, [selected?.id, selected?.answer]);

  const actOnRequest = (status: "accepted" | "declined") => {
    if (!selected) return;
    setStatus(selected.id, status);
    record({ product: "Connect", action: status === "accepted" ? "REQUEST_ACCEPTED" : "REQUEST_DECLINED", purpose: "PEER_MATCHING", decision: "allow", summary: `${recipient?.displayName ?? "Recipient"} ${status} request ${selected.id}.` });
  };

  const sendAnswer = () => {
    if (!selected || monitoring.length === 0) return;
    submitAnswer(selected.id, { approach, monitoring, escalation });
    record({ product: "Connect", action: "STRUCTURED_ANSWER", purpose: "PEER_MATCHING", decision: "allow", summary: `Recipient submitted a structured answer for request ${selected.id}.` });
  };

  const toggleMonitoring = (value: string) => setMonitoring((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  const contactRevealed = selected ? authorizeUse({ purpose: "PEER_CONTACT", requesterContactConsent: selected.requesterContactApproved, recipientContactConsent: selected.recipientContactApproved }).decision === "allow" : false;
  const requesterEmail = selected ? auth.getAccountEmail(selected.requesterId) : undefined;

  return <div className="stack-lg inbox-page">
    <PageHeading eyebrow="Doctor Connect Inbox" title="Requests from colleagues" description={`Review general practice questions sent to ${recipient?.displayName ?? persona.name}, then accept, decline, or answer using structured fields.`} />
    <div className="inbox-proof"><ShieldCheck size={18} /><span><strong>Professional context only</strong>No patient narrative, attachments, or direct contact details are included.</span></div>

    <div className="inbox-layout">
      <aside className="panel inbox-list">
        <div className="panel-heading"><div><span>Received</span><h2>{received.length} {received.length === 1 ? "request" : "requests"}</h2></div></div>
        {received.length === 0 ? <div className="inbox-empty"><Inbox size={25} /><strong>No requests waiting</strong><span>New Doctor Connect requests will appear here.</span></div> : <div className="inbox-items">
          {received.map((request) => <button className={["inbox-item", request.id === selected?.id && "active", !request.recipientReadAt && "unread"].filter(Boolean).join(" ")} onClick={() => setSelectedId(request.id)} key={request.id}>
            <span className="requester-avatar">{request.requesterName.split(" ").slice(1, 3).map((word) => word[0]).join("")}</span>
            <span><strong>{!request.recipientReadAt && <><i className="unread-dot" aria-hidden="true" /><span className="sr-only">Unread: </span></>}{request.requesterName}</strong><small>{request.selection.therapeuticArea} · {request.selection.topic}</small><time>{new Date(request.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time></span>
            <StatusBadge tone={request.status === "declined" ? "blocked" : request.status === "pending" ? "review" : "success"}>{request.status}</StatusBadge>
          </button>)}
        </div>}
      </aside>

      <section className="panel inbox-detail">
        {!selected ? <div className="inbox-empty"><MessageSquareText size={28} /><strong>Select a request</strong><span>The structured question and response controls will appear here.</span></div> : <>
          <div className="inbox-detail-heading"><div><span>Question from {selected.requesterName}</span><h2>{selected.selection.therapeuticArea}</h2></div><StatusBadge tone={selected.status === "declined" ? "blocked" : selected.status === "pending" ? "review" : "success"}>{selected.status}</StatusBadge></div>
          <div className="requester-profile">
            <span className="requester-avatar large">{selected.requesterName.split(" ").slice(1, 3).map((word) => word[0]).join("")}</span>
            <div><strong>{selected.requesterName}</strong><span>{selected.requesterSpecialty ?? "Verified physician"} · {selected.requesterLocation ?? "Location on profile"}</span></div>
            <span className="verified-identity"><BadgeCheck size={15} /> Verified physician</span>
          </div>
          <blockquote>“{selected.question}”</blockquote>
          <div className="question-context"><span>Topic<strong>{selected.selection.topic}</strong></span><span>Population<strong>{selected.selection.populationBand}</strong></span><span>Context<strong>{selected.selection.conditionTag}</strong></span><span>Sent<strong>{new Date(selected.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</strong></span></div>

          {selected.status === "pending" && <div className="inbox-decision"><button className="button secondary" onClick={() => actOnRequest("declined")}><X size={16} /> Decline</button><button className="button primary" onClick={() => actOnRequest("accepted")}><Check size={16} /> Accept request</button></div>}

          {(selected.status === "accepted" || selected.status === "answered") && <div className="answer-builder">
            <div className="answer-builder-heading"><span>Structured response</span><h3>Share your professional approach</h3></div>
            <label><span>Approach considered</span><select value={approach} onChange={(event) => setApproach(event.target.value)} disabled={selected.status === "answered"}><option>Review baseline context and current monitoring cadence</option><option>Confirm treatment goals and relevant comorbidities</option><option>Coordinate a focused care-team review</option></select></label>
            <fieldset disabled={selected.status === "answered"}><legend>Monitoring considerations</legend><div className="monitoring-options">{monitoringOptions.map((item) => <label key={item}><input type="checkbox" checked={monitoring.includes(item)} onChange={() => toggleMonitoring(item)} />{item}</label>)}</div></fieldset>
            <label><span>Escalation considerations</span><select value={escalation} onChange={(event) => setEscalation(event.target.value)} disabled={selected.status === "answered"}><option>Unexpected change or persistent symptoms</option><option>New tolerability concern or safety signal</option><option>Need for specialist or care-team review</option></select></label>
            {selected.status !== "answered" && <button className="button primary" onClick={sendAnswer} disabled={monitoring.length === 0}>Send structured answer <ArrowRight size={17} /></button>}
            {selected.status === "answered" && <div className="answer-sent"><Check size={18} /><span><strong>Answer sent</strong>The requester received this response immediately.</span></div>}
          </div>}

          {selected.status === "answered" && <><div className="recipient-contact"><div><LockKeyhole size={18} /><span><strong>Continue as colleagues</strong>Approve email sharing only if you want to continue outside Relay.</span></div><button className={selected.recipientContactApproved ? "consent-button approved" : "consent-button"} onClick={() => setContactApproval(selected.id, "recipient", !selected.recipientContactApproved)}>{selected.recipientContactApproved ? "Email approved" : "Approve email"}</button></div><LockedValue revealed={contactRevealed} value={requesterEmail} /></>}
        </>}
      </section>
    </div>
  </div>;
}
