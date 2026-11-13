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
  Sparkles, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Layers, 
  Sun, 
  Moon, 
  ExternalLink,
  Flame,
  Building2,
  Trash2,
  FileText
} from 'lucide-react';

function HomeContent() {
  const searchParams = useSearchParams();
  const qrParam = searchParams.get('qr');
  const { theme, toggleTheme } = useTheme();

  // Protocolos salvos no aparelho do cidadão
  const [savedProtocols, setSavedProtocols] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  // Detecção de âncora de QR Code física se o usuário escaneou uma placa
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
    <div className="min-h-dvh w-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      
      {/* HEADER AMIGÁVEL & INSTITUCIONAL */}
      <header className="h-16 border-b border-zinc-200 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 transition-colors shadow-xs">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Layers className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-white font-sans">
                EcoCidadão
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                Piloto SP
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono leading-none">
              Zeladoria Urbana Colaborativa
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Alternância de Modo Claro / Escuro */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center transition-colors"
            title="Alternar modo claro / escuro"
            aria-label="Alternar Tema"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-700" />
            )}
          </button>

          {/* Link para Acesso Administrativo B2G */}
          <Link
            href="/admin"
            className="flex items-center space-x-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 px-2.5 py-1.5 rounded-lg border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-colors"
            title="Acesso de Fiscais e Gestores da Prefeitura"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Gestão</span>
          </Link>
        </div>
      </header>

      {/* ÁREA DE CONTEÚDO PRINCIPAL (Mobile-First Thumb Zone) */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-6 flex flex-col space-y-6">

        {/* ALERTA SE O CIDADÃO ESCANEOU UMA PLACA FÍSICA QR CODE */}
        {activeQrAnchor && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/30 p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 font-mono uppercase">
                    Placa Identificada: {activeQrAnchor.code}
                  </span>
                  <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                    GPS Fixado
                  </span>
                </div>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-0.5 font-medium">
                  {activeQrAnchor.addressHint}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                  Você está num ponto monitorado pela prefeitura. Suas coordenadas já foram validadas com máxima precisão.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* HERO CARD DE ACOLHIMENTO */}
        <section className="text-center space-y-2 pt-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mapeamento em 3 toques</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
            Sua cidade mais limpa começa com você.
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
            Fotografe descartes irregulares de entulho e móveis velhos. Nosso algoritmo unifica os relatos e prioriza a rota de limpeza urbana.
          </p>
        </section>

        {/* THUMB ZONE: CALL-TO-ACTION PRINCIPAL (Grandioso & Imersivo) */}
        <section className="space-y-3">
          <Link
            href={reportUrl}
            className="group relative flex items-center justify-between w-full p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/25 active:scale-[0.98] transition-all duration-200 overflow-hidden"
          >
            {/* Efeito Glow de fundo */}
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform pointer-events-none" />

            <div className="flex items-center space-x-4 relative z-10">
              <div className="w-13 h-13 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                <Camera className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <span className="block text-base sm:text-lg font-bold tracking-tight text-white">
                  {activeQrAnchor ? 'Registrar Foco Nesta Placa' : 'Registrar Novo Foco'}
                </span>
                <span className="block text-xs text-emerald-100 font-medium">
                  Abrir câmera · Sem cadastro · 100% Anônimo
                </span>
              </div>
            </div>

            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0 group-hover:translate-x-1 transition-transform relative z-10">
              <ArrowRight className="w-4 h-4 text-white" />
            </div>
          </Link>

          {/* CARD SECUNDÁRIO: CONSULTA DE PROTOCOLO */}
          <Link
            href="/consulta"
            className="flex items-center justify-between w-full p-4 rounded-xl bg-white dark:bg-zinc-900 hover:bg-zinc-100/80 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 active:scale-[0.98] transition-all shadow-xs group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 group-hover:text-emerald-500 transition-colors">
                <Search className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-semibold text-zinc-900 dark:text-white">
                  Acompanhar Meus Chamados
                </span>
                <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                  Veja a timeline e a foto de Antes vs. Depois
                </span>
              </div>
            </div>

            <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </section>

        {/* SEÇÃO: MEUS CHAMADOS RECENTES (Persistência Local no Aparelho) */}
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Meus Chamados Recentes</span>
            </h2>

            {mounted && savedProtocols.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                className="text-[11px] text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                title="Limpar histórico deste navegador"
              >
                Limpar
              </button>
            )}
          </div>

          {/* LISTA DE PROTOCOLOS SALVOS */}
          {mounted && savedProtocols.length > 0 ? (
            <div className="space-y-2">
              {savedProtocols.map((code) => (
                <Link
                  key={code}
                  href={`/consulta?protocolo=${code}`}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850/70 border border-zinc-200 dark:border-zinc-800 transition-colors shadow-xs group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {code}
                      </span>
                      <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">
                        Clique para ver status e Antes/Depois
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Ver</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            /* EMPTY STATE ENGAJADOR */
            <div className="p-6 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/40 text-center space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Nenhum chamado no seu histórico
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                  Você ainda não ajudou a limpar seu bairro. Faça seu primeiro relato fotográfico e acompanhe a limpeza aqui!
                </p>
              </div>
              <Link
                href={reportUrl}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 py-1"
              >
                <span>Fazer primeiro relato</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </section>

        {/* COMO FUNCIONA (Educação Cidadã & Confiança) */}
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono">
            Como Funciona a Zeladoria
          </h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 space-y-1">
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">1</span>
              <p className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100">Fotografe</p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">Enquadre o entulho na rua</p>
            </div>
            <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 space-y-1">
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">2</span>
              <p className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100">Unificação</p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">PostGIS agrupa relatos vizinhos</p>
            </div>
            <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 space-y-1">
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">3</span>
              <p className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-100">Limpeza</p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">Caminhão limpa e envia o Antes/Depois</p>
            </div>
          </div>
        </section>

        {/* BADGE DE PRIVACIDADE E CONFIANÇA */}
        <div className="flex items-center justify-center space-x-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Em conformidade com a LGPD · Nenhum dado pessoal coletado</span>
        </div>

      </main>

      {/* FOOTER DISCRETO */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-950/50 py-4 px-4 text-center text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1">
        <p>EcoCidadão · Inteligência Espacial B2G & Ciência Cidadã</p>
        <p>
          <Link href="/admin" className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
            Painel Operacional da Concessionária / Prefeitura ➔
          </Link>
        </p>
      </footer>

    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-zinc-950" />}>
      <HomeContent />
    </Suspense>
  );
}
