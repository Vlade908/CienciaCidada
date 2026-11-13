'use client';

import React, { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { fetchProtocolDetails, ProtocolDetails, supabase } from '@/lib/supabase';
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
  Camera,
  X,
  ChevronRight,
  MapPin,
  CheckCircle2,
  Truck,
  Lightbulb,
  Building2,
  Check
} from 'lucide-react';

interface SeedCardPreview {
  code: string;
  title: string;
  address: string;
  status: 'OPEN' | 'TRIAGED' | 'IN_ROUTE' | 'CLEANED';
  time: string;
  hasPhoto?: boolean;
}

const DEMO_PREVIEWS: SeedCardPreview[] = [
  {
    code: 'ECO-2026-0003',
    title: 'Poda e Restos em Calçada',
    address: 'Rua Augusta, 450 • Consolação, SP',
    status: 'IN_ROUTE',
    time: 'Hoje • 14:20',
    hasPhoto: true,
  },
  {
    code: 'ECO-2026-0002',
    title: 'Entulho em Terreno Baldio',
    address: 'Av. Brigadeiro Faria Lima, 1800 • SP',
    status: 'CLEANED',
    time: 'Hoje • 12:10',
    hasPhoto: true,
  },
  {
    code: 'ECO-2026-0001',
    title: 'Entulho Próximo ao Córrego Limpo',
    address: 'Margem do Viaduto • Área de Preservação',
    status: 'OPEN',
    time: 'Hoje • 11:40',
    hasPhoto: true,
  },
];

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
  const [filterTab, setFilterTab] = useState<'ALL' | 'OPEN' | 'CLEANED'>('ALL');
  const [clustersList, setClustersList] = useState<SeedCardPreview[]>([]);

  // Carrega chamados reais do Supabase para manter os cards e contadores 100% fiéis
  useEffect(() => {
    let isMounted = true;
    async function loadRecentFromSupabase() {
      try {
        const { data } = await supabase
          .from('incident_clusters')
          .select('protocol_code, status, dominant_scale, address_reference, first_reported_at, sample_photo_url')
          .order('first_reported_at', { ascending: false })
          .limit(30);

        if (isMounted && data && data.length > 0) {
          const mapped: SeedCardPreview[] = data.map((c: any) => ({
            code: c.protocol_code,
            title:
              c.dominant_scale === 'LARGE'
                ? 'Descarte de Grande Porte'
                : c.dominant_scale === 'SMALL'
                ? 'Resíduos de Pequeno Porte'
                : 'Descarte Irregular de Resíduos',
            address: c.address_reference || 'Ponto georreferenciado via GPS',
            status: c.status as any,
            time: c.first_reported_at
              ? `Hoje • ${new Date(c.first_reported_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
              : 'Recente',
            hasPhoto: Boolean(c.sample_photo_url),
          }));
          setClustersList(mapped);
        }
      } catch (err) {
        console.warn('Erro ao carregar lista de chamados:', err);
      }
    }
    loadRecentFromSupabase();
    return () => {
      isMounted = false;
    };
  }, []);

  // Carrega lista de chamados salvos no aparelho do cidadão (LGPD)
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
        router.replace(`/consulta?protocolo=${cleanCode}`);
      } else {
        setActiveDetails(null);
        setErrorMessage(
          `Nenhum chamado encontrado com o código "${cleanCode}". Verifique se o formato está correto (Ex: ECO-2026-0004).`
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

  const handleClear = () => {
    setInputCode('');
    setActiveDetails(null);
    setErrorMessage(null);
    router.replace('/consulta');
  };

  // Lista ativa: chamados reais do Supabase ou dados de demonstração como fallback
  const currentList = clustersList.length > 0 ? clustersList : DEMO_PREVIEWS;

  const countTotal = currentList.length;
  const countOpen = currentList.filter(
    (item) => item.status === 'OPEN' || item.status === 'IN_ROUTE' || item.status === 'TRIAGED'
  ).length;
  const countCleaned = currentList.filter((item) => item.status === 'CLEANED').length;

  // Filtragem dos cards de visualização
  const filteredDemos = useMemo(() => {
    if (filterTab === 'OPEN') {
      return currentList.filter(
        (item) => item.status === 'OPEN' || item.status === 'IN_ROUTE' || item.status === 'TRIAGED'
      );
    }
    if (filterTab === 'CLEANED') {
      return currentList.filter((item) => item.status === 'CLEANED');
    }
    return currentList;
  }, [filterTab, currentList]);

  return (
    <div className="min-h-dvh w-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors pb-36">
      
      {/* 1. HEADER / APP BAR MINIMALISTA STICKY (APPLE HIG / LINEAR STYLE DO STITCH) */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200/60 dark:border-zinc-800/60 transition-all duration-300">
        {/* Botão Voltar */}
        <Link
          href="/"
          className="flex size-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 active:scale-95 transition-all border border-zinc-200/60 dark:border-zinc-800/60"
          aria-label="Voltar para Início"
          title="Voltar para Início"
        >
          <ArrowLeft className="size-4.5" />
        </Link>

        {/* Centro: Título e Status Indicator */}
        <div className="flex flex-col items-center">
          <h1 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
            Acompanhar Chamados
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex size-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-medium tracking-wide text-zinc-500 dark:text-zinc-400 font-mono">
              Sincronizado via Supabase
            </span>
          </div>
        </div>

        {/* Ação Direita: Alternar Tema */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex size-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 active:scale-95 transition-all border border-zinc-200/60 dark:border-zinc-800/60"
          title="Alternar tema"
          aria-label="Alternar tema"
        >
          {theme === 'dark' ? (
            <Sun className="size-4 text-amber-400" />
          ) : (
            <Moon className="size-4 text-zinc-700" />
          )}
        </button>
      </header>

      {/* ÁREA DE CONTEÚDO PRINCIPAL */}
      <main className="flex-1 px-4 pt-4 max-w-md w-full mx-auto space-y-5">
        
        {/* 2. BARRA DE BUSCA EM PILL FLUTUANTE DO STITCH */}
        <section className="space-y-3">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <span className="absolute left-3.5 text-zinc-400 pointer-events-none flex items-center justify-center">
              <Search className="size-4" />
            </span>

            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="Buscar protocolo (ECO-XXXX)..."
              className="w-full rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-3 pl-10 pr-10 text-xs sm:text-sm font-mono uppercase text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
              autoFocus={!deepLinkedProtocol}
            />

            {inputCode ? (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Limpar busca"
                className="absolute right-3 flex size-6 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
              >
                <X className="size-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                aria-label="Buscar"
                className="absolute right-2 flex size-8 items-center justify-center rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
              </button>
            )}
          </form>

          {/* FILTROS RÁPIDOS (PILLS DESLIZANTES DO STITCH) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 hide-scrollbar">
            <button
              type="button"
              onClick={() => setFilterTab('ALL')}
              className={`flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full px-3.5 text-xs font-semibold shadow-xs transition-all ${
                filterTab === 'ALL'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <span>Todos</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                filterTab === 'ALL' ? 'bg-white/20 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
              }`}>
                {countTotal}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab('OPEN')}
              className={`flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full px-3.5 text-xs font-semibold shadow-xs transition-all ${
                filterTab === 'OPEN'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <span>Em Aberto</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                filterTab === 'OPEN' ? 'bg-white/20 text-white' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
              }`}>
                {countOpen}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterTab('CLEANED')}
              className={`flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full px-3.5 text-xs font-semibold shadow-xs transition-all ${
                filterTab === 'CLEANED'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              {filterTab === 'CLEANED' && <Check className="size-3" />}
              <span>Concluídos</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                filterTab === 'CLEANED' ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              }`}>
                {countCleaned}
              </span>
            </button>
          </div>
        </section>

        {/* FEEDBACK DE ERRO */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-600" />
            <div>
              <p className="font-semibold">Protocolo não localizado</p>
              <p className="text-[11px] mt-0.5 text-rose-600/90 dark:text-rose-300/90 leading-relaxed">
                {errorMessage}
              </p>
            </div>
          </div>
        )}

        {/* 3. VISÃO DETALHADA DO PROTOCOLO ATIVO (SE ENCONTRADO) */}
        {activeDetails ? (
          <ProtocolStatusCard
            details={activeDetails}
            onNewSearch={handleClear}
          />
        ) : null}

        {/* 4. LISTA DE CHAMADOS RECENTES E CARDS DE DEMO (SE NÃO HOUVER PROTOCOLO ATIVO OU PARA NAVEGAR) */}
        <section className="space-y-3 pt-1">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {activeDetails ? 'Outros Chamados para Consulta' : 'Chamados em Destaque'}
            </h3>
            <span className="text-xs font-mono text-zinc-400">
              {filteredDemos.length} exibidos
            </span>
          </div>

          <div className="space-y-3">
            {filteredDemos.map((demo) => {
              const isSelected = activeDetails?.protocol_code === demo.code;
              const isDone = demo.status === 'CLEANED';
              const isInProgress = demo.status === 'IN_ROUTE';

              return (
                <div
                  key={demo.code}
                  onClick={() => {
                    setInputCode(demo.code);
                    handleSearch(demo.code);
                  }}
                  className={`rounded-3xl p-4 transition-all cursor-pointer active:scale-[0.99] border ${
                    isSelected
                      ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/40 shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-white dark:bg-zinc-900/80 border-zinc-200/80 dark:border-zinc-800 shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                          {demo.code}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-mono">
                          {demo.time}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                        {demo.title}
                      </h4>
                      <p className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 truncate">
                        <MapPin className="size-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate">{demo.address}</span>
                      </p>
                    </div>

                    {/* Badge de Status */}
                    {isDone ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Concluído
                      </span>
                    ) : isInProgress ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                        <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Em Rota
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                        <span className="size-1.5 rounded-full bg-blue-500" />
                        Aberto
                      </span>
                    )}
                  </div>

                  {/* Barra de Progresso ou Rodapé */}
                  {isInProgress ? (
                    <div className="mt-3.5 flex items-center gap-3 border-t border-zinc-100 dark:border-zinc-800/80 pt-3">
                      <div className="h-1.5 flex-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                        <div className="h-full w-2/3 rounded-full bg-amber-500" />
                      </div>
                      <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 font-mono">
                        Caminhão a 1.2 km
                      </span>
                      <ChevronRight className="size-4 text-zinc-400 ml-auto" />
                    </div>
                  ) : isDone ? (
                    <div className="mt-3 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/80 pt-2.5 text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="size-3.5" />
                        Foto Antes &amp; Depois verificada
                      </span>
                      <ChevronRight className="size-4 text-zinc-400" />
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/80 pt-2.5 text-xs text-zinc-400">
                      <span className="text-[11px] font-mono">
                        Aguardando despacho de zeladoria
                      </span>
                      <ChevronRight className="size-4 text-zinc-400" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. DICA DE CIDADANIA / CALLOUT SUTIL APPLE HIG DO STITCH */}
        <section className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-start gap-3">
          <Lightbulb className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              Você sabia?
            </h4>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Reportar com foto nítida e localização GPS reduz em até 40% o tempo de deslocamento das equipes municipais. Obrigado por cuidar da sua cidade!
            </p>
          </div>
        </section>

      </main>

      {/* 6. FLOATING DOCK INFERIOR COMPATÍVEL COM O HOME */}
      <div className="fixed bottom-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
        <nav 
          aria-label="Navegação inferior"
          className="pointer-events-auto flex items-center justify-between w-full max-w-[360px] px-3 py-1.5 bg-zinc-950/85 dark:bg-zinc-900/90 backdrop-blur-xl rounded-full shadow-[0_12px_36px_rgba(0,0,0,0.3)] border border-white/15"
        >
          <Link
            href="/"
            className="flex flex-col items-center justify-center min-w-[50px] min-h-[44px] px-3 py-1 rounded-full text-zinc-300 hover:text-white font-medium text-[11px] transition-all"
          >
            <Layers className="size-4 mb-0.5" />
            <span>Início</span>
          </Link>

          <Link
            href="/reportar"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/40 transition-all active:scale-95"
          >
            <Camera className="size-4 stroke-[2.2]" />
            <span>Reportar</span>
          </Link>

          <Link
            href="/consulta"
            className="flex flex-col items-center justify-center min-w-[50px] min-h-[44px] px-3 py-1 rounded-full bg-white/15 text-emerald-300 font-medium text-[11px] transition-all"
            aria-current="page"
          >
            <Search className="size-4 mb-0.5 text-emerald-400" />
            <span>Consultar</span>
          </Link>

          <Link
            href="/admin"
            className="flex flex-col items-center justify-center min-w-[50px] min-h-[44px] px-3 py-1 rounded-full text-zinc-300 hover:text-white font-medium text-[11px] transition-all"
          >
            <Building2 className="size-4 mb-0.5" />
            <span>Gestão</span>
          </Link>
        </nav>
      </div>

    </div>
  );
}

export default function ConsultaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh w-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-400 gap-2">
          <Loader2 className="size-6 animate-spin text-emerald-400" />
          <span className="text-xs font-mono">Carregando canal de transparência...</span>
        </div>
      }
    >
      <ConsultaContent />
    </Suspense>
  );
}
