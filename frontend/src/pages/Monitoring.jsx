import React, { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { PageHeader, PageBody } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { formatMinutes } from "@/lib/format";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Cell,
} from "recharts";
import { Lightning, Warning, Timer, TrendUp, TrendDown, Medal, ClockClockwise, CalendarBlank, CaretDown } from "@phosphor-icons/react";

const PRIO_COLOR = { Critical: "#EF4444", High: "#F59E0B", Medium: "#3B82F6", Low: "#94A3B8" };

const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const endOfDay = (d) => { const x = new Date(d); x.setHours(23,59,59,999); return x; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const startOfWeek = (d) => { const x = startOfDay(d); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); return x; }; // Monday
const startOfMonth = (d) => { const x = startOfDay(d); x.setDate(1); return x; };
const endOfMonth = (d) => { const x = startOfMonth(d); x.setMonth(x.getMonth() + 1); return addDays(x, -1); };

function fmtLabel(d) {
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

const PRESETS = [
  { key: "today", label: "Hari Ini", make: () => { const n = new Date(); return { from: startOfDay(n), to: endOfDay(n) }; } },
  { key: "week", label: "Minggu Ini", make: () => { const n = new Date(); return { from: startOfWeek(n), to: endOfDay(n) }; } },
  { key: "month", label: "Bulan Ini", make: () => { const n = new Date(); return { from: startOfMonth(n), to: endOfDay(n) }; } },
  { key: "last_month", label: "Bulan Lalu", make: () => { const n = new Date(); const prev = new Date(n.getFullYear(), n.getMonth() - 1, 1); return { from: startOfMonth(prev), to: endOfMonth(prev) }; } },
  { key: "30d", label: "30 Hari", make: () => { const n = new Date(); return { from: startOfDay(addDays(n, -29)), to: endOfDay(n) }; } },
  { key: "90d", label: "90 Hari", make: () => { const n = new Date(); return { from: startOfDay(addDays(n, -89)), to: endOfDay(n) }; } },
];

function StatCard({ label, value, sub, tone = "default", icon: Icon, testId, delta }) {
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
            {delta && (
              <div className={`inline-flex items-center gap-1 mt-2 text-xs font-semibold px-1.5 py-0.5 rounded ${delta.better ? "bg-emerald-50 text-emerald-700" : delta.worse ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`}>
                {delta.better ? "▼" : delta.worse ? "▲" : "—"} {delta.text}
              </div>
            )}
          </div>
          {Icon && <Icon size={22} weight="duotone" className="text-slate-400" />}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Monitoring() {
  const [range, setRange] = useState(PRESETS[2].make()); // Bulan Ini default
  const [presetKey, setPresetKey] = useState("month");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerRange, setPickerRange] = useState({ from: range.from, to: range.to });
  const [data, setData] = useState(null);
  const [prevData, setPrevData] = useState(null);

  const load = useCallback(async (r) => {
    const params = { date_from: r.from.toISOString(), date_to: r.to.toISOString() };
    // Previous period of same length ending right before r.from
    const ms = r.to.getTime() - r.from.getTime();
    const prevTo = new Date(r.from.getTime() - 1);
    const prevFrom = new Date(prevTo.getTime() - ms);
    const [cur, prev] = await Promise.all([
      api.get("/monitoring/mttr", { params }),
      api.get("/monitoring/mttr", { params: { date_from: prevFrom.toISOString(), date_to: prevTo.toISOString() } }),
    ]);
    setData(cur.data);
    setPrevData(prev.data);
  }, []);

  useEffect(() => { load(range); }, [range, load]);

  const applyPreset = (key) => {
    const p = PRESETS.find(x => x.key === key);
    if (!p) return;
    const r = p.make();
    setPresetKey(key);
    setRange(r);
    setPickerRange(r);
  };

  const applyCustom = () => {
    if (!pickerRange?.from || !pickerRange?.to) return;
    setPresetKey("custom");
    setRange({ from: startOfDay(pickerRange.from), to: endOfDay(pickerRange.to) });
    setPickerOpen(false);
  };

  const buildDelta = (curr, prev, lowerIsBetter = true) => {
    if (!prev || prev === 0 || !curr) return null;
    const diff = curr - prev;
    const pct = Math.abs((diff / prev) * 100);
    const better = lowerIsBetter ? diff < 0 : diff > 0;
    const worse = lowerIsBetter ? diff > 0 : diff < 0;
    return { better, worse, text: `${pct.toFixed(1)}% vs periode sebelumnya` };
  };

  if (!data) return <div className="p-8 text-slate-500">Memuat data…</div>;

  const fastest = data.fastest || [];
  const slowest = data.slowest || [];
  const priorityChart = data.by_priority.map(p => ({ name: p.priority, MTTR: p.mttr_min, Target: p.target_min }));
  const deptChart = data.by_department.slice(0, 8);

  const deltaMttr = buildDelta(data.overall_mttr_min, prevData?.overall_mttr_min);
  const deltaResp = buildDelta(data.overall_response_min, prevData?.overall_response_min);
  const deltaCount = buildDelta(data.total_resolved, prevData?.total_resolved, false);

  return (
    <>
      <PageHeader
        eyebrow="Monitoring Divisi IT"
        title="MTTR & Kinerja Teknisi"
        subtitle="Ringkasan kecepatan penyelesaian ticket seluruh tim — mudah dipahami dalam sekali lihat."
      />
      <PageBody>
        <Card className="border-slate-200 shadow-none rounded-md">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2" data-testid="date-filter">
              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mr-2">Periode:</span>
              {PRESETS.map(p => (
                <Button
                  key={p.key}
                  size="sm"
                  variant={presetKey === p.key ? "default" : "outline"}
                  onClick={() => applyPreset(p.key)}
                  data-testid={`preset-${p.key}`}
                  className={presetKey === p.key ? "bg-slate-900 hover:bg-slate-800" : ""}
                >
                  {p.label}
                </Button>
              ))}
              <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <PopoverTrigger asChild>
                  <Button size="sm" variant={presetKey === "custom" ? "default" : "outline"} data-testid="preset-custom" className={presetKey === "custom" ? "bg-slate-900 hover:bg-slate-800" : ""}>
                    <CalendarBlank size={14} className="mr-1.5" /> Kustom <CaretDown size={12} className="ml-1" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <div className="p-3 border-b border-slate-200">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-1">Pilih rentang tanggal</div>
                    <div className="text-sm text-slate-700">
                      {pickerRange?.from ? fmtLabel(pickerRange.from) : "Dari"} → {pickerRange?.to ? fmtLabel(pickerRange.to) : "Sampai"}
                    </div>
                  </div>
                  <Calendar mode="range" selected={pickerRange} onSelect={setPickerRange} numberOfMonths={2} data-testid="date-range-calendar" />
                  <div className="flex justify-end gap-2 p-3 border-t border-slate-200">
                    <Button size="sm" variant="outline" onClick={() => setPickerOpen(false)}>Batal</Button>
                    <Button size="sm" data-testid="apply-custom-range" className="bg-slate-900 hover:bg-slate-800" onClick={applyCustom} disabled={!pickerRange?.from || !pickerRange?.to}>Terapkan</Button>
                  </div>
                </PopoverContent>
              </Popover>
              <div className="flex-1" />
              <div className="text-xs text-slate-600 font-mono" data-testid="active-range">
                {fmtLabel(range.from)} — {fmtLabel(range.to)}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4" data-testid="mttr-headline">
          <StatCard testId="stat-mttr" label="MTTR Overall" value={formatMinutes(data.overall_mttr_min)}
            sub={`${data.total_resolved} ticket terselesaikan`} icon={Timer} delta={deltaMttr}
            tone={data.overall_mttr_min < 120 ? "good" : data.overall_mttr_min < 480 ? "warn" : "bad"} />
          <StatCard testId="stat-response" label="Rata-rata Response" value={formatMinutes(data.overall_response_min)} icon={Lightning} delta={deltaResp} />
          <StatCard testId="stat-fastest" label="Teknisi Tercepat"
            value={fastest[0]?.name || "-"} sub={fastest[0] ? `MTTR ${formatMinutes(fastest[0].mttr_min)}` : "Belum ada data"}
            tone="good" icon={Medal} />
          <StatCard testId="stat-slowest" label="Perlu Perhatian"
            value={slowest[0]?.name || "-"} sub={slowest[0] ? `MTTR ${formatMinutes(slowest[0].mttr_min)}` : "Semua bagus 🎉"}
            tone="bad" icon={Warning} />
        </div>

        {prevData && (
          <Card className="border-slate-200 shadow-none rounded-md bg-slate-50/40">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mr-2">Perbandingan:</span>
                  <span className="text-slate-700">Periode saat ini <b>{fmtLabel(range.from)} — {fmtLabel(range.to)}</b></span>
                </div>
                <div className="text-slate-500 text-xs">
                  Sebelumnya: MTTR <b>{formatMinutes(prevData.overall_mttr_min)}</b> · Response <b>{formatMinutes(prevData.overall_response_min)}</b> · <b>{prevData.total_resolved}</b> ticket
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
              <li>Badge <b>▼ hijau</b> = MTTR/Response turun (bagus), <b>▲ merah</b> = naik (perlu perhatian) — dihitung otomatis dibanding periode sebelumnya yang panjangnya sama.</li>
            </ul>
          </CardContent>
        </Card>
      </PageBody>
    </>
  );
}
