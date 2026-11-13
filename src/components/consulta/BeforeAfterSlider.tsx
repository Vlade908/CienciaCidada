'use client';

import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, Maximize2, Sparkles, Clock, X } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforePhotoUrl: string;
  afterPhotoUrl?: string | null;
  protocolCode: string;
  cleanedAt?: string | null;
  firstReportedAt?: string;
  isCleaned: boolean;
}

export function BeforeAfterSlider({
  beforePhotoUrl,
  afterPhotoUrl,
  protocolCode,
  cleanedAt,
  firstReportedAt,
  isCleaned,
}: BeforeAfterSliderProps) {
  // Se estiver limpo, o padrão inicial é mostrar a foto do "Depois" (vitória do cidadão)
  const [activeTab, setActiveTab] = useState<'AFTER' | 'BEFORE'>(
    isCleaned && afterPhotoUrl ? 'AFTER' : 'BEFORE'
  );
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const activePhoto = activeTab === 'AFTER' && afterPhotoUrl ? afterPhotoUrl : beforePhotoUrl;

  return (
    <div className="w-full flex flex-col space-y-3 select-none">
      {/* Botões de Alternância Rápida: Antes vs Depois */}
      {isCleaned && afterPhotoUrl ? (
        <div className="flex items-center justify-between p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700/80">
          <button
            type="button"
            onClick={() => setActiveTab('BEFORE')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'BEFORE'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs border border-zinc-200 dark:border-zinc-700'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Antes (Descarte)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('AFTER')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'AFTER'
                ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs border border-zinc-200 dark:border-zinc-700'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Depois (Limpo)</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center space-x-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span>Evidência do Descarte Relatado</span>
        </div>
      )}

      {/* Moldura da Imagem com Visualização de Alto Padrão */}
      <div 
        className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-950 group cursor-pointer shadow-md"
        onClick={() => setIsZoomOpen(true)}
      >
        <img
          src={activePhoto}
          alt={activeTab === 'AFTER' ? 'Comprovante do local limpo' : 'Foto original do descarte'}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Gradiente sutil para garantir legibilidade dos selos sobre a foto */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

        {/* Selo no Topo */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {activeTab === 'AFTER' && isCleaned ? (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/90 text-white backdrop-blur-md flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3 h-3" />
              Local Limpo pela Prefeitura
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/90 text-zinc-950 backdrop-blur-md flex items-center gap-1 shadow-sm">
              <AlertTriangle className="w-3 h-3" />
              Descarte Irregular Notificado
            </span>
          )}

          <span className="px-2 py-1 rounded-lg text-[10px] font-mono bg-black/60 text-white/90 backdrop-blur-md flex items-center gap-1">
            <Maximize2 className="w-3 h-3" />
            Ampliar
          </span>
        </div>

        {/* Rodapé com Informação Temporal */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-white/90 pointer-events-none">
          <span className="font-mono text-[10px]">
            {protocolCode}
          </span>

          <span className="flex items-center gap-1 font-mono text-[10px]">
            <Clock className="w-3 h-3 text-white/80" />
            {activeTab === 'AFTER' && cleanedAt
              ? `Limpo em ${new Date(cleanedAt).toLocaleDateString('pt-BR')}`
              : firstReportedAt
              ? `Registrado em ${new Date(firstReportedAt).toLocaleDateString('pt-BR')}`
              : 'Data arquivada'}
          </span>
        </div>
      </div>

      {/* Lightbox / Modal de Zoom */}
      {isZoomOpen && (
        <div 
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setIsZoomOpen(false)}
        >
          <div className="relative max-w-2xl w-full max-h-[85vh] flex flex-col items-center">
            <img
              src={activePhoto}
              alt="Foto em alta resolução"
              className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
            />
            <div className="mt-3 flex items-center justify-between w-full text-xs text-zinc-400 font-mono px-2">
              <span>{activeTab === 'AFTER' ? '✓ Registro de Conclusão de Serviço' : '⚠ Foto Inicial do Munícipe'}</span>
              <button
                type="button"
                onClick={() => setIsZoomOpen(false)}
                className="px-3 py-1 rounded-lg bg-zinc-800 text-white text-xs hover:bg-zinc-700 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
