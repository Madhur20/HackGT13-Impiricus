import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, Check, CircleAlert, Eye, Inbox, LockKeyhole, MessageSquareText, RotateCcw, ScanLine, ShieldCheck, Trash2, X } from "lucide-react";
import { ANSWER_SECTIONS, ANSWER_TEXT_LIMIT, answerSectionHasSuggestion, structuredAnswerDisplayText, buildAnswerTemplate, guardrailIssueLabel, incompleteAnswerSections, isGuardedPeerAnswer, isValidStructuredAnswer, parseAnswerSections, reviewAnswerText, tidyAnswerDraft, toggleAnswerSuggestion, type AnswerGuardrailReview, type AnswerSectionId } from "@relay/doctor-connect";
import { authorizeUse, readConnectCandidates } from "@relay/relay-core";
import { useConsults } from "../consult-context";
import { useDemo } from "../demo-context";
import { useAccountAuth } from "../auth-context";
import { LockedValue, PageHeading, StatusBadge } from "../components/ui";
import { PeerAnswerBody } from "../components/PeerAnswerBody";

const SUGGESTION_HINTS: Partial<Record<AnswerSectionId, string>> = { approach: "Add one or more", monitoring: "Select all that apply", escalation: "Choose one" };

export function InboxPage() {
  const { persona, record } = useDemo();
  const auth = useAccountAuth();
  const { requests, setStatus, submitAnswer, approveContact, markRead } = useConsults();
  const actorId = persona.id;
  const profiles = useMemo(() => readConnectCandidates().data, []);
  const recipient = profiles.find((profile) => profile.id === actorId);
  const received = requests.filter((request) => request.recipientId === actorId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Nothing opens automatically: a request only counts as read once the physician clicks it.
  const selected = received.find((request) => request.id === selectedId);
  const [answerText, setAnswerText] = useState("");
  const [answerReview, setAnswerReview] = useState<AnswerGuardrailReview | null>(null);
  const [answerConfirmed, setAnswerConfirmed] = useState(false);

  useEffect(() => {
    if (selected && !selected.recipientReadAt) markRead(selected.id, "recipient");
  }, [markRead, selected?.id, selected?.recipientReadAt]);

  useEffect(() => {
    setAnswerConfirmed(false);
    setAnswerReview(null);
    if (isGuardedPeerAnswer(selected?.answer)) setAnswerText(selected.answer.responseText);
    else if (selected?.answer && isValidStructuredAnswer(selected.answer)) setAnswerText(structuredAnswerDisplayText(selected.answer));
    else setAnswerText(buildAnswerTemplate());
  }, [selected?.id, selected?.answer]);

  const actOnRequest = (status: "accepted" | "declined") => {
    if (!selected) return;
    setStatus(selected.id, status);
    record({ product: "Connect", action: status === "accepted" ? "REQUEST_ACCEPTED" : "REQUEST_DECLINED", purpose: "PEER_MATCHING", decision: "allow", summary: `${recipient?.displayName ?? "Recipient"} ${status} request ${selected.id}.` });
  };

  const sendAnswer = () => {
    if (!selected || !answerConfirmed || answerReview?.status !== "ready" || answerReview.safetyStop) return;
    submitAnswer(selected.id, answerText);
    setAnswerText("");
    setAnswerReview(null);
    record({ product: "Connect", action: "GUARDED_ANSWER", purpose: "PEER_MATCHING", decision: "allow", summary: `Recipient reviewed and submitted a guarded physician answer for request ${selected.id}.` });
  };

  const updateAnswer = (value: string) => {
    setAnswerText(value);
    setAnswerReview(null);
    setAnswerConfirmed(false);
  };
  const toggleSuggestion = (sectionId: AnswerSectionId, suggestion: string) => updateAnswer(toggleAnswerSuggestion(answerText, sectionId, suggestion));
  const resetTemplate = () => updateAnswer(buildAnswerTemplate());
  const runAnswerReview = () => {
    if (!answerReady) return;
    // Blank optional headings are dropped in the visible draft so the reviewed text is exactly what is sent.
    const draft = tidyAnswerDraft(answerText);
    setAnswerText(draft);
    const review = reviewAnswerText(draft);
    setAnswerReview(review);
    setAnswerConfirmed(false);
    if (review.safetyStop) record({ product: "Connect", action: "ANSWER_SAFETY_STOP", purpose: "PEER_MATCHING", decision: "deny", summary: "A safety-event phrase stopped the physician answer workflow." });
  };
  const contactRevealed = selected ? authorizeUse({ purpose: "PEER_CONTACT", requesterContactConsent: selected.requesterContactApproved, recipientContactConsent: selected.recipientContactApproved }).decision === "allow" : false;
  const requesterEmail = selected ? auth.getAccountEmail(selected.requesterId) : undefined;
  const answerReviewPassed = answerReview?.status === "ready" && !answerReview.safetyStop;
  const incompleteSections = incompleteAnswerSections(answerText);
  const draftSections = parseAnswerSections(answerText)?.sections ?? [];
  const answerReady = Boolean(tidyAnswerDraft(answerText)) && incompleteSections.length === 0;
  const requiredSections = ANSWER_SECTIONS.filter((section) => section.required);
  const completedRequired = requiredSections.filter((section) => draftSections.some((candidate) => candidate.id === section.id && candidate.value)).length;
  const storedAnswerText = isGuardedPeerAnswer(selected?.answer)
    ? selected.answer.responseText
    : selected?.answer && isValidStructuredAnswer(selected.answer)
      ? structuredAnswerDisplayText(selected.answer)
      : "This older response cannot be displayed in the current answer format.";

  return <div className="stack-lg inbox-page">
    <PageHeading eyebrow="Doctor Connect Inbox" title="Requests from colleagues" description={`Review general practice questions sent to ${recipient?.displayName ?? persona.name}, then accept, decline, or answer using the same privacy-reviewed flow.`} />
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
            <div className="answer-builder-heading"><span>Physician response</span><h3>Share your professional approach</h3><p>Answer in the structured format below so your colleague can scan your approach quickly. Use general practice language only: no names, patient-specific facts, contact details, dates, identifiers, or exact ages.</p></div>
            {selected.status !== "answered" && <>
              <div className="answer-composer" aria-label="Response structure">
                <div className="answer-composer-head">
                  <div><span>Response structure</span><p>Suggestions write into the matching line of your answer. Every line stays fully editable.</p></div>
                  <button type="button" className="composer-reset" onClick={resetTemplate}><RotateCcw size={13} /> Reset template</button>
                </div>
                {ANSWER_SECTIONS.filter((section) => section.suggestions.length).map((section) => <div className="composer-row" key={section.id}>
                  <div className="composer-row-label"><strong>{section.label}</strong><small>{SUGGESTION_HINTS[section.id]}</small></div>
                  <div className="composer-chips" role="group" aria-label={`${section.label} suggestions`}>
                    {section.suggestions.map((suggestion) => {
                      const active = answerSectionHasSuggestion(answerText, section.id, suggestion);
                      return <button type="button" key={suggestion} className={active ? "composer-chip active" : "composer-chip"} aria-pressed={active} onClick={() => toggleSuggestion(section.id, suggestion)}>{active ? <Check size={12} /> : null}{suggestion}</button>;
                    })}
                  </div>
                </div>)}
              </div>
              <div className={answerReview?.status === "needs_changes" ? "answer-text-field needs-changes" : answerReviewPassed ? "answer-text-field reviewed" : "answer-text-field"}>
                <div className="answer-text-heading"><label htmlFor="answer-text">Your answer</label><small>{answerText.length}/{ANSWER_TEXT_LIMIT}</small></div>
                <textarea id="answer-text" value={answerText} onChange={(event) => updateAnswer(event.target.value)} maxLength={ANSWER_TEXT_LIMIT} rows={9} spellCheck placeholder={buildAnswerTemplate()} aria-describedby="answer-section-status" />
                <div className="answer-section-status" id="answer-section-status">
                  {ANSWER_SECTIONS.map((section) => {
                    const written = draftSections.find((candidate) => candidate.id === section.id);
                    const filled = Boolean(written?.value);
                    return <span className={filled ? "filled" : !written ? "removed" : section.required ? "missing" : "optional"} key={section.id}>{filled ? <Check size={11} /> : <i aria-hidden="true" />}{section.label}{section.required ? "" : " · optional"}</span>;
                  })}
                  <b>{draftSections.length ? `${completedRequired} of ${requiredSections.length} core sections` : "Free-form answer"}</b>
                </div>
              </div>
              {incompleteSections.length && completedRequired > 0 ? <div className="answer-incomplete"><CircleAlert size={14} /><span>Complete {incompleteSections.map((id) => ANSWER_SECTIONS.find((section) => section.id === id)!.label).join(", ")}, or delete a heading you do not need.</span></div> : null}
              {!answerReview ? <div className="answer-review-state"><Eye size={16} /><span><strong>Your draft stays visible</strong>Relay checks it only when you select “Check privacy &amp; safety.”</span></div> : answerReview.safetyStop ? <div className="answer-review-state blocked"><CircleAlert size={16} /><span><strong>This may describe a safety event</strong>Relay cannot send it through the peer workflow. Use the designated safety reporting route.</span></div> : answerReview.status === "needs_changes" ? <div className="answer-review-state blocked"><CircleAlert size={16} /><span><strong>Please revise your answer</strong>Detected {answerReview.issues.map(guardrailIssueLabel).join(", ")}.<small>Redacted preview: {answerReview.redactedPreview}</small></span></div> : <div className="answer-review-state ready"><Check size={16} /><span><strong>Privacy check passed</strong>No supported direct-identifier pattern was found. Review the exact answer below.</span></div>}
              <div className="answer-guardrail-process"><span><Eye size={15} />Write</span><span className={answerReview ? "complete" : ""}><ScanLine size={15} />Privacy check</span><span className={answerReviewPassed ? "complete" : ""}><ShieldCheck size={15} />Review</span><span><Trash2 size={15} />Clear draft</span></div>
              {answerReviewPassed ? <div className="answer-preview"><span>What the requester will receive</span><PeerAnswerBody text={answerReview.reviewedValue} /></div> : null}
              <details className="privacy-examples answer-examples"><summary>Examples Relay will ask you to revise</summary><div><span>“Bob's renal impairment”</span><span>“The 72-year-old patient”</span><span>“Call me at 404-555-0199”</span><span>“Seen January 3, 2024”</span></div></details>
              {answerReviewPassed ? <label className="answer-confirmation"><input type="checkbox" checked={answerConfirmed} onChange={(event) => setAnswerConfirmed(event.target.checked)} /><span>I reviewed this exact answer, confirm it contains no patient-identifying information, and want to send it as my professional experience.</span></label> : null}
              <div className="answer-actions">{answerReviewPassed ? <button className="button primary" onClick={sendAnswer} disabled={!answerConfirmed}>Send reviewed answer <ArrowRight size={17} /></button> : <button className="button primary" onClick={runAnswerReview} disabled={!answerReady}>Check privacy &amp; safety <ShieldCheck size={17} /></button>}</div>
            </>}
            {selected.status === "answered" && <div className="answer-preview sent"><span>Answer sent to the requester</span><PeerAnswerBody text={storedAnswerText} /></div>}
            {selected.status === "answered" && <div className="answer-sent"><Check size={18} /><span><strong>Answer sent</strong>The requester received this response immediately.</span></div>}
          </div>}

          {selected.status === "answered" && <><div className="recipient-contact"><div><LockKeyhole size={18} /><span><strong>Continue as colleagues</strong>Approve email sharing only if you want to continue outside Relay. Approval is final and cannot be withdrawn.</span></div><button className={selected.recipientContactApproved ? "consent-button approved" : "consent-button"} onClick={() => approveContact(selected.id, "recipient")} disabled={selected.recipientContactApproved}>{selected.recipientContactApproved ? <><Check size={12} /> Email approved</> : "Approve email"}</button></div><LockedValue revealed={contactRevealed} value={requesterEmail} /></>}
        </>}
      </section>
    </div>
  </div>;
}
