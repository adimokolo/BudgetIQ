import axios from "axios";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TOKEN_KEY } from "./constants";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://dic5erfj6c3p4.cloudfront.net/api";

// SecureStore keys may only contain letters, numbers, ".", "-" and "_"
const SECURE_TOKEN_KEY = "budgetiq_token";

export const saveToken = async (token) => {
  await SecureStore.setItemAsync(SECURE_TOKEN_KEY, token);
};

export const readToken = async () => {
  const token = await SecureStore.getItemAsync(SECURE_TOKEN_KEY);
  if (token) return token;

  // One-time migration for users already logged in via AsyncStorage
  const legacy = await AsyncStorage.getItem(TOKEN_KEY);
  if (legacy) {
    await SecureStore.setItemAsync(SECURE_TOKEN_KEY, legacy);
    await AsyncStorage.removeItem(TOKEN_KEY);
    return legacy;
  }

  return null;
};

export const removeToken = async () => {
  await SecureStore.deleteItemAsync(SECURE_TOKEN_KEY);
  await AsyncStorage.removeItem(TOKEN_KEY);
};

const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await readToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (__DEV__) {
      console.log("API request:", {
        method: config.method,
        url: `${config.baseURL}${config.url}`,
      });
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (__DEV__) {
      console.log("API error:", {
        message: error.message,
        url: `${error.config?.baseURL || ""}${error.config?.url || ""}`,
        status: error.response?.status,
        data: error.response?.data,
      });
    }

    return Promise.reject(error);
  },
);

export default api;
