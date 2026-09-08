import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { fmtApiError } from "@/lib/api";
import { LockKey, Envelope } from "@phosphor-icons/react";

const DEMO = [
  { role: "Admin", user: "admin", pwd: "admin123" },
  { role: "Manager", user: "manager", pwd: "password123" },
  { role: "Supervisor", user: "supervisor", pwd: "password123" },
  { role: "Technician", user: "tech1", pwd: "password123" },
  { role: "Customer", user: "customer1", pwd: "password123" },
];

export default function Login() {
  const { login, user } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();
  const from = loc.state?.from?.pathname || "/";

  useEffect(() => {
    if (user) nav(from, { replace: true });
  }, [user, nav, from]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(identifier, password);
      toast.success("Welcome back!");
      nav(from, { replace: true });
    } catch (err) {
      toast.error(fmtApiError(err));
    } finally { setBusy(false); }
  };

  const fill = (u, p) => { setIdentifier(u); setPassword(p); };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      <div className="hidden lg:flex relative flex-col justify-between p-12 bg-[#0F172A] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-[0.08] grid-lines" />
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-md bg-white text-[#0F172A] flex items-center justify-center font-display font-extrabold">IT</div>
            <span className="font-display font-bold text-lg tracking-tight">ServiceOps</span>
          </div>
        </div>
        <div className="relative z-10 space-y-6 max-w-md">
          <div className="text-[11px] uppercase tracking-[0.3em] text-slate-400">IT Service Management</div>
          <h1 className="text-4xl xl:text-5xl font-display font-bold leading-tight tracking-tight">
            Ticketing, SLA & KPI — <span className="text-emerald-400">under one roof.</span>
          </h1>
          <p className="text-slate-300 leading-relaxed text-sm">
            Kelola ticket, teknisi, dan performance secara real-time. KPI dihitung otomatis dari data ticketing yang bisa Anda audit.
          </p>
          <div className="grid grid-cols-3 gap-3 pt-4">
            {["SLA Compliance", "Weighted Points", "KPI Score"].map((k) => (
              <div key={k} className="border border-slate-700 p-3">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{k}</div>
                <div className="font-display text-2xl font-semibold mt-1 tabular-nums">Live</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-xs text-slate-500">© {new Date().getFullYear()} ServiceOps · <a href="/status" className="hover:text-slate-300 underline underline-offset-4" data-testid="status-link">Public status</a></div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Sign in</div>
            <h2 className="font-display text-3xl font-bold mt-1 text-slate-900">Welcome back</h2>
            <p className="text-sm text-slate-600 mt-2">Login with your email <span className="text-slate-400">or</span> username.</p>
          </div>

          <form onSubmit={submit} className="space-y-4" data-testid="login-form">
            <div>
              <Label className="text-xs uppercase tracking-wider text-slate-600">Email or Username</Label>
              <div className="relative mt-1.5">
                <Envelope size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input data-testid="login-identifier" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="pl-9" placeholder="admin@itsm.local" required />
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-slate-600">Password</Label>
              <div className="relative mt-1.5">
                <LockKey size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input data-testid="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" placeholder="••••••••" required />
              </div>
            </div>
            <Button data-testid="login-submit" type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-10 border-t border-slate-200 pt-6">
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-3">Demo accounts (click to fill)</div>
            <div className="grid grid-cols-1 gap-1.5">
              {DEMO.map((d) => (
                <button
                  key={d.user}
                  type="button"
                  onClick={() => fill(d.user, d.pwd)}
                  data-testid={`demo-${d.role.toLowerCase()}`}
                  className="text-left text-xs px-3 py-2 border border-slate-200 rounded-md hover:border-slate-900 hover:bg-slate-50 transition-colors font-mono flex justify-between"
                >
                  <span className="text-slate-500">{d.role}</span>
                  <span className="text-slate-800">{d.user} / {d.pwd}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
