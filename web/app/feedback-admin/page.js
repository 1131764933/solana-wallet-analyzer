import { kv } from "@vercel/kv";

const LIST_KEY = "feedback:solana-wallet-analyzer";

function formatTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default async function FeedbackAdmin({ searchParams }) {
  const resolved = await searchParams;
  const token = resolved?.token;

  if (!process.env.FEEDBACK_ADMIN_TOKEN) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12 text-slate-100">
        <div className="glass-panel rounded-3xl p-8">
          <h1 className="text-2xl font-semibold">管理页未配置</h1>
          <p className="mt-3 text-sm text-slate-400">
            请设置 FEEDBACK_ADMIN_TOKEN。
          </p>
        </div>
      </main>
    );
  }

  if (token !== process.env.FEEDBACK_ADMIN_TOKEN) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12 text-slate-100">
        <div className="glass-panel rounded-3xl p-8">
          <h1 className="text-2xl font-semibold">无权限</h1>
          <p className="mt-3 text-sm text-slate-400">
            请在 URL 中附带 token 参数。
          </p>
        </div>
      </main>
    );
  }

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12 text-slate-100">
        <div className="glass-panel rounded-3xl p-8">
          <h1 className="text-2xl font-semibold">KV 未配置</h1>
          <p className="mt-3 text-sm text-slate-400">
            请配置 Vercel KV 环境变量。
          </p>
        </div>
      </main>
    );
  }

  const total = await kv.llen(LIST_KEY);
  const start = total > 200 ? total - 200 : 0;
  const raw = total > 0 ? await kv.lrange(LIST_KEY, start, total - 1) : [];
  const items = raw
    .map((item) => {
      if (typeof item === "string") {
        try {
          return JSON.parse(item);
        } catch (error) {
          return { _raw: item };
        }
      }
      return item;
    })
    .filter(Boolean)
    .reverse();

  return (
    <main className="mx-auto max-w-5xl px-6 py-12 text-slate-100">
      <div className="glass-panel rounded-3xl p-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">反馈管理</h1>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">{total} 条</span>
            <a
              className="rounded-full border border-slate-700 px-4 py-2 text-xs text-slate-200 hover:border-sky-400"
              href={`/api/feedback/export?token=${token}`}
            >
              导出 CSV
            </a>
          </div>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="pb-3">时间</th>
                <th className="pb-3">邮箱</th>
                <th className="pb-3">内容</th>
                <th className="pb-3">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {items.length === 0 && (
                <tr>
                  <td className="py-4 text-slate-500" colSpan={4}>
                    暂无反馈
                  </td>
                </tr>
              )}
              {items.map((item, index) => (
                <tr key={`${item.createdAt}-${index}`}>
                  <td className="py-4 text-xs text-slate-300">
                    {formatTime(item.createdAt)}
                  </td>
                  <td className="py-4 text-xs text-slate-300">
                    {item.email || "—"}
                  </td>
                  <td className="py-4 text-xs text-slate-200">
                    {item.message}
                  </td>
                  <td className="py-4 text-xs text-slate-400">
                    {item.ip || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
