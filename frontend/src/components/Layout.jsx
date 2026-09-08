import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  ChartBar, Ticket, Users, UsersThree, Tag, GearSix, ClipboardText,
  ListChecks, SignOut, ChartLineUp, Warning, Article, Trophy, ChartPieSlice
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

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const items = NAV.filter(n => n.roles.includes(user.role));

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      <aside data-testid="sidebar" className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="h-16 px-5 flex items-center border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-slate-900 text-white flex items-center justify-center font-display font-bold">IT</div>
            <div>
              <div className="font-display font-bold text-slate-900 leading-none">ServiceOps</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mt-0.5">Ticketing & KPI</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {items.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
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
        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white text-sm flex items-center justify-center font-semibold uppercase">
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
              onClick={async () => { await logout(); nav("/login"); }}
            >
              <SignOut size={18} />
            </Button>
          </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
