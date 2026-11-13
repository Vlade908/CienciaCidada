'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Building2, 
  MapPin, 
  RefreshCw, 
  Smartphone, 
  Database,
  Layers,
  ChevronRight
} from 'lucide-react';

interface AdminHeaderProps {
  municipalityName?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  totalClusters?: number;
}

export function AdminHeader({
  municipalityName = 'São Paulo - SP (Piloto Universitário)',
  onRefresh,
  isRefreshing = false,
  totalClusters = 0,
}: AdminHeaderProps) {
  return (
    <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-30 select-none">
      {/* Lado Esquerdo: Identidade do Sistema & Tenant Municipal */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Layers className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm tracking-tight text-zinc-100">
                EcoCidadão
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono tracking-wider font-semibold rounded bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                B2G COMMAND
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 flex items-center gap-1">
              Central de Inteligência Geoespacial
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

        {/* Identificador do Município/Tenant */}
        <div className="hidden sm:flex items-center space-x-1.5 text-xs text-zinc-300 bg-zinc-900/80 px-2.5 py-1 rounded-md border border-zinc-800">
          <Building2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-medium text-zinc-200">{municipalityName}</span>
        </div>
      </div>

      {/* Lado Direito: Telemetria de Banco, Atualização e Atalho Cidadão */}
      <div className="flex items-center space-x-3">
        {/* Status de Conexão com Supabase PostGIS */}
        <div className="hidden md:flex items-center space-x-2 px-2.5 py-1 bg-zinc-900/60 rounded-md border border-zinc-800/80 text-xs text-zinc-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Database className="w-3.5 h-3.5 text-zinc-500" />
          <span className="font-mono text-[11px] text-zinc-300">PostGIS 16 (Deduplicando)</span>
        </div>

        {/* Botão de Atualização Live */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-2.5 py-1 text-xs rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 transition-colors disabled:opacity-50"
            title="Atualizar dados do mapa"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        )}

        {/* Link para o PWA do Cidadão (Demo ao vivo) */}
        <Link
          href="/"
          target="_blank"
          className="flex items-center space-x-1.5 px-3 py-1 text-xs rounded-md bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 transition-colors font-medium"
          title="Abrir aplicativo mobile do cidadão em nova aba"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">App Cidadão</span>
          <ChevronRight className="w-3 h-3 text-emerald-400" />
        </Link>
      </div>
    </header>
  );
}
