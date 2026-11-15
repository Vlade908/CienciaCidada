"use client";

import React from "react";
import { Sun } from "lucide-react";
import type { FocusPoint } from "@/hooks/useCameraFocus";

interface FocusReticleProps {
  focusPoint: FocusPoint | null;
}

export const FocusReticle: React.FC<FocusReticleProps> = ({ focusPoint }) => {
  if (!focusPoint) return null;

  const { x, y, visible, locked } = focusPoint;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute z-20 select-none transition-opacity duration-300 ease-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* RETÍCULO PRINCIPAL ESTILO CÂMERA NATIVA (64x64px) */}
      <div
        className={`relative size-16 transition-all duration-200 ease-out ${
          locked
            ? "scale-95 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]"
            : "scale-100 drop-shadow-[0_0_6px_rgba(0,0,0,0.6)]"
        }`}
      >
        {/* Borda delimitadora sutil */}
        <div className="absolute inset-0 rounded-lg border border-white/30 backdrop-blur-[1px]" />

        {/* 4 CANTOS DE ALTA PRECISÃO (ESMERALDA #10b981) */}
        {/* Canto Superior Esquerdo */}
        <span className="absolute -top-0.5 -left-0.5 size-2.5 rounded-tl-sm border-t-2 border-l-2 border-emerald-400" />
        {/* Canto Superior Direito */}
        <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-tr-sm border-t-2 border-r-2 border-emerald-400" />
        {/* Canto Inferior Esquerdo */}
        <span className="absolute -bottom-0.5 -left-0.5 size-2.5 rounded-bl-sm border-b-2 border-l-2 border-emerald-400" />
        {/* Canto Inferior Direito */}
        <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-br-sm border-b-2 border-r-2 border-emerald-400" />

        {/* PONTO CENTRAL DE COLIMAÇÃO */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`size-1.5 rounded-full transition-transform duration-200 ${
              locked ? "bg-emerald-400 scale-125" : "bg-white/80 scale-100"
            }`}
          />
        </div>

        {/* INDICADOR LATERAL DE MEDIÇÃO DE LUZ (SOLZINHO TÁTIL) */}
        <div className="absolute -right-6 top-1/2 -translate-y-1/2 flex items-center justify-center opacity-85 animate-pulse">
          <Sun className="size-3.5 text-amber-300 drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]" />
        </div>
      </div>
    </div>
  );
};
