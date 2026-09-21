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
export const updateTransaction = async (transactionId, payload) => {
  try {
    const response = await api.put(`/transactions/${transactionId}`, payload);

    console.log("Update transaction status:", response.status);
    console.log("Update transaction data:", response.data);

    return response.data;
  } catch (error) {
    console.log(
      "Update transaction API error:",
      error.response?.status,
      error.response?.data,
    );

    throw (
      error.response?.data || {
        error: error.message || "Unable to update transaction.",
      }
    );
  }
};
