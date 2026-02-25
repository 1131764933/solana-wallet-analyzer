import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { Resend } from "resend";

const MAX_LEN = 500;
const MIN_LEN = 2;
const LIST_KEY = "feedback:solana-wallet-analyzer";

function getClientIp(headers) {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return headers.get("x-real-ip") || "unknown";
}

function isEmail(value) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const message = `${body.message || ""}`.trim();
  const email = `${body.email || ""}`.trim();
  const ip = getClientIp(request.headers);

  if (message.length < MIN_LEN || message.length > MAX_LEN) {
    return NextResponse.json(
      { error: "反馈内容需在2到500字之间" },
      { status: 400 }
    );
  }

  if (!isEmail(email)) {
    return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
  }

  const payload = {
    message,
    email: email || null,
    createdAt: new Date().toISOString(),
    ip,
  };

  try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const limit = Number(process.env.FEEDBACK_RATE_LIMIT || 5);
      const windowSec = Number(process.env.FEEDBACK_RATE_WINDOW || 60);
      const key = `feedback:rate:${ip}`;
      const rateCount = await kv.incr(key);
      if (rateCount === 1) {
        await kv.expire(key, windowSec);
      }
      if (rateCount > limit) {
        return NextResponse.json(
          { error: "提交过于频繁，请稍后再试" },
          { status: 429 }
        );
      }

      const writeCount = await kv.rpush(LIST_KEY, JSON.stringify(payload));
      await kv.ltrim(LIST_KEY, -200, -1);
      const length = await kv.llen(LIST_KEY);

      if (
        process.env.RESEND_API_KEY &&
        process.env.RESEND_TO &&
        process.env.RESEND_FROM
      ) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.RESEND_FROM,
          to: process.env.RESEND_TO,
          subject: "新反馈 - Solana钱包分析工具",
          text: `内容: ${message}\n邮箱: ${email || "未填写"}\nIP: ${ip}\n时间: ${payload.createdAt}`,
        });
      }
      return NextResponse.json({ ok: true, count: writeCount, length });
    }

    console.warn("KV未配置，反馈仅记录到日志", payload);
    return NextResponse.json({ ok: true, warning: "KV未配置" });
  } catch (error) {
    return NextResponse.json(
      { error: "提交失败，请稍后重试" },
      { status: 500 }
    );
  }
}
