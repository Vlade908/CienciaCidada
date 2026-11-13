'use client';

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminKpiStrip } from '@/components/admin/AdminKpiStrip';
import type { HotspotGeoJson } from '@/components/admin/HotspotMap';
import { Loader2, AlertCircle } from 'lucide-react';

// Import dinâmico com ssr: false para isolar WebGL e Web Worker do lado do cliente
const HotspotMap = dynamic(
  () => import('@/components/admin/HotspotMap').then((mod) => mod.HotspotMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-400 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
        <span className="text-xs font-mono text-zinc-400">Carregando malha geoespacial MapLibre...</span>
      </div>
    ),
  }
);

// GeoJSON Inicial de Fallback (Mock realista para demonstração imediata)
const SEED_FALLBACK_GEOJSON: HotspotGeoJson = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-46.633308, -23.550520], // Ponto Piloto Central
      },
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
      geometry: {
        type: 'Point',
        coordinates: [-46.637200, -23.553100], // Ponto Médio
      },
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
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-46.629500, -23.548200], // Ponto Baixo
      },
      properties: {
        cluster_id: 'c3c4d5e6-f7a8-9012-cdef-333344445555',
        protocol_code: 'ECO-2026-0003',
        priority_score: 32.0,
        confirmations_count: 1,
        first_reported_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        dominant_scale: 'SMALL',
        status: 'OPEN',
        waste_tags: ['LIXO_DOMESTICO'],
      },
    },
  ],
};

export default function AdminDashboardPage() {
  const [hotspotsData, setHotspotsData] = useState<HotspotGeoJson>(SEED_FALLBACK_GEOJSON);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Busca os hotspots ativos via RPC Supabase PostGIS
  const fetchHotspots = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setIsRefreshing(true);
    setFetchError(null);

    try {
      const { data, error } = await supabase.rpc('fn_get_active_hotspots_geojson', {
        p_tenant_slug: 'piloto-universidade',
      });

      if (error) {
        console.warn('Aviso ao consultar RPC PostGIS (usando mock fallback):', error.message);
        setFetchError('Conexão ao PostGIS em modo demonstração (dados seed locais).');
        // Mantém dados de seed locais para demonstração fluida
      } else if (data && typeof data === 'object' && (data as HotspotGeoJson).features) {
        const geojsonData = data as unknown as HotspotGeoJson;
        // Se o banco retornar features reais, utiliza os dados reais
        if (geojsonData.features.length > 0) {
          setHotspotsData(geojsonData);
        } else {
          // Se o banco estiver vazio, usa os dados de demonstração
          setHotspotsData(SEED_FALLBACK_GEOJSON);
        }
      }
    } catch (err: unknown) {
      console.error('Erro ao conectar ao painel:', err);
      setFetchError('Modo offline/demonstração ativo.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHotspots();
  }, [fetchHotspots]);

  // Cálculos dinâmicos dos KPIs
  const totalActiveClusters = hotspotsData.features.length;
  const totalCitizenReports = hotspotsData.features.reduce(
    (acc, f) => acc + (f.properties?.confirmations_count || 1),
    0
  );
  const criticalClustersCount = hotspotsData.features.filter(
    (f) => (f.properties?.priority_score || 0) >= 75
  ).length;

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden bg-zinc-950">
      {/* 1. Header Corporativo B2G */}
      <AdminHeader
        municipalityName="São Paulo - SP (Piloto Universitário)"
        onRefresh={() => fetchHotspots(true)}
        isRefreshing={isRefreshing}
        totalClusters={totalActiveClusters}
      />

      {/* 2. Barra Superior de KPIs Executivos */}
      <AdminKpiStrip
        totalActiveClusters={totalActiveClusters}
        totalCitizenReports={totalCitizenReports}
        criticalClustersCount={criticalClustersCount}
        resolvedThisMonthCount={19}
        averageResolutionHours={16.2}
      />

      {/* 3. Área Principal: Mapa em Tela Cheia (Fase 5.1) */}
      <main className="flex-1 relative w-full h-full overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-30 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center space-x-2 text-zinc-300">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
            <span className="text-sm font-medium">Carregando malha geoespacial PostGIS...</span>
          </div>
        )}

        <HotspotMap
          hotspotsGeoJson={hotspotsData}
          selectedClusterId={selectedClusterId}
          onSelectHotspot={(clusterId) => setSelectedClusterId(clusterId)}
          initialCenter={[-46.633308, -23.550520]}
          initialZoom={13.5}
        />

        {/* Notificação sutil se o banco estiver em modo fallback */}
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
