"use client";

import { useState, KeyboardEvent, useEffect, useRef, useCallback } from "react";

// ========================================
// CHAT INPUT - Input do chat com IA
// ========================================
// Input arredondado com botão de microfone/envio
// Suporta gravação de áudio com indicador visual

// Estados de gravação
export type RecordingState =
  | "idle" // Normal - mostra mic ou send
  | "recording" // Gravando - mostra stop e timer
  | "processing" // Processando - mostra loading
  | "error"; // Erro - mostra mensagem

interface ChatInputProps {
  placeholder?: string;
  onSend: (message: string) => void;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  onCancelRecording?: () => void;
  onImageSelect?: (file: File) => void; // Callback para seleção de imagem
  disabled?: boolean;
  recordingState?: RecordingState;
  recordingDuration?: number; // Duração em segundos
  recordingError?: string;
  transcribedText?: string; // Texto transcrito para preencher o input
  showImageButton?: boolean; // Mostrar botão de foto (default: true)
}

export function ChatInput({
  placeholder = "Pergunte algo ao Fit IA...",
  onSend,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
  onImageSelect,
  disabled = false,
  recordingState = "idle",
  recordingDuration = 0,
  recordingError,
  transcribedText,
  showImageButton = true,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Ajusta altura do textarea automaticamente
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = Math.min(textarea.scrollHeight, 120); // Max 120px (~4 linhas)
      textarea.style.height = `${newHeight}px`;
    }
  }, []);

  // Atualiza o valor quando recebe texto transcrito
  useEffect(() => {
    if (transcribedText) {
      setValue(transcribedText);
      // Aguarda o próximo frame para ajustar altura
      requestAnimationFrame(adjustTextareaHeight);
    }
  }, [transcribedText, adjustTextareaHeight]);

  // Ajusta altura quando o valor muda
  useEffect(() => {
    adjustTextareaHeight();
  }, [value, adjustTextareaHeight]);

  // Handler para clique no botão de foto
  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Handler para seleção de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageSelect) {
      // Valida se é uma imagem
      if (!file.type.startsWith("image/")) {
        return;
      }
      onImageSelect(file);
    }
    // Limpa o input para permitir selecionar a mesma imagem novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend(value.trim());
      setValue("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Formata duração em MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const showSendButton = value.trim().length > 0;
  const isRecording = recordingState === "recording";
  const isProcessing = recordingState === "processing";

  // Durante gravação, mostra interface diferente
  if (isRecording) {
    return (
      <div className="flex items-center gap-3 w-full">
        {/* Botão cancelar */}
        <button
          onClick={onCancelRecording}
          className="flex shrink-0 items-center justify-center size-[52px] rounded-full bg-surface-dark text-text-secondary hover:text-white hover:bg-surface-card transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* Indicador de gravação */}
        <div className="flex-1 bg-surface-card rounded-3xl min-h-[52px] flex items-center justify-center gap-3 px-4">
          {/* Indicador pulsante vermelho */}
          <span className="relative flex size-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full size-3 bg-red-500"></span>
          </span>

          {/* Timer */}
          <span className="text-white font-medium tabular-nums">
            {formatDuration(recordingDuration)}
          </span>

          <span className="text-text-secondary text-sm">Gravando...</span>
        </div>

        {/* Botão parar e enviar */}
        <button
          onClick={onStopRecording}
          className="flex shrink-0 items-center justify-center size-[52px] rounded-full bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary-hover active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">send</span>
        </button>
      </div>
    );
  }

  // Durante processamento
  if (isProcessing) {
    return (
      <div className="flex items-center gap-3 w-full">
        <div className="flex-1 bg-surface-card rounded-3xl min-h-[52px] flex items-center justify-center gap-3 px-4">
          {/* Spinner */}
          <svg
            className="animate-spin size-5 text-primary"
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
          <span className="text-text-secondary text-sm">Transcrevendo...</span>
        </div>

        {/* Botão desabilitado */}
        <div className="flex shrink-0 items-center justify-center size-[52px] rounded-full bg-surface-dark text-text-secondary">
          <span className="material-symbols-outlined">mic</span>
        </div>
      </div>
    );
  }

  // Estado normal (idle ou error)
  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Input oculto para seleção de arquivo */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Mensagem de erro */}
      {recordingState === "error" && recordingError && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <span className="material-symbols-outlined text-red-500 text-[18px]">
            error
          </span>
          <span className="text-red-400 text-sm">{recordingError}</span>
        </div>
      )}

      <div className="flex items-end gap-3 w-full">
        {/* Botão de foto */}
        {showImageButton && onImageSelect && (
          <button
            onClick={handleImageButtonClick}
            disabled={disabled || isProcessing}
            className={`
              flex shrink-0 items-center justify-center
              size-[52px] rounded-full
              bg-surface-card text-text-secondary
              border border-border-subtle
              hover:text-white hover:bg-surface-dark
              active:scale-95 transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            title="Enviar foto de refeição"
          >
            <span className="material-symbols-outlined">photo_camera</span>
          </button>
        )}

        {/* Input container */}
        <div
          className={`
            flex-1 bg-surface-input rounded-3xl min-h-[52px]
            flex items-center px-4 py-3
            border border-border-subtle
            focus-within:ring-2 focus-within:ring-primary/50
            transition-shadow
          `}
        >
          <textarea
            ref={textareaRef}
            className="w-full bg-transparent border-none text-white placeholder-text-secondary focus:ring-0 focus:outline-none p-0 text-base resize-none overflow-hidden leading-6"
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isProcessing}
            rows={1}
            style={{ height: "24px" }}
          />
        </div>

        {/* Botão de ação (mic ou send) */}
        <button
          onClick={showSendButton ? handleSend : onStartRecording}
          disabled={disabled || isProcessing}
          className={`
            flex shrink-0 items-center justify-center
            size-[52px] rounded-full
            bg-primary text-white
            shadow-lg shadow-primary/30
            hover:bg-primary-hover active:scale-95
            transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <span className="material-symbols-outlined">
            {showSendButton ? "send" : "mic"}
          </span>
        </button>
      </div>
    </div>
  );
}
