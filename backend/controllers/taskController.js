const Employee = require("../models/Employee");

// Check whether the logged-in employee owns the requested employee profile
const checkEmployeeOwnership = (req, res) => {
  if (req.user.role !== "Employee") {
    return true;
  }

  if (!req.user.employeeId) {
    res.status(403).json({
      message: "Your account is not linked to an employee profile",
    });
    return false;
  }

  if (
    String(req.user.employeeId) !==
    String(req.params.employeeId)
  ) {
    res.status(403).json({
      message: "You can only access your own tasks",
    });
    return false;
  }

  return true;
};

// GET all tasks for an employee
const getTasks = async (req, res) => {
  try {
    // Extra controller-level protection
    if (!checkEmployeeOwnership(req, res)) {
      return;
    }

    const employee = await Employee.findById(
      req.params.employeeId
    );

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    res.status(200).json(employee.tasks);
  } catch (error) {
    console.error("Get tasks error:", error);

    res.status(500).json({
      message: "Failed to fetch tasks",
      error: error.message,
    });
  }
};

// CREATE task
const createTask = async (req, res) => {
  try {
    const employee = await Employee.findById(
      req.params.employeeId
    );

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    employee.tasks.push({
      title: req.body.title,
      description: req.body.description || "",
      status: req.body.status || "Pending",
      priority: req.body.priority || "Medium",
      dueDate: req.body.dueDate || "",
      hours: Number(req.body.hours) || 0,
    });

    await employee.save();

    const newTask =
      employee.tasks[employee.tasks.length - 1];

    res.status(201).json(newTask);
  } catch (error) {
    console.error("Create task error:", error);

    res.status(400).json({
      message: "Failed to create task",
      error: error.message,
    });
  }
};

// UPDATE task
const updateTask = async (req, res) => {
  try {
    // Employees can update only their own tasks
    if (!checkEmployeeOwnership(req, res)) {
      return;
    }

    const employee = await Employee.findById(
      req.params.employeeId
    );

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    const task = employee.tasks.id(req.params.taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    if (req.body.title !== undefined) {
      task.title = req.body.title;
    }

    if (req.body.description !== undefined) {
      task.description = req.body.description;
    }

    if (req.body.status !== undefined) {
      task.status = req.body.status;
    }

    if (req.body.priority !== undefined) {
      task.priority = req.body.priority;
    }

    if (req.body.dueDate !== undefined) {
      task.dueDate = req.body.dueDate;
    }

    if (req.body.hours !== undefined) {
      task.hours = Number(req.body.hours) || 0;
    }

    await employee.save();

    res.status(200).json(task);
  } catch (error) {
    console.error("Update task error:", error);

    res.status(400).json({
      message: "Failed to update task",
      error: error.message,
    });
  }
};

// DELETE task
const deleteTask = async (req, res) => {
  try {
    // Extra protection even if this controller is called
    // from another route in the future
    if (!checkEmployeeOwnership(req, res)) {
      return;
    }

    const employee = await Employee.findById(
      req.params.employeeId
    );

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    const task = employee.tasks.id(req.params.taskId);

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    task.deleteOne();

    await employee.save();

    res.status(200).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error);

    res.status(500).json({
      message: "Failed to delete task",
      error: error.message,
    });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
};