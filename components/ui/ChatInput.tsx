"use client";

import { useState, KeyboardEvent } from "react";

// ========================================
// CHAT INPUT - Input do chat com IA
// ========================================
// Input arredondado com botão de microfone/envio
// Usado na tela de chat com a IA

interface ChatInputProps {
  placeholder?: string;
  onSend: (message: string) => void;
  onMicClick?: () => void;
  disabled?: boolean;
  isRecording?: boolean;
}

export function ChatInput({
  placeholder = "Pergunte algo ao Fit IA...",
  onSend,
  onMicClick,
  disabled = false,
  isRecording = false,
}: ChatInputProps) {
  const [value, setValue] = useState("");

  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend(value.trim());
      setValue("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showSendButton = value.trim().length > 0;

  return (
    <div className="flex items-end gap-3 w-full">
      {/* Input container */}
      <div
        className={`
          flex-1 bg-neutral-800 rounded-3xl min-h-[52px]
          flex items-center px-4 py-2
          border border-white/5
          focus-within:ring-2 focus-within:ring-primary/50
          transition-shadow
        `}
      >
        <input
          className="w-full bg-transparent border-none text-white placeholder-neutral-500 focus:ring-0 p-0 text-base"
          placeholder={placeholder}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
      </div>

      {/* Botão de ação (mic ou send) */}
      <button
        onClick={showSendButton ? handleSend : onMicClick}
        disabled={disabled}
        className={`
          flex shrink-0 items-center justify-center
          size-[52px] rounded-full
          bg-primary text-white
          shadow-lg shadow-primary/30
          hover:bg-primary-hover active:scale-95
          transition-all
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isRecording ? "animate-pulse" : ""}
        `}
      >
        <span className="material-symbols-outlined">
          {showSendButton ? "send" : "mic"}
        </span>
      </button>
    </div>
  );
}
