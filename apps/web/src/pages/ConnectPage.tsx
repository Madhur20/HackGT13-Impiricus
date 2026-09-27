import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck, BellRing, Check, ChevronRight, CircleAlert, Clock3, Info, LockKeyhole, Network, ShieldCheck, UserRoundCheck } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import type { QuestionSelection } from "@relay/domain";
import { assembleQuestion } from "@relay/doctor-connect";
import { buildPeerNeed, matchPeers } from "@relay/network-graph";
import { authorizeUse, readConnectCandidates, readNetworkGraph } from "@relay/relay-core";
import { useConsults } from "../consult-context";
import { useDemo } from "../demo-context";
import { useAccountAuth } from "../auth-context";
import { LockedValue, PageHeading, StatusBadge } from "../components/ui";

const steps = ["Your question", "Review", "Choose a peer", "Answer"];

const AREA_TAG_ID: Record<string, string> = {
  "SGLT2 inhibitors": "sglt2",
  "GLP-1 therapies": "glp1",
  "Diabetes management": "diabetes",
};

const CONDITION_TAG_ID: Record<string, string> = {
  "Renal impairment": "renal_impairment",
  "Cardiovascular disease": "cardiovascular_disease",
  Diabetes: "diabetes",
  "Hepatic impairment": "hepatic_impairment",
};

export function ConnectPage() {
  const [params] = useSearchParams();
  const { persona, record } = useDemo();
  const auth = useAccountAuth();
  const { requests, createRequest, setContactApproval, markRead } = useConsults();
  const [step, setStep] = useState(0);
  const [selection, setSelection] = useState<QuestionSelection>({
    therapeuticArea: params.get("area") ?? "SGLT2 inhibitors",
    topic: params.get("topic") ?? "Monitoring",
    populationBand: "Adults 40–64",
    conditionTag: "Renal impairment",
  });
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);
  const activeRequestStorageKey = `relay.active-consult.${persona.id}`;
  const [activeRequestId, setActiveRequestId] = useState<string | null>(() => window.localStorage.getItem(activeRequestStorageKey));
  const [questionConfirmed, setQuestionConfirmed] = useState(false);
  const [showAnswerNotification, setShowAnswerNotification] = useState(false);

  useEffect(() => {
    const savedRequestId = window.localStorage.getItem(`relay.active-consult.${persona.id}`);
    setActiveRequestId(savedRequestId);
    if (params.get("area") || params.get("topic")) return;
    setSelection(persona.id === "hcp-jordan" ? {
      therapeuticArea: "GLP-1 therapies",
      topic: "Tolerability",
      populationBand: "Adults 65–89",
      conditionTag: "Cardiovascular disease",
    } : {
      therapeuticArea: "SGLT2 inhibitors",
      topic: "Monitoring",
      populationBand: "Adults 40–64",
      conditionTag: "Renal impairment",
    });
    setStep(0);
    setSelectedPeerId(null);
    setQuestionConfirmed(false);
  }, [params, persona.id]);

  const graph = useMemo(() => readNetworkGraph().data, []);
  const candidates = useMemo(() => readConnectCandidates({ actorId: persona.id }).data, [persona.id]);

  const need = useMemo(() => buildPeerNeed({
    expertiseTagIds: [AREA_TAG_ID[selection.therapeuticArea], CONDITION_TAG_ID[selection.conditionTag]].filter((tagId): tagId is string => Boolean(tagId)),
    helpMode: "async_question",
  }), [selection.therapeuticArea, selection.conditionTag]);

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
  const activeRequest = requests.find((request) => request.id === activeRequestId && request.requesterId === persona.id);
  const question = assembleQuestion(selection);
  const safetyStop = selection.conditionTag === "Suspected safety event";
  const contactDecision = authorizeUse({
    purpose: "PEER_CONTACT",
    requesterContactConsent: activeRequest?.requesterContactApproved,
    recipientContactConsent: activeRequest?.recipientContactApproved,
  });
  const contactRevealed = contactDecision.decision === "allow";
  const recipientEmail = activeRequest ? auth.getAccountEmail(activeRequest.recipientId) : undefined;

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

  const nextFromQuestion = () => {
    if (safetyStop) {
      record({ product: "Connect", action: "SAFETY_STOP", purpose: "PEER_MATCHING", decision: "deny", summary: "A safety-event selection stopped the peer workflow." });
      return;
    }
    setStep(1);
    record({ product: "Connect", action: "QUESTION_PREVIEW", purpose: "PEER_MATCHING", decision: "allow", summary: `Created a governed question for ${selection.therapeuticArea}.` });
  };

  const findPeers = () => {
    if (!questionConfirmed) return;
    setStep(2);
    record({ product: "Connect", action: "PEER_MATCHING", purpose: "PEER_MATCHING", decision: "allow", summary: `Ranked ${matches.length} eligible peers with the contextual-bandit matcher (UCB) after consent, verification, and availability filters.` });
  };

  const sendRequest = (peerId: string) => {
    const recipient = matches.find((match) => match.profile.id === peerId)?.profile;
    if (!recipient) return;
    const request = createRequest({ requester: persona, recipient, question, selection });
    setSelectedPeerId(peerId);
    setActiveRequestId(request.id);
    window.localStorage.setItem(activeRequestStorageKey, request.id);
    record({ product: "Connect", action: "REQUEST_SENT", purpose: "PEER_MATCHING", decision: "allow", summary: "Sent one structured peer request without revealing contact information." });
  };

  const toggleRequesterContact = () => {
    if (!activeRequest) return;
    const approved = !activeRequest.requesterContactApproved;
    setContactApproval(activeRequest.id, "requester", approved);
    record({
      product: "Connect",
      action: "CONTACT_CONSENT",
      purpose: "PEER_CONTACT",
      decision: approved && activeRequest.recipientContactApproved ? "allow" : "deny",
      summary: approved && activeRequest.recipientContactApproved ? "Both physicians approved email disclosure." : "Contact information remains hidden until both physicians approve.",
    });
  };

  const startAnotherQuestion = () => {
    window.localStorage.removeItem(activeRequestStorageKey);
    setActiveRequestId(null);
    setSelectedPeerId(null);
    setQuestionConfirmed(false);
    setShowAnswerNotification(false);
    setStep(0);
  };

  // Every question this physician has sent, so each unread answer counted by the nav badge can be opened.
  const myRequests = useMemo(
    () => requests.filter((request) => request.requesterId === persona.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [requests, persona.id],
  );

  const openRequest = (id: string) => {
    window.localStorage.setItem(activeRequestStorageKey, id);
    setActiveRequestId(id);
  };

  return <div className="stack-lg">
    <PageHeading eyebrow="Doctor Connect" title="Ask another physician" description="Choose a topic. Relay will help you phrase the question and find an opted-in peer." />

    <div className="stepper">{steps.map((label, index) => <div className={index < step ? "step done" : index === step ? "step active" : "step"} key={label}><span>{index < step ? <Check size={14} /> : index + 1}</span><b>{label}</b></div>)}</div>

    {step === 0 ? <div className="connect-grid simplified">
      <section className="panel question-builder">
        <div className="panel-heading"><div><span>Step 1</span><h2>What would you like to discuss?</h2></div></div>
        <div className="form-grid">
          <label><span>Medication area</span><select value={selection.therapeuticArea} onChange={(event) => setSelection({ ...selection, therapeuticArea: event.target.value })}><option>SGLT2 inhibitors</option><option>GLP-1 therapies</option><option>Diabetes management</option></select></label>
          <label><span>I want to ask about</span><select value={selection.topic} onChange={(event) => setSelection({ ...selection, topic: event.target.value })}><option>Monitoring</option><option>Initiation</option><option>Switching</option><option>Tolerability</option></select></label>
        </div>
        <details className="optional-details"><summary>Add general patient-group context <span>Optional</span></summary><div className="form-grid"><label><span>Age group</span><select value={selection.populationBand} onChange={(event) => setSelection({ ...selection, populationBand: event.target.value })}><option>Adults 18–40</option><option>Adults 40–64</option><option>Adults 65–89</option><option>Older adults 90+</option></select></label><label><span>Condition</span><select value={selection.conditionTag} onChange={(event) => setSelection({ ...selection, conditionTag: event.target.value })}><option>Renal impairment</option><option>Cardiovascular disease</option><option>Diabetes</option><option>Hepatic impairment</option><option>Suspected safety event</option></select></label></div></details>
        <div className="builder-boundary"><ShieldCheck size={18} /><span><strong>Keep it general</strong>Relay does not accept patient names, narratives, or attachments.</span></div>
        {safetyStop ? <div className="safety-stop"><CircleAlert size={22} /><div><strong>This selection may describe a safety event</strong><p>Relay cannot continue this peer workflow. Use the designated safety reporting route.</p></div></div> : null}
        <div className="panel-actions end"><button className="button primary" onClick={nextFromQuestion} disabled={safetyStop}>Review my question <ArrowRight size={17} /></button></div>
      </section>
    </div> : null}

    {step === 1 ? <div className="preview-layout simplified"><section className="panel preview-card"><div className="preview-icon"><Network /></div><span>Your question</span><blockquote>“{question}”</blockquote><label className="confirmation required"><input type="checkbox" checked={questionConfirmed} onChange={(event) => setQuestionConfirmed(event.target.checked)} required aria-required="true" /><span><strong>Required</strong>This is a general practice question and does not describe a specific patient.</span></label><div className="prior-choice"><button className="button ghost-light" onClick={() => setStep(0)}><ArrowLeft size={16} /> Edit</button><button className="button primary" onClick={findPeers} disabled={!questionConfirmed}>Find a peer <ArrowRight size={17} /></button></div></section></div> : null}

    {step === 2 ? <div className="stack-md">
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
      {activeRequest && activeRequest.status !== "answered" ? <div className={`request-banner ${activeRequest.status}`}><Clock3 size={21} /><div><strong>{activeRequest.status === "pending" ? `Request delivered to ${activeRequest.recipientName}` : activeRequest.status === "accepted" ? `${activeRequest.recipientName} accepted your request` : `${activeRequest.recipientName} declined this request`}</strong><span>{activeRequest.status === "pending" ? `${activeRequest.recipientName} must sign in to their own Relay account to review it.` : activeRequest.status === "accepted" ? "You will be notified here when the structured answer is ready." : "You can ask another eligible physician."}</span></div></div> : null}
    </div> : null}

    {step === 3 && activeRequest?.answer ? <div className="response-layout">
      {showAnswerNotification ? <div className="answer-notification"><BellRing size={20} /><span><strong>{activeRequest.recipientName} answered your question</strong>The response is ready below.</span><button onClick={() => setShowAnswerNotification(false)} aria-label="Dismiss answer notification">×</button></div> : null}
      <section className="panel response-card"><div className="response-heading"><div className="peer-avatar small">{activeRequest.recipientName.split(" ").slice(1, 3).map((word) => word[0]).join("")}</div><div><span>Structured response from</span><h2>{activeRequest.recipientName}</h2><p>{activeRequest.recipientSpecialty}</p></div><StatusBadge tone="success">Answered</StatusBadge></div><div className="question-recap">{activeRequest.question}</div><div className="structured-answer"><div><span>Approach considered</span><strong>{activeRequest.answer.approach}</strong></div><div><span>Monitoring considerations</span><strong>{activeRequest.answer.monitoring.join(" · ")}</strong></div><div><span>Escalation considerations</span><strong>{activeRequest.answer.escalation}</strong></div></div><div className="peer-experience-note"><Info size={16} />Peer experience, not medical advice from Impiricus or Relay.</div></section>
      <aside className="panel contact-panel"><LockKeyhole size={24} /><h2>Continue as colleagues</h2><p>Contact information is revealed only after both physicians independently approve the selected channel.</p><div className="consent-row"><span><UserRoundCheck size={18} />Your approval</span><button className={activeRequest.requesterContactApproved ? "consent-button approved" : "consent-button"} onClick={toggleRequesterContact}>{activeRequest.requesterContactApproved ? "Approved" : "Approve email"}</button></div><div className="consent-row"><span><BadgeCheck size={18} />Peer approval</span><span className={activeRequest.recipientContactApproved ? "consent-state approved" : "consent-state"}>{activeRequest.recipientContactApproved ? "Approved" : "Waiting"}</span></div><LockedValue revealed={contactRevealed} value={recipientEmail} /><div className="contact-disclosure">Communication occurs outside Relay and is not monitored here. Professional, privacy, and organizational obligations continue to apply.</div></aside>
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
