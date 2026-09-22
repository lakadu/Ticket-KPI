import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { PageHeader, PageBody } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge, PriorityBadge, SLAIndicator } from "@/components/Badges";
import { formatDate, formatMinutes } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import { Plus, MagnifyingGlass } from "@phosphor-icons/react";

const STATUSES = ["Open", "Assigned", "On Progress", "Pending", "Resolved", "Closed", "Reopened"];
const PRIOS = ["Low", "Medium", "High", "Critical"];

export default function Tickets() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 15;

  const load = async () => {
    const params = {};
    if (q) params.q = q;
    if (status !== "all") params.status = status;
    if (priority !== "all") params.priority = priority;
    const { data } = await api.get("/tickets", { params });
    setTickets(data);
    setPage(1);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status, priority]);

  const pageData = useMemo(() => {
    const s = (page - 1) * perPage;
    return tickets.slice(s, s + perPage);
  }, [tickets, page]);
  const totalPages = Math.max(1, Math.ceil(tickets.length / perPage));

  return (
    <>
      <PageHeader
        eyebrow={user.role === "customer" ? "Ticket saya" : "Antrian"}
        title={user.role === "customer" ? "Ticket Saya" : "Semua Ticket"}
        subtitle={`${tickets.length} ticket sesuai filter saat ini`}
        actions={
          <Button data-testid="new-ticket-btn" onClick={() => nav("/tickets/new")} className="bg-slate-900 hover:bg-slate-800">
            <Plus size={16} className="mr-1.5" /> Ticket Baru
          </Button>
        }
      />
      <PageBody>
        <Card className="border-slate-200 shadow-none rounded-md">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input data-testid="search-tickets" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="Cari subject, nomor, deskripsi…" className="pl-9" />
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger data-testid="filter-status" className="w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua status</SelectItem>
                  {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger data-testid="filter-priority" className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua priority</SelectItem>
                  {PRIOS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={load} data-testid="apply-filters">Cari</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-none rounded-md">
          {/* Desktop / tablet: table */}
          <div className="overflow-x-auto hidden md:block">
            <Table data-testid="tickets-table">
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-[10px] uppercase tracking-widest">Nomor</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest">Subject</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest">Priority</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest">Status</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest">SLA</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest">Umur / Waktu Selesai</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-widest">Dibuat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageData.map(t => (
                  <TableRow key={t.id} data-testid={`ticket-row-${t.number}`} className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => nav(`/tickets/${t.id}`)}>
                    <TableCell className="font-mono text-xs text-slate-700">{t.number}</TableCell>
                    <TableCell className="max-w-md truncate font-medium text-slate-900">{t.subject}</TableCell>
                    <TableCell><PriorityBadge priority={t.priority} /></TableCell>
                    <TableCell><StatusBadge status={t.status} /></TableCell>
                    <TableCell><SLAIndicator status={t.sla.sla_status} /></TableCell>
                    <TableCell className="text-xs text-slate-600 tabular-nums">
                      {t.sla.resolution_time != null
                        ? <>Selesai dalam <b>{formatMinutes(t.sla.resolution_time)}</b></>
                        : <>Umur <b>{formatMinutes(t.sla.age_minutes)}</b></>}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">{formatDate(t.created_at)}</TableCell>
                  </TableRow>
                ))}
                {tickets.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-slate-500 py-8">Belum ada ticket.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: card list */}
          <div className="md:hidden divide-y divide-slate-200" data-testid="tickets-cards">
            {pageData.map(t => (
              <button
                key={t.id}
                type="button"
                data-testid={`ticket-card-${t.number}`}
                onClick={() => nav(`/tickets/${t.id}`)}
                className="w-full text-left p-4 hover:bg-slate-50 active:bg-slate-100 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-slate-500">{t.number}</span>
                  <span className="text-[11px] text-slate-400 shrink-0">{formatDate(t.created_at)}</span>
                </div>
                <div className="font-medium text-slate-900 mt-1 line-clamp-2">{t.subject}</div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <PriorityBadge priority={t.priority} />
                  <StatusBadge status={t.status} />
                  <SLAIndicator status={t.sla.sla_status} />
                </div>
                <div className="text-xs text-slate-600 mt-2 tabular-nums">
                  {t.sla.resolution_time != null
                    ? <>Selesai dalam <b>{formatMinutes(t.sla.resolution_time)}</b></>
                    : <>Umur <b>{formatMinutes(t.sla.age_minutes)}</b></>}
                </div>
              </button>
            ))}
            {tickets.length === 0 && (
              <div className="text-center text-slate-500 py-8">Belum ada ticket.</div>
            )}
          </div>
          {tickets.length > perPage && (
            <div className="flex justify-between items-center p-4 border-t border-slate-200">
              <div className="text-xs text-slate-500">Halaman {page} dari {totalPages}</div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Sebelumnya</Button>
                <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Berikutnya</Button>
              </div>
            </div>
          )}
        </Card>
      </PageBody>
    </>
  );
}
