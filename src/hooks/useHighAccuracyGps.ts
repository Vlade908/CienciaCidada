"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Estados possíveis do motor de geolocalização Mobile-First (EcoCidadão):
 * - CALIBRATING: "Cold Start" em andamento (receptor GNSS refinando satélites em background).
 * - LOCKED: Alta precisão atingida (erro <= targetAccuracyMeters, padrão 20m).
 * - QR_ANCHORED: Posição cravada via placa física de QR Code (?qr=...&lat=...&lng=...).
 * - FALLBACK_EXIF: GPS do navegador indisponível/negado; o Web Worker usará o EXIF da foto.
 */
export type GpsState =
  | "CALIBRATING"
  | "LOCKED"
  | "QR_ANCHORED"
  | "FALLBACK_EXIF";

export type LocationSource = "BROWSER_GPS" | "QR_ANCHOR" | "EXIF_GPS";

export interface QrAnchorPayload {
  code: string;
  lat: number;
  lng: number;
  addressHint?: string;
  isEcoCritical?: boolean;
}

export interface GpsCoordinates {
  lat: number;
  lng: number;
  accuracyMeters: number;
  headingDegrees: number | null;
  altitudeMeters: number | null;
  source: LocationSource;
  capturedAt: number;
}

export interface UseHighAccuracyGpsOptions {
  /** Meta de precisão em metros para considerar o satélite "travado" (Default: 20m) */
  targetAccuracyMeters?: number;
  /** Precisão mínima aceitável antes de preferir a âncora QR Code (Default: 35m) */
  maxAcceptableAccuracyMeters?: number;
  /** Timeout máximo do Cold Start antes de estabilizar com a melhor leitura obtida (Default: 10000ms) */
  coldStartTimeoutMs?: number;
  /** Dados da placa física caso o usuário tenha aberto via QR Code na rua */
  qrAnchor?: QrAnchorPayload | null;
  /** Permite pausar o watchPosition quando o relato já foi concluído (economia de bateria) */
  enabled?: boolean;
}

export interface UseHighAccuracyGpsReturn {
  /** Estado semântico atual para o componente <GpsStatusPill /> */
  state: GpsState;
  /** Melhor leitura obtida até o momento (nunca regride para uma precisão pior) */
  coordinates: GpsCoordinates | null;
  /** Raio de incerteza atual em metros (arredondado para exibição tabular) */
  accuracyMeters: number | null;
  /** Progresso de convergência de 0 a 100 para feedback visual sutil */
  convergenceProgress: number;
  /** Mensagem de diagnóstico clara e acionável caso ocorra degradação */
  diagnosticMessage: string | null;
  /**
   * Função não-bloqueante chamada no Toque 2 (escolha do porte P/M/G).
   * Se o GPS ainda estiver em Cold Start, aguarda uma micro-janela (ex: 1200ms)
   * e retorna imediatamente a coordenada mais precisa (GPS <=20m > QR Anchor > Melhor GPS).
   */
  resolveBestLocation: (gracePeriodMs?: number) => Promise<GpsCoordinates | null>;
  /** Força uma nova tentativa de calibração (útil se o usuário ativou o GPS nas configurações) */
  retryCalibration: () => void;
}

export function useHighAccuracyGps({
  targetAccuracyMeters = 20,
  maxAcceptableAccuracyMeters = 35,
  coldStartTimeoutMs = 10000,
  qrAnchor = null,
  enabled = true,
}: UseHighAccuracyGpsOptions = {}): UseHighAccuracyGpsReturn {
  const initialQrCoords: GpsCoordinates | null = qrAnchor
    ? {
        lat: qrAnchor.lat,
        lng: qrAnchor.lng,
        accuracyMeters: 5,
        headingDegrees: null,
        altitudeMeters: null,
        source: "QR_ANCHOR",
        capturedAt: Date.now(),
      }
    : null;

  const [state, setState] = useState<GpsState>(
    qrAnchor ? "QR_ANCHORED" : "CALIBRATING"
  );
  const [coordinates, setCoordinates] = useState<GpsCoordinates | null>(
    initialQrCoords
  );
  const [diagnosticMessage, setDiagnosticMessage] = useState<string | null>(
    null
  );
  const [retryCounter, setRetryCounter] = useState(0);

  // Refs mutáveis para leitura instantânea dentro da Promise do Toque 2 sem stale closures
  const bestCoordsRef = useRef<GpsCoordinates | null>(initialQrCoords);
  const stateRef = useRef<GpsState>(qrAnchor ? "QR_ANCHORED" : "CALIBRATING");
  const watchIdRef = useRef<number | null>(null);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHandles = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== "undefined") {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timeoutIdRef.current !== null) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  const updateState = useCallback((nextState: GpsState) => {
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  useEffect(() => {
    if (!enabled) {
      clearHandles();
      return;
    }

    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      if (qrAnchor) {
        updateState("QR_ANCHORED");
      } else {
        updateState("FALLBACK_EXIF");
        setDiagnosticMessage(
          "Geolocalização indisponível no navegador. Usaremos os dados da foto."
        );
      }
      return;
    }

    if (!qrAnchor) {
      updateState("CALIBRATING");
    }
    setDiagnosticMessage(null);

    // Timeout de segurança para o Cold Start: evita spinner infinito em cânions urbanos densos
    timeoutIdRef.current = setTimeout(() => {
      const currentBest = bestCoordsRef.current;

      if (qrAnchor && (!currentBest || currentBest.accuracyMeters > maxAcceptableAccuracyMeters)) {
        // Fallback automático para a coordenada homologada da placa física
        const anchored: GpsCoordinates = {
          lat: qrAnchor.lat,
          lng: qrAnchor.lng,
          accuracyMeters: 5,
          headingDegrees: null,
          altitudeMeters: null,
          source: "QR_ANCHOR",
          capturedAt: Date.now(),
        };
        bestCoordsRef.current = anchored;
        setCoordinates(anchored);
        updateState("QR_ANCHORED");
        return;
      }

      if (currentBest && currentBest.accuracyMeters <= maxAcceptableAccuracyMeters) {
        updateState("LOCKED");
      } else if (!currentBest) {
        updateState("FALLBACK_EXIF");
        setDiagnosticMessage(
          "Sinal de satélite lento. A localização será extraída da foto ou placa."
        );
      }
    }, coldStartTimeoutMs);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const roundedAccuracy = Math.max(
          1,
          Math.round(position.coords.accuracy)
        );

        const reading: GpsCoordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracyMeters: roundedAccuracy,
          headingDegrees:
            typeof position.coords.heading === "number" &&
            !Number.isNaN(position.coords.heading)
              ? Math.round(position.coords.heading)
              : null,
          altitudeMeters:
            typeof position.coords.altitude === "number"
              ? Math.round(position.coords.altitude)
              : null,
          source: "BROWSER_GPS",
          capturedAt: position.timestamp || Date.now(),
        };

        const previousBest = bestCoordsRef.current;

        // Filtro Monotônico de Qualidade:
        // Só substitui a leitura anterior se a nova tiver precisão superior (menor raio de erro)
        // ou se a anterior era apenas a âncora QR e agora o GPS real atingiu alta precisão (<= 12m).
        const shouldUpgradeFromQr =
          previousBest?.source === "QR_ANCHOR" && roundedAccuracy <= 12;
        const isMoreAccurate =
          !previousBest ||
          (previousBest.source !== "QR_ANCHOR" &&
            roundedAccuracy <= previousBest.accuracyMeters);

        if (shouldUpgradeFromQr || isMoreAccurate) {
          bestCoordsRef.current = reading;
          setCoordinates(reading);
        }

        if (roundedAccuracy <= targetAccuracyMeters) {
          updateState("LOCKED");
          setDiagnosticMessage(null);
        } else if (qrAnchor) {
          updateState("QR_ANCHORED");
        } else {
          updateState("CALIBRATING");
        }
      },
      (error) => {
        // Se o cidadão escaneou uma placa QR Code, a negação ou falha do GPS nunca degrada a experiência
        if (qrAnchor) {
          const anchored: GpsCoordinates = {
            lat: qrAnchor.lat,
            lng: qrAnchor.lng,
            accuracyMeters: 5,
            headingDegrees: null,
            altitudeMeters: null,
            source: "QR_ANCHOR",
            capturedAt: Date.now(),
          };
          bestCoordsRef.current = anchored;
          setCoordinates(anchored);
          updateState("QR_ANCHORED");
          return;
        }

        updateState("FALLBACK_EXIF");
        if (error.code === error.PERMISSION_DENIED) {
          setDiagnosticMessage(
            "Permissão de GPS desativada. Usando metadados EXIF da câmera."
          );
        } else {
          setDiagnosticMessage(
            "Sem visada de satélite no momento. Usando metadados da foto."
          );
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: coldStartTimeoutMs,
      }
    );

    return () => {
      clearHandles();
    };
  }, [
    enabled,
    qrAnchor,
    targetAccuracyMeters,
    maxAcceptableAccuracyMeters,
    coldStartTimeoutMs,
    retryCounter,
    clearHandles,
    updateState,
  ]);

  const resolveBestLocation = useCallback(
    async (gracePeriodMs = 1200): Promise<GpsCoordinates | null> => {
      const startTime = Date.now();

      while (Date.now() - startTime < gracePeriodMs) {
        const current = bestCoordsRef.current;
        if (
          current &&
          (current.source === "QR_ANCHOR" ||
            current.accuracyMeters <= targetAccuracyMeters)
        ) {
          return current;
        }
        await new Promise((resolve) => setTimeout(resolve, 150));
      }

      // Se após o gracePeriod o GPS do celular ainda estiver pior que 35m e houver QR Code, prioriza a placa
      const finalCandidate = bestCoordsRef.current;
      if (
        qrAnchor &&
        (!finalCandidate ||
          finalCandidate.accuracyMeters > maxAcceptableAccuracyMeters)
      ) {
        return {
          lat: qrAnchor.lat,
          lng: qrAnchor.lng,
          accuracyMeters: 5,
          headingDegrees: null,
          altitudeMeters: null,
          source: "QR_ANCHOR",
          capturedAt: Date.now(),
        };
      }

      return finalCandidate;
    },
    [targetAccuracyMeters, maxAcceptableAccuracyMeters, qrAnchor]
  );

  const retryCalibration = useCallback(() => {
    bestCoordsRef.current = initialQrCoords;
    setCoordinates(initialQrCoords);
    setRetryCounter((prev) => prev + 1);
  }, [initialQrCoords]);

  // Calcula progresso heurístico de convergência (ex: 120m -> 25% | 20m -> 100%)
  const accuracyMeters = coordinates?.accuracyMeters ?? null;
  let convergenceProgress = 15;
  if (state === "LOCKED" || state === "QR_ANCHORED") {
    convergenceProgress = 100;
  } else if (accuracyMeters !== null) {
    const clamped = Math.min(Math.max(accuracyMeters, targetAccuracyMeters), 150);
    convergenceProgress = Math.round(
      100 - ((clamped - targetAccuracyMeters) / (150 - targetAccuracyMeters)) * 80
    );
  }

  return {
    state,
    coordinates,
    accuracyMeters,
    convergenceProgress,
    diagnosticMessage,
    resolveBestLocation,
    retryCalibration,
  };
}
