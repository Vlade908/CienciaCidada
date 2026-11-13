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
  Send
} from 'lucide-react';

interface ProtocolStatusCardProps {
  details: ProtocolDetails;
  onNewSearch?: () => void;
}

export function ProtocolStatusCard({ details, onNewSearch }: ProtocolStatusCardProps) {
  const [copied, setCopied] = useState(false);

  const isCleaned = details.status === 'CLEANED';
  const isInRoute = details.status === 'IN_ROUTE';
  const isTriaged = details.status === 'TRIAGED';
  const isOpen = details.status === 'OPEN';

  // Configuração das etapas do Stepper
  const steps = [
    { id: 1, title: 'Registrado', desc: 'Foto e GPS recebidos', active: true, done: true },
    { id: 2, title: 'Triado', desc: 'Deduplicado em 25m', active: true, done: !isOpen },
    { id: 3, title: 'Em Rota', desc: 'Caminhão despachado', active: isInRoute || isCleaned, done: isCleaned },
    { id: 4, title: 'Limpo', desc: 'Serviço concluído', active: isCleaned, done: isCleaned },
  ];

  const scaleMap = {
    LARGE: { label: 'Grande Porte', desc: 'Entulho / Caçamba' },
    MEDIUM: { label: 'Médio Porte', desc: 'Móveis / Eletrodomésticos' },
    SMALL: { label: 'Pequeno Porte', desc: 'Sacos de Lixo' },
  }[details.dominant_scale] || { label: details.dominant_scale, desc: '' };

  const handleShare = async () => {
    const shareData = {
      title: `EcoCidadão - Protocolo ${details.protocol_code}`,
      text: isCleaned
        ? `Boa notícia! O ponto de descarte irregular em ${details.address_reference || 'nosso bairro'} já foi limpo pela prefeitura!`
        : `Acompanhe a limpeza deste ponto de descarte irregular em ${details.address_reference || 'nosso bairro'} no EcoCidadão. Já somos ${details.confirmations_count} moradores unidos!`,
      url: typeof window !== 'undefined' ? window.location.href : '',
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // Usuário cancelou compartilhamento nativo
      }
    }

    // Fallback para cópia de link
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4 animate-in fade-in duration-200">
      
      {/* CARD PRINCIPAL */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-lg space-y-5 text-zinc-900 dark:text-zinc-100 transition-colors">
        
        {/* Cabeçalho do Protocolo */}
        <div className="flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider font-semibold text-zinc-400 block">
              Protocolo Oficial de Zeladoria
            </span>
            <h2 className="text-xl font-bold font-mono text-zinc-900 dark:text-white mt-0.5 tracking-tight">
              {details.protocol_code}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="truncate max-w-[240px]">
                {details.address_reference || 'Local georreferenciado via GPS'}
              </span>
            </div>
          </div>

          {/* Status Badge */}
          {isCleaned ? (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Limpo
            </span>
          ) : isInRoute ? (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30">
              Em Rota
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              Aberto
            </span>
          )}
        </div>

        {/* STEPPER / LINHA DO TEMPO */}
        <div>
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-3 font-mono">
            Progresso do Atendimento
          </span>
          <div className="grid grid-cols-4 gap-1 relative">
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center text-center">
                {/* Círculo do Step */}
                <div 
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all mb-1.5 ${
                    step.done
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : step.active
                      ? 'bg-amber-500 text-amber-950 font-bold'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {step.done ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.id}
                </div>
                {/* Nome do Step */}
                <span className={`text-[10px] font-semibold tracking-tight ${
                  step.active ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400'
                }`}>
                  {step.title}
                </span>
                <span className="text-[8px] text-zinc-400 line-clamp-1 mt-0.5">
                  {step.desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CARROSSEL ANTES VS DEPOIS */}
        <div className="pt-1">
          <BeforeAfterSlider
            beforePhotoUrl={details.sample_photo_url}
            afterPhotoUrl={details.cleaned_photo_url}
            protocolCode={details.protocol_code}
            cleanedAt={details.cleaned_at}
            firstReportedAt={details.first_reported_at}
            isCleaned={isCleaned}
          />
        </div>

        {/* PROVA SOCIAL & METADADOS DA CIÊNCIA CIDADÃ */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
          {/* Card Moradores Unidos */}
          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/80 dark:border-zinc-800/80 flex flex-col justify-between">
            <span className="text-[10px] text-zinc-400 font-mono uppercase">Voz Popular</span>
            <div className="flex items-center space-x-1.5 mt-1">
              <Flame className="w-4 h-4 text-emerald-500" />
              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                {details.confirmations_count} {details.confirmations_count === 1 ? 'vizinho' : 'vizinhos'}
              </span>
            </div>
            <span className="text-[9px] text-zinc-500 mt-0.5 font-mono">Unificados em 25m</span>
          </div>

          {/* Card Porte & Risco */}
          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/80 dark:border-zinc-800/80 flex flex-col justify-between">
            <span className="text-[10px] text-zinc-400 font-mono uppercase">Classificação</span>
            <div className="flex items-center space-x-1 mt-1 truncate">
              {details.is_eco_critical && <Droplets className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
              <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                {scaleMap.label}
              </span>
            </div>
            <span className="text-[9px] text-zinc-500 mt-0.5 truncate font-mono">
              {details.waste_tags?.length ? `#${details.waste_tags[0]}` : 'Resíduo Sólido'}
            </span>
          </div>
        </div>

        {/* BOTÃO COMPARTILHAR COM VIZINHOS */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleShare}
            className="w-full py-3 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Share2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{copied ? 'Link Copiado para a Área de Transferência!' : 'Compartilhar Atualização com o Bairro'}</span>
          </button>
        </div>
      </div>

      {/* AÇÕES DE NAVEGAÇÃO INFERIOR */}
      <div className="flex items-center justify-between px-2 text-xs">
        {onNewSearch && (
          <button
            type="button"
            onClick={onNewSearch}
            className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1 font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Consultar outro protocolo</span>
          </button>
        )}

        <Link
          href="/"
          className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold ml-auto"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Mapear novo descarte</span>
        </Link>
      </div>

      {/* GARANTIA DE TRANSPARÊNCIA */}
      <div className="text-center pt-2">
        <p className="text-[11px] text-zinc-400 flex items-center justify-center gap-1 font-mono">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          <span>Ciência Cidadã Aberta · Dados auditáveis da zeladoria pública</span>
        </p>
      </div>
    </div>
  );
}
