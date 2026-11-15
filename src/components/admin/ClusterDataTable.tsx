'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Layers, 
  MoreVertical, 
  FileText, 
  Map as MapIcon, 
  CheckCircle2 
} from 'lucide-react';

export interface ClusterRecord {
  id: string;
  protocol_code: string;
  status: 'OPEN' | 'TRIAGED' | 'IN_ROUTE' | 'CLEANED' | 'ARCHIVED';
  dominant_scale: 'SMALL' | 'MEDIUM' | 'LARGE';
  waste_tags?: string[];
  confirmations_count: number;
  priority_score: number;
  is_eco_critical?: boolean;
  address_reference?: string;
  sample_photo_url: string;
  cleaned_photo_url?: string;
  first_reported_at: string;
  last_reported_at: string;
  cleaned_at?: string;
}

interface ClusterDataTableProps {
  clusters: ClusterRecord[];
  selectedClusterId?: string;
  onSelectCluster: (cluster: ClusterRecord) => void;
  onResolveClean?: (cluster: ClusterRecord) => void;
}

export function ClusterDataTable({
  clusters,
  selectedClusterId,
  onSelectCluster,
  onResolveClean,
}: ClusterDataTableProps) {
  const [openMenuClusterId, setOpenMenuClusterId] = useState<string | null>(null);

  // Fecha o menu flutuante ao clicar fora ou pressionar ESC
  useEffect(() => {
    if (!openMenuClusterId) return;

    const handleClickOutside = () => setOpenMenuClusterId(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenuClusterId(null);
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenuClusterId]);

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return 'há menos de 1h';
      if (diffHours === 1) return 'há 1h';
      if (diffHours < 24) return `há ${diffHours}h`;
      const diffDays = Math.floor(diffHours / 24);
      return `há ${diffDays}d`;
    } catch {
      return 'recente';
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-white dark:bg-zinc-900 select-none">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-slate-50/80 dark:bg-zinc-950/80 border-b border-slate-200 dark:border-zinc-800 text-[11px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-xs">
          <tr>
            <th className="py-2.5 px-3.5">Protocolo</th>
            <th className="py-2.5 px-3.5">Endereço &amp; Referência</th>
            <th className="py-2.5 px-3.5">Escala Dominante</th>
            <th className="py-2.5 px-3.5">Agrupamento</th>
            <th className="py-2.5 px-3.5">Prioridade</th>
            <th className="py-2.5 px-3.5">Status</th>
            <th className="py-2.5 px-3.5 text-right w-14">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-sans">
          {clusters.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-16 text-center text-slate-500 dark:text-zinc-400">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <Layers className="w-8 h-8 text-slate-300 dark:text-zinc-600" />
                  <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                    Nenhum foco de resíduo encontrado.
                  </p>
                  <p className="text-xs text-slate-500 dark:text-zinc-500 max-w-sm">
                    Nenhum registro corresponde aos filtros selecionados ou à busca informada.
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            clusters.map((cluster) => {
              const priorityPercent = Math.round(Math.min(cluster.priority_score, 100));
              const isCritical = priorityPercent >= 75 || cluster.is_eco_critical;
              const isMedium = priorityPercent >= 40 && priorityPercent < 75;
              const isCleaned = cluster.status === 'CLEANED';
              const isSelected = selectedClusterId === cluster.id;
              const isMenuOpen = openMenuClusterId === cluster.id;

              const scaleLabel = {
                LARGE: 'Caçamba (Grande)',
                MEDIUM: 'Porta-malas (Médio)',
                SMALL: 'Sacos (Pequeno)',
              }[cluster.dominant_scale] || cluster.dominant_scale;

              const wasteSubtitle = (cluster.waste_tags && cluster.waste_tags.length > 0)
                ? cluster.waste_tags.join(' & ')
                : (isCritical ? 'Entulho de alvenaria' : 'Resíduos diversos');

              const statusConfig = {
                OPEN: { label: 'Aberto', dot: 'bg-rose-600', text: 'text-rose-700 dark:text-rose-400' },
                IN_ROUTE: { label: 'Em Rota', dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400' },
                TRIAGED: { label: 'Triado', dot: 'bg-slate-400', text: 'text-slate-600 dark:text-zinc-400' },
                CLEANED: { label: 'Limpo', dot: 'bg-emerald-600', text: 'text-emerald-700 dark:text-emerald-400' },
                ARCHIVED: { label: 'Arquivado', dot: 'bg-slate-300', text: 'text-slate-500 dark:text-zinc-500' },
              }[cluster.status] || { label: cluster.status, dot: 'bg-slate-400', text: 'text-slate-600' };

              return (
                <tr
                  key={cluster.id}
                  onClick={() => onSelectCluster(cluster)}
                  className={`transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-l-2 border-emerald-600'
                      : 'hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 border-l-2 border-transparent'
                  } ${isCleaned ? 'opacity-80' : ''}`}
                >
                  {/* Célula 1: Protocolo Monospace Limpo */}
                  <td className="py-2.5 px-3.5 font-mono text-[11px] font-semibold text-slate-900 dark:text-zinc-100 whitespace-nowrap">
                    {cluster.protocol_code}
                  </td>

                  {/* Célula 2: Endereço & Referência */}
                  <td className="py-2.5 px-3.5 max-w-xs">
                    <div className="font-medium text-slate-900 dark:text-zinc-100 leading-tight truncate">
                      {cluster.address_reference || 'Local georreferenciado via GPS'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                      {cluster.is_eco_critical && (
                        <>
                          <span className="text-rose-700 dark:text-rose-400 font-medium">
                            Margem de Córrego (Risco Hídrico)
                          </span>
                          <span className="text-slate-400">•</span>
                        </>
                      )}
                      <span>{formatTimeAgo(cluster.first_reported_at)}</span>
                    </div>
                  </td>

                  {/* Célula 3: Escala Dominante */}
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    <span className="text-slate-800 dark:text-zinc-200 font-medium">
                      {scaleLabel}
                    </span>
                    <div className="text-[11px] text-slate-400 dark:text-zinc-500 truncate max-w-[140px]">
                      {wasteSubtitle}
                    </div>
                  </td>

                  {/* Célula 4: Agrupamento */}
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    <span className="font-mono text-slate-700 dark:text-zinc-300 font-medium">
                      {cluster.confirmations_count} {cluster.confirmations_count === 1 ? 'relato' : 'relatos'}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-zinc-500 ml-1 font-mono">
                      (r={cluster.confirmations_count > 1 ? '18.4m' : '≤25m'})
                    </span>
                  </td>

                  {/* Célula 5: Prioridade */}
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono font-medium tabular-nums ${
                          isCritical
                            ? 'text-rose-700 dark:text-rose-400'
                            : isMedium
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-slate-600 dark:text-zinc-400'
                        }`}
                      >
                        {priorityPercent}%
                      </span>
                      <div className="w-10 h-1 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            isCritical ? 'bg-rose-600' : isMedium ? 'bg-amber-500' : 'bg-slate-400'
                          }`}
                          style={{ width: `${priorityPercent}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Célula 6: Status */}
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 font-medium ${statusConfig.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                      {statusConfig.label}
                    </span>
                  </td>

                  {/* Célula 7: Ações com Ícone de 3 Pontinhos e Menu com Ícones */}
                  <td className="relative py-2.5 px-3.5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuClusterId((prev) => (prev === cluster.id ? null : cluster.id));
                      }}
                      className={`p-1 rounded transition-colors inline-flex items-center justify-center ${
                        isMenuOpen
                          ? 'bg-slate-200 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100'
                          : 'text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
                      }`}
                      title="Opções do chamado"
                      aria-label={`Opções para o protocolo ${cluster.protocol_code}`}
                      aria-expanded={isMenuOpen}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Menu Popover Flutuante com Ícones */}
                    {isMenuOpen && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-3.5 top-9 w-44 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100 text-left divide-y divide-slate-100 dark:divide-zinc-800"
                        role="menu"
                      >
                        <div className="py-0.5">
                          {/* Opção Detalhes */}
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setOpenMenuClusterId(null);
                              onSelectCluster(cluster);
                            }}
                            className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2 transition-colors font-medium"
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>Ver Detalhes</span>
                          </button>

                          {/* Opção Mapa */}
                          <Link
                            href={`/admin/map?clusterId=${cluster.id}`}
                            role="menuitem"
                            onClick={() => setOpenMenuClusterId(null)}
                            className="w-full px-3 py-1.5 text-xs text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-2 transition-colors font-medium"
                          >
                            <MapIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span>Ver no Mapa</span>
                          </Link>
                        </div>

                        {/* Opção Marcar como Limpo (se ainda estiver pendente) */}
                        {!isCleaned && onResolveClean && (
                          <div className="py-0.5">
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setOpenMenuClusterId(null);
                                onResolveClean(cluster);
                              }}
                              className="w-full px-3 py-1.5 text-xs text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center gap-2 transition-colors font-medium"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>Marcar como Limpo</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
