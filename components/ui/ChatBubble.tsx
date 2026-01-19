"use client";

// ========================================
// CHAT BUBBLE - Bolhas de mensagem
// ========================================
// 2 variantes:
// 1. AI - Mensagem da IA (esquerda, fundo escuro)
// 2. User - Mensagem do usuário (direita, fundo laranja)

interface ChatBubbleProps {
  variant: "ai" | "user";
  message: string;
  avatarUrl?: string;
  name?: string;
  timestamp?: string;
}

export function ChatBubble({
  variant,
  message,
  avatarUrl,
  name,
  timestamp,
}: ChatBubbleProps) {
  const isAI = variant === "ai";

  // Nomes padrão
  const displayName = name || (isAI ? "Fit AI" : "Você");

  // Avatar padrão (placeholder)
  const defaultAvatar = isAI
    ? "/ai-avatar.png" // Você pode adicionar uma imagem depois
    : "/user-avatar.png";

  return (
    <div
      className={`flex items-end gap-3 max-w-[85%] ${
        isAI ? "self-start" : "self-end flex-row-reverse"
      }`}
    >
      {/* Avatar */}
      <div
        className={`
          bg-center bg-no-repeat bg-cover rounded-full w-8 h-8 shrink-0 overflow-hidden shadow-sm
          ${!isAI ? "border-2 border-primary/20" : ""}
          ${!avatarUrl ? "bg-surface-dark flex items-center justify-center" : ""}
        `}
        style={avatarUrl ? { backgroundImage: `url('${avatarUrl}')` } : {}}
      >
        {!avatarUrl && (
          <span className="material-symbols-outlined text-[16px] text-text-secondary">
            {isAI ? "smart_toy" : "person"}
          </span>
        )}
      </div>

      {/* Message */}
      <div
        className={`flex flex-col gap-1 ${isAI ? "items-start" : "items-end"}`}
      >
        {/* Name */}
        <span className={`text-xs text-text-secondary ${isAI ? "ml-1" : "mr-1"}`}>
          {displayName}
        </span>

        {/* Bubble */}
        <div
          className={`
            p-4 rounded-2xl
            ${
              isAI
                ? "bg-surface-dark rounded-bl-sm"
                : "bg-primary rounded-br-sm shadow-md shadow-primary/20"
            }
          `}
        >
          <p
            className={`text-[15px] leading-relaxed ${
              isAI ? "text-text-floral" : "text-white"
            }`}
          >
            {message}
          </p>
        </div>

        {/* Timestamp (opcional) */}
        {timestamp && (
          <span className={`text-[10px] text-text-muted ${isAI ? "ml-1" : "mr-1"}`}>
            {timestamp}
          </span>
        )}
      </div>
    </div>
  );
}

// ========================================
// CHAT BUBBLE AI - Atalho para mensagem da IA
// ========================================
interface ChatBubbleAIProps {
  message: string;
  avatarUrl?: string;
  timestamp?: string;
}

export function ChatBubbleAI({ message, avatarUrl, timestamp }: ChatBubbleAIProps) {
  return (
    <ChatBubble
      variant="ai"
      message={message}
      avatarUrl={avatarUrl}
      timestamp={timestamp}
    />
  );
}

// ========================================
// CHAT BUBBLE USER - Atalho para mensagem do usuário
// ========================================
interface ChatBubbleUserProps {
  message: string;
  avatarUrl?: string;
  timestamp?: string;
}

export function ChatBubbleUser({ message, avatarUrl, timestamp }: ChatBubbleUserProps) {
  return (
    <ChatBubble
      variant="user"
      message={message}
      avatarUrl={avatarUrl}
      timestamp={timestamp}
    />
  );
}
