const rawBase = import.meta.env.VITE_API_URL || "";

export const apiUrl = (path: string) => {
  const normalizedPath = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  if (rawBase) {
    const base = rawBase.replace(/\/$/, "");
    return `${base}${normalizedPath}`;
  }
  return normalizedPath;
};

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers || {});
  if (!headers.has("x-api-key")) {
    headers.set("x-api-key", import.meta.env.VITE_PYQ_API_KEY || "arjunonfire");
  }
  return fetch(input, { ...init, headers });
}

