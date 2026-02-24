import { NextResponse } from "next/server";
import { getPayConfig, buildPaymentUrl, generateReference } from "../../../../lib/pay";
import { isValidSolanaAddress } from "../../../../lib/solana";

const allowedCurrencies = new Set(["SOL", "USDC"]);

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const currency = (body.currency || "SOL").toUpperCase();
  const plan = body.plan || "monthly";

  if (!allowedCurrencies.has(currency)) {
    return NextResponse.json({ error: "不支持的支付币种" }, { status: 400 });
  }

  const config = getPayConfig();
  if (!config.recipient || !isValidSolanaAddress(config.recipient)) {
    return NextResponse.json(
      { error: "未配置收款地址" },
      { status: 500 }
    );
  }

  if (currency === "USDC" && !config.usdcMint) {
    return NextResponse.json(
      { error: "未配置USDC Mint" },
      { status: 500 }
    );
  }

  const reference = generateReference();
  const amount = currency === "SOL" ? config.solAmount : config.usdcAmount;

  const paymentUrl = buildPaymentUrl({
    recipient: config.recipient,
    amount,
    reference,
    label: config.label,
    message: config.message,
    memo: config.memo,
    splToken: currency === "USDC" ? config.usdcMint : undefined,
  });

  return NextResponse.json({
    reference,
    paymentUrl,
    amount,
    currency,
    recipient: config.recipient,
    label: config.label,
    message: config.message,
    plan,
    network: config.network,
  });
}
