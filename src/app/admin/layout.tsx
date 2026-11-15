import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Central de Comando B2G | EcoCidadão',
  description: 'Painel de Gestão Geoespacial e Monitoramento de Resíduos Urbanos',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 antialiased selection:bg-emerald-500/20 selection:text-emerald-800 dark:selection:text-emerald-300 transition-colors">
      {children}
    </div>
  );
}
