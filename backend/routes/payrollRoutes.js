const express = require("express");

const {
  getPayrollRecords,
  getPayrollRecord,
  getEmployeePayroll,
  createPayroll,
  updatePayroll,
  deletePayroll,
  markPayrollAsPaid,
} = require("../controllers/payrollController");

const authMiddleware = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

const router = express.Router();

// =========================================================
// PAYROLL ROUTES - RBAC PROTECTED
// =========================================================

// =========================================================
// GET ALL PAYROLL RECORDS
// Admin + HR: all records
// Employee: own records only
// =========================================================
router.get(
  "/",
  authMiddleware,
  (req, res, next) => {
    console.log(
      "GET /api/payroll",
      "Role:",
      req.user?.role,
      "Employee ID:",
      req.user?.employeeId
    );

    if (req.user.role === "Employee") {
      if (!req.user.employeeId) {
        return res.status(403).json({
          message: "Your account is not linked to an employee profile",
        });
      }

      return next();
    }

    if (req.user.role === "Admin" || req.user.role === "HR") {
      return authorize("payroll", "view")(req, res, next);
    }

    return res.status(403).json({
      message: "Invalid user role",
    });
  },
  getPayrollRecords
);

// =========================================================
// GET PAYROLL RECORDS FOR SPECIFIC EMPLOYEE
// Admin + HR: any employee
// Employee: own employee only
// =========================================================
router.get(
  "/employee/:employeeId",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role === "Employee") {
      if (
        !req.user.employeeId ||
        String(req.user.employeeId) !== String(req.params.employeeId)
      ) {
        return res.status(403).json({
          message: "You can only access your own payroll records",
        });
      }

      return next();
    }

    if (req.user.role === "Admin" || req.user.role === "HR") {
      return authorize("payroll", "view")(req, res, next);
    }

    return res.status(403).json({
      message: "Invalid user role",
    });
  },
  getEmployeePayroll
);

// =========================================================
// GET ONE PAYROLL RECORD
// Admin + HR: any record
// Employee: own record only
// =========================================================
router.get(
  "/:id",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role === "Employee") {
      return next();
    }

    if (req.user.role === "Admin" || req.user.role === "HR") {
      return authorize("payroll", "view")(req, res, next);
    }

    return res.status(403).json({
      message: "Invalid user role",
    });
  },
  getPayrollRecord
);

// =========================================================
// CREATE PAYROLL RECORD
// Admin + HR
// =========================================================
router.post(
  "/",
  authMiddleware,
  authorize("payroll", "add"),
  createPayroll
);

// =========================================================
// UPDATE PAYROLL RECORD
// Admin + HR
// =========================================================
router.put(
  "/:id",
  authMiddleware,
  authorize("payroll", "edit"),
  updatePayroll
);

// =========================================================
// DELETE PAYROLL RECORD
// Admin only
// =========================================================
router.delete(
  "/:id",
  authMiddleware,
  authorize("payroll", "delete"),
  deletePayroll
);

// =========================================================
// MARK PAYROLL AS PAID
// Admin + HR
// =========================================================
router.patch(
  "/:id/pay",
  authMiddleware,
  authorize("payroll", "pay"),
  markPayrollAsPaid
);

module.exports = router;