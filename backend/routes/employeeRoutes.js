const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,

  // Attendance
  getAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,

  // Performance
  getPerformanceReviews,
  createPerformanceReview,
  updatePerformanceReview,
  deletePerformanceReview,

  // Documents
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
} = require("../controllers/employeeController");

const authMiddleware = require("../middleware/authMiddleware");

const {
  authorize,
} = require("../middleware/roleMiddleware");

const employeeAccessMiddleware = require(
  "../middleware/employeeAccessMiddleware"
);

const router = express.Router();

/* =========================================================
   DOCUMENT UPLOAD CONFIGURATION
========================================================= */

const uploadDirectory = path.join(
  __dirname,
  "../uploads/documents"
);

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true,
  });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only PDF, JPG, PNG, DOC and DOCX files are allowed"
        )
      );
    }
  },
});

/* =========================================================
   EMPLOYEE ROUTES
========================================================= */

/* =========================================================
   GET ALL EMPLOYEES
========================================================= */

// Admin → all employees
// HR → all employees
// Employee → own employee profile only

router.get(
  "/",
  authMiddleware,

  (req, res, next) => {
    console.log(
      "GET /api/employees",
      "Role:",
      req.user?.role,
      "Employee ID:",
      req.user?.employeeId
    );

    // -------------------------------------------------------
    // EMPLOYEE
    // -------------------------------------------------------
    if (req.user.role === "Employee") {
      if (!req.user.employeeId) {
        return res.status(403).json({
          message:
            "Your account is not linked to an employee profile",
        });
      }

      // Continue to getEmployees()
      return next();
    }

    // -------------------------------------------------------
    // ADMIN / HR
    // -------------------------------------------------------
    if (
      req.user.role === "Admin" ||
      req.user.role === "HR"
    ) {
      // Check permission, then continue to getEmployees()
      return authorize(
        "employees",
        "view"
      )(req, res, next);
    }

    // -------------------------------------------------------
    // INVALID ROLE
    // -------------------------------------------------------
    return res.status(403).json({
      message: "Invalid user role",
    });
  },

  // IMPORTANT:
  // The actual controller is now a separate handler.
  getEmployees
);

/*
=========================================================
ADD EMPLOYEE
=========================================================

Admin + HR
*/

router.post(
  "/",
  authMiddleware,
  authorize("employees", "add"),
  createEmployee
);

/*
=========================================================
UPDATE EMPLOYEE
=========================================================

Admin + HR
*/

router.put(
  "/:id",
  authMiddleware,
  authorize("employees", "edit"),
  updateEmployee
);

/*
=========================================================
DELETE EMPLOYEE
=========================================================

Admin only
*/

router.delete(
  "/:id",
  authMiddleware,
  authorize("employees", "delete"),
  deleteEmployee
);

/*
=========================================================
VIEW INDIVIDUAL EMPLOYEE
=========================================================

Admin → Any employee
HR → Any employee
Employee → Own employee only
*/

router.get(
  "/:id",
  authMiddleware,
  employeeAccessMiddleware,
  getEmployee
);

/* =========================================================
   ATTENDANCE ROUTES
========================================================= */

/*
GET ATTENDANCE
*/

router.get(
  "/:employeeId/attendance",
  authMiddleware,
  employeeAccessMiddleware,
  (req, res, next) => {

    if (
      req.user.role === "Admin" ||
      req.user.role === "HR"
    ) {
      return authorize(
        "attendance",
        "view"
      )(
        req,
        res,
        next
      );
    }

    next();
  },
  getAttendance
);

/*
ADD ATTENDANCE
*/

router.post(
  "/:employeeId/attendance",
  authMiddleware,
  authorize("attendance", "add"),
  createAttendance
);

/*
UPDATE ATTENDANCE
*/

router.put(
  "/:employeeId/attendance/:attendanceId",
  authMiddleware,
  authorize("attendance", "edit"),
  updateAttendance
);

/*
DELETE ATTENDANCE
*/

router.delete(
  "/:employeeId/attendance/:attendanceId",
  authMiddleware,
  authorize("attendance", "delete"),
  deleteAttendance
);

/* =========================================================
   PERFORMANCE ROUTES
========================================================= */

/*
GET PERFORMANCE
*/

router.get(
  "/:employeeId/performance",
  authMiddleware,
  employeeAccessMiddleware,
  (req, res, next) => {

    if (
      req.user.role === "Admin" ||
      req.user.role === "HR"
    ) {
      return authorize(
        "performance",
        "view"
      )(
        req,
        res,
        next
      );
    }

    next();
  },
  getPerformanceReviews
);

/*
ADD PERFORMANCE REVIEW
*/

router.post(
  "/:employeeId/performance",
  authMiddleware,
  authorize("performance", "add"),
  createPerformanceReview
);

/*
UPDATE PERFORMANCE REVIEW
*/

router.put(
  "/:employeeId/performance/:reviewId",
  authMiddleware,
  authorize("performance", "edit"),
  updatePerformanceReview
);

/*
DELETE PERFORMANCE REVIEW
*/

router.delete(
  "/:employeeId/performance/:reviewId",
  authMiddleware,
  authorize("performance", "delete"),
  deletePerformanceReview
);

/* =========================================================
   DOCUMENT ROUTES
========================================================= */

/*
GET DOCUMENTS
*/

router.get(
  "/:employeeId/documents",
  authMiddleware,
  employeeAccessMiddleware,
  (req, res, next) => {

    if (
      req.user.role === "Admin" ||
      req.user.role === "HR"
    ) {
      return authorize(
        "documents",
        "view"
      )(
        req,
        res,
        next
      );
    }

    next();
  },
  getDocuments
);

/*
ADD DOCUMENT
*/

router.post(
  "/:employeeId/documents",
  authMiddleware,
  employeeAccessMiddleware,
  (req, res, next) => {
    // Employees can upload only to their own profile.
    // Admin/HR must have the normal employee-add permission.
    if (req.user?.role === "Employee") {
      return next();
    }

    return authorize("documents", "add")(req, res, next);
  },
  upload.single("documentFile"),
  createDocument
);

/*
UPDATE DOCUMENT
*/

router.put(
  "/:employeeId/documents/:documentId",
  authMiddleware,
  employeeAccessMiddleware,
  (req, res, next) => {
    if (req.user?.role === "Employee") {
      return next();
    }

    return authorize("documents", "edit")(req, res, next);
  },
  upload.single("documentFile"),
  updateDocument
);

/*
DELETE DOCUMENT
*/

router.delete(
  "/:employeeId/documents/:documentId",
  authMiddleware,
  employeeAccessMiddleware,
  (req, res, next) => {
    if (req.user?.role === "Employee") {
      return next();
    }

    return authorize("documents", "delete")(req, res, next);
  },
  deleteDocument
);

/* =========================================================
   EXPORT ROUTER
========================================================= */

module.exports = router;