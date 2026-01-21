"use client";

import { useState, useRef, useCallback } from "react";

// ========================================
// useAudioRecorder - Hook para gravação de áudio
// ========================================
// Gerencia captura de áudio via MediaRecorder API
// Retorna um Blob de áudio pronto para envio à API de transcrição

// Estados possíveis do gravador
export type RecorderStatus =
  | "idle" // Aguardando ação
  | "requesting" // Solicitando permissão do microfone
  | "recording" // Gravando áudio
  | "processing" // Processando áudio (após parar)
  | "error"; // Erro (permissão negada, etc.)

// Tipo de erro específico
export type RecorderError =
  | "permission_denied" // Usuário negou acesso ao microfone
  | "not_supported" // Navegador não suporta MediaRecorder
  | "no_microphone" // Nenhum microfone encontrado
  | "unknown"; // Erro desconhecido

interface UseAudioRecorderReturn {
  // Estado atual do gravador
  status: RecorderStatus;

  // Erro (se houver)
  error: RecorderError | null;

  // Duração da gravação em segundos
  duration: number;

  // Inicia gravação (solicita permissão se necessário)
  startRecording: () => Promise<void>;

  // Para gravação e retorna o Blob de áudio
  stopRecording: () => Promise<Blob | null>;

  // Cancela gravação sem retornar áudio
  cancelRecording: () => void;

  // Reseta o estado para idle
  reset: () => void;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  // Estados
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [error, setError] = useState<RecorderError | null>(null);
  const [duration, setDuration] = useState(0);

  // Refs para manter referências entre renders
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Limpa recursos (stream, timer)
  const cleanup = useCallback(() => {
    // Para o timer de duração
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Para todas as tracks do stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Limpa chunks
    chunksRef.current = [];

    // Limpa referência do MediaRecorder
    mediaRecorderRef.current = null;
  }, []);

  // Inicia gravação
  const startRecording = useCallback(async () => {
    // Verifica suporte do navegador
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("not_supported");
      setStatus("error");
      return;
    }

    try {
      setStatus("requesting");
      setError(null);
      setDuration(0);

      // Solicita acesso ao microfone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;

      // Determina o formato de áudio suportado
      // Preferência: webm > mp4 > ogg
      let mimeType = "audio/webm";
      if (MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/webm";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
        mimeType = "audio/ogg";
      }

      // Cria MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Evento: dados disponíveis
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Inicia gravação
      mediaRecorder.start(100); // Coleta dados a cada 100ms
      setStatus("recording");
      startTimeRef.current = Date.now();

      // Timer para atualizar duração
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);
      }, 100);
    } catch (err) {
      cleanup();

      // Identifica tipo de erro
      if (err instanceof DOMException) {
        if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError"
        ) {
          setError("permission_denied");
        } else if (
          err.name === "NotFoundError" ||
          err.name === "DevicesNotFoundError"
        ) {
          setError("no_microphone");
        } else {
          setError("unknown");
        }
      } else {
        setError("unknown");
      }

      setStatus("error");
    }
  }, [cleanup]);

  // Para gravação e retorna Blob
  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;

      if (!mediaRecorder || mediaRecorder.state !== "recording") {
        resolve(null);
        return;
      }

      setStatus("processing");

      // Evento: gravação parada
      mediaRecorder.onstop = () => {
        // Cria Blob com os chunks
        const blob = new Blob(chunksRef.current, {
          type: mediaRecorder.mimeType,
        });

        cleanup();
        setStatus("idle");
        resolve(blob);
      };

      // Para a gravação
      mediaRecorder.stop();
    });
  }, [cleanup]);

  // Cancela gravação
  const cancelRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;

    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
    }

    cleanup();
    setStatus("idle");
    setDuration(0);
  }, [cleanup]);

  // Reseta estado
  const reset = useCallback(() => {
    cleanup();
    setStatus("idle");
    setError(null);
    setDuration(0);
  }, [cleanup]);

  return {
    status,
    error,
    duration,
    startRecording,
    stopRecording,
    cancelRecording,
    reset,
  };
}
