import { Activity, BellRing, Home, Network, RotateCcw } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { POLICY_VERSION } from "@relay/relay-core";
import { useDemo } from "../demo-context";

const physicianNavigation = [
  { to: "/", label: "Overview", icon: Home },
  { to: "/mirror", label: "Practice Mirror", icon: Activity },
  { to: "/connect", label: "Doctor Connect", icon: Network },
  { to: "/ledger", label: "Updates", icon: BellRing },
];

export function AppShell() {
  const { persona, personas, setPersonaId, resetDemo } = useDemo();
  const navigation = physicianNavigation;

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="topbar">
          <NavLink className="brand" to="/" aria-label="Relay overview">
            <span className="brand-mark" aria-hidden="true"><span /></span>
            <span><strong>Relay</strong><small>for Impiricus</small></span>
          </NavLink>

          <nav className="nav-list" aria-label="Main navigation">
            {navigation.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <Icon size={19} strokeWidth={1.8} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="header-actions">
            <button className="quiet-button" onClick={resetDemo} title="Reset the deterministic demo">
              <RotateCcw size={15} /> Reset
            </button>
            <label className="persona-control">
              <span className="avatar">{persona.initials}</span>
              <span className="persona-copy"><strong>{persona.name}</strong><small>{persona.subtitle}</small></span>
              <select value={persona.id} onChange={(event) => setPersonaId(event.target.value)} aria-label="Switch demo persona">
                {personas.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.role}</option>)}
              </select>
            </label>
          </div>
          <span className="policy-version" aria-label={`Active policy ${POLICY_VERSION}`}>{POLICY_VERSION}</span>
        </div>
      </header>
      <main className="main-content"><Outlet /></main>
    </div>
  );
}
