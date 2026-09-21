import api from "./api";

export const previewStatement = async (accountId, file, bankName) => {
  const formData = new FormData();
  formData.append("accountId", String(accountId));
  formData.append("bankName", bankName);
  formData.append("statement", {
    uri: file.uri,
    name: file.name || "statement.csv",
    type: file.mimeType || "text/csv",
  });
  const response = await api.post("/bank-import/statement/preview", formData, {
    timeout: 60000,
  });
  return response.data;
};

export const previewEmailAlerts = async (accountId, emailText, bankName) => {
  const response = await api.post("/bank-import/email/preview", {
    accountId,
    bankName,
    emailText,
  });
  return response.data;
};

export const confirmImport = async (importId) => {
  const response = await api.post(`/bank-import/${importId}/confirm`);
  return response.data;
};
