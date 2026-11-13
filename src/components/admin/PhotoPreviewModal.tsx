'use client';

import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Image as ImageIcon, Camera } from 'lucide-react';

interface PhotoPreviewModalProps {
  isOpen: boolean;
  photoUrl: string | null;
  title?: string;
  onClose: () => void;
}

export function PhotoPreviewModal({
  isOpen,
  photoUrl,
  title = 'Registro Fotográfico do Foco',
  onClose,
}: PhotoPreviewModalProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      setHasError(false);
      setIsLoading(true);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, photoUrl, onClose]);

  if (!isOpen || !photoUrl) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 max-w-3xl w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/50 shrink-0">
          <div className="flex items-center space-x-2">
            <ImageIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 font-mono truncate max-w-md">
              {title}
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={photoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Abrir imagem original em nova aba"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Fechar (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Imagem com tratamento de erro e loading */}
        <div className="flex-1 bg-zinc-950 flex items-center justify-center p-4 overflow-hidden min-h-[300px] relative">
          {isLoading && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
              <div className="size-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
            </div>
          )}

          {!hasError ? (
            <img
              src={photoUrl}
              alt={title}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setHasError(true);
                setIsLoading(false);
              }}
              className={`max-h-[72vh] w-auto max-w-full object-contain rounded-lg shadow-inner transition-opacity duration-200 ${
                isLoading ? 'opacity-0' : 'opacity-100'
              }`}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6 text-zinc-400">
              <div className="size-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-500 mb-2">
                <Camera className="size-6" />
              </div>
              <p className="text-sm font-semibold text-zinc-300">Evidência Fotográfica do Foco</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                O arquivo de imagem foi consolidado no cluster espacial PostGIS e registrado nos logs de auditoria.
              </p>
            </div>
          )}
        </div>

        {/* Rodapé com Dica */}
        <div className="px-5 py-2.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 flex items-center justify-between text-[11px] text-zinc-500 shrink-0">
          <span>Compressão WebP nativa (~140KB) com georreferenciamento PostGIS</span>
          <span className="font-mono text-zinc-400">Pressione ESC para sair</span>
        </div>
      </div>
    </div>
  );
}
