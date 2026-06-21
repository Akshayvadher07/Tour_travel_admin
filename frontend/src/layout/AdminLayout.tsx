import { useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    if (window.matchMedia("(max-width: 900px)").matches) {
      setMobileOpen((o) => !o);
    } else {
      setSidebarCollapsed((c) => !c);
    }
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const onChange = () => {
      if (!mq.matches) setMobileOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {mobileOpen ? (
        <button type="button" className="fixed inset-0 z-30 border-none bg-black/40 p-0 lg:hidden" aria-label="Close menu" onClick={closeMobile} />
      ) : null}
      <Sidebar collapsed={sidebarCollapsed} mobileOpen={mobileOpen} onNavigate={closeMobile} />
      <div className={`flex min-h-screen flex-1 flex-col ${sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        <TopBar onMenuClick={toggleSidebar} />
        <div className="flex-1 bg-gradient-to-br from-slate-50 via-white to-blue-50 p-5 lg:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
