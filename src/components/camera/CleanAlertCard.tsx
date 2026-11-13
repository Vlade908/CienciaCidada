"use client";

import React, { useState } from "react";
import {
  Bell,
  CheckCircle2,
  Users,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Share2,
} from "lucide-react";

export interface CleanAlertCardProps {
  protocolCode: string;
  confirmationsCount: number;
  dominantScale: string;
  isEcoCritical?: boolean;
  addressReference?: string | null;
  samplePhotoUrl?: string;
  onSubscribePush: () => Promise<boolean>;
  onNewReport: () => void;
  onViewMap?: () => void;
}

/**
 * Componente de Confirmação & Alerta Assíncrono (Toque 3 de 3)
 * Aplicando `impeccable`:
 * - Prova Social marcante ("Já somos X vizinhos relatando este ponto");
 * - Único CTA primário na Thumb Zone ("🔔 Me avise quando limparem");
 * - Loop fechado de Ciência Cidadã sem pedir CPF, e-mail ou dados pessoais;
 * - Micro-interação de sucesso com feedback de permissão nativa Web Push.
 */
export const CleanAlertCard: React.FC<CleanAlertCardProps> = ({
  protocolCode,
  confirmationsCount,
  dominantScale,
  isEcoCritical = false,
  addressReference = "Área pública monitorada",
  samplePhotoUrl,
  onSubscribePush,
  onNewReport,
  onViewMap,
}) => {
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [shared, setShared] = useState(false);

  const handlePushClick = async () => {
    setIsSubscribing(true);
    try {
      const ok = await onSubscribePush();
      if (ok) {
        setSubscribed(true);
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate([40, 80, 40]);
        }
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `EcoCidadão - Protocolo ${protocolCode}`,
          text: `Ajudei a mapear um ponto de descarte irregular no bairro. Já somos ${confirmationsCount} moradores acompanhando a limpeza!`,
          url: window.location.href,
        });
        setShared(true);
      } catch {
        // Usuário cancelou compartilhamento
      }
    }
  };

  return (
    <main
      aria-label="Confirmação de registro do descarte irregular"
      className="relative flex min-h-dvh w-full flex-col justify-between bg-zinc-950 p-6 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] text-zinc-100 select-none"
    >
      {/* CARD PRINCIPAL DE SUCESSO */}
      <div className="mx-auto flex w-full max-w-sm flex-col items-center text-center">
        {/* Ícone Hero com pulso sutil */}
        <div className="relative mb-5 flex size-20 items-center justify-center rounded-3xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
          <CheckCircle2 className="size-10 stroke-[2.2]" aria-hidden="true" />
        </div>

        <span className="mb-1 rounded-full bg-emerald-400/15 px-3 py-1 font-mono text-xs font-semibold text-emerald-300">
          Protocolo #{protocolCode}
        </span>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
          Descarte Registrado!
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Os dados geoespaciais foram unificados e encaminhados para a equipe de zeladoria pública.
        </p>

        {/* BOX DE PROVA SOCIAL & IMPACTO DO CLUSTER */}
        <div className="mt-6 w-full rounded-2xl border border-white/10 bg-zinc-900/70 p-4.5 text-left backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/20 text-emerald-300">
              <Users className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {confirmationsCount > 1
                  ? `${confirmationsCount} moradores uniram forças!`
                  : "Você é o primeiro a relatar este ponto!"}
              </p>
              <p className="text-xs text-zinc-400">
                {confirmationsCount > 1
                  ? "Chamados repetidos foram eliminados. Prioridade de limpeza elevada!"
                  : "Novas fotos da vizinhança serão somadas automaticamente sem duplicar chamados."}
              </p>
            </div>
          </div>

          <div className="mt-3.5 flex flex-wrap items-center gap-2 pt-3 border-t border-white/10 text-[11px] text-zinc-300">
            <div className="flex items-center gap-1.5">
              <MapPin className="size-3 text-zinc-400" />
              <span className="truncate max-w-[200px]">{addressReference}</span>
            </div>
            {isEcoCritical && (
              <span className="rounded-md bg-amber-400/20 px-2 py-0.5 font-medium text-amber-300">
                ⚠️ Área Crítica / Córrego
              </span>
            )}
            <span className="rounded-md bg-white/10 px-2 py-0.5 font-medium text-zinc-300">
              Porte: {dominantScale}
            </span>
          </div>
        </div>

        {/* Selo LGPD */}
        <div className="mt-4 flex items-center gap-1.5 text-[11px] text-zinc-400">
          <ShieldCheck className="size-3.5 text-emerald-400" />
          <span>Zero cadastro · Seus dados pessoais não foram coletados</span>
        </div>
      </div>

      {/* AÇÕES NA THUMB ZONE (TOQUE 3) */}
      <footer className="mx-auto flex w-full max-w-sm flex-col gap-3">
        {/* BOTÃO PRIMÁRIO (TOQUE 3): ALERTA PUSH ASSÍNCRONO */}
        {!subscribed ? (
          <button
            type="button"
            onClick={handlePushClick}
            disabled={isSubscribing}
            className="group relative flex min-h-[64px] w-full items-center justify-center gap-2.5 rounded-2xl bg-emerald-500 px-6 py-4 text-base font-semibold text-emerald-950 shadow-[0_10px_25px_-5px_rgba(16,185,129,0.4)] transition-all duration-150 active:scale-[0.98] hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/50 disabled:opacity-70"
          >
            <Bell className="size-5 transition-transform group-hover:rotate-12" aria-hidden="true" />
            <span>
              {isSubscribing ? "Ativando alerta no celular..." : "🔔 Me avise quando limparem"}
            </span>
          </button>
        ) : (
          <div className="flex min-h-[64px] w-full items-center justify-center gap-2.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 px-6 py-4 text-sm font-medium text-emerald-200">
            <CheckCircle2 className="size-5 text-emerald-400" />
            <span>Alerta ativo! Você receberá o Antes & Depois aqui.</span>
          </div>
        )}

        {/* BOTÕES SECUNDÁRIOS SUTIS */}
        <div className="flex items-center gap-2">
          {typeof navigator !== "undefined" && "share" in navigator && (
            <button
              type="button"
              onClick={handleShare}
              className="flex min-h-[50px] flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-zinc-900/90 px-4 py-3 text-xs font-semibold text-zinc-200 transition-colors hover:bg-zinc-800"
            >
              <Share2 className="size-3.5" />
              <span>{shared ? "Compartilhado!" : "Mobilizar vizinhos"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNewReport}
            className="flex min-h-[50px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900/90 px-4 py-3 text-xs font-semibold text-zinc-200 transition-colors hover:bg-zinc-800"
          >
            <span>Novo relato</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>

        {onViewMap && (
          <button
            type="button"
            onClick={onViewMap}
            className="py-1 text-center text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Ver mapa de hotspots da cidade
          </button>
        )}
      </footer>
    </main>
  );
};
