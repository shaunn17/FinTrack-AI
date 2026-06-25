import { useEffect, useRef, useState } from "react";
import Navbar from "../components/layout/Navbar";
import Button from "../components/shared/Button";
import { getApiErrorMessage, sendChatMessage } from "../services/api";

const STARTER_PROMPTS = [
  "How much did I spend this month?",
  "Portfolio summary",
  "Biggest expenses last week",
];

function ChatBubble({ role, content }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-accent/15 text-text-primary border border-accent/25 rounded-br-md"
            : "bg-surface border border-border text-text-primary rounded-bl-md"
        }`}
      >
        {content}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-surface border border-border rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-text-muted animate-pulse" />
        <span className="h-2 w-2 rounded-full bg-text-muted animate-pulse [animation-delay:150ms]" />
        <span className="h-2 w-2 rounded-full bg-text-muted animate-pulse [animation-delay:300ms]" />
      </div>
    </div>
  );
}

export default function AskFinTrack() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setError(null);
    const userMsg = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const history = messages.slice(-10).map(({ role, content }) => ({
        role,
        content,
      }));
      const { reply } = await sendChatMessage(trimmed, history);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(getApiErrorMessage(err));
      setMessages((prev) => prev.slice(0, -1));
      setInput(trimmed);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const showStarters = messages.length === 0 && !loading;

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] md:h-[calc(100vh-4rem)] max-h-[900px]">
      <Navbar
        title="Ask FinTrack"
        subtitle="Ask anything about your spending and investments"
      />

      <div className="flex-1 flex flex-col min-h-0 bg-surface/40 border border-border rounded-xl overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
          {showStarters && (
            <div className="flex flex-col items-center justify-center h-full text-center px-2">
              <div className="h-12 w-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
                <AskIcon className="h-6 w-6 text-accent" />
              </div>
              <p className="text-text-secondary text-sm max-w-md mb-5">
                I can answer questions about your budget, income, spending, and
                portfolio using your FinTrack data.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="text-xs sm:text-sm px-3 py-2 rounded-full border border-border bg-surface hover:bg-white/5 text-text-secondary hover:text-text-primary transition"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <ChatBubble key={i} role={msg.role} content={msg.content} />
          ))}

          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="px-4 py-2 text-sm text-loss bg-loss/10 border-t border-loss/20">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="border-t border-border bg-surface p-3 sm:p-4 flex gap-2 items-end"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about spending, income, or your portfolio…"
            rows={1}
            disabled={loading}
            className="flex-1 resize-none rounded-lg bg-bg border border-border px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60 min-h-[42px] max-h-32"
          />
          <Button type="submit" disabled={loading || !input.trim()} className="shrink-0">
            {loading ? "…" : "Send"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function AskIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path
        d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4v8z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 10h6M9 14h4" strokeLinecap="round" />
    </svg>
  );
}
