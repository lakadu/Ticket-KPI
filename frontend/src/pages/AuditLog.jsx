import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { PageHeader, PageBody } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";

export default function AuditLog() {
  const [rows, setRows] = useState([]);
  useEffect(() => { api.get("/audit-logs").then(r => setRows(r.data)); }, []);
  return (
    <>
      <PageHeader eyebrow="Compliance" title="Audit Log" subtitle="All critical actions across the system." />
      <PageBody>
        <Card className="border-slate-200 shadow-none rounded-md">
          <Table data-testid="audit-table">
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="text-[10px] uppercase tracking-widest">Timestamp</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest">User</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest">Action</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest">Entity</TableHead>
                <TableHead className="text-[10px] uppercase tracking-widest">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs font-mono">{formatDate(r.timestamp)}</TableCell>
                  <TableCell className="text-sm">{r.user_name}</TableCell>
                  <TableCell className="text-xs uppercase tracking-wider font-semibold">{r.action}</TableCell>
                  <TableCell className="text-sm">{r.entity}</TableCell>
                  <TableCell className="text-xs text-slate-600 font-mono">{JSON.stringify(r.meta)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </PageBody>
    </>
  );
}
