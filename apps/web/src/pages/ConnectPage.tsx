import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck, BellRing, Check, ChevronRight, CircleAlert, Clock3, Eye, Info, LockKeyhole, Network, ScanLine, ShieldCheck, Trash2, UserRoundCheck } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import type { QuestionSelection } from "@relay/domain";
import { assembleQuestion, structuredAnswerDisplayText, guardrailIssueLabel, inferMatchingTagIds, isCompleteQuestionSelection, isGuardedPeerAnswer, isValidStructuredAnswer, reviewQuestionSelection, type FieldGuardrailReview, type QuestionField, type QuestionGuardrailReview } from "@relay/doctor-connect";
import { buildPeerNeed, matchPeers } from "@relay/network-graph";
import { authorizeUse, readConnectCandidates, readNetworkGraph } from "@relay/relay-core";
import { useConsults } from "../consult-context";
import { useDemo } from "../demo-context";
import { useAccountAuth } from "../auth-context";
import { LockedValue, PageHeading, StatusBadge } from "../components/ui";
import { PeerAnswerBody } from "../components/PeerAnswerBody";

const steps = ["Your question", "Review", "Choose a peer", "Answer"];

const QUESTION_FIELDS: QuestionField[] = ["topic", "therapeuticArea", "populationBand", "conditionTag"];
const FIELD_COPY: Record<QuestionField, { label: string; placeholder: string; example: string }> = {
  topic: { label: "What do you want to discuss?", placeholder: "e.g. monitoring kidney function", example: "Monitoring after initiation" },
  therapeuticArea: { label: "Medication or therapy area", placeholder: "e.g. Jardiance or SGLT2 inhibitors", example: "Jardiance" },
  populationBand: { label: "Age or general age group", placeholder: "e.g. 72 or older adults", example: "72" },
  conditionTag: { label: "General condition context", placeholder: "e.g. CKD with cardiovascular disease", example: "CKD" },
};

const emptyQuestion = (): QuestionSelection => ({ topic: "", therapeuticArea: "", populationBand: "", conditionTag: "" });

function GuidedBlank({ field, value, review, onChange }: {
  field: QuestionField;
  value: string;
  review?: FieldGuardrailReview;
  onChange: (value: string) => void;
}) {
  const copy = FIELD_COPY[field];
  const maxLength = field === "populationBand" ? 40 : field === "therapeuticArea" ? 100 : 120;
  return <div className={review?.status === "needs_changes" ? "guided-blank needs-changes" : review?.status === "ready" ? "guided-blank reviewed" : "guided-blank"}>
    <div className="guided-blank-heading"><span>{copy.label}</span><small>{value.length}/{maxLength}</small></div>
    <input value={value} onChange={(event) => onChange(event.target.value)} maxLength={maxLength} autoComplete="off" placeholder={copy.placeholder} aria-label={copy.label} />
    {!review ? <div className="parse-state">Your wording stays visible. Relay checks it only when you continue. Example: “{copy.example}”.</div> : review.status === "ready" ? <div className="field-review ready"><Check size={14} /><span>{review.generalized ? <><strong>Generalized for privacy</strong><small>Reviewed value: {review.reviewedValue}</small></> : <>No direct identifier pattern found. Your wording is unchanged.</>}</span></div> : <div className="field-review blocked"><CircleAlert size={14} /><span><strong>Please revise this field</strong>Detected {review.issues.map(guardrailIssueLabel).join(", ")}.<small>Redacted preview: {review.redactedPreview}</small></span></div>}
  </div>;
}

export function ConnectPage() {
  const [params] = useSearchParams();
  const { persona, record } = useDemo();
  const auth = useAccountAuth();
  const { requests, createRequest, approveContact, markRead } = useConsults();
  const [step, setStep] = useState(0);
  const [selection, setSelection] = useState<QuestionSelection>({
    therapeuticArea: "SGLT2 inhibitors",
    topic: "Monitoring",
    populationBand: "Adults 40–65",
    conditionTag: "Renal impairment",
  });
  const [guardrailReview, setGuardrailReview] = useState<QuestionGuardrailReview | null>(null);
  const [inputDisposed, setInputDisposed] = useState(false);
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);
  const activeRequestStorageKey = `relay.active-consult.${persona.id}`;
  const [activeRequestId, setActiveRequestId] = useState<string | null>(() => window.localStorage.getItem(activeRequestStorageKey));
  const [questionConfirmed, setQuestionConfirmed] = useState(false);
  const [showAnswerNotification, setShowAnswerNotification] = useState(false);

  useEffect(() => {
    const savedRequestId = window.localStorage.getItem(`relay.active-consult.${persona.id}`);
    setActiveRequestId(savedRequestId);
    const linkedArea = params.get("area")?.trim();
    const linkedTopic = params.get("topic")?.trim();
    const defaults: QuestionSelection = persona.id === "hcp-jordan" ? {
      therapeuticArea: "GLP-1 receptor agonists",
      topic: "Side-effect management",
      populationBand: "Adults 65–89",
      conditionTag: "Cardiovascular disease",
    } : {
      therapeuticArea: "SGLT2 inhibitors",
      topic: "Monitoring",
      populationBand: "Adults 40–65",
      conditionTag: "Renal impairment",
    };
    setSelection({ ...defaults, ...(linkedArea ? { therapeuticArea: linkedArea } : {}), ...(linkedTopic ? { topic: linkedTopic } : {}) });
    setGuardrailReview(null);
    setInputDisposed(false);
    setStep(0);
    setSelectedPeerId(null);
    setQuestionConfirmed(false);
  }, [params, persona.id]);

  const graph = useMemo(() => readNetworkGraph().data, []);
  const candidates = useMemo(() => readConnectCandidates({ actorId: persona.id }).data, [persona.id]);

  const activeRequest = requests.find((request) => request.id === activeRequestId && request.requesterId === persona.id);
  const reviewPassed = guardrailReview?.status === "ready" && !guardrailReview.safetyStop;
  const reviewedSelection = reviewPassed ? guardrailReview.approvedSelection : selection;
  const matchingSelection = activeRequest?.selection ?? reviewedSelection;
  const need = useMemo(() => buildPeerNeed({
    expertiseTagIds: inferMatchingTagIds(matchingSelection),
    helpMode: "async_question",
  }), [matchingSelection.conditionTag, matchingSelection.therapeuticArea, matchingSelection.topic]);

  const matchResult = useMemo(() => matchPeers({
    need,
    candidates,
    expertiseEdges: graph.expertiseEdges,
    peerHelpProfiles: graph.peerHelpProfiles,
    trustEdges: graph.trustEdges,
    tags: graph.tags,
    limit: 6,
    policy: "ucb",
  }), [need, candidates, graph]);

  const matches = matchResult.matches;
  const questionReady = isCompleteQuestionSelection(selection);
  const question = reviewPassed ? assembleQuestion(reviewedSelection) : activeRequest?.question ?? "";
  const safetyStop = Boolean(guardrailReview?.safetyStop);
  const contactDecision = authorizeUse({
    purpose: "PEER_CONTACT",
    requesterContactConsent: activeRequest?.requesterContactApproved,
    recipientContactConsent: activeRequest?.recipientContactApproved,
  });
  const contactRevealed = contactDecision.decision === "allow";
  const recipientEmail = activeRequest ? auth.getAccountEmail(activeRequest.recipientId) : undefined;
  const responseText = isGuardedPeerAnswer(activeRequest?.answer)
    ? activeRequest.answer.responseText
    : activeRequest?.answer && isValidStructuredAnswer(activeRequest.answer)
      ? structuredAnswerDisplayText(activeRequest.answer)
      : "The physician response is unavailable in the current format.";

  useEffect(() => {
    if (!activeRequest) return;
    setSelectedPeerId(activeRequest.recipientId);
    setSelection(activeRequest.selection);
    if (activeRequest.status === "answered") {
      setStep(3);
      setShowAnswerNotification(true);
      if (!activeRequest.requesterReadAt) markRead(activeRequest.id, "requester");
      return;
    }
    setStep(2);
  }, [activeRequest?.id, activeRequest?.recipientId, activeRequest?.requesterReadAt, activeRequest?.status, markRead]);

  const runGuardrailReview = () => {
    if (!questionReady) return;
    const review = reviewQuestionSelection(selection);
    setGuardrailReview(review);
    if (review.safetyStop) {
      record({ product: "Connect", action: "SAFETY_STOP", purpose: "PEER_MATCHING", decision: "deny", summary: "A safety-event selection stopped the peer workflow." });
    }
  };

  const nextFromQuestion = () => {
    if (!reviewPassed) return;
    setStep(1);
    record({ product: "Connect", action: "QUESTION_PREVIEW", purpose: "PEER_MATCHING", decision: "allow", summary: "Privacy guardrails passed and the physician reviewed their structured free-text question." });
  };

  const findPeers = () => {
    if (!questionConfirmed) return;
    setStep(2);
    record({ product: "Connect", action: "PEER_MATCHING", purpose: "PEER_MATCHING", decision: "allow", summary: `Ranked ${matches.length} eligible peers with the contextual-bandit matcher (UCB) after consent, verification, and availability filters.` });
  };

  const sendRequest = (peerId: string) => {
    const recipient = matches.find((match) => match.profile.id === peerId)?.profile;
    if (!recipient) return;
    if (!reviewPassed) return;
    const request = createRequest({ requester: persona, recipient, selection: reviewedSelection });
    setSelectedPeerId(peerId);
    setActiveRequestId(request.id);
    window.localStorage.setItem(activeRequestStorageKey, request.id);
    setSelection(emptyQuestion());
    setGuardrailReview(null);
    setInputDisposed(true);
    record({ product: "Connect", action: "REQUEST_SENT", purpose: "PEER_MATCHING", decision: "allow", summary: "Sent one structured peer request without revealing contact information." });
  };

  const approveRequesterContact = () => {
    if (!activeRequest || activeRequest.requesterContactApproved) return;
    approveContact(activeRequest.id, "requester");
    record({
      product: "Connect",
      action: "CONTACT_CONSENT",
      purpose: "PEER_CONTACT",
      decision: activeRequest.recipientContactApproved ? "allow" : "deny",
      summary: activeRequest.recipientContactApproved ? "Both physicians approved email disclosure." : "Contact information remains hidden until both physicians approve.",
    });
  };

  const startAnotherQuestion = () => {
    window.localStorage.removeItem(activeRequestStorageKey);
    setActiveRequestId(null);
    setSelectedPeerId(null);
    setQuestionConfirmed(false);
    setShowAnswerNotification(false);
    setSelection(emptyQuestion());
    setGuardrailReview(null);
    setInputDisposed(false);
    setStep(0);
  };

  const updateField = (field: QuestionField, value: string) => {
    setSelection((current) => ({ ...current, [field]: value } as QuestionSelection));
    setGuardrailReview(null);
    setQuestionConfirmed(false);
  };

  // Every question this physician has sent, so each unread answer counted by the nav badge can be opened.
  const myRequests = useMemo(
    () => requests.filter((request) => request.requesterId === persona.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [requests, persona.id],
  );

  const openRequest = (id: string) => {
    window.localStorage.setItem(activeRequestStorageKey, id);
    setActiveRequestId(id);
    // Opening a sent question leaves any unfinished draft check behind.
    setGuardrailReview(null);
    setInputDisposed(false);
    setQuestionConfirmed(false);
  };

  return <div className="stack-lg">
    <PageHeading eyebrow="Doctor Connect" title="Ask another physician" description="Choose a topic. Relay will help you phrase the question and find an opted-in peer." />

    <div className="stepper">{steps.map((label, index) => <div className={index < step ? "step done" : index === step ? "step active" : "step"} key={label}><span>{index < step ? <Check size={14} /> : index + 1}</span><b>{label}</b></div>)}</div>

    {step === 0 ? <div className="connect-grid simplified">
      <section className="panel question-builder">
        <div className="panel-heading"><div><span>Step 1</span><h2>What would you like to discuss?</h2></div></div>
        <p className="guided-intro">Use your own wording in each field. Relay will not replace it while you type; privacy and safety checks run only when you ask to continue.</p>
        <details className="privacy-examples"><summary>See examples Relay will ask you to revise</summary><div><span>“Bob's renal impairment”</span><span>“Renal impairment for Bob”</span><span>“Patient J.D. has CKD”</span><span>“Call 404-555-0199”</span><span>“MRN 1234-ABCD”</span><span>“Seen January 3, 2024”</span></div><p>Remove the identifying detail and keep only general practice context. Entering an age such as 72 in the age field is allowed; after checking, Relay sends only the broader age range.</p></details>
        <div className="question-template" aria-label="Question template"><span>How do peers approach</span><strong>{reviewedSelection.topic.trim() || "[your topic]"}</strong><span>for</span><strong>{reviewedSelection.therapeuticArea.trim() || "[your medication or therapy]"}</strong><span>in</span><strong>{reviewedSelection.populationBand.trim() || "[your age description]"}</strong><span>patients with</span><strong>{reviewedSelection.conditionTag.trim() || "[your condition context]"}</strong><span>?</span></div>
        <div className="guided-blank-grid">{QUESTION_FIELDS.map((field) => <GuidedBlank key={field} field={field} value={selection[field]} review={guardrailReview?.fields[field]} onChange={(value) => updateField(field, value)} />)}</div>
        <div className="guardrail-process" aria-label="How Relay protects the question"><div className="process-heading"><ShieldCheck size={20} /><span><strong>How your question is checked</strong>The check starts only after you finish typing.</span></div><ol><li className={questionReady ? "complete" : "active"}><Eye size={17} /><span><strong>1. Draft stays visible</strong>Your exact entries remain in these fields and are not changed while you type.</span></li><li className={guardrailReview ? "complete" : questionReady ? "active" : ""}><ScanLine size={17} /><span><strong>2. Privacy scan</strong>Each field is checked for names, exact ages and dates, contact details, IDs, addresses, precise locations, and online identifiers.</span></li><li className={reviewPassed ? "complete" : guardrailReview ? "active" : ""}><ShieldCheck size={17} /><span><strong>3. Review-safe wording</strong>An exact age entered in the age field is converted to a broad age range. Any blocked detail must be revised before continuing.</span></li><li className={inputDisposed ? "complete" : ""}><Trash2 size={17} /><span><strong>4. Temporary draft is discarded</strong>After send, the pre-review buffer is cleared. Only the physician-approved question is retained for the recipient.</span></li></ol></div>
        <div className="builder-boundary"><ShieldCheck size={18} /><span><strong>Your wording remains yours</strong>If Relay detects a possible identifier, it shows the issue and a redacted preview, then asks you to revise. It does not silently replace or send the flagged text.</span></div>
        {safetyStop ? <div className="safety-stop"><CircleAlert size={22} /><div><strong>This selection may describe a safety event</strong><p>Relay cannot continue this peer workflow. Use the designated safety reporting route.</p></div></div> : null}
        <div className="panel-actions end"><span className="field-progress">{QUESTION_FIELDS.filter((field) => selection[field].trim()).length} of {QUESTION_FIELDS.length} fields completed</span>{reviewPassed ? <button className="button primary" onClick={nextFromQuestion}>Review my question <ArrowRight size={17} /></button> : <button className="button primary" onClick={runGuardrailReview} disabled={!questionReady}>Check privacy &amp; safety <ShieldCheck size={17} /></button>}</div>
      </section>
    </div> : null}

    {step === 1 ? <div className="preview-layout simplified"><section className="panel preview-card"><div className="preview-icon"><Network /></div><span>Physician-entered question · guardrails passed</span><blockquote>“{question}”</blockquote><div className="entered-values">{QUESTION_FIELDS.map((field) => <span key={field}><small>{FIELD_COPY[field].label}</small><strong>{reviewedSelection[field]}</strong>{guardrailReview?.fields[field].generalized ? <em>Entered: {selection[field]}</em> : null}</span>)}</div><p className="canonical-note">The values above are exactly what will be sent. When an exact age is entered, Relay shows the original and sends only the broader reviewed age range. The approved question is retained for the selected physician; temporary pre-review input is cleared after send.</p><label className="confirmation required"><input type="checkbox" checked={questionConfirmed} onChange={(event) => setQuestionConfirmed(event.target.checked)} required aria-required="true" /><span><strong>Required</strong>I reviewed this question, and it does not identify or describe a specific patient.</span></label><div className="prior-choice"><button className="button ghost-light" onClick={() => { setQuestionConfirmed(false); setStep(0); }}><ArrowLeft size={16} /> Edit my wording</button><button className="button primary" onClick={findPeers} disabled={!questionConfirmed}>Find a peer <ArrowRight size={17} /></button></div></section></div> : null}

    {step === 2 ? <div className="stack-md">
      {inputDisposed ? <div className="draft-disposed"><Trash2 size={18} /><span><strong>Temporary draft cleared</strong>The reviewed question remains available to the selected physician; pre-review input is no longer held in the form.</span></div> : null}
      <div className="filter-proof"><ShieldCheck size={18} /><span><strong>{matches.length} eligible peers</strong>Ranked on prescribing and condition evidence plus validated peer outcomes — not titles. Each physician is verified, available, and opted in.</span></div>
      <ol className="match-funnel" aria-label="How Relay narrowed the peers">{matchResult.funnel.map((funnelStep) => <li key={funnelStep.label}><span className="funnel-count">{funnelStep.count}</span><span className="funnel-label">{funnelStep.label}</span></li>)}</ol>
      <div className="match-grid">{matches.map((match, index) => <article className={selectedPeerId === match.profile.id ? "panel match-card selected" : "panel match-card"} key={match.profile.id}>
        <div className="match-rank">Match {index + 1}{match.trustConnections === 0 ? <span className="explore-chip" title="Surfaced by the bandit's exploration to grow the network">Exploring</span> : null}</div><div className="peer-avatar">{match.profile.displayName.split(" ").slice(1, 3).map((word) => word[0]).join("")}</div><h3>{match.profile.displayName}</h3><p>{match.profile.specialty} · {match.profile.state}</p><div className="match-score"><strong>{Math.round(match.score * 100)}%</strong><span>peer fit</span></div><ul>{match.reasons.slice(0, 2).map((reason) => <li key={reason}><Check size={14} />{reason}</li>)}</ul><button className="button primary wide" onClick={() => sendRequest(match.profile.id)}>{selectedPeerId === match.profile.id ? "Request sent" : "Ask this physician"}<ChevronRight size={16} /></button>
      </article>)}</div>
      {activeRequest ? <section className="panel sent-request-summary">
        <div className="request-party"><span>From</span><strong>{activeRequest.requesterName}</strong><small>{activeRequest.requesterSpecialty} · {activeRequest.requesterLocation}</small><b><BadgeCheck size={14} /> Verified physician</b></div>
        <ArrowRight className="request-direction" size={20} />
        <div className="request-party"><span>To</span><strong>{activeRequest.recipientName}</strong><small>{activeRequest.recipientSpecialty} · {activeRequest.recipientState}</small><b><BadgeCheck size={14} /> Verified physician</b></div>
        <div className="request-facts"><span>Medication area<strong>{activeRequest.selection.therapeuticArea}</strong></span><span>Topic<strong>{activeRequest.selection.topic}</strong></span><span>Population<strong>{activeRequest.selection.populationBand}</strong></span><span>Context<strong>{activeRequest.selection.conditionTag}</strong></span></div>
      </section> : null}
      {activeRequest && activeRequest.status !== "answered" ? <div className={`request-banner ${activeRequest.status}`}><Clock3 size={21} /><div><strong>{activeRequest.status === "pending" ? `Request delivered to ${activeRequest.recipientName}` : activeRequest.status === "accepted" ? `${activeRequest.recipientName} accepted your request` : `${activeRequest.recipientName} declined this request`}</strong><span>{activeRequest.status === "pending" ? `${activeRequest.recipientName} must sign in to their own Relay account to review it.` : activeRequest.status === "accepted" ? "You will be notified here when the privacy-reviewed answer is ready." : "You can ask another eligible physician."}</span></div></div> : null}
    </div> : null}

    {step === 3 && activeRequest?.answer ? <div className="response-layout">
      {showAnswerNotification ? <div className="answer-notification"><BellRing size={20} /><span><strong>{activeRequest.recipientName} answered your question</strong>The response is ready below.</span><button onClick={() => setShowAnswerNotification(false)} aria-label="Dismiss answer notification">×</button></div> : null}
      <section className="panel response-card"><div className="response-heading"><div className="peer-avatar small">{activeRequest.recipientName.split(" ").slice(1, 3).map((word) => word[0]).join("")}</div><div><span>Privacy-reviewed response from</span><h2>{activeRequest.recipientName}</h2><p>{activeRequest.recipientSpecialty}</p></div><StatusBadge tone="success">Answered</StatusBadge></div><div className="question-recap">{activeRequest.question}</div><div className="peer-answer-text"><span>Physician response</span><PeerAnswerBody text={responseText} /></div><div className="peer-experience-note"><Info size={16} />Peer experience, not medical advice from Impiricus or Relay.</div></section>
      <aside className="panel contact-panel"><LockKeyhole size={24} /><h2>Continue as colleagues</h2><p>Contact information is revealed only after both physicians independently approve the selected channel. Approval is final and cannot be withdrawn.</p><div className="consent-row"><span><UserRoundCheck size={18} />Your approval</span><button className={activeRequest.requesterContactApproved ? "consent-button approved" : "consent-button"} onClick={approveRequesterContact} disabled={activeRequest.requesterContactApproved}>{activeRequest.requesterContactApproved ? <><Check size={12} /> Approved</> : "Approve email"}</button></div><div className="consent-row"><span><BadgeCheck size={18} />Peer approval</span><span className={activeRequest.recipientContactApproved ? "consent-state approved" : "consent-state"}>{activeRequest.recipientContactApproved ? "Approved" : "Waiting"}</span></div><LockedValue revealed={contactRevealed} value={recipientEmail} /><div className="contact-disclosure">Communication occurs outside Relay and is not monitored here. Professional, privacy, and organizational obligations continue to apply.</div></aside>
      <div className="response-actions"><button className="button secondary" onClick={startAnotherQuestion}>Start another question</button></div>
    </div> : null}

    {myRequests.length > 0 ? <section className="panel my-questions" aria-label="Your questions">
      <div className="panel-heading"><div><span>Your questions</span><h2>{myRequests.length} sent</h2></div></div>
      <div className="inbox-items">{myRequests.map((request) => {
        const unread = request.status === "answered" && !request.requesterReadAt;
        return <button type="button" className={["inbox-item", request.id === activeRequest?.id && "active", unread && "unread"].filter(Boolean).join(" ")} onClick={() => openRequest(request.id)} key={request.id}>
          <span className="requester-avatar">{request.recipientName.split(" ").slice(1, 3).map((word) => word[0]).join("")}</span>
          <span><strong>{unread ? <><i className="unread-dot" aria-hidden="true" /><span className="sr-only">New answer: </span></> : null}{request.recipientName}</strong><small>{request.selection.therapeuticArea} · {request.selection.topic}</small><time>{new Date(request.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time></span>
          <StatusBadge tone={request.status === "declined" ? "blocked" : request.status === "pending" ? "review" : "success"}>{request.status}</StatusBadge>
        </button>;
      })}</div>
    </section> : null}
  </div>;
}
