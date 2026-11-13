'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap, GeoJSONSource, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTheme } from '@/context/ThemeContext';
import { ZoomIn, ZoomOut, Compass } from 'lucide-react';

if (typeof window !== 'undefined') {
  try {
    maplibregl.config.WORKER_URL = `${window.location.origin}/maplibre-gl-worker.mjs`;
  } catch (err) {
    console.warn('Não foi possível definir WORKER_URL customizado:', err);
  }
}

export interface HotspotFeatureProperties {
  cluster_id: string;
  protocol_code: string;
  priority_score: number;
  confirmations_count: number;
  first_reported_at: string;
  last_reported_at?: string;
  cleaned_at?: string;
  dominant_scale: 'SMALL' | 'MEDIUM' | 'LARGE';
  sample_photo_url?: string;
  latest_photo_url?: string;
  cleaned_photo_url?: string;
  status?: string;
  waste_tags?: string[];
  is_eco_critical?: boolean;
  address_reference?: string;
}

export type HotspotGeoJson = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  HotspotFeatureProperties
>;

interface HotspotMapProps {
  hotspotsGeoJson?: HotspotGeoJson;
  selectedClusterId?: string | null;
  onSelectHotspot?: (clusterId: string) => void;
  onInspectCluster?: (clusterId: string) => void;
  className?: string;
  initialCenter?: [number, number]; // [lng, lat]
  initialZoom?: number;
}

const DEFAULT_CENTER: [number, number] = [-46.633308, -23.550520];
const DEFAULT_ZOOM = 13;

export function HotspotMap({
  hotspotsGeoJson,
  selectedClusterId,
  onSelectHotspot,
  onInspectCluster,
  className = '',
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
}: HotspotMapProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const mapStyleUrl = isDark
    ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
    : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const popupRef = useRef<Popup | null>(null);

  // Armazena callbacks e configurações em refs para imunizar o mapa contra remontagens
  const onSelectHotspotRef = useRef(onSelectHotspot);
  onSelectHotspotRef.current = onSelectHotspot;

  const onInspectClusterRef = useRef(onInspectCluster);
  onInspectClusterRef.current = onInspectCluster;

  const initialCenterRef = useRef(initialCenter);
  const initialZoomRef = useRef(initialZoom);

  // Evita duplo flyTo quando o próprio clique no mapa já animou a câmera
  const lastClickedClusterIdRef = useRef<string | null>(null);

  // 1. Inicialização Estável do Mapa (Instância única por tema)
  useEffect(() => {
    let isMounted = true;
    if (!mapContainerRef.current) return;

    if (mapRef.current) {
      try {
        mapRef.current.remove();
      } catch {
        // ignore
      }
      mapRef.current = null;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: mapStyleUrl,
      center: initialCenterRef.current,
      zoom: initialZoomRef.current,
      attributionControl: false,
    });

    const canvas = map.getCanvas();
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      console.warn('MapLibre WebGL context lost - prevenindo crash.');
    };
    canvas?.addEventListener('webglcontextlost', handleContextLost, false);

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-right'
    );

    map.on('load', () => {
      if (!isMounted) return;
      setIsMapLoaded(true);

      // Adiciona Fonte GeoJSON Inicial
      if (!map.getSource('hotspots-source')) {
        map.addSource('hotspots-source', {
          type: 'geojson',
          data: hotspotsGeoJson || {
            type: 'FeatureCollection',
            features: [],
          },
        });
      }

      // Camada 1: Halo Térmico
      if (!map.getLayer('hotspots-glow')) {
        map.addLayer({
          id: 'hotspots-glow',
          type: 'circle',
          source: 'hotspots-source',
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['get', 'confirmations_count'],
              1, 16,
              5, 26,
              15, 38
            ],
            'circle-color': [
              'step',
              ['get', 'priority_score'],
              '#10b981',
              40,
              '#f59e0b',
              75,
              '#ef4444'
            ],
            'circle-opacity': 0.22,
            'circle-blur': 0.8,
          },
        });
      }

      // Camada 2: Círculo Central
      if (!map.getLayer('hotspots-circles')) {
        map.addLayer({
          id: 'hotspots-circles',
          type: 'circle',
          source: 'hotspots-source',
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['get', 'confirmations_count'],
              1, 8,
              5, 13,
              15, 18
            ],
            'circle-color': [
              'step',
              ['get', 'priority_score'],
              '#10b981',
              40,
              '#f59e0b',
              75,
              '#ef4444'
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.95,
          },
        });
      }

      // Camada 3: Contador Numérico
      if (!map.getLayer('hotspots-count-label')) {
        map.addLayer({
          id: 'hotspots-count-label',
          type: 'symbol',
          source: 'hotspots-source',
          filter: ['>', ['get', 'confirmations_count'], 1],
          layout: {
            'text-field': ['to-string', ['get', 'confirmations_count']],
            'text-size': 10,
            'text-allow-overlap': true,
            'text-ignore-placement': true,
          },
          paint: {
            'text-color': '#ffffff',
            'text-halo-color': '#000000',
            'text-halo-width': 1.5,
          },
        });
      }

      map.on('mouseenter', 'hotspots-circles', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'hotspots-circles', () => {
        map.getCanvas().style.cursor = '';
      });

      // Transição suave ao clicar num ponto partindo estritamente da câmera atual
      map.on('click', 'hotspots-circles', (e) => {
        if (!e.features || !e.features[0]) return;
        const feature = e.features[0];
        const props = feature.properties as unknown as HotspotFeatureProperties;
        const coordinates = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number];

        // Marca que o clique partiu deste mapa para não duplicar flyTo no efeito de sincronização externa
        lastClickedClusterIdRef.current = props.cluster_id;

        // Voo suave partindo da posição e zoom atuais
        map.flyTo({
          center: coordinates,
          zoom: Math.max(map.getZoom(), 15),
          essential: true,
          speed: 1.2,
          curve: 1.42,
        });

        if (onSelectHotspotRef.current && props.cluster_id) {
          onSelectHotspotRef.current(props.cluster_id);
        }

        if (popupRef.current) popupRef.current.remove();

        const priorityLabel = props.priority_score >= 75
          ? '<span style="color:#ef4444;font-weight:bold;">CRÍTICO</span>'
          : props.priority_score >= 40
            ? '<span style="color:#f59e0b;font-weight:bold;">MÉDIO</span>'
            : '<span style="color:#10b981;font-weight:bold;">BAIXO</span>';

        const scaleLabel = props.dominant_scale === 'LARGE'
          ? 'GRANDE (Caçamba)'
          : props.dominant_scale === 'MEDIUM'
            ? 'MÉDIO (Porta-malas)'
            : 'PEQUENO (Sacos)';

        const resolvedPhotoUrl = props.sample_photo_url || props.latest_photo_url || (props.status === 'CLEANED' ? props.cleaned_photo_url : null) || 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=400&q=80';

        const photoHtml = `
          <div style="margin-bottom:8px;border-radius:6px;overflow:hidden;height:115px;background:#18181b;position:relative;">
            <img src="${resolvedPhotoUrl}" style="width:100%;height:100%;object-fit:cover;" alt="Foto do Hotspot" onerror="this.src='https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=400&q=80'" />
            ${props.status === 'CLEANED' ? '<div style="position:absolute;top:4px;right:4px;background:#059669;color:#fff;font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px;">RESOLVIDO</div>' : ''}
          </div>
        `;

        const popupContent = document.createElement('div');
        popupContent.className = 'text-xs font-sans p-1';
        popupContent.style.minWidth = '220px';
        popupContent.innerHTML = `
          ${photoHtml}
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <strong style="font-family:monospace;font-size:12px;">${props.protocol_code || 'ECO-NOVO'}</strong>
            <span style="font-size:10px;padding:2px 6px;border-radius:4px;border:1px solid currentColor;">
              ${priorityLabel} (${Math.round(props.priority_score || 0)}%)
            </span>
          </div>
          <div style="font-size:11px;margin-bottom:8px;opacity:0.85;line-height:1.4;">
            Escala: <strong>${scaleLabel}</strong><br/>
            Validação: <strong style="color:#059669;">${props.confirmations_count || 1} confirmações</strong>
          </div>
          <button id="btn-inspect-cluster" style="width:100%;background:#059669;color:#ffffff;font-weight:600;padding:7px;border-radius:6px;border:none;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;gap:4px;transition:background 0.2s;">
            🔍 Ver Detalhes do Foco
          </button>
        `;

        popupContent.querySelector('#btn-inspect-cluster')?.addEventListener('click', () => {
          if (onInspectClusterRef.current && props.cluster_id) {
            onInspectClusterRef.current(props.cluster_id);
          } else if (onSelectHotspotRef.current && props.cluster_id) {
            onSelectHotspotRef.current(props.cluster_id);
          }
        });

        // Popup nativo MapLibre gerenciado diretamente no DOM, sem causar re-render do React
        popupRef.current = new maplibregl.Popup({
          closeButton: true,
          closeOnClick: false,
          className: 'ecocidadao-dark-popup',
          offset: 14,
        })
          .setLngLat(coordinates)
          .setDOMContent(popupContent)
          .addTo(map);
      });
    });

    mapRef.current = map;

    return () => {
      isMounted = false;
      canvas?.removeEventListener('webglcontextlost', handleContextLost);
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {
          // ignore
        }
        mapRef.current = null;
      }
    };
  }, [mapStyleUrl]);

  // 2. Atualização dos Dados GeoJSON sem afetar a câmera
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded || !hotspotsGeoJson) return;

    try {
      const source = mapRef.current.getSource('hotspots-source') as GeoJSONSource | undefined;
      if (source) {
        source.setData(hotspotsGeoJson);
      }
    } catch (err) {
      console.warn('Erro ao atualizar GeoJSON no mapa:', err);
    }
  }, [hotspotsGeoJson, isMapLoaded]);

  // 3. Centralização externa ao Selecionar um Cluster (por URL, deep link ou tabela externa)
  useEffect(() => {
    if (!mapRef.current || !selectedClusterId || !hotspotsGeoJson) return;

    // Se a seleção recente partiu de um clique direto no próprio mapa, o flyTo já ocorreu suavemente
    if (lastClickedClusterIdRef.current === selectedClusterId) {
      lastClickedClusterIdRef.current = null;
      return;
    }

    const targetFeature = hotspotsGeoJson.features.find(
      (f) => f.properties?.cluster_id === selectedClusterId
    );

    if (targetFeature && targetFeature.geometry.type === 'Point') {
      const coords = targetFeature.geometry.coordinates as [number, number];
      mapRef.current.flyTo({
        center: coords,
        zoom: Math.max(mapRef.current.getZoom(), 15),
        speed: 1.2,
        curve: 1.42,
        essential: true,
      });
    }
  }, [selectedClusterId, hotspotsGeoJson]);

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleResetNorth = () => mapRef.current?.resetNorthPitch();

  return (
    <div className={`relative w-full h-full overflow-hidden bg-zinc-100 dark:bg-zinc-950 transition-colors ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Controles Flutuantes com Suporte a Modo Claro/Escuro */}
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-1.5 bg-white/95 dark:bg-zinc-950/85 backdrop-blur-md p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-md transition-colors">
        <button
          onClick={handleZoomIn}
          className="w-7 h-7 flex items-center justify-center rounded text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title="Aproximar (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-7 h-7 flex items-center justify-center rounded text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title="Afastar (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetNorth}
          className="w-7 h-7 flex items-center justify-center rounded text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title="Orientar para o Norte"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>

      {/* Legenda Térmica */}
      <div className="absolute bottom-5 left-4 z-10 bg-white/95 dark:bg-zinc-950/85 backdrop-blur-md px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[11px] shadow-md flex items-center space-x-3 select-none transition-colors">
        <span className="font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[10px]">
          Severidade:
        </span>
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-xs" />
          <span className="text-zinc-700 dark:text-zinc-300 font-medium">Crítico (&ge;75)</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs" />
          <span className="text-zinc-700 dark:text-zinc-300 font-medium">Médio (40-74)</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
          <span className="text-zinc-700 dark:text-zinc-300 font-medium">Baixo (&lt;40)</span>
        </div>
      </div>
    </div>
  );
}
