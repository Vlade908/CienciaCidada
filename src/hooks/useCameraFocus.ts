"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export interface FocusPoint {
  x: number;
  y: number;
  visible: boolean;
  locked: boolean;
}

interface UseCameraFocusOptions {
  videoTrack: MediaStreamTrack | null;
  zoom?: number;
}

export interface UseCameraFocusReturn {
  focusPoint: FocusPoint | null;
  triggerFocus: (clientX: number, clientY: number, containerRect: DOMRect) => void;
  dismissFocus: () => void;
}

export function useCameraFocus({
  videoTrack,
  zoom = 1,
}: UseCameraFocusOptions): UseCameraFocusReturn {
  const [focusPoint, setFocusPoint] = useState<FocusPoint | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(videoTrack);
  const zoomRef = useRef<number>(zoom);

  // Mantém refs atualizadas sem causar re-criação de callbacks
  useEffect(() => {
    videoTrackRef.current = videoTrack;
  }, [videoTrack]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  // Limpa todos os timers pendentes com segurança
  const clearFocusTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (lockTimerRef.current) {
      clearTimeout(lockTimerRef.current);
      lockTimerRef.current = null;
    }
  }, []);

  // Desativa e esconde o retículo de foco
  const dismissFocus = useCallback(() => {
    clearFocusTimers();
    setFocusPoint(null);
  }, [clearFocusTimers]);

  // Aciona o foco tátil e medição de luz
  const triggerFocus = useCallback(
    (clientX: number, clientY: number, containerRect: DOMRect) => {
      clearFocusTimers();

      // Coordenadas relativas ao container visual da câmera
      const rawX = clientX - containerRect.left;
      const rawY = clientY - containerRect.top;

      // Clamping defensivo dentro do retângulo do visor
      const x = Math.max(30, Math.min(containerRect.width - 30, rawX));
      const y = Math.max(40, Math.min(containerRect.height - 40, rawY));

      // Coordenadas normalizadas na tela (0.0 a 1.0)
      const normX = x / containerRect.width;
      const normY = y / containerRect.height;

      // Compensação geométrica de zoom digital centralizado
      const currentZoom = Math.max(1, zoomRef.current);
      const uReal = Math.max(0, Math.min(1, 0.5 + (normX - 0.5) / currentZoom));
      const vReal = Math.max(0, Math.min(1, 0.5 + (normY - 0.5) / currentZoom));

      // Exibe retículo imediatamente no ponto clicado
      setFocusPoint({
        x,
        y,
        visible: true,
        locked: false,
      });

      // Feedback tátil sutil estilo câmera nativa (15ms)
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate(15);
        } catch {
          // Ignora caso dispositivo bloqueie vibração
        }
      }

      // Aplicação no hardware via MediaStreamTrack quando suportado
      const track = videoTrackRef.current;
      if (track && "getCapabilities" in track) {
        try {
          const caps = track.getCapabilities() as MediaTrackCapabilities & {
            focusMode?: string[];
            exposureMode?: string[];
            pointsOfInterest?: boolean;
          };

          const advConstraints: Record<string, unknown> = {};

          if (Array.isArray(caps.focusMode)) {
            if (caps.focusMode.includes("single-shot")) {
              advConstraints.focusMode = "single-shot";
            } else if (caps.focusMode.includes("continuous")) {
              advConstraints.focusMode = "continuous";
            }
          }

          if (caps.pointsOfInterest) {
            advConstraints.pointsOfInterest = [{ x: uReal, y: vReal }];
          }

          if (Array.isArray(caps.exposureMode) && caps.exposureMode.includes("continuous")) {
            advConstraints.exposureMode = "continuous";
          }

          if (Object.keys(advConstraints).length > 0) {
            track.applyConstraints({
              advanced: [advConstraints as MediaTrackConstraintSet],
            }).catch(() => {
              // Silencioso se o sensor recusar a restrição pontual
            });
          }
        } catch {
          // Fallback silencioso
        }
      }

      // Timer 1: Transição para estado travado (pulso leve de confirmação)
      lockTimerRef.current = setTimeout(() => {
        setFocusPoint((prev) => (prev ? { ...prev, locked: true } : null));
      }, 240);

      // Timer 2: Desaparecimento suave após 2 segundos
      timerRef.current = setTimeout(() => {
        setFocusPoint((prev) => (prev ? { ...prev, visible: false } : null));
      }, 2000);
    },
    [clearFocusTimers]
  );

  // Limpeza de timers no desmonte do componente
  useEffect(() => {
    return () => {
      clearFocusTimers();
    };
  }, [clearFocusTimers]);

  return {
    focusPoint,
    triggerFocus,
    dismissFocus,
  };
}
