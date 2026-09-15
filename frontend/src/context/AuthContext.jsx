import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const AuthContext = createContext(null);

const API_URL = "http://127.0.0.1:5000/api";

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("employeehub_token");
    const savedUser = localStorage.getItem("employeehub_user");

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Failed to restore login:", error);
        localStorage.removeItem("employeehub_token");
        localStorage.removeItem("employeehub_user");
      }
    }

    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Invalid email or password");
    }

    localStorage.setItem("employeehub_token", data.token);
    localStorage.setItem("employeehub_user", JSON.stringify(data.user));

    setToken(data.token);
    setUser(data.user);

    return data;
  };

  const register = async ({
    name,
    email,
    password,
    role,
    jobRole,
    department,
  }) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        jobRole: jobRole?.trim() || "",
        department: department?.trim() || "",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Registration failed");
    }

    // Employee: backend returns a token and the account is active immediately.
    if (data.token && data.user) {
      localStorage.setItem("employeehub_token", data.token);
      localStorage.setItem("employeehub_user", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    }

    return data;
  };

  const authFetch = async (url, options = {}) => {
    const savedToken = localStorage.getItem("employeehub_token");

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        ...(savedToken
          ? { Authorization: `Bearer ${savedToken}` }
          : {}),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  };

  const getHrRequests = async () => {
    return authFetch(`${API_URL}/auth/hr-requests`);
  };

  const approveHr = async (userId) => {
    const data = await authFetch(`${API_URL}/auth/hr-requests/${userId}/approve`, {
      method: "PATCH",
    });
    return data;
  };

  const rejectHr = async (userId) => {
    const data = await authFetch(`${API_URL}/auth/hr-requests/${userId}/reject`, {
      method: "PATCH",
    });
    return data;
  };

  const logout = () => {
    localStorage.removeItem("employeehub_token");
    localStorage.removeItem("employeehub_user");
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token && user),
    login,
    register,
    getHrRequests,
    approveHr,
    rejectHr,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;
