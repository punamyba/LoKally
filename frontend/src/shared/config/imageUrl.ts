const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

export function getImageUrl(path?: string | null): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${BASE_URL}${path}`;
}

export function getBaseUrl(): string {
  return BASE_URL;
}