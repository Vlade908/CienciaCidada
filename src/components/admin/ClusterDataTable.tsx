'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Map as MapIcon, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  Check,
  Droplets, 
  Clock, 
  Layers,
  Eye,
  FileText,
  Download,
  CameraOff
} from 'lucide-react';
import { PhotoPreviewModal } from './PhotoPreviewModal';

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
  onResolveClean: (cluster: ClusterRecord) => void;
  onSelectCluster?: (cluster: ClusterRecord) => void;
  onOpenPhotoPreview?: (photoUrl: string, title: string) => void;
  onRefreshData?: () => void;
  onExportCSV?: () => void;
}

export function ClusterDataTable({
  clusters,
  selectedClusterId,
  onResolveClean,
  onSelectCluster,
  onOpenPhotoPreview,
  onRefreshData,
  onExportCSV,
}: ClusterDataTableProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CRITICAL' | 'CLEANED'>('ACTIVE');
  
  // Modal interno de foto se não houver handler externo
  const [localPhotoPreview, setLocalPhotoPreview] = useState<{ url: string; title: string } | null>(null);

  // Contagens dinâmicas para as abas segmentadas
  const counts = useMemo(() => {
    return {
      active: clusters.filter((c) => c.status !== 'CLEANED').length,
      critical: clusters.filter((c) => c.priority_score >= 75 || c.is_eco_critical).length,
      cleaned: clusters.filter((c) => c.status === 'CLEANED').length,
      total: clusters.length,
    };
  }, [clusters]);

  // Filtra e ordena os clusters (Padrão: Maior Prioridade no Topo)
  const filteredClusters = useMemo(() => {
    return clusters
      .filter((c) => {
        if (statusFilter === 'ACTIVE' && c.status === 'CLEANED') return false;
        if (statusFilter === 'CLEANED' && c.status !== 'CLEANED') return false;
        if (statusFilter === 'CRITICAL' && (c.priority_score < 75 && !c.is_eco_critical)) return false;

        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchCode = c.protocol_code.toLowerCase().includes(term);
          const matchAddress = (c.address_reference || '').toLowerCase().includes(term);
          const matchTags = (c.waste_tags || []).some((t) => t.toLowerCase().includes(term));
          return matchCode || matchAddress || matchTags;
        }

        return true;
      })
      .sort((a, b) => b.priority_score - a.priority_score);
  }, [clusters, searchTerm, statusFilter]);

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

  const handleTriggerPhoto = (url: string, title: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!url) return;
    if (onOpenPhotoPreview) {
      onOpenPhotoPreview(url, title);
    } else {
      setLocalPhotoPreview({ url, title });
    }
  };

  const handleDefaultExportCSV = () => {
    if (onExportCSV) {
      onExportCSV();
      return;
    }
    const headers = [
      'Protocolo',
      'Status',
      'Porte',
      'Prioridade (%)',
      'Confirmacoes',
      'Endereco',
      'Primeiro Relato',
      'Ultimo Relato',
    ];
    const rows = filteredClusters.map((c) => [
      c.protocol_code,
      c.status,
      c.dominant_scale,
      c.priority_score,
      c.confirmations_count,
      `"${(c.address_reference || '').replace(/"/g, '""')}"`,
      c.first_reported_at,
      c.last_reported_at,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ecocidadao_focos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border-x border-b border-slate-200 dark:border-zinc-800 transition-colors">
      
      {/* SECONDARY UTILITY BAR STITCH (48px) */}
      <div className="px-4 py-2.5 border-b border-slate-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-2.5 bg-slate-50/70 dark:bg-zinc-950/40 shrink-0">
        
        {/* Campo de Busca Minimalista */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar por protocolo, via ou material..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md text-slate-900 dark:text-zinc-100 placeholder-slate-500 dark:placeholder-zinc-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 shadow-2xs font-sans"
          />
        </div>

        {/* Abas de Filtros Segmentadas & Ação CSV */}
        <div className="flex items-center justify-between md:justify-end gap-2 overflow-x-auto select-none">
          <div className="flex items-center space-x-1 bg-slate-200/60 dark:bg-zinc-800/70 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                statusFilter === 'ACTIVE'
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-2xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
              }`}
            >
              Focos Ativos ({counts.active})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('CRITICAL')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center space-x-1 ${
                statusFilter === 'CRITICAL'
                  ? 'bg-white dark:bg-zinc-900 text-rose-700 dark:text-rose-400 shadow-2xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
              <span>Críticos ({counts.critical})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('CLEANED')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center space-x-1 ${
                statusFilter === 'CLEANED'
                  ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Limpos ({counts.cleaned})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-2xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
              }`}
            >
              Todos ({counts.total})
            </button>
          </div>

          {/* Botão Exportar CSV */}
          <button
            type="button"
            onClick={handleDefaultExportCSV}
            className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs"
            title="Exportar registros filtrados em arquivo CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* TABELA DE TRIAGEM ESTILO STITCH */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50/90 dark:bg-zinc-950/80 sticky top-0 z-10 border-b border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 font-mono uppercase text-[10px] tracking-wider select-none backdrop-blur-xs">
            <tr>
              <th className="py-2.5 px-3.5 font-semibold">Protocolo & Foto</th>
              <th className="py-2.5 px-3.5 font-semibold">Endereço & Referência</th>
              <th className="py-2.5 px-3.5 font-semibold">Porte</th>
              <th className="py-2.5 px-3.5 font-semibold">Agrupamento</th>
              <th className="py-2.5 px-3.5 font-semibold">Prioridade</th>
              <th className="py-2.5 px-3.5 font-semibold">Status</th>
              <th className="py-2.5 px-3.5 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-sans">
            {filteredClusters.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center text-slate-500 dark:text-zinc-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Layers className="w-8 h-8 text-slate-400 dark:text-zinc-600" />
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
              filteredClusters.map((cluster) => {
                const priorityPercent = Math.round(Math.min(cluster.priority_score, 100));
                const isCritical = priorityPercent >= 75 || cluster.is_eco_critical;
                const isMedium = priorityPercent >= 40 && priorityPercent < 75;
                const isCleaned = cluster.status === 'CLEANED';
                const photoToDisplay = isCleaned && cluster.cleaned_photo_url ? cluster.cleaned_photo_url : cluster.sample_photo_url;
                const isSelected = selectedClusterId === cluster.id;

                const statusDot = {
                  OPEN: 'bg-amber-500',
                  TRIAGED: 'bg-blue-500',
                  IN_ROUTE: 'bg-purple-500',
                  CLEANED: 'bg-emerald-500',
                  ARCHIVED: 'bg-slate-400',
                }[cluster.status] || 'bg-slate-400';

                const statusLabel = {
                  OPEN: 'Aberto',
                  TRIAGED: 'Triado',
                  IN_ROUTE: 'Em Rota',
                  CLEANED: 'Limpo',
                  ARCHIVED: 'Arquivado',
                }[cluster.status] || cluster.status;

                return (
                  <tr
                    key={cluster.id}
                    onClick={() => onSelectCluster && onSelectCluster(cluster)}
                    className={`transition-colors cursor-pointer group/row ${
                      isSelected
                        ? 'border-l-2 border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/25'
                        : 'border-l-2 border-transparent hover:bg-slate-50/80 dark:hover:bg-zinc-800/40'
                    } ${isCleaned ? 'opacity-80' : ''}`}
                  >
                    {/* Coluna 1: Protocolo & Miniatura */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <div className="flex items-center space-x-2.5">
                        <div 
                          className="relative w-11 h-11 rounded-md overflow-hidden border border-slate-200 dark:border-zinc-700 shrink-0 bg-slate-100 dark:bg-zinc-950 group/img cursor-pointer"
                          onClick={(e) => handleTriggerPhoto(photoToDisplay, `Foto - ${cluster.protocol_code}`, e)}
                          title="Clique para ampliar a foto"
                        >
                          {photoToDisplay ? (
                            <>
                              <img
                                src={photoToDisplay}
                                alt={`Foto do foco ${cluster.protocol_code}`}
                                className="w-full h-full object-cover group-hover/img:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 transition-colors flex items-center justify-center">
                                <Eye className="w-3.5 h-3.5 text-white opacity-0 group-hover/img:opacity-100 transition-opacity" />
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-zinc-600 bg-slate-100 dark:bg-zinc-900">
                              <CameraOff className="w-4 h-4" />
                            </div>
                          )}

                          {isCleaned && (
                            <span className="absolute bottom-0 right-0 bg-emerald-600 text-white p-0.5 rounded-tl text-[8px] font-bold">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                            {cluster.protocol_code}
                            {isCritical && !isCleaned && (
                              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Crítico" />
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleTriggerPhoto(photoToDisplay, `Foto - ${cluster.protocol_code}`, e)}
                            className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 mt-0.5 text-left font-medium"
                          >
                            <Eye className="w-2.5 h-2.5" /> Ver foto
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Coluna 2: Endereço & Referência */}
                    <td className="py-2.5 px-3.5 max-w-[240px]">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate">
                          {cluster.address_reference || 'Local georreferenciado via GPS'}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                          {cluster.is_eco_critical && (
                            <span className="text-rose-700 dark:text-rose-400 font-medium flex items-center gap-0.5">
                              <Droplets className="w-2.5 h-2.5" /> Risco Hídrico
                            </span>
                          )}
                          <span className="font-mono flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" /> {formatTimeAgo(cluster.first_reported_at)}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Coluna 3: Porte */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      {cluster.dominant_scale === 'LARGE' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60">
                          Caçamba (Grande)
                        </span>
                      ) : cluster.dominant_scale === 'MEDIUM' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60">
                          Porta-malas (Médio)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60">
                          Sacos (Pequeno)
                        </span>
                      )}
                    </td>

                    {/* Coluna 4: Agrupamento / Moradores */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 font-mono flex items-center gap-1">
                          <Flame className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          {cluster.confirmations_count} {cluster.confirmations_count === 1 ? 'relato' : 'relatos unidos'}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
                          Raio &le; 25m
                        </span>
                      </div>
                    </td>

                    {/* Coluna 5: Prioridade PostGIS */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`font-mono text-xs font-bold tabular-nums min-w-[32px] ${
                            isCritical
                              ? 'text-rose-600 dark:text-rose-400'
                              : isMedium
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {priorityPercent}%
                        </span>
                        <div className="w-10 h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-slate-200 dark:border-zinc-700/60">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isCritical ? 'bg-rose-500' : isMedium ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${priorityPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Coluna 6: Status */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span className={`w-2 h-2 rounded-full ${statusDot}`} />
                        <span className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                          {statusLabel}
                        </span>
                      </div>
                    </td>

                    {/* Coluna 7: Ações Operacionais */}
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        
                        {/* Botão Ver Detalhes */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectCluster) onSelectCluster(cluster);
                          }}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-medium border border-slate-200 dark:border-zinc-700 transition-colors flex items-center space-x-1"
                          title="Abrir gaveta de evidências do agrupamento"
                        >
                          <FileText className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Detalhes</span>
                        </button>

                        {/* Botão Ver no Mapa */}
                        <Link
                          href={`/admin/map?clusterId=${cluster.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-medium border border-slate-200 dark:border-zinc-700 transition-colors flex items-center space-x-1"
                          title="Localizar foco no mapa geoespacial"
                        >
                          <MapIcon className="w-3 h-3 text-blue-500" />
                          <span>Mapa</span>
                        </Link>

                        {/* Botão Marcar como Limpo */}
                        {!isCleaned ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onResolveClean(cluster);
                            }}
                            className="px-2 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-medium transition-colors flex items-center space-x-1 shadow-2xs"
                            title="Dar baixa no chamado com comprovação fotográfica"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Limpar</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono italic px-1">
                            Limpo
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Lightbox local caso não tenha modal externo */}
      {localPhotoPreview && (
        <PhotoPreviewModal
          isOpen={true}
          photoUrl={localPhotoPreview.url}
          title={localPhotoPreview.title}
          onClose={() => setLocalPhotoPreview(null)}
        />
      )}
    </div>
  );
}
