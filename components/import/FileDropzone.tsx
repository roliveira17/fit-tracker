"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, X, AlertCircle } from "lucide-react";

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  acceptedFormats: string[];
  isLoading?: boolean;
}

/**
 * Componente FileDropzone - Área de upload de arquivos
 * Suporta drag & drop e seleção manual
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
      setError(`Formato não suportado. Use: ${acceptedFormats.join(", ")}`);
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

  return (
    <div className="w-full">
      {/* Dropzone area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-xl border-2 border-dashed p-8 transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : selectedFile
              ? "border-green-500 bg-green-500/5"
              : "border-border hover:border-muted-foreground"
        } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
      >
        {selectedFile ? (
          // Arquivo selecionado
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              {!isLoading && (
                <button
                  onClick={clearFile}
                  className="p-1 rounded-full hover:bg-muted"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
            {isLoading && (
              <p className="text-sm text-muted-foreground">Processando...</p>
            )}
          </div>
        ) : (
          // Estado inicial
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-muted p-4">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Arraste o arquivo aqui
              </p>
              <p className="text-xs text-muted-foreground mt-1">ou</p>
            </div>
            <label className="cursor-pointer rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Selecionar arquivo
              <input
                type="file"
                className="hidden"
                accept={acceptedFormats.join(",")}
                onChange={handleFileInput}
              />
            </label>
            <p className="text-xs text-muted-foreground">
              Formatos aceitos: {acceptedFormats.join(", ")}
            </p>
          </div>
        )}
      </div>

      {/* Erro */}
      {error && (
        <div className="flex items-center gap-2 mt-3 text-red-500">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
