// frontend/src/services/accounts.js
import apiClient from '../api/client';

export const getAccounts = async () => {
  const response = await apiClient.get('/accounts');
  return response.data;
};

export const createAccount = async ({ name, currency, initialAmount, notes }) => {
  const response = await apiClient.post('/accounts', {
    name, currency, initialAmount, notes
  });
  return response.data;
};

export const updateAccount = async (accountId, { name, currency, initialAmount, notes }) => {
  const response = await apiClient.put(`/accounts/${accountId}`, {
    name, currency, initialAmount, notes
  });
  return response.data;
};

export const deleteAccount = async (accountId) => {
  const response = await apiClient.delete(`/accounts/${accountId}`);
  return response.data;
};
