"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isValidSolanaAddress } from "../lib/solana";

export default function EntryForm() {
  const router = useRouter();
  const wrapperRef = useRef(null);
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [recentAddresses, setRecentAddresses] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("recent_addresses") || "[]");
    if (saved.length > 0) {
      setHasSaved(true);
      setRecentAddresses(saved);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
    const next = [trimmed, ...recentAddresses.filter((a) => a !== trimmed)].slice(
      0,
      5
    );
    localStorage.setItem("recent_addresses", JSON.stringify(next));
    setHasSaved(true);
    setRecentAddresses(next);
    router.push(`/analyze/${trimmed}`);
  };

  const handleClear = () => {
    localStorage.removeItem("recent_addresses");
    setAddress("");
    setHasSaved(false);
    setRecentAddresses([]);
  };

  const handlePick = (value) => {
    setAddress(value);
    setShowSuggestions(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-panel w-full rounded-3xl p-6 md:p-8"
      ref={wrapperRef}
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
          onFocus={() => setShowSuggestions(true)}
        />
        <button
          type="submit"
          className="rounded-2xl bg-sky-500 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-sky-400"
          disabled={loading}
        >
          {loading ? "分析中..." : "一键分析"}
        </button>
      </div>
      {hasSaved && showSuggestions && recentAddresses.length > 0 && (
        <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">最近地址</span>
            <button
              type="button"
              className="text-slate-400 underline underline-offset-4"
              onClick={handleClear}
            >
              清空
            </button>
          </div>
          <div className="mt-2 flex flex-col gap-2">
            {recentAddresses.map((item) => (
              <button
                key={item}
                type="button"
                className="rounded-xl border border-slate-800 px-3 py-2 text-left text-slate-200 hover:border-sky-400"
                onClick={() => handlePick(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400">
        <span>支持所有Solana钱包地址</span>
        <span>10秒内出结果</span>
        <span>无需注册/连接钱包</span>
      </div>
      {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
    </form>
  );
}
