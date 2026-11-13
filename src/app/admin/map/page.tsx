'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AdminHeader } from '@/components/admin/AdminHeader';
import type { HotspotGeoJson } from '@/components/admin/HotspotMap';
import { ClusterDetailDrawer } from '@/components/admin/ClusterDetailDrawer';
import { ResolveCleanModal } from '@/components/admin/ResolveCleanModal';
import { PhotoPreviewModal } from '@/components/admin/PhotoPreviewModal';
import type { ClusterRecord } from '@/components/admin/ClusterDataTable';
import { Loader2, ArrowLeft, Layers, AlertCircle, CheckCircle2 } from 'lucide-react';

// Import dinâmico do mapa isolado do SSR
const HotspotMap = dynamic(
  () => import('@/components/admin/HotspotMap').then((mod) => mod.HotspotMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-400 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
        <span className="text-xs font-mono text-zinc-400">Carregando motor geoespacial MapLibre...</span>
      </div>
    ),
  }
);

// Fallback de dados para demonstração fluida caso o banco esteja vazio
const SEED_FALLBACK_GEOJSON: HotspotGeoJson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-46.633308, -23.550520] },
      properties: {
        cluster_id: 'c1a2b3c4-d5e6-7890-abcd-111122223333',
        protocol_code: 'ECO-2026-0001',
        priority_score: 88.5,
        confirmations_count: 7,
        first_reported_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        dominant_scale: 'LARGE',
        status: 'OPEN',
        waste_tags: ['ENTULHO', 'CORREGO'],
        sample_photo_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=400&q=80',
        latest_photo_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=400&q=80',
        address_reference: 'Margem do Córrego Limpo, próximo ao viaduto',
        is_eco_critical: true,
      },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-46.637200, -23.553100] },
      properties: {
        cluster_id: 'c2b3c4d5-e6f7-8901-bcde-222233334444',
        protocol_code: 'ECO-2026-0002',
        priority_score: 54.0,
        confirmations_count: 3,
        first_reported_at: new Date(Date.now() - 3600000 * 12).toISOString(),
        dominant_scale: 'MEDIUM',
        status: 'OPEN',
        waste_tags: ['MOVEIS_VELHOS'],
        sample_photo_url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=400&q=80',
        latest_photo_url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=400&q=80',
        address_reference: 'Rua das Flores, altura do número 450',
        is_eco_critical: false,
      },
    },
  ],
};

function MapViewContent() {
  const searchParams = useSearchParams();
  const deepLinkedClusterId = searchParams.get('clusterId');

  const [hotspotsData, setHotspotsData] = useState<HotspotGeoJson>(SEED_FALLBACK_GEOJSON);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(deepLinkedClusterId);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Estados para inspeção, resolução de limpeza e prévia de foto
  const [inspectingCluster, setInspectingCluster] = useState<ClusterRecord | null>(null);
  const [resolvingCluster, setResolvingCluster] = useState<ClusterRecord | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; title: string } | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const fetchHotspots = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setIsRefreshing(true);
    setFetchError(null);

    try {
      const { data, error } = await supabase.rpc('fn_get_active_hotspots_geojson', {
        p_tenant_slug: 'piloto-universidade',
        p_include_cleaned: true,
      });

      if (error) {
        console.warn('Usando dados de demonstração no mapa:', error.message);
        setFetchError('Visualização em modo de demonstração.');
      } else if (data && typeof data === 'object' && (data as HotspotGeoJson).features) {
        const geojsonData = data as unknown as HotspotGeoJson;
        if (geojsonData.features.length > 0) {
          setHotspotsData(geojsonData);
        }
      }
    } catch (err) {
      console.error('Falha ao carregar mapa:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHotspots();
  }, [fetchHotspots]);

  useEffect(() => {
    if (deepLinkedClusterId) {
      setSelectedClusterId(deepLinkedClusterId);
    }
  }, [deepLinkedClusterId]);

  // Handler para inspecionar um cluster (abrir o Drawer)
  const handleInspectCluster = useCallback(async (clusterId: string) => {
    setSelectedClusterId(clusterId);

    try {
      // 1. Tenta carregar os dados mais recentes diretamente de incident_clusters
      const { data: dbCluster, error } = await supabase
        .from('incident_clusters')
        .select('*')
        .eq('id', clusterId)
        .maybeSingle();

      if (!error && dbCluster) {
        setInspectingCluster(dbCluster as ClusterRecord);
        return;
      }
    } catch {
      // Continua para o fallback
    }

    // 2. Fallback: Constrói ClusterRecord a partir do GeoJSON em memória
    const feat = hotspotsData.features.find((f) => f.properties?.cluster_id === clusterId);
    if (feat) {
      const p = feat.properties;
      const fallbackRecord: ClusterRecord = {
        id: p.cluster_id,
        protocol_code: p.protocol_code || 'ECO-NOVO',
        status: (p.status as ClusterRecord['status']) || 'OPEN',
        dominant_scale: p.dominant_scale || 'MEDIUM',
        waste_tags: p.waste_tags || ['ENTULHO'],
        confirmations_count: p.confirmations_count || 1,
        priority_score: p.priority_score || 50,
        is_eco_critical: Boolean(p.is_eco_critical),
        address_reference: p.address_reference || 'Localização mapeada via PostGIS',
        sample_photo_url: p.sample_photo_url || p.latest_photo_url || 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=400&q=80',
        cleaned_photo_url: p.cleaned_photo_url,
        first_reported_at: p.first_reported_at || new Date().toISOString(),
        last_reported_at: p.last_reported_at || new Date().toISOString(),
        cleaned_at: p.cleaned_at,
      };
      setInspectingCluster(fallbackRecord);
    }
  }, [hotspotsData]);

  // Limpeza resolvida com sucesso
  const handleResolveSuccess = () => {
    setResolvingCluster(null);
    setInspectingCluster(null);
    setFeedbackNotice('Foco marcado como limpo com sucesso! Comprovação registrada.');
    fetchHotspots(true);
    setTimeout(() => setFeedbackNotice(null), 5000);
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      <AdminHeader
        onRefresh={() => fetchHotspots(true)}
        isRefreshing={isRefreshing}
        totalClusters={hotspotsData.features.length}
      />

      {/* Barra de Subnavegação do Mapa */}
      <div className="h-10 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800/80 px-4 flex items-center justify-between text-xs shrink-0 z-20 transition-colors">
        <Link
          href="/admin"
          className="flex items-center space-x-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar para Painel de Ordens & Indicadores</span>
        </Link>

        <div className="flex items-center space-x-2 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
          <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{hotspotsData.features.length} focos plotados em tempo real</span>
        </div>
      </div>

      <main className="flex-1 relative w-full h-full overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-30 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center space-x-2 text-zinc-300">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
            <span className="text-sm font-medium">Carregando coordenadas PostGIS...</span>
          </div>
        )}

        <HotspotMap
          hotspotsGeoJson={hotspotsData}
          selectedClusterId={selectedClusterId}
          onSelectHotspot={(id) => setSelectedClusterId(id)}
          onInspectCluster={handleInspectCluster}
          initialCenter={[-46.633308, -23.550520]}
          initialZoom={13.5}
        />

        {fetchError && (
          <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs px-3 py-1.5 rounded-md backdrop-blur-md shadow-lg">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{fetchError}</span>
          </div>
        )}

        {feedbackNotice && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-2 bg-emerald-600 text-white text-xs px-4 py-2 rounded-lg shadow-xl animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{feedbackNotice}</span>
          </div>
        )}
      </main>

      {/* Gaveta de Detalhes do Agrupamento (Feedback 6) */}
      <ClusterDetailDrawer
        cluster={inspectingCluster}
        isOpen={Boolean(inspectingCluster)}
        onClose={() => setInspectingCluster(null)}
        onResolveClean={(cluster) => setResolvingCluster(cluster)}
        onOpenPhotoPreview={(photoUrl, title) => setPreviewPhoto({ url: photoUrl, title })}
      />

      {/* Modal de Conclusão / Comprovação de Limpeza */}
      <ResolveCleanModal
        cluster={resolvingCluster}
        isOpen={Boolean(resolvingCluster)}
        onClose={() => setResolvingCluster(null)}
        onSuccess={handleResolveSuccess}
      />

      {/* Lightbox para Expansão de Foto */}
      <PhotoPreviewModal
        isOpen={Boolean(previewPhoto)}
        photoUrl={previewPhoto?.url || ''}
        title={previewPhoto?.title || 'Evidência'}
        onClose={() => setPreviewPhoto(null)}
      />
    </div>
  );
}

export default function AdminMapPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
        </div>
      }
    >
      <MapViewContent />
    </Suspense>
  );
}
