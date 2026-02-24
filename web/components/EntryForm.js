"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isValidSolanaAddress } from "../lib/solana";

export default function EntryForm() {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = address.trim();

    if (!trimmed) {
      setError("请输入钱包地址");
      return;
    }

    if (!isValidSolanaAddress(trimmed)) {
      setError("地址格式不正确，请检查后重试");
      return;
    }

    setError("");
    setLoading(true);
    router.push(`/analyze/${trimmed}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-panel w-full rounded-3xl p-6 md:p-8"
    >
      <label className="text-sm uppercase tracking-[0.2em] text-slate-400">
        粘贴你的Solana钱包地址
      </label>
      <div className="mt-4 flex flex-col gap-4 md:flex-row">
        <input
          className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-base text-slate-100 outline-none transition focus:border-sky-400"
          placeholder="如 Phantom 钱包地址"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
        />
        <button
          type="submit"
          className="rounded-2xl bg-sky-500 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-sky-400"
          disabled={loading}
        >
          {loading ? "分析中..." : "一键分析"}
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400">
        <span>支持所有Solana钱包地址</span>
        <span>10秒内出结果</span>
        <span>无需注册/连接钱包</span>
      </div>
      {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
    </form>
  );
}
