import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck, Check, ChevronRight, CircleAlert, Clock3, Info, LockKeyhole, Network, ShieldCheck, UserRoundCheck } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import type { QuestionSelection } from "@relay/domain";
import { assembleQuestion, rankEligiblePeers } from "@relay/doctor-connect";
import { authorizeUse, readConnectCandidates } from "@relay/relay-core";
import { useDemo } from "../demo-context";
import { LockedValue, PageHeading, StatusBadge } from "../components/ui";

const steps = ["Your question", "Review", "Choose a peer", "Answer"];

export function ConnectPage() {
  const [params] = useSearchParams();
  const { record } = useDemo();
  const [step, setStep] = useState(0);
  const [selection, setSelection] = useState<QuestionSelection>({
    therapeuticArea: params.get("area") ?? "SGLT2 inhibitors",
    topic: params.get("topic") ?? "Monitoring",
    populationBand: "Adults 40–64",
    conditionTag: "Renal impairment",
  });
  const [topPeerRevoked, setTopPeerRevoked] = useState(false);
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);
  const [requestState, setRequestState] = useState<"idle" | "sent" | "accepted" | "answered">("idle");
  const [requesterConsent, setRequesterConsent] = useState(false);
  const [peerConsent, setPeerConsent] = useState(false);
  const [questionConfirmed, setQuestionConfirmed] = useState(false);

  const brokerCandidates = useMemo(() => readConnectCandidates().data, []);
  const candidates = useMemo(() => brokerCandidates.map((profile, index) => index === 0 && topPeerRevoked ? { ...profile, matchingConsent: false } : profile), [brokerCandidates, topPeerRevoked]);
  const matches = useMemo(() => rankEligiblePeers(selection, candidates), [selection, candidates]);
  const selectedPeer = matches.find((match) => match.profile.id === selectedPeerId) ?? matches[0];
  const question = assembleQuestion(selection);
  const safetyStop = selection.conditionTag === "Suspected safety event";
  const contactDecision = authorizeUse({ purpose: "PEER_CONTACT", requesterContactConsent: requesterConsent, recipientContactConsent: peerConsent });
  const contactRevealed = contactDecision.decision === "allow";

  const nextFromQuestion = () => {
    if (safetyStop) {
      record({ product: "Connect", action: "SAFETY_STOP", purpose: "PEER_MATCHING", decision: "deny", summary: "A fictional safety-event selection stopped the peer workflow." });
      return;
    }
    setStep(1);
    record({ product: "Connect", action: "QUESTION_PREVIEW", purpose: "PEER_MATCHING", decision: "allow", summary: `Created a governed question for ${selection.therapeuticArea}.` });
  };

  const findPeers = () => {
    if (!questionConfirmed) return;
    setStep(2);
    record({ product: "Connect", action: "PEER_MATCHING", purpose: "PEER_MATCHING", decision: "allow", summary: `Returned ${matches.length} eligible peers after consent, verification, and availability filters.` });
  };

  const sendRequest = (peerId: string) => {
    setSelectedPeerId(peerId); setRequestState("sent");
    record({ product: "Connect", action: "REQUEST_SENT", purpose: "PEER_MATCHING", decision: "allow", summary: "Sent one structured peer request without revealing contact information." });
  };

  const acceptAndAnswer = () => {
    setRequestState("answered"); setStep(3);
    record({ product: "Connect", action: "STRUCTURED_ANSWER", purpose: "PEER_MATCHING", decision: "allow", summary: "Peer accepted and submitted a structured experience response." });
  };

  return (
    <div className="stack-lg">
      <PageHeading eyebrow="Doctor Connect" title="Ask another physician" description="Choose a topic. Relay will help you phrase the question and find an opted-in peer." />

      <div className="stepper">{steps.map((label, index) => <div className={index < step ? "step done" : index === step ? "step active" : "step"} key={label}><span>{index < step ? <Check size={14} /> : index + 1}</span><b>{label}</b></div>)}</div>

      {step === 0 && <div className="connect-grid simplified">
        <section className="panel question-builder">
          <div className="panel-heading"><div><span>Step 1</span><h2>What would you like to discuss?</h2></div></div>
          <div className="form-grid">
            <label><span>Medication area</span><select value={selection.therapeuticArea} onChange={(e) => setSelection({ ...selection, therapeuticArea: e.target.value })}><option>SGLT2 inhibitors</option><option>GLP-1 therapies</option><option>Diabetes management</option></select></label>
            <label><span>I want to ask about</span><select value={selection.topic} onChange={(e) => setSelection({ ...selection, topic: e.target.value })}><option>Monitoring</option><option>Initiation</option><option>Switching</option><option>Tolerability</option></select></label>
          </div>
          <details className="optional-details">
            <summary>Add general patient-group context <span>Optional</span></summary>
            <div className="form-grid">
              <label><span>Age group</span><select value={selection.populationBand} onChange={(e) => setSelection({ ...selection, populationBand: e.target.value })}><option>Adults 18–40</option><option>Adults 40–64</option><option>Adults 65–89</option><option>Older adults 90+</option></select></label>
              <label><span>Condition</span><select value={selection.conditionTag} onChange={(e) => setSelection({ ...selection, conditionTag: e.target.value })}><option>Renal impairment</option><option>Cardiovascular disease</option><option>Diabetes</option><option>Hepatic impairment</option><option>Suspected safety event</option></select></label>
            </div>
          </details>
          <div className="builder-boundary"><ShieldCheck size={18} /><span><strong>Keep it general</strong>Relay does not accept patient names, narratives, or attachments.</span></div>
          {safetyStop && <div className="safety-stop"><CircleAlert size={22} /><div><strong>This selection may describe a safety event</strong><p>Relay cannot continue this peer workflow. Use the fictional designated safety reporting route.</p></div></div>}
          <div className="panel-actions end"><button className="button primary" onClick={nextFromQuestion} disabled={safetyStop}>Review my question <ArrowRight size={17} /></button></div>
        </section>
      </div>}

      {step === 1 && <div className="preview-layout simplified">
        <section className="panel preview-card"><div className="preview-icon"><Network /></div><span>Your question</span><blockquote>“{question}”</blockquote><label className="confirmation required"><input type="checkbox" checked={questionConfirmed} onChange={(event) => setQuestionConfirmed(event.target.checked)} required aria-required="true" /><span><strong>Required</strong>This is a general practice question and does not describe a specific patient.</span></label><div className="prior-choice"><button className="button ghost-light" onClick={() => setStep(0)}><ArrowLeft size={16} /> Edit</button><button className="button primary" onClick={findPeers} disabled={!questionConfirmed} aria-disabled={!questionConfirmed}>Find a peer <ArrowRight size={17} /></button></div></section>
      </div>}

      {step === 2 && <div className="stack-md">
        <div className="filter-proof"><ShieldCheck size={18} /><span><strong>{matches.length} eligible peers</strong>Each physician is verified, available, and opted in.</span><label className="demo-toggle"><input type="checkbox" checked={topPeerRevoked} onChange={(e) => { setTopPeerRevoked(e.target.checked); setSelectedPeerId(null); record({ product: "Connect", action: "CONSENT_CHANGED", purpose: "PEER_MATCHING", decision: "allow", summary: e.target.checked ? "Revoked a top candidate's matching consent; results recomputed immediately." : "Restored the synthetic candidate's matching consent." }); }} /> Demo consent change</label></div>
        <div className="match-grid">
          {matches.map((match, index) => <article className={selectedPeerId === match.profile.id ? "panel match-card selected" : "panel match-card"} key={match.profile.id}>
            <div className="match-rank">Match {index + 1}</div><div className="peer-avatar">{match.profile.displayName.split(" ").slice(1, 3).map((word) => word[0]).join("")}</div><h3>{match.profile.displayName}</h3><p>{match.profile.specialty} · {match.profile.state}</p><div className="match-score"><strong>{Math.round(match.score * 100)}%</strong><span>topic match</span></div><ul>{match.reasons.slice(0, 2).map((reason) => <li key={reason}><Check size={14} />{reason}</li>)}</ul><button className="button primary wide" onClick={() => sendRequest(match.profile.id)}>{selectedPeerId === match.profile.id ? "Request sent" : "Ask this physician"}<ChevronRight size={16} /></button>
          </article>)}
        </div>
        {requestState === "sent" && <div className="request-banner"><Clock3 size={21} /><div><strong>Request delivered without contact details</strong><span>For the demo, simulate the peer accepting and responding.</span></div><button className="button primary" onClick={acceptAndAnswer}>Simulate acceptance</button></div>}
      </div>}

      {step === 3 && selectedPeer && <div className="response-layout">
        <section className="panel response-card"><div className="response-heading"><div className="peer-avatar small">{selectedPeer.profile.displayName.split(" ").slice(1, 3).map((word) => word[0]).join("")}</div><div><span>Structured response from</span><h2>{selectedPeer.profile.displayName}</h2><p>{selectedPeer.profile.specialty}</p></div><StatusBadge tone="success">Answered</StatusBadge></div><div className="question-recap">{question}</div><div className="structured-answer"><div><span>Approach considered</span><strong>Review baseline renal function and current monitoring cadence</strong></div><div><span>Monitoring considerations</span><strong>Renal trend · tolerance · volume status</strong></div><div><span>Escalation considerations</span><strong>Unexpected decline · persistent symptoms · care-team review</strong></div></div><div className="peer-experience-note"><Info size={16} />Peer experience, not medical advice from Impiricus or Relay.</div></section>
        <aside className="panel contact-panel"><LockKeyhole size={24} /><h2>Continue as colleagues</h2><p>Contact information is revealed only after both physicians independently approve the selected channel.</p><div className="consent-row"><span><UserRoundCheck size={18} />Your approval</span><button className={requesterConsent ? "consent-button approved" : "consent-button"} onClick={() => setRequesterConsent(!requesterConsent)}>{requesterConsent ? "Approved" : "Approve email"}</button></div><div className="consent-row"><span><BadgeCheck size={18} />Peer approval</span><button className={peerConsent ? "consent-button approved" : "consent-button"} onClick={() => { const approved = !peerConsent; setPeerConsent(approved); record({ product: "Connect", action: "CONTACT_CONSENT", purpose: "PEER_CONTACT", decision: approved && requesterConsent ? "allow" : "deny", summary: approved && requesterConsent ? "Both physicians approved email disclosure." : "Contact information remains hidden until both physicians approve." }); }}>{peerConsent ? "Approved" : "Simulate approval"}</button></div><LockedValue revealed={contactRevealed} value="elena.ruiz@relay-demo.example" /><div className="contact-disclosure">Communication occurs outside Relay and is not monitored here. Professional, privacy, and organizational obligations continue to apply.</div></aside>
      </div>}
    </div>
  );
}
