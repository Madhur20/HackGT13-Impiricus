import { Activity, BellRing, Home, Inbox, LogOut, Network } from "lucide-react";
import { useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { POLICY_VERSION } from "@relay/relay-core";
import { useDemo } from "../demo-context";
import { useAccountAuth } from "../auth-context";
import { useConsults } from "../consult-context";
import { getConsultBadgeCounts } from "../consult-state";
import relayMark from "../assets/relay-mark.png";

const physicianNavigation = [
  { to: "/", label: "Overview", icon: Home },
  { to: "/mirror", label: "Practice Mirror", icon: Activity },
  { to: "/connect", label: "Doctor Connect", icon: Network },
  { to: "/inbox", label: "Inbox", icon: Inbox },
  { to: "/ledger", label: "Updates", icon: BellRing },
];

export function AppShell() {
  const { pathname } = useLocation();
  // Every page opens at the top, regardless of where the previous page was scrolled.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
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
            <span className="brand-stack"><img className="brand-logo" src={relayMark} alt="" width={38} height={38} /><small>Impiricus</small></span>
            <strong>Relay</strong>
          </NavLink>

          <nav className="nav-list" aria-label="Main navigation">
            {navigation.map(({ to, label, icon: Icon }) => {
              const count = to === "/inbox" ? inboxCount : to === "/connect" ? answerCount : 0;
              return (
              <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <Icon size={19} strokeWidth={1.8} />
                <span>{label}</span>
                {count > 0 && <b className="nav-count" aria-label={`${count} ${label} notification${count === 1 ? "" : "s"}`}>{count}</b>}
              </NavLink>
              );
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
