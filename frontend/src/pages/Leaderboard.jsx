import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader, PageBody } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Medal, Crown } from "@phosphor-icons/react";

const PERF_COLORS = {
  Excellent: "text-emerald-600",
  Good: "text-blue-600",
  Fair: "text-amber-600",
  "Needs Improvement": "text-red-600",
};

const MEDALS = [
  { icon: Crown, color: "text-amber-500", bg: "bg-amber-50 border-amber-200" },
  { icon: Trophy, color: "text-slate-500", bg: "bg-slate-100 border-slate-300" },
  { icon: Medal, color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
];

export default function Leaderboard() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/leaderboard").then(r => setData(r.data)); }, []);
  if (!data) return <div className="p-8 text-slate-500">Loading…</div>;

  const rows = data.rows || [];
  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);
  const max = Math.max(1, ...(rows.map(r => r.kpi_score) || [1]));

  return (
    <>
      <PageHeader
        eyebrow={`Period ${data.period} · ${data.source === "live" ? "live" : "snapshot"}`}
        title="Team Leaderboard"
        subtitle="Ranked by KPI score — visible to everyone on the team."
      />
      <PageBody>
        {top3.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="podium">
            {[top3[1], top3[0], top3[2]].map((r, i) => {
              if (!r) return <div key={i} />;
              const rank = rows.indexOf(r);
              const M = MEDALS[rank];
              return (
                <Card key={r.technician_id} className={`border-2 ${M.bg} shadow-none rounded-md ${rank === 0 ? "md:-translate-y-3" : ""}`}>
                  <CardContent className="p-6 text-center">
                    <M.icon size={40} weight="fill" className={`mx-auto ${M.color}`} />
                    <div className="mt-3 text-[10px] uppercase tracking-[0.3em] text-slate-500">Rank {rank + 1}</div>
                    <div className="font-display text-lg font-bold text-slate-900 mt-1">{r.technician_name}</div>
                    <div className="text-xs text-slate-500">{r.department || "-"}</div>
                    <div className="font-display text-5xl font-extrabold tabular-nums mt-4 text-slate-900">{r.kpi_score}</div>
                    <div className={`text-[10px] uppercase tracking-widest mt-1 font-semibold ${PERF_COLORS[r.performance]}`}>{r.performance}</div>
                    <div className="grid grid-cols-3 gap-2 mt-4 text-xs text-slate-700">
                      <div><div className="text-slate-400 text-[10px] uppercase">SLA</div><div className="font-semibold tabular-nums">{r.sla_compliance}%</div></div>
                      <div><div className="text-slate-400 text-[10px] uppercase">Points</div><div className="font-semibold tabular-nums">{r.weighted_point}</div></div>
                      <div><div className="text-slate-400 text-[10px] uppercase">Rating</div><div className="font-semibold tabular-nums">{r.avg_rating}</div></div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Card className="border-slate-200 shadow-none rounded-md">
          <CardContent className="p-5">
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-4">Full Ranking</div>
            <div className="space-y-2">
              {rows.map((r, i) => (
                <div key={r.technician_id} data-testid={`leaderboard-row-${i + 1}`} className="grid grid-cols-[40px_1fr_100px_100px_120px] items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                  <div className="font-display text-lg font-bold tabular-nums text-slate-500">#{i + 1}</div>
                  <div>
                    <div className="font-medium text-slate-900">{r.technician_name}</div>
                    <div className="text-xs text-slate-500">{r.department || "-"} · {r.resolved_tickets}/{r.total_tickets} resolved</div>
                  </div>
                  <div className="text-xs tabular-nums text-slate-600">SLA {r.sla_compliance}%</div>
                  <div className="text-xs tabular-nums text-slate-600">{r.weighted_point} pt</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-900" style={{ width: `${(r.kpi_score / max) * 100}%` }} />
                    </div>
                    <span className="font-display font-bold text-slate-900 tabular-nums w-10 text-right">{r.kpi_score}</span>
                  </div>
                </div>
              ))}
              {rows.length === 0 && <div className="text-center text-slate-500 py-8 text-sm">No technicians ranked yet.</div>}
            </div>
          </CardContent>
        </Card>
      </PageBody>
    </>
  );
}
