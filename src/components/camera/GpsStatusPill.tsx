"use client";

import React from "react";
import {
  Satellite,
  MapPinCheckInside,
  QrCode,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import type { GpsState } from "@/hooks/useHighAccuracyGps";

export interface GpsStatusPillProps {
  /** Estado atual emitido pelo hook useHighAccuracyGps */
  state: GpsState;
  /** Precisão atual em metros (ex: 6 -> renderiza ±6m com tabular-nums) */
  accuracyMeters?: number | null;
  /** Código da placa QR quando ancorado (ex: "QR-CORREGO-01") */
  qrCodeLabel?: string | null;
  /** Progresso de convergência (0 a 100) durante o Cold Start */
  convergenceProgress?: number;
  /** Callback opcional para tentar recalibrar caso o sinal caia em FALLBACK_EXIF */
  onRetry?: () => void;
  /** Classes utilitárias de posicionamento do container pai */
  className?: string;
}

/**
 * Componente HUD de telemetria GPS ("Camera-First Overlay")
 * Desenhado segundo os princípios da skill `impeccable` (Operate Mode):
 * - Alto contraste (>= 7:1) sobre vídeo ao vivo sob sol forte na calçada;
 * - Números tabulares (`tabular-nums`) para evitar jitter horizontal quando os metros mudam;
 * - Zero bloqueio de câmera: informa o estado em tempo real sem interromper o fluxo de 3 toques.
 */
export const GpsStatusPill: React.FC<GpsStatusPillProps> = ({
  state,
  accuracyMeters = null,
  qrCodeLabel = null,
  convergenceProgress = 25,
  onRetry,
  className = "",
}) => {
  const isCalibrating = state === "CALIBRATING";
  const isLocked = state === "LOCKED";
  const isQrAnchored = state === "QR_ANCHORED";
  const isFallback = state === "FALLBACK_EXIF";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={[
        "relative inline-flex items-center gap-2.5 rounded-full px-3.5 py-2",
        "bg-zinc-950/85 backdrop-blur-md",
        "shadow-[0_10px_24px_-6px_rgba(0,0,0,0.65)]",
        "border transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] select-none",
        isCalibrating && "border-amber-400/30 text-amber-100",
        isLocked && "border-emerald-400/35 text-emerald-100",
        isQrAnchored && "border-sky-400/35 text-sky-100",
        isFallback && "border-amber-500/40 text-amber-100",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* ESTADO 1: COLD START ("🛰️ Buscando satélites...") */}
      {isCalibrating && (
        <>
          <span className="relative flex size-4 items-center justify-center">
            <span
              className="absolute inset-0 rounded-full border-2 border-amber-400/25 border-t-amber-300 animate-spin"
              aria-hidden="true"
            />
            <Satellite className="size-2.5 text-amber-300" aria-hidden="true" />
          </span>

          <span className="text-xs font-medium tracking-tight text-amber-100">
            🛰️ Buscando satélites...
          </span>

          {typeof accuracyMeters === "number" && (
            <span className="rounded-full bg-amber-400/15 px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-amber-200">
              ±{accuracyMeters}m
            </span>
          )}

          {/* Barra inferior sutil de convergência do Cold Start */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-4 bottom-0 h-[2px] overflow-hidden rounded-full bg-amber-950/60"
          >
            <span
              className="block h-full bg-amber-300/80 transition-all duration-300 ease-out"
              style={{ width: `${Math.min(Math.max(convergenceProgress, 12), 95)}%` }}
            />
          </span>
        </>
      )}

      {/* ESTADO 2: ALTA PRECISÃO TRAVADA ("📍 GPS Preciso") */}
      {isLocked && (
        <>
          <span className="relative flex size-4 items-center justify-center">
            <span
              className="absolute size-2.5 rounded-full bg-emerald-400/40 animate-ping"
              aria-hidden="true"
            />
            <MapPinCheckInside
              className="relative size-3.5 text-emerald-300"
              aria-hidden="true"
            />
          </span>

          <span className="text-xs font-semibold tracking-tight text-emerald-100">
            📍 GPS Preciso
          </span>

          {typeof accuracyMeters === "number" && (
            <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-emerald-200">
              ±{accuracyMeters}m
            </span>
          )}
        </>
      )}

      {/* ESTADO 3: ANCORADO POR PLACA FÍSICA ("📌 Local fixado via Placa") */}
      {isQrAnchored && (
        <>
          <span className="flex size-4 items-center justify-center rounded-full bg-sky-400/20">
            <QrCode className="size-3 text-sky-300" aria-hidden="true" />
          </span>

          <span className="text-xs font-semibold tracking-tight text-sky-100">
            📌 Local fixado via Placa
          </span>

          {qrCodeLabel && (
            <span className="rounded-full bg-sky-400/15 px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums text-sky-200">
              {qrCodeLabel}
            </span>
          )}
        </>
      )}

      {/* ESTADO 4: FALLBACK NÃO-BLOQUEANTE (Sem GPS ativo -> Usa EXIF da Foto) */}
      {isFallback && (
        <>
          <AlertTriangle
            className="size-3.5 shrink-0 text-amber-300"
            aria-hidden="true"
          />

          <span className="text-xs font-medium tracking-tight text-amber-100">
            Modo EXIF da Foto
          </span>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="ml-1 inline-flex min-h-7 items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[11px] font-semibold text-amber-200 transition-colors hover:bg-amber-400/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              aria-label="Tentar calibrar GPS novamente"
            >
              <RefreshCw className="size-3" aria-hidden="true" />
              <span>Recalibrar</span>
            </button>
          )}
        </>
      )}
    </div>
  );
};
