import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { theme, formatCategory, formatMoney } from "../../styles/theme";

const tooltipStyle = {
  backgroundColor: theme.colors.surface,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: 8,
  color: theme.colors.text.primary,
  fontSize: 12,
};

function colorFor(name) {
  return theme.categoryColors[name] || theme.colors.accent2;
}

export default function Chart({ type = "donut", data = [], height = 260 }) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-text-secondary text-sm"
        style={{ height }}
      >
        No data to display
      </div>
    );
  }

  if (type === "bar") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 8 }}>
          <XAxis
            dataKey="name"
            stroke={theme.colors.text.secondary}
            fontSize={11}
            tickFormatter={(v) => formatCategory(v).split(" ")[0]}
          />
          <YAxis
            stroke={theme.colors.text.secondary}
            fontSize={11}
            tickFormatter={(v) => `$${v}`}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => formatMoney(value)}
            labelFormatter={(label) => formatCategory(label)}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={colorFor(entry.name)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="55%"
          outerRadius="85%"
          paddingAngle={2}
          stroke="none"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={colorFor(entry.name)} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value) => formatMoney(value)}
          labelFormatter={(label) => formatCategory(label)}
        />
        <Legend
          formatter={(v) => (
            <span style={{ color: theme.colors.text.secondary, fontSize: 11 }}>
              {formatCategory(v)}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
