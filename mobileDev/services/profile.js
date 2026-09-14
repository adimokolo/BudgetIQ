import api from "./api";

export async function updateBaseCurrencyOnServer(currency) {
  const response = await api.patch("/profile/currency", { currency });
  return response.data;
}
