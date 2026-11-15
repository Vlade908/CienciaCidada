'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  Moon,
  LogOut
} from 'lucide-react';

interface AdminHeaderProps {
  municipalityName?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  totalClusters?: number;
}

export function AdminHeader({
  municipalityName = 'PMSP / DSP-SLU • Zeladoria Urbana',
  onRefresh,
  isRefreshing = false,
  totalClusters,
}: AdminHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isDashboardActive = pathname === '/admin';
  const isMapActive = pathname.startsWith('/admin/map');

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
      router.replace('/admin/login');
      router.refresh();
    } catch (err) {
      console.error('Erro ao encerrar sessão:', err);
      window.location.href = '/admin/login';
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="h-14 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 px-4 md:px-6 flex items-center justify-between shrink-0 z-30 select-none transition-colors">
      {/* Lado Esquerdo: Identidade do Sistema & Navegação Institucional */}
      <div className="flex items-center gap-4 md:gap-6">
        <Link href="/admin" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded bg-emerald-600 flex items-center justify-center text-white font-bold text-xs shadow-xs group-hover:scale-105 transition-transform">
            EC
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-[15px] tracking-tight text-slate-900 dark:text-zinc-100">
              EcoCidadão
            </span>
            <span className="hidden sm:inline text-[11px] text-slate-400 dark:text-zinc-500 font-medium tracking-wide">
              {municipalityName}
            </span>
          </div>
        </Link>

        <div className="h-4 w-px bg-slate-200 dark:bg-zinc-800 hidden md:block" />

        {/* Abas Principais: Ordens & Indicadores vs. Mapa Geoespacial */}
        <nav className="flex items-center gap-1">
          <Link
            href="/admin"
            className={`px-3 py-1.5 text-xs rounded transition-colors flex items-center gap-1.5 ${
              isDashboardActive
                ? 'font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100'
                : 'font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-900'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Ordens &amp; Indicadores</span>
          </Link>

          <Link
            href="/admin/map"
            className={`px-3 py-1.5 text-xs rounded transition-colors flex items-center gap-1.5 ${
              isMapActive
                ? 'font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100'
                : 'font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-900'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Mapa Geoespacial</span>
            {typeof totalClusters === 'number' && (
              <span className="text-[10px] bg-slate-200/80 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full font-mono text-slate-700 dark:text-zinc-300">
                {totalClusters} focos
              </span>
            )}
          </Link>
        </nav>
      </div>

      {/* Lado Direito: Telemetria Live, Tema, Atualização e Ações */}
      <div className="flex items-center gap-3 md:gap-4 text-xs">
        {/* Status de Sincronização PostGIS Live */}
        <div className="hidden lg:flex items-center gap-1.5 text-slate-500 dark:text-zinc-400 font-mono text-[11px]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>PostGIS Live</span>
        </div>

        {/* Botão Sincronizar */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-800 transition-colors disabled:opacity-50"
            title="Sincronizar com banco de dados"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 dark:text-zinc-400 ${isRefreshing ? 'animate-spin text-emerald-600 dark:text-emerald-400' : ''}`} />
            <span className="hidden sm:inline font-medium">Sincronizar</span>
          </button>
        )}

        {/* Alternador de Tema Claro / Escuro */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-7 h-7 rounded bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 transition-colors"
          title={theme === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
          aria-label="Alternar Tema"
        >
          {theme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-slate-600" />
          )}
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-zinc-800 hidden sm:block" />

        {/* Atalho App Cidadão */}
        <Link
          href="/"
          target="_blank"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25 transition-colors font-medium"
          title="Abrir aplicativo mobile do cidadão"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>App Cidadão</span>
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded text-slate-600 dark:text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors font-medium disabled:opacity-50"
          title="Encerrar sessão administrativa"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Sair</span>
        </button>
      </div>
    </header>
  );
}
