"use client";

export default function AISummary({ summary, deepSummary, unlocked }) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-100">AI简易解读</h3>
        <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">
          {unlocked ? "付费版深度解读" : "MVP规则模板"}
        </span>
      </div>
      <p className="mt-4 text-base leading-7 text-slate-200">
        {summary || "AI解读生成中..."}
      </p>
      {unlocked && deepSummary && (
        <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          {deepSummary}
        </div>
      )}
      {!unlocked && (
        <p className="mt-4 text-sm text-slate-500">
          解锁付费版可查看更详细的风险提示与持仓建议。
        </p>
      )}
    </section>
  );
}
