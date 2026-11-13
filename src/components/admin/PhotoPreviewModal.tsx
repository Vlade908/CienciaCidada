'use client';

import React, { useEffect } from 'react';
import { X, Download, ExternalLink, Image as ImageIcon } from 'lucide-react';

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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

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

        {/* Imagem */}
        <div className="flex-1 bg-zinc-950 flex items-center justify-center p-2 overflow-hidden">
          <img
            src={photoUrl}
            alt={title}
            className="max-h-[72vh] w-auto max-w-full object-contain rounded-lg shadow-inner"
          />
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
