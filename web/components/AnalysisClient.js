"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isValidSolanaAddress } from "../lib/solana";
import OverviewCard from "./OverviewCard";
import DetailTabs from "./DetailTabs";
import AISummary from "./AISummary";
import Monetization from "./Monetization";
import ShareLink from "./ShareLink";

function buildDeepSummary({ distribution }) {
  if (!distribution || distribution.length === 0) return "";
  const total = distribution.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0) return "";
  const sol = distribution.find((item) => item.name === "SOL");
  const stable = distribution.find((item) => item.name === "Stable");
  const meme = distribution.find((item) => item.name === "Meme");

  const pct = (value) => Math.round((value / total) * 100);
  const parts = [];

  if (sol) parts.push(`SOL占比${pct(sol.value)}%`);
  if (stable) parts.push(`稳定币占比${pct(stable.value)}%`);
  if (meme) parts.push(`Meme占比${pct(meme.value)}%`);

  return `付费版提示：${parts.join("，")}。建议根据风险偏好调整仓位。`;
}

export default function AnalysisClient({ address }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [proUnlocked, setProUnlocked] = useState(false);
  const [checkingPro, setCheckingPro] = useState(true);
  const [localUnlocked, setLocalUnlocked] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [nextAddress, setNextAddress] = useState("");
  const [inputError, setInputError] = useState("");
  const router = useRouter();

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/analyze?address=${address}`);
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json?.error || "加载失败");
        }
        if (!ignore) {
          setData(json);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "加载失败");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [address]);

  useEffect(() => {
    let ignore = false;
    const local = localStorage.getItem("solana-wallet-pro") === "true";
    setLocalUnlocked(local);
    const saved = JSON.parse(localStorage.getItem("recent_addresses") || "[]");
    const next = [address, ...saved.filter((a) => a !== address)].slice(0, 5);
    localStorage.setItem("recent_addresses", JSON.stringify(next));

    async function checkStatus() {
      try {
        const res = await fetch("/api/pay/status");
        const json = await res.json();
        if (!ignore) {
          const unlocked = Boolean(json.unlocked);
          setProUnlocked(unlocked);
          setCheckingPro(false);
          localStorage.setItem("solana-wallet-pro", unlocked ? "true" : "false");
          setLocalUnlocked(unlocked);
        }
      } catch (err) {
        if (!ignore) {
          setCheckingPro(false);
        }
      }
    }

    checkStatus();
    return () => {
      ignore = true;
    };
  }, []);

  const deepSummary = useMemo(
    () => buildDeepSummary({ distribution: data?.distribution }),
    [data]
  );

  const handleUnlock = () => {
    setProUnlocked(true);
    localStorage.setItem("solana-wallet-pro", "true");
    setLocalUnlocked(true);
  };

  const handleDownload = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `solana-wallet-report-${address}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleGo = () => {
    const trimmed = nextAddress.trim();
    if (!trimmed) {
      setInputError("请输入钱包地址");
      return;
    }
    if (!isValidSolanaAddress(trimmed)) {
      setInputError("地址格式不正确");
      return;
    }
    setInputError("");
    setShowSearch(false);
    router.push(`/analyze/${trimmed}`);
  };

  if (loading) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-6">
        <div className="glass-panel rounded-3xl px-10 py-12 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
            分析中
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-100">
            正在生成资产报告...
          </h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-6">
        <div className="glass-panel rounded-3xl p-10 text-center">
          <h2 className="text-2xl font-semibold text-rose-200">
            数据加载失败，请重试
          </h2>
          <p className="mt-3 text-sm text-slate-400">{error}</p>
          <p className="mt-4 text-xs text-slate-500">
            请检查地址或稍后重试。
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-800 px-4 py-2 text-xs text-slate-300 transition hover:border-sky-400"
          >
            返回首页
          </Link>
          <button
            className="inline-flex items-center gap-2 rounded-full border border-slate-800 px-4 py-2 text-xs text-slate-300 transition hover:border-sky-400"
            onClick={() => setShowSearch(true)}
          >
            重新输入地址
          </button>
        </div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
          钱包地址
        </p>
        <h1 className="text-2xl font-semibold text-slate-100">{address}</h1>
        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
          <span>分析结果页底部显示</span>
          <span>{data.warning ? "已使用模拟数据" : "数据实时获取"}</span>
          <span>
            {checkingPro
              ? "付费状态验证中"
              : proUnlocked
              ? "已解锁"
              : localUnlocked
              ? "等待链上确认"
              : "未解锁"}
          </span>
        </div>
        {data.warning && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
            数据加载失败，已自动切换为模拟数据。
          </div>
        )}
      </section>

      <OverviewCard
        overview={data.overview}
        distribution={data.distribution || []}
      />

      <DetailTabs
        tokens={data.tokens || []}
        nfts={data.nfts || []}
        transactions={data.transactions || []}
      />

      <AISummary
        summary={data.summary}
        deepSummary={deepSummary}
        unlocked={proUnlocked}
      />

      <Monetization
        unlocked={proUnlocked}
        onUnlock={handleUnlock}
        onDownload={handleDownload}
      />

      <ShareLink address={address} />

      {showSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-100">
                重新输入钱包地址
              </h3>
              <button
                className="text-xs text-slate-400"
                onClick={() => setShowSearch(false)}
              >
                关闭
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <input
                className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none"
                placeholder="粘贴你的Solana钱包地址"
                value={nextAddress}
                onChange={(event) => setNextAddress(event.target.value)}
              />
              {inputError && (
                <div className="text-xs text-rose-300">{inputError}</div>
              )}
              <div className="flex justify-end gap-3">
                <button
                  className="rounded-2xl border border-slate-700 px-4 py-2 text-xs text-slate-300"
                  onClick={() => setShowSearch(false)}
                >
                  取消
                </button>
                <button
                  className="rounded-2xl bg-sky-400 px-4 py-2 text-xs font-semibold text-slate-950"
                  onClick={handleGo}
                >
                  分析新地址
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
