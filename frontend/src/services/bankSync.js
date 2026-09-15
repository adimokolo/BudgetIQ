// frontend/src/services/bankSync.js
import apiClient from '../api/client';

export const initiateSync = async ({ name, email, reference }) => {
  const response = await apiClient.post('/bank-sync/initiate', {
    name, email, reference
  });
  return response.data;
};

export const authorizeAccount = async (code) => {
  const response = await apiClient.post('/bank-sync/accounts', { code });
  return response.data;
};

export const getBankAccount = async (accountId) => {
  const response = await apiClient.get(`/bank-sync/account/${accountId}`);
  return response.data;
};

export const getBankTransactions = async (accountId) => {
  const response = await apiClient.get(`/bank-sync/account/${accountId}/transactions`);
  return response.data;
};
