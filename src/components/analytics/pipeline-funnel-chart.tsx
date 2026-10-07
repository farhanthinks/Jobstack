"use client";

import { useTheme } from "next-themes";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FunnelPoint } from "@/lib/analytics";

// Ordinal ramp (one hue, monotone lightness) — validated with
// scripts/validate_palette.js --ordinal for both light and dark surfaces.
const RAMP_LIGHT = ["#60a5fa", "#3b82f6", "#2563eb", "#1e40af", "#172554"];
const RAMP_DARK = ["#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6", "#2563eb"];

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: FunnelPoint }[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-semibold text-popover-foreground">{point.count}</p>
      <p className="text-xs text-muted-foreground">{point.label}</p>
    </div>
  );
}

export function PipelineFunnelChart({ data }: { data: FunnelPoint[] }) {
  const { resolvedTheme } = useTheme();
  const ramp = resolvedTheme === "dark" ? RAMP_DARK : RAMP_LIGHT;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 32, bottom: 4, left: 4 }}
        barCategoryGap={12}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="label"
          tickLine={false}
          axisLine={false}
          width={80}
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
        />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {data.map((entry, index) => (
            <Cell key={entry.stage} fill={ramp[index % ramp.length]} />
          ))}
          <LabelList
            dataKey="count"
            position="right"
            style={{ fill: "var(--foreground)", fontSize: 12, fontWeight: 500 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
