import api from "./api";

/*
|--------------------------------------------------------------------------
| GET ACCOUNTS
|--------------------------------------------------------------------------
*/

export const getAccounts = async () => {
  try {
    const response = await api.get("/accounts");

    console.log("Get accounts status:", response.status);
    console.log("Get accounts data:", response.data);

    return response.data;
  } catch (error) {
    console.log(
      "Get accounts API error:",
      error.response?.status,
      error.response?.data,
    );

    throw (
      error.response?.data || {
        error: error.message || "Unable to get accounts.",
      }
    );
  }
};

/*
|--------------------------------------------------------------------------
| CREATE ACCOUNT
|--------------------------------------------------------------------------
*/

export const createAccount = async ({
  name,
  currency,
  initialAmount,
  notes,
}) => {
  try {
    const response = await api.post("/accounts", {
      name,
      currency,
      initialAmount,
      notes,
    });

    console.log("Create account status:", response.status);
    console.log("Create account data:", response.data);

    return response.data;
  } catch (error) {
    console.log(
      "Create account API error:",
      error.response?.status,
      error.response?.data,
    );

    throw (
      error.response?.data || {
        error: error.message || "Unable to create account.",
      }
    );
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE ACCOUNT
|--------------------------------------------------------------------------
*/

export const updateAccount = async (
  accountId,
  { name, currency, initialAmount, notes },
) => {
  try {
    const response = await api.put(`/accounts/${accountId}`, {
      name,
      currency,
      initialAmount,
      notes,
    });

    console.log("Update account status:", response.status);
    console.log("Update account data:", response.data);

    return response.data;
  } catch (error) {
    console.log(
      "Update account API error:",
      error.response?.status,
      error.response?.data,
    );

    throw (
      error.response?.data || {
        error: error.message || "Unable to update account.",
      }
    );
  }
};

/*
|--------------------------------------------------------------------------
| DELETE ACCOUNT
|--------------------------------------------------------------------------
*/

export const deleteAccount = async (accountId) => {
  try {
    const response = await api.delete(`/accounts/${accountId}`);

    console.log("Delete account status:", response.status);
    console.log("Delete account data:", response.data);

    return response.data;
  } catch (error) {
    console.log(
      "Delete account API error:",
      error.response?.status,
      error.response?.data,
    );

    throw (
      error.response?.data || {
        error: error.message || "Unable to delete account.",
      }
    );
  }
};
