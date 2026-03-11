import axios from "axios";

// Read backend base URL from .env
// Example: VITE_API_BASE_URL=http://localhost:5001
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

// Create axios instance
const axiosInstance = axios.create({
  // Final API base becomes: http://localhost:5001/api
  baseURL: `${BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
// Automatically attach JWT token from localStorage if available
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
// If token is invalid or expired, force logout and redirect to login page
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      alert("Unauthorized! Please login again.");
      localStorage.clear();
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;