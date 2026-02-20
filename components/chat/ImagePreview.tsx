"use client";

import { useState, useEffect } from "react";

// ========================================
// IMAGE PREVIEW - Preview de imagem antes de enviar
// ========================================
// Mostra a imagem selecionada com opção de remover ou enviar
// Usado no chat para confirmar foto de refeição

interface ImagePreviewProps {
  /** Arquivo de imagem selecionado */
  file: File;
  /** Callback para remover a imagem */
  onRemove: () => void;
  /** Callback para enviar a imagem */
  onSend: () => void;
  /** Se está processando (enviando/analisando) */
  isLoading?: boolean;
  /** Mensagem de loading personalizada */
  loadingMessage?: string;
}

export function ImagePreview({
  file,
  onRemove,
  onSend,
  isLoading = false,
  loadingMessage = "Analisando imagem...",
}: ImagePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Cria URL de preview quando o arquivo muda
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Limpa a URL quando o componente é desmontado
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  if (!previewUrl) {
    return null;
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-border-subtle bg-surface-card">
      {/* Imagem */}
      <div className="relative aspect-[4/3] max-h-[300px]">
        <img
          src={previewUrl}
          alt="Preview da imagem"
          className="w-full h-full object-cover"
        />

        {/* Overlay de loading */}
        {isLoading && (
          <div className="absolute inset-0 bg-background-dark/80 flex flex-col items-center justify-center gap-3">
            {/* Spinner */}
            <svg
              className="animate-spin size-8 text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-white text-sm font-medium">
              {loadingMessage}
            </span>
          </div>
        )}
      </div>

      {/* Barra de ações */}
      <div className="flex items-center justify-between p-3 bg-surface-dark">
        <div className="flex items-center gap-2 text-text-secondary text-sm">
          <span className="material-symbols-outlined text-[18px]">
            image
          </span>
          <span>Foto para análise</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão remover */}
          <button
            onClick={onRemove}
            disabled={isLoading}
            className="flex items-center justify-center size-10 rounded-full bg-surface-card text-text-secondary hover:text-white hover:bg-error/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Remover imagem"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>

          {/* Botão enviar */}
          <button
            onClick={onSend}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
            <span>Analisar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
