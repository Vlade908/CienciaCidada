"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Download, Share2, PlusSquare, X, Smartphone, CheckCircle2 } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaManager() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Registro seguro do Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[EcoCidadão PWA] Service Worker ativo:", reg.scope);
        })
        .catch((err) => {
          console.warn("[EcoCidadão PWA] Falha ao registrar Service Worker:", err);
        });
    }

    // 2. Detecção de modo Standalone (App Nativo na tela inicial)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes("android-app://");

      setIsStandalone(Boolean(isStandaloneMode));

      if (isStandaloneMode) {
        document.documentElement.classList.add("pwa-standalone");
      } else {
        document.documentElement.classList.remove("pwa-standalone");
      }

      return isStandaloneMode;
    };

    const standaloneActive = checkStandalone();

    // 3. Detecção de iOS (Safari)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Se já estiver em modo standalone, nunca exibe o banner de instalação
    if (standaloneActive) {
      return;
    }

    // Checa se o usuário já dispensou o banner recentemente (últimos 3 dias)
    const dismissedTime = localStorage.getItem("ecocidadao_pwa_dismissed");
    if (dismissedTime && Date.now() - Number(dismissedTime) < 3 * 24 * 60 * 60 * 1000) {
      return;
    }

    // 4. Captura do evento nativo do Chromium para instalação
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };

    // 5. Notificação de quando o app foi instalado com sucesso
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
      setInstalledSuccess(true);
      setTimeout(() => setInstalledSuccess(false), 5000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // No iOS, se não for standalone e não foi dispensado, exibe a instrução suave após 3 segundos
    if (isIosDevice && !standaloneActive) {
      const timer = setTimeout(() => {
        setShowInstallBanner(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.warn("[EcoCidadão PWA] Erro ao disparar prompt de instalação:", err);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowInstallBanner(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("ecocidadao_pwa_dismissed", String(Date.now()));
    }
  }, []);

  // Se já estiver rodando standalone como app na tela inicial, não renderiza nenhum banner
  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* Toast de Sucesso quando o munícipe conclui a instalação */}
      {installedSuccess && (
        <div className="fixed top-4 inset-x-4 z-50 max-w-md mx-auto rounded-2xl bg-emerald-950/90 border border-emerald-500/40 p-3.5 text-white shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-bold text-emerald-200">EcoCidadão Instalado!</p>
            <p className="text-zinc-300">O atalho direto já está na sua tela inicial.</p>
          </div>
        </div>
      )}

      {/* Banner Sutil de Convidar para Tela Inicial */}
      {showInstallBanner && (
        <div className="fixed bottom-20 inset-x-3 z-40 max-w-md mx-auto rounded-2xl bg-zinc-950/95 dark:bg-zinc-900/95 border border-emerald-500/30 p-3.5 shadow-2xl backdrop-blur-xl text-white animate-in fade-in slide-in-from-bottom-4 transition-all">
          <div className="flex items-start justify-between gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shrink-0 shadow-md">
              <Smartphone className="w-5 h-5 text-zinc-950 stroke-[2.2]" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white tracking-tight">
                  Instalar como Aplicativo
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30">
                  Sem Loja
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 mt-0.5 leading-snug">
                {isIos
                  ? "Abra em tela cheia sem barras do navegador para reportar mais rápido."
                  : "Adicione à tela inicial para uma experiência nativa de 1 toque."}
              </p>

              {/* Instrução específica para iOS Safari */}
              {isIos ? (
                <div className="mt-2.5 p-2 rounded-xl bg-white/5 border border-white/10 text-[11px] text-zinc-200 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-md bg-white/10 text-emerald-400 font-bold text-[10px]">1</span>
                    <span>Toque no botão <strong>Compartilhar</strong> (<Share2 className="w-3.5 h-3.5 inline mx-0.5 text-emerald-400" />)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-md bg-white/10 text-emerald-400 font-bold text-[10px]">2</span>
                    <span>Selecione <strong>&quot;Adicionar à Tela de Início&quot;</strong> (<PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-emerald-400" />)</span>
                  </div>
                </div>
              ) : (
                /* Botão de Instalação com 1 toque no Android */
                deferredPrompt && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleInstallClick}
                      className="px-3.5 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/30 active:scale-95 transition-all"
                    >
                      <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Instalar Agora</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDismiss}
                      className="px-2.5 py-1.5 text-zinc-400 hover:text-white text-xs font-medium transition-colors"
                    >
                      Depois
                    </button>
                  </div>
                )
              )}
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
              aria-label="Fechar dica de instalação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
