"use client";

import { useCallback, useRef, useState } from "react";

interface InlineDropzoneProps {
  onFileSelect: (file: File) => void;
  acceptedFormats: string[];
  isLoading?: boolean;
}

export function InlineDropzone({
  onFileSelect,
  acceptedFormats,
  isLoading = false,
}: InlineDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatLabels: Record<string, string> = {
    ".csv": "CSV",
    ".zip": "ZIP",
    ".xlsx": "XLSX",
    ".xls": "XLS",
  };

  const validateFile = useCallback(
    (file: File): boolean => {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!acceptedFormats.includes(ext)) {
        setError(
          `Formato invalido. Aceitos: ${acceptedFormats
            .map((f) => formatLabels[f] || f)
            .join(", ")}`
        );
        return false;
      }
      setError(null);
      return true;
    },
    [acceptedFormats]
  );

  const handleFile = useCallback(
    (file: File) => {
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [validateFile, onFileSelect]
  );

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
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 py-6 rounded-xl bg-calma-surface-alt">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-calma-primary border-t-transparent" />
        <span className="text-sm text-calma-text-secondary">
          Processando...
        </span>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6
          transition-all duration-200
          ${
            isDragging
              ? "border-calma-accent bg-calma-accent-10"
              : selectedFile
              ? "border-green-300 bg-green-50"
              : "border-calma-border bg-calma-surface-alt hover:border-calma-accent/50 hover:bg-calma-accent-10/50"
          }
        `}
      >
        <span
          className={`material-symbols-outlined text-3xl ${
            selectedFile ? "text-green-600" : "text-calma-text-muted"
          }`}
        >
          {selectedFile ? "check_circle" : "cloud_upload"}
        </span>

        {selectedFile ? (
          <div className="text-center">
            <p className="text-sm font-medium text-calma-text">
              {selectedFile.name}
            </p>
            <p className="text-xs text-calma-text-muted">
              {formatSize(selectedFile.size)}
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm font-medium text-calma-text-secondary">
              Arraste o arquivo ou toque para selecionar
            </p>
            <p className="text-xs text-calma-text-muted mt-1">
              Formatos:{" "}
              {acceptedFormats.map((f) => formatLabels[f] || f).join(", ")}
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">warning</span>
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={acceptedFormats.join(",")}
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}
