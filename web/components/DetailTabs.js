"use client";

import { useMemo, useState } from "react";

function formatUsd(value) {
  if (value === null || value === undefined) return "—";
  return `$${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export default function DetailTabs({ tokens, nfts, transactions }) {
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
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            active === "nfts"
              ? "bg-sky-400 text-slate-950"
              : "border border-slate-700 text-slate-300"
          }`}
          onClick={() => setActive("nfts")}
        >
          NFT明细
        </button>
        <button
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            active === "txs"
              ? "bg-sky-400 text-slate-950"
              : "border border-slate-700 text-slate-300"
          }`}
          onClick={() => setActive("txs")}
        >
          交易历史
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

      {active === "nfts" && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(nfts || []).length === 0 && (
            <div className="text-sm text-slate-500">暂无NFT数据</div>
          )}
          {(nfts || []).map((nft, index) => (
            <div
              key={`${nft.name}-${index}`}
              className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
            >
              <div className="aspect-square w-full overflow-hidden rounded-xl bg-slate-900">
                {nft.image ? (
                  <img
                    src={nft.image}
                    alt={nft.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                    无图片
                  </div>
                )}
              </div>
              <div className="mt-3 text-sm font-semibold text-slate-100">
                {nft.name}
              </div>
              {nft.collection && (
                <div className="text-xs text-slate-500">
                  {nft.collection}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {active === "txs" && (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="pb-3">时间</th>
                <th className="pb-3">类型</th>
                <th className="pb-3">状态</th>
                <th className="pb-3">手续费</th>
                <th className="pb-3">签名</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {(transactions || []).length === 0 && (
                <tr>
                  <td className="py-4 text-slate-500" colSpan={5}>
                    暂无交易数据
                  </td>
                </tr>
              )}
              {(transactions || []).map((tx, index) => (
                <tr key={`${tx.signature}-${index}`}>
                  <td className="py-4 text-xs text-slate-300">
                    {tx.blockTime
                      ? new Date(tx.blockTime).toLocaleString()
                      : "—"}
                  </td>
                  <td className="py-4 text-xs text-slate-300">
                    {tx.type || "Unknown"}
                  </td>
                  <td className="py-4 text-xs text-slate-300">
                    {tx.status}
                  </td>
                  <td className="py-4 text-xs text-slate-300">
                    {tx.feeSol ? `${tx.feeSol} SOL` : "—"}
                  </td>
                  <td className="py-4 text-xs text-slate-400">
                    {tx.signature.slice(0, 8)}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
