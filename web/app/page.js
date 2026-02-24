import EntryForm from "../components/EntryForm";

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-16">
        <header className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.3em] text-slate-500">
            <span>Solana钱包分析工具</span>
            <span className="rounded-full border border-slate-800 px-3 py-1">
              零复杂合约
            </span>
            <span className="rounded-full border border-slate-800 px-3 py-1">
              纯前端 + API
            </span>
          </div>
          <h1 className="text-4xl font-semibold leading-tight text-slate-100 md:text-5xl">
            一键解析 Solana 钱包资产
            <span className="accent-text"> 看懂持仓与盈亏</span>
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-400">
            输入钱包地址，10秒内生成可视化资产报告。无需注册、无需连接钱包，
            用最轻量的方式验证付费意愿。
          </p>
        </header>

        <EntryForm />

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "资产概览",
              desc: "SOL / 稳定币 / Meme / DeFi 一眼看懂。",
            },
            {
              title: "代币明细",
              desc: "列出所有持仓代币、数量、价格、市值。",
            },
            {
              title: "AI简易解读",
              desc: "规则模板先上，快速输出核心结论。",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="glass-panel rounded-3xl p-6 text-sm text-slate-300"
            >
              <h3 className="text-lg font-semibold text-slate-100">
                {item.title}
              </h3>
              <p className="mt-3 text-sm text-slate-400">{item.desc}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
