const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const normalizedApiOrigin = rawApiUrl
  .replace(/\/+$/, "")
  .replace(/\/api\/?$/, "");

export const API_ORIGIN = normalizedApiOrigin;
export const API_BASE_URL = `${normalizedApiOrigin}/api`;
