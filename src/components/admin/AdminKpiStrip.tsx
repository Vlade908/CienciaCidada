'use client';

import React from 'react';

interface AdminKpiStripProps {
  totalActiveClusters?: number;
  totalCitizenReports?: number;
  criticalClustersCount?: number;
  resolvedThisMonthCount?: number;
  averageResolutionHours?: number;
  inRouteCount?: number;
}

export function AdminKpiStrip({
  totalActiveClusters = 14,
  totalCitizenReports = 48,
  criticalClustersCount = 4,
  resolvedThisMonthCount = 19,
  averageResolutionHours = 14.5,
  inRouteCount = 3,
}: AdminKpiStripProps) {
  return (
    <section 
      aria-label="Indicadores operacionais silenciosos"
      className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-6 py-3.5 grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-zinc-800 shrink-0 select-none transition-colors"
    >
      {/* Coluna 1: Focos em Aberto */}
      <div className="pb-2 md:pb-0 md:pr-5">
        <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-zinc-400">
          Focos em Aberto
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100 tabular-nums">
            {String(totalActiveClusters).padStart(2, '0')}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
            {totalCitizenReports} chamados unificados
          </span>
        </div>
      </div>

      {/* Coluna 2: Críticos >= 75% */}
      <div className="py-2 md:py-0 md:px-5">
        <div className="text-[11px] font-medium uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-500" />
          <span>Críticos ≥ 75%</span>
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight text-rose-600 dark:text-rose-400 tabular-nums">
            {String(criticalClustersCount).padStart(2, '0')}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-zinc-400">
            Risco hídrico / escoamento
          </span>
        </div>
      </div>

      {/* Coluna 3: Em Rota / Despacho */}
      <div className="py-2 md:py-0 md:px-5">
        <div className="text-[11px] font-medium uppercase tracking-wider text-amber-700 dark:text-amber-400">
          Em Rota / Despacho
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100 tabular-nums">
            {String(inRouteCount).padStart(2, '0')}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-zinc-400">
            Equipes em atendimento
          </span>
        </div>
      </div>

      {/* Coluna 4: Limpos (24h / Mês) */}
      <div className="pt-2 md:pt-0 md:pl-5">
        <div className="text-[11px] font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          Limpos (24h / Mês)
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100 tabular-nums">
            {String(resolvedThisMonthCount).padStart(2, '0')}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
            ~{averageResolutionHours}h tempo médio
          </span>
        </div>
      </div>
    </section>
  );
}
