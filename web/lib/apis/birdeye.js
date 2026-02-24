export async function fetchBirdeyePrice({ apiKey, tokenAddress }) {
  if (!apiKey || !tokenAddress) return null;
  const url = `https://public-api.birdeye.so/defi/price?address=${tokenAddress}`;

  const response = await fetch(url, {
    headers: { "X-API-KEY": apiKey },
  });

  if (!response.ok) {
    return null;
  }

  const json = await response.json();
  return json?.data?.value ?? null;
}
