export async function fetchHeliusAssets({ address, apiKey }) {
  const url = `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
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

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Helius请求失败: ${response.status}`);
  }

  const json = await response.json();
  return json?.result?.items ?? [];
}
