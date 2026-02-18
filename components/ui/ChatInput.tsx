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
  onBarcodeClick?: () => void; // Callback para abrir scanner de barcode
  disabled?: boolean;
  recordingState?: RecordingState;
  recordingDuration?: number; // Duração em segundos
  recordingError?: string;
  transcribedText?: string; // Texto transcrito para preencher o input
  showImageButton?: boolean; // Mostrar botão de foto (default: true)
  showBarcodeButton?: boolean; // Mostrar botão de barcode (default: true)
}

export function ChatInput({
  placeholder = "Pergunte algo ao Fit IA...",
  onSend,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
  onImageSelect,
  onBarcodeClick,
  disabled = false,
  recordingState = "idle",
  recordingDuration = 0,
  recordingError,
  transcribedText,
  showImageButton = true,
  showBarcodeButton = true,
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
      <div className="bg-white rounded-[2rem] p-2 pl-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center gap-1 border border-white/60 backdrop-blur-xl w-full">
        {/* Botão cancelar */}
        <button
          onClick={onCancelRecording}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all duration-200"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Indicador de gravação */}
        <div className="flex-1 flex items-center justify-center gap-3 py-1">
          <span className="relative flex size-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full size-3 bg-red-500"></span>
          </span>
          <span className="text-gray-800 font-medium tabular-nums">
            {formatDuration(recordingDuration)}
          </span>
          <span className="text-gray-400 text-sm">Gravando...</span>
        </div>

        {/* Botão parar e enviar */}
        <button
          onClick={onStopRecording}
          className="w-11 h-11 rounded-full bg-calma-primary text-white flex items-center justify-center hover:bg-calma-primary/90 active:scale-95 transition-all duration-200 shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">send</span>
        </button>
      </div>
    );
  }

  // Durante processamento
  if (isProcessing) {
    return (
      <div className="bg-white rounded-[2rem] p-2 pl-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center gap-1 border border-white/60 backdrop-blur-xl w-full">
        <div className="flex-1 flex items-center justify-center gap-3 py-1">
          <svg
            className="animate-spin size-5 text-calma-primary"
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
          <span className="text-gray-400 text-sm">Transcrevendo...</span>
        </div>

        <div className="w-11 h-11 rounded-full bg-gray-100 text-gray-300 flex items-center justify-center">
          <span className="material-symbols-outlined text-[20px]">mic</span>
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
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl">
          <span className="material-symbols-outlined text-red-500 text-[18px]">
            error
          </span>
          <span className="text-red-600 text-sm">{recordingError}</span>
        </div>
      )}

      {/* Single white container — Stitch design */}
      <div className="bg-white rounded-[2rem] min-h-14 p-2 pr-2 pl-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-end gap-1 border border-white/60 backdrop-blur-xl w-full">
        {/* Textarea (auto-resize) */}
        <div className="flex-1 min-w-0 flex items-center min-h-10">
          <textarea
            ref={textareaRef}
            className="w-full bg-transparent border-none text-gray-800 placeholder-gray-400 focus:ring-0 focus:outline-none p-0 text-[17px] resize-none overflow-hidden leading-relaxed"
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isProcessing}
            rows={1}
          />
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200 mx-1 shrink-0 mb-2.5" />

        {/* Botão de barcode */}
        {showBarcodeButton && onBarcodeClick && (
          <button
            onClick={onBarcodeClick}
            disabled={disabled || isProcessing}
            className="w-10 h-10 mb-0.5 flex items-center justify-center rounded-full text-gray-400 hover:text-calma-primary hover:bg-gray-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            title="Escanear código de barras"
          >
            <span className="material-symbols-outlined text-[22px]">qr_code_scanner</span>
          </button>
        )}

        {/* Botão de foto */}
        {showImageButton && onImageSelect && (
          <button
            onClick={handleImageButtonClick}
            disabled={disabled || isProcessing}
            className="w-10 h-10 mb-0.5 flex items-center justify-center rounded-full text-gray-400 hover:text-calma-primary hover:bg-gray-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            title="Enviar foto de refeição"
          >
            <span className="material-symbols-outlined text-[22px]">photo_camera</span>
          </button>
        )}

        {/* Botão de ação (mic ou send) */}
        <button
          onClick={showSendButton ? handleSend : onStartRecording}
          disabled={disabled || isProcessing}
          className={`
            w-11 h-11 ml-1 rounded-full flex items-center justify-center
            active:scale-95 transition-all duration-200 shadow-sm shrink-0
            disabled:opacity-50 disabled:cursor-not-allowed
            ${showSendButton
              ? "bg-calma-primary text-white hover:bg-calma-primary/90"
              : "bg-gray-100 text-calma-primary hover:bg-gray-200"
            }
          `}
        >
          <span className="material-symbols-outlined text-[20px]">
            {showSendButton ? "send" : "mic"}
          </span>
        </button>
      </div>
    </div>
  );
}
