import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  ChartBar, Ticket, Users, UsersThree, Tag, GearSix, ClipboardText,
  ListChecks, SignOut, ChartLineUp, Warning, Article, Trophy, ChartPieSlice,
  List as ListIcon, X as CloseIcon,
} from "@phosphor-icons/react";

const NAV = [
  { to: "/", label: "Dashboard", icon: ChartBar, roles: ["admin", "manager", "supervisor", "technician", "customer"] },
  { to: "/tickets", label: "Daftar Ticket", icon: Ticket, roles: ["admin", "manager", "supervisor", "technician"] },
  { to: "/my-tickets", label: "Ticket Saya", icon: ClipboardText, roles: ["customer"] },
  { to: "/tickets/new", label: "Buat Ticket", icon: Warning, roles: ["admin", "manager", "supervisor", "technician", "customer"] },
  { to: "/monitoring", label: "Monitoring", icon: ChartPieSlice, roles: ["admin", "manager", "supervisor"] },
  { to: "/kpi", label: "Skor KPI", icon: ChartLineUp, roles: ["admin", "manager", "supervisor", "technician"] },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy, roles: ["admin", "manager", "supervisor", "technician", "customer"] },
  { to: "/reports", label: "Laporan", icon: ListChecks, roles: ["admin", "manager", "supervisor"] },
  { to: "/users", label: "Pengguna", icon: Users, roles: ["admin", "manager"] },
  { to: "/customers", label: "Pelanggan", icon: UsersThree, roles: ["admin", "manager", "supervisor"] },
  { to: "/categories", label: "Kategori", icon: Tag, roles: ["admin", "manager"] },
  { to: "/settings", label: "Pengaturan", icon: GearSix, roles: ["admin", "manager"] },
  { to: "/audit-log", label: "Audit Log", icon: Article, roles: ["admin", "manager"] },
];

function currentPageTitle(pathname) {
  if (pathname === "/") return "Dashboard";
  if (pathname.startsWith("/tickets/") && pathname !== "/tickets/new") return "Detail Ticket";
  const sorted = [...NAV].filter(n => n.to !== "/").sort((a, b) => b.to.length - a.to.length);
  for (const n of sorted) {
    if (pathname === n.to || pathname.startsWith(n.to + "/")) return n.label;
  }
  return "ServiceOps";
}

function Brand() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-md bg-slate-900 text-white flex items-center justify-center font-display font-bold">IT</div>
      <div>
        <div className="font-display font-bold text-slate-900 leading-none">ServiceOps</div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mt-0.5">Ticketing & KPI</div>
      </div>
    </div>
  );
}

function SidebarContent({ items, user, onLogout, onNavigate }) {
  return (
    <>
      <div className="h-16 px-5 flex items-center border-b border-slate-200 shrink-0">
        <Brand />
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        {items.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === "/"}
            onClick={onNavigate}
            data-testid={`nav-${n.label.toLowerCase().replace(/\s+/g, "-")}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-2.5 text-sm border-l-2 transition-colors ${
                isActive
                  ? "border-slate-900 bg-slate-50 text-slate-900 font-semibold"
                  : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`
            }
          >
            <n.icon size={18} weight="duotone" />
            {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-200 p-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-900 text-white text-sm flex items-center justify-center font-semibold uppercase shrink-0">
            {user.name?.[0] || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-900 truncate">{user.name}</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{user.role}</div>
          </div>
          <Button
            data-testid="logout-btn"
            size="icon"
            variant="ghost"
            className="text-slate-500 hover:text-slate-900"
            onClick={onLogout}
          >
            <SignOut size={18} />
          </Button>
        </div>
      </div>
    </>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = NAV.filter(n => n.roles.includes(user.role));

  const handleLogout = async () => { await logout(); nav("/login"); };
  const pageTitle = currentPageTitle(location.pathname);

  // Close the mobile drawer whenever the route changes
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Prevent body scroll when the drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] lg:flex">
      {/* Desktop sidebar */}
      <aside data-testid="sidebar" className="hidden lg:flex w-64 shrink-0 bg-white border-r border-slate-200 flex-col">
        <SidebarContent items={items} user={user} onLogout={handleLogout} />
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            aria-label="Buka menu"
            data-testid="mobile-menu-btn"
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 rounded-md text-slate-700 hover:bg-slate-100 shrink-0"
          >
            <ListIcon size={22} />
          </button>
          <div className="w-8 h-8 rounded-md bg-slate-900 text-white flex items-center justify-center font-display font-bold shrink-0">IT</div>
          <div className="font-display font-semibold text-slate-900 truncate" data-testid="mobile-page-title">{pageTitle}</div>
        </div>
        <Button
          data-testid="logout-btn-mobile"
          size="icon"
          variant="ghost"
          className="text-slate-500 hover:text-slate-900 shrink-0"
          onClick={handleLogout}
        >
          <SignOut size={18} />
        </Button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-slate-900/50"
            data-testid="mobile-drawer-backdrop"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white border-r border-slate-200 flex flex-col shadow-xl animate-in slide-in-from-left duration-200">
            <button
              type="button"
              aria-label="Tutup menu"
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 z-10 p-2 rounded-md text-slate-500 hover:bg-slate-100"
            >
              <CloseIcon size={20} />
            </button>
            <SidebarContent
              items={items}
              user={user}
              onLogout={handleLogout}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
