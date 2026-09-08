import React, { useEffect, useState } from "react";
import api, { fmtApiError } from "@/lib/api";
import { PageHeader, PageBody } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus } from "@phosphor-icons/react";

const ROLES = ["admin", "manager", "supervisor", "technician", "customer"];

function UserList({ filterRole, title }) {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", username: "", name: "", password: "", role: filterRole || "technician", department: "", phone: "" });

  const load = async () => {
    const p = filterRole ? { role: filterRole } : {};
    const { data } = await api.get("/users", { params: p });
    setRows(data);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filterRole]);

  const submit = async () => {
    try {
      await api.post("/users", form);
      toast.success("User created");
      setOpen(false);
      setForm({ email: "", username: "", name: "", password: "", role: filterRole || "technician", department: "", phone: "" });
      load();
    } catch (e) { toast.error(fmtApiError(e)); }
  };
  const toggleActive = async (u) => {
    try { await api.patch(`/users/${u.id}`, { active: !u.active }); toast.success("Updated"); load(); }
    catch (e) { toast.error(fmtApiError(e)); }
  };

  return (
    <>
      <PageHeader
        eyebrow="Directory"
        title={title}
        actions={<Button data-testid="add-user-btn" onClick={() => setOpen(true)} className="bg-slate-900"><Plus size={14} className="mr-1" /> Add {filterRole || "User"}</Button>}
      />
      <PageBody>
        <Card className="border-slate-200 shadow-none rounded-md">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="text-[10px] uppercase tracking-widest">Name</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest">Email</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest">Username</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest">Role</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest">Department</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest">Status</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(u => (
                <TableRow key={u.id} data-testid={`user-row-${u.username}`}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-sm text-slate-600">{u.email}</TableCell>
                  <TableCell className="font-mono text-xs">{u.username}</TableCell>
                  <TableCell><span className="text-[10px] uppercase tracking-wider px-2 py-0.5 border border-slate-300 rounded">{u.role}</span></TableCell>
                  <TableCell className="text-sm">{u.department || "-"}</TableCell>
                  <TableCell><span className={`text-xs font-semibold ${u.active === false ? "text-red-600" : "text-emerald-600"}`}>{u.active === false ? "Disabled" : "Active"}</span></TableCell>
                  <TableCell className="text-right">
                    <Button data-testid={`toggle-${u.username}`} size="sm" variant="outline" onClick={() => toggleActive(u)}>{u.active === false ? "Enable" : "Disable"}</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </PageBody>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-testid="user-form-dialog">
          <DialogHeader><DialogTitle>New {filterRole || "User"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Name</Label><Input data-testid="uf-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label className="text-xs">Email</Label><Input data-testid="uf-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label className="text-xs">Username</Label><Input data-testid="uf-username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
            <div><Label className="text-xs">Password</Label><Input data-testid="uf-password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <div>
              <Label className="text-xs">Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger data-testid="uf-role"><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Department</Label><Input data-testid="uf-dept" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
            <div className="col-span-2"><Label className="text-xs">Phone</Label><Input data-testid="uf-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button data-testid="uf-submit" onClick={submit} className="bg-slate-900">Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default UserList;
