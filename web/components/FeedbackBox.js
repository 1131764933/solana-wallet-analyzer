"use client";

import { useState } from "react";

export default function FeedbackBox() {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    setStatus("loading");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, email }),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "提交失败");
      }

      setStatus("success");
      setMessage("");
      setEmail("");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      setStatus("idle");
      setError(err.message || "提交失败");
    }
  };

  return (
    <section className="glass-panel rounded-3xl p-6 md:p-8">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-100">反馈建议</h3>
        <span className="text-xs text-slate-400">可选邮箱回访</span>
      </div>
      <div className="mt-4 flex flex-col gap-3">
        <textarea
          className="min-h-[120px] w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none"
          placeholder="你希望增加什么功能？"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        <input
          className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none"
          placeholder="邮箱（可选）"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        {error && <p className="text-xs text-rose-300">{error}</p>}
        <button
          className="rounded-2xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950"
          onClick={handleSubmit}
          disabled={status === "loading"}
        >
          {status === "loading" ? "提交中..." : "提交反馈"}
        </button>
        {status === "success" && (
          <p className="text-xs text-emerald-300">已提交，感谢反馈！</p>
        )}
      </div>
    </section>
  );
}
