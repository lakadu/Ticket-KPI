import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { PageHeader, PageBody } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import { fmtApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { UploadSimple, X } from "@phosphor-icons/react";

const PRIOS = ["Low", "Medium", "High", "Critical"];

export default function CreateTicket() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [categoryId, setCategoryId] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.get("/categories").then(r => setCategories(r.data));
    if (user.role !== "customer") {
      api.get("/users", { params: { role: "customer" } }).then(r => setCustomers(r.data));
    }
  }, [user.role]);

  const currentCat = categories.find(c => c.id === categoryId);

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
      } catch (err) {
        toast.error(`Failed: ${f.name}`);
      }
    }
    setAttachments(a => [...a, ...out]);
    setUploading(false);
    toast.success(`${out.length} file(s) compressed & attached`);
  };

  const removeAttach = (i) => setAttachments(a => a.filter((_, idx) => idx !== i));

  const submit = async () => {
    if (!subject.trim() || !description.trim()) { toast.error("Subject and description are required"); return; }
    setBusy(true);
    try {
      const payload = { subject, description, priority, category_id: categoryId || null, subcategory: subcategory || null, attachments };
      if (user.role !== "customer" && customerId) payload.customer_id = customerId;
      const { data } = await api.post("/tickets", payload);
      toast.success(`Ticket ${data.number} created`);
      nav(`/tickets/${data.id}`);
    } catch (err) {
      toast.error(fmtApiError(err));
    } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader eyebrow="Report an issue" title="Create New Ticket" subtitle="Provide as much detail as possible for faster resolution." />
      <PageBody>
        <Card className="border-slate-200 shadow-none rounded-md max-w-4xl">
          <CardContent className="p-6 space-y-5">
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
            {user.role !== "customer" && (
              <div>
                <Label className="text-xs uppercase tracking-wider">Customer</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger data-testid="ticket-customer" className="mt-1.5"><SelectValue placeholder="Select customer (or leave to file on your behalf)" /></SelectTrigger>
                  <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name} — {c.department}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
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
                {busy ? "Creating…" : "Create Ticket"}
              </Button>
              <Button variant="outline" onClick={() => nav(-1)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      </PageBody>
    </>
  );
}
