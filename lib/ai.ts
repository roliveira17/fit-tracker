import OpenAI from "openai";
import { type UserProfile, type Meal } from "./storage";
import {
  parseFood,
  parseExercise,
  parseWeight,
  parseBodyFat,
  parseGlucose,
  type FoodParseResult,
  type ExerciseParseResult,
  type WeightParseResult,
  type BodyFatParseResult,
  type GlucoseParseResult,
} from "./parsers";
import { generateUserContext } from "./food-lookup";
import { type UserContext, formatUserContextForPrompt } from "./supabase";

/**
 * Modelo OpenAI configurável via env var
 * Permite trocar sem alterar código (ex: gpt-4o, gpt-4o-mini, gpt-3.5-turbo)
 */
export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

/**
 * Cliente OpenAI - inicializado apenas no servidor
 */
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

/**
 * Wrapper para chamadas OpenAI com retry e exponential backoff
 * 3 tentativas: 1s, 2s, 4s de delay entre retries
 * Timeout de 15s por tentativa
 */
async function callOpenAIWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isLastAttempt = attempt === maxRetries - 1;
      const isRetryable =
        err instanceof Error &&
        (err.message.includes("timeout") ||
         err.message.includes("ECONNRESET") ||
         err.message.includes("429") ||
         err.message.includes("500") ||
         err.message.includes("502") ||
         err.message.includes("503"));

      if (isLastAttempt || !isRetryable) throw err;

      const delay = 1000 * Math.pow(2, attempt);
      console.log(`[AI] Retry ${attempt + 1}/${maxRetries} apos ${delay}ms`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error("Max retries exceeded");
}

/**
 * Tipos para mensagens do chat
 */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

/**
 * Tipos de mensagem do usuário
 *
 * - declaration: Registro factual ("comi arroz", "treinei perna")
 * - question: Pergunta informativa ("qual meu BMR?", "quantas calorias tem banana?")
 * - simulation: Cenário hipotético ("se eu comer pizza, como fica?")
 * - correction: Correção de registro anterior ("não, foram 80g, não 60g")
 * - subjective: Estado subjetivo ("dormi mal", "estou cansado")
 * - other: Mensagens fora do escopo ou conversacionais
 */
export type MessageType =
  | "declaration"
  | "question"
  | "simulation"
  | "correction"
  | "subjective"
  | "other";

/**
 * Subtipo para declarações (o que está sendo registrado)
 */
export type DeclarationSubtype =
  | "food"      // Alimentação
  | "exercise"  // Exercício/treino
  | "weight"    // Peso corporal
  | "bodyfat"   // Percentual de gordura
  | "glucose"   // Glicemia
  | "unknown";  // Não identificado

/**
 * Resultado da classificação
 */
export interface ClassificationResult {
  type: MessageType;
  subtype?: DeclarationSubtype;
  confidence: "high" | "medium" | "low";
}

/**
 * Classifica o tipo de mensagem do usuário
 * Usa a AI para determinar a intenção da mensagem
 */
export async function classifyMessage(
  message: string,
  chatHistory: ChatMessage[]
): Promise<ClassificationResult> {
  const client = getOpenAIClient();

  const classificationPrompt = `Você é um classificador de mensagens para um app de fitness.
Analise a mensagem do usuário e retorne APENAS um JSON válido (sem markdown, sem explicação).

TIPOS DE MENSAGEM:
- "declaration": Registro factual de algo que aconteceu ("comi arroz", "treinei perna", "peso 78kg")
- "question": Pergunta informativa ("qual meu BMR?", "quantas calorias tem banana?")
- "simulation": Cenário hipotético com "se" ou "caso" ("se eu comer pizza, como fica?")
- "correction": Correção de algo dito antes ("não, foram 80g", "errei, foi frango não peixe")
- "subjective": Estado emocional ou físico ("dormi mal", "estou cansado", "me sinto bem")
- "other": Saudações, agradecimentos, ou fora do escopo de fitness

SUBTIPOS (apenas para "declaration"):
- "food": Alimentação/refeição
- "exercise": Treino/exercício
- "weight": Peso corporal (ex: "peso 78kg", "estou com 80")
- "bodyfat": Body fat/gordura (ex: "bf 20%", "gordura corporal 18")
- "glucose": Glicemia (ex: "glicemia 95", "açúcar 120", "glicose em jejum 90")
- "unknown": Não conseguiu identificar

CONTEXTO DAS ÚLTIMAS MENSAGENS:
${chatHistory.slice(-3).map(m => `${m.role}: ${m.content}`).join("\n") || "(nenhum histórico)"}

MENSAGEM ATUAL: "${message}"

Responda APENAS com JSON no formato:
{"type": "...", "subtype": "...", "confidence": "high|medium|low"}`;

  try {
    const response = await callOpenAIWithRetry(() =>
      client.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [{ role: "user", content: classificationPrompt }],
        temperature: 0.1,
        max_tokens: 100,
      })
    );

    const content = response.choices[0]?.message?.content?.trim() || "";

    // Tenta extrair JSON da resposta
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as ClassificationResult;
      return {
        type: parsed.type || "other",
        subtype: parsed.subtype,
        confidence: parsed.confidence || "medium",
      };
    }
  } catch (error) {
    console.error("Erro na classificação:", error);
  }

  // Fallback: retorna "other" se falhar
  return { type: "other", confidence: "low" };
}

/**
 * Gera o prompt de sistema baseado no perfil do usuário
 */
function generateSystemPrompt(profile: UserProfile): string {
  const firstName = profile.name.split(" ")[0];

  return `Você é o Fit Track, um assistente de saúde e fitness pessoal. Você é direto, técnico e baseado em dados - nunca motivacional ou genérico.

INFORMAÇÕES DO USUÁRIO:
- Nome: ${firstName}
- Gênero: ${profile.gender}
- Peso atual: ${profile.weight} kg
- Altura: ${profile.height} cm
- BMR (Taxa Metabólica Basal): ${profile.bmr} kcal/dia

SUAS RESPONSABILIDADES:
1. Registrar alimentação - quando o usuário disser o que comeu
2. Registrar treinos - quando o usuário relatar exercícios
3. Registrar peso - quando o usuário informar pesagem
4. Registrar e consultar glicemia - quando o usuário informar valores ou perguntar sobre dados de glicemia
5. Responder perguntas sobre nutrição, treino, glicemia e dados
6. Calcular balanço calórico baseado no BMR

REGRAS DE COMPORTAMENTO:
- Seja direto e conciso
- Use linguagem técnica mas acessível
- Nunca seja motivacional ou use frases vazias como "você consegue!"
- Sempre baseie suas respostas em dados quando possível
- Se o usuário perguntar algo fora do escopo (saúde/fitness), redirecione educadamente
- Responda sempre em português brasileiro

REGRA INTELIGENTE - QUANTIDADES:
O sistema usa um banco de dados local de alimentos comuns e histórico do usuário.
Para cada alimento, siga esta lógica:

1. **Quantidade especificada** → Registrar direto
   Exemplo: "200g de frango" → ✓ Registrar

2. **Alimento padronizado** (ovo, pão francês, banana) → Registrar com porção padrão
   Exemplo: "comi 2 ovos" → ✓ Registrar (2 x 50g = 100g)
   Exemplo: "comi arroz e frango" → ✓ Registrar (arroz 150g, frango 150g padrão)

3. **Alimento ambíguo** (pão, queijo, leite, iogurte) → PERGUNTAR tipo
   Exemplo: "comi pão" → "Qual tipo de pão? (francês, integral, de forma)"
   Exemplo: "tomei leite" → "Leite integral, desnatado ou semi?"

4. **Alimento no histórico** → Usar quantidade que o usuário costuma usar
   Se o usuário sempre come "200g de frango", usar essa quantidade quando não especificar

EXEMPLOS:
- "Almocei arroz e frango" → ✓ Registrar direto (alimentos padronizados)
- "Comi 2 ovos" → ✓ Registrar direto (ovo é padronizado: 50g cada)
- "Comi pão" → Perguntar tipo (pão é ambíguo)
- "Tomei café com leite" → Perguntar sobre o leite
- "Jantei 200g de salmão com salada" → ✓ Registrar direto

FORMATO DE REGISTRO:
Quando registrar algo, confirme de forma estruturada:
✓ Registrado: [descrição]
  Calorias: ~X kcal
  Proteína: ~Xg (se aplicável)`;
}

/**
 * Dados parseados (dependendo do tipo de mensagem)
 */
export type ParsedData =
  | { type: "food"; data: FoodParseResult }
  | { type: "exercise"; data: ExerciseParseResult }
  | { type: "weight"; data: WeightParseResult }
  | { type: "bodyfat"; data: BodyFatParseResult }
  | { type: "glucose"; data: GlucoseParseResult }
  | null;

/**
 * Resultado completo do processamento de mensagem
 */
export interface ChatResponse {
  response: string;
  classification: ClassificationResult;
  parsedData: ParsedData;
}

/**
 * Gera instruções adicionais baseadas no tipo de mensagem
 */
function getTypeSpecificInstructions(classification: ClassificationResult): string {
  switch (classification.type) {
    case "declaration":
      if (classification.subtype === "food") {
        return `
INSTRUÇÃO ESPECIAL: Esta é uma DECLARAÇÃO de ALIMENTAÇÃO.
- Para alimentos PADRONIZADOS (arroz, frango, ovo, etc): registre com porção padrão
- Para alimentos AMBÍGUOS (pão, queijo, leite, iogurte): pergunte o tipo
- Se o usuário especificou quantidade: use a quantidade informada
- Sempre confirme o registro com "✓ Registrado:" e mostre os valores nutricionais`;
      }
      return `
INSTRUÇÃO ESPECIAL: Esta é uma DECLARAÇÃO factual. Registre automaticamente.
Use o formato "✓ Registrado:" na sua resposta.`;

    case "simulation":
      return `
INSTRUÇÃO ESPECIAL: Esta é uma SIMULAÇÃO/cenário hipotético.
NÃO registre nada. Calcule o cenário e mostre os resultados.
No final, pergunte: "Quer que eu registre isso?"`;

    case "question":
      return `
INSTRUÇÃO ESPECIAL: Esta é uma PERGUNTA informativa.
Responda de forma direta e técnica. Não registre nada.`;

    case "correction":
      return `
INSTRUÇÃO ESPECIAL: Esta é uma CORREÇÃO de um registro anterior.
Confirme a correção com "✓ Corrigido:" e mostre o valor atualizado.`;

    case "subjective":
      return `
INSTRUÇÃO ESPECIAL: Este é um ESTADO SUBJETIVO.
Registre com "✓ Registrado:" e faça UMA pergunta de follow-up contextual.
Exemplo: "Quer me dizer o motivo?" ou "Quantas horas dormiu?"`;

    default:
      return "";
  }
}

/**
 * Executa o parser apropriado baseado na classificação
 */
async function runParser(
  message: string,
  classification: ClassificationResult,
  mealHistory?: Meal[]
): Promise<ParsedData> {
  // Só parseia declarações
  if (classification.type !== "declaration") {
    return null;
  }

  switch (classification.subtype) {
    case "food": {
      const data = await parseFood(message, mealHistory);
      return { type: "food", data };
    }
    case "exercise": {
      const data = await parseExercise(message);
      return { type: "exercise", data };
    }
    case "weight": {
      const data = await parseWeight(message);
      return data ? { type: "weight", data } : null;
    }
    case "bodyfat": {
      const data = await parseBodyFat(message);
      return data ? { type: "bodyfat", data } : null;
    }
    case "glucose": {
      const data = await parseGlucose(message);
      return data ? { type: "glucose", data } : null;
    }
    default:
      return null;
  }
}

/**
 * Envia mensagem para a AI e retorna resposta com classificação
 *
 * @param userMessage Mensagem do usuário
 * @param chatHistory Histórico de mensagens do chat
 * @param profile Perfil do usuário
 * @param mealHistory Histórico de refeições (últimas 30) para contexto - localStorage
 * @param supabaseContext Contexto completo do Supabase (quando logado)
 */
export async function sendMessage(
  userMessage: string,
  chatHistory: ChatMessage[],
  profile: UserProfile,
  mealHistory?: Meal[],
  supabaseContext?: UserContext
): Promise<ChatResponse> {
  const client = getOpenAIClient();

  // Classifica a mensagem primeiro
  const classification = await classifyMessage(userMessage, chatHistory);

  // Executa parser em paralelo com a geração de resposta
  const parserPromise = runParser(userMessage, classification, mealHistory);

  // Adiciona instruções específicas baseadas no tipo
  const typeInstructions = getTypeSpecificInstructions(classification);

  // Prioriza contexto do Supabase (mais completo) sobre localStorage
  let userContext = "";
  if (supabaseContext) {
    userContext = "\n\n# HISTÓRICO DO USUÁRIO (Supabase)\n" + formatUserContextForPrompt(supabaseContext);
  } else if (mealHistory && mealHistory.length > 0) {
    userContext = "\n\n" + generateUserContext(mealHistory);
  }

  const systemPrompt = generateSystemPrompt(profile) + typeInstructions + userContext;

  // Converte histórico para formato OpenAI
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...chatHistory.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    { role: "user", content: userMessage },
  ];

  const [aiResponse, parsedData] = await Promise.all([
    callOpenAIWithRetry(() =>
      client.chat.completions.create({
        model: OPENAI_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 500,
      })
    ),
    parserPromise,
  ]);

  const responseText = aiResponse.choices[0]?.message?.content || "Desculpe, não consegui processar sua mensagem.";

  return {
    response: responseText,
    classification,
    parsedData,
  };
}

/**
 * Gera um ID único para mensagens
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
