import { NavLink, Outlet } from "react-router-dom";
import OfflineNotice from "./OfflineNotice";

const links = [["/", "Overview", true], ["/performance", "Performance"], ["/channels", "Channels"], ["/campaigns", "Campaigns"], ["/keywords", "Keywords"], ["/insights", "Insights"], ["/reports", "Reports"], ["/definitions", "Metric definitions"]];

export default function AppLayout() {
  return <div className="app-shell"><aside className="sidebar"><div className="brand">Keywoed India Network Pvt. Ltd.</div><nav aria-label="Main navigation">{links.map(([to, label, end]) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `side-link${isActive ? " active" : ""}`}>{label}</NavLink>)}</nav></aside><main className="main-area"><OfflineNotice /><Outlet /></main></div>;
}
