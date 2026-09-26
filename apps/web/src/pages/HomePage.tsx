import { Activity, ArrowRight, BellRing, Network, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useDemo } from "../demo-context";

const doctorActions = [
  {
    icon: Activity,
    label: "Review my prescribing snapshot",
    body: "See a simple, private comparison with similar specialists.",
    to: "/mirror",
    accent: "cyan",
  },
  {
    icon: Network,
    label: "Ask another physician",
    body: "Choose a topic and connect with an eligible, opted-in peer.",
    to: "/connect",
    accent: "magenta",
  },
  {
    icon: BellRing,
    label: "Review medicine changes",
    body: "See what changed in a drug product and find specialists to discuss it with.",
    to: "/ledger",
    accent: "cyan",
  },
];

export function HomePage() {
  const { persona } = useDemo();
  return (
    <div className="simple-home">
      <section className="welcome-panel">
        <div className="welcome-copy">
          <div className="eyebrow light">Relay for Impiricus</div>
          <h1>Welcome, {persona.name}.</h1>
          <p>What would you like to explore today?</p>
        </div>
        <div className="welcome-signal" aria-hidden="true"><span /><span /><span /></div>
      </section>

      <section className="home-actions" aria-label="Physician workflows">
        {doctorActions.map(({ icon: Icon, ...action }) => (
          <Link className={`simple-action-card ${action.accent}`} to={action.to} key={action.to}>
            <span className="simple-action-icon"><Icon size={27} /></span>
            <span className="simple-action-copy"><small>About 2 minutes</small><strong>{action.label}</strong><p>{action.body}</p></span>
            <ArrowRight size={22} />
          </Link>
        ))}
      </section>

      <div className="home-trust-note"><ShieldCheck size={17} /><span><strong>Your privacy comes first.</strong> Relay uses synthetic demo data and never asks for patient details.</span></div>
    </div>
  );
}
