import { theme, formatCategory } from "../../styles/theme";

export default function Badge({ category, children, className = "" }) {
  const color = theme.categoryColors[category] || "#94a3b8";
  return (
    <span
      className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border ${className}`}
      style={{
        color,
        borderColor: `${color}55`,
        backgroundColor: `${color}14`,
      }}
    >
      {children ?? formatCategory(category)}
    </span>
  );
}
