"use client";

import { useCallback, useState } from "react";

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  acceptedFormats: string[];
  isLoading?: boolean;
}

/**
 * Componente FileDropzone - Area de upload de arquivos
 * Suporta drag & drop e selecao manual
 */
export function FileDropzone({
  onFileSelect,
  acceptedFormats,
  isLoading = false,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    const isValid = acceptedFormats.some(
      (format) => format.toLowerCase() === `.${extension}`
    );

    if (!isValid) {
      setError(`Formato nao suportado. Use: ${acceptedFormats.join(", ")}`);
      return false;
    }

    setError(null);
    return true;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [onFileSelect, acceptedFormats]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [onFileSelect, acceptedFormats]
  );

  const clearFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  const dropzoneClass = [
    "group relative flex flex-col items-center gap-6 rounded-2xl border-2 border-dashed px-6 py-12 transition-all duration-300",
    "border-border-subtle hover:border-primary hover:bg-primary/5",
    isDragging ? "border-primary bg-primary/5" : "",
    selectedFile ? "border-success bg-success/10" : "",
    isLoading ? "pointer-events-none opacity-60" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={dropzoneClass}
      >
        {!selectedFile && (
          <>
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative flex size-20 items-center justify-center rounded-full bg-icon-bg transition-transform duration-300 group-hover:scale-110">
                <span className="material-symbols-outlined text-[36px] text-primary">
                  cloud_upload
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-lg font-bold leading-tight tracking-tight text-white">
                Arraste seu arquivo
              </p>
              <p className="text-sm leading-relaxed text-text-secondary">
                Suportamos exportacoes do{" "}
                <span className="font-medium text-primary">Hevy (.csv)</span> ou{" "}
                <span className="font-medium text-primary">
                  Apple Health (.zip)
                </span>
              </p>
            </div>

            <label className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 sm:w-auto sm:px-8">
              <span className="material-symbols-outlined mr-2 text-[20px]">
                folder_open
              </span>
              Buscar nos arquivos
              <input
                type="file"
                className="hidden"
                accept={acceptedFormats.join(",")}
                onChange={handleFileInput}
              />
            </label>
            <p className="text-xs text-text-secondary">
              Formatos aceitos: {acceptedFormats.join(", ")}
            </p>
          </>
        )}

        {selectedFile && (
          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-lg bg-icon-bg text-primary">
                <span className="material-symbols-outlined text-[24px]">
                  description
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-text-secondary">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            {!isLoading && (
              <button
                onClick={clearFile}
                className="flex size-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-white/10 hover:text-white"
              >
                <span className="material-symbols-outlined text-[18px]">
                  close
                </span>
              </button>
            )}
            {isLoading && (
              <span className="text-sm font-medium text-text-secondary">
                Processando...
              </span>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-error">
          <span className="material-symbols-outlined text-[18px]">
            warning
          </span>
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
