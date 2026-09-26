import { Activity, BellRing, Home, Network, RotateCcw, ShieldCheck } from "lucide-react";
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
      <aside className="sidebar">
        <NavLink className="brand" to="/" aria-label="Relay overview">
          <span className="brand-mark"><span /></span>
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

        <div className="sidebar-proof">
          <ShieldCheck size={20} />
          <div><strong>Policy active</strong><small>{POLICY_VERSION}</small></div>
        </div>
        <div className="sidebar-footer">Synthetic demo data<br />No patient-level data</div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <div className="mobile-brand">Relay</div>
          <div className="topbar-spacer" />
          <button className="quiet-button" onClick={resetDemo} title="Reset the deterministic demo">
            <RotateCcw size={16} /> Reset demo
          </button>
          <label className="persona-control">
            <span className="avatar">{persona.initials}</span>
            <span className="persona-copy"><strong>{persona.name}</strong><small>{persona.subtitle}</small></span>
            <select value={persona.id} onChange={(event) => setPersonaId(event.target.value)} aria-label="Switch demo persona">
              {personas.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.role}</option>)}
            </select>
          </label>
        </header>
        <main className="main-content"><Outlet /></main>
      </div>
    </div>
  );
}
