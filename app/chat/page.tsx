"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { ChipGroup, type Chip } from "@/components/chat/ChipGroup";
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
import { Send, Trash2 } from "lucide-react";

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

  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  /**
   * Envia mensagem para a AI
   */
  const handleSend = async () => {
    if (!message.trim() || isSending || !profile) return;

    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: "user",
      content: message.trim(),
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
      <ScreenContainer>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </ScreenContainer>
    );
  }

  const hasMessages = messages.length > 0;

  return (
    <ScreenContainer>
      <div className="flex flex-1 flex-col">
        {/* Área de mensagens */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-4">
          {/* Estado inicial (sem mensagens) */}
          {!hasMessages && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center px-4">
              <div className="flex flex-col gap-2">
                <h1 className="text-xl font-semibold text-foreground">
                  Olá, {profile?.name?.split(" ")[0] || "usuário"}!
                </h1>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  Pode me dizer o que você comeu hoje, como foi seu treino ou como está se sentindo.
                </p>
              </div>

              {/* Sugestões rápidas */}
              <ChipGroup
                chips={INITIAL_SUGGESTIONS}
                onChipClick={setMessage}
                className="justify-center mt-4"
              />
            </div>
          )}

          {/* Lista de mensagens */}
          {hasMessages && (
            <div className="flex flex-col gap-4">
              {/* Botão para limpar histórico */}
              <div className="flex justify-end">
                <button
                  onClick={handleClearChat}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Limpar histórico
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
          <div className="mb-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Área de input */}
        <div className="flex gap-2 py-4 border-t border-border">
          <Input
            placeholder="Digite sua mensagem..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            disabled={isSending}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!message.trim() || isSending}
          >
            <Send className="h-4 w-4" />
          </Button>
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
