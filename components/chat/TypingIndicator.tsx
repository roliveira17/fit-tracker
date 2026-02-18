/**
 * TypingIndicator - Indicador de "digitando..." da AI
 */
export function TypingIndicator() {
  return (
    <div className="flex w-full items-end gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm text-green-500">
        <span className="material-symbols-outlined text-[18px]">spa</span>
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-white shadow-soft px-4 py-3">
        <span className="h-2 w-2 animate-bounce rounded-full bg-calma-primary/30 [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-calma-primary/30 [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-calma-primary/30" />
      </div>
    </div>
  );
}
