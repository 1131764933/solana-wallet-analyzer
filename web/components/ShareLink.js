"use client";

import { useState } from "react";

export default function ShareLink({ address }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${window.location.origin}/analyze/${address}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="glass-panel rounded-3xl p-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">分享报告</h3>
          <p className="mt-1 text-sm text-slate-400">
            一键复制链接，分享至 Twitter / Discord。
          </p>
        </div>
        <button
          className="rounded-2xl border border-slate-700 px-5 py-3 text-sm text-slate-200 hover:border-sky-400"
          onClick={handleCopy}
        >
          {copied ? "已复制链接" : "复制分享链接"}
        </button>
      </div>
    </section>
  );
}
