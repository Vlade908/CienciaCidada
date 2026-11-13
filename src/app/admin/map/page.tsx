'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AdminHeader } from '@/components/admin/AdminHeader';
import type { HotspotGeoJson } from '@/components/admin/HotspotMap';
import { Loader2, ArrowLeft, Layers, AlertCircle } from 'lucide-react';

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
        latest_photo_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=400&q=80',
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
        latest_photo_url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=400&q=80',
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
          initialCenter={[-46.633308, -23.550520]}
          initialZoom={13.5}
        />

        {fetchError && (
          <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs px-3 py-1.5 rounded-md backdrop-blur-md shadow-lg">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{fetchError}</span>
          </div>
        )}
      </main>
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
