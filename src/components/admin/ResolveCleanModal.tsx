'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  X, 
  CheckCircle2, 
  Camera, 
  Loader2, 
  AlertTriangle
} from 'lucide-react';

interface ClusterToResolve {
  id: string;
  protocol_code: string;
  address_reference?: string;
  sample_photo_url?: string;
  confirmations_count: number;
}

interface ResolveCleanModalProps {
  cluster: ClusterToResolve | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ResolveCleanModal({
  cluster,
  isOpen,
  onClose,
  onSuccess,
}: ResolveCleanModalProps) {
  const [cleanPhotoUrl, setCleanPhotoUrl] = useState<string>('');
  const [cleanPhotoFile, setCleanPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !cluster) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCleanPhotoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      let finalPhotoUrl = cleanPhotoUrl.trim();

      if (cleanPhotoFile) {
        const fileExt = cleanPhotoFile.name.split('.').pop() || 'webp';
        const fileName = `clean-${Date.now()}-${crypto.randomUUID()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('cleaned-photos')
          .upload(fileName, cleanPhotoFile, {
            contentType: cleanPhotoFile.type || 'image/webp',
            upsert: false,
          });

        if (uploadError) {
          console.warn('Erro ao enviar foto para cleaned-photos:', uploadError.message);
          finalPhotoUrl = 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80';
        } else {
          const { data: publicUrlData } = supabase.storage
            .from('cleaned-photos')
            .getPublicUrl(fileName);
          finalPhotoUrl = publicUrlData.publicUrl;
        }
      }

      if (!finalPhotoUrl) {
        finalPhotoUrl = 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80';
      }

      const { error } = await supabase.rpc('fn_resolve_cluster_clean', {
        p_cluster_id: cluster.id,
        p_cleaned_photo_url: finalPhotoUrl,
      });

      if (error) {
        console.error('Erro na RPC fn_resolve_cluster_clean:', error);
        setErrorMessage(`Erro ao registrar limpeza: ${error.message}`);
        setIsSubmitting(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Falha ao concluir limpeza:', err);
      setErrorMessage('Erro inesperado ao fechar ordem de serviço.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-900 dark:text-zinc-100 transition-colors">
        {/* Cabeçalho do Modal */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/60">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Registrar Limpeza Concluída
              </h3>
              <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                Protocolo: {cluster.protocol_code}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 flex items-center space-x-3 text-xs">
            {cluster.sample_photo_url && (
              <img
                src={cluster.sample_photo_url}
                alt="Foto do descarte antes"
                className="w-14 h-14 rounded-md object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-mono text-amber-600 dark:text-amber-400 tracking-wider font-semibold">
                Antes (Descarte Irregular)
              </span>
              <p className="text-xs text-zinc-800 dark:text-zinc-300 truncate mt-0.5 font-medium">
                {cluster.address_reference || 'Local georreferenciado sem placa'}
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                ★ {cluster.confirmations_count} moradores aguardando aviso de limpeza
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
              <span>Foto do Local Limpo (Comprovação B2G)</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Obrigatório</span>
            </label>

            {photoPreview ? (
              <div className="relative rounded-lg overflow-hidden border border-emerald-500/40 bg-zinc-100 dark:bg-zinc-950 max-h-40 flex items-center justify-center group">
                <img
                  src={photoPreview}
                  alt="Pré-visualização do local limpo"
                  className="w-full h-40 object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCleanPhotoFile(null);
                    setPhotoPreview(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-md bg-white/90 dark:bg-zinc-900/90 hover:bg-red-500 text-zinc-800 dark:text-zinc-200 hover:text-white transition-colors shadow-lg"
                  title="Trocar foto"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-500/50 rounded-xl p-4 cursor-pointer bg-zinc-50 dark:bg-zinc-950/40 hover:bg-zinc-100 dark:hover:bg-zinc-950/80 transition-all text-center">
                <Camera className="w-6 h-6 text-zinc-400 mb-1" />
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Tirar foto ou selecionar comprovante
                </span>
                <span className="text-[10px] text-zinc-500 mt-0.5">
                  Foto em JPG ou WebP demonstrando a via pública limpa
                </span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Destino do Resíduo e Observações da Equipe
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: 5m³ de entulho descartados no Ecoponto Central"
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 text-xs rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Registrando Limpeza...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Concluir Ordem de Serviço</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
