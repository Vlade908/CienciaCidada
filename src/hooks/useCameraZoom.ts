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

  // Refs para controle do gesto de pinça
  const initialTouchDistanceRef = useRef<number | null>(null);
  const initialTouchZoomRef = useRef<number>(1);
  const isApplyingHardwareZoomRef = useRef(false);
  const pendingHardwareZoomRef = useRef<number | null>(null);

  // Aplica zoom no hardware com controle de concorrência
  const applyHardwareConstraint = useCallback(
    async (track: MediaStreamTrack, targetZoom: number) => {
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
          applyHardwareConstraint(track, next);
        }
      }
    },
    []
  );

  // Detecta capacidades da câmera quando a faixa de vídeo mudar
  useEffect(() => {
    if (!videoTrack) {
      setZoom(1);
      setIsHardwareZoom(false);
      setMinZoom(1);
      setMaxZoom(maxDigitalZoom);
      return;
    }

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
          const max = Math.min(5, capabilities.zoom.max); // Limite de 5x para manter nitidez
          setIsHardwareZoom(true);
          setMinZoom(min);
          setMaxZoom(max);
          setZoom(min);
          applyHardwareConstraint(videoTrack, min);
          return;
        }
      } catch {
        // Fallback silencioso para zoom digital
      }
    }

    // Fallback digital (ex: iOS / Safari)
    setIsHardwareZoom(false);
    setMinZoom(1);
    setMaxZoom(maxDigitalZoom);
    setZoom(1);
  }, [videoTrack, maxDigitalZoom, applyHardwareConstraint]);

  // Função central para alterar o zoom
  const setZoomLevel = useCallback(
    (targetZoom: number) => {
      const clamped = Math.max(minZoom, Math.min(maxZoom, targetZoom));
      const rounded = Math.round(clamped * 10) / 10;
      setZoom(rounded);

      if (isHardwareZoom && videoTrack) {
        applyHardwareConstraint(videoTrack, rounded);
      }
    },
    [minZoom, maxZoom, isHardwareZoom, videoTrack, applyHardwareConstraint]
  );

  // Reseta o zoom para 1x
  const resetZoom = useCallback(() => {
    setZoom(1);
    initialTouchDistanceRef.current = null;
    initialTouchZoomRef.current = 1;
    if (isHardwareZoom && videoTrack) {
      applyHardwareConstraint(videoTrack, 1);
    }
  }, [isHardwareZoom, videoTrack, applyHardwareConstraint]);

  // Auxiliar para cálculo de distância Euclidiana entre dois dedos
  const getPinchDistance = (touches: React.TouchList): number => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        const dist = getPinchDistance(e.touches);
        initialTouchDistanceRef.current = dist;
        initialTouchZoomRef.current = zoom;
        setIsPinching(true);
      }
    },
    [zoom]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && initialTouchDistanceRef.current !== null) {
        // Previne comportamento padrão de zoom da página/viewport do navegador
        if (e.cancelable) {
          e.preventDefault();
        }

        const currentDist = getPinchDistance(e.touches);
        const scaleFactor = currentDist / initialTouchDistanceRef.current;
        const newZoom = initialTouchZoomRef.current * scaleFactor;

        const clamped = Math.max(minZoom, Math.min(maxZoom, newZoom));
        const rounded = Math.round(clamped * 10) / 10;
        setZoom(rounded);

        if (isHardwareZoom && videoTrack) {
          applyHardwareConstraint(videoTrack, rounded);
        }
      }
    },
    [minZoom, maxZoom, isHardwareZoom, videoTrack, applyHardwareConstraint]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length < 2) {
        initialTouchDistanceRef.current = null;
        setIsPinching(false);
      }
    },
    []
  );

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
