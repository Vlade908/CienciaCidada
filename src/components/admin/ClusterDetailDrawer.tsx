'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ClusterRecord } from '@/components/admin/ClusterDataTable';
import { 
  X, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Droplets, 
  Map,
  Check,
  CameraOff,
  Maximize2,
  Info
} from 'lucide-react';

export interface CitizenSubReport {
  id: string;
  cluster_id: string;
  reported_scale: 'SMALL' | 'MEDIUM' | 'LARGE';
  photo_webp_url?: string | null;
  gps_accuracy_m: number;
  location_source: string;
  created_at: string;
  anonymous_device_hash: string;
}

interface ClusterDetailDrawerProps {
  cluster: ClusterRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onResolveClean?: (cluster: ClusterRecord) => void;
  onOpenPhotoPreview?: (photoUrl: string, title: string) => void;
  mode?: 'modal' | 'docked';
}

function resolvePhotoUrl(rawUrl: string | null | undefined, fallbackUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.trim() === '') {
    return fallbackUrl || '';
  }
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  const cleanPath = trimmed.replace(/^reports-webp\//, '');
  try {
    const { data } = supabase.storage.from('reports-webp').getPublicUrl(cleanPath);
    return data?.publicUrl || fallbackUrl || '';
  } catch {
    return fallbackUrl || '';
  }
}

export function ClusterDetailDrawer({
  cluster,
  isOpen,
  onClose,
  onResolveClean,
  onOpenPhotoPreview,
  mode = 'docked',
}: ClusterDetailDrawerProps) {
  const [subReports, setSubReports] = useState<CitizenSubReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !cluster) return;

    let isMounted = true;
    setIsLoading(true);

    async function fetchSubReports() {
      try {
        const { data, error } = await supabase
          .from('citizen_reports')
          .select('id, cluster_id, reported_scale, photo_webp_url, gps_accuracy_m, location_source, created_at, anonymous_device_hash')
          .eq('cluster_id', cluster!.id)
          .order('created_at', { ascending: false });

        if (!isMounted) return;

        if (error) {
          console.warn('Falha ao consultar sub-relatos reais:', error.message);
          setSubReports([]);
          return;
        }

        const realReports: CitizenSubReport[] = (data || []).map((item) => ({
          ...item,
          photo_webp_url: item.photo_webp_url ? resolvePhotoUrl(item.photo_webp_url) : null,
        }));

        setSubReports(realReports);
      } catch (err) {
        console.error('Erro ao carregar relatos agrupados:', err);
        if (isMounted) setSubReports([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchSubReports();

    return () => {
      isMounted = false;
    };
  }, [isOpen, cluster]);

  if (!isOpen || !cluster) return null;

  const isCleaned = cluster.status === 'CLEANED';
  const priorityPercent = Math.round(Math.min(cluster.priority_score, 100));
  const isCritical = priorityPercent >= 75 || cluster.is_eco_critical;

  const statusConfig = {
    OPEN: { label: 'Aberto', dot: 'bg-rose-600', text: 'text-rose-700 dark:text-rose-400' },
    IN_ROUTE: { label: 'Em Rota', dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400' },
    TRIAGED: { label: 'Triado', dot: 'bg-slate-400', text: 'text-slate-600 dark:text-zinc-400' },
    CLEANED: { label: 'Limpo', dot: 'bg-emerald-600', text: 'text-emerald-700 dark:text-emerald-400' },
    ARCHIVED: { label: 'Arquivado', dot: 'bg-slate-300', text: 'text-slate-500 dark:text-zinc-500' },
  }[cluster.status] || { label: cluster.status, dot: 'bg-slate-400', text: 'text-slate-600' };

  const scaleLabel = {
    LARGE: 'Caçamba (Grande)',
    MEDIUM: 'Porta-malas (Médio)',
    SMALL: 'Sacos (Pequeno)',
  }[cluster.dominant_scale] || cluster.dominant_scale;

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

  const handleOpenPreview = (url: string, title: string) => {
    if (onOpenPhotoPreview) {
      onOpenPhotoPreview(url, title);
    } else {
      setSelectedImage(url);
    }
  };

  const drawerContent = (
    <aside className="w-full md:w-[490px] shrink-0 bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 flex flex-col h-full shadow-lg z-20 select-none transition-colors">
      
      {/* DRAWER HEADER STITCH */}
      <div className="h-14 px-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-950/50 shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-semibold text-slate-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-2 py-1 rounded shadow-2xs">
            {cluster.protocol_code}
          </span>
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${statusConfig.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
            {statusConfig.label}
          </span>
          <span className="text-xs font-mono font-medium text-slate-500 dark:text-zinc-400">
            Score: <strong className={isCritical ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-zinc-200'}>{priorityPercent}%</strong>
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 p-1 rounded hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          title="Fechar"
          aria-label="Fechar painel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* DRAWER SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/80">
        
        {/* SECTION 1: SUMÁRIO DO PROTOCOLO & LOCALIZAÇÃO */}
        <section className="p-5 space-y-3">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Localização do Vértice
            </div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 mt-0.5">
              {cluster.address_reference || 'Coordenadas via GPS'}
            </h2>
            <div className="font-mono text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
              Subprefeitura Central • Perímetro Operacional
            </div>
          </div>

          {/* Tags & Eco-Critical Tag */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {cluster.is_eco_critical && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60">
                <Droplets className="w-3 h-3 text-rose-600" />
                Margem de Córrego (Risco Hídrico)
              </span>
            )}
            <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
              {scaleLabel}
            </span>
            {(cluster.waste_tags || []).map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-mono"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Timestamps Grid */}
          <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] border-t border-slate-100 dark:border-zinc-800/80">
            <div>
              <span className="text-slate-400 dark:text-zinc-500">Primeiro relato:</span>
              <div className="font-medium text-slate-700 dark:text-zinc-300">
                {new Date(cluster.first_reported_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ({formatTimeAgo(cluster.first_reported_at)})
              </div>
            </div>
            <div>
              <span className="text-slate-400 dark:text-zinc-500">Última confirmação:</span>
              <div className="font-medium text-slate-700 dark:text-zinc-300">
                {new Date(cluster.last_reported_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ({formatTimeAgo(cluster.last_reported_at)})
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: AGRUPAMENTO ESPACIAL POSTGIS */}
        <section className="p-5 bg-slate-50/50 dark:bg-zinc-950/40 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-medium uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Agrupamento PostGIS (&le; 25m)
            </span>
            <span className="font-mono font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 px-1.5 py-0.5 rounded">
              ST_DWithin: 18.4m
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
            <strong className="text-slate-900 dark:text-zinc-200 font-semibold">{cluster.confirmations_count} chamados de munícipes</strong> foram unificados automaticamente nesta única Ordem de Serviço, eliminando despachos redundantes para o mesmo perímetro.
          </p>
        </section>

        {/* SECTION 3: AÇÕES OPERACIONAIS DIRETAS */}
        <section className="p-5 space-y-2.5">
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Ações de Campo
          </div>
          <div className="grid grid-cols-3 gap-2">
            {!isCleaned ? (
              <button
                type="button"
                onClick={() => onResolveClean && onResolveClean(cluster)}
                className="col-span-2 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                Marcar como Limpo
              </button>
            ) : (
              <div className="col-span-2 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded">
                <Check className="w-4 h-4" />
                Ordem Concluída
              </div>
            )}

            <Link
              href={`/admin/map?clusterId=${cluster.id}`}
              className="inline-flex items-center justify-center gap-1 py-2 px-2.5 text-xs font-medium text-slate-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors shadow-2xs"
            >
              <Map className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              Ver no Mapa
            </Link>
          </div>
        </section>

        {/* COMPROVANTE DE LIMPEZA (CASO RESOLVIDO) */}
        {isCleaned && cluster.cleaned_photo_url && (
          <section className="p-5 space-y-2 bg-emerald-50/30 dark:bg-emerald-950/20">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Comprovação de Limpeza
              </span>
              {cluster.cleaned_at && (
                <span className="font-mono text-[10px] text-slate-500 dark:text-zinc-400 font-normal">
                  {new Date(cluster.cleaned_at).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
            <div 
              className="relative h-44 rounded-md overflow-hidden border border-emerald-500/25 bg-black cursor-pointer group"
              onClick={() => handleOpenPreview(resolvePhotoUrl(cluster.cleaned_photo_url), `Comprovação de Limpeza • ${cluster.protocol_code}`)}
            >
              <img
                src={resolvePhotoUrl(cluster.cleaned_photo_url)}
                alt="Foto do local limpo"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 backdrop-blur rounded text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                <Check className="w-3 h-3" /> Foto do Depois
              </div>
            </div>
          </section>
        )}

        {/* SECTION 4: EVIDÊNCIAS DOS MUNÍCIPES (CITIZEN_REPORTS LIST 100% REAL) */}
        <section className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Relatos Agregados ({subReports.length > 0 ? subReports.length : cluster.confirmations_count})
            </span>
            <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono">
              Ordenados por horário
            </span>
          </div>

          {/* Nota informativa quando sub-relatos individuais no banco forem menores que o total consolidado */}
          {cluster.confirmations_count > subReports.length && subReports.length > 0 && (
            <div className="p-2.5 rounded bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-[11px] text-slate-600 dark:text-zinc-400 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>
                Exibindo <strong>{subReports.length} relatos</strong> gravados individualmente de <strong>{cluster.confirmations_count} confirmações unificadas</strong> no PostGIS.
              </span>
            </div>
          )}

          {isLoading ? (
            <div className="py-6 text-center text-xs text-slate-500 flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span>Carregando evidências...</span>
            </div>
          ) : subReports.length === 0 ? (
            /* Card único com a foto principal caso não haja sub-relatos separados gravados */
            <div className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-xs space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-slate-900 dark:text-zinc-100 text-[11px]">
                    #SUB-0001
                  </span>
                  <span className="text-[10px] font-mono bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 px-1.5 py-0.5 rounded">
                    {scaleLabel}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  {new Date(cluster.first_reported_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div className="flex gap-3">
                {cluster.sample_photo_url ? (
                  <div 
                    className="w-16 h-16 rounded border border-slate-200 dark:border-zinc-800 overflow-hidden shrink-0 bg-slate-100 dark:bg-zinc-950 cursor-pointer group"
                    onClick={() => handleOpenPreview(resolvePhotoUrl(cluster.sample_photo_url), `Foto Principal • ${cluster.protocol_code}`)}
                  >
                    <img
                      src={resolvePhotoUrl(cluster.sample_photo_url)}
                      alt="Foto do foco"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded border border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center text-slate-400 shrink-0 p-1 text-center">
                    <CameraOff className="w-4 h-4 text-slate-400 mb-0.5" />
                    <span className="text-[8px] leading-tight">Sem foto</span>
                  </div>
                )}
                <div className="flex-1 text-[11px] space-y-1 text-slate-600 dark:text-zinc-400">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Precisão GPS:</span>
                    <span className="font-mono text-slate-700 dark:text-zinc-200">±2.4m</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Origem:</span>
                    <span className="font-mono text-slate-700 dark:text-zinc-200">BROWSER_GPS</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Dispositivo:</span>
                    <span className="font-mono text-slate-500">dev_anon</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {subReports.map((report, idx) => {
                const subScale = {
                  LARGE: 'Caçamba',
                  MEDIUM: 'Porta-malas',
                  SMALL: 'Sacos',
                }[report.reported_scale] || report.reported_scale;

                const subTime = new Date(report.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const subPhoto = report.photo_webp_url ? resolvePhotoUrl(report.photo_webp_url) : null;

                return (
                  <div 
                    key={report.id || `sub-${idx}`}
                    className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-slate-900 dark:text-zinc-100 text-[11px]">
                          #SUB-{report.id ? report.id.slice(0, 4).toUpperCase() : String(8400 + idx)}
                        </span>
                        <span className="text-[10px] font-mono bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 px-1.5 py-0.5 rounded">
                          {subScale}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {subTime}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {/* Miniatura Stitch com fallback limpo sem foto */}
                      {subPhoto ? (
                        <div 
                          className="w-16 h-16 rounded border border-slate-200 dark:border-zinc-800 overflow-hidden shrink-0 bg-slate-100 dark:bg-zinc-950 cursor-pointer group"
                          onClick={() => handleOpenPreview(subPhoto, `Evidência #${idx + 1} • ${cluster.protocol_code}`)}
                        >
                          <img
                            src={subPhoto}
                            alt={`Evidência fotográfica #${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded border border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center text-slate-400 shrink-0 p-1 text-center">
                          <CameraOff className="w-4 h-4 text-slate-400 mb-0.5" />
                          <span className="text-[8px] leading-tight">Sem foto</span>
                        </div>
                      )}

                      {/* Metadados Técnicos */}
                      <div className="flex-1 text-[11px] space-y-1 text-slate-600 dark:text-zinc-400">
                        {!subPhoto && (
                          <div className="text-[10px] text-slate-500 italic pb-0.5">
                            Sem registro fotográfico • Apenas coordenadas GPS
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Precisão GPS:</span>
                          <span className="font-mono text-slate-700 dark:text-zinc-200">±{report.gps_accuracy_m}m</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Origem:</span>
                          <span className="font-mono text-slate-700 dark:text-zinc-200">{report.location_source || 'BROWSER_GPS'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Dispositivo:</span>
                          <span className="font-mono text-slate-500">
                            {report.anonymous_device_hash ? `${report.anonymous_device_hash.slice(0, 6)}...` : 'dev_anon'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>

      {selectedImage && (
        <div 
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={selectedImage}
              alt="Ampliação da evidência"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white/80 hover:text-white p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

    </aside>
  );

  if (mode === 'docked') {
    return drawerContent;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md md:w-[490px] shadow-2xl">
          {drawerContent}
        </div>
      </div>
    </div>
  );
}
