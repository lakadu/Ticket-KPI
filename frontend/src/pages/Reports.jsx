import React, { useState } from "react";
import { API_BASE } from "@/lib/api";
import { PageHeader, PageBody } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FilePdf, FileCsv } from "@phosphor-icons/react";

function download(url) {
  const a = document.createElement("a");
  a.href = url;
  a.rel = "noopener";
  // Use credentials by opening in new tab - since browser sends cookies to same origin
  window.open(url, "_blank");
}

function ReportCard({ title, description, base, extra = {} }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const build = (fmt) => {
    const p = new URLSearchParams({ fmt, ...extra });
    if (from) p.set("date_from", from);
    if (to) p.set("date_to", to);
    return `${API_BASE}${base}?${p.toString()}`;
  };
  return (
    <Card className="border-slate-200 shadow-none rounded-md">
      <CardContent className="p-5 space-y-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Report</div>
          <div className="font-display text-lg font-semibold text-slate-900">{title}</div>
          <p className="text-xs text-slate-600 mt-1">{description}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs uppercase">From</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} data-testid={`${base}-from`} /></div>
          <div><Label className="text-xs uppercase">To</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} data-testid={`${base}-to`} /></div>
        </div>
        <div className="flex gap-2">
          <Button data-testid={`${base}-csv`} variant="outline" onClick={() => download(build("csv"))}><FileCsv size={14} className="mr-1.5" /> CSV</Button>
          <Button data-testid={`${base}-pdf`} className="bg-slate-900 hover:bg-slate-800" onClick={() => download(build("pdf"))}><FilePdf size={14} className="mr-1.5" /> PDF</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Reports() {
  return (
    <>
      <PageHeader eyebrow="Analytics" title="Reports" subtitle="Export KPI, tickets, SLA and productivity as CSV or PDF." />
      <PageBody>
        <Tabs defaultValue="kpi">
          <TabsList>
            <TabsTrigger value="kpi" data-testid="tab-kpi">KPI</TabsTrigger>
            <TabsTrigger value="tickets" data-testid="tab-tickets">Tickets / Productivity</TabsTrigger>
            <TabsTrigger value="sla" data-testid="tab-sla">SLA</TabsTrigger>
          </TabsList>
          <TabsContent value="kpi" className="mt-4">
            <ReportCard title="KPI Report" description="Technician-level KPI with SLA %, response, resolution, rating, weighted points and final KPI score." base="/reports/kpi/export" />
          </TabsContent>
          <TabsContent value="tickets" className="mt-4">
            <ReportCard title="Tickets Report" description="All tickets with priority, status, category, customer, technician, response & resolution timings, SLA and rating." base="/reports/tickets/export" />
          </TabsContent>
          <TabsContent value="sla" className="mt-4">
            <ReportCard title="SLA Violation Report" description="Tickets export filtered by SLA breach signals (use the Tickets tab with date filters and inspect SLA column)." base="/reports/tickets/export" />
          </TabsContent>
        </Tabs>
      </PageBody>
    </>
  );
}
