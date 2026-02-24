import { Keypair, PublicKey, clusterApiUrl, Connection } from "@solana/web3.js";

export function getPayConfig() {
  const network = process.env.SOLANA_PAY_NETWORK || "devnet";
  const recipient = process.env.SOLANA_PAY_RECIPIENT;
  const solAmount = process.env.SOLANA_PAY_SOL_AMOUNT || "0.05";
  const usdcAmount = process.env.SOLANA_PAY_USDC_AMOUNT || "5";
  const usdcMint = process.env.SOLANA_PAY_USDC_MINT || "";
  const label = process.env.SOLANA_PAY_LABEL || "Solana钱包分析工具";
  const message = process.env.SOLANA_PAY_MESSAGE || "解锁付费版";
  const memo = process.env.SOLANA_PAY_MEMO || "solana-wallet-pro";
  const rpcUrl = process.env.SOLANA_PAY_RPC_URL || clusterApiUrl(network);

  return {
    network,
    recipient,
    solAmount,
    usdcAmount,
    usdcMint,
    label,
    message,
    memo,
    rpcUrl,
  };
}

export function generateReference() {
  return Keypair.generate().publicKey.toBase58();
}

export function buildPaymentUrl({
  recipient,
  amount,
  reference,
  label,
  message,
  memo,
  splToken,
}) {
  const params = new URLSearchParams();
  params.set("amount", amount);
  if (label) params.set("label", label);
  if (message) params.set("message", message);
  if (memo) params.set("memo", memo);
  if (reference) params.set("reference", reference);
  if (splToken) params.set("spl-token", splToken);

  return `solana:${recipient}?${params.toString()}`;
}

export function getConnection(rpcUrl) {
  return new Connection(rpcUrl, "confirmed");
}

export function parsePublicKey(value) {
  return new PublicKey(value);
}
