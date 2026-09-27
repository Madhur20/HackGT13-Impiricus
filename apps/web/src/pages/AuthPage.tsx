import { useState, type FormEvent } from "react";
import { ArrowRight, BadgeCheck, LockKeyhole, ShieldCheck } from "lucide-react";
import { useAccountAuth } from "../auth-context";
import relayMark from "../assets/relay-mark.png";

type AuthMode = "signin" | "signup";

const physicianAccess = [
  { label: "Dr. Elena Ruiz", email: "elena.ruiz@relay.health" },
  { label: "Dr. Maya Chen", email: "maya.chen@relay.health" },
];

export function AuthPage() {
  const auth = useAccountAuth();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [npi, setNpi] = useState("");
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const changeMode = (next: AuthMode) => {
    setMode(next);
    setError("");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const result = mode === "signin"
      ? await auth.signIn(email, password)
      : await auth.signUp({ npi, mobile, email, password });
    setSubmitting(false);
    if (!result.ok) setError(result.error);
  };

  const usePhysicianAccount = (accountEmail: string) => {
    setEmail(accountEmail);
    setPassword("Relay2026!");
    setError("");
  };

  return <div className="auth-page">
    <header className="auth-header">
      <div className="auth-brand"><span className="brand-stack"><img className="brand-logo" src={relayMark} alt="" width={42} height={42} /><small>Impiricus</small></span><strong>Relay</strong></div>
      <button className="button secondary auth-mode-button" onClick={() => changeMode(mode === "signin" ? "signup" : "signin")}>{mode === "signin" ? "Sign Up" : "Sign In"}</button>
    </header>

    <main className="auth-main">
      <section className="auth-story">
        <div className="eyebrow">A physician network built around trust</div>
        <h1>{mode === "signin" ? "Continue your professional conversations." : "Join a more connected physician community."}</h1>
        <p>{mode === "signin" ? "Review relevant medicine updates, understand your practice snapshot, and respond to colleagues through one governed workspace." : "Connect with opted-in peers, explore professional updates, and keep every discussion grounded in general practice—not patient details."}</p>
        <div className="auth-trust-list"><span><ShieldCheck size={20} /><b>Account-specific requests and responses</b></span><span><BadgeCheck size={20} /><b>Verified professional profiles</b></span><span><LockKeyhole size={20} /><b>Contact sharing only with mutual approval</b></span></div>
      </section>

      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-card-heading"><span>{mode === "signin" ? "Welcome back" : "Create your account"}</span><h2 id="auth-title">{mode === "signin" ? "Sign In" : "Sign Up"}</h2></div>
        <form onSubmit={submit} className="auth-form">
          {mode === "signup" && <>
            <label><span>NPI <b>*</b></span><input inputMode="numeric" autoComplete="off" value={npi} onChange={(event) => setNpi(event.target.value)} placeholder="1234567890" required pattern="[0-9]{10}" /></label>
            <label><span>Mobile Phone Number <b>*</b></span><input type="tel" autoComplete="tel" value={mobile} onChange={(event) => setMobile(event.target.value)} placeholder="(555) 555-5555" required /></label>
          </>}
          <label><span>Professional Email <b>*</b></span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@practice.com" required /></label>
          <label><span>Password <b>*</b></span><input type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "signin" ? "Enter your password" : "At least 8 characters"} required minLength={8} /></label>
          {error && <div className="auth-error" role="alert">{error}</div>}
          <button className="button primary auth-submit" type="submit" disabled={submitting}>{submitting ? "Please wait…" : mode === "signin" ? "Sign In to Relay" : "Join the Relay Community"}<ArrowRight size={18} /></button>
        </form>

        {mode === "signin" ? <div className="physician-access"><span>Physician access</span><p>Select an account to fill its credentials.</p><div>{physicianAccess.map((account) => <button key={account.email} onClick={() => usePhysicianAccount(account.email)}>{account.label}</button>)}</div></div> : <p className="auth-footnote">NPI matching connects your account to an existing eligible Relay profile; credential review remains a separate process.</p>}
        <button className="auth-switch" onClick={() => changeMode(mode === "signin" ? "signup" : "signin")}>{mode === "signin" ? "New to Relay? Create an account" : "Already have an account? Sign in"}</button>
      </section>
    </main>
  </div>;
}
