const express = require("express");

const {
  getAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
} = require("../controllers/attendanceController");

const authMiddleware = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const employeeAccessMiddleware = require("../middleware/employeeAccessMiddleware");

const router = express.Router();

/* =========================================================
   GET ATTENDANCE
   Admin/HR: view all
   Employee: view own attendance only
========================================================= */

router.get(
  "/:employeeId/attendance",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role === "Employee") {
      return employeeAccessMiddleware(req, res, next);
    }

    return authorize("attendance", "view")(req, res, next);
  },
  getAttendance
);

/* =========================================================
   CREATE ATTENDANCE
   Admin: Add
   HR: Manage
   Employee: Not allowed
========================================================= */

router.post(
  "/:employeeId/attendance",
  authMiddleware,
  authorize("attendance", "add"),
  createAttendance
);

/* =========================================================
   UPDATE ATTENDANCE
   Admin: Edit
   HR: Manage/Edit
   Employee: Not allowed
========================================================= */

router.put(
  "/:employeeId/attendance/:attendanceId",
  authMiddleware,
  authorize("attendance", "edit"),
  updateAttendance
);

/* =========================================================
   DELETE ATTENDANCE
   Admin: Delete
   HR/Employee: Not allowed
========================================================= */

router.delete(
  "/:employeeId/attendance/:attendanceId",
  authMiddleware,
  authorize("attendance", "delete"),
  deleteAttendance
);

module.exports = router;
