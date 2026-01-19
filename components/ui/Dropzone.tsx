"use client";

import { useCallback, useState } from "react";

// ========================================
// DROPZONE - Área de upload de arquivos
// ========================================
// Área de drag & drop para upload de arquivos
// Suporta Apple Health (.zip) e Hevy (.csv)

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  disabled?: boolean;
}

export function Dropzone({
  onFileSelect,
  accept = ".zip,.csv",
  disabled = false,
}: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [disabled, onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
      // Reset input para permitir selecionar o mesmo arquivo novamente
      e.target.value = "";
    },
    [onFileSelect]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        group relative flex flex-col items-center gap-6
        rounded-2xl border-2 border-dashed
        px-6 py-12
        transition-all duration-300
        ${
          isDragging
            ? "border-primary bg-primary/10"
            : "border-border-subtle hover:border-primary hover:bg-primary/5"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {/* Ícone com glow */}
      <div className="relative">
        <div
          className={`
            absolute inset-0 rounded-full bg-primary/20 blur-xl
            opacity-0 group-hover:opacity-100 transition-opacity duration-500
            ${isDragging ? "opacity-100" : ""}
          `}
        />
        <div
          className={`
            relative flex size-20 items-center justify-center rounded-full bg-icon-bg
            group-hover:scale-110 transition-transform duration-300
            ${isDragging ? "scale-110" : ""}
          `}
        >
          <span className="material-symbols-outlined text-[36px] text-primary">
            cloud_upload
          </span>
        </div>
      </div>

      {/* Texto */}
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-lg font-bold leading-tight tracking-tight text-white">
          Arraste seu arquivo
        </p>
        <p className="text-sm text-text-secondary max-w-[280px] leading-relaxed">
          Suportamos exportações do{" "}
          <span className="font-medium text-primary">Apple Health (.zip)</span>{" "}
          ou dados do{" "}
          <span className="font-medium text-primary">Hevy (.csv)</span>
        </p>
      </div>

      {/* Botão */}
      <label
        className={`
          flex items-center justify-center rounded-xl h-12 px-8
          bg-primary hover:bg-primary/90
          text-white text-sm font-bold
          shadow-lg shadow-primary/25
          transition-all w-full sm:w-auto
          ${disabled ? "pointer-events-none" : "cursor-pointer"}
        `}
      >
        <span className="material-symbols-outlined text-[20px] mr-2">
          folder_open
        </span>
        Buscar nos Arquivos
        <input
          type="file"
          accept={accept}
          onChange={handleFileInput}
          disabled={disabled}
          className="hidden"
        />
      </label>
    </div>
  );
}
