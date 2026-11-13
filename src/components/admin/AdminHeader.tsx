'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Building2, 
  RefreshCw, 
  Smartphone, 
  Database,
  Layers,
  LayoutDashboard,
  Map as MapIcon
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
}: AdminHeaderProps) {
  const pathname = usePathname();
  const isDashboardActive = pathname === '/admin';
  const isMapActive = pathname.startsWith('/admin/map');

  return (
    <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-30 select-none">
      {/* Lado Esquerdo: Identidade do Sistema & Navegação entre Painel e Mapa */}
      <div className="flex items-center space-x-4">
        {/* Logo & Marca B2G */}
        <Link href="/admin" className="flex items-center space-x-2 group">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
            <Layers className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm tracking-tight text-zinc-100">
                EcoCidadão
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-mono tracking-wider font-semibold rounded bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                B2G COMMAND
              </span>
            </div>
            <span className="text-[10px] text-zinc-400">
              Operações de Limpeza Urbana
            </span>
          </div>
        </Link>

        <div className="h-5 w-px bg-zinc-800 hidden md:block" />

        {/* Abas Principais: Painel Operacional vs Mapa */}
        <nav className="flex items-center space-x-1 bg-zinc-900/90 p-1 rounded-lg border border-zinc-800">
          <Link
            href="/admin"
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              isDashboardActive
                ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ordens & Indicadores</span>
          </Link>

          <Link
            href="/admin/map"
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              isMapActive
                ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5 text-blue-400" />
            <span>Mapa Geoespacial</span>
          </Link>
        </nav>

        {/* Identificador do Município/Tenant */}
        <div className="hidden lg:flex items-center space-x-1.5 text-xs text-zinc-400 bg-zinc-900/60 px-2.5 py-1 rounded-md border border-zinc-800/80">
          <Building2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-medium text-zinc-300">{municipalityName}</span>
        </div>
      </div>

      {/* Lado Direito: Status de Banco, Atualização e Atalho App Cidadão */}
      <div className="flex items-center space-x-3">
        {/* Status de Conexão com Supabase PostGIS */}
        <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 bg-zinc-900/60 rounded-md border border-zinc-800/80 text-xs text-zinc-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Database className="w-3.5 h-3.5 text-zinc-500" />
          <span className="font-mono text-[11px] text-zinc-300">PostGIS Live</span>
        </div>

        {/* Botão de Atualização Live */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-2.5 py-1 text-xs rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 transition-colors disabled:opacity-50"
            title="Sincronizar com banco de dados"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden md:inline">Sincronizar</span>
          </button>
        )}

        {/* Atalho para o App Mobile do Cidadão */}
        <Link
          href="/"
          target="_blank"
          className="flex items-center space-x-1.5 px-3 py-1 text-xs rounded-md bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 transition-colors font-medium"
          title="Abrir aplicativo do cidadão para registrar denúncia de teste"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Testar App Cidadão</span>
        </Link>
      </div>
    </header>
  );
}
