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
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-700 dark:selection:text-emerald-200 transition-colors">
      {children}
    </div>
  );
}
