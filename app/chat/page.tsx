"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ScreenContainer } from "@/components/layout/ScreenContainer";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { ChatInput, type RecordingState } from "@/components/ui/ChatInput";
import { ImagePreview } from "@/components/chat/ImagePreview";
import dynamic from "next/dynamic";
import { offProductToMealItem, isLiquidProduct, type NormalizedProduct } from "@/lib/openfoodfacts";

const BarcodeScanner = dynamic(
  () => import("@/components/import/BarcodeScanner").then(m => m.BarcodeScanner),
  { ssr: false }
);
const ScannedProductCard = dynamic(
  () => import("@/components/import/BarcodeScanner").then(m => m.ScannedProductCard),
  { ssr: false }
);
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import {
  getUserProfile,
  isOnboardingComplete,
  getChatMessages,
  saveChatMessages,
  clearChatMessages,
  getMeals,
  saveMeal,
  saveWeightLog,
  saveWorkout,
  saveBodyFatLog,
  type UserProfile,
  type ChatMessage,
  type Meal,
} from "@/lib/storage";
import { useAuth } from "@/components/providers/SupabaseAuthProvider";
import {
  logWeight,
  logMeal,
  logWorkout,
  logBodyFat,
  logGlucose,
  getUserContextForAI,
  type Meal as SupabaseMeal,
  type UserContext,
} from "@/lib/supabase";
import { generateMessageId } from "@/lib/ai";
import { Toast } from "@/components/feedback/Toast";
import { useToast } from "@/hooks/useToast";

/**
 * Página de Chat - Core do produto
 * Interface de conversa com a AI para registro de alimentação, treino, etc.
 */
export default function ChatPage() {
  const router = useRouter();
  const { user } = useAuth();
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

  // Estado do scanner de barcode
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<NormalizedProduct | null>(null);

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
   * Abre scanner de barcode
   */
  const handleOpenBarcodeScanner = useCallback(() => {
    setShowBarcodeScanner(true);
  }, []);

  /**
   * Fecha scanner de barcode
   */
  const handleCloseBarcodeScanner = useCallback(() => {
    setShowBarcodeScanner(false);
    setScannedProduct(null);
  }, []);

  /**
   * Produto escaneado - mostra card para adicionar
   */
  const handleProductScanned = useCallback((product: NormalizedProduct) => {
    setScannedProduct(product);
    setShowBarcodeScanner(false);
  }, []);

  /**
   * Adiciona produto escaneado como refeição
   */
  const handleAddScannedProduct = useCallback(async (grams: number) => {
    if (!scannedProduct || !profile) return;

    const mealItem = offProductToMealItem(scannedProduct, grams);
    const unit = isLiquidProduct(scannedProduct) ? "ml" : "g";
    const productName = scannedProduct.brand
      ? `${scannedProduct.productName} (${scannedProduct.brand})`
      : scannedProduct.productName;

    // Adiciona mensagem do usuário
    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: "user",
      content: `🔲 [Código de barras: ${productName}]`,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Monta resposta
    const responseContent = `📦 **Produto escaneado:**\n\n${productName}\n\n**Porção: ${grams}${unit}**\n🔥 ${mealItem.calories} kcal\n🥩 ${mealItem.protein}g proteína\n🍚 ${mealItem.carbs}g carboidratos\n🧈 ${mealItem.fat}g gordura\n\n✓ Registrado!`;

    // Adiciona resposta da AI
    const aiMessage: ChatMessage = {
      id: generateMessageId(),
      role: "assistant",
      content: responseContent,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, aiMessage]);

    // Salva no Supabase se logado
    if (user) {
      console.log("[Barcode] Salvando no Supabase, user:", user.id);
      const result = await logMeal("snack", [{
        food_name: productName,
        quantity_g: grams,
        calories: mealItem.calories,
        protein_g: mealItem.protein,
        carbs_g: mealItem.carbs,
        fat_g: mealItem.fat,
      }], `Barcode: ${scannedProduct.barcode}`);

      if (!result) {
        console.error("[Barcode] Erro ao salvar no Supabase");
        showToast("Erro ao salvar no servidor", "error");
      } else {
        console.log("[Barcode] Salvo com sucesso, meal_id:", result.id);
        showToast("Produto registrado!", "success");
      }
    } else {
      console.warn("[Barcode] Usuário não autenticado, salvando apenas localmente");
      showToast("Salvo localmente", "info");
    }

    // Salva no localStorage também
    saveMeal({
      type: "snack",
      items: [{
        name: productName,
        quantity: grams,
        unit,
        calories: mealItem.calories,
        protein: mealItem.protein,
        carbs: mealItem.carbs,
        fat: mealItem.fat,
      }],
      totalCalories: mealItem.calories,
      totalProtein: mealItem.protein,
      totalCarbs: mealItem.carbs,
      totalFat: mealItem.fat,
      rawText: `Barcode: ${scannedProduct.barcode}`,
    });

    setScannedProduct(null);
  }, [scannedProduct, profile, user, showToast]);

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

        // Salva a refeição no Supabase se logado
        if (user) {
          const mealItems = analysis.items.map((item: { name: string; portion: string; calories: number; protein: number; carbs: number; fat: number }) => ({
            food_name: item.name,
            quantity_g: 100, // Estimativa padrão para fotos
            calories: item.calories,
            protein_g: item.protein,
            carbs_g: item.carbs,
            fat_g: item.fat,
          }));
          await logMeal("snack", mealItems, `Foto: ${analysis.description}`);
        }

        showToast("Refeição registrada!", "success");
      }

      // Adiciona resposta da AI (com parsedData para card de foto)
      const aiMessage: ChatMessage = {
        id: generateMessageId(),
        role: "assistant",
        content: responseContent,
        timestamp: new Date().toISOString(),
        parsedData: analysis.isFood
          ? {
              type: "photo_analysis",
              data: {
                items: analysis.items,
                totals: analysis.totals,
                description: analysis.description,
              },
            }
          : undefined,
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
      // Obtém histórico de refeições do localStorage para contexto inteligente
      const mealHistory = getMeals().slice(-30);

      // Se usuário está logado, busca contexto completo do Supabase
      let supabaseContext: UserContext | undefined;
      if (user) {
        supabaseContext = await getUserContextForAI() ?? undefined;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages,
          profile,
          mealHistory,
          supabaseContext, // Contexto do Supabase (quando logado)
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao enviar mensagem");
      }

      // Salva dados parseados
      const { classification, parsedData } = data;

      // Adiciona resposta da AI (com parsedData para cards visuais)
      const aiMessage: ChatMessage = {
        id: generateMessageId(),
        role: "assistant",
        content: data.response,
        timestamp: new Date().toISOString(),
        parsedData: parsedData || undefined,
      };

      setMessages((prev) => [...prev, aiMessage]);

      if (parsedData && data.response.includes("✓ Registrado")) {
        // Sempre salva no localStorage (funciona offline e sem login)
        switch (parsedData.type) {
          case "food":
            // Salva no localStorage
            const localItems = parsedData.data.items.map((item: { name: string; grams?: number; quantity?: number; calories: number; protein: number; carbs: number; fat: number }) => ({
              name: item.name,
              grams: item.grams || item.quantity || 100,
              calories: item.calories,
              protein: item.protein,
              carbs: item.carbs,
              fat: item.fat,
            }));
            saveMeal({
              type: parsedData.data.mealType as Meal["type"],
              items: localItems,
              totalCalories: localItems.reduce((sum: number, i: { calories: number }) => sum + i.calories, 0),
              totalProtein: localItems.reduce((sum: number, i: { protein: number }) => sum + i.protein, 0),
              totalCarbs: localItems.reduce((sum: number, i: { carbs: number }) => sum + i.carbs, 0),
              totalFat: localItems.reduce((sum: number, i: { fat: number }) => sum + i.fat, 0),
              rawText: parsedData.data.rawText,
            });
            // Se logado, também salva no Supabase
            if (user) {
              const mealItems = parsedData.data.items.map((item: { name: string; grams?: number; quantity?: number; calories: number; protein: number; carbs: number; fat: number }) => ({
                food_name: item.name,
                quantity_g: item.grams || item.quantity || 100,
                calories: item.calories,
                protein_g: item.protein,
                carbs_g: item.carbs,
                fat_g: item.fat,
              }));
              const result = await logMeal(
                parsedData.data.mealType as SupabaseMeal["meal_type"],
                mealItems,
                parsedData.data.rawText
              );
              if (!result) {
                console.error("Falha ao salvar refeição no Supabase. User ID:", user.id);
              } else {
                console.log("Refeição salva no Supabase:", result.id);
              }
            }
            break;
          case "exercise":
            // Salva no localStorage
            saveWorkout({
              exercises: parsedData.data.exercises.map((ex: { name: string; type?: string; sets?: number; reps?: number; duration?: number; caloriesBurned?: number }) => ({
                name: ex.name,
                type: ex.type || "strength",
                sets: ex.sets,
                reps: ex.reps,
                duration: ex.duration,
                caloriesBurned: ex.caloriesBurned,
              })),
              totalDuration: parsedData.data.totalDuration,
              totalCaloriesBurned: parsedData.data.totalCaloriesBurned,
              rawText: parsedData.data.rawText,
            });
            // Se logado, também salva no Supabase
            if (user) {
              const workoutType = parsedData.data.exercises[0]?.type === "cardio" ? "cardio" : "strength";
              const exercises = parsedData.data.exercises.map((ex: { name: string; sets?: number; reps?: number; duration?: number }) => ({
                exercise_name: ex.name,
                sets: ex.sets,
                reps: ex.reps,
                duration_min: ex.duration,
              }));
              await logWorkout(
                workoutType,
                parsedData.data.totalDuration,
                parsedData.data.totalCaloriesBurned,
                exercises,
                parsedData.data.rawText
              );
            }
            break;
          case "weight":
            // Salva no localStorage
            saveWeightLog(parsedData.data.weight, parsedData.data.rawText);
            // Se logado, também salva no Supabase
            if (user) {
              await logWeight(parsedData.data.weight, parsedData.data.rawText);
            }
            break;
          case "bodyfat":
            // Salva no localStorage
            saveBodyFatLog(parsedData.data.percentage, parsedData.data.rawText);
            // Se logado, também salva no Supabase
            if (user) {
              await logBodyFat(parsedData.data.percentage, parsedData.data.rawText);
            }
            break;
          case "glucose":
            // Glicemia só salva no Supabase (requer login)
            if (user) {
              await logGlucose(
                parsedData.data.glucose,
                parsedData.data.measurementType,
                parsedData.data.rawText
              );
            }
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
          glucose: "Glicemia registrada!",
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
      <ScreenContainer className="bg-gradient-to-b from-[#FFFBF4] via-[#F6EAD9] to-[#EBDCC5] text-gray-800">
        <div className="flex flex-1 items-center justify-center">
          <p className="text-gray-500">Carregando...</p>
        </div>
      </ScreenContainer>
    );
  }

  const hasMessages = messages.length > 0;

  return (
    <ScreenContainer className="bg-gradient-to-b from-[#FFFBF4] via-[#F6EAD9] to-[#EBDCC5] text-gray-800">
      <div className="flex flex-1 flex-col">
        {/* Header — condicional: base (Ask ativo + X) vs conversa (Track ativo + back + dots) */}
        <header className="relative z-10 -mx-6 flex items-center justify-between px-6 pt-4 pb-4 shrink-0">
          {hasMessages ? (
            <button
              type="button"
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/40 backdrop-blur-sm text-[#3E2723] hover:bg-white/60 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
          ) : (
            <div className="w-10" />
          )}
          <div className="bg-[#EBE1CF] p-1 rounded-full flex items-center shadow-inner">
            <button
              type="button"
              className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                hasMessages
                  ? "bg-[#3E2723] text-white shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Track
            </button>
            <button
              type="button"
              className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                !hasMessages
                  ? "bg-[#3E2723] text-white shadow-md"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Ask
            </button>
          </div>
          {hasMessages ? (
            <button
              type="button"
              onClick={handleClearChat}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/40 backdrop-blur-sm text-[#3E2723] hover:bg-white/60 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">more_horiz</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center text-gray-800 hover:bg-white transition backdrop-blur-md shadow-sm"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          )}
        </header>

        {/* Área de mensagens */}
        <div className="flex flex-1 flex-col overflow-y-auto px-0 pt-2 pb-4 hide-scrollbar">
          {/* Estado inicial — 2 sugestoes grandes em grid */}
          {!hasMessages && (
            <div className="flex flex-1 flex-col justify-center px-5 pb-32">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleSendMessage("Como esta meu equilibrio nutricional esta semana?")}
                  className="bg-[#F3E7D5] p-5 rounded-3xl text-left shadow-[0_4px_20px_-2px_rgba(62,39,35,0.05)] hover:shadow-lg transition-all duration-300 active:scale-95 border border-white/40 h-60 flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <p className="text-[#4A3B32] font-bold text-[1.3rem] leading-tight z-10">
                    Como esta meu equilibrio nutricional esta semana?
                  </p>
                  <div className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center self-end backdrop-blur-sm z-10">
                    <span className="material-symbols-outlined text-[#3E2723] text-base opacity-60">
                      arrow_forward
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => handleSendMessage("Sugira um treino rapido para hoje")}
                  className="bg-[#F3E7D5] p-5 rounded-3xl text-left shadow-[0_4px_20px_-2px_rgba(62,39,35,0.05)] hover:shadow-lg transition-all duration-300 active:scale-95 border border-white/40 h-60 flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <p className="text-[#4A3B32] font-bold text-[1.3rem] leading-tight z-10">
                    Sugira um treino rapido para hoje
                  </p>
                  <div className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center self-end backdrop-blur-sm z-10">
                    <span className="material-symbols-outlined text-[#3E2723] text-base opacity-60">
                      arrow_forward
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Lista de mensagens */}
          {hasMessages && (
            <div className="flex flex-col gap-6 px-4">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  timestamp={msg.timestamp}
                  parsedData={msg.parsedData}
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
          <div className="mb-2 mx-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Input */}
        <div className="shrink-0 px-0 pt-2 pb-2">
          {/* Preview de imagem selecionada */}
          {selectedImage && (
            <div className="mb-4">
              <ImagePreview
                file={selectedImage}
                onRemove={handleRemoveImage}
                onSend={handleSendImage}
                isLoading={isAnalyzingImage}
                loadingMessage="Analisando refeicao..."
              />
            </div>
          )}

          {/* Input de texto/áudio */}
          {!selectedImage && (
            <ChatInput
              placeholder="Ask literally anything..."
              onSend={handleSendMessage}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
              onCancelRecording={handleCancelRecording}
              onImageSelect={handleImageSelect}
              onBarcodeClick={handleOpenBarcodeScanner}
              disabled={isSending}
              recordingState={recordingState}
              recordingDuration={recordingDuration}
              recordingError={recordingError}
              transcribedText={transcribedText}
            />
          )}
        </div>
      </div>

      {/* Scanner de código de barras */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onProductScanned={handleProductScanned}
          onError={(error) => showToast(error, "error")}
          onClose={handleCloseBarcodeScanner}
        />
      )}

      {/* Card de produto escaneado */}
      {scannedProduct && (
        <ScannedProductCard
          product={scannedProduct}
          onAddToMeal={handleAddScannedProduct}
          onScanAnother={() => {
            setScannedProduct(null);
            setShowBarcodeScanner(true);
          }}
          onClose={() => setScannedProduct(null)}
        />
      )}

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
