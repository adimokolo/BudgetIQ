const RATE_CACHE = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

const RATES_ENDPOINT = (base) => `https://open.er-api.com/v6/latest/${base}`;

export async function getExchangeRates(baseCurrency) {
  const base = (baseCurrency || "USD").toUpperCase();
  const cached = RATE_CACHE.get(base);

  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.rates;
  }

  const response = await fetch(RATES_ENDPOINT(base));
  if (!response.ok) {
    throw new Error(`Failed to fetch exchange rates for ${base}`);
  }

  const data = await response.json();
  if (data.result !== "success" || !data.rates) {
    throw new Error(data["error-type"] || "Exchange rate lookup failed");
  }

  RATE_CACHE.set(base, { rates: data.rates, fetchedAt: Date.now() });
  return data.rates;
}

export async function convertCurrency(amount, fromCurrency, toCurrency) {
  const from = (fromCurrency || "USD").toUpperCase();
  const to = (toCurrency || "USD").toUpperCase();

  if (from === to) return Number(amount || 0);

  const rates = await getExchangeRates(from);
  const rate = rates[to];
  if (!rate) throw new Error(`No exchange rate available for ${to}`);

  return Number(amount || 0) * rate;
}
