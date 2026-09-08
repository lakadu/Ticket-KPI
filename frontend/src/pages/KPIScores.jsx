import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader, PageBody } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMinutes } from "@/lib/format";

const PERF_COLORS = {
  Excellent: "bg-emerald-50 text-emerald-800 border-emerald-300",
  Good: "bg-blue-50 text-blue-800 border-blue-300",
  Fair: "bg-amber-50 text-amber-800 border-amber-300",
  "Needs Improvement": "bg-red-50 text-red-800 border-red-300",
};

export default function KPIScores() {
  const [rows, setRows] = useState([]);
  useEffect(() => { api.get("/kpi/scores").then(r => setRows(r.data)); }, []);

  return (
    <>
      <PageHeader eyebrow="Performance" title="Technician KPI Scores" subtitle="Computed from actual ticketing, SLA compliance, ratings & documentation." />
      <PageBody>
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
                <TableHead className="text-[10px] uppercase tracking-widest text-right">KPI Score</TableHead>
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
      </PageBody>
    </>
  );
}
