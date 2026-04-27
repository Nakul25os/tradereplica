const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const getStoredToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem("tradereplica_token");
};

export const setStoredToken = (token) => {
  if (typeof window === "undefined") {
    return;
  }

  if (token) {
    window.localStorage.setItem("tradereplica_token", token);
  } else {
    window.localStorage.removeItem("tradereplica_token");
  }
};

export const apiRequest = async (
  path,
  { method = "GET", body, token, headers = {}, cache = "no-store" } = {}
) => {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    cache,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const buildQuery = (params) => {
  const searchParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.set(key, value);
  });

  const query = searchParams.toString();

  return query ? `?${query}` : "";
};

export default API_URL;
