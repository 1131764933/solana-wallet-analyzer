export function isValidSolanaAddress(address) {
  if (typeof address !== "string") return false;
  const trimmed = address.trim();
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed);
}
