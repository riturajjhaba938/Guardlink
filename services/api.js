import axios from "axios";
import * as SecureStore from "expo-secure-store";

const API_URL = "http://192.168.1.165:5000/api";

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  // Bypass localtunnel warning page
  config.headers["Bypass-Tunnel-Reminder"] = "true";
  
  const token = await SecureStore.getItemAsync("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const updateProfile = async (formData) => {
  const response = await api.put("/users/profile", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export default api;
