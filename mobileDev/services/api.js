import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TOKEN_KEY } from "./constants";

const api = axios.create({
  baseURL: "http://10.0.2.2:5000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);

    console.log(
      "API REQUEST:",
      config.method?.toUpperCase(),
      `${config.baseURL}${config.url}`,
    );

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("AUTH TOKEN: Attached");
    } else {
      console.log("AUTH TOKEN: Missing");
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    console.log("API RESPONSE:", response.status, response.data);
    return response;
  },
  (error) => {
    console.log("API RESPONSE ERROR:", error.message);
    console.log(
      "API URL:",
      `${error.config?.baseURL || ""}${error.config?.url || ""}`,
    );
    console.log("STATUS:", error.response?.status);
    console.log("DATA:", error.response?.data);

    return Promise.reject(error);
  },
);

export default api;
