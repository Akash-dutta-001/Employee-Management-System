
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import AuthProvider from "./context/AuthContext";
import PermissionProvider from "./context/PermissionContext";
import { ThemeProvider } from "./context/ThemeContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ThemeProvider>
    <AuthProvider>
      <PermissionProvider>
        <App />
      </PermissionProvider>
    </AuthProvider>
  </ThemeProvider>
);
