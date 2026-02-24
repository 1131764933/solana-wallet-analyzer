"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const COLORS = ["#38bdf8", "#22d3ee", "#f97316", "#a855f7", "#10b981"];

function formatUsd(value) {
  if (value === null || value === undefined) return "—";
  return `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-100">{value}</p>
    </div>
  );
}

export default function OverviewCard({ overview, distribution }) {
  return (
    <section className="glass-panel rounded-3xl p-6 md:p-8">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="h-64 w-full lg:w-1/2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={distribution}
                dataKey="value"
                nameKey="name"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={3}
              >
                {distribution.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.name}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [formatUsd(value), name]}
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: 12,
                }}
                itemStyle={{ color: "#e2e8f0" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex w-full flex-col gap-4 lg:w-1/2">
          <h2 className="text-xl font-semibold text-slate-100">资产概览</h2>
          <p className="text-sm text-slate-400">
            快速看到资产结构与价值分布
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Stat label="钱包总资产" value={formatUsd(overview.totalValueUsd)} />
            <Stat label="今日盈亏" value={formatUsd(overview.pnlToday)} />
            <Stat label="本周盈亏" value={formatUsd(overview.pnlWeek)} />
            <Stat label="交易次数" value={overview.txCount ?? "—"} />
          </div>
        </div>
      </div>
    </section>
  );
}
