'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminKpiStrip } from '@/components/admin/AdminKpiStrip';
import { ClusterDataTable, ClusterRecord } from '@/components/admin/ClusterDataTable';
import { ResolveCleanModal } from '@/components/admin/ResolveCleanModal';
import { ClusterDetailDrawer } from '@/components/admin/ClusterDetailDrawer';
import { PhotoPreviewModal } from '@/components/admin/PhotoPreviewModal';
import { 
  Search, 
  Download, 
  Loader2, 
  CheckCircle2, 
  X 
} from 'lucide-react';

const SEED_CLUSTERS: ClusterRecord[] = [
  {
    id: 'c1a2b3c4-d5e6-7890-abcd-111122223333',
    protocol_code: 'ECO-2026-0001',
    status: 'OPEN',
    dominant_scale: 'LARGE',
    waste_tags: ['ENTULHO', 'CONSTRUCAO'],
    confirmations_count: 4,
    priority_score: 92.0,
    is_eco_critical: true,
    address_reference: 'Rua Cantagalo, 842 - Tatuapé',
    sample_photo_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=400&q=80',
    first_reported_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    last_reported_at: new Date(Date.now() - 60000 * 18).toISOString(),
  },
  {
    id: 'c4d5e6f7-a8b9-0123-def0-444455556666',
    protocol_code: 'ECO-2026-0004',
    status: 'OPEN',
    dominant_scale: 'LARGE',
    waste_tags: ['COMERCIAL', 'SACARIAS'],
    confirmations_count: 7,
    priority_score: 94.0,
    is_eco_critical: true,
    address_reference: 'Av. Santo Amaro, 4200 - Brooklin',
    sample_photo_url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=400&q=80',
    first_reported_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    last_reported_at: new Date(Date.now() - 60000 * 35).toISOString(),
  },
  {
    id: 'c2b3c4d5-e6f7-8901-bcde-222233334444',
    protocol_code: 'ECO-2026-0002',
    status: 'IN_ROUTE',
    dominant_scale: 'MEDIUM',
    waste_tags: ['MOVEIS_VELHOS', 'MADEIRA'],
    confirmations_count: 3,
    priority_score: 62.0,
    is_eco_critical: false,
    address_reference: 'Rua Teodoro Sampaio, 840 - Pinheiros',
    sample_photo_url: 'https://images.unsplash.com/photo-1528323273322-d81458248d40?auto=format&fit=crop&w=400&q=80',
    first_reported_at: new Date(Date.now() - 60000 * 48).toISOString(),
    last_reported_at: new Date().toISOString(),
  },
  {
    id: 'c3c4d5e6-f7a8-9012-cdef-333344445555',
    protocol_code: 'ECO-2026-0003',
    status: 'TRIAGED',
    dominant_scale: 'SMALL',
    waste_tags: ['LIXO_DOMESTICO'],
    confirmations_count: 4,
    priority_score: 45.0,
    is_eco_critical: false,
    address_reference: 'Rua da Mooca, 2190 - Mooca',
    sample_photo_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=400&q=80',
    first_reported_at: new Date(Date.now() - 3600000 * 1.2).toISOString(),
    last_reported_at: new Date().toISOString(),
  },
  {
    id: 'c5e6f7a8-b901-2345-6789-555566667777',
    protocol_code: 'ECO-2026-0005',
    status: 'CLEANED',
    dominant_scale: 'MEDIUM',
    waste_tags: ['PODAS', 'GALHADAS'],
    confirmations_count: 5,
    priority_score: 55.0,
    is_eco_critical: false,
    address_reference: 'Praça da Sé, 100 - Centro',
    sample_photo_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=400&q=80',
    cleaned_photo_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=400&q=80',
    first_reported_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    last_reported_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    cleaned_at: new Date(Date.now() - 3600000 * 2.6).toISOString(),
  },
];

export default function AdminDashboardPage() {
  const [clusters, setClusters] = useState<ClusterRecord[]>(SEED_CLUSTERS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CRITICAL' | 'CLEANED'>('ACTIVE');
  
  const [selectedDetailCluster, setSelectedDetailCluster] = useState<ClusterRecord | null>(null);
  const [resolvingCluster, setResolvingCluster] = useState<ClusterRecord | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string } | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const loadDashboardData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setIsRefreshing(true);

    try {
      const { data: dbClusters, error: clustersError } = await supabase
        .from('incident_clusters')
        .select('*')
        .order('priority_score', { ascending: false });

      if (clustersError) {
        console.warn('Usando dados de demonstração (tabela ainda sem registros):', clustersError.message);
      } else if (dbClusters && dbClusters.length > 0) {
        setClusters(dbClusters as ClusterRecord[]);
      }
    } catch (err) {
      console.error('Falha ao sincronizar painel:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Contagens dinâmicas para as abas segmentadas
  const counts = useMemo(() => {
    return {
      active: clusters.filter((c) => c.status !== 'CLEANED').length,
      critical: clusters.filter((c) => (c.priority_score >= 75 || c.is_eco_critical) && c.status !== 'CLEANED').length,
      cleaned: clusters.filter((c) => c.status === 'CLEANED').length,
      total: clusters.length,
    };
  }, [clusters]);

  // Filtra os clusters de acordo com a aba e termo de busca
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

  const activeClusters = clusters.filter((c) => c.status !== 'CLEANED');
  const inRouteCount = activeClusters.filter((c) => c.status === 'IN_ROUTE').length;
  const totalCitizenReports = clusters.reduce((acc, c) => acc + (c.confirmations_count || 1), 0);
  const criticalCount = activeClusters.filter((c) => c.priority_score >= 75 || c.is_eco_critical).length;
  const cleanedCount = clusters.filter((c) => c.status === 'CLEANED').length;

  const handleExportCSV = () => {
    const headers = ['Protocolo', 'Status', 'Escala', 'Moradores_Unidos', 'Score_Gravidade', 'Endereco', 'Tags', 'Criado_Em'];
    const rows = filteredClusters.map((c) => [
      c.protocol_code,
      c.status,
      c.dominant_scale,
      c.confirmations_count,
      Math.round(Math.min(c.priority_score, 100)) + '%',
      `"${(c.address_reference || '').replace(/"/g, '""')}"`,
      `"${(c.waste_tags || []).join(';')}"`,
      c.first_reported_at,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ecocidadao_ordens_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden bg-slate-100 font-sans text-slate-900 antialiased dark:bg-zinc-950 dark:text-zinc-100 select-none">
      
      {/* 1. QUIET MUNICIPAL TOP HEADER STITCH (h-14, 56px) */}
      <AdminHeader
        municipalityName="PMSP / DSP-SLU"
        onRefresh={() => loadDashboardData(true)}
        isRefreshing={isRefreshing}
        totalClusters={counts.active}
      />

      {/* 2. SECONDARY OPERATIONAL UTILITY BAR STITCH (h-12, 48px) */}
      <div className="h-12 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-6 flex items-center justify-between shrink-0 z-20 transition-colors">
        <div className="flex items-center gap-4 flex-1 max-w-2xl">
          {/* Search Field */}
          <div className="relative w-80">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por protocolo, logradouro ou tag..."
              className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded focus:bg-white dark:focus:bg-zinc-900 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none placeholder:text-slate-400 dark:placeholder:text-zinc-500 font-sans text-slate-900 dark:text-zinc-100"
            />
          </div>

          {/* Segmented Status Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-0.5 rounded border border-slate-200 dark:border-zinc-700/60 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                statusFilter === 'ACTIVE'
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              Focos Ativos ({counts.active})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('CRITICAL')}
              className={`px-2.5 py-1 rounded transition-all flex items-center gap-1.5 ${
                statusFilter === 'CRITICAL'
                  ? 'bg-white dark:bg-zinc-900 text-rose-700 dark:text-rose-400 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
              <span>Críticos &ge; 75% ({counts.critical})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('CLEANED')}
              className={`px-2.5 py-1 rounded transition-all ${
                statusFilter === 'CLEANED'
                  ? 'bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              Limpos ({counts.cleaned})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              Todos ({counts.total})
            </button>
          </div>
        </div>

        {/* Action Button: Exportar CSV */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors shadow-2xs"
            title="Exportar dados para CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Alerta de Feedback Temporário */}
      {feedbackNotice && (
        <div className="mx-6 mt-2 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between animate-in fade-in shrink-0">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{feedbackNotice}</span>
          </div>
          <button
            onClick={() => setFeedbackNotice(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 text-xs font-mono ml-4"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. MAIN WORKSURFACE LAYOUT STITCH (Left Table ~63%, Right Drawer ~37%) */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANE: Quiet Metrics + Triage Table */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-100/60 dark:bg-zinc-950/60 overflow-y-auto border-r border-slate-200 dark:border-zinc-800">
          
          {/* Quiet Metrics Strip */}
          <AdminKpiStrip
            totalActiveClusters={counts.active}
            totalCitizenReports={totalCitizenReports}
            criticalClustersCount={criticalCount}
            resolvedThisMonthCount={cleanedCount}
            inRouteCount={inRouteCount}
            averageResolutionHours={14.5}
          />

          {/* Triage Table */}
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-2 bg-white dark:bg-zinc-900 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-mono">Sincronizando mesa de triagem...</span>
            </div>
          ) : (
            <ClusterDataTable
              clusters={filteredClusters}
              selectedClusterId={selectedDetailCluster?.id}
              onSelectCluster={(cluster) => setSelectedDetailCluster(cluster)}
              onResolveClean={(cluster) => setResolvingCluster(cluster)}
            />
          )}
        </div>

        {/* RIGHT PANE: ClusterDetailDrawer (Docked, Clean, High-Craft w-[490px]) */}
        {selectedDetailCluster && (
          <div className="hidden xl:flex h-full animate-in slide-in-from-right duration-200">
            <ClusterDetailDrawer
              cluster={selectedDetailCluster}
              isOpen={Boolean(selectedDetailCluster)}
              onClose={() => setSelectedDetailCluster(null)}
              onResolveClean={(cluster) => setResolvingCluster(cluster)}
              onOpenPhotoPreview={(url, title) => setPreviewPhoto({ url, title })}
              mode="docked"
            />
          </div>
        )}

      </main>

      {/* Modal Drawer para telas menores que XL */}
      {selectedDetailCluster && (
        <div className="xl:hidden">
          <ClusterDetailDrawer
            cluster={selectedDetailCluster}
            isOpen={Boolean(selectedDetailCluster)}
            onClose={() => setSelectedDetailCluster(null)}
            onResolveClean={(cluster) => setResolvingCluster(cluster)}
            onOpenPhotoPreview={(url, title) => setPreviewPhoto({ url, title })}
            mode="modal"
          />
        </div>
      )}

      {/* Lightbox Modal de Foto em Alta Resolução */}
      <PhotoPreviewModal
        isOpen={Boolean(previewPhoto)}
        photoUrl={previewPhoto?.url || null}
        title={previewPhoto?.title}
        onClose={() => setPreviewPhoto(null)}
      />

      {/* Modal de Baixa com Foto Comprovatória Antes / Depois */}
      <ResolveCleanModal
        cluster={resolvingCluster}
        isOpen={Boolean(resolvingCluster)}
        onClose={() => setResolvingCluster(null)}
        onSuccess={() => {
          setFeedbackNotice(`Foco ${resolvingCluster?.protocol_code} marcado como LIMPO com sucesso! Comprovante registrado.`);
          loadDashboardData(true);
        }}
      />

    </div>
  );
}
