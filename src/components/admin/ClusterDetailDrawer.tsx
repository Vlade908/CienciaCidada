'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ClusterRecord } from '@/components/admin/ClusterDataTable';
import { 
  X, 
  MapPin, 
  CheckCircle2, 
  Layers, 
  Clock, 
  Camera, 
  ShieldCheck, 
  Droplets, 
  ExternalLink, 
  Maximize2,
  Users,
  AlertTriangle,
  Flame,
  Check,
  CameraOff,
  Copy,
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

/**
 * Normaliza qualquer URL de foto (relativa no Storage, nula ou externa) para URL pública segura
 */
function resolvePhotoUrl(rawUrl: string | null | undefined, fallbackUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.trim() === '') {
    return fallbackUrl || '';
  }
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  // Se for caminho relativo de Storage no Supabase
  const cleanPath = trimmed.replace(/^reports-webp\//, '');
  try {
    const { data } = supabase.storage.from('reports-webp').getPublicUrl(cleanPath);
    return data?.publicUrl || fallbackUrl || '';
  } catch {
    return fallbackUrl || '';
  }
}

/**
 * Card individual de relato do munícipe com fidelidade estrita aos dados reais (sem fotos clonadas)
 */
interface SubReportItemProps {
  report: CitizenSubReport;
  index: number;
  protocolCode: string;
  onPreview: (url: string, title: string) => void;
}

function SubReportItem({
  report,
  index,
  protocolCode,
  onPreview,
}: SubReportItemProps) {
  const photoUrl = report.photo_webp_url ? resolvePhotoUrl(report.photo_webp_url) : '';
  const [imgFailed, setImgFailed] = useState(false);

  const scaleLabel = {
    LARGE: 'Grande (Caçamba)',
    MEDIUM: 'Médio (Porta-malas)',
    SMALL: 'Pequeno (Sacos)',
  }[report.reported_scale] || report.reported_scale;

  const hasValidPhoto = Boolean(photoUrl && !imgFailed);

  return (
    <div className="rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/40 p-3 flex flex-col gap-2.5 transition-colors">
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 font-mono">
          <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 font-bold text-[10px]">
            Relato #{index + 1}
          </span>
          <span className="text-slate-500 dark:text-zinc-400">
            {new Date(report.created_at).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800">
          {report.location_source === 'QR_ANCHOR' ? 'Placa QR' : 'GPS Mobile'}
        </span>
      </div>

      {/* Foto Real ou Estado Vazio Técnico */}
      {hasValidPhoto ? (
        <div 
          className="relative h-36 rounded-md overflow-hidden bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 cursor-pointer group"
          onClick={() => onPreview(photoUrl, `Relato #${index + 1} • ${protocolCode}`)}
        >
          <img
            src={photoUrl}
            alt={`Foto do relato #${index + 1}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            onError={() => setImgFailed(true)}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-black/75 backdrop-blur text-white text-[10px] rounded font-medium flex items-center gap-1 transition-opacity">
              <Maximize2 className="w-3 h-3" /> Ampliar foto
            </span>
          </div>
        </div>
      ) : (
        <div className="h-24 rounded-md border border-dashed border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 flex flex-col items-center justify-center text-center p-3 text-slate-400 dark:text-zinc-500">
          <CameraOff className="w-4 h-4 mb-1 text-slate-400 dark:text-zinc-500" />
          <span className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">
            Sem registro fotográfico
          </span>
          <span className="text-[10px] text-slate-400 dark:text-zinc-500">
            Apenas coordenadas GPS consolidadas
          </span>
        </div>
      )}

      {/* Telemetria do Munícipe */}
      <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200/60 dark:border-zinc-800/60">
        <span className="text-slate-600 dark:text-zinc-400 font-medium">
          Porte: <strong className="text-slate-900 dark:text-zinc-200">{scaleLabel}</strong>
        </span>
        <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500 dark:text-zinc-400">
          <span>&plusmn;{report.gps_accuracy_m}m</span>
          <span>•</span>
          <span title={`Hash anônimo: ${report.anonymous_device_hash}`}>
            {report.anonymous_device_hash ? `${report.anonymous_device_hash.slice(0, 6)}...` : 'anônimo'}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ClusterDetailDrawer({
  cluster,
  isOpen,
  onClose,
  onResolveClean,
  onOpenPhotoPreview,
  mode = 'modal',
}: ClusterDetailDrawerProps) {
  const [subReports, setSubReports] = useState<CitizenSubReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [copiedCoords, setCopiedCoords] = useState(false);

  // Fecha com a tecla ESC
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

  // Carrega os relatos reais dos cidadãos vinculados a este cluster (sem mocks sintéticos)
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
          console.error('Erro ao consultar citizen_reports:', error);
          setSubReports([]);
          return;
        }

        // Fidedigno 100% aos dados reais do banco:
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
  const priorityScorePercent = Math.round(Math.min(cluster.priority_score, 100));
  const isCritical = priorityScorePercent >= 75 || cluster.is_eco_critical;
  const isMedium = priorityScorePercent >= 40 && priorityScorePercent < 75;

  const statusConfig = {
    OPEN: { label: 'Aberto', dot: 'bg-amber-500', pill: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60' },
    TRIAGED: { label: 'Triado', dot: 'bg-blue-500', pill: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60' },
    IN_ROUTE: { label: 'Em Rota', dot: 'bg-purple-500', pill: 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/60' },
    CLEANED: { label: 'Limpo', dot: 'bg-emerald-500', pill: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60' },
    ARCHIVED: { label: 'Arquivado', dot: 'bg-slate-400', pill: 'text-slate-700 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700' },
  }[cluster.status] || { label: cluster.status, dot: 'bg-slate-400', pill: 'text-slate-700 bg-slate-100 border-slate-200' };

  const handleOpenPreview = (url: string, title: string) => {
    if (onOpenPhotoPreview) {
      onOpenPhotoPreview(url, title);
    } else {
      setSelectedImage(url);
    }
  };

  const handleCopyCoords = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(cluster.address_reference || cluster.protocol_code);
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 2000);
    }
  };

  const drawerContent = (
    <div className="w-full h-full bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 flex flex-col justify-between text-slate-900 dark:text-zinc-100 transition-colors">
      
      {/* CABEÇALHO DO DOSSIÊ (Stitch Civic Operations) */}
      <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-start justify-between bg-slate-50/70 dark:bg-zinc-950/50 shrink-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm font-bold tracking-tight text-slate-900 dark:text-zinc-50">
              {cluster.protocol_code}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${statusConfig.pill}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
              {statusConfig.label}
            </span>
            <span
              className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full ${
                isCritical
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60'
                  : isMedium
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60'
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60'
              }`}
            >
              {priorityScorePercent}% {isCritical ? 'Crítico' : 'Prioritário'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate max-w-sm">{cluster.address_reference || 'Local georreferenciado via satélite'}</span>
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          title="Fechar painel (Esc)"
          aria-label="Fechar painel de detalhes"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* CONTEÚDO COM SCROLL INDEPENDENTE */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">

        {/* SEÇÃO 1: LOCALIZAÇÃO & VÉRTICE */}
        <div className="rounded-lg border border-slate-200 dark:border-zinc-800 p-3.5 bg-slate-50/50 dark:bg-zinc-950/30 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-zinc-300">
            <span className="uppercase tracking-wider text-[10px] text-slate-500 dark:text-zinc-400">Vértice Geoespacial</span>
            <button
              type="button"
              onClick={handleCopyCoords}
              className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-mono"
            >
              <Copy className="w-3 h-3" />
              {copiedCoords ? 'Copiado!' : 'Copiar dados'}
            </button>
          </div>
          <div className="text-xs text-slate-800 dark:text-zinc-200 font-medium">
            {cluster.address_reference || 'Coordenadas obtidas via GPS'}
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500 dark:text-zinc-400">
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3" /> 1º relato: {new Date(cluster.first_reported_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span>•</span>
            <span className="font-mono">
              Último: {new Date(cluster.last_reported_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* SEÇÃO 2: RESUMO DO AGRUPAMENTO POSTGIS (DEDUPLICAÇÃO) */}
        <div className="rounded-lg border border-emerald-500/25 bg-emerald-50/60 dark:bg-emerald-950/20 p-3.5 text-emerald-900 dark:text-emerald-200">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-md bg-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                Agrupamento PostGIS • Raio &le; 25m
              </h4>
              <p className="text-xs mt-1 text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed">
                Este foco unifica <strong className="font-mono">{cluster.confirmations_count} relatos de moradores</strong> no mesmo perímetro geográfico via função <code className="text-[10px] bg-emerald-500/10 px-1 py-0.5 rounded font-mono">ST_DWithin</code>, evitando rotas duplicadas de coleta.
              </p>
            </div>
          </div>
        </div>

        {/* SEÇÃO 3: FOTO PRINCIPAL REPRESENTATIVA */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
              Foto Representativa do Foco
            </span>
            {cluster.sample_photo_url && (
              <button
                type="button"
                onClick={() => handleOpenPreview(resolvePhotoUrl(cluster.sample_photo_url), `Foto Principal • ${cluster.protocol_code}`)}
                className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
              >
                <Maximize2 className="w-3 h-3" /> Ampliar
              </button>
            )}
          </div>

          {cluster.sample_photo_url ? (
            <div 
              className="relative h-48 rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-950 cursor-pointer group"
              onClick={() => handleOpenPreview(resolvePhotoUrl(cluster.sample_photo_url), `Foto Principal • ${cluster.protocol_code}`)}
            >
              <img
                src={resolvePhotoUrl(cluster.sample_photo_url)}
                alt={`Foto principal do foco ${cluster.protocol_code}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 px-2.5 py-1 bg-black/75 backdrop-blur text-white text-xs rounded-md font-medium transition-opacity">
                  Visualizar em tela cheia
                </span>
              </div>
            </div>
          ) : (
            <div className="h-32 rounded-lg border border-dashed border-slate-300 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/50 flex flex-col items-center justify-center text-slate-400 text-xs">
              <CameraOff className="w-5 h-5 mb-1" />
              <span>Sem registro fotográfico para este foco</span>
            </div>
          )}
        </div>

        {/* SEÇÃO COMPROVANTE DE LIMPEZA (CASO RESOLVIDO) */}
        {isCleaned && cluster.cleaned_photo_url && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 p-3.5 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Comprovação de Limpeza</span>
              {cluster.cleaned_at && (
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono font-normal">
                  • {new Date(cluster.cleaned_at).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
            <div 
              className="relative h-44 rounded-md overflow-hidden border border-emerald-500/20 bg-black cursor-pointer group"
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
          </div>
        )}

        {/* SEÇÃO 4: SUB-RELATOS DOS MUNÍCIPES (100% DADOS REAIS) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Camera className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                Evidências dos Munícipes ({subReports.length})
              </h3>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono">
              PostGIS r &le; 25m
            </span>
          </div>

          {/* Nota informativa honesta quando contagem em citizen_reports for diferente de confirmations_count */}
          {cluster.confirmations_count > subReports.length && subReports.length > 0 && (
            <div className="p-2.5 rounded-md bg-slate-100 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-800 text-[11px] text-slate-600 dark:text-zinc-400 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400 shrink-0 mt-0.5" />
              <span>
                Exibindo <strong>{subReports.length} relatos</strong> com registro individual no banco de dados, compondo o total de <strong>{cluster.confirmations_count} denúncias consolidadas</strong> neste ponto.
              </span>
            </div>
          )}

          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span>Carregando evidências do banco de dados...</span>
            </div>
          ) : subReports.length === 0 ? (
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 text-center text-xs text-slate-500">
              A foto principal inicial é o registro consolidado deste foco. Não há sub-relatos individuais gravados separadamente.
            </div>
          ) : (
            <div className="space-y-3">
              {subReports.map((report, idx) => (
                <SubReportItem
                  key={report.id || `report-${idx}`}
                  report={report}
                  index={idx}
                  protocolCode={cluster.protocol_code}
                  onPreview={handleOpenPreview}
                />
              ))}
            </div>
          )}
        </div>

        {/* NOTA LGPD */}
        <div className="p-3 rounded-lg bg-slate-100/70 dark:bg-zinc-800/40 text-[11px] text-slate-500 dark:text-zinc-400 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Conformidade LGPD: Coleta anônima com hash SHA-256 de dispositivo sem dados pessoais.</span>
        </div>
      </div>

      {/* RODAPÉ DE AÇÕES OPERACIONAIS */}
      <div className="p-3.5 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-950/60 flex items-center justify-between gap-2.5 shrink-0">
        <Link
          href={`/admin/map?clusterId=${cluster.id}`}
          className="px-3 py-1.5 rounded-md bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold border border-slate-200 dark:border-zinc-700 flex items-center space-x-1.5 transition-colors shadow-2xs"
        >
          <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
          <span>Ver no Mapa</span>
        </Link>

        <div className="flex items-center space-x-2">
          {!isCleaned ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onResolveClean) onResolveClean(cluster);
              }}
              className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs flex items-center space-x-1.5 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Marcar como Limpo</span>
            </button>
          ) : (
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono italic">
              Concluído
            </span>
          )}
        </div>
      </div>

    </div>
  );

  if (mode === 'docked') {
    return (
      <aside 
        aria-label="Dossiê do foco selecionado"
        className="w-full md:w-[490px] h-full shrink-0 animate-in slide-in-from-right duration-200"
      >
        {drawerContent}
      </aside>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md md:w-[490px] shadow-2xl">
          {drawerContent}
        </div>
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
    </div>
  );
}
