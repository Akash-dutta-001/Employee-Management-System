import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePermissions } from "../context/PermissionContext";

function PermissionRoute({ module, action = "view" }) {
  const { isAuthenticated, loading } = useAuth();
  const { hasPermission } = usePermissions();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600" />

          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Checking permissions...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // Normal permissions are used for Admin/HR.
  // Employee own-data modules use view_own instead of full view.
  const allowed =
    hasPermission(module, action) ||
    (action === "view" && hasPermission(module, "view_own"));

  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default PermissionRoute;
