/**
 * TypingIndicator - Indicador de "digitando..." da AI
 */
export function TypingIndicator() {
  return (
    <div className="flex w-full items-end gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-icon-bg text-primary">
        <span className="material-symbols-outlined text-[18px]">smart_toy</span>
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-surface-dark px-4 py-3">
        <span className="h-2 w-2 animate-bounce rounded-full bg-text-secondary [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-text-secondary [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-text-secondary" />
      </div>
    </div>
  );
}
