import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

/**
 * MessageBubble - Bolha de mensagem do chat
 *
 * - Usuario: alinhado a direita, fundo laranja
 * - AI: alinhado a esquerda, fundo surface
 */
export function MessageBubble({ role, content, timestamp }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex w-full items-end gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary/20 text-primary" : "bg-icon-bg text-primary"
        )}
      >
        <span
          className={cn(
            "material-symbols-outlined text-[18px]",
            isUser && "fill-1"
          )}
        >
          {isUser ? "person" : "smart_toy"}
        </span>
      </div>

      {/* Conteudo */}
      <div
        className={cn(
          "flex max-w-[85%] flex-col gap-1",
          isUser ? "items-end" : "items-start"
        )}
      >
        <span className="text-xs text-text-secondary">
          {isUser ? "Voce" : "Fit AI"}
        </span>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-[15px] leading-relaxed",
            isUser
              ? "bg-primary text-white shadow-md shadow-primary/20 rounded-br-sm"
              : "bg-surface-dark text-text-floral rounded-bl-sm"
          )}
        >
          {content.split("\n").map((line, i) => (
            <span key={i}>
              {line}
              {i < content.split("\n").length - 1 && <br />}
            </span>
          ))}
        </div>

        {timestamp && (
          <span className="text-xs text-text-secondary">
            {new Date(timestamp).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>
    </div>
  );
}
