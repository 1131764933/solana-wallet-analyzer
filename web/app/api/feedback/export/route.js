import { kv } from "@vercel/kv";

const LIST_KEY = "feedback:solana-wallet-analyzer";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function csvEscape(value) {
  const str = `${value ?? ""}`;
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!process.env.FEEDBACK_ADMIN_TOKEN) {
    return new Response("未配置管理token", { status: 500 });
  }

  if (token !== process.env.FEEDBACK_ADMIN_TOKEN) {
    return new Response("无权限", { status: 401 });
  }

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return new Response("KV未配置", { status: 500 });
  }

  const raw = await kv.lrange(LIST_KEY, -200, -1);
  const items = raw
    .map((item) => {
      try {
        return JSON.parse(item);
      } catch (error) {
        return null;
      }
    })
    .filter(Boolean)
    .reverse();

  const header = ["timestamp", "ip", "message", "email"].join(",");
  const rows = items.map((item) =>
    [
      csvEscape(item.createdAt),
      csvEscape(item.ip),
      csvEscape(item.message),
      csvEscape(item.email || ""),
    ].join(",")
  );

  const csv = [header, ...rows].join("\n");
  const filename = `feedback-${formatDate(new Date())}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=${filename}`,
    },
  });
}
