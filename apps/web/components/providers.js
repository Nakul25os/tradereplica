"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { apiRequest, getStoredToken, setStoredToken } from "@/lib/api";

const ThemeContext = createContext(null);
const AuthContext = createContext(null);

export function Providers({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("tradereplica_theme");
    const initialTheme =
      savedTheme ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");

    setTheme(initialTheme);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("tradereplica_theme", theme);
  }, [theme]);

  const value = {
    theme,
    toggleTheme: () =>
      setTheme((currentTheme) =>
        currentTheme === "dark" ? "light" : "dark"
      ),
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = getStoredToken();

    if (!savedToken) {
      setLoading(false);
      return;
    }

    setToken(savedToken);
  }, []);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    let active = true;

    const loadUser = async () => {
      try {
        const response = await apiRequest("/auth/me", { token });

        if (!active) {
          return;
        }

        setUser(response.user);
      } catch (error) {
        if (!active) {
          return;
        }

        setStoredToken(null);
        setToken(null);
        setUser(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadUser();

    return () => {
      active = false;
    };
  }, [token]);

  const value = {
    token,
    user,
    loading,
    authenticated: Boolean(token && user),
    login: ({ token: nextToken, user: nextUser }) => {
      setStoredToken(nextToken);
      setToken(nextToken);
      setUser(nextUser);
    },
    logout: () => {
      setStoredToken(null);
      setToken(null);
      setUser(null);
    },
    refreshUser: async () => {
      if (!token) {
        return null;
      }

      const response = await apiRequest("/auth/me", { token });
      setUser(response.user);
      return response.user;
    },
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
export const useAuth = () => useContext(AuthContext);
