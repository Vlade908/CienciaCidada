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
  Layers
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
  onResolveClean: (cluster: ClusterRecord) => void;
  onRefreshData?: () => void;
}

export function ClusterDataTable({
  clusters,
  onResolveClean,
  onRefreshData,
}: ClusterDataTableProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CRITICAL' | 'CLEANED'>('ACTIVE');

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

  return (
    <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-xs flex flex-col transition-colors">
      {/* Barra de Ferramentas: Busca e Filtros Rápidos */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-950/40">
        {/* Campo de Busca */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por protocolo (ECO-...), endereço ou tag..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60"
          />
        </div>

        {/* Botões de Filtros Rápidos */}
        <div className="flex items-center space-x-1.5 overflow-x-auto select-none">
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'ACTIVE'
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Focos Ativos
          </button>

          <button
            onClick={() => setStatusFilter('CRITICAL')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center space-x-1 ${
              statusFilter === 'CRITICAL'
                ? 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-red-500 dark:text-red-400" />
            <span>Críticos (&ge;75)</span>
          </button>

          <button
            onClick={() => setStatusFilter('CLEANED')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center space-x-1 ${
              statusFilter === 'CLEANED'
                ? 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-violet-500 dark:text-violet-400" />
            <span>Limpos ({clusters.filter((c) => c.status === 'CLEANED').length})</span>
          </button>

          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 'ALL'
                ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Todos ({clusters.length})
          </button>
        </div>
      </div>

      {/* Tabela de Dados */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800/80 text-zinc-500 dark:text-zinc-400 font-mono uppercase text-[10px] tracking-wider select-none">
            <tr>
              <th className="py-3 px-4">Protocolo & Foto</th>
              <th className="py-3 px-4">Endereço de Referência</th>
              <th className="py-3 px-4">Escala de Resíduo</th>
              <th className="py-3 px-4">Moradores Unidos</th>
              <th className="py-3 px-4">Score de Gravidade</th>
              <th className="py-3 px-4">Tempo / Status</th>
              <th className="py-3 px-4 text-right">Ações Operacionais</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 font-sans">
            {filteredClusters.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-zinc-500 dark:text-zinc-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Layers className="w-8 h-8 text-zinc-400 dark:text-zinc-600" />
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Nenhum foco de resíduo encontrado com este filtro.
                    </p>
                    <p className="text-xs text-zinc-500">
                      Todos os pontos selecionados estão devidamente despachados ou atendidos.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredClusters.map((cluster) => {
                const isCritical = cluster.priority_score >= 75 || cluster.is_eco_critical;
                const isMedium = cluster.priority_score >= 40 && cluster.priority_score < 75;
                const isCleaned = cluster.status === 'CLEANED';

                return (
                  <tr
                    key={cluster.id}
                    className={`hover:bg-zinc-50 dark:hover:bg-zinc-850/60 transition-colors ${
                      isCleaned ? 'opacity-65 bg-zinc-50/50 dark:bg-zinc-950/20' : ''
                    }`}
                  >
                    {/* Coluna 1: Protocolo & Miniatura com Zoom */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700/80 shrink-0 bg-zinc-100 dark:bg-zinc-950 group">
                          <img
                            src={isCleaned && cluster.cleaned_photo_url ? cluster.cleaned_photo_url : cluster.sample_photo_url}
                            alt="Foto do foco"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          />
                          {isCleaned && (
                            <span className="absolute bottom-0 right-0 bg-emerald-500 text-black p-0.5 rounded-tl">
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
                          <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[110px]">
                            ID: {cluster.id.slice(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Coluna 2: Endereço & Tags */}
                    <td className="py-3 px-4 max-w-xs">
                      <div className="flex flex-col">
                        <span className="text-xs text-zinc-800 dark:text-zinc-200 font-medium truncate">
                          {cluster.address_reference || 'Local georreferenciado via GPS'}
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {cluster.is_eco_critical && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 flex items-center gap-0.5">
                              <Droplets className="w-2.5 h-2.5" /> Margem Córrego
                            </span>
                          )}
                          {(cluster.waste_tags || []).slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/50"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>

                    {/* Coluna 3: Escala */}
                    <td className="py-3 px-4">
                      {cluster.dominant_scale === 'LARGE' ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/30">
                          Grande (Caçamba)
                        </span>
                      ) : cluster.dominant_scale === 'MEDIUM' ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                          Médio (Porta-malas)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                          Pequeno (Sacos)
                        </span>
                      )}
                    </td>

                    {/* Coluna 4: Moradores Unidos (Deduplicação Provada) */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5">
                        <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <Flame className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          {cluster.confirmations_count} {cluster.confirmations_count === 1 ? 'relato' : 'unidos'}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 block mt-0.5 font-mono">
                        Raio &le; 25 metros
                      </span>
                    </td>

                    {/* Coluna 5: Score de Gravidade */}
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
                            {Math.round(cluster.priority_score)} pts
                          </span>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-normal">/100</span>
                        </div>
                        {/* Mini barra de progresso */}
                        <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isCritical
                                ? 'bg-red-500'
                                : isMedium
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(cluster.priority_score, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Coluna 6: Tempo / Status */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">
                          {isCleaned ? (
                            <span className="text-violet-600 dark:text-violet-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Concluído
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold">
                              Aberto ({cluster.status})
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono mt-0.5 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {formatTimeAgo(cluster.first_reported_at)}
                        </span>
                      </div>
                    </td>

                    {/* Coluna 7: Ações Operacionais */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Botão Ver no Mapa */}
                        <Link
                          href={`/admin/map?clusterId=${cluster.id}`}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-medium border border-zinc-200 dark:border-zinc-700/60 transition-colors flex items-center space-x-1"
                          title="Ver este foco georreferenciado no mapa de satélite"
                        >
                          <MapIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span className="hidden sm:inline">Mapa</span>
                        </Link>

                        {/* Botão Marcar como Limpo */}
                        {!isCleaned ? (
                          <button
                            onClick={() => onResolveClean(cluster)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 dark:bg-emerald-600/20 dark:hover:bg-emerald-600/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-500/30 dark:border-emerald-500/40 transition-colors flex items-center space-x-1"
                            title="Dar baixa no chamado anexando a foto de comprovação"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Limpar</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono italic px-2">
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
    </div>
  );
}
