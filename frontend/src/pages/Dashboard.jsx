import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader, PageBody } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { formatMinutes } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import { Ticket, CheckCircle, Warning, Star, TrendUp, Timer } from "@phosphor-icons/react";

const COLORS = ["#0F172A", "#3B82F6", "#F59E0B", "#EF4444", "#10B981", "#8B5CF6", "#64748B"];

function KpiCard({ label, value, sub, icon: Icon, tone = "default", testId }) {
  const tones = {
    default: "text-slate-900",
    success: "text-emerald-600",
    warning: "text-amber-600",
    danger: "text-red-600",
  };
  return (
    <Card data-testid={testId} className="border border-slate-200 rounded-md shadow-none hover:border-slate-400 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</div>
            <div className={`font-display text-3xl font-bold tabular-nums mt-2 ${tones[tone]}`}>{value}</div>
            {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
          </div>
          {Icon && <Icon size={22} weight="duotone" className="text-slate-400" />}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [aging, setAging] = useState(null);
  const [kpiTop, setKpiTop] = useState([]);

  useEffect(() => {
    api.get("/dashboard/summary").then(r => setData(r.data));
    if (user.role !== "customer") {
      api.get("/reports/aging").then(r => setAging(r.data)).catch(() => {});
      api.get("/kpi/scores").then(r => setKpiTop(r.data)).catch(() => {});
    }
  }, [user.role]);

  if (!data) return <div className="p-8 text-slate-500">Loading…</div>;

  return (
    <>
      <PageHeader
        eyebrow="Ringkasan"
        title={`Halo, ${user.name.split(" ")[0]} 👋`}
        subtitle="Kondisi ticket, SLA, dan performa teknisi secara real-time."
      />
      <PageBody>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4" data-testid="dashboard-kpis">
          <KpiCard testId="kpi-total" label="Total Ticket" value={data.total} icon={Ticket} />
          <KpiCard testId="kpi-open" label="Open" value={data.counts.Open || 0} icon={Warning} tone="warning" />
          <KpiCard testId="kpi-progress" label="Dikerjakan" value={data.counts["On Progress"] || 0} icon={Timer} />
          <KpiCard testId="kpi-resolved" label="Resolved" value={data.counts.Resolved || 0} icon={CheckCircle} tone="success" />
          <KpiCard testId="kpi-closed" label="Closed" value={data.counts.Closed || 0} icon={CheckCircle} />
          <KpiCard testId="kpi-reopened" label="Reopened" value={data.counts.Reopened || 0} icon={Warning} tone="danger" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard testId="kpi-sla" label="SLA Compliance" value={`${data.sla_compliance}%`} sub={`${data.sla_violation} pelanggaran`} icon={TrendUp} tone={data.sla_compliance >= 90 ? "success" : data.sla_compliance >= 75 ? "warning" : "danger"} />
          <KpiCard testId="kpi-response" label="Rata-rata Response" value={formatMinutes(data.avg_response_min)} icon={Timer} />
          <KpiCard testId="kpi-resolution" label="Rata-rata Resolution" value={formatMinutes(data.avg_resolution_min)} icon={Timer} />
          <KpiCard testId="kpi-rating" label="Rata-rata Rating" value={data.avg_rating || 0} sub="dari 5.00" icon={Star} tone="success" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 border-slate-200 shadow-none rounded-md">
            <CardContent className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-display font-semibold text-slate-900">Ticket per Bulan</h3>
                <div className="text-xs text-slate-500">Beberapa bulan terakhir</div>
              </div>
              <div className="h-64">
                <ResponsiveContainer>
                  <LineChart data={data.by_month}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" fontSize={11} stroke="#64748b" />
                    <YAxis fontSize={11} stroke="#64748b" />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#0F172A" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-none rounded-md">
            <CardContent className="p-5">
              <h3 className="font-display font-semibold text-slate-900 mb-4">Berdasarkan Priority</h3>
              <div className="h-64">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={data.by_priority} dataKey="value" nameKey="name" outerRadius={80} innerRadius={45}>
                      {data.by_priority.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend fontSize={11} iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-slate-200 shadow-none rounded-md">
            <CardContent className="p-5">
              <h3 className="font-display font-semibold text-slate-900 mb-4">Berdasarkan Kategori</h3>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={data.by_category} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" fontSize={11} stroke="#64748b" />
                    <YAxis dataKey="name" type="category" width={90} fontSize={11} stroke="#64748b" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-none rounded-md">
            <CardContent className="p-5">
              <h3 className="font-display font-semibold text-slate-900 mb-4">Berdasarkan Teknisi</h3>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={data.by_technician}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" fontSize={11} stroke="#64748b" />
                    <YAxis fontSize={11} stroke="#64748b" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {user.role !== "customer" && kpiTop.length > 0 && (
          <Card className="border-slate-200 shadow-none rounded-md">
            <CardContent className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-display font-semibold text-slate-900">Top Performing Technicians</h3>
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Skor KPI</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {kpiTop.slice(0, 3).map((t, i) => (
                  <div key={t.technician_id} className="border border-slate-200 p-4 rounded-md">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-slate-500">#{i + 1} {t.performance}</div>
                        <div className="font-display font-bold text-slate-900 mt-1">{t.technician_name}</div>
                      </div>
                      <div className="font-display text-3xl font-extrabold tabular-nums text-slate-900">{t.kpi_score}</div>
                    </div>
                    <div className="grid grid-cols-3 mt-3 gap-2 text-xs text-slate-600">
                      <div><div className="text-slate-400 text-[10px] uppercase">SLA</div>{t.sla_compliance}%</div>
                      <div><div className="text-slate-400 text-[10px] uppercase">Rating</div>{t.avg_rating}</div>
                      <div><div className="text-slate-400 text-[10px] uppercase">Points</div>{t.weighted_point}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {aging && (
          <Card className="border-slate-200 shadow-none rounded-md">
            <CardContent className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-display font-semibold text-slate-900">Ticket Aging (Open)</h3>
                <span className="text-xs text-slate-500">
                  <span className="text-red-600 font-semibold">{aging.at_risk}</span> berpotensi lewat SLA
                </span>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {aging.buckets.map(b => (
                  <div key={b.range} className="border border-slate-200 p-3 rounded-md">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{b.range}</div>
                    <div className="font-display text-2xl font-bold tabular-nums mt-1">{b.value}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </PageBody>
    </>
  );
}
