import { Link, useLocation } from "react-router-dom";
import { IconMenu, IconSettings, IconUser } from "../components/Icons";

export type Crumb = { label: string; to?: string };

function crumbsFromPath(pathname: string): Crumb[] {
  const base: Crumb[] = [{ label: "Home", to: "/dashboard" }];
  if (pathname === "/dashboard" || pathname === "/") {
    base.push({ label: "Dashboard" });
    return base;
  }
  if (pathname === "/tours") {
    base.push({ label: "Tours" });
    return base;
  }
  if (pathname === "/destinations") {
    base.push({ label: "Destinations" });
    return base;
  }
  if (pathname === "/travel-plans") {
    base.push({ label: "Travel plans" });
    return base;
  }
  if (pathname === "/destinations/new") {
    base.push({ label: "Destinations", to: "/destinations" });
    base.push({ label: "Add destination" });
    return base;
  }
  if (/^\/destinations\/[^/]+\/edit$/.test(pathname)) {
    base.push({ label: "Destinations", to: "/destinations" });
    base.push({ label: "Edit destination" });
    return base;
  }
  if (pathname === "/tours/new") {
    base.push({ label: "Tours", to: "/tours" });
    base.push({ label: "Add new tour" });
    return base;
  }
  if (/^\/tours\/[^/]+\/edit$/.test(pathname)) {
    base.push({ label: "Tours", to: "/tours" });
    base.push({ label: "Edit tour" });
    return base;
  }
  base.push({ label: "Page" });
  return base;
}

type TopBarProps = {
  onMenuClick: () => void;
};

export function TopBar({ onMenuClick }: TopBarProps) {
  const { pathname } = useLocation();
  const items = crumbsFromPath(pathname === "/" ? "/dashboard" : pathname);

  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100" aria-label="Toggle menu" onClick={onMenuClick}>
          <IconMenu />
        </button>
        <nav className="flex flex-wrap items-center gap-1 text-sm text-slate-500" aria-label="Breadcrumb">
          {items.map((c, i) => {
            const isLast = i === items.length - 1;
            return (
              <span key={`${c.label}-${i}`}>
                {!isLast && c.to ? (
                  <Link to={c.to} className="transition hover:text-blue-600">
                    {c.label}
                  </Link>
                ) : (
                  <span className={isLast ? "font-semibold text-slate-800" : undefined}>{c.label}</span>
                )}
                {!isLast ? <span className="mx-1 text-slate-300">›</span> : null}
              </span>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-500" title="Admin">
          <IconUser size={18} />
        </span>
        <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-md transition hover:bg-blue-700" aria-label="Settings">
          <IconSettings size={18} />
        </button>
      </div>
    </header>
  );
}
