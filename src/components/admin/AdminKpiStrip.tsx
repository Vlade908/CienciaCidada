'use client';

import React from 'react';
import { 
  TrendingDown, 
  Clock3,
  AlertTriangle,
  Layers,
  Truck,
  CheckCircle2
} from 'lucide-react';

interface AdminKpiStripProps {
  totalActiveClusters?: number;
  totalCitizenReports?: number;
  criticalClustersCount?: number;
  resolvedThisMonthCount?: number;
  averageResolutionHours?: number;
  inRouteCount?: number;
}

export function AdminKpiStrip({
  totalActiveClusters = 12,
  totalCitizenReports = 74,
  criticalClustersCount = 3,
  resolvedThisMonthCount = 18,
  averageResolutionHours = 14.5,
  inRouteCount,
}: AdminKpiStripProps) {
  const noiseReductionPercentage = totalCitizenReports > 0 && totalActiveClusters > 0
    ? Math.max(0, Math.round(((totalCitizenReports - totalActiveClusters) / totalCitizenReports) * 100))
    : 84;

  const calculatedInRoute = inRouteCount ?? Math.max(0, Math.min(Math.round(totalActiveClusters * 0.3), totalActiveClusters));

  return (
    <section 
      aria-label="Indicadores operacionais silenciosos"
      className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-zinc-800 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/95 px-6 py-3 shrink-0 z-10 transition-colors"
    >
      {/* Métrica 1: Focos em Aberto */}
      <div className="py-1.5 md:py-0 md:pr-6 flex flex-col justify-center">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
          <Layers className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
          <span>Focos em Aberto</span>
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 font-mono tabular-nums">
            {String(totalActiveClusters).padStart(2, '0')}
          </span>
          <span className="text-xs text-slate-600 dark:text-zinc-400 font-mono">
            {totalCitizenReports} chamados unificados
          </span>
          <span className="hidden lg:inline-flex items-center text-[10px] font-mono font-medium text-emerald-800 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-1 py-0.5 rounded border border-emerald-500/20">
            <TrendingDown className="w-2.5 h-2.5 mr-0.5" /> -{noiseReductionPercentage}% ruído
          </span>
        </div>
      </div>

      {/* Métrica 2: Críticos >= 75% */}
      <div className="py-1.5 md:py-0 md:px-6 flex flex-col justify-center">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          <span>Críticos ≥ 75%</span>
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-rose-700 dark:text-rose-400 font-mono tabular-nums">
            {String(criticalClustersCount).padStart(2, '0')}
          </span>
          <span className="text-xs text-slate-600 dark:text-zinc-400">
            Risco hídrico / escoamento
          </span>
        </div>
      </div>

      {/* Métrica 3: Em Rota / Despacho */}
      <div className="py-1.5 md:py-0 md:px-6 flex flex-col justify-center">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
          <Truck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>Em Rota / Despacho</span>
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 font-mono tabular-nums">
            {String(calculatedInRoute).padStart(2, '0')}
          </span>
          <span className="text-xs text-slate-600 dark:text-zinc-400">
            Equipes em atendimento
          </span>
        </div>
      </div>

      {/* Métrica 4: Limpos Concluídos */}
      <div className="py-1.5 md:py-0 md:pl-6 flex flex-col justify-center">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Limpos (24h / Mês)</span>
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 font-mono tabular-nums">
            {String(resolvedThisMonthCount).padStart(2, '0')}
          </span>
          <span className="text-xs text-slate-600 dark:text-zinc-400 font-mono flex items-center gap-1">
            <Clock3 className="w-3 h-3 text-slate-500 dark:text-zinc-500" /> ~{averageResolutionHours}h SLA
          </span>
        </div>
      </div>
    </section>
  );
}
