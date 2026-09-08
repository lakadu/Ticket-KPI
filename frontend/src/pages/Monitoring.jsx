import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader, PageBody } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { formatMinutes } from "@/lib/format";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Cell,
} from "recharts";
import { Lightning, Warning, Timer, TrendUp, TrendDown, Medal, ClockClockwise } from "@phosphor-icons/react";

const PRIO_COLOR = { Critical: "#EF4444", High: "#F59E0B", Medium: "#3B82F6", Low: "#94A3B8" };

function StatCard({ label, value, sub, tone = "default", icon: Icon, testId }) {
  const tones = {
    default: "text-slate-900",
    good: "text-emerald-600",
    warn: "text-amber-600",
    bad: "text-red-600",
  };
  return (
    <Card data-testid={testId} className="border-slate-200 shadow-none rounded-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</div>
            <div className={`font-display text-3xl font-extrabold tabular-nums mt-2 ${tones[tone]}`}>{value}</div>
            {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
          </div>
          {Icon && <Icon size={22} weight="duotone" className="text-slate-400" />}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Monitoring() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get("/monitoring/mttr").then(r => setData(r.data)); }, []);
  if (!data) return <div className="p-8 text-slate-500">Memuat data…</div>;

  const fastest = data.fastest || [];
  const slowest = data.slowest || [];
  const priorityChart = data.by_priority.map(p => ({ name: p.priority, MTTR: p.mttr_min, Target: p.target_min }));
  const deptChart = data.by_department.slice(0, 8);

  return (
    <>
      <PageHeader
        eyebrow="Monitoring Divisi IT"
        title="MTTR & Kinerja Teknisi"
        subtitle="Ringkasan kecepatan penyelesaian ticket seluruh tim — mudah dipahami dalam sekali lihat."
      />
      <PageBody>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4" data-testid="mttr-headline">
          <StatCard testId="stat-mttr" label="MTTR Overall" value={formatMinutes(data.overall_mttr_min)}
            sub={`${data.total_resolved} ticket terselesaikan`} icon={Timer}
            tone={data.overall_mttr_min < 120 ? "good" : data.overall_mttr_min < 480 ? "warn" : "bad"} />
          <StatCard testId="stat-response" label="Rata-rata Response" value={formatMinutes(data.overall_response_min)} icon={Lightning} />
          <StatCard testId="stat-fastest" label="Teknisi Tercepat"
            value={fastest[0]?.name || "-"} sub={fastest[0] ? `MTTR ${formatMinutes(fastest[0].mttr_min)}` : "Belum ada data"}
            tone="good" icon={Medal} />
          <StatCard testId="stat-slowest" label="Perlu Perhatian"
            value={slowest[0]?.name || "-"} sub={slowest[0] ? `MTTR ${formatMinutes(slowest[0].mttr_min)}` : "Semua bagus 🎉"}
            tone="bad" icon={Warning} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-emerald-200 shadow-none rounded-md bg-emerald-50/30">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendUp size={18} weight="duotone" className="text-emerald-600" />
                <h3 className="font-display font-semibold text-slate-900">Podium Tercepat</h3>
              </div>
              <p className="text-xs text-slate-600 mb-4">Teknisi dengan MTTR paling rendah — mereka jadi contoh untuk tim.</p>
              <div className="space-y-2">
                {fastest.map((t, i) => (
                  <div key={t.technician_id} data-testid={`fastest-${i + 1}`} className="flex items-center gap-3 p-3 bg-white border border-emerald-100 rounded-md">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-display font-bold">{i + 1}</div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{t.name}</div>
                      <div className="text-xs text-slate-500">{t.department || "-"} · {t.ticket_count} ticket</div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-lg font-bold text-emerald-700 tabular-nums">{formatMinutes(t.mttr_min)}</div>
                      <div className="text-[10px] uppercase tracking-widest text-slate-500">MTTR</div>
                    </div>
                  </div>
                ))}
                {fastest.length === 0 && <div className="text-center py-6 text-sm text-slate-500">Belum ada data.</div>}
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 shadow-none rounded-md bg-red-50/30">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendDown size={18} weight="duotone" className="text-red-600" />
                <h3 className="font-display font-semibold text-slate-900">Butuh Coaching</h3>
              </div>
              <p className="text-xs text-slate-600 mb-4">Teknisi dengan MTTR paling tinggi — kandidat mentoring atau review beban kerja.</p>
              <div className="space-y-2">
                {slowest.map((t, i) => (
                  <div key={t.technician_id} data-testid={`slowest-${i + 1}`} className="flex items-center gap-3 p-3 bg-white border border-red-100 rounded-md">
                    <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-display font-bold">
                      <Warning size={16} weight="fill" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{t.name}</div>
                      <div className="text-xs text-slate-500">{t.department || "-"} · {t.ticket_count} ticket</div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-lg font-bold text-red-700 tabular-nums">{formatMinutes(t.mttr_min)}</div>
                      <div className="text-[10px] uppercase tracking-widest text-slate-500">MTTR</div>
                    </div>
                  </div>
                ))}
                {slowest.length === 0 && <div className="text-center py-6 text-sm text-emerald-700">Semua teknisi on-track 🎉</div>}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 shadow-none rounded-md">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <ClockClockwise size={18} weight="duotone" className="text-slate-500" />
              <h3 className="font-display font-semibold text-slate-900">Trend MTTR 12 Minggu Terakhir</h3>
            </div>
            <p className="text-xs text-slate-600 mb-4">Naik = lambat, turun = cepat. Perhatikan pola untuk deteksi bottleneck.</p>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={data.weekly_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" fontSize={11} stroke="#64748b" />
                  <YAxis fontSize={11} stroke="#64748b" tickFormatter={(v) => `${Math.round(v)}m`} />
                  <Tooltip formatter={(v, key) => key === "MTTR (menit)" ? formatMinutes(v) : v} />
                  <Line type="monotone" dataKey="mttr_min" name="MTTR (menit)" stroke="#0F172A" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="ticket_count" name="Jumlah ticket" stroke="#3B82F6" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-slate-200 shadow-none rounded-md">
            <CardContent className="p-5">
              <h3 className="font-display font-semibold text-slate-900 mb-2">MTTR per Priority vs Target SLA</h3>
              <p className="text-xs text-slate-600 mb-4">Bar biru = MTTR aktual, garis merah = target SLA. Bar melebihi target artinya SLA breach.</p>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={priorityChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" fontSize={11} stroke="#64748b" />
                    <YAxis fontSize={11} stroke="#64748b" tickFormatter={(v) => `${Math.round(v)}m`} />
                    <Tooltip formatter={(v) => formatMinutes(v)} />
                    <Bar dataKey="Target" fill="#FCA5A5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="MTTR" radius={[4, 4, 0, 0]}>
                      {priorityChart.map((p) => <Cell key={p.name} fill={PRIO_COLOR[p.name]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-4 text-center text-xs">
                {data.by_priority.map(p => (
                  <div key={p.priority} className="border border-slate-200 rounded p-2">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500">{p.priority}</div>
                    <div className={`font-display font-bold tabular-nums ${p.compliance_pct >= 90 ? "text-emerald-600" : p.compliance_pct >= 70 ? "text-amber-600" : "text-red-600"}`}>{p.compliance_pct}%</div>
                    <div className="text-[10px] text-slate-500">compliance</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-none rounded-md">
            <CardContent className="p-5">
              <h3 className="font-display font-semibold text-slate-900 mb-2">MTTR per Departemen</h3>
              <p className="text-xs text-slate-600 mb-4">Departemen dengan MTTR tinggi butuh review workflow atau alokasi teknisi.</p>
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={deptChart} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" fontSize={11} stroke="#64748b" tickFormatter={(v) => `${Math.round(v)}m`} />
                    <YAxis dataKey="department" type="category" width={100} fontSize={11} stroke="#64748b" />
                    <Tooltip formatter={(v, k) => k === "MTTR (menit)" ? formatMinutes(v) : v} />
                    <Bar dataKey="mttr_min" name="MTTR (menit)" fill="#0F172A" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 shadow-none rounded-md">
          <CardContent className="p-5">
            <h3 className="font-display font-semibold text-slate-900 mb-4">Ranking Lengkap MTTR Teknisi</h3>
            <div className="space-y-2" data-testid="tech-ranking">
              {data.by_technician.map((t, i) => {
                const isFast = i < 3;
                const isSlow = t.mttr_min > 0 && i >= data.by_technician.length - 3 && data.by_technician.length > 3;
                return (
                  <div key={t.technician_id} className="grid grid-cols-[36px_1fr_100px_100px_160px] items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                    <div className={`font-display font-bold tabular-nums ${isFast ? "text-emerald-600" : isSlow ? "text-red-600" : "text-slate-500"}`}>#{i + 1}</div>
                    <div>
                      <div className="font-medium text-slate-900 flex items-center gap-2">
                        {t.name}
                        {isFast && <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Cepat</span>}
                        {isSlow && <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">Perlu Coaching</span>}
                      </div>
                      <div className="text-xs text-slate-500">{t.department || "-"}</div>
                    </div>
                    <div className="text-xs tabular-nums text-slate-600">{t.ticket_count} tiket</div>
                    <div className="text-xs tabular-nums text-slate-600">Resp {formatMinutes(t.response_min)}</div>
                    <div className="text-right">
                      <div className={`font-display text-lg font-bold tabular-nums ${isFast ? "text-emerald-700" : isSlow ? "text-red-700" : "text-slate-900"}`}>{formatMinutes(t.mttr_min)}</div>
                      <div className="text-[10px] uppercase tracking-widest text-slate-500">MTTR</div>
                    </div>
                  </div>
                );
              })}
              {data.by_technician.length === 0 && <div className="text-center py-6 text-sm text-slate-500">Belum ada data.</div>}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-none rounded-md bg-blue-50/30">
          <CardContent className="p-5">
            <div className="text-[10px] uppercase tracking-[0.3em] text-blue-700 mb-2">Cara Baca Halaman Ini</div>
            <ul className="text-sm text-slate-700 space-y-1.5 list-disc list-inside">
              <li><b>MTTR</b> = <i>Mean Time To Resolve</i>, rata-rata waktu ticket selesai dihitung dari dibuat sampai <i>Resolved</i>.</li>
              <li><b>Response Time</b> = waktu dari ticket dibuat sampai teknisi pertama kali memberikan respons.</li>
              <li>Warna: 🟢 hijau = di bawah target/cepat, 🟡 kuning = sedang, 🔴 merah = melebihi target/lambat.</li>
              <li>Baris bertanda <b>Perlu Coaching</b> = kandidat mentoring 1:1 atau review beban kerja.</li>
            </ul>
          </CardContent>
        </Card>
      </PageBody>
    </>
  );
}
