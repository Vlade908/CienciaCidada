'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ProtocolDetails } from '@/lib/supabase';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { 
  CheckCircle2, 
  MapPin, 
  Flame, 
  Droplets, 
  Share2, 
  ArrowLeft, 
  Camera, 
  ShieldCheck, 
  Check, 
  Clock, 
  Copy,
  Star,
  Sparkles,
  Maximize2,
  X,
  Truck,
  ThumbsUp,
  Layers,
  AlertTriangle,
  SlidersHorizontal
} from 'lucide-react';

interface ProtocolStatusCardProps {
  details: ProtocolDetails;
  onNewSearch?: () => void;
}

export function ProtocolStatusCard({ details, onNewSearch }: ProtocolStatusCardProps) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratedSuccess, setRatedSuccess] = useState(false);
  const [zoomPhoto, setZoomPhoto] = useState<{ url: string; label: string } | null>(null);
  const [viewMode, setViewMode] = useState<'GRID' | 'SLIDER'>('GRID');

  const isCleaned = details.status === 'CLEANED';
  const isInRoute = details.status === 'IN_ROUTE';
  const isTriaged = details.status === 'TRIAGED';
  const isOpen = details.status === 'OPEN';

  // Progresso em porcentagem
  const progressPercent = isCleaned ? 100 : isInRoute ? 75 : isTriaged ? 50 : 25;
  const progressLabel = isCleaned
    ? '100% Finalizado'
    : isInRoute
    ? '75% Em Deslocamento'
    : isTriaged
    ? '50% Triagem Concluída'
    : '25% Registrado no Sistema';

  // Configuração das etapas do Stepper Stitch
  const steps = [
    { 
      id: 1, 
      title: 'Relatado', 
      desc: details.first_reported_at ? new Date(details.first_reported_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '14:10', 
      done: true 
    },
    { 
      id: 2, 
      title: 'Triado', 
      desc: !isOpen ? '14:45' : 'Pendente', 
      done: !isOpen 
    },
    { 
      id: 3, 
      title: 'Em Rota', 
      desc: isInRoute || isCleaned ? '15:20' : 'Aguardando', 
      done: isInRoute || isCleaned 
    },
    { 
      id: 4, 
      title: 'Limpo', 
      desc: isCleaned && details.cleaned_at ? new Date(details.cleaned_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '16:15', 
      done: isCleaned 
    },
  ];

  const scaleMap = {
    LARGE: { label: 'Grande Porte (~2m³)', desc: 'Entulho / Caçamba' },
    MEDIUM: { label: 'Médio Porte (~1m³)', desc: 'Móveis / Descarte Misto' },
    SMALL: { label: 'Pequeno Porte (~0.5m³)', desc: 'Sacos de Resíduo' },
  }[details.dominant_scale] || { label: details.dominant_scale || 'Médio Porte', desc: '' };

  const handleCopyCode = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(details.protocol_code);
        setCopied(true);
        if ('vibrate' in navigator) navigator.vibrate([25]);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.warn('Erro ao copiar código:', err);
    }
  };

  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareData = {
      title: `EcoCidadão - Protocolo ${details.protocol_code}`,
      text: isCleaned
        ? `Boa notícia! O ponto de descarte irregular em ${details.address_reference || 'São Paulo'} foi 100% revitalizado pela prefeitura!`
        : `Acompanhe a limpeza deste ponto em ${details.address_reference || 'São Paulo'}. Já somos ${details.confirmations_count} moradores unidos!`,
      url: shareUrl,
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        setShared(true);
        setTimeout(() => setShared(false), 2500);
        return;
      } catch {
        // Cancelado
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    }
  };

  const handleRate = (stars: number) => {
    setRating(stars);
    setRatedSuccess(true);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([40, 60]);
    }
    setTimeout(() => {
      setShowRatingModal(false);
    }, 1800);
  };

  return (
    <div className="w-full space-y-4 animate-in fade-in duration-200">
      {/* CABEÇALHO DA SEÇÃO DE PROTOCOLO ATIVO */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="size-4.5 text-emerald-500" />
          <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Protocolo Ativo
          </h2>
        </div>
        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
          isCleaned
            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
            : isInRoute
            ? 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30'
            : isTriaged
            ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30'
            : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
        }`}>
          {isCleaned ? 'Resolução Concluída' : isInRoute ? 'Caminhão em Rota' : isTriaged ? 'Triado pela Zeladoria' : 'Na Fila de Triagem'}
        </span>
      </div>

      {/* CARD IMERSIVO DE DESTAQUE DO STITCH */}
      <div className="rounded-3xl bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 p-4 sm:p-5 shadow-xl space-y-5 transition-colors">
        
        {/* Identificação e Endereço */}
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              <span>{details.protocol_code}</span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="text-zinc-400 hover:text-emerald-500 active:scale-90 transition-transform ml-0.5"
                title="Copiar código"
                aria-label="Copiar código do protocolo"
              >
                {copied ? (
                  <Check className="size-3 text-emerald-500" />
                ) : (
                  <Copy className="size-3" />
                )}
              </button>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight leading-snug truncate">
              {details.waste_tags?.length
                ? `Descarte de ${details.waste_tags.join(', ').toLowerCase()}`
                : 'Descarte Irregular de Resíduos'}
            </h3>

            <p className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate">
              <MapPin className="size-3.5 text-emerald-500 shrink-0" />
              <span className="truncate">
                {details.address_reference || 'São Paulo, SP • Ponto georreferenciado'}
              </span>
            </p>
          </div>

          {/* Badge de Status Translúcido */}
          <div className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            isCleaned
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
              : isInRoute
              ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30'
              : isTriaged
              ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30'
              : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
          }`}>
            <span className={`size-1.5 rounded-full ${
              isCleaned ? 'bg-emerald-500' : isInRoute ? 'bg-purple-500 animate-pulse' : isTriaged ? 'bg-blue-500' : 'bg-amber-500 animate-pulse'
            }`} />
            <span>{isCleaned ? 'Concluído' : isInRoute ? 'Em Rota' : isTriaged ? 'Triado' : 'Aberto'}</span>
          </div>
        </div>

        {/* STEPPER / LINHA DO TEMPO ESTILO STITCH / APPLE HIG */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            <span>Status do Fluxo Operacional</span>
            <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
              {progressLabel}
            </span>
          </div>

          <div className="relative grid grid-cols-4 gap-2 pt-2">
            {/* Linha de Conexão de Progresso */}
            <div className="absolute left-6 right-6 top-[22px] h-[3px] -translate-y-1/2 bg-zinc-200 dark:bg-zinc-800 rounded-full z-0 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* 4 Etapas */}
            {steps.map((step) => {
              const isCurrent = (isOpen && step.id === 1) || (isTriaged && step.id === 2) || (isInRoute && step.id === 3) || (isCleaned && step.id === 4);
              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center text-center">
                  <div
                    className={`flex size-8 items-center justify-center rounded-full text-xs font-bold transition-all ring-4 ring-white dark:ring-zinc-900 shadow-xs ${
                      step.done
                        ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                        : isCurrent
                        ? 'bg-amber-500 text-amber-950 ring-amber-500/30'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {step.done ? (
                      <Check className="size-4 stroke-[2.5]" />
                    ) : (
                      <span className="font-mono">{step.id}</span>
                    )}
                  </div>
                  <span className={`mt-2 text-[11px] font-semibold tracking-tight ${
                    step.done ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400'
                  }`}>
                    {step.title}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 mt-0.5">
                    {step.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* EVIDÊNCIA FOTOGRÁFICA - O 'ANTES VS. DEPOIS' DO STITCH */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-mono">
              Evidência Fotográfica
            </span>

            {isCleaned && details.cleaned_photo_url && (
              <button
                type="button"
                onClick={() => setViewMode(viewMode === 'GRID' ? 'SLIDER' : 'GRID')}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <SlidersHorizontal className="size-3" />
                <span>{viewMode === 'GRID' ? 'Ver Slider Interativo' : 'Ver Lado a Lado'}</span>
              </button>
            )}
          </div>

          {/* Renderização Condicional: Lado a Lado vs Slider vs Pendente */}
          {isCleaned && details.cleaned_photo_url && viewMode === 'SLIDER' ? (
            <BeforeAfterSlider
              beforePhotoUrl={details.sample_photo_url}
              afterPhotoUrl={details.cleaned_photo_url}
              protocolCode={details.protocol_code}
              cleanedAt={details.cleaned_at}
              firstReportedAt={details.first_reported_at}
              isCleaned={true}
            />
          ) : isCleaned && details.cleaned_photo_url ? (
            /* GRID 2-FOTOS LADO A LADO DO STITCH */
            <div className="grid grid-cols-2 gap-2.5">
              {/* Foto 1: Antes */}
              <div
                onClick={() => setZoomPhoto({ url: details.sample_photo_url, label: 'Foto Inicial do Descarte' })}
                className="group relative overflow-hidden rounded-2xl bg-zinc-950 aspect-[4/5] shadow-inner cursor-pointer border border-zinc-200/80 dark:border-zinc-800"
              >
                <img
                  src={details.sample_photo_url}
                  alt="Foto original do descarte"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />
                <div className="absolute top-2.5 left-2.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white ring-1 ring-white/20">
                    <span className="size-1.5 rounded-full bg-red-400" />
                    Antes
                  </span>
                </div>
                <div className="absolute bottom-2 left-2 right-2 text-white pointer-events-none">
                  <p className="text-[10px] font-medium leading-tight opacity-90 drop-shadow-sm truncate">
                    Foco inicial de descarte
                  </p>
                </div>
              </div>

              {/* Foto 2: Depois */}
              <div
                onClick={() => setZoomPhoto({ url: details.cleaned_photo_url!, label: 'Comprovante do Local Limpo' })}
                className="group relative overflow-hidden rounded-2xl bg-zinc-950 aspect-[4/5] shadow-inner cursor-pointer border-2 border-emerald-500/50"
              >
                <img
                  src={details.cleaned_photo_url}
                  alt="Comprovante do local revitalizado"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />
                <div className="absolute top-2.5 left-2.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white ring-1 ring-white/30 shadow-sm">
                    <span className="size-1.5 rounded-full bg-emerald-200 animate-pulse" />
                    Depois
                  </span>
                </div>
                <div className="absolute bottom-2 left-2 right-2 text-white pointer-events-none">
                  <p className="text-[10px] font-medium leading-tight opacity-90 drop-shadow-sm truncate">
                    Via revitalizada
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* QUANDO AINDA NÃO FOI LIMPO: FOTO INICIAL + CARD OPERACIONAL */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div
                onClick={() => setZoomPhoto({ url: details.sample_photo_url, label: 'Evidência Fotográfica do Foco' })}
                className="group relative overflow-hidden rounded-2xl bg-zinc-950 aspect-[4/3] sm:aspect-[4/5] shadow-inner cursor-pointer border border-zinc-200/80 dark:border-zinc-800"
              >
                <img
                  src={details.sample_photo_url}
                  alt="Foto do descarte irregular"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />
                <div className="absolute top-2.5 left-2.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white ring-1 ring-white/20">
                    <span className="size-1.5 rounded-full bg-amber-400" />
                    Evidência Munícipe
                  </span>
                </div>
                <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white flex items-center justify-between text-[10px]">
                  <span className="truncate">Registrado via GPS</span>
                  <span className="inline-flex items-center gap-1 font-mono text-zinc-300">
                    <Maximize2 className="size-3" /> Ampliar
                  </span>
                </div>
              </div>

              {/* Card de Aguardando Zeladoria */}
              <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 p-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="size-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <Truck className="size-5" />
                  </div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {isInRoute ? 'Caminhão a caminho' : 'Programação de Limpeza'}
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {isInRoute
                      ? 'A equipe de zeladoria já carregou este ponto na rota diária e a limpeza está em execução.'
                      : 'Este ponto está consolidado na malha de coleta regional. A foto pós-limpeza será anexada assim que o caminhão concluir o serviço.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-zinc-200/60 dark:border-zinc-800 text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                  <Clock className="size-3 text-emerald-500" />
                  <span>Atualizações enviadas via Web Push</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PROVA SOCIAL & METADADOS COMUNITÁRIOS DO STITCH */}
        <div className="flex items-center justify-between rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 p-3.5 border border-zinc-200/60 dark:border-zinc-700/50">
          <div className="flex items-center gap-3">
            {/* Avatar Stack */}
            <div className="flex -space-x-2 overflow-hidden shrink-0">
              <div className="inline-flex size-7 items-center justify-center rounded-full bg-emerald-500/20 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 ring-2 ring-white dark:ring-zinc-900">
                SP
              </div>
              <div className="inline-flex size-7 items-center justify-center rounded-full bg-teal-500/20 text-[11px] font-bold text-teal-600 dark:text-teal-400 ring-2 ring-white dark:ring-zinc-900">
                ZC
              </div>
              <div className="inline-flex size-7 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 ring-2 ring-white dark:ring-zinc-900">
                +{details.confirmations_count}
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium leading-tight">
              <strong className="text-zinc-900 dark:text-white font-semibold">
                {details.confirmations_count} {details.confirmations_count === 1 ? 'vizinho unificado' : 'vizinhos unificados'}
              </strong>{' '}
              no raio de 25m sem duplicar chamados.
            </p>
          </div>

          <ThumbsUp className="size-4.5 text-emerald-500 shrink-0 ml-2" />
        </div>

        {/* CLASSIFICAÇÃO E RISCO AMBIENTAL */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/60 dark:border-zinc-800 flex flex-col justify-between">
            <span className="text-[10px] text-zinc-400 font-mono uppercase">Classificação</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Layers className="size-3.5 text-emerald-500 shrink-0" />
              <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                {scaleMap.label}
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 mt-0.5 truncate">
              {scaleMap.desc}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/60 dark:border-zinc-800 flex flex-col justify-between">
            <span className="text-[10px] text-zinc-400 font-mono uppercase">Vulnerabilidade</span>
            <div className="flex items-center gap-1.5 mt-1">
              {details.is_eco_critical ? (
                <>
                  <Droplets className="size-3.5 text-amber-500 shrink-0" />
                  <span className="font-bold text-xs text-amber-600 dark:text-amber-400 truncate">
                    Área de Córrego
                  </span>
                </>
              ) : (
                <>
                  <ShieldCheck className="size-3.5 text-emerald-500 shrink-0" />
                  <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                    Via Monitorada
                  </span>
                </>
              )}
            </div>
            <span className="text-[10px] text-zinc-500 mt-0.5 truncate">
              {details.is_eco_critical ? 'Prioridade de cheia' : 'Zeladoria padrão'}
            </span>
          </div>
        </div>

        {/* AÇÕES ÚTEIS DO STITCH (GRID 2 BOTÕES) */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 py-3 px-3 text-xs font-semibold text-zinc-900 dark:text-zinc-100 active:scale-98 transition-all border border-zinc-200/80 dark:border-zinc-700/60"
          >
            <Share2 className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span>{shared ? 'Link Copiado!' : 'Compartilhar'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowRatingModal(true)}
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 py-3 px-3 text-xs font-semibold text-white shadow-xs active:scale-98 transition-all"
          >
            <Star className="size-4 fill-white/20 text-white" />
            <span>{rating ? `Avaliado ★ ${rating}` : 'Avaliar Serviço'}</span>
          </button>
        </div>
      </div>

      {/* AÇÕES DE NAVEGAÇÃO INFERIOR */}
      <div className="flex items-center justify-between px-2 pt-1 text-xs">
        {onNewSearch && (
          <button
            type="button"
            onClick={onNewSearch}
            className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1 font-medium transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Consultar outro protocolo</span>
          </button>
        )}

        <Link
          href="/reportar"
          className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold ml-auto"
        >
          <Camera className="size-3.5" />
          <span>Mapear novo descarte</span>
        </Link>
      </div>

      {/* MODAL DE AVALIAÇÃO CÍVICA */}
      {showRatingModal && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
              <Star className="size-6 fill-emerald-500/20" />
            </div>

            <div>
              <h4 className="text-base font-bold text-zinc-900 dark:text-white">
                Avaliar a Zeladoria Municipal
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Como você avalia a agilidade e o serviço de limpeza neste chamado?
              </p>
            </div>

            {ratedSuccess ? (
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2">
                <CheckCircle2 className="size-4" />
                <span>Obrigado pela sua contribuição cidadã!</span>
              </div>
            ) : (
              <div className="flex justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleRate(s)}
                    className="p-2 rounded-xl bg-zinc-100 hover:bg-emerald-500/10 dark:bg-zinc-800 dark:hover:bg-emerald-500/20 text-zinc-400 hover:text-amber-400 hover:scale-110 transition-all active:scale-95"
                    aria-label={`Nota ${s}`}
                  >
                    <Star className="size-6 fill-current" />
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowRatingModal(false)}
              className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 font-medium pt-1"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* LIGHTBOX / ZOOM DE IMAGEM */}
      {zoomPhoto && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setZoomPhoto(null)}
        >
          <div className="relative max-w-2xl w-full max-h-[85vh] flex flex-col items-center">
            <img
              src={zoomPhoto.url}
              alt={zoomPhoto.label}
              className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
            />
            <div className="mt-3 flex items-center justify-between w-full text-xs text-zinc-400 font-mono px-2">
              <span>{zoomPhoto.label} • {details.protocol_code}</span>
              <button
                type="button"
                onClick={() => setZoomPhoto(null)}
                className="px-3 py-1 rounded-lg bg-zinc-800 text-white text-xs hover:bg-zinc-700 flex items-center gap-1"
              >
                <X className="size-3.5" /> Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
