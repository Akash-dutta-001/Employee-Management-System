import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const AuthContext = createContext(null);

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://employeehub-backend-y0or.onrender.com/api";

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

    return data;
  };

  const forgotPassword = async (email) => {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to send reset link");
    }

    return data;
  };

  const resetPassword = async (token, password) => {
    const response = await fetch(
      `${API_URL}/auth/reset-password/${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to reset password");
    }

    return data;
  };

  const verifyEmail = async (verificationToken) => {
    const response = await fetch(
      `${API_URL}/auth/verify-email/${encodeURIComponent(verificationToken)}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Email verification failed");
    }

    return data;
  };

  const requestAdminEmailChange = async (email) => {
    return authFetch(`${API_URL}/auth/admin/change-email`, {
      method: "POST",
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
      }),
    });
  };

  const verifyNewAdminEmail = async (verificationToken) => {
    const response = await fetch(
      `${API_URL}/auth/verify-new-email/${encodeURIComponent(
        verificationToken
      )}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Email verification failed");
    }

    return data;
  };

  const createAdmin = async ({
    name,
    email,
    password,
    jobRole,
    department,
  }) => {
    return authFetch(`${API_URL}/auth/admin/create`, {
      method: "POST",
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        jobRole: jobRole?.trim() || "",
        department: department?.trim() || "",
      }),
    });
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
    return authFetch(`${API_URL}/auth/hr-requests/${userId}/approve`, {
      method: "PATCH",
    });
  };

  const rejectHr = async (userId) => {
    return authFetch(`${API_URL}/auth/hr-requests/${userId}/reject`, {
      method: "PATCH",
    });
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
    forgotPassword,
    resetPassword,
    verifyEmail,
    requestAdminEmailChange,
    verifyNewAdminEmail,
    createAdmin,
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