import { NavLink } from "react-router-dom";
import { IconLayout, IconList } from "../components/Icons";

type SidebarProps = {
  collapsed: boolean;
  mobileOpen?: boolean;
  onNavigate?: () => void;
};

export function Sidebar({ collapsed, mobileOpen = false, onNavigate }: SidebarProps) {
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive ? "bg-blue-50 text-blue-600" : "text-slate-700 hover:bg-slate-100"
    } ${collapsed ? "justify-center" : ""}`;

  return (
    <aside
      className={`${collapsed ? "w-20" : "w-64"} fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 bg-white transition-all ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}
      aria-label="Main navigation"
    >
      <div className="flex min-h-16 items-center gap-3 border-b border-slate-200 px-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">TT</span>
        {!collapsed ? <span className="truncate text-sm font-semibold text-slate-800">Travel Tours Admin</span> : null}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {!collapsed ? <p className="px-2 pt-2 text-xs font-bold uppercase tracking-wide text-slate-400">Dashboard</p> : null}
        <NavLink to="/dashboard" end className={navClass} onClick={onNavigate}>
          <IconLayout />
          {!collapsed ? <span>Dashboard</span> : null}
        </NavLink>

        {!collapsed ? <p className="px-2 pt-2 text-xs font-bold uppercase tracking-wide text-slate-400">Content</p> : null}
        <NavLink to="/destinations" end className={navClass} onClick={onNavigate}>
          <IconList />
          {!collapsed ? <span>Destinations</span> : null}
        </NavLink>
        <NavLink to="/tours" end className={navClass} onClick={onNavigate}>
          <IconList />
          {!collapsed ? <span>All tours</span> : null}
        </NavLink>
        <NavLink to="/travel-plans" end className={navClass} onClick={onNavigate}>
          <IconList />
          {!collapsed ? <span>Travel plans</span> : null}
        </NavLink>
      </div>
    </aside>
  );
}
