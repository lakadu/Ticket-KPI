import React, { useEffect, useState } from "react";
import api, { fmtApiError } from "@/lib/api";
import { PageHeader, PageBody } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

const PRIOS = ["Critical", "High", "Medium", "Low"];
const KPI_KEYS = [
  ["sla_compliance", "SLA Compliance"],
  ["productivity", "Ticket Completion / Productivity"],
  ["response_time", "Response Time"],
  ["resolution_time", "Resolution Time"],
  ["reopen_rate", "Reopen Rate"],
  ["customer_rating", "Customer Rating"],
  ["documentation", "Documentation Quality"],
];

function SLASection() {
  const [rules, setRules] = useState(null);
  useEffect(() => { api.get("/settings/sla").then(r => setRules(r.data)); }, []);
  const save = async () => {
    try { await api.put("/settings/sla", { rules }); toast.success("SLA saved"); }
    catch (e) { toast.error(fmtApiError(e)); }
  };
  if (!rules) return null;
  return (
    <Card className="border-slate-200 shadow-none rounded-md">
      <CardContent className="p-5 space-y-4">
        <div className="text-sm text-slate-600">Response &amp; resolution time (in minutes) per priority.</div>
        {PRIOS.map(p => (
          <div key={p} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end border-b border-slate-100 pb-3">
            <div className="font-display font-semibold text-slate-900">{p}</div>
            <div><Label className="text-xs uppercase">Response (min)</Label>
              <Input data-testid={`sla-${p}-response`} type="number" value={rules[p]?.response ?? 0} onChange={(e) => setRules({ ...rules, [p]: { ...rules[p], response: Number(e.target.value) } })} />
            </div>
            <div><Label className="text-xs uppercase">Resolution (min)</Label>
              <Input data-testid={`sla-${p}-resolution`} type="number" value={rules[p]?.resolution ?? 0} onChange={(e) => setRules({ ...rules, [p]: { ...rules[p], resolution: Number(e.target.value) } })} />
            </div>
          </div>
        ))}
        <Button data-testid="sla-save" onClick={save} className="bg-slate-900">Save SLA Rules</Button>
      </CardContent>
    </Card>
  );
}

function KPISection() {
  const [cfg, setCfg] = useState(null);
  useEffect(() => { api.get("/settings/kpi").then(r => setCfg(r.data)); }, []);
  const totalW = cfg ? Object.values(cfg.weights).reduce((a, b) => a + Number(b || 0), 0) : 0;
  const save = async () => {
    try { await api.put("/settings/kpi", cfg); toast.success("KPI config saved"); }
    catch (e) { toast.error(fmtApiError(e)); }
  };
  if (!cfg) return null;
  return (
    <Card className="border-slate-200 shadow-none rounded-md">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">Weights must total 100%.</div>
          <div className={`text-sm font-semibold ${totalW === 100 ? "text-emerald-600" : "text-red-600"}`}>Total: {totalW}%</div>
        </div>
        {KPI_KEYS.map(([k, label]) => (
          <div key={k} className="grid grid-cols-[1fr_120px] gap-3 items-center">
            <div className="text-sm text-slate-800">{label}</div>
            <Input data-testid={`kpi-w-${k}`} type="number" value={cfg.weights[k] ?? 0} onChange={(e) => setCfg({ ...cfg, weights: { ...cfg.weights, [k]: Number(e.target.value) } })} />
          </div>
        ))}
        <div className="border-t border-slate-100 pt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div><Label className="text-xs uppercase">Excellent ≥</Label><Input data-testid="kpi-t-excellent" type="number" value={cfg.thresholds.excellent} onChange={(e) => setCfg({ ...cfg, thresholds: { ...cfg.thresholds, excellent: Number(e.target.value) } })} /></div>
          <div><Label className="text-xs uppercase">Good ≥</Label><Input data-testid="kpi-t-good" type="number" value={cfg.thresholds.good} onChange={(e) => setCfg({ ...cfg, thresholds: { ...cfg.thresholds, good: Number(e.target.value) } })} /></div>
          <div><Label className="text-xs uppercase">Fair ≥</Label><Input data-testid="kpi-t-fair" type="number" value={cfg.thresholds.fair} onChange={(e) => setCfg({ ...cfg, thresholds: { ...cfg.thresholds, fair: Number(e.target.value) } })} /></div>
          <div><Label className="text-xs uppercase">Productivity Target</Label><Input data-testid="kpi-prod-target" type="number" value={cfg.productivity_target} onChange={(e) => setCfg({ ...cfg, productivity_target: Number(e.target.value) })} /></div>
        </div>
        <Button data-testid="kpi-save" onClick={save} className="bg-slate-900">Save KPI Config</Button>
      </CardContent>
    </Card>
  );
}

function IntegrationsSection() {
  const [cfg, setCfg] = useState(null);
  useEffect(() => { api.get("/settings/integrations").then(r => setCfg(r.data)); }, []);
  const save = async () => {
    try { await api.put("/settings/integrations", cfg); toast.success("Integrations saved"); }
    catch (e) { toast.error(fmtApiError(e)); }
  };
  if (!cfg) return null;
  return (
    <Card className="border-slate-200 shadow-none rounded-md">
      <CardContent className="p-5 space-y-6">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-3">Telegram</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label className="text-xs uppercase">Bot Token</Label><Input data-testid="tg-token" value={cfg.telegram_bot_token || ""} onChange={(e) => setCfg({ ...cfg, telegram_bot_token: e.target.value })} placeholder="123456:AA…" /></div>
            <div><Label className="text-xs uppercase">Chat ID</Label><Input data-testid="tg-chat" value={cfg.telegram_chat_id || ""} onChange={(e) => setCfg({ ...cfg, telegram_chat_id: e.target.value })} placeholder="-100…" /></div>
          </div>
        </div>
        <div className="border-t border-slate-100 pt-6">
          <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-3">WhatsApp</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><Label className="text-xs uppercase">Provider</Label><Input data-testid="wa-provider" value={cfg.whatsapp_provider || ""} onChange={(e) => setCfg({ ...cfg, whatsapp_provider: e.target.value })} placeholder="fonnte / twilio / wablas" /></div>
            <div><Label className="text-xs uppercase">API Key</Label><Input data-testid="wa-key" value={cfg.whatsapp_api_key || ""} onChange={(e) => setCfg({ ...cfg, whatsapp_api_key: e.target.value })} /></div>
            <div><Label className="text-xs uppercase">Sender Number</Label><Input data-testid="wa-sender" value={cfg.whatsapp_sender || ""} onChange={(e) => setCfg({ ...cfg, whatsapp_sender: e.target.value })} placeholder="+62…" /></div>
          </div>
          <div className="text-xs text-slate-500 mt-3">These tokens are stored in the database and can be filled in later — leave blank to disable notifications.</div>
        </div>
        <Button data-testid="int-save" onClick={save} className="bg-slate-900">Save Integrations</Button>
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  return (
    <>
      <PageHeader eyebrow="Configuration" title="Settings" subtitle="SLA rules, KPI weights, and notification integrations." />
      <PageBody>
        <Tabs defaultValue="sla">
          <TabsList>
            <TabsTrigger value="sla" data-testid="tab-sla-rules">SLA Rules</TabsTrigger>
            <TabsTrigger value="kpi" data-testid="tab-kpi-config">KPI Config</TabsTrigger>
            <TabsTrigger value="int" data-testid="tab-integrations">Integrations</TabsTrigger>
          </TabsList>
          <TabsContent value="sla" className="mt-4"><SLASection /></TabsContent>
          <TabsContent value="kpi" className="mt-4"><KPISection /></TabsContent>
          <TabsContent value="int" className="mt-4"><IntegrationsSection /></TabsContent>
        </Tabs>
      </PageBody>
    </>
  );
}
