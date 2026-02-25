import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

const LIST_KEY = "feedback:solana-wallet-analyzer";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!process.env.FEEDBACK_ADMIN_TOKEN) {
    return NextResponse.json({ error: "未配置管理token" }, { status: 500 });
  }

  if (token !== process.env.FEEDBACK_ADMIN_TOKEN) {
    return NextResponse.json({ error: "无权限" }, { status: 401 });
  }

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return NextResponse.json({ error: "KV未配置" }, { status: 500 });
  }

  const total = await kv.llen(LIST_KEY);
  const start = total > 200 ? total - 200 : 0;
  const raw = total > 0 ? await kv.lrange(LIST_KEY, start, total - 1) : [];
  const parsed = raw.map((item) => {
    if (typeof item === "string") {
      try {
        return JSON.parse(item);
      } catch (error) {
        return { _raw: item };
      }
    }
    return item;
  });

  const items = parsed.filter(Boolean).reverse();

  return NextResponse.json({ items, total, raw: raw.length });
}
