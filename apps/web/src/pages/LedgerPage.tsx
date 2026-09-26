import { useMemo, useState } from "react";
import { ArrowRight, Check, CircleAlert, FileClock, GitCompareArrows, RefreshCw, UserRoundCheck } from "lucide-react";
import type { AllowedField } from "@relay/domain";
import { computeSchemaDiff, evaluateProposal } from "@relay/ledger";
import { readClientScope } from "@relay/relay-core";
import { useDemo } from "../demo-context";
import { PageHeading, ProvenanceBadge, StatusBadge } from "../components/ui";
import { HcpUpdatesPage } from "./HcpUpdatesPage";

export function LedgerPage() {
  const { persona } = useDemo();

  return persona.role === "compliance" ? <ComplianceLedgerPage /> : <HcpUpdatesPage />;
}

function ComplianceLedgerPage() {
  const { record } = useDemo();
  const [granularity, setGranularity] = useState<AllowedField["granularity"]>("individual");
  const [submitted, setSubmitted] = useState(false);
  const [approved, setApproved] = useState(false);
  const [policyReview, setPolicyReview] = useState(false);
  const currentClientFields = useMemo(() => readClientScope().data, []);
  const proposedField: AllowedField = {
    fieldId: "engagement.last_resource_request_at",
    label: "Last resource request timestamp",
    classification: "derived",
    granularity,
    purpose: "campaign_measurement",
    retentionDays: 365,
    minimumGroupSize: granularity === "aggregate" ? 11 : undefined,
  };
  const proposed = [...currentClientFields, proposedField];
  const diff = computeSchemaDiff(currentClientFields, proposed);
  const decision = useMemo(() => evaluateProposal(proposedField), [granularity]);

  const submit = () => {
    setSubmitted(true);
    record({ product: "Ledger", action: "PROPOSAL_SUBMITTED", purpose: "CLIENT_DISCLOSURE", decision: decision.decision, summary: `Submitted ${proposedField.label} at ${granularity} granularity; ${decision.ruleHits.length} rules evaluated.` });
  };

  const approve = () => {
    setApproved(true);
    record({ product: "Ledger", action: "PROPOSAL_APPROVED", purpose: "CLIENT_DISCLOSURE", decision: "allow", summary: "Authorized reviewer approved the revised aggregate proposal as version 4." });
  };

  const simulatePolicy = () => {
    setPolicyReview(true);
    record({ product: "Ledger", action: "POLICY_REEVALUATION", purpose: "CLIENT_DISCLOSURE", decision: "review", summary: "A fictional policy update opened a review task without changing current client access." });
  };

  return <div className="stack-lg">
    <PageHeading eyebrow="Ledger · Internal" title="Client data-scope review" description="Compare normalized fields, apply deterministic internal rules, and preserve the authorized human decision." action={<div className="client-picker"><span>Client</span><strong>Northstar Therapeutics</strong></div>} />
    <div className="ledger-summary"><div><span>Current version</span><strong>v3 · Effective</strong></div><div><span>Allowed fields</span><strong>{currentClientFields.length}</strong></div><div><span>Open proposals</span><strong>{submitted && !approved ? 1 : 0}</strong></div><div><span>Policy</span><strong>relay-demo-2026.09</strong></div></div>

    <div className="ledger-layout">
      <section className="panel proposal-editor"><div className="panel-heading"><div><span>Proposed addition</span><h2>{proposedField.label}</h2></div><ProvenanceBadge>Impiricus interaction</ProvenanceBadge></div><div className="field-path">engagement.last_resource_request_at</div><div className="form-grid single"><label><span>Granularity</span><select value={granularity} onChange={(e) => { setGranularity(e.target.value as AllowedField["granularity"]); setSubmitted(false); setApproved(false); }}><option value="individual">Individual HCP</option><option value="aggregate">Aggregate cohort</option></select></label><label><span>Purpose</span><select defaultValue="campaign_measurement"><option>campaign_measurement</option></select></label><label><span>Retention</span><select defaultValue="365"><option value="365">365 days</option></select></label>{granularity === "aggregate" && <label><span>Minimum group size</span><input value="11" readOnly /></label>}</div><label className="justification"><span>Requester justification</span><textarea readOnly value="Measure the delay between a resource request and approved follow-up at the configured reporting level." /></label><button className="button primary wide" onClick={submit}>Run checks and submit <ArrowRight size={17} /></button></section>

      <section className="panel diff-panel"><div className="panel-heading"><div><span>Semantic diff</span><h2>Version 3 → proposal</h2></div><StatusBadge tone={decision.decision === "deny" ? "blocked" : "review"}>{decision.decision === "deny" ? "Blocked" : "Review required"}</StatusBadge></div>{diff.map((change) => <div className="diff-card" key={change.fieldId}><div className="diff-operation">+ ADD FIELD</div><strong>{change.label}</strong><div className="diff-grid"><div><span>Current</span><b>Not included</b></div><div><span>Proposed</span><b>{change.after?.granularity} · {change.after?.retentionDays} days</b></div></div></div>)}<div className="rule-list">{decision.ruleHits.map((hit) => <div className={`rule-row ${hit.decision}`} key={hit.id}>{hit.decision === "deny" ? <CircleAlert size={18} /> : <FileClock size={18} />}<div><span>{hit.id}</span><strong>{hit.title}</strong><p>{hit.reason}</p></div></div>)}</div>{decision.decision === "deny" && <div className="repair-hint"><GitCompareArrows size={18} /><span>Change the proposal to <strong>aggregate</strong> with a group-size threshold to clear the consent-purpose block.</span></div>}</section>
    </div>

    {submitted && <section className="panel reviewer-panel"><div><div className="eyebrow">Reviewer decision</div><h2>{decision.decision === "deny" ? "Proposal cannot advance" : approved ? "Version 4 approved and scheduled" : "Manual disposition required"}</h2><p>{decision.decision === "deny" ? "Resolve the blocking rule before an authorized reviewer can approve." : approved ? "Current access remains on version 3 until the scheduled effective time." : "The requester cannot approve their own proposal. Ava Morgan is the seeded authorized reviewer."}</p></div>{decision.decision !== "deny" && !approved && <button className="button primary" onClick={approve}><UserRoundCheck size={17} /> Approve revised proposal</button>}{approved && !policyReview && <button className="button secondary" onClick={simulatePolicy}><RefreshCw size={17} /> Simulate policy update</button>}{policyReview && <StatusBadge tone="review">Review task opened</StatusBadge>}</section>}
  </div>;
}
