import { useEffect, useState } from "react";

import { AuthContext } from "./auth-context";
import { apiRequest } from "../services/api";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem("nivora_token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await apiRequest("/api/auth/me");
        setUser(currentUser);
      } catch {
        localStorage.removeItem("nivora_token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  const logout = () => {
    localStorage.removeItem("nivora_token");
    setUser(null);
  };

  const value = {
    user,
    setUser,
    loading,
    isAuthenticated: Boolean(user),
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}