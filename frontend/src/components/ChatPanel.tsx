import { Loader2, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { formatRetryDelay, getRateLimit, sendChatMessage } from "../api/client";

/**
 * `as const satisfies readonly string[]`: `satisfies` checks the contract
 * without widening, so the array keeps its literal element types (useful if a
 * suggestion is ever referenced by value) while still being rejected if a
 * non-string sneaks in. A plain `: readonly string[]` annotation would widen
 * every entry to `string`; an `as` assertion would check nothing.
 */
const SUGGESTIONS = [
  "Quel est le total de mes cotisations retraite sur les 4 derniers mois ?",
  "Somme des cotisations sociales sur 6 mois",
  "Quelle est la moyenne de mon net à payer ?",
  "À quoi correspond la ligne Sécurité Sociale Déplafonnée ?",
] as const satisfies readonly string[];

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const send = async (text: string): Promise<void> => {
    const content = text.trim();
    if (!content || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", content }]);
    setInput("");
    setIsLoading(true);

    try {
      const reply = await sendChatMessage(content);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (error) {
      const rateLimit = getRateLimit(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: rateLimit
            ? `Limite de questions atteinte pour cette heure. Réessayez ${formatRetryDelay(rateLimit)}.`
            : "Désolé, une erreur est survenue. Vérifiez que le serveur backend est bien lancé.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-surface-raised">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">Assistant InfoPay</h2>
        <p className="text-xs text-ink-soft">Calculs exacts et explications sur vos bulletins</p>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-medium text-ink-soft">
              <Sparkles className="h-3.5 w-3.5" />
              Suggestions
            </p>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  void send(s);
                }}
                className="block w-full rounded-md border border-border px-3 py-2 text-left text-sm text-ink-soft transition-colors hover:border-accent hover:text-ink"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-accent text-white"
                  : "bg-surface text-ink border border-border"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink-soft">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Analyse en cours…
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
          }}
          placeholder="Posez une question sur vos bulletins…"
          className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-white disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
