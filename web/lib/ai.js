export function buildSummary({ distribution, totalValueUsd }) {
  if (!distribution || distribution.length === 0) {
    return "暂无足够数据生成解读。";
  }

  const total = distribution.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0) {
    return "当前钱包暂无可统计的资产。";
  }

  const sorted = [...distribution].sort((a, b) => b.value - a.value);
  const top = sorted[0];
  const sol = distribution.find((item) => item.name === "SOL") || { value: 0 };
  const meme =
    distribution.find((item) => item.name === "Meme") || { value: 0 };

  const toPct = (value) => Math.round((value / total) * 100);
  const topPct = toPct(top.value);
  const solPct = toPct(sol.value);
  const memePct = toPct(meme.value);

  const insights = [];
  insights.push(`你的持仓以${top.name}为主（占比约${topPct}%）。`);

  if (memePct >= 50) {
    insights.push("Meme币占比较高，风险偏高。");
  }

  if (solPct <= 15) {
    insights.push("SOL持仓较少，可适当分散核心仓位。");
  }

  if (totalValueUsd) {
    insights.push(`当前估值约 $${totalValueUsd.toLocaleString()}`);
  }

  return insights.join(" ");
}
