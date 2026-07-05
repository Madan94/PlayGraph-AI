"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

interface ChartPoint {
  name: string;
  strikeRate?: number;
  sprint?: number;
  intensity?: number;
}

function parseMetricsFromSummaries(entries: { summary: string }[]): ChartPoint[] {
  const points: ChartPoint[] = [];

  entries.forEach((entry, i) => {
    const text = entry.summary;
    const strikeMatch =
      text.match(/strike[_ ]?rate[=:\s]+(\d+(?:\.\d+)?)/i) ?? text.match(/SR (\d+(?:\.\d+)?)/i);
    const sprintMatch = text.match(/sprint[^(]*(\d+(?:\.\d+)?)\s*km\/h/i);
    const intensityMatch = text.match(/intensity[^(]*(\d+(?:\.\d+)?)\s*%/i);
    const strikeRate = strikeMatch ? Number(strikeMatch[1]) : undefined;
    const sprint = sprintMatch ? Number(sprintMatch[1]) : undefined;
    const intensity = intensityMatch ? Number(intensityMatch[1]) : undefined;

    if (strikeRate !== undefined || sprint !== undefined || intensity !== undefined) {
      points.push({ name: `M${i + 1}`, strikeRate, sprint, intensity });
    }
  });

  return points;
}

const tooltipStyle = {
  background: "#FFFFFF",
  border: "1px solid #F3F4F6",
  borderRadius: 8,
  color: "#000000",
  fontSize: 12,
};

export function PerformanceCharts({ entries }: { entries: { summary: string }[] }) {
  const data = parseMetricsFromSummaries(entries);

  if (data.length === 0) {
    return (
      <div className="glass p-6">
        <p className="text-sm text-muted">
          No chartable metrics yet — upload video or wearable JSON sessions to build performance
          history.
        </p>
      </div>
    );
  }

  const hasStrike = data.some((d) => d.strikeRate !== undefined);
  const hasSprint = data.some((d) => d.sprint !== undefined || d.intensity !== undefined);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {hasStrike && (
        <div className="glass p-6">
          <h3 className="section-title mb-1 text-sm">Strike Rate</h3>
          <p className="mb-4 font-mono text-[10px] text-gray-400">parsed from recall() summaries</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="name" tick={{ fill: "#4B5563", fontSize: 10 }} />
              <YAxis tick={{ fill: "#4B5563", fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="strikeRate" stroke="#0066FF" strokeWidth={2} dot={{ fill: "#0066FF" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {hasSprint && (
        <div className="glass p-6">
          <h3 className="section-title mb-1 text-sm">Sprint Speed & Intensity</h3>
          <p className="mb-4 font-mono text-[10px] text-gray-400">parsed from recall() summaries</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="name" tick={{ fill: "#4B5563", fontSize: 10 }} />
              <YAxis tick={{ fill: "#4B5563", fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="sprint" fill="#0066FF" radius={[4, 4, 0, 0]} />
              <Bar dataKey="intensity" fill="#94A3B8" radius={[4, 4, 0, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
