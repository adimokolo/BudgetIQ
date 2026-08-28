import api from "./api";

export const getBudgets = async () => {
  try {
    const response = await api.get("/budgets");
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const createBudget = async (budget) => {
  try {
    const response = await api.post("/budgets", budget);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateBudget = async (id, budget) => {
  try {
    const response = await api.put(`/budgets/${id}`, budget);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteBudget = async (id) => {
  try {
    const response = await api.delete(`/budgets/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
