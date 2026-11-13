'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { fetchProtocolDetails, ProtocolDetails } from '@/lib/supabase';
import { ProtocolStatusCard } from '@/components/consulta/ProtocolStatusCard';
import { useTheme } from '@/context/ThemeContext';
import { 
  Search, 
  ArrowLeft, 
  Clock, 
  Layers, 
  Loader2, 
  AlertCircle, 
  Sun, 
  Moon, 
  FileText, 
  Sparkles,
  Camera
} from 'lucide-react';

function ConsultaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const deepLinkedProtocol = searchParams.get('protocolo');

  const { theme, toggleTheme } = useTheme();

  const [inputCode, setInputCode] = useState('');
  const [activeDetails, setActiveDetails] = useState<ProtocolDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentProtocols, setRecentProtocols] = useState<string[]>([]);

  // Carrega lista de chamados salvos no aparelho do cidadão
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('ecocidadao_my_protocols');
        if (stored) {
          const list = JSON.parse(stored);
          if (Array.isArray(list)) {
            setRecentProtocols(list);
          }
        }
      } catch (err) {
        console.warn('Erro ao ler protocolos salvos:', err);
      }
    }
  }, []);

  // Função central de busca
  const handleSearch = useCallback(async (codeToSearch: string) => {
    const cleanCode = codeToSearch.trim().toUpperCase();
    if (!cleanCode) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await fetchProtocolDetails(cleanCode);
      if (result) {
        setActiveDetails(result);
        setInputCode(cleanCode);
        // Atualiza a URL sem recarregar a página
        router.replace(`/consulta?protocolo=${cleanCode}`);
      } else {
        setActiveDetails(null);
        setErrorMessage(
          `Nenhum chamado encontrado com o código "${cleanCode}". Verifique se o formato está correto (Ex: ECO-2026-0001).`
        );
      }
    } catch (err) {
      console.error('Erro na busca do protocolo:', err);
      setErrorMessage('Falha ao comunicar com o servidor. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Se houver parâmetro na URL, dispara a busca automaticamente
  useEffect(() => {
    if (deepLinkedProtocol) {
      setInputCode(deepLinkedProtocol);
      handleSearch(deepLinkedProtocol);
    }
  }, [deepLinkedProtocol, handleSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(inputCode);
  };

  return (
    <div className="min-h-dvh w-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      
      {/* HEADER DE TRANSPARÊNCIA */}
      <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-4 flex items-center justify-between shrink-0 select-none">
        <Link
          href="/"
          className="flex items-center space-x-1.5 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Início</span>
        </Link>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1 font-mono">
            <Layers className="w-3.5 h-3.5 text-emerald-500" />
            EcoCidadão
          </span>
          <span className="text-[10px] font-mono text-zinc-400">Transparência</span>
        </div>

        {/* Botão de Alternância de Tema */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center transition-colors"
          title="Alternar modo claro / escuro"
          aria-label="Alternar Tema"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-zinc-700" />
          )}
        </button>
      </header>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 overflow-y-auto px-4 py-6 max-w-md w-full mx-auto flex flex-col justify-between">
        <div className="space-y-6">
          
          {/* SEÇÃO HERO SE NENHUM PROTOCOLO ESTIVER CARREGADO */}
          {!activeDetails && (
            <div className="text-center space-y-2 pt-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-1">
                <Search className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Acompanhar Chamado
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                Consulte o andamento da limpeza urbana pelo número do protocolo gerado no envio da denúncia.
              </p>
            </div>
          )}

          {/* BARRA DE PESQUISA */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="Ex: ECO-2026-0001"
                  className="w-full pl-10 pr-3 py-3 text-sm font-mono uppercase bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs transition-all"
                  autoFocus={!deepLinkedProtocol}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !inputCode.trim()}
                className="py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-xs shrink-0 flex items-center gap-1.5"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Buscar</span>
                )}
              </button>
            </div>
          </form>

          {/* FEEDBACK DE ERRO */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <p className="font-semibold">Protocolo não localizado</p>
                <p className="text-[11px] mt-0.5 text-rose-600/90 dark:text-rose-300/90 leading-relaxed">
                  {errorMessage}
                </p>
              </div>
            </div>
          )}

          {/* PROTOCOLOS RECENTES SALVOS NO APARELHO (1 TOQUE) */}
          {!activeDetails && recentProtocols.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                <span className="flex items-center gap-1 font-mono uppercase text-[10px]">
                  <Clock className="w-3 h-3" /> Seus Chamados Recentes
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">Salvo no aparelho</span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {recentProtocols.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      setInputCode(code);
                      handleSearch(code);
                    }}
                    className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/40 text-left flex items-center justify-between group transition-all shadow-2xs"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-emerald-500 transition-colors">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {code}
                      </span>
                    </div>

                    <span className="text-[10px] text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 font-medium flex items-center gap-1">
                      Ver status &rarr;
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PROTOCOLO ENCONTRADO - RENDERIZA CARD COMPLETO */}
          {activeDetails && (
            <ProtocolStatusCard
              details={activeDetails}
              onNewSearch={() => {
                setActiveDetails(null);
                setInputCode('');
                router.replace('/consulta');
              }}
            />
          )}

          {/* DICA DE EXEMPLOS PARA DEMONSTRAÇÃO */}
          {!activeDetails && (
            <div className="p-3.5 rounded-2xl bg-zinc-100/70 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800/80 text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1.5">
              <span className="font-semibold text-zinc-700 dark:text-zinc-300 block">
                Exemplos disponíveis para teste rápido:
              </span>
              <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    setInputCode('ECO-2026-0004');
                    handleSearch('ECO-2026-0004');
                  }}
                  className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20"
                >
                  ECO-2026-0004 (Limpo - Antes/Depois)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInputCode('ECO-2026-0001');
                    handleSearch('ECO-2026-0001');
                  }}
                  className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25 hover:bg-amber-500/20"
                >
                  ECO-2026-0001 (Aberto - Crítico)
                </button>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER INFORMATIVO */}
        <footer className="pt-8 pb-2 text-center text-[10px] text-zinc-400 font-mono">
          <span>EcoCidadão · Desafio 09 · Mapeamento Colaborativo de Resíduos</span>
        </footer>
      </main>

    </div>
  );
}

export default function ConsultaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh w-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
          <span className="text-xs font-mono">Carregando canal de transparência...</span>
        </div>
      }
    >
      <ConsultaContent />
    </Suspense>
  );
}
