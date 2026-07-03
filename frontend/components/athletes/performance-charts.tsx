"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";

const METRICS = [
  { name: "Week 1", strikeRate: 118, sprint: 26.1, intensity: 62 },
  { name: "Week 2", strikeRate: 128, sprint: 27.0, intensity: 68 },
  { name: "Week 3", strikeRate: 135, sprint: 27.8, intensity: 71 },
  { name: "Week 4", strikeRate: 142, sprint: 28.3, intensity: 75 },
  { name: "Week 5", strikeRate: 150, sprint: 28.9, intensity: 78 },
];

export function PerformanceCharts() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-semibold mb-1">Strike Rate Trend</h3>
        <p className="text-[10px] text-foreground/40 mb-4 font-mono">from recall() metrics</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={METRICS}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 10 }} />
            <YAxis tick={{ fill: "#71717a", fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
            <Line type="monotone" dataKey="strikeRate" stroke="#7C3AED" strokeWidth={2} dot={{ fill: "#7C3AED" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="glass rounded-2xl p-6">
        <h3 className="text-sm font-semibold mb-1">Sprint Speed & Intensity</h3>
        <p className="text-[10px] text-foreground/40 mb-4 font-mono">video worker → remember()</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={METRICS}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 10 }} />
            <YAxis tick={{ fill: "#71717a", fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
            <Bar dataKey="sprint" fill="#06B6D4" radius={[4, 4, 0, 0]} />
            <Bar dataKey="intensity" fill="#7C3AED" radius={[4, 4, 0, 0]} opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
