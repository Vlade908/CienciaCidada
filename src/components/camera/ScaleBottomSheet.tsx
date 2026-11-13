"use client";

import React, { useState } from "react";
import { 
  Trash2, 
  Car, 
  Truck, 
  AlertCircle, 
  RotateCcw, 
  CheckCircle2, 
  Send,
  ShieldCheck
} from "lucide-react";
import type { EdgeProcessedPhoto } from "@/hooks/useEdgeImageProcessor";

export type WasteScale = "SMALL" | "MEDIUM" | "LARGE";

export interface ScaleBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  photo: EdgeProcessedPhoto | null;
  onSelectScale: (scale: WasteScale, tags: string[]) => void;
  isEcoCriticalDefault?: boolean;
  locationLabel?: string;
}

interface ScaleOption {
  id: WasteScale;
  title: string;
  subtitle: string;
  icon: React.ElementType;
}

const SCALE_OPTIONS: ScaleOption[] = [
  {
    id: "SMALL",
    title: "Pequeno",
    subtitle: "Sacos de lixo, caixas menores",
    icon: Trash2,
  },
  {
    id: "MEDIUM",
    title: "Médio",
    subtitle: "Volume de um porta-malas",
    icon: Car,
  },
  {
    id: "LARGE",
    title: "Grande",
    subtitle: "Caminhão, caçamba, sofás",
    icon: Truck,
  },
];

export const ScaleBottomSheet: React.FC<ScaleBottomSheetProps> = ({
  isOpen,
  onClose,
  photo,
  onSelectScale,
  isEcoCriticalDefault = false,
  locationLabel,
}) => {
  const [selectedScale, setSelectedScale] = useState<WasteScale>("MEDIUM");
  const [isEcoCritical, setIsEcoCritical] = useState(isEcoCriticalDefault);

  if (!isOpen) return null;

  const handleSubmit = (scaleToSubmit: WasteScale = selectedScale) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(40);
    }

    const tags: string[] = [];
    if (isEcoCritical) tags.push("CORREGO");
    if (scaleToSubmit === "LARGE") tags.push("ENTULHO");

    onSelectScale(scaleToSubmit, tags);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="scale-sheet-title"
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-md transition-opacity duration-200"
    >
      {/* Backdrop clicável para cancelar */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 size-full cursor-default"
        aria-label="Fechar e refazer foto"
      />

      {/* PAINEL DA BOTTOM SHEET STITCH */}
      <div className="relative z-10 w-full rounded-t-[32px] border-t border-zinc-800 bg-zinc-900/95 backdrop-blur-2xl px-5 pt-3 pb-[max(1.75rem,env(safe-area-inset-bottom))] text-zinc-100 shadow-[0_-12px_40px_rgba(0,0,0,0.85)] flex flex-col gap-4 select-none">
        
        {/* Barra superior de arraste */}
        <div className="w-12 h-1.5 bg-zinc-700/80 rounded-full mx-auto mb-1" aria-hidden="true" />

        {/* Título & Subtítulo Stitch */}
        <div className="flex flex-col items-center text-center">
          <h2 id="scale-sheet-title" className="text-lg font-bold text-white tracking-tight">
            Qual o volume do descarte?
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Ajuda a direcionar o veículo adequado da prefeitura
          </p>
        </div>

        {/* Card de Resumo da Foto com Botão Refazer */}
        <div className="w-full rounded-2xl bg-zinc-800/60 border border-zinc-700/50 p-2.5 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            {photo && (
              <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-zinc-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.previewUrl}
                  alt="Foto capturada"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex flex-col min-w-0 text-left">
              <span className="text-xs font-semibold text-zinc-100 truncate">
                Foto capturada com sucesso
              </span>
              <span className="text-[11px] text-zinc-400 truncate">
                {locationLabel || 'Ponto georreferenciado via satélite'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 px-3 py-1.5 rounded-full bg-zinc-700/50 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-600/40 flex items-center gap-1.5 transition-all active:scale-95"
            title="Descartar esta foto e tirar outra"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refazer</span>
          </button>
        </div>

        {/* 3 OPÇÕES DE VOLUME COM ESTILO STITCH */}
        <div className="flex flex-col gap-2.5 w-full">
          {SCALE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selectedScale === opt.id;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setSelectedScale(opt.id);
                  handleSubmit(opt.id);
                }}
                className={`rounded-2xl transition-all p-3.5 flex items-center justify-between cursor-pointer active:scale-[0.985] text-left border ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-950/30"
                    : "border-zinc-700/50 bg-zinc-800/40 hover:bg-zinc-800/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs border ${
                      isSelected
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                        : "bg-zinc-800 text-zinc-300 border-zinc-700/60"
                    }`}
                  >
                    <Icon className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div>
                    <span
                      className={`block text-sm font-semibold tracking-tight ${
                        isSelected ? "text-emerald-400" : "text-zinc-200"
                      }`}
                    >
                      {opt.title}
                    </span>
                    <span className="block text-xs text-zinc-400">
                      {opt.subtitle}
                    </span>
                  </div>
                </div>

                {isSelected ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-zinc-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* TOGGLE OPCIONAL DE RISCO AMBIENTAL */}
        <div className="pt-2 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={() => setIsEcoCritical(!isEcoCritical)}
            className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-colors border ${
              isEcoCritical
                ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                : "border-zinc-800 bg-zinc-800/30 text-zinc-400 hover:bg-zinc-800/60"
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className={`w-4 h-4 ${isEcoCritical ? "text-amber-400" : "text-zinc-500"}`} />
              <span>Está próximo a boca de lobo, bueiro ou córrego?</span>
            </div>
            <span
              className={`h-5 w-9 rounded-full transition-colors relative flex items-center p-0.5 ${
                isEcoCritical ? "bg-amber-400" : "bg-zinc-700"
              }`}
            >
              <span
                className={`size-4 rounded-full bg-zinc-950 transition-transform ${
                  isEcoCritical ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </span>
          </button>
        </div>

        {/* BOTÃO DE ENVIO PRIMÁRIO & GARANTIA DE ANONIMATO STITCH */}
        <div className="flex flex-col items-center gap-2 w-full mt-1">
          <button
            type="button"
            onClick={() => handleSubmit(selectedScale)}
            className="w-full py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <span>Confirmar e Enviar Relato</span>
            <Send className="w-4 h-4 stroke-[2.2]" />
          </button>

          <span className="text-[11px] text-zinc-400 font-medium text-center flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Protocolo anônimo gerado instantaneamente</span>
          </span>
        </div>

      </div>
    </div>
  );
};
