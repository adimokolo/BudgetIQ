import api from "./api";

// ======================================================
// START BANK SYNCHRONIZATION
// ======================================================

export const startBankSynchronization = async ({ name, email }) => {
  try {
    if (!name || !email) {
      throw new Error("Customer name and email are required.");
    }

    console.log("STARTING BANK SYNCHRONIZATION");
    console.log("Customer name:", name);
    console.log("Customer email:", email);

    const response = await api.post("/bank-sync/initiate", {
      name: String(name).trim(),
      email: String(email).trim(),
    });

    console.log(
      "BANK SYNC INITIATE RESPONSE:",
      JSON.stringify(response.data, null, 2),
    );

    return response.data;
  } catch (error) {
    console.log(
      "START BANK SYNC ERROR:",
      error.response?.data || error.message,
    );

    throw (
      error.response?.data || {
        error: error.message || "Unable to start bank synchronization.",
      }
    );
  }
};

// ======================================================
// GET BANK SYNCHRONIZATION STATUS
// ======================================================

export const getBankSyncStatus = async (ref) => {
  try {
    const response = await api.get(
      `/bank-sync/status/${encodeURIComponent(ref)}`,
    );

    console.log(
      "BANK SYNC STATUS RESPONSE:",
      JSON.stringify(response.data, null, 2),
    );

    return response.data;
  } catch (error) {
    console.log(
      "BANK SYNC STATUS ERROR:",
      error.response?.data || error.message,
    );

    throw (
      error.response?.data || {
        error: error.message || "Unable to check bank synchronization.",
      }
    );
  }
};

// ======================================================
// GET CONNECTED BANK ACCOUNTS
// ======================================================

export const getBankAccounts = async () => {
  try {
    const response = await api.get("/bank-sync/accounts");

    console.log(
      "BANK ACCOUNTS RESPONSE:",
      JSON.stringify(response.data, null, 2),
    );

    return response.data;
  } catch (error) {
    console.log("BANK ACCOUNTS ERROR:", error.response?.data || error.message);

    throw (
      error.response?.data || {
        error: error.message || "Unable to load bank accounts.",
      }
    );
  }
};

// ======================================================
// REFRESH BANK ACCOUNT
// ======================================================

export const refreshBankAccount = async (id) => {
  try {
    const response = await api.post(`/bank-sync/accounts/${id}/refresh`);

    console.log(
      "BANK REFRESH RESPONSE:",
      JSON.stringify(response.data, null, 2),
    );

    return response.data;
  } catch (error) {
    console.log("BANK REFRESH ERROR:", error.response?.data || error.message);

    throw (
      error.response?.data || {
        error: error.message || "Unable to refresh bank account.",
      }
    );
  }
};
