import React, { useEffect, useState } from "react";
import api, { fmtApiError } from "@/lib/api";
import { PageHeader, PageBody } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash } from "@phosphor-icons/react";

export default function Categories() {
  const [rows, setRows] = useState([]);
  const [name, setName] = useState("");
  const [subs, setSubs] = useState("");

  const load = async () => setRows((await api.get("/categories")).data);
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name.trim()) return;
    try {
      await api.post("/categories", { name, subcategories: subs.split(",").map(s => s.trim()).filter(Boolean) });
      toast.success("Category added"); setName(""); setSubs(""); load();
    } catch (e) { toast.error(fmtApiError(e)); }
  };
  const remove = async (id) => {
    try { await api.delete(`/categories/${id}`); toast.success("Deleted"); load(); }
    catch (e) { toast.error(fmtApiError(e)); }
  };

  return (
    <>
      <PageHeader eyebrow="Taxonomy" title="Categories & Subcategories" subtitle="Organize tickets by category and subcategory." />
      <PageBody>
        <Card className="border-slate-200 shadow-none rounded-md">
          <CardContent className="p-5 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-3">
              <div><Label className="text-xs uppercase">Name</Label><Input data-testid="cat-name" value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><Label className="text-xs uppercase">Subcategories (comma-separated)</Label><Input data-testid="cat-subs" value={subs} onChange={(e) => setSubs(e.target.value)} /></div>
              <Button data-testid="cat-add" onClick={create} className="bg-slate-900 self-end"><Plus size={14} className="mr-1"/>Add</Button>
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map(c => (
            <Card key={c.id} className="border-slate-200 shadow-none rounded-md">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="font-display font-semibold text-slate-900">{c.name}</div>
                  <Button data-testid={`del-cat-${c.name}`} size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash size={14} /></Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {c.subcategories.map(s => <span key={s} className="text-xs px-2 py-0.5 border border-slate-200 rounded">{s}</span>)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </PageBody>
    </>
  );
}
