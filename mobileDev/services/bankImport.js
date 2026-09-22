import api from "./api";

const throwApiError = (error, fallback) => {
  throw (
    error.response?.data || {
      error: error.message || fallback,
    }
  );
};

export const previewStatement = async (accountId, file, bankName) => {
  try {
    const formData = new FormData();

    formData.append("accountId", String(accountId));
    formData.append("bankName", bankName);

    formData.append("statement", {
      uri: file.uri,
      name: file.name || "statement.csv",
      type: file.mimeType || "application/octet-stream",
    });

    const response = await api.post(
      "/bank-import/statement/preview",
      formData,
      {
        timeout: 60000,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data;
  } catch (error) {
    throwApiError(error, "Unable to preview this statement.");
  }
};

export const previewEmailAlerts = async (emailText, bankName) => {
  try {
    const response = await api.post(
      "/bank-import/email/preview",
      {
        accountId: null,
        bankName,
        emailText,
      },
      {
        timeout: 60000,
      },
    );

    return response.data;
  } catch (error) {
    throwApiError(error, "Unable to preview these email alerts.");
  }
};

export const confirmImport = async (importId) => {
  try {
    const response = await api.post(
      `/bank-import/${importId}/confirm`,
      {},
      {
        timeout: 60000,
      },
    );

    return response.data;
  } catch (error) {
    throwApiError(error, "Unable to confirm this import.");
  }
};
