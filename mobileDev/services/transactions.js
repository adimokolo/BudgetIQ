import api from "./api";

export const getTransactions = async () => {
  const response = await api.get("/transactions");

  return response.data;
};

export const createTransaction = async (transaction) => {
  const response = await api.post("/transactions", transaction);

  return response.data;
};

export const deleteTransaction = async (id) => {
  const response = await api.delete(`/transactions/${id}`);

  return response.data;
};
