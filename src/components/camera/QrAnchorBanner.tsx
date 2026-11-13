'use client';

import React, { useState } from 'react';
import { QrCode, MapPin, Droplets, X, ShieldCheck } from 'lucide-react';
import type { QrAnchorData } from '@/lib/qrAnchors';

interface QrAnchorBannerProps {
  anchor: QrAnchorData;
}

export function QrAnchorBanner({ anchor }: QrAnchorBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Notificação de placa QR Code identificada"
      className="relative z-30 mx-auto w-full max-w-sm px-4 select-none animate-in slide-in-from-top-3 duration-300"
    >
      <div className="rounded-2xl border border-sky-500/35 bg-zinc-950/90 p-3.5 shadow-2xl backdrop-blur-md text-zinc-100 flex items-start justify-between gap-3">
        {/* Ícone de Destaque */}
        <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
          <QrCode className="w-5 h-5" />
        </div>

        {/* Informações da Âncora Física */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-xs font-bold text-sky-300">
              {anchor.code}
            </span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-sky-500/15 text-sky-200 border border-sky-500/30">
              Placa Oficial
            </span>
            {anchor.isEcoCritical && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-0.5">
                <Droplets className="w-2.5 h-2.5" />
                Risco Hídrico
              </span>
            )}
          </div>

          <p className="text-xs font-semibold text-white mt-1 truncate">
            {anchor.addressHint}
          </p>

          <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1 font-mono">
            <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
            <span>Coordenadas fixadas (Precisão: &plusmn;5m)</span>
          </p>
        </div>

        {/* Botão de Fechar Banner */}
        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
          title="Dispensar aviso"
          aria-label="Dispensar aviso de placa"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
