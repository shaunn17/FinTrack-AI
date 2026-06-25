import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { theme, formatCategory, formatMoney } from "../../styles/theme";

const tooltipContentStyle = {
  backgroundColor: theme.colors.surface,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: 8,
  padding: "8px 12px",
};

const tooltipLabelStyle = {
  color: theme.colors.text.primary,
  fontWeight: 600,
  fontSize: 12,
  marginBottom: 2,
};

const tooltipItemStyle = {
  color: theme.colors.text.secondary,
  fontSize: 12,
};

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  const name = label ?? entry?.name;
  return (
    <div style={tooltipContentStyle}>
      <p style={tooltipLabelStyle}>{formatCategory(name)}</p>
      <p style={tooltipItemStyle}>{formatMoney(entry.value)}</p>
    </div>
  );
}

function colorFor(name) {
  return theme.categoryColors[name] || theme.colors.accent2;
}

function renderDonutLabel({ percent, cx, cy, midAngle, innerRadius, outerRadius }) {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill={theme.colors.text.primary}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={500}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export { colorFor };

export default function Chart({
  type = "donut",
  data = [],
  height = 260,
  showPercentLabels = false,
}) {
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
            content={<ChartTooltip />}
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
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
          label={showPercentLabels ? renderDonutLabel : false}
          labelLine={false}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={colorFor(entry.name)} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
}
