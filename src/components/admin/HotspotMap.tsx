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
  dominant_scale: 'SMALL' | 'MEDIUM' | 'LARGE';
  latest_photo_url?: string;
  status?: string;
  waste_tags?: string[];
}

export type HotspotGeoJson = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  HotspotFeatureProperties
>;

interface HotspotMapProps {
  hotspotsGeoJson?: HotspotGeoJson;
  selectedClusterId?: string | null;
  onSelectHotspot?: (clusterId: string) => void;
  className?: string;
  initialCenter?: [number, number]; // [lng, lat]
  initialZoom?: number;
}

export function HotspotMap({
  hotspotsGeoJson,
  selectedClusterId,
  onSelectHotspot,
  className = '',
  initialCenter = [-46.633308, -23.550520],
  initialZoom = 13,
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

  // 1. Inicialização do Mapa
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
      center: initialCenter,
      zoom: initialZoom,
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

      map.on('click', 'hotspots-circles', (e) => {
        if (!e.features || !e.features[0]) return;
        const feature = e.features[0];
        const props = feature.properties as unknown as HotspotFeatureProperties;
        const coordinates = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number];

        map.flyTo({
          center: coordinates,
          zoom: Math.max(map.getZoom(), 15),
          essential: true,
          speed: 1.2,
        });

        if (onSelectHotspot && props.cluster_id) {
          onSelectHotspot(props.cluster_id);
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

        const photoHtml = props.latest_photo_url
          ? `<div style="margin-bottom:8px;border-radius:6px;overflow:hidden;max-height:110px;background:#18181b;">
               <img src="${props.latest_photo_url}" style="width:100%;height:110px;object-fit:cover;" alt="Foto do Entulho" />
             </div>`
          : '';

        const popupContent = document.createElement('div');
        popupContent.className = 'text-xs font-sans p-1';
        popupContent.style.minWidth = '210px';
        popupContent.innerHTML = `
          ${photoHtml}
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <strong style="font-family:monospace;font-size:12px;">${props.protocol_code || 'ECO-NOVO'}</strong>
            <span style="font-size:10px;padding:2px 6px;border-radius:4px;border:1px solid currentColor;">
              ${priorityLabel} (${Math.round(props.priority_score || 0)})
            </span>
          </div>
          <div style="font-size:11px;margin-bottom:6px;opacity:0.85;">
            Escala: <strong>${scaleLabel}</strong><br/>
            Validação: <strong style="color:#059669;">${props.confirmations_count || 1} cidadãos</strong> unificados
          </div>
          <button id="btn-inspect-cluster" style="width:100%;background:#059669;color:#ffffff;font-weight:600;padding:6px;border-radius:6px;border:none;cursor:pointer;font-size:11px;">
            Inspecionar e Despachar
          </button>
        `;

        popupContent.querySelector('#btn-inspect-cluster')?.addEventListener('click', () => {
          if (onSelectHotspot && props.cluster_id) {
            onSelectHotspot(props.cluster_id);
          }
        });

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
  }, [initialCenter, initialZoom, onSelectHotspot, mapStyleUrl]);

  // 2. Atualização dos Dados GeoJSON
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

  // 3. Centralização ao Selecionar um Cluster
  useEffect(() => {
    if (!mapRef.current || !selectedClusterId || !hotspotsGeoJson) return;

    const targetFeature = hotspotsGeoJson.features.find(
      (f) => f.properties?.cluster_id === selectedClusterId
    );

    if (targetFeature && targetFeature.geometry.type === 'Point') {
      const coords = targetFeature.geometry.coordinates as [number, number];
      mapRef.current.flyTo({
        center: coords,
        zoom: 16,
        speed: 1.4,
        essential: true,
      });
    }
  }, [selectedClusterId, hotspotsGeoJson]);

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleResetNorth = () => mapRef.current?.resetNorthPitch();

  return (
    <div className={`relative w-full h-full overflow-hidden bg-[#f1f3f0] dark:bg-zinc-950 transition-colors ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Controles Flutuantes com Suporte a Modo Claro/Escuro */}
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-1.5 bg-[#f8faf7]/95 dark:bg-zinc-950/80 backdrop-blur-md p-1 rounded-lg border border-stone-200 dark:border-zinc-800 shadow-md transition-colors">
        <button
          onClick={handleZoomIn}
          className="w-7 h-7 flex items-center justify-center rounded text-stone-700 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
          title="Aproximar (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-7 h-7 flex items-center justify-center rounded text-stone-700 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
          title="Afastar (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetNorth}
          className="w-7 h-7 flex items-center justify-center rounded text-stone-700 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
          title="Orientar para o Norte"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>

      {/* Legenda Térmica */}
      <div className="absolute bottom-5 left-4 z-10 bg-[#f8faf7]/95 dark:bg-zinc-950/85 backdrop-blur-md px-3 py-2 rounded-lg border border-stone-200 dark:border-zinc-800/90 text-[11px] shadow-md flex items-center space-x-3 select-none transition-colors">
        <span className="font-semibold text-stone-700 dark:text-zinc-300 uppercase tracking-wider text-[10px]">
          Severidade:
        </span>
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-xs" />
          <span className="text-stone-700 dark:text-zinc-300 font-medium">Crítico (&ge;75)</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs" />
          <span className="text-stone-700 dark:text-zinc-300 font-medium">Médio (40-74)</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
          <span className="text-stone-700 dark:text-zinc-300 font-medium">Baixo (&lt;40)</span>
        </div>
      </div>
    </div>
  );
}
