import api from "./api";

/*
|--------------------------------------------------------------------------
| GET BUDGETS
|--------------------------------------------------------------------------
*/

export const getBudgets = async () => {
  try {
    const response = await api.get("/budgets");

    console.log("Get budgets status:", response.status);
    console.log("Get budgets data:", response.data);

    return response.data;
  } catch (error) {
    console.log(
      "Get budgets API error:",
      error.response?.status,
      error.response?.data,
    );

    throw (
      error.response?.data || {
        error: error.message || "Unable to get budgets.",
      }
    );
  }
};

/*
|--------------------------------------------------------------------------
| CREATE BUDGET
|--------------------------------------------------------------------------
*/

export const createBudget = async ({ categoryId, monthlyLimit }) => {
  try {
    const response = await api.post("/budgets", {
      categoryId,
      monthlyLimit,
    });

    console.log("Create budget status:", response.status);
    console.log("Create budget data:", response.data);

    return response.data;
  } catch (error) {
    console.log(
      "Create budget API error:",
      error.response?.status,
      error.response?.data,
    );

    throw (
      error.response?.data || {
        error: error.message || "Unable to create budget.",
      }
    );
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE BUDGET
|--------------------------------------------------------------------------
*/

export const updateBudget = async (id, { monthlyLimit }) => {
  try {
    console.log("Updating budget:", id);
    console.log("Monthly limit:", monthlyLimit);

    // IMPORTANT:
    // Backend route uses PATCH, not PUT.
    const response = await api.patch(`/budgets/${id}`, {
      monthlyLimit,
    });

    console.log("Update budget status:", response.status);
    console.log("Update budget data:", response.data);

    return response.data;
  } catch (error) {
    console.log(
      "Update budget API error:",
      error.response?.status,
      error.response?.data,
    );

    throw (
      error.response?.data || {
        error: error.message || "Unable to update budget.",
      }
    );
  }
};

/*
|--------------------------------------------------------------------------
| DELETE BUDGET
|--------------------------------------------------------------------------
*/

export const deleteBudget = async (id) => {
  try {
    console.log("Deleting budget:", id);

    const response = await api.delete(`/budgets/${id}`);

    console.log("Delete budget status:", response.status);

    return response.data;
  } catch (error) {
    console.log(
      "Delete budget API error:",
      error.response?.status,
      error.response?.data,
    );

    throw (
      error.response?.data || {
        error: error.message || "Unable to delete budget.",
      }
    );
  }
};
