import { createContext, useContext, useState, useCallback } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

/**
 * Decode the user id and email from a JWT payload (no verification — just parsing).
 */
const parseToken = (token) => {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return { id: payload.sub, email: payload.email };
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("access_token"));
  const [currentUser, setCurrentUser] = useState(() =>
    parseToken(localStorage.getItem("access_token"))
  );

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/login", { email, password });
    localStorage.setItem("access_token", data.access_token);
    setToken(data.access_token);
    setCurrentUser(parseToken(data.access_token));
  }, []);

  const register = useCallback(async (email, password) => {
    await api.post("/register", { email, password });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    setToken(null);
    setCurrentUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, currentUser, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
