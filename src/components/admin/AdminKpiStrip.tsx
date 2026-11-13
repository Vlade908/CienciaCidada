'use client';

import React from 'react';
import { 
  Flame, 
  Layers, 
  CheckCircle2, 
  TrendingDown, 
  AlertTriangle,
  Clock3
} from 'lucide-react';

interface AdminKpiStripProps {
  totalActiveClusters?: number;
  totalCitizenReports?: number;
  criticalClustersCount?: number;
  resolvedThisMonthCount?: number;
  averageResolutionHours?: number;
}

export function AdminKpiStrip({
  totalActiveClusters = 12,
  totalCitizenReports = 74,
  criticalClustersCount = 3,
  resolvedThisMonthCount = 18,
  averageResolutionHours = 14.5,
}: AdminKpiStripProps) {
  const noiseReductionPercentage = totalCitizenReports > 0 && totalActiveClusters > 0
    ? Math.max(0, Math.round(((totalCitizenReports - totalActiveClusters) / totalCitizenReports) * 100))
    : 84;

  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/80 backdrop-blur px-4 py-2.5 shrink-0 z-20 transition-colors">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Card 1: Focos Ativos na Cidade */}
        <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors rounded-xl p-3 flex items-center justify-between shadow-2xs">
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Focos no Mapa
            </span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">
                {totalActiveClusters}
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">chamados abertos</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700 dark:text-amber-400">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        {/* Card 2: Relatos de Cidadãos & Deduplicação */}
        <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 hover:border-emerald-500/40 dark:hover:border-emerald-500/30 transition-colors rounded-xl p-3 flex items-center justify-between group shadow-2xs">
          <div className="flex flex-col">
            <div className="flex items-center space-x-1">
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Relatos Populares
              </span>
              <span className="px-1 py-0.2 text-[9px] font-mono font-semibold text-emerald-800 dark:text-emerald-400 bg-emerald-500/10 rounded border border-emerald-500/20 flex items-center gap-0.5">
                <TrendingDown className="w-2.5 h-2.5" /> -{noiseReductionPercentage}%
              </span>
            </div>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
                {totalCitizenReports}
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">viraram {totalActiveClusters} rotas</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 group-hover:scale-105 transition-transform">
            <Flame className="w-4 h-4" />
          </div>
        </div>

        {/* Card 3: Focos de Alta Prioridade */}
        <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 hover:border-red-500/40 dark:hover:border-red-500/30 transition-colors rounded-xl p-3 flex items-center justify-between shadow-2xs">
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              Alta Gravidade
            </span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-xl font-bold text-red-700 dark:text-red-400 font-mono tabular-nums">
                {criticalClustersCount}
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">córregos / grande volume</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-700 dark:text-red-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        {/* Card 4: Focos Resolvidos & SLA */}
        <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors rounded-xl p-3 flex items-center justify-between shadow-2xs">
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Limpezas Concluídas
            </span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100 font-mono tabular-nums">
                {resolvedThisMonthCount}
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono flex items-center gap-0.5">
                <Clock3 className="w-2.5 h-2.5 text-zinc-400 dark:text-zinc-500" /> ~{averageResolutionHours}h SLA
              </span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-700 dark:text-violet-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
