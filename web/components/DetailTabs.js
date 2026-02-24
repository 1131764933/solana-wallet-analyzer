"use client";

import { useMemo, useState } from "react";

function formatUsd(value) {
  if (value === null || value === undefined) return "—";
  return `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function DetailTabs({ tokens }) {
  const [active, setActive] = useState("tokens");

  const sortedTokens = useMemo(() => {
    return [...tokens].sort((a, b) => (b.valueUsd || 0) - (a.valueUsd || 0));
  }, [tokens]);

  return (
    <section className="glass-panel rounded-3xl p-6 md:p-8">
      <div className="flex flex-wrap gap-3">
        <button
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            active === "tokens"
              ? "bg-sky-400 text-slate-950"
              : "border border-slate-700 text-slate-300"
          }`}
          onClick={() => setActive("tokens")}
        >
          代币明细
        </button>
        <button
          className="rounded-full border border-slate-800 px-4 py-2 text-sm text-slate-500"
          disabled
        >
          NFT明细（后续）
        </button>
        <button
          className="rounded-full border border-slate-800 px-4 py-2 text-sm text-slate-500"
          disabled
        >
          交易历史（后续）
        </button>
      </div>

      {active === "tokens" && (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="pb-3">代币</th>
                <th className="pb-3">数量</th>
                <th className="pb-3">单价</th>
                <th className="pb-3">市值</th>
                <th className="pb-3">盈亏</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {sortedTokens.map((token, index) => (
                <tr
                  key={`${token.symbol}-${token.name}-${index}`}
                  className="text-sm"
                >
                  <td className="py-4">
                    <div className="font-semibold text-slate-100">
                      {token.symbol}
                    </div>
                    <div className="text-xs text-slate-500">{token.name}</div>
                  </td>
                  <td className="py-4">
                    {Number(token.amount).toLocaleString(undefined, {
                      maximumFractionDigits: 4,
                    })}
                  </td>
                  <td className="py-4">{formatUsd(token.priceUsd)}</td>
                  <td className="py-4">{formatUsd(token.valueUsd)}</td>
                  <td className="py-4 text-slate-500">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
