const STARTER_CARDS = [
  {
    title: "Spending this month",
    question: "How much have I spent so far?",
  },
  {
    title: "May breakdown",
    question: "Show my May 2026 spending",
  },
  {
    title: "Portfolio summary",
    question: "How is my portfolio doing?",
  },
  {
    title: "Biggest categories",
    question: "Where does most of my money go?",
  },
];

function SparkleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2l1.2 4.2L17.4 7.5 13.2 8.7 12 13l-1.2-4.3L6.6 7.5l4.2-1.3L12 2zm7 7l.8 2.8L22.8 12l-3 .8L19 16l-.8-3.2L15.2 12l3-.8L19 9zm-14 0l.8 2.8L8.8 12l-3 .8L6 16l-.8-3.2L2.2 12l3-.8L5 9z" />
    </svg>
  );
}

export default function StarterCards({ onSelect }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-2 py-6">
      <div className="h-14 w-14 rounded-2xl bg-accent/10 border border-accent/25 flex items-center justify-center mb-5">
        <SparkleIcon className="h-7 w-7 text-accent" />
      </div>
      <h2 className="text-xl sm:text-2xl font-semibold text-text-primary mb-2">
        Ask anything about your money
      </h2>
      <p className="text-sm text-text-secondary max-w-md mb-8">
        Get answers about your spending, budget, income, and portfolio using your
        FinTrack data.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        {STARTER_CARDS.map(({ title, question }) => (
          <button
            key={title}
            type="button"
            onClick={() => onSelect(question)}
            className="card p-4 text-left hover:border-accent/40 hover:bg-white/[0.02] transition group"
          >
            <p className="text-sm font-medium text-text-primary group-hover:text-accent transition">
              {title}
            </p>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">{question}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
