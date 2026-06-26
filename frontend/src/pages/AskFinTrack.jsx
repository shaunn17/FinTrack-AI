import { useEffect, useRef, useState } from "react";
import ChatMessage, { TypingIndicator } from "../components/ask/ChatMessage";
import StarterCards from "../components/ask/StarterCards";
import Navbar from "../components/layout/Navbar";
import Button from "../components/shared/Button";
import { getApiErrorMessage, sendChatMessage } from "../services/api";

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

  const showEmptyState = messages.length === 0 && !loading;

  function getPrecedingUserMessage(index) {
    for (let i = index - 1; i >= 0; i -= 1) {
      if (messages[i].role === "user") return messages[i].content;
    }
    return "";
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] md:h-[calc(100vh-4rem)] max-h-[900px]">
      <Navbar
        title="Ask FinTrack"
        subtitle="Ask anything about your spending and investments"
      />

      <div className="flex-1 flex flex-col min-h-0 card overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
          {showEmptyState && <StarterCards onSelect={sendMessage} />}

          {messages.map((msg, i) => (
            <ChatMessage
              key={i}
              role={msg.role}
              content={msg.content}
              precedingUserMessage={getPrecedingUserMessage(i)}
              showFollowUps={msg.role === "assistant"}
              onFollowUp={sendMessage}
              followUpsDisabled={loading}
            />
          ))}

          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="px-4 py-2 text-sm text-loss bg-loss/10 border-t border-loss/20">
            {error}
          </div>
        )}

        <div className="shrink-0 border-t border-border bg-surface">
          <form
            onSubmit={handleSubmit}
            className="p-3 sm:p-4 flex gap-2 items-end"
          >
            <div className="flex-1 min-w-0">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about spending, income, or your portfolio…"
                rows={1}
                disabled={loading}
                className="w-full resize-none rounded-xl bg-bg border border-border px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:opacity-60 min-h-[44px] max-h-32"
              />
              <p className="hidden sm:block text-[10px] text-text-muted mt-1.5 px-1">
                Enter to send
              </p>
            </div>
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="shrink-0 mb-0 sm:mb-5"
            >
              {loading ? "…" : "Send"}
            </Button>
          </form>
          <p className="text-center text-[10px] text-text-muted pb-3 px-4 -mt-1">
            Chat clears when you refresh
          </p>
        </div>
      </div>
    </div>
  );
}
