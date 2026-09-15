import { createContext, useContext } from "react";
import { useAuth } from "./AuthContext";

const PermissionContext = createContext(null);

/*
=========================================================
FRONTEND RBAC PERMISSIONS

These match the permission structure selected for
EmployeeHub.
=========================================================
*/

const permissions = {
  Admin: {
    employees: ["view", "add", "edit", "delete"],
    attendance: ["view", "add", "edit", "delete"],
    tasks: ["view", "add", "edit", "delete"],
    leave: ["view", "add", "edit", "delete", "approve", "reject"],
    payroll: ["view", "add", "edit", "delete", "pay"],
    performance: ["view", "add", "edit", "delete"],
    reports: ["view"],
    settings: ["view", "edit"],
    documents: ["view", "add", "edit", "delete"],
    users: ["view", "add", "edit", "delete"],
  },

  HR: {
    employees: ["view", "add", "edit"],
    attendance: ["view", "add", "edit"],
    tasks: ["view", "add", "edit"],
    leave: ["view", "approve", "reject"],
    payroll: ["view", "add", "edit", "pay"],
    performance: ["view", "add", "edit"],
    reports: ["view"],
    settings: ["view"],
    documents: ["view", "add", "edit", "delete"],
    users: ["view", "edit"],
  },

  Employee: {
    dashboard: ["view"],
    employees: ["view_own"],
    attendance: ["view_own"],
    tasks: ["view_own", "edit_own"],
    leave: ["view_own", "add_own"],
    payroll: ["view_own"],
    performance: ["view_own"],
    reports: [],
    settings: ["view_own", "edit_own"],
    documents: ["view_own", "add_own", "edit_own", "delete_own"],
    users: [],
  },
};

function PermissionProvider({ children }) {
  const { user } = useAuth();

  const role = user?.role;

  /*
  Check whether the current user's role has
  permission for a module/action.
  */
  const hasPermission = (module, action) => {
    if (!role) {
      return false;
    }

    const rolePermissions = permissions[role];

    if (!rolePermissions) {
      return false;
    }

    const modulePermissions = rolePermissions[module] || [];

    return modulePermissions.includes(action);
  };

  /*
  Check whether the user can access a module at all.
  */
  const canAccess = (module) => {
    if (!role) {
      return false;
    }

    const rolePermissions = permissions[role];

    if (!rolePermissions) {
      return false;
    }

    const modulePermissions = rolePermissions[module] || [];

    return modulePermissions.length > 0;
  };

  /*
  Convenience helpers
  */

  const isAdmin = role === "Admin";
  const isHR = role === "HR";
  const isEmployee = role === "Employee";

  const canView = (module) =>
    hasPermission(module, "view");

  const canAdd = (module) =>
    hasPermission(module, "add");

  const canEdit = (module) =>
    hasPermission(module, "edit");

  const canDelete = (module) =>
    hasPermission(module, "delete");

  const canApprove = (module) =>
    hasPermission(module, "approve");

  const canReject = (module) =>
    hasPermission(module, "reject");

  const canPay = (module) =>
    hasPermission(module, "pay");

  const canManageOwn = (module) =>
    hasPermission(module, "view_own");

  const value = {
    permissions,
    role,

    hasPermission,
    canAccess,

    canView,
    canAdd,
    canEdit,
    canDelete,
    canApprove,
    canReject,
    canPay,
    canManageOwn,

    isAdmin,
    isHR,
    isEmployee,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export const usePermissions = () =>
  useContext(PermissionContext);

export default PermissionProvider;