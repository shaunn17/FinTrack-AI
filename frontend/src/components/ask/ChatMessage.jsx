import FollowUpChips from "./FollowUpChips";

function AssistantAvatar() {
  return (
    <div
      className="shrink-0 h-7 w-7 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center"
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-3.5 w-3.5 text-accent"
      >
        <path
          d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function ChatMessage({
  role,
  content,
  precedingUserMessage,
  showFollowUps = false,
  onFollowUp,
  followUpsDisabled = false,
}) {
  const isUser = role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-br-md px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap bg-accent/15 text-text-primary border border-accent/30">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-start gap-2">
        <AssistantAvatar />
        <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-bl-md px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap card text-text-primary">
          {content}
        </div>
      </div>
      {showFollowUps && (
        <FollowUpChips
          userQuestion={precedingUserMessage}
          assistantContent={content}
          onSelect={onFollowUp}
          disabled={followUpsDisabled}
        />
      )}
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex justify-start gap-2 animate-fade-in">
      <AssistantAvatar />
      <div className="card rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2.5">
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse [animation-delay:300ms]" />
        </div>
        <span className="text-xs text-text-muted">Looking at your finances…</span>
      </div>
    </div>
  );
}
