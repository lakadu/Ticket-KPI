import React from "react";

export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="border-b border-slate-200 bg-white px-8 py-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">{eyebrow}</div>}
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">{title}</h1>
        {subtitle && <div className="text-sm text-slate-600 mt-1">{subtitle}</div>}
      </div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function PageBody({ children }) {
  return <div className="p-8 space-y-6">{children}</div>;
}
