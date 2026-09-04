import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { refreshToken } from "../services/authServices";

const BASE_URL = import.meta.env.VITE_SERVER_SIDE_URL + "/api";

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const API = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

API.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const originalRequest = err.config as RetryableRequestConfig | undefined;

    if (
      err.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/refresh-token")
    ) {
      originalRequest._retry = true;

      try {
        await refreshToken();
        return API(originalRequest);
      } catch (refreshError) {
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }

    // General error logging
    if (err.response) {
      console.error("API Error:", err.response.data);
      return Promise.reject(err.response.data);
    } else if (err.request) {
      console.error("No response received:", err.request);
      return Promise.reject({ message: "No response from server" });
    } else {
      console.error("Request setup error:", err.message);
      return Promise.reject({ message: err.message });
    }
  }
);

export default API;