'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap, GeoJSONSource, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Layers, ZoomIn, ZoomOut, Compass, Eye, ShieldAlert } from 'lucide-react';

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
  initialCenter = [-46.633308, -23.550520], // São Paulo Centro
  initialZoom = 13,
}: HotspotMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const popupRef = useRef<Popup | null>(null);

  // 1. Inicialização do Mapa com Tiles CartoDB Dark Matter (100% Free / Sem API Key)
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: initialCenter,
      zoom: initialZoom,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-right'
    );

    map.on('load', () => {
      setIsMapLoaded(true);

      // Adiciona Fonte GeoJSON Vazia Inicial
      map.addSource('hotspots-source', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      // Camada 1: Halo de Brilho Térmico / Área de Influência (25m)
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
            '#10b981', // Verde < 40
            40,
            '#f59e0b', // Âmbar 40 - 74
            75,
            '#ef4444'  // Vermelho >= 75
          ],
          'circle-opacity': 0.22,
          'circle-blur': 0.8,
        },
      });

      // Camada 2: Círculo Central do Foco (Tamanho ponderado por confirmações)
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

      // Camada 3: Contador Numérico de Cidadãos dentro do Marcador
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

      // Cursor Pointer ao passar em cima de um foco
      map.on('mouseenter', 'hotspots-circles', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'hotspots-circles', () => {
        map.getCanvas().style.cursor = '';
      });

      // Evento de Clique: Seleciona o cluster e abre Popup técnico
      map.on('click', 'hotspots-circles', (e) => {
        if (!e.features || !e.features[0]) return;
        const feature = e.features[0];
        const props = feature.properties as unknown as HotspotFeatureProperties;
        const coordinates = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number];

        // Centraliza e aproxima suavemente
        map.flyTo({
          center: coordinates,
          zoom: Math.max(map.getZoom(), 15),
          essential: true,
          speed: 1.2,
        });

        if (onSelectHotspot && props.cluster_id) {
          onSelectHotspot(props.cluster_id);
        }

        // Monta o popup utilitário com estilo escuro
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
        popupContent.className = 'text-zinc-200 text-xs font-sans p-1';
        popupContent.style.minWidth = '210px';
        popupContent.innerHTML = `
          ${photoHtml}
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <strong style="color:#fafafa;font-family:monospace;font-size:12px;">${props.protocol_code || 'ECO-NOVO'}</strong>
            <span style="font-size:10px;background:#27272a;padding:2px 6px;border-radius:4px;border:1px solid #3f3f46;">
              ${priorityLabel} (${Math.round(props.priority_score || 0)})
            </span>
          </div>
          <div style="color:#a1a1aa;font-size:11px;margin-bottom:6px;">
            Escala: <span style="color:#e4e4e7;">${scaleLabel}</span><br/>
            Validação: <strong style="color:#34d399;">${props.confirmations_count || 1} cidadãos</strong> unificados
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
      if (popupRef.current) popupRef.current.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [initialCenter, initialZoom, onSelectHotspot]);

  // 2. Atualização dos Dados GeoJSON no Mapa
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded || !hotspotsGeoJson) return;

    const source = mapRef.current.getSource('hotspots-source') as GeoJSONSource | undefined;
    if (source) {
      source.setData(hotspotsGeoJson);
    }
  }, [hotspotsGeoJson, isMapLoaded]);

  // 3. Centralização ao Selecionar um Cluster pelo Painel Lateral
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

  // Controles de Zoom do Mapa
  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleResetNorth = () => mapRef.current?.resetNorthPitch();

  return (
    <div className={`relative w-full h-full overflow-hidden bg-zinc-950 ${className}`}>
      {/* Container WebGL do MapLibre */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Controles Flutuantes Estilizados (Minimalista / Glassmorphism) */}
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-1.5 bg-zinc-950/80 backdrop-blur-md p-1 rounded-lg border border-zinc-800 shadow-xl">
        <button
          onClick={handleZoomIn}
          className="w-7 h-7 flex items-center justify-center rounded text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          title="Aproximar (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-7 h-7 flex items-center justify-center rounded text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          title="Afastar (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetNorth}
          className="w-7 h-7 flex items-center justify-center rounded text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          title="Orientar para o Norte"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>

      {/* Legenda de Severidade Térmica (Canto Inferior Esquerdo) */}
      <div className="absolute bottom-5 left-4 z-10 bg-zinc-950/85 backdrop-blur-md px-3 py-2 rounded-lg border border-zinc-800/90 text-[11px] shadow-lg flex items-center space-x-3 select-none">
        <span className="font-semibold text-zinc-300 uppercase tracking-wider text-[10px]">
          Severidade:
        </span>
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
          <span className="text-zinc-300">Crítico (&ge;75)</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
          <span className="text-zinc-300">Médio (40-74)</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
          <span className="text-zinc-300">Baixo (&lt;40)</span>
        </div>
      </div>
    </div>
  );
}
