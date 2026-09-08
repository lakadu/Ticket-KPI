import React, { useEffect, useState } from "react";
import api, { fmtApiError } from "@/lib/api";
import { PageHeader, PageBody } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatMinutes } from "@/lib/format";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Camera } from "@phosphor-icons/react";

const PERF_COLORS = {
  Excellent: "bg-emerald-50 text-emerald-800 border-emerald-300",
  Good: "bg-blue-50 text-blue-800 border-blue-300",
  Fair: "bg-amber-50 text-amber-800 border-amber-300",
  "Needs Improvement": "bg-red-50 text-red-800 border-red-300",
};

function CurrentKPI({ rows }) {
  return (
    <Card className="border-slate-200 shadow-none rounded-md">
      <Table data-testid="kpi-table">
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="text-[10px] uppercase tracking-widest">Technician</TableHead>
            <TableHead className="text-[10px] uppercase tracking-widest text-right">Tickets</TableHead>
            <TableHead className="text-[10px] uppercase tracking-widest text-right">Weighted Pt</TableHead>
            <TableHead className="text-[10px] uppercase tracking-widest text-right">SLA %</TableHead>
            <TableHead className="text-[10px] uppercase tracking-widest text-right">Avg Response</TableHead>
            <TableHead className="text-[10px] uppercase tracking-widest text-right">Avg Resolution</TableHead>
            <TableHead className="text-[10px] uppercase tracking-widest text-right">Reopen %</TableHead>
            <TableHead className="text-[10px] uppercase tracking-widest text-right">Rating</TableHead>
            <TableHead className="text-[10px] uppercase tracking-widest text-right">KPI</TableHead>
            <TableHead className="text-[10px] uppercase tracking-widest">Performance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(r => (
            <TableRow key={r.technician_id} data-testid={`kpi-row-${r.technician_id}`}>
              <TableCell className="font-medium">{r.technician_name}<div className="text-xs text-slate-500">{r.department}</div></TableCell>
              <TableCell className="text-right tabular-nums">{r.total_tickets}</TableCell>
              <TableCell className="text-right tabular-nums font-semibold">{r.weighted_point}</TableCell>
              <TableCell className="text-right tabular-nums">{r.sla_compliance}%</TableCell>
              <TableCell className="text-right tabular-nums">{formatMinutes(r.avg_response_min)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatMinutes(r.avg_resolution_min)}</TableCell>
              <TableCell className="text-right tabular-nums">{r.reopen_rate}%</TableCell>
              <TableCell className="text-right tabular-nums">{r.avg_rating}</TableCell>
              <TableCell className="text-right"><span className="font-display text-lg font-bold tabular-nums">{r.kpi_score}</span></TableCell>
              <TableCell><span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded border font-semibold ${PERF_COLORS[r.performance] || ""}`}>{r.performance}</span></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function HistoryTab({ technicians }) {
  const [selected, setSelected] = useState("all");
  const [history, setHistory] = useState([]);

  const load = async () => {
    const params = {};
    if (selected !== "all") params.technician_id = selected;
    const { data } = await api.get("/kpi/history", { params });
    setHistory(data);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [selected]);

  // Build chart: group by period
  const byPeriod = {};
  history.forEach(h => {
    if (!byPeriod[h.period]) byPeriod[h.period] = { period: h.period };
    byPeriod[h.period][h.technician_name] = h.kpi_score;
  });
  const chartData = Object.values(byPeriod).sort((a, b) => a.period.localeCompare(b.period));
  const names = Array.from(new Set(history.map(h => h.technician_name)));
  const colors = ["#0F172A", "#3B82F6", "#F59E0B", "#EF4444", "#10B981", "#8B5CF6"];

  return (
    <>
      <div className="flex items-center gap-3">
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger data-testid="history-select" className="w-[240px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Technicians</SelectItem>
            {technicians.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-slate-200 shadow-none rounded-md">
        <CardContent className="p-5">
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-4">KPI Score Trend</div>
          {chartData.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-500">
              No historical snapshots yet — trigger the first snapshot to start tracking trends.
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="period" fontSize={11} stroke="#64748b" />
                  <YAxis fontSize={11} stroke="#64748b" domain={[0, 100]} />
                  <Tooltip />
                  {names.map((n, i) => (
                    <Line key={n} type="monotone" dataKey={n} stroke={colors[i % colors.length]} strokeWidth={2} dot={{ r: 3 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-none rounded-md">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="text-[10px] uppercase tracking-widest">Period</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest">Technician</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest text-right">KPI</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest text-right">SLA %</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest text-right">Weighted Pt</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest text-right">Rating</TableHead>
              <TableHead className="text-[10px] uppercase tracking-widest">Performance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map(r => (
              <TableRow key={`${r.period}-${r.technician_id}`}>
                <TableCell className="font-mono text-xs">{r.period}</TableCell>
                <TableCell className="font-medium">{r.technician_name}</TableCell>
                <TableCell className="text-right font-display text-lg font-bold tabular-nums">{r.kpi_score}</TableCell>
                <TableCell className="text-right tabular-nums">{r.sla_compliance}%</TableCell>
                <TableCell className="text-right tabular-nums">{r.weighted_point}</TableCell>
                <TableCell className="text-right tabular-nums">{r.avg_rating}</TableCell>
                <TableCell><span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded border font-semibold ${PERF_COLORS[r.performance] || ""}`}>{r.performance}</span></TableCell>
              </TableRow>
            ))}
            {history.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-slate-500 py-8">No snapshots yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

export default function KPIScores() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = async () => setRows((await api.get("/kpi/scores")).data);
  useEffect(() => {
    load();
    if (["admin","manager","supervisor"].includes(user.role)) {
      api.get("/users", { params: { role: "technician" } }).then(r => setTechnicians(r.data));
    }
  }, [user.role]);

  const snapshot = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/kpi/snapshot-now");
      toast.success(`Snapshot saved for ${data.period} (${data.count} technicians)`);
    } catch (e) { toast.error(fmtApiError(e)); }
    finally { setBusy(false); }
  };

  const canSnapshot = ["admin", "manager"].includes(user.role);

  return (
    <>
      <PageHeader
        eyebrow="Performance"
        title="KPI Scores & History"
        subtitle="Live current-period scores plus historical monthly trends."
        actions={canSnapshot && <Button data-testid="snapshot-btn" onClick={snapshot} disabled={busy} className="bg-slate-900"><Camera size={14} className="mr-1.5" />Snapshot This Month</Button>}
      />
      <PageBody>
        <Tabs defaultValue="current">
          <TabsList>
            <TabsTrigger value="current" data-testid="tab-current">Current Period</TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">Monthly History</TabsTrigger>
          </TabsList>
          <TabsContent value="current" className="mt-4"><CurrentKPI rows={rows} /></TabsContent>
          <TabsContent value="history" className="mt-4 space-y-4"><HistoryTab technicians={technicians} /></TabsContent>
        </Tabs>
      </PageBody>
    </>
  );
}
