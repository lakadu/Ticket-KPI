export function formatDate(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}

export function formatDateShort(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatMinutes(m) {
  if (m == null) return "-";
  if (m < 60) return `${Math.round(m)}m`;
  if (m < 1440) return `${(m / 60).toFixed(1)}h`;
  return `${(m / 1440).toFixed(1)}d`;
}

export const STATUS_COLORS = {
  Open: "bg-slate-100 text-slate-800 border-slate-300",
  Assigned: "bg-blue-50 text-blue-800 border-blue-300",
  "On Progress": "bg-indigo-50 text-indigo-800 border-indigo-300",
  Pending: "bg-amber-50 text-amber-800 border-amber-300",
  Resolved: "bg-emerald-50 text-emerald-800 border-emerald-300",
  Closed: "bg-slate-800 text-white border-slate-800",
  Reopened: "bg-rose-50 text-rose-800 border-rose-300",
};

export const PRIORITY_COLORS = {
  Low: "bg-slate-100 text-slate-700 border-slate-300",
  Medium: "bg-sky-50 text-sky-800 border-sky-300",
  High: "bg-orange-50 text-orange-800 border-orange-300",
  Critical: "bg-red-50 text-red-800 border-red-300",
};

export const SLA_COLORS = {
  on_track: "bg-emerald-500",
  met: "bg-emerald-500",
  warning: "bg-amber-500",
  violated: "bg-red-500",
};

export const SLA_LABELS = {
  on_track: "On Track",
  met: "SLA Met",
  warning: "Warning",
  violated: "SLA Violation",
};
