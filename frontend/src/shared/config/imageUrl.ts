const API = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
const SERVER = import.meta.env.VITE_API_BASE_URL || API.replace("/api", "");

const isExternal = (value: string) =>
  value.startsWith("http://") || value.startsWith("https://");

export const getImageUrl = (path?: string | null): string => {
  if (!path) return "";

  const value = String(path).trim();
  if (!value) return "";

  // Full external URL (Google avatar, CDN, etc.)
  if (isExternal(value)) {
    return value;
  }

  // Old custom format support: xxx|||actualPath
  if (value.includes("|||")) {
    const actual = value.split("|||")[1]?.trim() || "";
    if (!actual) return "";

    if (isExternal(actual)) return actual;
    if (actual.startsWith("/")) return `${SERVER}${actual}`;

    // relative uploaded filename
    return `${SERVER}/uploads/profiles/${actual}`;
  }

  // Normal local uploaded path
  if (value.startsWith("/uploads/")) {
    return `${SERVER}${value}`;
  }

  // Any other absolute backend path
  if (value.startsWith("/")) {
    return `${SERVER}${value}`;
  }

  // Plain filename
  return `${SERVER}/uploads/profiles/${value}`;
};

export const getAvatarUrl = (avatar?: string | null): string => {
  return getImageUrl(avatar);
};