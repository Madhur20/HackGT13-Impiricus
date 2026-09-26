import { BookOpenCheck, Check, CircleAlert, Clock3, Filter, ShieldCheck } from "lucide-react";
import { POLICY_VERSION } from "@relay/relay-core";
import { useDemo } from "../demo-context";
import { PageHeading, StatusBadge } from "../components/ui";

export function AuditPage() {
  const { events } = useDemo();
  return <div className="stack-lg"><PageHeading eyebrow="Shared foundation" title="Consent and policy audit" description="One event format makes governance reuse visible across Practice Mirror, Doctor Connect, and Ledger." action={<button className="button secondary"><Filter size={16} /> All products</button>} />
    <section className="audit-proof"><div className="audit-shield"><ShieldCheck /></div><div><span>Active policy version</span><h2>{POLICY_VERSION}</h2><p>Every event below records the declared purpose and deterministic decision. No patient details or off-platform conversation content are stored.</p></div><div className="audit-count"><strong>{events.length}</strong><span>session events</span></div></section>
    <section className="panel audit-panel"><div className="audit-table-heading"><span>Event</span><span>Product</span><span>Purpose</span><span>Decision</span><span>Time</span></div>{events.map((event) => <article className="audit-row" key={event.id}><div className="audit-event"><div className={`event-icon ${event.decision}`}>{event.decision === "allow" ? <Check size={16} /> : event.decision === "review" ? <Clock3 size={16} /> : <CircleAlert size={16} />}</div><div><strong>{event.action.replaceAll("_", " ")}</strong><p>{event.summary}</p><small>{event.id}</small></div></div><b>{event.product}</b><code>{event.purpose}</code><StatusBadge tone={event.decision === "allow" ? "success" : event.decision === "review" ? "review" : "blocked"}>{event.decision}</StatusBadge><time>{new Date(event.occurredAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" })}</time></article>)}</section>
    {events.length === 1 && <div className="empty-audit"><BookOpenCheck size={25} /><span>Complete actions in the three workflows to build the shared audit story.</span></div>}
  </div>;
}
