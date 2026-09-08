import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { fmtApiError } from "@/lib/api";
import { PageHeader, PageBody } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import { useAuth } from "@/context/AuthContext";
import { UploadSimple, X, MagnifyingGlass, UserPlus, Phone, Envelope, ChatText, Storefront, House } from "@phosphor-icons/react";

const PRIOS = ["Low", "Medium", "High", "Critical"];
const CHANNELS = [
  { value: "Phone", icon: Phone },
  { value: "Walk-in", icon: Storefront },
  { value: "Email", icon: Envelope },
  { value: "Chat", icon: ChatText },
  { value: "Self-service", icon: House },
];

export default function CreateTicket() {
  const { user } = useAuth();
  const nav = useNavigate();
  const helpdesk = user.role !== "customer";

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [categoryId, setCategoryId] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [reportedVia, setReportedVia] = useState(helpdesk ? "Phone" : "Self-service");
  const [attachments, setAttachments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [qc, setQc] = useState({ name: "", email: "", department: "", phone: "" });

  const loadCustomers = async () => {
    if (!helpdesk) return;
    const { data } = await api.get("/users", { params: { role: "customer" } });
    setCustomers(data);
  };

  useEffect(() => {
    api.get("/categories").then(r => setCategories(r.data));
    loadCustomers();
    // eslint-disable-next-line
  }, [helpdesk]);

  const currentCat = categories.find(c => c.id === categoryId);
  const selectedCustomer = customers.find(c => c.id === customerId);

  const filteredCustomers = customers.filter(c => {
    if (!customerSearch) return true;
    const s = customerSearch.toLowerCase();
    return c.name.toLowerCase().includes(s) || c.email?.toLowerCase().includes(s) || c.department?.toLowerCase().includes(s) || c.username?.toLowerCase().includes(s);
  }).slice(0, 8);

  const onFile = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    const out = [];
    for (const f of files) {
      try {
        let toStore = f;
        if (f.type.startsWith("image/")) {
          toStore = await imageCompression(f, { maxSizeMB: 0.6, maxWidthOrHeight: 1920, useWebWorker: true, initialQuality: 0.82 });
        }
        const reader = new FileReader();
        const b64 = await new Promise((res, rej) => { reader.onload = () => res(reader.result); reader.onerror = rej; reader.readAsDataURL(toStore); });
        out.push({ name: f.name, type: toStore.type, size: toStore.size, data: b64 });
      } catch { toast.error(`Failed: ${f.name}`); }
    }
    setAttachments(a => [...a, ...out]);
    setUploading(false);
    toast.success(`${out.length} file(s) compressed & attached`);
  };

  const removeAttach = (i) => setAttachments(a => a.filter((_, idx) => idx !== i));

  const quickCreate = async () => {
    if (!qc.name.trim()) { toast.error("Name required"); return; }
    try {
      const { data } = await api.post("/customers/quick", qc);
      toast.success(`Customer created: ${data.name}`);
      setCustomers(c => [data, ...c]);
      setCustomerId(data.id);
      setQuickOpen(false);
      setQc({ name: "", email: "", department: "", phone: "" });
    } catch (e) { toast.error(fmtApiError(e)); }
  };

  const submit = async () => {
    if (!subject.trim() || !description.trim()) { toast.error("Subject and description are required"); return; }
    if (helpdesk && !customerId) { toast.error("Please select the customer this ticket is for"); return; }
    setBusy(true);
    try {
      const payload = {
        subject, description, priority,
        category_id: categoryId || null,
        subcategory: subcategory || null,
        attachments,
        reported_via: reportedVia,
      };
      if (helpdesk && customerId) payload.customer_id = customerId;
      const { data } = await api.post("/tickets", payload);
      toast.success(`Ticket ${data.number} created`);
      nav(`/tickets/${data.id}`);
    } catch (err) { toast.error(fmtApiError(err)); }
    finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader
        eyebrow={helpdesk ? "Helpdesk intake" : "Report an issue"}
        title={helpdesk ? "Log Ticket on Behalf" : "Create New Ticket"}
        subtitle={helpdesk ? "Log a ticket for a customer who called, walked in, emailed, or chatted." : "Provide as much detail as possible for faster resolution."}
      />
      <PageBody>
        <Card className="border-slate-200 shadow-none rounded-md max-w-4xl">
          <CardContent className="p-6 space-y-5">
            {helpdesk && (
              <div className="rounded-md border border-blue-200 bg-blue-50/60 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-blue-700">Filing for a customer</div>
                    <div className="text-sm text-slate-700 mt-0.5">Pick an existing customer or quickly add a new one.</div>
                  </div>
                  <Button data-testid="quick-add-customer" size="sm" variant="outline" onClick={() => setQuickOpen(true)}>
                    <UserPlus size={14} className="mr-1.5" /> Quick Add Customer
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs uppercase tracking-wider">Search customer</Label>
                    <div className="relative mt-1.5">
                      <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input data-testid="customer-search" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className="pl-9" placeholder="Name, email, department…" />
                    </div>
                    <div className="mt-2 max-h-40 overflow-y-auto border border-slate-200 rounded-md bg-white">
                      {filteredCustomers.length === 0 && <div className="text-xs text-slate-500 p-3">No match. Use Quick Add.</div>}
                      {filteredCustomers.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          data-testid={`pick-customer-${c.username}`}
                          onClick={() => setCustomerId(c.id)}
                          className={`w-full text-left px-3 py-2 text-sm border-b border-slate-100 last:border-0 hover:bg-slate-50 ${customerId === c.id ? "bg-blue-50" : ""}`}
                        >
                          <div className="font-medium text-slate-900">{c.name}</div>
                          <div className="text-xs text-slate-500">{c.department || "-"} · {c.email}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wider">Selected customer</Label>
                    <div data-testid="selected-customer" className="mt-1.5 border border-slate-200 rounded-md bg-white p-3 min-h-[92px]">
                      {selectedCustomer ? (
                        <>
                          <div className="font-display font-semibold text-slate-900">{selectedCustomer.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{selectedCustomer.email}</div>
                          <div className="text-xs text-slate-500">{selectedCustomer.department || "-"} · {selectedCustomer.phone || "-"}</div>
                          <button type="button" onClick={() => setCustomerId("")} className="text-xs text-red-600 hover:underline mt-2">Change</button>
                        </>
                      ) : <div className="text-sm text-slate-400 italic">No customer selected</div>}
                    </div>
                    <div className="mt-2">
                      <Label className="text-xs uppercase tracking-wider">Reported via</Label>
                      <Select value={reportedVia} onValueChange={setReportedVia}>
                        <SelectTrigger data-testid="reported-via" className="mt-1.5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CHANNELS.map(c => <SelectItem key={c.value} value={c.value}>{c.value}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label className="text-xs uppercase tracking-wider">Subject</Label>
              <Input data-testid="ticket-subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Short summary…" className="mt-1.5" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Description</Label>
              <Textarea data-testid="ticket-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={6} placeholder="Steps to reproduce, expected vs actual, any error messages…" className="mt-1.5" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs uppercase tracking-wider">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger data-testid="ticket-priority" className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIOS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider">Category</Label>
                <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setSubcategory(""); }}>
                  <SelectTrigger data-testid="ticket-category" className="mt-1.5"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider">Subcategory</Label>
                <Select value={subcategory} onValueChange={setSubcategory} disabled={!currentCat}>
                  <SelectTrigger data-testid="ticket-subcategory" className="mt-1.5"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>{(currentCat?.subcategories || []).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider">Attachments (auto-compressed)</Label>
              <label data-testid="attach-input-label" className="mt-1.5 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-md p-6 cursor-pointer hover:border-slate-500 hover:bg-slate-50 transition-colors">
                <UploadSimple size={24} className="text-slate-500" />
                <div className="text-sm text-slate-700 mt-2">Click to upload — images compressed to &lt;600KB @ 1920px</div>
                <input type="file" multiple onChange={onFile} className="hidden" data-testid="attach-input" />
              </label>
              {uploading && <div className="text-xs text-slate-500 mt-2">Compressing…</div>}
              {attachments.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                  {attachments.map((a, i) => (
                    <div key={i} className="border border-slate-200 rounded-md p-2 relative group">
                      <button data-testid={`remove-attach-${i}`} onClick={() => removeAttach(i)} className="absolute top-1 right-1 bg-white border border-slate-200 rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={12} />
                      </button>
                      {a.type.startsWith("image/") ? <img src={a.data} alt={a.name} className="w-full h-24 object-cover rounded" /> : <div className="h-24 flex items-center justify-center text-xs text-slate-500 bg-slate-50 rounded">{a.type}</div>}
                      <div className="text-[10px] text-slate-500 truncate mt-1">{a.name}</div>
                      <div className="text-[10px] text-slate-400">{(a.size / 1024).toFixed(0)} KB</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <Button data-testid="submit-ticket-btn" onClick={submit} disabled={busy} className="bg-slate-900 hover:bg-slate-800">
                {busy ? "Creating…" : helpdesk && selectedCustomer ? `Log Ticket for ${selectedCustomer.name.split(" ")[0]}` : "Create Ticket"}
              </Button>
              <Button variant="outline" onClick={() => nav(-1)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      </PageBody>

      <Dialog open={quickOpen} onOpenChange={setQuickOpen}>
        <DialogContent data-testid="quick-customer-dialog">
          <DialogHeader><DialogTitle>Quick Add Customer</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-slate-600">Default password <span className="font-mono">customer123</span> will be set; customer can change it later.</p>
            <div><Label className="text-xs uppercase">Name *</Label><Input data-testid="qc-name" value={qc.name} onChange={(e) => setQc({ ...qc, name: e.target.value })} /></div>
            <div><Label className="text-xs uppercase">Email (optional)</Label><Input data-testid="qc-email" type="email" value={qc.email} onChange={(e) => setQc({ ...qc, email: e.target.value })} placeholder="Auto-generated if blank" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs uppercase">Department</Label><Input data-testid="qc-dept" value={qc.department} onChange={(e) => setQc({ ...qc, department: e.target.value })} /></div>
              <div><Label className="text-xs uppercase">Phone</Label><Input data-testid="qc-phone" value={qc.phone} onChange={(e) => setQc({ ...qc, phone: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickOpen(false)}>Cancel</Button>
            <Button data-testid="qc-submit" onClick={quickCreate} className="bg-slate-900">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
