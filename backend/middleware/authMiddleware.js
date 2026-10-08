const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Employee = require("../models/Employee");

const authMiddleware = async (req, res, next) => {
  try {
    // =========================================================
    // 1. CHECK AUTHORIZATION HEADER
    // =========================================================

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];

    // =========================================================
    // 2. VERIFY JWT
    // =========================================================

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (!decoded?.id) {
      return res.status(401).json({
        message: "Invalid authentication token",
      });
    }

    // =========================================================
    // 3. ALWAYS FETCH CURRENT USER FROM DATABASE
    //
    // IMPORTANT:
    // Do NOT trust role/isActive from the JWT.
    // The database is the source of truth.
    // =========================================================

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: "User account not found",
      });
    }

    // =========================================================
    // 4. CHECK CURRENT USER STATUS
    //
    // This makes an old JWT useless after deactivation.
    // =========================================================

    if (user.isActive !== true) {
      return res.status(403).json({
        message: "Your account is inactive",
      });
    }

    // =========================================================
    // 5. CURRENT ROLE FROM DATABASE
    //
    // Never use decoded.role because it could be stale.
    // =========================================================

    const role = user.role;

    // =========================================================
    // 6. HR APPROVAL CHECK
    // =========================================================

    if (role === "HR") {
      if (user.registrationStatus !== "Approved") {
        return res.status(403).json({
          message: "Your HR account is not approved",
        });
      }
    }

    // =========================================================
    // 7. ADMIN / HR EMPLOYEE PROFILE CHECK
    // =========================================================

    if (role === "Admin" || role === "HR") {
      let employee = null;

      // First try the User → Employee relationship
      if (user.employee) {
        employee = await Employee.findById(user.employee);
      }

      // Fallback to email matching
      if (!employee && user.email) {
        employee = await Employee.findOne({
          email: user.email.trim().toLowerCase(),
        });
      }

      // Employee profile must exist
      if (!employee) {
        return res.status(403).json({
          message: "Your Employee Profile was not found",
        });
      }

      // =======================================================
      // 8. CHECK CURRENT EMPLOYEE STATUS
      //
      // This is important even when User.isActive is true.
      // =======================================================

      if (employee.status !== "Active") {
        return res.status(403).json({
          message: "Your account is inactive",
        });
      }

      // =======================================================
      // 9. REPAIR BROKEN USER ↔ EMPLOYEE LINK
      // =======================================================

      if (
        String(user.employee || "") !==
        String(employee._id)
      ) {
        user.employee = employee._id;
        await user.save();
      }

      // =======================================================
      // 10. BUILD req.user USING CURRENT DATABASE DATA
      // =======================================================

      req.user = {
        id: user._id,
        role: user.role,
        employeeId: employee._id,
        email: user.email,
      };

      return next();
    }

    // =========================================================
    // 11. NORMAL EMPLOYEE
    // =========================================================

    if (role === "Employee") {
      if (!user.employee) {
        return res.status(403).json({
          message:
            "Your Employee account is not linked to an Employee Profile",
        });
      }

      const employee = await Employee.findById(
        user.employee
      );

      if (!employee) {
        return res.status(403).json({
          message: "Your Employee Profile was not found",
        });
      }

      // Current Employee status is checked from DB
      if (employee.status !== "Active") {
        return res.status(403).json({
          message: "Your account is inactive",
        });
      }

      req.user = {
        id: user._id,
        role: user.role,
        employeeId: employee._id,
        email: user.email,
      };

      return next();
    }

    // =========================================================
    // 12. UNKNOWN / INVALID ROLE
    // =========================================================

    return res.status(403).json({
      message: "Invalid user role",
    });

  } catch (error) {
    console.error("Authentication error:", error);

    // JWT errors
    if (
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        message: "Your session has expired. Please log in again.",
      });
    }

    if (
      error.name === "JsonWebTokenError"
    ) {
      return res.status(401).json({
        message: "Invalid authentication token",
      });
    }

    return res.status(401).json({
      message: "Authentication failed",
    });
  }
};

module.exports = authMiddleware;