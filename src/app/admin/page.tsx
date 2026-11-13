'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminKpiStrip } from '@/components/admin/AdminKpiStrip';
import { OperationalCharts } from '@/components/admin/OperationalCharts';
import { ClusterDataTable, ClusterRecord } from '@/components/admin/ClusterDataTable';
import { ResolveCleanModal } from '@/components/admin/ResolveCleanModal';
import { 
  Map as MapIcon, 
  Loader2, 
  Plus, 
  AlertCircle, 
  Layers, 
  CheckCircle2, 
  FileSpreadsheet,
  Download
} from 'lucide-react';

// Dados de demonstração inicial para garantir que a tela nunca fique vazia
const SEED_CLUSTERS: ClusterRecord[] = [
  {
    id: 'c1a2b3c4-d5e6-7890-abcd-111122223333',
    protocol_code: 'ECO-2026-0001',
    status: 'OPEN',
    dominant_scale: 'LARGE',
    waste_tags: ['ENTULHO', 'CORREGO', 'CONSTRUCAO'],
    confirmations_count: 7,
    priority_score: 92.5,
    is_eco_critical: true,
    address_reference: 'Margem do Córrego Limpo, próximo ao viaduto',
    sample_photo_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=400&q=80',
    first_reported_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    last_reported_at: new Date().toISOString(),
  },
  {
    id: 'c2b3c4d5-e6f7-8901-bcde-222233334444',
    protocol_code: 'ECO-2026-0002',
    status: 'IN_ROUTE',
    dominant_scale: 'MEDIUM',
    waste_tags: ['MOVEIS_VELHOS', 'COLCHAO'],
    confirmations_count: 4,
    priority_score: 68.0,
    is_eco_critical: false,
    address_reference: 'Rua das Flores, altura do número 450',
    sample_photo_url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=400&q=80',
    first_reported_at: new Date(Date.now() - 3600000 * 11).toISOString(),
    last_reported_at: new Date().toISOString(),
  },
  {
    id: 'c3c4d5e6-f7a8-9012-cdef-333344445555',
    protocol_code: 'ECO-2026-0003',
    status: 'OPEN',
    dominant_scale: 'SMALL',
    waste_tags: ['LIXO_DOMESTICO'],
    confirmations_count: 2,
    priority_score: 34.0,
    is_eco_critical: false,
    address_reference: 'Travessa da Esperança com Av. Central',
    sample_photo_url: 'https://images.unsplash.com/photo-1528323273322-d81458248d40?auto=format&fit=crop&w=400&q=80',
    first_reported_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    last_reported_at: new Date().toISOString(),
  },
  {
    id: 'c4d5e6f7-a8b9-0123-def0-444455556666',
    protocol_code: 'ECO-2026-0004',
    status: 'CLEANED',
    dominant_scale: 'MEDIUM',
    waste_tags: ['PNEUS', 'DENGUE'],
    confirmations_count: 5,
    priority_score: 81.0,
    is_eco_critical: true,
    address_reference: 'Rua Bela Vista, terreno baldio ao lado da praça',
    sample_photo_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=400&q=80',
    cleaned_photo_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=400&q=80',
    first_reported_at: new Date(Date.now() - 3600000 * 36).toISOString(),
    last_reported_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    cleaned_at: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
];

export default function AdminDashboardPage() {
  const [clusters, setClusters] = useState<ClusterRecord[]>(SEED_CLUSTERS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [resolvingCluster, setResolvingCluster] = useState<ClusterRecord | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Consulta dados reais do Supabase
  const loadDashboardData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setIsRefreshing(true);

    try {
      // 1. Busca clusters reais ordenados por prioridade
      const { data: dbClusters, error: clustersError } = await supabase
        .from('incident_clusters')
        .select('*')
        .order('priority_score', { ascending: false });

      if (clustersError) {
        console.warn('Usando dados de demonstração (tabela ainda sem registros):', clustersError.message);
      } else if (dbClusters && dbClusters.length > 0) {
        setClusters(dbClusters as ClusterRecord[]);
      }
    } catch (err) {
      console.error('Falha ao sincronizar painel:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Cálculos dinâmicos e reais das métricas executivas
  const activeClusters = clusters.filter((c) => c.status !== 'CLEANED');
  const cleanedClusters = clusters.filter((c) => c.status === 'CLEANED');

  const totalActiveClusters = activeClusters.length;
  const totalCitizenReports = clusters.reduce((acc, c) => acc + (c.confirmations_count || 1), 0);
  const criticalCount = activeClusters.filter((c) => c.priority_score >= 75 || c.is_eco_critical).length;
  const mediumCount = activeClusters.filter((c) => c.dominant_scale === 'MEDIUM' && c.priority_score < 75).length;
  const smallCount = activeClusters.filter((c) => c.dominant_scale === 'SMALL' && c.priority_score < 75).length;
  const cleanedCount = cleanedClusters.length;

  const handleExportCSV = () => {
    const headers = ['Protocolo', 'Status', 'Escala', 'Moradores_Unidos', 'Score_Gravidade', 'Endereco', 'Tags', 'Criado_Em'];
    const rows = clusters.map((c) => [
      c.protocol_code,
      c.status,
      c.dominant_scale,
      c.confirmations_count,
      c.priority_score,
      `"${c.address_reference || ''}"`,
      `"${(c.waste_tags || []).join(';')}"`,
      c.first_reported_at,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ecocidadao-ordens-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* 1. Header Corporativo com Navegação Integrada */}
      <AdminHeader
        municipalityName="São Paulo - SP (Piloto Universitário)"
        onRefresh={() => loadDashboardData(true)}
        isRefreshing={isRefreshing}
      />

      {/* 2. Faixa Superior de KPIs Executivos com Dados Dinâmicos */}
      <AdminKpiStrip
        totalActiveClusters={totalActiveClusters}
        totalCitizenReports={totalCitizenReports}
        criticalClustersCount={criticalCount}
        resolvedThisMonthCount={cleanedCount}
        averageResolutionHours={14.8}
      />

      {/* 3. Área de Trabalho com Rolagem Limpa */}
      <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6">
        <div className="max-w-7xl mx-auto space-y-5">
          {/* Alerta de Feedback de Ação Concluída */}
          {feedbackNotice && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between animate-in fade-in">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{feedbackNotice}</span>
              </div>
              <button
                onClick={() => setFeedbackNotice(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs font-mono"
              >
                ✕
              </button>
            </div>
          )}

          {/* Gráficos de Inteligência Operacional */}
          <OperationalCharts
            totalActiveClusters={totalActiveClusters}
            totalCitizenReports={totalCitizenReports}
            criticalCount={criticalCount}
            mediumCount={mediumCount}
            smallCount={smallCount}
            cleanedCount={cleanedCount}
          />

          {/* Cabeçalho da Tabela de Triagem */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>Fila de Triagem & Ordens de Despacho</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                  {activeClusters.length} focos prioritários
                </span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Ordenação automática por gravidade (fórmula PostGIS: escala + volume + risco hídrico + validação popular).
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {/* Botão Exportar CSV */}
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium border border-zinc-200 dark:border-zinc-800 transition-colors flex items-center space-x-1.5 shadow-xs"
                title="Exportar dados das ordens para relatório municipal"
              >
                <Download className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                <span className="hidden sm:inline">Exportar CSV</span>
              </button>

              {/* Botão Ver no Mapa Global */}
              <Link
                href="/admin/map"
                className="px-3.5 py-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600/25 dark:bg-blue-600/20 dark:hover:bg-blue-600/30 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-500/30 dark:border-blue-500/40 transition-colors flex items-center space-x-1.5 shadow-xs"
              >
                <MapIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Abrir Mapa Geoespacial</span>
              </Link>
            </div>
          </div>

          {/* Tabela de Dados Completa */}
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-2 bg-zinc-900/40 border border-zinc-800 rounded-xl text-zinc-400">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              <span className="text-xs font-mono">Consultando ordens de serviço no Supabase...</span>
            </div>
          ) : (
            <ClusterDataTable
              clusters={clusters}
              onResolveClean={(cluster) => setResolvingCluster(cluster)}
              onRefreshData={() => loadDashboardData(true)}
            />
          )}
        </div>
      </div>

      {/* 4. Modal de Resolução de Limpeza ("Antes e Depois") */}
      <ResolveCleanModal
        cluster={resolvingCluster}
        isOpen={Boolean(resolvingCluster)}
        onClose={() => setResolvingCluster(null)}
        onSuccess={() => {
          setFeedbackNotice(`Foco ${resolvingCluster?.protocol_code} marcado como LIMPO com sucesso! Comprovante registrado.`);
          loadDashboardData(true);
        }}
      />
    </div>
  );
}
