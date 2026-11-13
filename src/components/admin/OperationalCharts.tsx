'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { TrendingDown, BarChart3, PieChart as PieIcon } from 'lucide-react';

interface OperationalChartsProps {
  totalActiveClusters: number;
  totalCitizenReports: number;
  criticalCount: number;
  mediumCount: number;
  smallCount: number;
  cleanedCount: number;
}

export function OperationalCharts({
  totalActiveClusters,
  totalCitizenReports,
  criticalCount,
  mediumCount,
  smallCount,
  cleanedCount,
}: OperationalChartsProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const deduplicationData = [
    {
      categoria: 'Demandas Totais',
      'Relatos Brutos da População': totalCitizenReports,
      'Ordens de Serviço Otimizadas': totalActiveClusters,
    },
  ];

  const scaleDistribution = [
    { name: 'Crítico / Grande (Caçamba)', value: Math.max(criticalCount, 1), color: '#ef4444' },
    { name: 'Médio (Porta-malas / Móveis)', value: Math.max(mediumCount, 1), color: '#f59e0b' },
    { name: 'Pequeno (Sacos avulsos)', value: Math.max(smallCount, 1), color: '#10b981' },
    { name: 'Resolvidos / Limpos', value: Math.max(cleanedCount, 0), color: '#8b5cf6' },
  ].filter((item) => item.value > 0);

  const noiseReduction = totalCitizenReports > 0
    ? Math.max(0, Math.round(((totalCitizenReports - totalActiveClusters) / totalCitizenReports) * 100))
    : 85;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      {/* Gráfico 1: O Impacto da Deduplicação Espacial */}
      <div className="lg:col-span-2 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between shadow-2xs transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
                Inteligência de Agrupamento Espacial
                <span className="text-[10px] normal-case font-mono font-medium text-emerald-800 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" /> -{noiseReduction}% Deslocamentos Desnecessários
                </span>
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                O motor PostGIS agrupa automaticamente denúncias repetidas num raio de 25 metros.
              </p>
            </div>
          </div>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={deduplicationData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#e4e4e7'} horizontal={false} />
              <XAxis type="number" stroke={isDark ? '#71717a' : '#71717a'} fontSize={11} tickLine={false} />
              <YAxis type="category" dataKey="categoria" hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#18181b' : '#ffffff',
                  borderColor: isDark ? '#27272a' : '#e4e4e7',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: isDark ? '#fafafa' : '#09090b',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
                }}
                cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                iconType="circle"
              />
              <Bar
                dataKey="Relatos Brutos da População"
                fill="#f59e0b"
                radius={[0, 4, 4, 0]}
                barSize={24}
              />
              <Bar
                dataKey="Ordens de Serviço Otimizadas"
                fill="#10b981"
                radius={[0, 4, 4, 0]}
                barSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico 2: Composição de Resíduos por Severidade */}
      <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between shadow-2xs transition-colors">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-7 h-7 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-700 dark:text-blue-400">
            <PieIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Composição da Fila
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Distribuição por gravidade e porte
            </p>
          </div>
        </div>

        <div className="h-44 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={scaleDistribution}
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={60}
                paddingAngle={4}
                dataKey="value"
              >
                {scaleDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#18181b' : '#ffffff',
                  borderColor: isDark ? '#27272a' : '#e4e4e7',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: isDark ? '#fafafa' : '#09090b',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legenda Customizada Minimalista */}
        <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-zinc-200/80 dark:border-zinc-800/80 text-[10px] text-zinc-600 dark:text-zinc-400 font-medium">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="truncate">Crítico / Grande</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="truncate">Médio Porte</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="truncate">Pequeno</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="truncate">Limpos</span>
          </div>
        </div>
      </div>
    </div>
  );
}
