"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
  zoom?: {
    min: number;
    max: number;
    step?: number;
  };
}

interface UseCameraZoomOptions {
  videoTrack: MediaStreamTrack | null;
  maxDigitalZoom?: number;
}

export interface UseCameraZoomReturn {
  zoom: number;
  minZoom: number;
  maxZoom: number;
  isHardwareZoom: boolean;
  isPinching: boolean;
  setZoomLevel: (targetZoom: number) => void;
  resetZoom: () => void;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: (e: React.TouchEvent) => void;
}

export const useCameraZoom = ({
  videoTrack,
  maxDigitalZoom = 4,
}: UseCameraZoomOptions): UseCameraZoomReturn => {
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(maxDigitalZoom);
  const [isHardwareZoom, setIsHardwareZoom] = useState(false);
  const [isPinching, setIsPinching] = useState(false);

  // Refs mutáveis para estabilidade referencial absoluta dos callbacks
  const zoomRef = useRef(1);
  const minZoomRef = useRef(1);
  const maxZoomRef = useRef(maxDigitalZoom);
  const isHardwareZoomRef = useRef(false);
  const videoTrackRef = useRef<MediaStreamTrack | null>(videoTrack);

  // Refs para controle do gesto de pinça
  const initialTouchDistanceRef = useRef<number | null>(null);
  const initialTouchZoomRef = useRef<number>(1);
  const isApplyingHardwareZoomRef = useRef(false);
  const pendingHardwareZoomRef = useRef<number | null>(null);

  // Sincroniza refs quando valores mudam
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    videoTrackRef.current = videoTrack;
  }, [videoTrack]);

  // Aplica zoom no hardware com controle de concorrência e leitura via ref (estável sem deps mutáveis)
  const applyHardwareConstraint = useCallback(
    async (targetZoom: number) => {
      const track = videoTrackRef.current;
      if (!track) return;

      if (isApplyingHardwareZoomRef.current) {
        pendingHardwareZoomRef.current = targetZoom;
        return;
      }

      isApplyingHardwareZoomRef.current = true;
      try {
        await track.applyConstraints({
          advanced: [{ zoom: targetZoom } as MediaTrackConstraintSet],
        });
      } catch (err) {
        console.warn("[useCameraZoom] Falha ao aplicar zoom no hardware, fallback ativo:", err);
      } finally {
        isApplyingHardwareZoomRef.current = false;
        if (
          pendingHardwareZoomRef.current !== null &&
          pendingHardwareZoomRef.current !== targetZoom
        ) {
          const next = pendingHardwareZoomRef.current;
          pendingHardwareZoomRef.current = null;
          applyHardwareConstraint(next);
        }
      }
    },
    []
  );

  // Detecta capacidades da câmera quando a faixa de vídeo mudar
  useEffect(() => {
    if (!videoTrack) {
      setZoom(1);
      zoomRef.current = 1;
      setIsHardwareZoom(false);
      isHardwareZoomRef.current = false;
      setMinZoom(1);
      minZoomRef.current = 1;
      setMaxZoom(maxDigitalZoom);
      maxZoomRef.current = maxDigitalZoom;
      return;
    }

    videoTrackRef.current = videoTrack;

    if ("getCapabilities" in videoTrack) {
      try {
        const capabilities = videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;
        if (
          capabilities.zoom &&
          typeof capabilities.zoom === "object" &&
          typeof capabilities.zoom.min === "number" &&
          typeof capabilities.zoom.max === "number"
        ) {
          const min = Math.max(1, capabilities.zoom.min);
          const max = Math.min(5, capabilities.zoom.max); // Limite de 5x para nitidez
          setIsHardwareZoom(true);
          isHardwareZoomRef.current = true;
          setMinZoom(min);
          minZoomRef.current = min;
          setMaxZoom(max);
          maxZoomRef.current = max;
          setZoom(min);
          zoomRef.current = min;
          applyHardwareConstraint(min);
          return;
        }
      } catch {
        // Fallback silencioso para zoom digital
      }
    }

    // Fallback digital (ex: iOS / Safari)
    setIsHardwareZoom(false);
    isHardwareZoomRef.current = false;
    setMinZoom(1);
    minZoomRef.current = 1;
    setMaxZoom(maxDigitalZoom);
    maxZoomRef.current = maxDigitalZoom;
    setZoom(1);
    zoomRef.current = 1;
  }, [videoTrack, maxDigitalZoom, applyHardwareConstraint]);

  // Função estável para alterar o zoom
  const setZoomLevel = useCallback(
    (targetZoom: number) => {
      const min = minZoomRef.current;
      const max = maxZoomRef.current;
      const clamped = Math.max(min, Math.min(max, targetZoom));
      const rounded = Math.round(clamped * 10) / 10;
      setZoom(rounded);
      zoomRef.current = rounded;

      if (isHardwareZoomRef.current) {
        applyHardwareConstraint(rounded);
      }
    },
    [applyHardwareConstraint]
  );

  // Reseta o zoom para 1x de forma referencialmente estável
  const resetZoom = useCallback(() => {
    setZoom(1);
    zoomRef.current = 1;
    initialTouchDistanceRef.current = null;
    initialTouchZoomRef.current = 1;
    if (isHardwareZoomRef.current) {
      applyHardwareConstraint(1);
    }
  }, [applyHardwareConstraint]);

  // Auxiliar para cálculo de distância Euclidiana entre dois dedos
  const getPinchDistance = (touches: React.TouchList): number => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = getPinchDistance(e.touches);
      initialTouchDistanceRef.current = dist;
      initialTouchZoomRef.current = zoomRef.current;
      setIsPinching(true);
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && initialTouchDistanceRef.current !== null) {
        if (e.cancelable) {
          e.preventDefault();
        }

        const currentDist = getPinchDistance(e.touches);
        const scaleFactor = currentDist / initialTouchDistanceRef.current;
        const newZoom = initialTouchZoomRef.current * scaleFactor;

        const min = minZoomRef.current;
        const max = maxZoomRef.current;
        const clamped = Math.max(min, Math.min(max, newZoom));
        const rounded = Math.round(clamped * 10) / 10;
        setZoom(rounded);
        zoomRef.current = rounded;

        if (isHardwareZoomRef.current) {
          applyHardwareConstraint(rounded);
        }
      }
    },
    [applyHardwareConstraint]
  );

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      initialTouchDistanceRef.current = null;
      setIsPinching(false);
    }
  }, []);

  return {
    zoom,
    minZoom,
    maxZoom,
    isHardwareZoom,
    isPinching,
    setZoomLevel,
    resetZoom,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};
