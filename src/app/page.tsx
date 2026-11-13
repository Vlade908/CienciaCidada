'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { getQrAnchorByCode } from '@/lib/qrAnchors';
import { reverseGeocode } from '@/lib/reverseGeocode';
import { 
  Camera, 
  Search, 
  Clock, 
  MapPin, 
  Layers, 
  Sun, 
  Moon, 
  CheckCircle2, 
  Truck, 
  FileText, 
  ChevronRight, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Leaf
} from 'lucide-react';

function HomeContent() {
  const searchParams = useSearchParams();
  const qrParam = searchParams.get('qr');
  const { theme, toggleTheme } = useTheme();

  // Protocolos salvos no aparelho do cidadão (LGPD/localStorage)
  const [savedProtocols, setSavedProtocols] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<string>('Detectando localização...');
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

      // Restaura última localização do cache do munícipe se existir
      const cachedLocation = localStorage.getItem('ecocidadao_user_city');
      if (cachedLocation) {
        setUserLocation(cachedLocation);
      }

      // Consulta GPS do navegador para obter a cidade e estado em tempo real
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const geo = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
              if (geo?.cityState) {
                setUserLocation(geo.cityState);
                localStorage.setItem('ecocidadao_user_city', geo.cityState);
              }
            } catch (err) {
              console.warn('Erro ao geocodificar localização na home:', err);
            }
          },
          (err) => {
            console.warn('GPS não autorizado ou indisponível na home:', err.message);
            if (!cachedLocation) {
              setUserLocation('Localização via Satélite');
            }
          },
          { timeout: 8000, maximumAge: 60000, enableHighAccuracy: false }
        );
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
    <div className="min-h-dvh w-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors pb-24 selection:bg-emerald-500/20 selection:text-emerald-700 dark:selection:text-emerald-300">
      
      {/* SEÇÃO HERO IMERSIVO (Estilo Stitch Design System) */}
      <section className="relative w-full bg-gradient-to-br from-emerald-900 via-emerald-950 to-zinc-950 text-white px-4 sm:px-6 pt-6 pb-8 overflow-hidden rounded-b-[2.5rem] shadow-xl">
        {/* Luzes orgânicas de ambientação */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -left-20 w-72 h-72 bg-teal-500/10 rounded-full blur-[70px] pointer-events-none" />

        <div className="max-w-md mx-auto relative z-10 space-y-6">
          {/* Top Bar: Saudação & Badges Cívicos */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/80 font-medium">Olá, Cidadão 👋</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-medium text-white shadow-xs border border-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {userLocation && userLocation !== 'Detectando localização...' ? userLocation.split(',')[0] : 'EcoCidadão'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-white/90 text-xs">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-medium tracking-wide">{userLocation}</span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              {/* Alternar Tema */}
              <button
                type="button"
                onClick={toggleTheme}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-all active:scale-95 border border-white/10"
                title="Alternar tema"
                aria-label="Alternar tema"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-300" />
                ) : (
                  <Moon className="w-4 h-4 text-white" />
                )}
              </button>
            </div>
          </div>

          {/* Chamada Principal Stitch */}
          <div className="space-y-1.5 pt-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight font-sans">
              Onde é o próximo<br />
              <span className="text-emerald-400">ponto de limpeza?</span>
            </h1>
            <p className="text-xs text-white/70 max-w-xs leading-relaxed">
              Mapeie descarte irregular de resíduos em 5 segundos e acompanhe a rota de zeladoria em tempo real.
            </p>
          </div>

          {/* Grid de 2 Ações Rápidas do Munícipe (Glassmorphism do Stitch) */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Link
              href={reportUrl}
              className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-all active:scale-95 border border-white/10 group shadow-xs"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300 group-hover:scale-110 transition-transform shrink-0">
                <Camera className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-white tracking-tight">Reportar</span>
                <span className="text-[10px] text-white/70">Foto em 5s</span>
              </div>
            </Link>

            <Link
              href="/consulta"
              className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-all active:scale-95 border border-white/10 group shadow-xs"
            >
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform shrink-0">
                <Search className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-white tracking-tight">Consultar</span>
                <span className="text-[10px] text-white/70">Ver chamados</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* CONTEÚDO PRINCIPAL (Cards de Zeladoria) */}
      <main className="max-w-md w-full mx-auto px-4 pt-6 flex flex-col space-y-6">

        {/* ALERTA DE DETECÇÃO DE PLACA QR CODE (SE PRESENTE) */}
        {activeQrAnchor && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-950/30 p-4 shadow-xs animate-in fade-in">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 font-mono">
                    Placa Identificada: {activeQrAnchor.code}
                  </span>
                  <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                    GPS Fixado
                  </span>
                </div>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1">
                  {activeQrAnchor.addressHint}
                </p>
                <Link
                  href={reportUrl}
                  className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-2 hover:underline"
                >
                  <span>Abrir Câmera nesta placa</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* SEÇÃO: MEUS CHAMADOS RECENTES (Estilo Stitch Card Feed) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                Meus Chamados Recentes
              </h2>
            </div>

            {mounted && savedProtocols.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                className="text-xs text-zinc-400 hover:text-rose-500 transition-colors"
                title="Limpar histórico deste navegador"
              >
                Limpar
              </button>
            )}
          </div>

          {mounted && savedProtocols.length > 0 ? (
            <div className="space-y-2.5">
              {savedProtocols.map((code) => (
                <Link
                  key={code}
                  href={`/consulta?protocolo=${code}`}
                  className="w-full bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm hover:shadow-md border border-zinc-200/80 dark:border-zinc-800 flex items-center gap-3 transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="w-6 h-6 stroke-[1.8]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-xs font-mono font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {code}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        Acompanhar
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      Clique para ver linha do tempo e Antes vs. Depois
                    </p>
                  </div>

                  <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          ) : (
            /* EMPTY STATE ESTILO STITCH */
            <div className="p-6 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/40 text-center space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Nenhum chamado no seu histórico
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                  Quando você registrar um foco de resíduos, ele aparecerá aqui para você acompanhar até a limpeza.
                </p>
              </div>
              <Link
                href={reportUrl}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
              >
                <span>Fazer meu primeiro registro</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </section>

        {/* CARD BANNER ECO-CONSCIENTE DE DESTAQUE (Diretamente do Stitch) */}
        <section className="w-full rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-700 p-4 sm:p-5 text-white flex items-center justify-between shadow-md relative overflow-hidden">
          <div className="relative z-10 max-w-[75%] space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-emerald-200 font-bold bg-white/10 px-2 py-0.5 rounded-full inline-block">
              Zeladoria Urbana Coletiva
            </span>
            <h3 className="text-sm sm:text-base font-bold text-white">
              Ciência Cidadã por uma Cidade Limpa
            </h3>
            <p className="text-xs text-white/80 leading-relaxed">
              Cada foto enviada alimenta o algoritmo do PostGIS que otimiza a rota dos caminhões da prefeitura.
            </p>
          </div>
          <div className="relative z-10 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner shrink-0">
            <Leaf className="w-6 h-6 text-emerald-200" />
          </div>
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
        </section>

        {/* BADGE DE PRIVACIDADE E CONFIANÇA */}
        <div className="flex items-center justify-center space-x-1.5 text-xs text-zinc-500 dark:text-zinc-400 pt-1 pb-4">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Privacidade garantida pela LGPD · 100% Anônimo</span>
        </div>

      </main>

      {/* FLOATING DOCK INFERIOR (Mobile Tab Bar do Stitch) */}
      <div className="fixed bottom-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
        <nav 
          aria-label="Navegação inferior"
          className="pointer-events-auto flex items-center justify-around w-full max-w-[320px] px-3 py-1.5 bg-zinc-950/85 dark:bg-zinc-900/90 backdrop-blur-xl rounded-full shadow-[0_12px_36px_rgba(0,0,0,0.3)] border border-white/15"
        >
          <Link
            href="/"
            className="flex flex-col items-center justify-center min-w-[60px] min-h-[44px] px-3 py-1 rounded-full bg-white/15 text-emerald-300 font-medium text-[11px] transition-all"
            aria-current="page"
          >
            <Layers className="w-4 h-4 mb-0.5" />
            <span>Início</span>
          </Link>

          <Link
            href={reportUrl}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/40 transition-all active:scale-95"
          >
            <Camera className="w-4 h-4 stroke-[2.2]" />
            <span>Reportar</span>
          </Link>

          <Link
            href="/consulta"
            className="flex flex-col items-center justify-center min-w-[60px] min-h-[44px] px-3 py-1 rounded-full text-zinc-300 hover:text-white font-medium text-[11px] transition-all"
          >
            <Search className="w-4 h-4 mb-0.5" />
            <span>Consultar</span>
          </Link>
        </nav>
      </div>

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
