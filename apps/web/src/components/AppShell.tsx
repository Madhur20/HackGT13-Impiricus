import { Activity, BellRing, Home, Inbox, LogOut, Network } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { POLICY_VERSION } from "@relay/relay-core";
import { useDemo } from "../demo-context";
import { useAccountAuth } from "../auth-context";
import { useConsults } from "../consult-context";
import { getConsultBadgeCounts } from "../consult-state";

const physicianNavigation = [
  { to: "/", label: "Overview", icon: Home },
  { to: "/mirror", label: "Practice Mirror", icon: Activity },
  { to: "/connect", label: "Doctor Connect", icon: Network },
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/ledger", label: "Updates", icon: BellRing },
];

export function AppShell() {
  const { persona } = useDemo();
  const auth = useAccountAuth();
  const { requests } = useConsults();
  const navigation = physicianNavigation;
  const { inbox: inboxCount, connect: answerCount } = getConsultBadgeCounts(requests, persona.id);

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="topbar">
          <NavLink className="brand" to="/" aria-label="Relay overview">
            <span className="brand-mark" aria-hidden="true"><span /></span>
            <span><strong>Relay</strong><small>for Impiricus</small></span>
          </NavLink>

          <nav className="nav-list" aria-label="Main navigation">
            {navigation.map(({ to, label, icon: Icon }) => {
              const count = to === "/inbox" ? inboxCount : to === "/connect" ? answerCount : 0;
              return <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <Icon size={19} strokeWidth={1.8} />
                <span>{label}</span>
                {count > 0 ? <b className="nav-count" aria-label={`${count} ${label} notification${count === 1 ? "" : "s"}`}>{count}</b> : null}
              </NavLink>;
            })}
          </nav>

          <div className="header-actions">
            <button className="quiet-button" onClick={auth.logout}><LogOut size={15} />Sign out</button>
            <div className="persona-control account-profile" aria-label={`Signed in as ${persona.name}`}>
              <span className="avatar">{persona.initials}</span>
              <span className="persona-copy"><strong>{persona.name}</strong><small>{persona.subtitle}</small></span>
            </div>
          </div>
          <span className="policy-version" aria-label={`Active policy ${POLICY_VERSION}`}>{POLICY_VERSION}</span>
        </div>
      </header>
      <main className="main-content"><Outlet /></main>
    </div>
  );
}
