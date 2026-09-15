const express = require("express");

const {
  getLeaves,
  createLeave,
  updateLeave,
  deleteLeave,
} = require("../controllers/leaveController");

const Employee = require("../models/Employee");

const authMiddleware = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const employeeAccessMiddleware = require("../middleware/employeeAccessMiddleware");

const router = express.Router();

// =========================================================
// GET LEAVES
// =========================================================
// Employee -> own leaves only
// HR/Admin -> can view leaves
// =========================================================

router.get(
  "/:employeeId/leaves",
  authMiddleware,
  (req, res, next) => {
    if (req.user?.role === "Employee") {
      return employeeAccessMiddleware(req, res, next);
    }

    if (req.user?.role === "HR" || req.user?.role === "Admin") {
      return authorize("leave", "view")(req, res, next);
    }

    return res.status(403).json({
      message: "You do not have permission to view leaves",
    });
  },
  getLeaves
);

// =========================================================
// CREATE / APPLY LEAVE
// =========================================================
// Employee -> can apply for own leave
// HR       -> can apply for own leave
// Admin    -> can add leave for employees
//
// IMPORTANT:
// HR is NOT passed through authorize("leave", "add") because
// some permission matrices do not give HR the generic "add"
// permission. The controller checks that HR is applying only
// for their own Employee profile.
// =========================================================

router.post(
  "/:employeeId/leaves",
  authMiddleware,
  (req, res, next) => {
    // Employee
    if (req.user?.role === "Employee") {
      return employeeAccessMiddleware(req, res, next);
    }

    // HR
    // Controller will verify that the HR user is applying
    // only for their own employee profile.
    if (req.user?.role === "HR") {
      return createLeave(req, res, next);
    }

    // Admin
    if (req.user?.role === "Admin") {
      return authorize("leave", "add")(req, res, next);
    }

    return res.status(403).json({
      message: "You do not have permission to apply for leave",
    });
  },
  createLeave
);

// =========================================================
// UPDATE LEAVE
// =========================================================
// Employee -> cannot approve/reject/edit
//
// HR:
//   - Can approve/reject normal Employee leave
//   - CANNOT approve/reject HR leave
//
// Admin:
//   - Can approve/reject Employee leave
//   - Can approve/reject HR leave
//   - Can edit leave
// =========================================================

router.put(
  "/:employeeId/leaves/:leaveId",
  authMiddleware,
  async (req, res, next) => {
    try {
      // -----------------------------------------------------
      // EMPLOYEE
      // -----------------------------------------------------

      if (req.user?.role === "Employee") {
        return res.status(403).json({
          message:
            "Employees cannot approve, reject, or edit leave requests",
        });
      }

      // -----------------------------------------------------
      // ADMIN
      // -----------------------------------------------------

      if (req.user?.role === "Admin") {
        return authorize("leave", "edit")(req, res, next);
      }

      // -----------------------------------------------------
      // HR
      // -----------------------------------------------------

      if (req.user?.role === "HR") {
        // HR can ONLY approve or reject
        if (
          req.body.status !== "Approved" &&
          req.body.status !== "Rejected"
        ) {
          return res.status(403).json({
            message:
              "HR can only approve or reject employee leave requests",
          });
        }

        // Find the employee whose leave is being changed
        const employee = await Employee.findById(req.params.employeeId);

        if (!employee) {
          return res.status(404).json({
            message: "Employee not found",
          });
        }

        // ---------------------------------------------------
        // IMPORTANT:
        // HR cannot approve/reject another HR's leave.
        // Only Admin can do that.
        // ---------------------------------------------------

        if (employee.role === "HR") {
          return res.status(403).json({
            message:
              "HR cannot approve or reject HR leave requests. Only Admin can approve or reject HR leave requests.",
          });
        }

        // HR approving Employee leave
        if (req.body.status === "Approved") {
          return authorize("leave", "approve")(req, res, next);
        }

        // HR rejecting Employee leave
        if (req.body.status === "Rejected") {
          return authorize("leave", "reject")(req, res, next);
        }
      }

      return res.status(403).json({
        message:
          "You do not have permission to manage leave requests",
      });
    } catch (error) {
      console.error("Leave permission check error:", error);

      return res.status(500).json({
        message: "Failed to verify leave permissions",
        error: error.message,
      });
    }
  },
  updateLeave
);

// =========================================================
// DELETE LEAVE
// =========================================================
// Admin only through permission middleware
// =========================================================

router.delete(
  "/:employeeId/leaves/:leaveId",
  authMiddleware,
  authorize("leave", "delete"),
  deleteLeave
);

// =========================================================
// EXPORT ROUTER
// =========================================================

module.exports = router;