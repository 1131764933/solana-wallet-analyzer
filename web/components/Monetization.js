"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";

const POLL_INTERVAL = 3000;
const TIMEOUT_MS = 120000;

export default function Monetization({ unlocked, onUnlock, onDownload }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [payment, setPayment] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [status, setStatus] = useState("idle");
  const [currency, setCurrency] = useState("SOL");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [signature, setSignature] = useState("");
  const [sigChecking, setSigChecking] = useState(false);

  useEffect(() => {
    if (!payment?.paymentUrl) return;
    let cancelled = false;
    QRCode.toDataURL(payment.paymentUrl, { width: 280 }).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [payment]);

  useEffect(() => {
    if (!modalOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [modalOpen]);

  useEffect(() => {
    if (!modalOpen || status !== "pending" || !payment) return;

    let intervalId;
    let timeoutId;

    const poll = async () => {
      try {
        const url = `/api/pay/confirm?reference=${payment.reference}&currency=${payment.currency}&amount=${payment.amount}`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.status === "confirmed") {
          setStatus("confirmed");
          onUnlock();
          setTimeout(() => setModalOpen(false), 1200);
        } else if (json.status === "rpc_error") {
          setStatus("rpc_error");
          setError("RPC连接失败，请检查RPC配置");
        } else if (json.status === "failed") {
          setStatus("failed");
        }
      } catch (err) {
        setError("支付状态检查失败，请重试");
      }
    };

    intervalId = setInterval(poll, POLL_INTERVAL);
    timeoutId = setTimeout(() => {
      setStatus("timeout");
    }, TIMEOUT_MS);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [modalOpen, status, payment, onUnlock]);

  const handleStartPayment = async () => {
    setError("");
    setStatus("preparing");
    setModalOpen(true);

    try {
      const response = await fetch("/api/pay/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "monthly", currency }),
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json?.error || "支付初始化失败");
      }
      setPayment(json);
      setStatus("pending");
    } catch (err) {
      setStatus("failed");
      setError(err.message || "支付初始化失败");
    }
  };

  const handleCopy = async (value, key) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(""), 2000);
    } catch (err) {
      setError("复制失败，请手动复制");
    }
  };

  const handleSignatureConfirm = async () => {
    if (!signature) {
      setError("请粘贴交易签名");
      return;
    }
    setSigChecking(true);
    setError("");
    try {
      const res = await fetch("/api/pay/confirm-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signature,
          currency,
          amount: payment?.amount || 0,
        }),
      });
      const json = await res.json();
      if (json.status === "confirmed") {
        setStatus("confirmed");
        onUnlock();
        setTimeout(() => setModalOpen(false), 1200);
      } else if (json.status === "rpc_error") {
        setStatus("rpc_error");
        setError("RPC连接失败，请检查RPC配置");
      } else if (json.status === "failed") {
        setStatus("failed");
      } else {
        setStatus("timeout");
      }
    } catch (err) {
      setError("签名校验失败，请重试");
    } finally {
      setSigChecking(false);
    }
  };

  const statusText = useMemo(() => {
    if (status === "preparing") return "正在生成支付链接...";
    if (status === "pending") return "等待钱包支付确认...";
    if (status === "confirmed") return "支付成功，已解锁付费功能";
    if (status === "timeout") return "未检测到支付，请完成支付后重试";
    if (status === "rpc_error") return "RPC连接失败，请检查RPC配置";
    if (status === "failed") return "支付初始化失败，请检查配置";
    return "";
  }, [status]);

  return (
    <section className="glass-panel rounded-3xl p-6 md:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">变现模块</h3>
          <p className="mt-2 text-sm text-slate-400">
            免费版查看基础数据，付费版解锁深度分析与报告导出。
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button className="rounded-2xl border border-slate-700 px-5 py-3 text-sm text-slate-200">
            免费版
          </button>
          <button
            className="rounded-2xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
            onClick={handleStartPayment}
            disabled={unlocked}
          >
            {unlocked ? "已解锁" : "使用 Solana Pay 解锁"}
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-400">
        <span>币种选择：</span>
        {["SOL", "USDC"].map((item) => (
          <button
            key={item}
            className={`rounded-full border px-4 py-1 text-xs transition ${
              currency === item
                ? "border-sky-400 text-slate-100"
                : "border-slate-700 text-slate-400"
            }`}
            onClick={() => setCurrency(item)}
            disabled={unlocked}
          >
            {item}
          </button>
        ))}
      </div>

      {unlocked && (
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            className="rounded-2xl border border-emerald-400/60 px-5 py-2 text-xs text-emerald-200"
            onClick={onDownload}
          >
            导出报告（JSON）
          </button>
          <span className="text-xs text-emerald-300">
            付费功能已解锁
          </span>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-10">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 text-center max-h-full overflow-y-auto">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-slate-100">Solana Pay</h4>
              <button
                className="text-sm text-slate-400"
                onClick={() => setModalOpen(false)}
              >
                关闭
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              扫描二维码或点击按钮跳转钱包完成支付。
            </p>
            <div className="mt-6 flex flex-col items-center gap-4">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Solana Pay QR"
                  className="h-56 w-56 rounded-2xl border border-slate-800 bg-white p-3"
                />
              ) : (
                <div className="flex h-56 w-56 items-center justify-center rounded-2xl border border-dashed border-slate-700 text-xs text-slate-500">
                  生成二维码...
                </div>
              )}
              {payment?.paymentUrl && (
                <a
                  className="w-full rounded-2xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950"
                  href={payment.paymentUrl}
                >
                  打开钱包支付 {payment.amount} {payment.currency}
                </a>
              )}
            </div>
            {payment && (
              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-left text-xs text-slate-300">
                <div className="flex items-center justify-between gap-3">
                  <span>收款地址</span>
                  <button
                    className="text-sky-300"
                    onClick={() => handleCopy(payment.recipient, "recipient")}
                  >
                    {copied === "recipient" ? "已复制" : "复制"}
                  </button>
                </div>
                <p className="mt-2 break-all text-slate-400">
                  {payment.recipient}
                </p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span>支付链接</span>
                  <button
                    className="text-sky-300"
                    onClick={() => handleCopy(payment.paymentUrl, "url")}
                  >
                    {copied === "url" ? "已复制" : "复制"}
                  </button>
                </div>
                <p className="mt-2 break-all text-slate-400">
                  {payment.paymentUrl}
                </p>
                <div className="mt-4 border-t border-slate-800 pt-4">
                  <p className="text-xs text-slate-400">
                    若无法唤起钱包，可先手动转账，再粘贴交易签名确认解锁。
                  </p>
                  <div className="mt-3 flex flex-col gap-2">
                    <input
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-200 outline-none"
                      placeholder="粘贴交易签名"
                      value={signature}
                      onChange={(event) => setSignature(event.target.value)}
                    />
                    <button
                      className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-200"
                      onClick={handleSignatureConfirm}
                      disabled={sigChecking}
                    >
                      {sigChecking ? "校验中..." : "验证签名解锁"}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {statusText && (
              <p className="mt-4 text-sm text-slate-300">{statusText}</p>
            )}
            {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
          </div>
        </div>
      )}
    </section>
  );
}
