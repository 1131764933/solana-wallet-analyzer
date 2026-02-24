import { NextResponse } from "next/server";
import { getPayConfig, getConnection } from "../../../../lib/pay";

function parseUiAmount(tokenAmount) {
  if (!tokenAmount) return 0;
  if (tokenAmount.uiAmountString) {
    return parseFloat(tokenAmount.uiAmountString);
  }
  if (typeof tokenAmount.uiAmount === "number") {
    return tokenAmount.uiAmount;
  }
  return 0;
}

function readTokenDelta({ preBalances = [], postBalances = [], mint, owner }) {
  const pre = preBalances.find(
    (item) => item.mint === mint && item.owner === owner
  );
  const post = postBalances.find(
    (item) => item.mint === mint && item.owner === owner
  );

  const preAmount = pre ? parseUiAmount(pre.uiTokenAmount) : 0;
  const postAmount = post ? parseUiAmount(post.uiTokenAmount) : 0;

  return postAmount - preAmount;
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const signature = body.signature;
  const currency = (body.currency || "SOL").toUpperCase();
  const amount = Number(body.amount || 0);

  if (!signature) {
    return NextResponse.json({ error: "缺少签名" }, { status: 400 });
  }

  if (!amount || Number.isNaN(amount)) {
    return NextResponse.json({ error: "缺少金额" }, { status: 400 });
  }

  const config = getPayConfig();
  if (!config.recipient) {
    return NextResponse.json(
      { error: "未配置收款地址" },
      { status: 500 }
    );
  }
  if (currency === "USDC" && !config.usdcMint) {
    return NextResponse.json({ error: "未配置USDC Mint" }, { status: 500 });
  }

  const connection = getConnection(config.rpcUrl, config.network);

  let tx = null;
  try {
    tx = await connection.getTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });
  } catch (error) {
    return NextResponse.json(
      { status: "rpc_error", error: "RPC连接失败" },
      { status: 503 }
    );
  }

  if (!tx) {
    return NextResponse.json({ status: "pending" });
  }

  if (tx.meta?.err) {
    return NextResponse.json({ status: "failed" });
  }

  let valid = false;

  if (currency === "SOL") {
    const recipientIndex = tx.transaction.message.accountKeys.findIndex(
      (key) => key.toBase58() === config.recipient
    );

    if (recipientIndex >= 0 && tx.meta?.preBalances && tx.meta?.postBalances) {
      const pre = tx.meta.preBalances[recipientIndex] || 0;
      const post = tx.meta.postBalances[recipientIndex] || 0;
      const deltaLamports = post - pre;
      const requiredLamports = Math.round(amount * 1e9);
      valid = deltaLamports >= requiredLamports;
    }
  }

  if (currency === "USDC") {
    const delta = readTokenDelta({
      preBalances: tx.meta?.preTokenBalances,
      postBalances: tx.meta?.postTokenBalances,
      mint: config.usdcMint,
      owner: config.recipient,
    });
    valid = delta >= amount;
  }

  if (!valid) {
    return NextResponse.json({ status: "pending" });
  }

  const response = NextResponse.json({ status: "confirmed", signature });
  response.cookies.set({
    name: "pro_unlocked",
    value: "true",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
    httpOnly: true,
  });

  return response;
}
