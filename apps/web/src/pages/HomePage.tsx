import { useState } from "react";
import { Activity, ArrowRight, BellRing, Network, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useDemo } from "../demo-context";

// Streamed from DocUpdate (an ImpiricusHealth service) rather than bundled, so the
// asset is not republished from this repo. The static panel background remains the
// fallback when the stream is unavailable or the viewer prefers reduced motion.
const WELCOME_VIDEO_URL = "https://www.docupdate.io/assets/wp/2025/07/doctor_home_.mp4";
const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
  const [videoEnabled, setVideoEnabled] = useState(() => !prefersReducedMotion());
  return (
    <div className="simple-home">
      <section className={videoEnabled ? "welcome-panel has-video" : "welcome-panel"}>
        {videoEnabled && <>
          <video className="welcome-video" src={WELCOME_VIDEO_URL} autoPlay muted loop playsInline aria-hidden="true" tabIndex={-1} onError={() => setVideoEnabled(false)} />
          <div className="welcome-video-shade" aria-hidden="true" />
        </>}
        <div className="welcome-copy">
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

      <div className="home-trust-note"><ShieldCheck size={17} /><span><strong>Your privacy comes first.</strong> Relay does not request patient details for these workflows.</span></div>
    </div>
  );
}
