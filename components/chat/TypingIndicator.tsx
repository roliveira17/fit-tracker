import { Bot } from "lucide-react";

/**
 * TypingIndicator - Indicador de "digitando..." da AI
 */
export function TypingIndicator() {
  return (
    <div className="flex gap-3 w-full">
      {/* Avatar */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
        <Bot className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Bolinha animada */}
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-muted px-4 py-3">
        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
      </div>
    </div>
  );
}
