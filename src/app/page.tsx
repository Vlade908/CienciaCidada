'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { getQrAnchorByCode } from '@/lib/qrAnchors';
import { 
  Camera, 
  Search, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Layers, 
  Sun, 
  Moon, 
  Building2,
  FileText,
  ChevronRight,
  Sparkles,
  Check
} from 'lucide-react';

function HomeContent() {
  const searchParams = useSearchParams();
  const qrParam = searchParams.get('qr');
  const { theme, toggleTheme } = useTheme();

  // Protocolos salvos no aparelho do cidadão (LGPD/localStorage)
  const [savedProtocols, setSavedProtocols] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  // Detecção de âncora de QR Code física se o munícipe escaneou uma placa
  const activeQrAnchor = useMemo(() => {
    return getQrAnchorByCode(qrParam);
  }, [qrParam]);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('ecocidadao_my_protocols');
        if (stored) {
          const list = JSON.parse(stored);
          if (Array.isArray(list)) {
            setSavedProtocols(list);
          }
        }
      } catch (err) {
        console.warn('Erro ao ler histórico de protocolos:', err);
      }
    }
  }, []);

  const handleClearHistory = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ecocidadao_my_protocols');
      setSavedProtocols([]);
    }
  };

  const reportUrl = activeQrAnchor ? `/reportar?qr=${activeQrAnchor.code}` : '/reportar';

  return (
    <div className="min-h-dvh w-full flex flex-col bg-[#fafafa] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors selection:bg-emerald-500/20 selection:text-emerald-700 dark:selection:text-emerald-300">
      
      {/* SUTIL GLOW DE TOPO NO DARK MODE */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none fixed inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_80%_40%_at_50%_-10%,rgba(16,185,129,0.06),transparent)] dark:bg-[radial-gradient(ellipse_80%_40%_at_50%_-10%,rgba(16,185,129,0.09),transparent)]" 
      />

      {/* HEADER ULTRA-CLEAN COM GLASSMORPHISM SUAVE */}
      <header className="h-16 border-b border-zinc-200/60 dark:border-zinc-800/40 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 transition-colors">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/60 flex items-center justify-center text-emerald-500 dark:text-emerald-400 shadow-xs">
            <Layers className="w-4 h-4 stroke-[2]" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 font-sans">
              EcoCidadão
            </span>
            <span className="text-[10px] font-medium tracking-wide text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-200/60 dark:border-zinc-800/60">
              Piloto SP
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          {/* Alternância de Modo Claro / Escuro */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 flex items-center justify-center transition-colors"
            title="Alternar tema"
            aria-label="Alternar Tema"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-600" />
            )}
          </button>

          {/* Link Discreto para Área do Gestor */}
          <Link
            href="/admin"
            className="flex items-center space-x-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 px-2.5 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            title="Painel operacional para servidores e fiscais"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Gestão</span>
          </Link>
        </div>
      </header>

      {/* ÁREA CENTRAL (Mobile-First / Respiro Generoso) */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 sm:px-0 py-8 flex flex-col space-y-8 relative z-10">

        {/* ALERTA DE DETECÇÃO DE PLACA FÍSICA QR CODE (SE PRESENTE) */}
        {activeQrAnchor && (
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 dark:bg-emerald-950/20 p-4 shadow-xs animate-in fade-in duration-300">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 font-mono">
                    Placa {activeQrAnchor.code}
                  </span>
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded font-medium">
                    GPS Fixado
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1 leading-relaxed">
                  {activeQrAnchor.addressHint}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* HERO REFINADO: TIPOGRAFIA PRECISA & WHITESPACE */}
        <section className="text-center space-y-2.5 pt-2">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
            Sua cidade mais limpa começa com você.
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
            Fotografe pontos de descarte irregular em poucos segundos. O sistema unifica os relatos do bairro e direciona os caminhões de coleta.
          </p>
        </section>

        {/* THUMB ZONE: CALLS-TO-ACTION REFINADOS (MATTE ENTERPRISE) */}
        <section className="space-y-3 pt-1">
          {/* BOTÃO PRINCIPAL: ACABAMENTO FOSCO PREMIUM (Estilo Apple / Linear) */}
          <Link
            href={reportUrl}
            className="group relative flex items-center justify-between w-full p-4 sm:p-5 rounded-2xl bg-zinc-900 hover:bg-zinc-850 dark:bg-zinc-900/90 dark:hover:bg-zinc-850 text-white border border-zinc-800 dark:border-zinc-800/80 hover:border-zinc-700/80 shadow-md shadow-zinc-950/15 active:scale-[0.985] transition-all duration-200"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 group-hover:text-emerald-300 transition-colors shrink-0 shadow-inner">
                <Camera className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="text-left">
                <span className="block text-sm sm:text-base font-semibold tracking-tight text-white">
                  {activeQrAnchor ? 'Registrar Foco Nesta Placa' : 'Registrar Novo Descarte'}
                </span>
                <span className="block text-xs text-zinc-400 font-normal">
                  Câmera rápida · Sem cadastro · 100% Anônimo
                </span>
              </div>
            </div>

            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0">
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* BOTÃO SECUNDÁRIO: CARD TRANSLÚCIDO E DISCRETO */}
          <Link
            href="/consulta"
            className="flex items-center justify-between w-full p-3.5 sm:p-4 rounded-xl bg-white/80 hover:bg-white dark:bg-zinc-900/30 dark:hover:bg-zinc-900/60 border border-zinc-200/70 hover:border-zinc-300 dark:border-zinc-800/50 dark:hover:border-zinc-700/60 text-zinc-800 dark:text-zinc-200 active:scale-[0.985] transition-all duration-200 shadow-xs group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center text-zinc-500 dark:text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors shrink-0">
                <Search className="w-4 h-4 stroke-[1.8]" />
              </div>
              <div className="text-left">
                <span className="block text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Acompanhar Chamados
                </span>
                <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">
                  Linha do tempo e comprovação Antes vs. Depois
                </span>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </section>

        {/* SEÇÃO: MEUS CHAMADOS RECENTES (MINIMALISTA & FLUIDO) */}
        <section className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>Meus Chamados Recentes</span>
            </span>

            {mounted && savedProtocols.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                title="Limpar histórico deste navegador"
              >
                Limpar
              </button>
            )}
          </div>

          {mounted && savedProtocols.length > 0 ? (
            <div className="space-y-1.5">
              {savedProtocols.map((code) => (
                <Link
                  key={code}
                  href={`/consulta?protocolo=${code}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/70 hover:bg-white dark:bg-zinc-900/25 dark:hover:bg-zinc-900/60 border border-zinc-200/60 hover:border-zinc-300 dark:border-zinc-800/40 dark:hover:border-zinc-700/50 transition-all shadow-xs group"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-md bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-mono font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {code}
                      </span>
                      <span className="block text-[10px] text-zinc-400 dark:text-zinc-500">
                        Clique para ver a evolução
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 flex items-center gap-0.5 transition-colors">
                    <span>Detalhes</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            /* EMPTY STATE MINIMALISTA & ACOLHEDOR (Sem caixas pesadas) */
            <div className="py-7 px-4 rounded-2xl border border-dashed border-zinc-200/80 dark:border-zinc-800/60 text-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-4 h-4 text-emerald-500/80" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Nenhum chamado salvo ainda
                </p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 max-w-xs mx-auto leading-relaxed">
                  Quando você registrar um foco de resíduos, ele aparecerá aqui para você acompanhar até a limpeza.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* COMO FUNCIONA: TIMELINE ABERTA E ELEGANTE (Sem blocos cinzas) */}
        <section className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800/40 space-y-4">
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-mono">
            Como funciona a zeladoria
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-start space-x-3 sm:flex-col sm:space-x-0 sm:space-y-2">
              <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 text-[11px] font-semibold flex items-center justify-center shrink-0 border border-zinc-200/60 dark:border-zinc-800/60">
                1
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Fotografe o descarte
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                  Aponte a câmera e selecione o tamanho do entulho em 1 toque.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 sm:flex-col sm:space-x-0 sm:space-y-2">
              <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 text-[11px] font-semibold flex items-center justify-center shrink-0 border border-zinc-200/60 dark:border-zinc-800/60">
                2
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Unificação espacial
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                  O algoritmo agrupa relatos vizinhos e gera uma ordem prioritária.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 sm:flex-col sm:space-x-0 sm:space-y-2">
              <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 text-[11px] font-semibold flex items-center justify-center shrink-0 border border-zinc-200/60 dark:border-zinc-800/60">
                3
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Limpeza comprovada
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                  A equipe limpa o local e publica a foto do Antes vs. Depois.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PRIVACIDADE E ANONIMATO */}
        <div className="flex items-center justify-center space-x-1.5 text-[11px] text-zinc-400 dark:text-zinc-500 pt-2 pb-4">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/80" />
          <span>Privacidade garantida · Nenhum dado pessoal coletado</span>
        </div>

      </main>

      {/* FOOTER DISCRETO */}
      <footer className="border-t border-zinc-200/50 dark:border-zinc-800/30 py-5 px-4 text-center text-[11px] text-zinc-400 dark:text-zinc-500 space-y-1">
        <p>EcoCidadão · Inteligência Urbana & Ciência Cidadã</p>
        <p>
          <Link href="/admin" className="text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
            Painel da Concessionária e Prefeitura ➔
          </Link>
        </p>
      </footer>

    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-zinc-50 dark:bg-zinc-950" />}>
      <HomeContent />
    </Suspense>
  );
}
