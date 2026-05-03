const VARIANTS = {
  primary:
    "bg-accent text-bg hover:bg-accent/90 active:bg-accent/80 disabled:opacity-60 disabled:cursor-not-allowed",
  secondary:
    "bg-transparent text-text-primary border border-border hover:bg-white/5 disabled:opacity-60",
  danger:
    "bg-loss/10 text-loss border border-loss/30 hover:bg-loss/20 disabled:opacity-60",
  ghost:
    "bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/5",
};

const SIZES = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-sm",
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus:outline-none focus:ring-2 focus:ring-accent/50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
