"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  Check,
  Copy,
  Users,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Share2,
  Search,
  Sparkles,
  Camera,
  Layers,
  AlertTriangle,
  X,
  FileText,
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
 * CleanAlertCard — View Oficial de Protocolo Gerado (Stitch Design)
 * Exibido após o munícipe registrar um descarte irregular com sucesso.
 * 
 * Atributos-chave do design Stitch:
 * - Emblema hero com anéis concêntricos pulsantes e glow esmeralda
 * - Pill interativo com cópia rápida do código do protocolo (#ECO-...)
 * - Card de Stewardship com miniatura da foto capturada e Prova Social ("Pioneiro na Região" ou "X Vizinhos Unificados")
 * - Chips de atributos (área pública monitorada / ambientalmente crítica, estimativa de porte)
 * - Snapshot de geolocalização validada
 * - Selo LGPD de zero cadastro
 * - Thumb Zone ergonômica com CTA primário Web Push VAPID, link de acompanhamento e novo relato
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
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  // Grava o protocolo gerado no histórico local do cidadão (LGPD / localStorage)
  useEffect(() => {
    if (typeof window !== "undefined" && protocolCode) {
      try {
        const stored = localStorage.getItem("ecocidadao_my_protocols");
        const list: string[] = stored ? JSON.parse(stored) : [];
        if (!list.includes(protocolCode)) {
          const updated = [protocolCode, ...list].slice(0, 10);
          localStorage.setItem("ecocidadao_my_protocols", JSON.stringify(updated));
        }
      } catch (err) {
        console.warn("Erro ao salvar protocolo no histórico local:", err);
      }
    }
  }, [protocolCode]);

  const handleCopyProtocol = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(protocolCode);
        setCopied(true);
        if ("vibrate" in navigator) {
          navigator.vibrate([30]);
        }
        setTimeout(() => setCopied(false), 2200);
      }
    } catch (err) {
      console.warn("Falha ao copiar protocolo:", err);
    }
  };

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
          text: `Ajudei a mapear um ponto de descarte irregular em ${addressReference || 'nossa região'}. Protocolo #${protocolCode}. Já somos ${confirmationsCount} moradores acompanhando a zeladoria!`,
          url: `${window.location.origin}/consulta?protocolo=${protocolCode}`,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2500);
      } catch {
        // Usuário cancelou compartilhamento nativo
      }
    } else {
      // Fallback: copia o link para a área de transferência
      try {
        await navigator.clipboard.writeText(
          `${window.location.origin}/consulta?protocolo=${protocolCode}`
        );
        setShared(true);
        setTimeout(() => setShared(false), 2500);
      } catch {
        // Fallback silencioso
      }
    }
  };

  // Formatação humanizada do porte
  const formattedScale = (() => {
    const scaleUpper = dominantScale?.toUpperCase();
    if (scaleUpper === "PEQUENO" || scaleUpper === "SMALL") return "Porte: Pequeno (~0.5m³)";
    if (scaleUpper === "MEDIO" || scaleUpper === "MEDIUM") return "Porte: Médio (~1m³)";
    if (scaleUpper === "GRANDE" || scaleUpper === "LARGE") return "Porte: Grande (>2m³)";
    return `Porte: ${dominantScale || "Médio (~1m³)"}`;
  })();

  const isFirstReporter = confirmationsCount <= 1;

  return (
    <div className="relative min-h-dvh w-full flex flex-col justify-between bg-zinc-950 text-zinc-100 select-none overflow-x-hidden">
      {/* HEADER FIXO SUPERIOR DO STITCH */}
      <header className="fixed top-0 inset-x-0 z-50 pt-[env(safe-area-inset-top,0px)] bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/40">
        <div className="h-14 px-4 flex items-center justify-between max-w-md mx-auto w-full">
          {/* Botão Fechar/Início */}
          <button
            type="button"
            onClick={onViewMap || onNewReport}
            className="size-10 rounded-full flex items-center justify-center bg-zinc-900/90 text-zinc-300 hover:text-white hover:bg-zinc-800 active:scale-95 transition-all border border-zinc-800/60"
            aria-label="Voltar para a página inicial"
            title="Voltar ao início"
          >
            <X className="size-5" />
          </button>

          {/* Badge Central com pulso */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-400 tracking-wide">
              Chamado Registrado
            </span>
          </div>

          {/* Botão Compartilhar */}
          <button
            type="button"
            onClick={handleShare}
            className="size-10 rounded-full flex items-center justify-center bg-zinc-900/90 text-zinc-300 hover:text-white hover:bg-zinc-800 active:scale-95 transition-all border border-zinc-800/60"
            aria-label="Compartilhar protocolo"
            title="Compartilhar protocolo"
          >
            <Share2 className="size-4" />
          </button>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL COM RESPIRO E GLOWS AMBIENTAIS */}
      <main className="flex-1 flex flex-col items-center w-full max-w-md mx-auto px-4 pt-20 pb-4 relative z-10">
        {/* Glows Difusos do Stitch */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 size-72 rounded-full bg-emerald-500/15 blur-[90px] pointer-events-none" />
        <div className="absolute top-1/3 -right-16 size-60 rounded-full bg-teal-500/10 blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center w-full">
          {/* EMBLEMA HERO COM ANÉIS CONCÊNTRICOS BRILHANTES */}
          <div className="relative flex items-center justify-center mt-2">
            <div className="absolute size-24 rounded-full bg-emerald-500/20 blur-xl animate-pulse" />
            <div className="size-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/25 flex items-center justify-center p-1.5 shadow-sm">
              <div className="size-full rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_10px_25px_rgba(16,185,129,0.35)] text-emerald-950">
                <Check className="size-9 stroke-[3]" />
              </div>
            </div>
          </div>

          {/* PILL INTERATIVO DE PROTOCOLO COM COPIAR */}
          <button
            type="button"
            onClick={handleCopyProtocol}
            className="mt-3.5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-zinc-200 hover:bg-zinc-800 hover:border-zinc-700 active:scale-95 transition-all duration-150 shadow-sm group"
            title="Clique para copiar o protocolo"
          >
            <FileText className="size-3.5 text-emerald-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Protocolo
            </span>
            <span className="font-mono font-bold text-xs sm:text-sm text-white tracking-wide">
              #{protocolCode}
            </span>
            {copied ? (
              <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                Copiado!
              </span>
            ) : (
              <Copy className="size-3.5 text-zinc-400 group-hover:text-emerald-400 transition-colors" />
            )}
          </button>

          {/* TÍTULO E SUBTÍTULO */}
          <h1 className="mt-3.5 text-2xl font-bold tracking-tight text-white text-center font-sans">
            Descarte Registrado!
          </h1>
          <p className="mt-1 text-center text-xs sm:text-sm text-zinc-400 max-w-[310px] leading-relaxed">
            Sua contribuição já está na fila prioritária de triagem da equipe regional de limpeza.
          </p>

          {/* CARD DE EVIDÊNCIA & STEWARDSHIP DO STITCH */}
          <div className="w-full mt-4.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/90 p-3.5 shadow-xl backdrop-blur-md space-y-3">
            {/* Reconhecimento Comunitário & Miniatura da Evidência */}
            <div className="flex items-center gap-3 bg-emerald-950/40 border border-emerald-500/20 rounded-xl p-2.5">
              <div className="relative size-14 rounded-lg overflow-hidden shrink-0 border border-zinc-800 shadow-inner bg-zinc-800/90 flex items-center justify-center">
                {samplePhotoUrl ? (
                  <img
                    src={samplePhotoUrl}
                    alt="Evidência fotográfica do descarte irregular"
                    className="size-full object-cover"
                  />
                ) : (
                  <Camera className="size-6 text-emerald-400" />
                )}
                <div className="absolute bottom-0 right-0 bg-zinc-950/80 backdrop-blur-xs rounded-tl px-1 py-0.5">
                  <Camera className="size-2.5 text-emerald-400" />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="inline-flex items-center gap-1.5 text-emerald-400 font-bold text-xs sm:text-sm">
                  {isFirstReporter ? (
                    <>
                      <Sparkles className="size-3.5 text-emerald-400" />
                      <span>Pioneiro na Região</span>
                    </>
                  ) : (
                    <>
                      <Users className="size-3.5 text-emerald-400" />
                      <span>{confirmationsCount} Vizinhos Unificados</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-zinc-300 truncate mt-0.5">
                  {isFirstReporter
                    ? "Você foi o primeiro a reportar este ponto!"
                    : "Chamados repetidos foram eliminados pelo sistema."}
                </p>
              </div>
            </div>

            {/* Mosaico de Chips de Atributos */}
            <div className="flex flex-wrap gap-1.5">
              {isEcoCritical ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-xs text-amber-300 font-medium">
                  <AlertTriangle className="size-3 text-amber-400" />
                  Área Crítica / Córrego
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800/90 border border-zinc-700/60 px-2.5 py-1 text-xs text-zinc-300 font-medium">
                  <ShieldCheck className="size-3 text-emerald-400" />
                  Área pública monitorada
                </span>
              )}

              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-xs text-emerald-300 font-medium">
                <Layers className="size-3 text-emerald-400" />
                {formattedScale}
              </span>
            </div>

            {/* Snapshot de Geolocalização */}
            <div className="flex items-start gap-2.5 pt-2 border-t border-zinc-800/60">
              <div className="size-7 rounded-full bg-zinc-800/90 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400 border border-zinc-700/50">
                <MapPin className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-zinc-100 truncate">
                  {addressReference || "Localização registrada"}
                </p>
                <p className="text-[11px] text-zinc-400 truncate">
                  {addressReference ? "Ponto georreferenciado e validado via PostGIS" : "Validado via satélite e PostGIS"}
                </p>
              </div>
            </div>
          </div>

          {/* Indicador de Privacidade e LGPD */}
          <div className="flex items-center justify-center gap-1.5 mt-3 text-xs text-zinc-400">
            <ShieldCheck className="size-3.5 text-emerald-400" />
            <span className="tracking-tight">Zero cadastro · Seus dados não foram coletados</span>
          </div>
        </div>
      </main>

      {/* THUMB ZONE ERGONÔMICA (AÇÕES NA PARTE INFERIOR) */}
      <footer className="w-full max-w-md mx-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 flex flex-col gap-2.5 z-20">
        {/* BOTÃO PRIMÁRIO: ALERTA PUSH ASSÍNCRONO */}
        {!subscribed ? (
          <button
            type="button"
            onClick={handlePushClick}
            disabled={isSubscribing}
            className="group w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-sm flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(16,185,129,0.28)] active:scale-[0.98] transition-all duration-150 disabled:opacity-70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/50"
          >
            <Bell className="size-4.5 transition-transform group-hover:rotate-12" />
            <span>{isSubscribing ? "Ativando alerta no aparelho..." : "🔔 Me avise quando limparem"}</span>
          </button>
        ) : (
          <div className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs">
            <CheckCircle2 className="size-4.5 text-emerald-400" />
            <span>Alerta ativo! Você receberá o Antes & Depois aqui.</span>
          </div>
        )}

        {/* BOTÃO SECUNDÁRIO: ACOMPANHAR STATUS EM TEMPO REAL */}
        <Link
          href={`/consulta?protocolo=${protocolCode}`}
          className="w-full py-3 px-4 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-100 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-150 border border-zinc-800/80 shadow-xs"
        >
          <Search className="size-4 text-emerald-400" />
          <span>Acompanhar este chamado agora</span>
        </Link>

        {/* BOTÃO TERCIÁRIO: FAZER NOVO RELATO */}
        <button
          type="button"
          onClick={onNewReport}
          className="w-full py-2 flex items-center justify-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors mt-0.5"
        >
          <span>Fazer novo relato</span>
          <ArrowRight className="size-3.5" />
        </button>

        {/* Feedback de compartilhamento via toast se não suportar share nativo */}
        {shared && (
          <div className="text-center text-[11px] text-emerald-400 animate-fade-in">
            ✓ Link do protocolo copiado com sucesso!
          </div>
        )}
      </footer>
    </div>
  );
};
