import React, { useEffect, useState } from "react";
import axios from "axios";
import { formatMinutes } from "@/lib/format";
import { CheckCircle, Warning, WarningOctagon, Clock, Users, Star } from "@phosphor-icons/react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS = {
  operational: { label: "All Systems Operational", color: "bg-emerald-500", ring: "ring-emerald-200", icon: CheckCircle },
  degraded: { label: "Partial Degradation", color: "bg-amber-500", ring: "ring-amber-200", icon: Warning },
  major_outage: { label: "Major Incident", color: "bg-red-600", ring: "ring-red-200", icon: WarningOctagon },
};

const PRIO_COLORS = {
  Critical: "text-red-600 bg-red-50 border-red-200",
  High: "text-orange-600 bg-orange-50 border-orange-200",
  Medium: "text-blue-600 bg-blue-50 border-blue-200",
  Low: "text-slate-600 bg-slate-50 border-slate-200",
};

export default function PublicStatus() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    const load = () => axios.get(`${API}/public/status`).then(r => setData(r.data)).catch(e => setErr(e.message));
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  if (err) return <div className="min-h-screen flex items-center justify-center text-red-600">Status API error: {err}</div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading status…</div>;

  const s = STATUS[data.status] || STATUS.operational;
  const Icon = s.icon;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-slate-900 text-white flex items-center justify-center font-display font-bold">IT</div>
            <div>
              <div className="font-display font-bold text-slate-900 leading-none">ServiceOps</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mt-0.5">Public Status</div>
            </div>
          </div>
          <a href="/login" className="text-xs uppercase tracking-widest text-slate-600 hover:text-slate-900" data-testid="status-signin-link">Sign in →</a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <section data-testid="status-hero" className={`rounded-lg border-2 border-slate-200 bg-white p-8 flex items-center gap-6 ring-4 ${s.ring}`}>
          <div className={`w-16 h-16 rounded-full ${s.color} flex items-center justify-center text-white shrink-0`}>
            <Icon size={32} weight="bold" />
          </div>
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Current Status</div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-900 mt-1">{s.label}</h1>
            <div className="text-xs text-slate-500 mt-2 font-mono">Last updated {new Date(data.generated_at).toLocaleString()}</div>
          </div>
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="status-metrics">
          <MetricCard label="Open Tickets" value={data.queue.total_open} icon={Clock} testId="metric-open" />
          <MetricCard label="Critical Now" value={data.queue.critical_open} icon={WarningOctagon} tone={data.queue.critical_open > 0 ? "danger" : "default"} testId="metric-critical" />
          <MetricCard label="Active Technicians" value={data.active_technicians} icon={Users} testId="metric-techs" />
          <MetricCard label="7-day Rating" value={`${data.avg_rating_7d}/5`} icon={Star} tone="success" testId="metric-rating" />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">SLA Compliance (7 days)</div>
            <div className="mt-4 flex items-end gap-3">
              <div className="font-display text-6xl font-extrabold tabular-nums text-slate-900">{data.sla_compliance_7d}<span className="text-2xl text-slate-500">%</span></div>
              <div className={`text-xs font-semibold uppercase tracking-widest ${data.sla_compliance_7d >= 90 ? "text-emerald-600" : data.sla_compliance_7d >= 75 ? "text-amber-600" : "text-red-600"}`}>
                {data.sla_compliance_7d >= 90 ? "Excellent" : data.sla_compliance_7d >= 75 ? "On Target" : "Below Target"}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">Avg Response</div>
                <div className="font-display font-bold text-slate-900 tabular-nums">{formatMinutes(data.avg_response_min_7d)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">Avg Resolution</div>
                <div className="font-display font-bold text-slate-900 tabular-nums">{formatMinutes(data.avg_resolution_min_7d)}</div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Live Queue by Priority</div>
            <div className="mt-4 space-y-3">
              {data.queue.by_priority.map(p => (
                <div key={p.name} data-testid={`queue-${p.name}`} className="flex items-center gap-4">
                  <span className={`text-[10px] uppercase tracking-widest font-bold w-20 px-2 py-0.5 rounded border ${PRIO_COLORS[p.name]}`}>{p.name}</span>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${p.name === "Critical" ? "bg-red-500" : p.name === "High" ? "bg-orange-500" : p.name === "Medium" ? "bg-blue-500" : "bg-slate-400"}`}
                         style={{ width: `${data.queue.total_open ? (p.value / Math.max(data.queue.total_open, 1)) * 100 : 0}%` }} />
                  </div>
                  <span className="font-display font-bold tabular-nums text-slate-900 w-8 text-right">{p.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">Created (7d)</div>
                <div className="font-display font-bold text-slate-900 tabular-nums">{data.created_7d}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">Resolved (7d)</div>
                <div className="font-display font-bold text-emerald-600 tabular-nums">{data.resolved_7d}</div>
              </div>
            </div>
          </div>
        </section>

        <footer className="text-center text-xs text-slate-500 pt-4">
          Auto-refreshes every 60 seconds · Metrics computed from the last 7 days of ticketing data.
        </footer>
      </main>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, tone = "default", testId }) {
  const tones = {
    default: "text-slate-900",
    success: "text-emerald-600",
    danger: "text-red-600",
    warning: "text-amber-600",
  };
  return (
    <div data-testid={testId} className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</div>
          <div className={`font-display text-4xl font-extrabold tabular-nums mt-2 ${tones[tone]}`}>{value}</div>
        </div>
        {Icon && <Icon size={22} weight="duotone" className="text-slate-400" />}
      </div>
    </div>
  );
}
