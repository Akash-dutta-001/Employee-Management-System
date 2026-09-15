const permissions = {
  Admin: {
    employees: ["view", "add", "edit", "delete"],
    attendance: ["view", "add", "edit", "delete"],
    tasks: ["view", "add", "edit", "delete"],
    leave: ["view", "add", "edit", "delete", "approve", "reject"],
    payroll: ["view", "add", "edit", "delete", "pay"],
    performance: ["view", "add", "edit", "delete"],
    reports: ["view"],
    documents: ["view", "add", "edit", "delete"],
    settings: ["view", "edit"],
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
    documents: ["view", "add", "edit", "delete"],
    settings: ["view"],
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
    documents: ["view_own", "add_own", "edit_own", "delete_own"],
    settings: ["view_own", "edit_own"],
    users: [],
  },
};

// =========================================================
// CHECK ROLE + PERMISSION
// =========================================================

const authorize = (module, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const role = req.user.role;

    const rolePermissions = permissions[role];

    if (!rolePermissions) {
      return res.status(403).json({
        message: "Invalid user role",
      });
    }

    const modulePermissions =
      rolePermissions[module] || [];

    if (!modulePermissions.includes(action)) {
      return res.status(403).json({
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
};

// =========================================================
// ROLE ONLY
// =========================================================

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have permission to access this resource",
      });
    }

    next();
  };
};

// =========================================================
// EXPORTS
// =========================================================

module.exports = {
  permissions,
  authorize,
  authorizeRoles,
};