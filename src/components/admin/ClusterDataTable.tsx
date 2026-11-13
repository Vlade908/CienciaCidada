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
  SlidersHorizontal
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
  onResolveClean: (cluster: ClusterRecord) => void;
  onSelectCluster?: (cluster: ClusterRecord) => void;
  onOpenPhotoPreview?: (photoUrl: string, title: string) => void;
  onRefreshData?: () => void;
}

export function ClusterDataTable({
  clusters,
  onResolveClean,
  onSelectCluster,
  onOpenPhotoPreview,
  onRefreshData,
}: ClusterDataTableProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CRITICAL' | 'CLEANED'>('ACTIVE');
  
  // Modal interno de foto se não houver handler externo
  const [localPhotoPreview, setLocalPhotoPreview] = useState<{ url: string; title: string } | null>(null);

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
      if (diffHours === 1) return 'há 1 hora';
      if (diffHours < 24) return `há ${diffHours}h`;
      const diffDays = Math.floor(diffHours / 24);
      return `há ${diffDays}d`;
    } catch {
      return 'recente';
    }
  };

  const handleTriggerPhoto = (url: string, title: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onOpenPhotoPreview) {
      onOpenPhotoPreview(url, title);
    } else {
      setLocalPhotoPreview({ url, title });
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs flex flex-col transition-colors">
      
      {/* Barra de Ferramentas: Busca e Filtros Rápidos */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/70 dark:bg-zinc-950/40">
        
        {/* Campo de Busca */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por protocolo, endereço de referência ou tag..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 shadow-2xs"
          />
        </div>

        {/* Botões de Filtros Rápidos */}
        <div className="flex items-center space-x-1.5 overflow-x-auto select-none">
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'ACTIVE'
                ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Focos Ativos
          </button>

          <button
            onClick={() => setStatusFilter('CRITICAL')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center space-x-1 ${
              statusFilter === 'CRITICAL'
                ? 'bg-red-500/15 text-red-800 dark:text-red-300 border border-red-500/30 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-red-600 dark:text-red-400" />
            <span>Críticos (&ge;75%)</span>
          </button>

          <button
            onClick={() => setStatusFilter('CLEANED')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center space-x-1 ${
              statusFilter === 'CLEANED'
                ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Limpos ({clusters.filter((c) => c.status === 'CLEANED').length})</span>
          </button>

          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'ALL'
                ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Todos ({clusters.length})
          </button>
        </div>
      </div>

      {/* Tabela de Dados Corporativa */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-mono uppercase text-[10px] tracking-wider select-none">
            <tr>
              <th className="py-3 px-4">Protocolo & Foto</th>
              <th className="py-3 px-4">Endereço de Referência</th>
              <th className="py-3 px-4">Porte</th>
              <th className="py-3 px-4">Categoria / Tags</th>
              <th className="py-3 px-4">Moradores Unidos</th>
              <th className="py-3 px-4">Score de Gravidade</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Ações Operacionais</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/60 font-sans">
            {filteredClusters.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-zinc-500 dark:text-zinc-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Layers className="w-8 h-8 text-zinc-400 dark:text-zinc-600" />
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      Nenhum foco de resíduo encontrado com este filtro.
                    </p>
                    <p className="text-xs text-zinc-500">
                      Todos os pontos estão devidamente atendidos ou sem pendências.
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

                // Tradução do Status para Português (Feedback 4)
                const statusBadge = {
                  OPEN: { label: 'Aberto', className: 'bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-500/25' },
                  TRIAGED: { label: 'Triado', className: 'bg-blue-500/10 text-blue-800 dark:text-blue-400 border-blue-500/25' },
                  IN_ROUTE: { label: 'Em Rota', className: 'bg-purple-500/10 text-purple-800 dark:text-purple-400 border-purple-500/25' },
                  CLEANED: { label: 'Limpo', className: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-500/25' },
                  ARCHIVED: { label: 'Arquivado', className: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200' },
                }[cluster.status] || { label: cluster.status, className: 'bg-zinc-100 text-zinc-700 border-zinc-200' };

                return (
                  <tr
                    key={cluster.id}
                    onClick={() => onSelectCluster && onSelectCluster(cluster)}
                    className={`hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer group/row ${
                      isCleaned ? 'opacity-70 bg-zinc-50/30 dark:bg-zinc-950/20' : ''
                    }`}
                  >
                    {/* Coluna 1: Protocolo & Miniatura com Botão 'Ver Foto' (Feedback 5) */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="relative w-12 h-12 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 shrink-0 bg-zinc-100 dark:bg-zinc-950 group cursor-pointer"
                          onClick={(e) => handleTriggerPhoto(photoToDisplay, `Foto - ${cluster.protocol_code}`, e)}
                          title="Clique para ampliar a foto"
                        >
                          <img
                            src={photoToDisplay}
                            alt="Foto do foco"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors flex items-center justify-center">
                            <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          {isCleaned && (
                            <span className="absolute bottom-0 right-0 bg-emerald-500 text-white p-0.5 rounded-tl">
                              <Check className="w-2.5 h-2.5 font-bold" />
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                            {cluster.protocol_code}
                            {isCritical && !isCleaned && (
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
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

                    {/* Coluna 2: Endereço de Referência */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="flex flex-col">
                        <span className="text-xs text-zinc-900 dark:text-zinc-100 font-medium truncate">
                          {cluster.address_reference || 'Local georreferenciado via GPS'}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono mt-0.5 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-zinc-400" />
                          {formatTimeAgo(cluster.first_reported_at)}
                        </span>
                      </div>
                    </td>

                    {/* Coluna 3: Porte Isolado (Feedback 2) */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {cluster.dominant_scale === 'LARGE' ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/25">
                          Grande (Caçamba)
                        </span>
                      ) : cluster.dominant_scale === 'MEDIUM' ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25">
                          Médio (Porta-malas)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25">
                          Pequeno (Sacos)
                        </span>
                      )}
                    </td>

                    {/* Coluna 4: Categoria / Tags Isoladas (Feedback 2) */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {cluster.is_eco_critical && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 flex items-center gap-0.5">
                            <Droplets className="w-2.5 h-2.5" /> Margem Córrego
                          </span>
                        )}
                        {(cluster.waste_tags || []).slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/50"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Coluna 5: Moradores Unidos (Deduplicação) */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <Flame className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          {cluster.confirmations_count} {cluster.confirmations_count === 1 ? 'relato' : 'unidos'}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 block mt-0.5 font-mono">
                        Raio &le; 25m
                      </span>
                    </td>

                    {/* Coluna 6: Score de Gravidade em % (Feedback 3) */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col space-y-1 w-28">
                        <div className="flex justify-between items-center text-xs font-mono font-bold">
                          <span
                            className={
                              isCritical
                                ? 'text-red-600 dark:text-red-400'
                                : isMedium
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }
                          >
                            {priorityPercent}%
                          </span>
                          <span className="text-[9px] text-zinc-400 font-normal uppercase">
                            {isCritical ? 'Crítico' : isMedium ? 'Médio' : 'Baixo'}
                          </span>
                        </div>
                        {/* Barra de Progresso visual */}
                        <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200/50 dark:border-zinc-700/50">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isCritical
                                ? 'bg-red-500'
                                : isMedium
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${priorityPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Coluna 7: Status em Português (Feedback 4) */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${statusBadge.className}`}>
                        {statusBadge.label}
                      </span>
                    </td>

                    {/* Coluna 8: Ações Operacionais & Drill-down (Feedback 6) */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        
                        {/* Botão Ver Detalhes (Drill-down do Agrupamento) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectCluster) onSelectCluster(cluster);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-medium border border-zinc-200 dark:border-zinc-700/60 transition-colors flex items-center space-x-1"
                          title="Abrir gaveta de evidências e sub-relatos agrupados"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="hidden sm:inline">Detalhes</span>
                        </button>

                        {/* Botão Ver no Mapa */}
                        <Link
                          href={`/admin/map?clusterId=${cluster.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-medium border border-zinc-200 dark:border-zinc-700/60 transition-colors flex items-center space-x-1"
                          title="Ver este foco georreferenciado no mapa de satélite"
                        >
                          <MapIcon className="w-3.5 h-3.5 text-blue-500" />
                          <span className="hidden sm:inline">Mapa</span>
                        </Link>

                        {/* Botão Marcar como Limpo */}
                        {!isCleaned ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onResolveClean(cluster);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 dark:bg-emerald-600/20 dark:hover:bg-emerald-600/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-600/25 dark:border-emerald-500/40 transition-colors flex items-center space-x-1"
                            title="Dar baixa no chamado anexando a foto de comprovação"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Limpar</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-zinc-400 font-mono italic px-2">
                            Resolvido
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
