import apiClient from "../api/client";

export const previewStatement = async (accountId, file, bankName) => {
  const formData = new FormData();

  formData.append("accountId", String(accountId));
  formData.append("bankName", bankName);
  formData.append("statement", file);

  const response = await apiClient.post(
    "/bank-import/statement/preview",
    formData,
    {
      timeout: 60000,
    },
  );

  return response.data;
};

export const previewEmailAlerts = async (emailText, bankName) => {
  const response = await apiClient.post("/bank-import/email/preview", {
    accountId: null,
    bankName,
    emailText,
  });

  return response.data;
};

export const confirmImport = async (importId) => {
  const response = await apiClient.post(
    `/bank-import/${importId}/confirm`,
  );

  return response.data;
};
