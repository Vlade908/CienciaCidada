'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  Layers, 
  Sparkles, 
  AlertCircle,
  Sun,
  Moon,
  ArrowLeft
} from 'lucide-react';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/admin';

  const { theme, toggleTheme } = useTheme();

  const [accessKey, setAccessKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const performLogin = async (keyToValidate: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessKey: keyToValidate }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Redireciona com replace para não manter a tela de login no histórico de volta
        router.replace(redirectTarget);
        router.refresh();
      } else {
        setErrorMessage(data.message || 'Chave de acesso inválida.');
      }
    } catch (err) {
      console.error('Erro ao autenticar:', err);
      setErrorMessage('Falha na conexão com o servidor. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessKey.trim()) return;
    performLogin(accessKey);
  };

  const handleQuickDemoAccess = () => {
    setAccessKey('admin123');
    performLogin('admin123');
  };

  return (
    <div className="min-h-dvh w-full flex flex-col justify-between bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors select-none">
      
      {/* HEADER SUPERIOR MINIMALISTA */}
      <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center space-x-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao App do Cidadão</span>
        </Link>

        {/* Alternador de Tema */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center transition-colors"
          title="Alternar tema claro / escuro"
          aria-label="Alternar Tema"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-zinc-700" />
          )}
        </button>
      </header>

      {/* ÁREA CENTRAL DO CARD */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 transition-all">
          
          {/* IDENTIDADE INSTITUCIONAL */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-1">
              <Layers className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div className="flex items-center justify-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                B2G COMMAND CENTER
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Portal do Gestor Municipal
            </h1>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
              Ambiente restrito a secretarias de obras, meio ambiente e concessionárias de limpeza pública.
            </p>
          </div>

          {/* ALERTA DE ERRO */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* FORMULÁRIO DE ENTRADA */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-zinc-400" />
                  Chave de Acesso Operacional
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">PIN / Senha</span>
              </label>

              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  placeholder="Digite sua chave de gestor..."
                  className="w-full pl-3.5 pr-10 py-3 text-sm font-mono bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-xs transition-all"
                  autoFocus
                />

                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
                  title={showKey ? 'Ocultar chave' : 'Exibir chave'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* BOTÃO PRINCIPAL DE LOGIN */}
            <button
              type="submit"
              disabled={isLoading || !accessKey.trim()}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validando credenciais...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Painel de Controle</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* DIVISOR CORPORATIVO */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-zinc-200 dark:border-zinc-800 w-full" />
            <span className="bg-white dark:bg-zinc-900 px-3 text-[10px] font-mono uppercase text-zinc-400 shrink-0">
              Ambiente de Demonstração
            </span>
          </div>

          {/* BOTÃO MÁGICO DE ACESSO DEMO (1 CLIQUE PARA BANCAS) */}
          <button
            type="button"
            onClick={handleQuickDemoAccess}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 text-zinc-800 dark:text-zinc-200 text-xs font-medium flex items-center justify-center gap-2 transition-colors group"
          >
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Acesso Rápido para Avaliadores (Demo 1-Clique)</span>
          </button>

          {/* GARANTIA DE SEGURANÇA */}
          <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 font-mono text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Sessão protegida por Edge Middleware</span>
          </div>

        </div>
      </main>

      {/* FOOTER INFORMATIVO */}
      <footer className="h-12 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 font-mono">
        <span>EcoCidadão B2G · Gestão Baseada em Evidências e Ciência Cidadã</span>
      </footer>

    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh w-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
          <span className="text-xs font-mono">Carregando portal de acesso...</span>
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
