import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { fmtApiError } from "@/lib/api";
import { PageHeader, PageBody } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge, PriorityBadge, SLAIndicator } from "@/components/Badges";
import { formatDate, formatMinutes } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Star, CheckCircle, ArrowsClockwise, ArrowLeft, User as UserIcon, Clock, X, UserPlus, Trash } from "@phosphor-icons/react";

const STATUSES = ["Open", "Assigned", "On Progress", "Pending", "Resolved", "Closed", "Reopened"];

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [activities, setActivities] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [users, setUsers] = useState({});
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTo, setAssignTo] = useState("");
  const [resolveOpen, setResolveOpen] = useState(false);
  const [rootCause, setRootCause] = useState("");
  const [resolution, setResolution] = useState("");
  const [notes, setNotes] = useState("");
  const [docOk, setDocOk] = useState(true);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [lightbox, setLightbox] = useState(null);
  const [assignAdditional, setAssignAdditional] = useState([]);
  const [collabOpen, setCollabOpen] = useState(false);
  const [collabToAdd, setCollabToAdd] = useState("");

  const load = useCallback(async () => {
    const t = await api.get(`/tickets/${id}`);
    setTicket(t.data);
    const a = await api.get(`/tickets/${id}/activities`);
    setActivities(a.data);
    if (user.role !== "customer") {
      const u = await api.get("/users");
      const map = {}; u.data.forEach(x => map[x.id] = x); setUsers(map);
      setTechnicians(u.data.filter(x => x.role === "technician" && x.active !== false));
    }
  }, [id, user.role]);

  useEffect(() => { load(); }, [load]);

  if (!ticket) return <div className="p-8 text-slate-500">Loading…</div>;

  const canAssign = ["admin", "manager", "supervisor"].includes(user.role);
  const teamIds = ticket.technicians && ticket.technicians.length ? ticket.technicians : (ticket.technician_id ? [ticket.technician_id] : []);
  const canWork = user.role === "technician" && teamIds.includes(user.id);
  const canManage = ["admin", "manager", "supervisor"].includes(user.role) || canWork;
  const canRate = user.role === "customer" && ticket.customer_id === user.id && ["Resolved", "Closed"].includes(ticket.status);

  const changeStatus = async (status) => {
    try { await api.post(`/tickets/${id}/status`, { status }); toast.success(`Status: ${status}`); load(); }
    catch (e) { toast.error(fmtApiError(e)); }
  };
  const doAssign = async () => {
    if (!assignTo) return;
    try {
      await api.post(`/tickets/${id}/assign`, { technician_id: assignTo, additional: assignAdditional });
      toast.success("Assigned"); setAssignOpen(false); setAssignAdditional([]); load();
    }
    catch (e) { toast.error(fmtApiError(e)); }
  };
  const addCollab = async () => {
    if (!collabToAdd) return;
    try {
      await api.post(`/tickets/${id}/collaborators`, { technician_ids: [collabToAdd] });
      toast.success("Collaborator added"); setCollabOpen(false); setCollabToAdd(""); load();
    } catch (e) { toast.error(fmtApiError(e)); }
  };
  const removeCollab = async (uid) => {
    try { await api.delete(`/tickets/${id}/collaborators/${uid}`); toast.success("Removed"); load(); }
    catch (e) { toast.error(fmtApiError(e)); }
  };
  const doResolve = async () => {
    if (!rootCause || !resolution) { toast.error("Root cause & resolution required"); return; }
    try {
      await api.post(`/tickets/${id}/resolve`, { root_cause: rootCause, resolution, technician_notes: notes, documentation_complete: docOk });
      toast.success("Resolved"); setResolveOpen(false); load();
    } catch (e) { toast.error(fmtApiError(e)); }
  };
  const doRate = async () => {
    if (!rating) { toast.error("Pick a rating"); return; }
    try { await api.post(`/tickets/${id}/rate`, { rating, feedback }); toast.success("Thank you for your feedback!"); load(); }
    catch (e) { toast.error(fmtApiError(e)); }
  };

  const sla = ticket.sla;

  return (
    <>
      <PageHeader
        eyebrow={ticket.number}
        title={ticket.subject}
        subtitle={<div className="flex items-center gap-3 flex-wrap">
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={ticket.status} />
          <SLAIndicator status={sla.sla_status} />
          {ticket.escalated && (
            <span data-testid="escalated-badge" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-red-400 bg-red-50 text-red-800 text-xs font-bold uppercase tracking-wide">
              ⚡ Escalated
            </span>
          )}
          <span className="text-xs text-slate-500">Weight: <b>{ticket.weight}</b> pt</span>
        </div>}
        actions={<Button variant="ghost" onClick={() => nav(-1)}><ArrowLeft size={14} className="mr-1" /> Back</Button>}
      />
      <PageBody>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-200 shadow-none rounded-md">
              <CardContent className="p-6 space-y-3">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Description</div>
                <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
                {ticket.attachments?.length > 0 && (
                  <div className="pt-3 border-t border-slate-100">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">Attachments</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {ticket.attachments.map((a, i) => (
                        a.type?.startsWith("image/") ? (
                          <button key={i} data-testid={`attach-thumb-${i}`} onClick={() => setLightbox(a)} className="block border border-slate-200 rounded-md overflow-hidden text-left hover:border-slate-500 transition-colors">
                            <img src={a.data} alt={a.name} className="w-full h-24 object-cover" />
                            <div className="text-[10px] text-slate-500 truncate p-1">{a.name}</div>
                          </button>
                        ) : (
                          <div key={i} className="border border-slate-200 rounded p-2 text-xs">{a.name}</div>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {(ticket.resolution || ticket.root_cause) && (
              <Card className="border-emerald-200 shadow-none rounded-md bg-emerald-50/40">
                <CardContent className="p-6 space-y-2">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-700">Resolution</div>
                  <div className="text-xs text-slate-500">Root Cause</div>
                  <p className="text-sm text-slate-800">{ticket.root_cause}</p>
                  <div className="text-xs text-slate-500 mt-2">Action</div>
                  <p className="text-sm text-slate-800">{ticket.resolution}</p>
                  {ticket.technician_notes && <><div className="text-xs text-slate-500 mt-2">Notes</div><p className="text-sm text-slate-700">{ticket.technician_notes}</p></>}
                </CardContent>
              </Card>
            )}

            {ticket.rating && (
              <Card className="border-slate-200 shadow-none rounded-md">
                <CardContent className="p-6">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">Customer Rating</div>
                  <div className="flex items-center gap-2">
                    {[1,2,3,4,5].map(i => <Star key={i} size={20} weight={i <= ticket.rating ? "fill" : "regular"} className={i <= ticket.rating ? "text-amber-500" : "text-slate-300"} />)}
                    <span className="font-display text-2xl font-bold ml-2">{ticket.rating}/5</span>
                  </div>
                  {ticket.feedback && <p className="text-sm text-slate-700 mt-3 italic">&ldquo;{ticket.feedback}&rdquo;</p>}
                </CardContent>
              </Card>
            )}

            <Card className="border-slate-200 shadow-none rounded-md">
              <CardContent className="p-6">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-4">Activity Timeline</div>
                <ol className="space-y-3">
                  {activities.map(a => (
                    <li key={a.id} className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                      <div className="flex-1 border-l border-slate-200 pl-3 pb-3">
                        <div className="text-sm text-slate-900">{a.description}</div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                          <Clock size={12} /> {formatDate(a.timestamp)}
                          {users[a.user_id] && <> · <UserIcon size={12} /> {users[a.user_id].name}</>}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border-slate-200 shadow-none rounded-md">
              <CardContent className="p-5 space-y-3">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">SLA</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><div className="text-xs text-slate-500">Response Target</div><div className="font-semibold tabular-nums">{formatMinutes(sla.response_target)}</div></div>
                  <div><div className="text-xs text-slate-500">Resolution Target</div><div className="font-semibold tabular-nums">{formatMinutes(sla.resolution_target)}</div></div>
                  <div><div className="text-xs text-slate-500">Response</div><div className="font-semibold tabular-nums">{formatMinutes(sla.response_time)}</div></div>
                  <div><div className="text-xs text-slate-500">Resolution</div><div className="font-semibold tabular-nums">{formatMinutes(sla.resolution_time)}</div></div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-none rounded-md">
              <CardContent className="p-5 space-y-3 text-sm">
                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Assignment</div>
                <div>
                  <div className="text-slate-500 text-xs">Primary Technician (PIC)</div>
                  <div className="font-semibold text-slate-900">{users[ticket.technician_id]?.name || "Unassigned"}</div>
                </div>
                {teamIds.length > 1 && (
                  <div>
                    <div className="text-slate-500 text-xs">Collaborators</div>
                    <div className="mt-1 flex flex-wrap gap-1.5" data-testid="collaborators-list">
                      {teamIds.filter(x => x !== ticket.technician_id).map(uid => (
                        <span key={uid} data-testid={`collab-chip-${uid}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-slate-300 bg-slate-50 text-xs">
                          {users[uid]?.name || uid.slice(0, 8)}
                          {canAssign && (
                            <button onClick={() => removeCollab(uid)} data-testid={`collab-remove-${uid}`} className="ml-1 text-slate-400 hover:text-red-600">
                              <X size={11} />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {canAssign && ticket.technician_id && (
                  <Button data-testid="add-collab-btn" size="sm" variant="outline" onClick={() => setCollabOpen(true)} className="w-full">
                    <UserPlus size={12} className="mr-1.5" /> Add Collaborator
                  </Button>
                )}
                <div><span className="text-slate-500 text-xs">Customer:</span> <b>{users[ticket.customer_id]?.name || "-"}</b></div>
                <div><span className="text-slate-500 text-xs">Department:</span> <b>{ticket.department || "-"}</b></div>
                <div><span className="text-slate-500 text-xs">Created:</span> <b>{formatDate(ticket.created_at)}</b></div>
                <div><span className="text-slate-500 text-xs">Reopens:</span> <b>{ticket.reopen_count}</b></div>
              </CardContent>
            </Card>

            {canAssign && (
              <Card className="border-slate-200 shadow-none rounded-md">
                <CardContent className="p-5 space-y-3">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Actions</div>
                  <Button data-testid="assign-btn" onClick={() => setAssignOpen(true)} className="w-full bg-slate-900 hover:bg-slate-800">
                    <UserIcon size={14} className="mr-1.5" /> Assign Technician
                  </Button>
                </CardContent>
              </Card>
            )}

            {canManage && (
              <Card className="border-slate-200 shadow-none rounded-md">
                <CardContent className="p-5 space-y-2">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Change Status</div>
                  <div className="grid grid-cols-2 gap-2">
                    {STATUSES.filter(s => s !== "Closed").map(s => (
                      <Button key={s} data-testid={`status-${s.replace(/\s+/g,"-").toLowerCase()}`} size="sm" variant="outline" onClick={() => changeStatus(s)}>{s}</Button>
                    ))}
                  </div>
                  <Button data-testid="open-resolve-btn" onClick={() => setResolveOpen(true)} className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle size={14} className="mr-1.5" /> Resolve Ticket
                  </Button>
                </CardContent>
              </Card>
            )}

            {canRate && !ticket.rating && (
              <Card className="border-slate-200 shadow-none rounded-md">
                <CardContent className="p-5 space-y-3">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Rate this ticket</div>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => (
                      <button key={i} data-testid={`rate-${i}`} onClick={() => setRating(i)} className="p-1 transition-transform hover:scale-110">
                        <Star size={26} weight={i <= rating ? "fill" : "regular"} className={i <= rating ? "text-amber-500" : "text-slate-300"} />
                      </button>
                    ))}
                  </div>
                  <Textarea data-testid="rate-feedback" placeholder="Feedback (optional)" value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={3} />
                  <Button data-testid="submit-rate" onClick={doRate} className="w-full bg-slate-900 hover:bg-slate-800">Submit Rating</Button>
                </CardContent>
              </Card>
            )}

            {ticket.status === "Resolved" && ["admin","manager","supervisor"].includes(user.role) && (
              <Button data-testid="close-ticket-btn" onClick={() => changeStatus("Closed")} className="w-full">Mark Closed</Button>
            )}
            {ticket.status === "Closed" && ["admin","manager","supervisor"].includes(user.role) && (
              <Button data-testid="reopen-ticket-btn" variant="outline" onClick={() => changeStatus("Reopened")} className="w-full">
                <ArrowsClockwise size={14} className="mr-1.5" /> Reopen Ticket
              </Button>
            )}
          </div>
        </div>
      </PageBody>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent data-testid="assign-dialog">
          <DialogHeader><DialogTitle>Assign Technician</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs uppercase tracking-wider">Primary (PIC) — SLA & rating owner</Label>
              <Select value={assignTo} onValueChange={setAssignTo}>
                <SelectTrigger data-testid="assign-select" className="mt-1.5"><SelectValue placeholder="Select technician" /></SelectTrigger>
                <SelectContent>{technicians.map(t => <SelectItem key={t.id} value={t.id}>{t.name} — {t.department || "-"}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Collaborators (optional)</Label>
              <div className="mt-1.5 border border-slate-200 rounded-md p-2 space-y-1 max-h-40 overflow-y-auto">
                {technicians.filter(t => t.id !== assignTo).map(t => (
                  <label key={t.id} className="flex items-center gap-2 text-sm px-1 py-1 rounded hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      data-testid={`assign-collab-${t.id}`}
                      checked={assignAdditional.includes(t.id)}
                      onChange={(e) => setAssignAdditional(prev => e.target.checked ? [...prev, t.id] : prev.filter(x => x !== t.id))}
                    />
                    <span>{t.name}</span>
                    <span className="text-xs text-slate-500 ml-auto">{t.department || "-"}</span>
                  </label>
                ))}
                {technicians.filter(t => t.id !== assignTo).length === 0 && <div className="text-xs text-slate-500 px-1 py-1">Pick a primary first.</div>}
              </div>
              <div className="text-[11px] text-slate-500 mt-1.5">Weighted KPI points are split equally across all technicians on the ticket.</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAssignOpen(false); setAssignAdditional([]); }}>Cancel</Button>
            <Button data-testid="confirm-assign" onClick={doAssign} className="bg-slate-900">Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={collabOpen} onOpenChange={setCollabOpen}>
        <DialogContent data-testid="collab-dialog">
          <DialogHeader><DialogTitle>Add Collaborator</DialogTitle></DialogHeader>
          <Select value={collabToAdd} onValueChange={setCollabToAdd}>
            <SelectTrigger data-testid="collab-select"><SelectValue placeholder="Select technician" /></SelectTrigger>
            <SelectContent>
              {technicians.filter(t => !teamIds.includes(t.id)).map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name} — {t.department || "-"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCollabOpen(false)}>Cancel</Button>
            <Button data-testid="confirm-add-collab" onClick={addCollab} className="bg-slate-900">Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent data-testid="resolve-dialog" className="max-w-lg">
          <DialogHeader><DialogTitle>Resolve Ticket</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs uppercase tracking-wider">Root Cause</Label>
              <Input data-testid="resolve-rootcause" value={rootCause} onChange={(e) => setRootCause(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Resolution / Action</Label>
              <Textarea data-testid="resolve-action" value={resolution} onChange={(e) => setResolution(e.target.value)} rows={4} className="mt-1.5" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider">Technician Notes</Label>
              <Textarea data-testid="resolve-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1.5" />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" data-testid="resolve-docok" checked={docOk} onChange={(e) => setDocOk(e.target.checked)} />
              Documentation complete
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveOpen(false)}>Cancel</Button>
            <Button data-testid="confirm-resolve" onClick={doResolve} className="bg-emerald-600 hover:bg-emerald-700">Mark Resolved</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {lightbox && (
        <div data-testid="lightbox" onClick={() => setLightbox(null)} className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6 cursor-zoom-out">
          <button data-testid="lightbox-close" onClick={() => setLightbox(null)} className="absolute top-4 right-4 text-white/80 hover:text-white p-2">
            <X size={28} />
          </button>
          <div className="max-w-[90vw] max-h-[90vh] flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.data} alt={lightbox.name} className="max-w-full max-h-[85vh] object-contain rounded border border-white/10" />
            <div className="text-white/70 text-sm font-mono">{lightbox.name} · {(lightbox.size / 1024).toFixed(0)} KB</div>
          </div>
        </div>
      )}
    </>
  );
}
