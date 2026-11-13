"use client";

import React, { useState } from "react";
import { ShoppingBag, Armchair, Truck, AlertCircle, X } from "lucide-react";
import type { EdgeProcessedPhoto } from "@/hooks/useEdgeImageProcessor";

export type WasteScale = "SMALL" | "MEDIUM" | "LARGE";

export interface ScaleBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  photo: EdgeProcessedPhoto | null;
  /** Disparo otimista imediato ao toque (Inversão de Esforço) */
  onSelectScale: (scale: WasteScale, tags: string[]) => void;
  /** Se o GPS está em ponto crítico ambiental */
  isEcoCriticalDefault?: boolean;
}

interface ScaleOption {
  id: WasteScale;
  title: string;
  volume: string;
  logistics: string;
  icon: React.ElementType;
  badge: string;
}

const SCALE_OPTIONS: ScaleOption[] = [
  {
    id: "SMALL",
    title: "Pequeno",
    volume: "Até ~50L (1 a 2 sacos)",
    logistics: "Coleta manual rápida / moto-zeladoria",
    icon: ShoppingBag,
    badge: "Saco / Balde",
  },
  {
    id: "MEDIUM",
    title: "Médio",
    volume: "Até ~1 m³ (cabe em caçamba)",
    logistics: "Móveis, colchões, podas de galhos",
    icon: Armchair,
    badge: "Móvel / Poda",
  },
  {
    id: "LARGE",
    title: "Grande",
    volume: "Acima de 1 m³ (múltiplos m³)",
    logistics: "Caminhão basculante ou pá carregadeira",
    icon: Truck,
    badge: "Entulho / Basculante",
  },
];

/**
 * Componente de Escala Visual (Toque 2 de 3)
 * Aplicando `impeccable`:
 * - Altura generosa (>= 72px por item, superando a meta de 64dp) na Thumb Zone;
 * - Disparo otimista instantâneo com feedback tátil;
 * - Preview compacto da foto processada no Web Worker;
 * - Chip opcional de tag crítica (córrego/boca de lobo).
 */
export const ScaleBottomSheet: React.FC<ScaleBottomSheetProps> = ({
  isOpen,
  onClose,
  photo,
  onSelectScale,
  isEcoCriticalDefault = false,
}) => {
  const [isEcoCritical, setIsEcoCritical] = useState(isEcoCriticalDefault);

  if (!isOpen) return null;

  const handleSelect = (scale: WasteScale) => {
    // Feedback háptico tátil de 40ms
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(40);
    }

    const tags: string[] = [];
    if (isEcoCritical) tags.push("CORREGO");
    if (scale === "LARGE") tags.push("ENTULHO");

    onSelectScale(scale, tags);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="scale-sheet-title"
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm transition-opacity duration-200"
    >
      {/* Backdrop clicável para cancelar */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 size-full cursor-default"
        aria-label="Fechar e refazer foto"
      />

      {/* Card do Drawer (Thumb Zone) */}
      <div className="relative z-10 w-full rounded-t-[32px] border-t border-white/10 bg-zinc-950 p-6 pb-[max(1.75rem,env(safe-area-inset-bottom))] text-zinc-100 shadow-[0_-12px_40px_rgba(0,0,0,0.8)] transition-transform duration-200 ease-out">
        {/* Barra superior de arraste */}
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-800" aria-hidden="true" />

        {/* Cabeçalho com mini-preview e botão de cancelar */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {photo && (
              <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.previewUrl}
                  alt="Miniatura capturada"
                  className="size-full object-cover"
                />
              </div>
            )}
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                Toque 2 de 3
              </span>
              <h2 id="scale-sheet-title" className="text-base font-semibold tracking-tight text-white">
                Qual o tamanho do descarte?
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
            aria-label="Cancelar e voltar à câmera"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* 3 Grandes Cartões Táteis (Lei de Hick + Thumb Zone) */}
        <div className="flex flex-col gap-3">
          {SCALE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelect(opt.id)}
                className="group relative flex min-h-[74px] w-full items-center justify-between rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-left transition-all duration-150 active:scale-[0.98] active:bg-zinc-800 hover:border-emerald-500/40 hover:bg-zinc-800/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-zinc-800/90 text-zinc-200 border border-white/5 transition-colors group-hover:bg-emerald-500/20 group-hover:text-emerald-300">
                    <Icon className="size-6" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold tracking-tight text-white">
                        {opt.title}
                      </span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                        {opt.badge}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">{opt.volume}</p>
                    <p className="text-[11px] font-medium text-zinc-500">{opt.logistics}</p>
                  </div>
                </div>

                <div className="size-2 rounded-full bg-zinc-700 transition-colors group-hover:bg-emerald-400" />
              </button>
            );
          })}
        </div>

        {/* Toggle de Risco Ambiental Opcional (Boca de lobo / margem de córrego) */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={() => setIsEcoCritical(!isEcoCritical)}
            className={[
              "flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-colors border",
              isEcoCritical
                ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                : "border-white/5 bg-zinc-900/40 text-zinc-400 hover:bg-zinc-900/80",
            ].join(" ")}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className={isEcoCritical ? "size-4 text-amber-400" : "size-4 text-zinc-500"} />
              <span>Está próximo a boca de lobo, bueiro ou córrego?</span>
            </div>
            <span
              className={[
                "h-5 w-9 rounded-full transition-colors relative flex items-center p-0.5",
                isEcoCritical ? "bg-amber-400" : "bg-zinc-800",
              ].join(" ")}
            >
              <span
                className={[
                  "size-4 rounded-full bg-zinc-950 transition-transform",
                  isEcoCritical ? "translate-x-4" : "translate-x-0",
                ].join(" ")}
              />
            </span>
          </button>
        </div>

        <p className="mt-3 text-center text-[11px] text-zinc-400">
          Ao tocar, o relato é registrado instantaneamente sem formulários.
        </p>
      </div>
    </div>
  );
};
