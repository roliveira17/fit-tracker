"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { ChipGroup, type Chip } from "@/components/chat/ChipGroup";
import { ChatInput, type RecordingState } from "@/components/ui/ChatInput";
import { ImagePreview } from "@/components/chat/ImagePreview";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import {
  getUserProfile,
  isOnboardingComplete,
  getChatMessages,
  saveChatMessages,
  clearChatMessages,
  saveMeal,
  saveWorkout,
  saveWeightLog,
  saveBodyFatLog,
  type UserProfile,
  type ChatMessage,
} from "@/lib/storage";
import { generateMessageId } from "@/lib/ai";
import { Toast } from "@/components/feedback/Toast";
import { useToast } from "@/hooks/useToast";

/**
 * Sugestões iniciais exibidas quando o chat está vazio
 */
const INITIAL_SUGGESTIONS: Chip[] = [
  { label: "Almocei arroz e frango" },
  { label: "Fiz 30min de esteira" },
  { label: "Qual meu BMR?" },
  { label: "Registrar peso" },
];

/**
 * Página de Chat - Core do produto
 * Interface de conversa com a AI para registro de alimentação, treino, etc.
 */
export default function ChatPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast, showToast, hideToast } = useToast();

  // Estado de gravação de áudio
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordingError, setRecordingError] = useState<string | undefined>();
  const [transcribedText, setTranscribedText] = useState<string | undefined>();

  // Estado de imagem
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hook de gravação de áudio
  const {
    status: recorderStatus,
    error: recorderError,
    duration: recordingDuration,
    startRecording,
    stopRecording,
    cancelRecording,
    reset: resetRecorder,
  } = useAudioRecorder();

  // Scroll para última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  useEffect(() => {
    // Verifica se o onboarding foi completado
    if (!isOnboardingComplete()) {
      router.push("/onboarding");
      return;
    }

    // Carrega o perfil do usuário
    const userProfile = getUserProfile();
    if (userProfile) {
      setProfile(userProfile);
    }

    // Carrega mensagens salvas
    const savedMessages = getChatMessages();
    if (savedMessages.length > 0) {
      setMessages(savedMessages);
    }

    setIsLoading(false);
  }, [router]);

  // Salva mensagens sempre que mudam
  useEffect(() => {
    if (messages.length > 0) {
      saveChatMessages(messages);
    }
  }, [messages]);

  /**
   * Limpa o histórico de mensagens
   */
  const handleClearChat = () => {
    setMessages([]);
    clearChatMessages();
  };

  // Sincroniza estado do recorder com o estado local
  useEffect(() => {
    if (recorderStatus === "recording") {
      setRecordingState("recording");
      setRecordingError(undefined);
    } else if (recorderStatus === "processing") {
      setRecordingState("processing");
    } else if (recorderStatus === "error") {
      setRecordingState("error");
      // Mapeia erros para mensagens amigáveis
      const errorMessages: Record<string, string> = {
        permission_denied: "Permissão de microfone negada. Habilite nas configurações.",
        not_supported: "Seu navegador não suporta gravação de áudio.",
        no_microphone: "Nenhum microfone encontrado.",
        unknown: "Erro ao acessar o microfone.",
      };
      setRecordingError(errorMessages[recorderError || "unknown"]);
    } else if (recorderStatus === "idle" && recordingState !== "idle") {
      setRecordingState("idle");
    }
  }, [recorderStatus, recorderError, recordingState]);

  /**
   * Inicia gravação de áudio
   */
  const handleStartRecording = useCallback(async () => {
    setTranscribedText(undefined);
    setRecordingError(undefined);
    await startRecording();
  }, [startRecording]);

  /**
   * Para gravação e transcreve o áudio
   */
  const handleStopRecording = useCallback(async () => {
    setRecordingState("processing");

    const audioBlob = await stopRecording();

    if (!audioBlob) {
      setRecordingState("error");
      setRecordingError("Nenhum áudio gravado.");
      return;
    }

    try {
      // Envia para API de transcrição
      const formData = new FormData();
      formData.append("audio", audioBlob, "audio.webm");

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro na transcrição");
      }

      // Preenche o input com o texto transcrito
      setTranscribedText(data.text);
      setRecordingState("idle");
      showToast("Áudio transcrito!", "success");
    } catch (err) {
      setRecordingState("error");
      setRecordingError(
        err instanceof Error ? err.message : "Erro ao transcrever áudio"
      );
    }
  }, [stopRecording, showToast]);

  /**
   * Cancela gravação
   */
  const handleCancelRecording = useCallback(() => {
    cancelRecording();
    setRecordingState("idle");
    setRecordingError(undefined);
  }, [cancelRecording]);

  /**
   * Handler para seleção de imagem
   */
  const handleImageSelect = useCallback((file: File) => {
    setSelectedImage(file);
  }, []);

  /**
   * Remove imagem selecionada
   */
  const handleRemoveImage = useCallback(() => {
    setSelectedImage(null);
  }, []);

  /**
   * Converte arquivo para base64
   */
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove o prefixo "data:image/...;base64,"
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  /**
   * Envia imagem para análise
   */
  const handleSendImage = useCallback(async () => {
    if (!selectedImage || isAnalyzingImage || !profile) return;

    setIsAnalyzingImage(true);

    try {
      // Converte imagem para base64
      const base64 = await fileToBase64(selectedImage);

      // Adiciona mensagem do usuário com indicação de foto
      const userMessage: ChatMessage = {
        id: generateMessageId(),
        role: "user",
        content: "📷 [Foto de refeição enviada]",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Envia para API de análise
      const response = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64,
          mimeType: selectedImage.type,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao analisar imagem");
      }

      const { analysis } = data;

      // Monta resposta baseada na análise
      let responseContent: string;

      if (!analysis.isFood) {
        responseContent = "Não consegui identificar alimentos nesta imagem. Tente enviar uma foto mais clara da refeição.";
      } else {
        // Formata a resposta com os alimentos identificados
        const itemsList = analysis.items
          .map((item: { name: string; portion: string; calories: number; protein: number }) =>
            `• ${item.name} (${item.portion}) - ${item.calories}kcal, ${item.protein}g prot`
          )
          .join("\n");

        responseContent = `📸 **Análise da refeição:**\n\n${analysis.description}\n\n**Alimentos identificados:**\n${itemsList}\n\n**Totais estimados:**\n🔥 ${analysis.totals.calories} kcal\n🥩 ${analysis.totals.protein}g proteína\n🍚 ${analysis.totals.carbs}g carboidratos\n🧈 ${analysis.totals.fat}g gordura\n\n_Confiança: ${analysis.confidence}_\n\n✓ Registrado! Quer corrigir algo?`;

        // Salva a refeição
        saveMeal({
          type: "other",
          items: analysis.items.map((item: { name: string; portion: string; calories: number; protein: number; carbs: number; fat: number }) => ({
            name: item.name,
            quantity: 1,
            unit: item.portion,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
          })),
          totalCalories: analysis.totals.calories,
          totalProtein: analysis.totals.protein,
          totalCarbs: analysis.totals.carbs,
          totalFat: analysis.totals.fat,
          rawText: `Foto: ${analysis.description}`,
        });

        showToast("Refeição registrada!", "success");
      }

      // Adiciona resposta da AI
      const aiMessage: ChatMessage = {
        id: generateMessageId(),
        role: "assistant",
        content: responseContent,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Limpa imagem selecionada
      setSelectedImage(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao analisar imagem";
      setError(errorMessage);
      showToast("Erro na análise", "error");
    } finally {
      setIsAnalyzingImage(false);
    }
  }, [selectedImage, isAnalyzingImage, profile, showToast]);

  /**
   * Envia mensagem para a AI (chamado pelo ChatInput)
   */
  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || isSending || !profile) return;

    // Limpa texto transcrito após enviar
    setTranscribedText(undefined);

    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: "user",
      content: messageText.trim(),
      timestamp: new Date().toISOString(),
    };

    // Adiciona mensagem do usuário
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setIsSending(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages,
          profile,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao enviar mensagem");
      }

      // Adiciona resposta da AI
      const aiMessage: ChatMessage = {
        id: generateMessageId(),
        role: "assistant",
        content: data.response,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Salva dados parseados no localStorage
      const { classification, parsedData } = data;
      if (parsedData && data.response.includes("✓ Registrado")) {
        switch (parsedData.type) {
          case "food":
            saveMeal({
              type: parsedData.data.mealType,
              items: parsedData.data.items,
              totalCalories: parsedData.data.totalCalories,
              totalProtein: parsedData.data.totalProtein,
              totalCarbs: parsedData.data.totalCarbs,
              totalFat: parsedData.data.totalFat,
              rawText: parsedData.data.rawText,
            });
            break;
          case "exercise":
            saveWorkout({
              exercises: parsedData.data.exercises,
              totalDuration: parsedData.data.totalDuration,
              totalCaloriesBurned: parsedData.data.totalCaloriesBurned,
              rawText: parsedData.data.rawText,
            });
            break;
          case "weight":
            saveWeightLog(parsedData.data.weight, parsedData.data.rawText);
            break;
          case "bodyfat":
            saveBodyFatLog(parsedData.data.percentage, parsedData.data.rawText);
            break;
        }
      }

      // Mostra toast baseado no tipo de mensagem classificada
      if (classification?.type === "declaration" && data.response.includes("✓ Registrado")) {
        const subtypeLabels: Record<string, string> = {
          food: "Refeição registrada!",
          exercise: "Treino registrado!",
          weight: "Peso registrado!",
          bodyfat: "BF registrado!",
        };
        showToast(subtypeLabels[classification.subtype] || "Registro salvo!", "success");
      } else if (classification?.type === "correction" && data.response.includes("✓ Corrigido")) {
        showToast("Registro corrigido!", "success");
      } else if (classification?.type === "subjective" && data.response.includes("✓ Registrado")) {
        showToast("Estado registrado!", "success");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
      console.error("Erro no chat:", err);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer className="bg-background-dark text-white">
        <div className="flex flex-1 items-center justify-center">
          <p className="text-text-secondary">Carregando...</p>
        </div>
      </ScreenContainer>
    );
  }

  const hasMessages = messages.length > 0;

  return (
    <ScreenContainer className="bg-background-dark text-white">
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 -mx-6 mb-2 flex items-center justify-between border-b border-white/10 bg-background-dark/95 px-4 py-3 backdrop-blur-md">
          <h1 className="text-lg font-bold tracking-tight text-white">Fit Track</h1>
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Configuracoes"
          >
            <span className="material-symbols-outlined text-[22px]">
              settings
            </span>
          </button>
        </header>
        {/* Área de mensagens */}
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto py-3">
          {/* Estado inicial (sem mensagens) */}
          {!hasMessages && (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Ola, {profile?.name?.split(" ")[0] || "usuario"}!
                </h1>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Pode me dizer o que voce comeu hoje, como foi seu treino ou como esta se sentindo.
                </p>
              </div>

              {/* Sugestões rápidas */}
              <ChipGroup
                chips={INITIAL_SUGGESTIONS}
                onChipClick={(text) => handleSendMessage(text)}
                className="mt-4"
              />
            </div>
          )}

          {/* Lista de mensagens */}
          {hasMessages && (
            <div className="flex flex-col gap-4">
              <div className="flex justify-center">
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-text-secondary">
                  Hoje
                </span>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleClearChat}
                  className="flex items-center gap-1.5 text-xs text-text-secondary transition-colors hover:text-white"
                >
                  <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                  Limpar historico
                </button>
              </div>

              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  timestamp={msg.timestamp}
                />
              ))}

              {/* Indicador de digitando */}
              {isSending && <TypingIndicator />}

              {/* Referência para scroll */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="mb-2 rounded-lg border border-error/20 bg-error/10 px-3 py-2 text-sm text-error">
            {error}
          </div>
        )}

        {/* Área de input com suporte a áudio e foto */}
        <div className="border-t border-white/5 py-4">
          {/* Preview de imagem selecionada */}
          {selectedImage && (
            <div className="mb-4">
              <ImagePreview
                file={selectedImage}
                onRemove={handleRemoveImage}
                onSend={handleSendImage}
                isLoading={isAnalyzingImage}
                loadingMessage="Analisando refeição..."
              />
            </div>
          )}

          {/* Input de texto/áudio (oculto quando tem imagem) */}
          {!selectedImage && (
            <ChatInput
              placeholder="Digite ou grave sua mensagem..."
              onSend={handleSendMessage}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
              onCancelRecording={handleCancelRecording}
              onImageSelect={handleImageSelect}
              disabled={isSending}
              recordingState={recordingState}
              recordingDuration={recordingDuration}
              recordingError={recordingError}
              transcribedText={transcribedText}
            />
          )}
        </div>
      </div>

      {/* Toast de feedback */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </ScreenContainer>
  );
}
