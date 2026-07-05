"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";

interface ChartPoint {
  name: string;
  strikeRate?: number;
  sprint?: number;
  intensity?: number;
}

function parseMetricsFromSummaries(entries: { summary: string }[]): ChartPoint[] {
  return entries
    .map((entry, i) => {
      const text = entry.summary;
      const strikeMatch = text.match(/strike[_ ]?rate[=:\s]+(\d+(?:\.\d+)?)/i) ?? text.match(/SR (\d+(?:\.\d+)?)/i);
      const sprintMatch = text.match(/sprint[^(]*(\d+(?:\.\d+)?)\s*km\/h/i);
      const intensityMatch = text.match(/intensity[^(]*(\d+(?:\.\d+)?)\s*%/i);
      const strikeRate = strikeMatch ? Number(strikeMatch[1]) : undefined;
      const sprint = sprintMatch ? Number(sprintMatch[1]) : undefined;
      const intensity = intensityMatch ? Number(intensityMatch[1]) : undefined;
      if (strikeRate === undefined && sprint === undefined && intensity === undefined) return null;
      return { name: `M${i + 1}`, strikeRate, sprint, intensity };
    })
    .filter((p): p is ChartPoint => p !== null);
}

export function PerformanceCharts({ entries }: { entries: { summary: string }[] }) {
  const data = parseMetricsFromSummaries(entries);

  if (data.length === 0) {
    return (
      <div className="glass rounded-2xl p-6">
        <p className="text-sm text-foreground/40">
          No chartable metrics yet — upload video or wearable JSON sessions to build performance history.
        </p>
      </div>
    );
  }

  const hasStrike = data.some((d) => d.strikeRate !== undefined);
  const hasSprint = data.some((d) => d.sprint !== undefined || d.intensity !== undefined);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {hasStrike && (
        <div className="glass rounded-2xl p-6">
          <h3 className="text-sm font-semibold mb-1">Strike Rate</h3>
          <p className="text-[10px] text-foreground/40 mb-4 font-mono">parsed from recall() summaries</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 10 }} />
              <YAxis tick={{ fill: "#71717a", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
              <Line type="monotone" dataKey="strikeRate" stroke="#7C3AED" strokeWidth={2} dot={{ fill: "#7C3AED" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {hasSprint && (
        <div className="glass rounded-2xl p-6">
          <h3 className="text-sm font-semibold mb-1">Sprint Speed & Intensity</h3>
          <p className="text-[10px] text-foreground/40 mb-4 font-mono">parsed from recall() summaries</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 10 }} />
              <YAxis tick={{ fill: "#71717a", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
              <Bar dataKey="sprint" fill="#06B6D4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="intensity" fill="#7C3AED" radius={[4, 4, 0, 0]} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
