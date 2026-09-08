import React from "react";
import { STATUS_COLORS, PRIORITY_COLORS, SLA_COLORS, SLA_LABELS } from "@/lib/format";

export function StatusBadge({ status }) {
  const cls = STATUS_COLORS[status] || "bg-slate-100 text-slate-700 border-slate-300";
  return (
    <span data-testid={`status-badge-${status}`} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-semibold uppercase tracking-wide ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const cls = PRIORITY_COLORS[priority] || PRIORITY_COLORS.Medium;
  return (
    <span data-testid={`priority-badge-${priority}`} className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-bold uppercase tracking-wide ${cls}`}>
      {priority}
    </span>
  );
}

export function SLAIndicator({ status }) {
  const dot = SLA_COLORS[status] || "bg-slate-400";
  const label = SLA_LABELS[status] || status;
  return (
    <span data-testid={`sla-indicator-${status}`} className="inline-flex items-center gap-2 text-xs font-medium">
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      <span className="text-slate-700">{label}</span>
    </span>
  );
}
