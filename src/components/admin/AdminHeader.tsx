'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { 
  Building2, 
  RefreshCw, 
  Smartphone, 
  Database,
  Layers,
  LayoutDashboard,
  Map as MapIcon,
  Sun,
  Moon
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
  const { theme, toggleTheme } = useTheme();
  const isDashboardActive = pathname === '/admin';
  const isMapActive = pathname.startsWith('/admin/map');

  return (
    <header className="h-14 border-b border-stone-200 dark:border-zinc-800/80 bg-[#f8faf7]/95 dark:bg-zinc-950/95 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-30 select-none transition-colors">
      {/* Lado Esquerdo: Identidade do Sistema & Navegação entre Painel e Mapa */}
      <div className="flex items-center space-x-4">
        {/* Logo & Marca B2G */}
        <Link href="/admin" className="flex items-center space-x-2 group">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 group-hover:scale-105 transition-transform">
            <Layers className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm tracking-tight text-stone-900 dark:text-zinc-100">
                EcoCidadão
              </span>
              <span className="px-1.5 py-0.5 text-[9px] font-mono tracking-wider font-semibold rounded bg-[#eaece7] dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 border border-stone-300/80 dark:border-zinc-700/50">
                B2G COMMAND
              </span>
            </div>
            <span className="text-[10px] text-stone-500 dark:text-zinc-400">
              Operações de Limpeza Urbana
            </span>
          </div>
        </Link>

        <div className="h-5 w-px bg-stone-300/70 dark:bg-zinc-800 hidden md:block" />

        {/* Abas Principais: Painel Operacional vs Mapa */}
        <nav className="flex items-center space-x-1 bg-[#eaece7] dark:bg-zinc-900/90 p-1 rounded-lg border border-stone-300/70 dark:border-zinc-800">
          <Link
            href="/admin"
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              isDashboardActive
                ? 'bg-[#fdfdfc] dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 shadow-xs border border-stone-300/80 dark:border-zinc-700/60'
                : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200 hover:bg-stone-200/50 dark:hover:bg-zinc-800/50'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Ordens & Indicadores</span>
          </Link>

          <Link
            href="/admin/map"
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
              isMapActive
                ? 'bg-[#fdfdfc] dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 shadow-xs border border-stone-300/80 dark:border-zinc-700/60'
                : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-200 hover:bg-stone-200/50 dark:hover:bg-zinc-800/50'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Mapa Geoespacial</span>
          </Link>
        </nav>

        {/* Identificador do Município/Tenant */}
        <div className="hidden lg:flex items-center space-x-1.5 text-xs text-stone-600 dark:text-zinc-400 bg-[#eaece7] dark:bg-zinc-900/60 px-2.5 py-1 rounded-md border border-stone-300/70 dark:border-zinc-800/80">
          <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium text-stone-800 dark:text-zinc-300">{municipalityName}</span>
        </div>
      </div>

      {/* Lado Direito: Alternador Claro/Escuro, Status de Banco, Atualização e App Cidadão */}
      <div className="flex items-center space-x-2.5">
        {/* Botão Alternador de Modo Claro / Escuro */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#eaece7] hover:bg-stone-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-stone-700 dark:text-zinc-300 border border-stone-300/80 dark:border-zinc-800 transition-colors"
          title={theme === 'dark' ? 'Alternar para Modo Claro (Papel & Ardósia)' : 'Alternar para Modo Escuro'}
          aria-label="Alternar Tema"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-stone-700" />
          )}
        </button>

        {/* Status de Conexão com Supabase PostGIS */}
        <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 bg-[#eaece7] dark:bg-zinc-900/60 rounded-md border border-stone-300/70 dark:border-zinc-800/80 text-xs text-stone-600 dark:text-zinc-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Database className="w-3.5 h-3.5 text-stone-400 dark:text-zinc-500" />
          <span className="font-mono text-[11px] text-stone-800 dark:text-zinc-300">PostGIS Live</span>
        </div>

        {/* Botão de Atualização Live */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-2.5 py-1 text-xs rounded-md bg-[#eaece7] hover:bg-stone-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-stone-800 dark:text-zinc-200 border border-stone-300/80 dark:border-zinc-700/60 transition-colors disabled:opacity-50"
            title="Sincronizar com banco de dados"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-stone-500 dark:text-zinc-400 ${isRefreshing ? 'animate-spin text-emerald-600 dark:text-emerald-400' : ''}`} />
            <span className="hidden md:inline font-medium">Sincronizar</span>
          </button>
        )}

        {/* Atalho para o App Mobile do Cidadão */}
        <Link
          href="/"
          target="_blank"
          className="flex items-center space-x-1.5 px-3 py-1 text-xs rounded-md bg-emerald-600/15 hover:bg-emerald-600/25 dark:bg-emerald-600/20 dark:hover:bg-emerald-600/30 text-emerald-800 dark:text-emerald-300 border border-emerald-600/25 dark:border-emerald-500/40 transition-colors font-medium"
          title="Abrir aplicativo do cidadão para registrar denúncia de teste"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">App Cidadão</span>
        </Link>
      </div>
    </header>
  );
}
