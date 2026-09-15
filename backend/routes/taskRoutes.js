const express = require("express");

const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");

const authMiddleware = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const employeeAccessMiddleware = require("../middleware/employeeAccessMiddleware");

const router = express.Router();

/*
  TASK RBAC

  Admin:
  - View
  - Add
  - Edit
  - Delete

  HR:
  - View
  - Add
  - Edit

  Employee:
  - View own tasks
  - Edit own tasks
*/

// GET tasks
// Admin/HR -> all employee tasks
// Employee -> own tasks only
router.get(
  "/:employeeId/tasks",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role === "Employee") {
      return employeeAccessMiddleware(req, res, next);
    }

    return authorize("tasks", "view")(req, res, next);
  },
  getTasks
);

// CREATE task
// Admin + HR only
router.post(
  "/:employeeId/tasks",
  authMiddleware,
  authorize("tasks", "add"),
  createTask
);

// UPDATE task
// Admin/HR -> any task
// Employee -> own task only
router.put(
  "/:employeeId/tasks/:taskId",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role === "Employee") {
      return employeeAccessMiddleware(req, res, next);
    }

    return authorize("tasks", "edit")(req, res, next);
  },
  updateTask
);

// DELETE task
// Admin only
router.delete(
  "/:employeeId/tasks/:taskId",
  authMiddleware,
  authorize("tasks", "delete"),
  deleteTask
);

module.exports = router;