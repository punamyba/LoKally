const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

export const getImageUrl = (path?: string | null) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${BASE_URL}${path}`;
};

export const getBaseUrl = () => BASE_URL;