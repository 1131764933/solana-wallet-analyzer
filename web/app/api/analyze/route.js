import { NextResponse } from "next/server";
import { isValidSolanaAddress } from "../../../lib/solana";
import {
  fetchHeliusAssets,
  fetchSolBalance,
  fetchRecentSignatures,
  fetchParsedTransaction,
} from "../../../lib/apis/helius";
import { buildSummary } from "../../../lib/ai";
import { fetchBirdeyePrice } from "../../../lib/apis/birdeye";

const MEME_SYMBOLS = new Set(["WIF", "BONK", "POPCAT", "MYRO", "MEW"]);
const STABLE_SYMBOLS = new Set(["USDC", "USDT", "DAI"]);
const SOL_MINT = "So11111111111111111111111111111111111111112";

function mockResponse(address) {
  const distribution = [
    { name: "SOL", value: 4200 },
    { name: "Stable", value: 1800 },
    { name: "Meme", value: 3600 },
    { name: "NFT", value: 0 },
    { name: "DeFi", value: 900 },
  ];

  const totalValueUsd = distribution.reduce((sum, item) => sum + item.value, 0);

  return {
    address,
    generatedAt: new Date().toISOString(),
    overview: {
      totalValueUsd,
      pnlToday: null,
      pnlWeek: null,
      pnlMonth: null,
      txCount: null,
    },
    distribution,
    tokens: [
      {
        symbol: "SOL",
        name: "Solana",
        amount: 42,
        priceUsd: 100,
        valueUsd: 4200,
        changePct: null,
      },
      {
        symbol: "USDC",
        name: "USD Coin",
        amount: 1800,
        priceUsd: 1,
        valueUsd: 1800,
        changePct: null,
      },
      {
        symbol: "WIF",
        name: "dogwifhat",
        amount: 9000,
        priceUsd: 0.4,
        valueUsd: 3600,
        changePct: null,
      },
    ],
    nfts: [
      {
        name: "Mock NFT",
        image: null,
        collection: "Demo Collection",
      },
    ],
    transactions: [
      {
        signature: "mock-signature",
        status: "confirmed",
        blockTime: new Date().toISOString(),
        feeSol: 0.000005,
        type: "Transfer",
      },
    ],
  };
}

function categorizeToken({ symbol, valueUsd }) {
  if (symbol === "SOL") return "SOL";
  if (STABLE_SYMBOLS.has(symbol)) return "Stable";
  if (MEME_SYMBOLS.has(symbol)) return "Meme";
  if (valueUsd <= 0) return "Other";
  return "DeFi";
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address || !isValidSolanaAddress(address)) {
    return NextResponse.json(
      { error: "无效的Solana地址" },
      { status: 400 }
    );
  }

  const heliusKey = process.env.HELIUS_API_KEY;
  const birdeyeKey = process.env.BIRDEYE_API_KEY;

  try {
    if (!heliusKey) {
      const mock = mockResponse(address);
      mock.summary = buildSummary({
        distribution: mock.distribution,
        totalValueUsd: mock.overview.totalValueUsd,
      });
      return NextResponse.json(mock);
    }

    const [assets, solBalance, signatures] = await Promise.all([
      fetchHeliusAssets({ address, apiKey: heliusKey }),
      fetchSolBalance({ address, apiKey: heliusKey }),
      fetchRecentSignatures({ address, apiKey: heliusKey, limit: 10 }),
    ]);

    const solPrice = birdeyeKey
      ? await fetchBirdeyePrice({ apiKey: birdeyeKey, tokenAddress: SOL_MINT })
      : 0;

    const solToken = {
      symbol: "SOL",
      name: "Solana",
      amount: solBalance,
      priceUsd: solPrice || 0,
      valueUsd: solBalance * (solPrice || 0),
      changePct: null,
    };

    const tokens = assets
      .filter((item) =>
        ["FungibleToken", "FungibleAsset"].includes(item.interface)
      )
      .map((item) => {
        const info = item.token_info || {};
        const decimals = info.decimals || 0;
        const rawBalance = Number(info.balance || 0);
        const amount = decimals ? rawBalance / 10 ** decimals : rawBalance;
        const price = info?.price_info?.price_per_token || 0;
        const valueUsd = amount * price;

        return {
          symbol: info.symbol || item.symbol || "UNKNOWN",
          name: info.name || item.name || "Unknown",
          amount,
          priceUsd: price,
          valueUsd,
          changePct: null,
        };
      })
      .filter((token) => token.amount > 0);

    tokens.unshift(solToken);

    const nfts = assets
      .filter((item) => `${item.interface}`.includes("NFT"))
      .map((item) => ({
        name: item?.content?.metadata?.name || item?.name || "Unknown NFT",
        image:
          item?.content?.links?.image ||
          item?.content?.files?.[0]?.uri ||
          null,
        collection:
          item?.grouping?.[0]?.group_value ||
          item?.content?.metadata?.collection?.name ||
          null,
      }))
      .slice(0, 24);

    const parsedTransactions = await Promise.all(
      (signatures || []).map((sig) =>
        fetchParsedTransaction({ signature: sig.signature, apiKey: heliusKey })
      )
    );

    const transactions = (parsedTransactions || [])
      .filter(Boolean)
      .map((tx) => {
        const status = tx.meta?.err ? "failed" : "confirmed";
        const feeSol = tx.meta?.fee ? tx.meta.fee / 1e9 : null;
        return {
          signature: tx.transaction?.signatures?.[0] || "unknown",
          status,
          blockTime: tx.blockTime
            ? new Date(tx.blockTime * 1000).toISOString()
            : null,
          feeSol,
          type: "Transfer",
        };
      });

    const distributionMap = {
      SOL: 0,
      Stable: 0,
      Meme: 0,
      NFT: 0,
      DeFi: 0,
    };

    tokens.forEach((token) => {
      const bucket = categorizeToken(token);
      if (!distributionMap[bucket]) {
        distributionMap[bucket] = 0;
      }
      distributionMap[bucket] += token.valueUsd || 0;
    });

    const distribution = Object.entries(distributionMap).map(([name, value]) => ({
      name,
      value,
    }));

    const totalValueUsd = tokens.reduce(
      (sum, token) => sum + (token.valueUsd || 0),
      0
    );

    const overview = {
      totalValueUsd,
      pnlToday: null,
      pnlWeek: null,
      pnlMonth: null,
      txCount: signatures?.length ?? null,
    };

    const summary = buildSummary({ distribution, totalValueUsd });

    return NextResponse.json({
      address,
      generatedAt: new Date().toISOString(),
      overview,
      distribution,
      tokens,
      nfts,
      transactions,
      summary,
    });
  } catch (error) {
    const fallback = mockResponse(address);
    fallback.summary = buildSummary({
      distribution: fallback.distribution,
      totalValueUsd: fallback.overview.totalValueUsd,
    });

    return NextResponse.json({
      ...fallback,
      warning: error.message || "数据源异常，已返回模拟数据",
    });
  }
}
