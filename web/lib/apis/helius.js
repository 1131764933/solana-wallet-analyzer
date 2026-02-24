const HELIUS_MAINNET = "https://mainnet.helius-rpc.com";

function buildHeliusUrl(apiKey) {
  return `${HELIUS_MAINNET}/?api-key=${apiKey}`;
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Helius请求失败: ${response.status}`);
  }

  return response.json();
}

export async function fetchHeliusAssets({ address, apiKey }) {
  const url = buildHeliusUrl(apiKey);
  const body = {
    jsonrpc: "2.0",
    id: "helius-assets",
    method: "getAssetsByOwner",
    params: {
      ownerAddress: address,
      page: 1,
      limit: 1000,
      displayOptions: {
        showFungible: true,
        showCollectionMetadata: false,
      },
    },
  };

  const json = await postJson(url, body);
  return json?.result?.items ?? [];
}

export async function fetchSolBalance({ address, apiKey }) {
  const url = buildHeliusUrl(apiKey);
  const body = {
    jsonrpc: "2.0",
    id: "helius-balance",
    method: "getBalance",
    params: [address],
  };

  const json = await postJson(url, body);
  const lamports = json?.result?.value ?? 0;
  return lamports / 1e9;
}

export async function fetchRecentSignatures({ address, apiKey, limit = 10 }) {
  const url = buildHeliusUrl(apiKey);
  const body = {
    jsonrpc: "2.0",
    id: "helius-signatures",
    method: "getSignaturesForAddress",
    params: [address, { limit }],
  };

  const json = await postJson(url, body);
  return json?.result ?? [];
}

export async function fetchParsedTransaction({ signature, apiKey }) {
  const url = buildHeliusUrl(apiKey);
  const body = {
    jsonrpc: "2.0",
    id: "helius-transaction",
    method: "getTransaction",
    params: [signature, { maxSupportedTransactionVersion: 0 }],
  };

  const json = await postJson(url, body);
  return json?.result ?? null;
}
