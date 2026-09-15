const Employee = require("../models/Employee");

/* =========================================================
   CHECK EMPLOYEE OWNERSHIP
========================================================= */

const checkEmployeeOwnership = (req, res) => {
  // Admin and HR can access employee records.
  if (req.user?.role !== "Employee") {
    return true;
  }

  // Normal Employee must have linked Employee profile.
  if (!req.user.employeeId) {
    res.status(403).json({
      message:
        "Your account is not linked to an employee profile",
    });

    return false;
  }

  // Employee can only access their own profile.
  if (
    String(req.user.employeeId) !==
    String(req.params.employeeId)
  ) {
    res.status(403).json({
      message:
        "You can only access your own leave records",
    });

    return false;
  }

  return true;
};


/* =========================================================
   GET LEAVES
   GET /api/employees/:employeeId/leaves

   ADMIN  -> View all
   HR     -> View all
   EMPLOYEE -> View own
========================================================= */

const getLeaves = async (req, res) => {
  try {
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

    return res.status(200).json(
      employee.leaves || []
    );
  } catch (error) {
    console.error("GET LEAVES ERROR:", error);

    return res.status(500).json({
      message: "Failed to get leaves",
      error: error.message,
    });
  }
};


/* =========================================================
   CREATE LEAVE
   POST /api/employees/:employeeId/leaves

   ADMIN
   -> Can create leave for any employee

   HR
   -> Can create leave only for own HR profile

   EMPLOYEE
   -> Can create leave only for own profile

   ALL NEW LEAVES = Pending
========================================================= */

const createLeave = async (req, res) => {
  try {
    const requesterRole = req.user?.role;

    const employeeId = req.params.employeeId;

    /* -------------------------------------------------------
       EMPLOYEE ID REQUIRED
    ------------------------------------------------------- */

    if (!employeeId) {
      return res.status(400).json({
        message: "Employee ID is required",
      });
    }

    /* -------------------------------------------------------
       FIND EMPLOYEE
    ------------------------------------------------------- */

    const employee = await Employee.findById(
      employeeId
    );

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    /* -------------------------------------------------------
       EMPLOYEE OWNERSHIP
    ------------------------------------------------------- */

    if (requesterRole === "Employee") {
      if (!req.user?.employeeId) {
        return res.status(403).json({
          message:
            "Your account is not linked to an employee profile",
        });
      }

      if (
        String(req.user.employeeId) !==
        String(employeeId)
      ) {
        return res.status(403).json({
          message:
            "You can only apply for leave for your own profile",
        });
      }
    }

    /* -------------------------------------------------------
       HR OWNERSHIP

       HR can apply for THEIR OWN leave.

       HR cannot create leave for another employee.
    ------------------------------------------------------- */

    if (requesterRole === "HR") {
      if (!req.user?.employeeId) {
        return res.status(403).json({
          message:
            "Your HR account is not linked to an employee profile",
        });
      }

      if (
        String(req.user.employeeId) !==
        String(employeeId)
      ) {
        return res.status(403).json({
          message:
            "HR can only apply for leave for their own profile",
        });
      }
    }

    /* -------------------------------------------------------
       REQUEST DATA
    ------------------------------------------------------- */

    const {
      leaveType,
      startDate,
      endDate,
      reason,
    } = req.body;

    /* -------------------------------------------------------
       REQUIRED FIELDS
    ------------------------------------------------------- */

    if (
      !leaveType ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({
        message:
          "Leave type, start date and end date are required",
      });
    }

    /* -------------------------------------------------------
       DATE VALIDATION
    ------------------------------------------------------- */

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return res.status(400).json({
        message: "Invalid leave dates",
      });
    }

    if (end < start) {
      return res.status(400).json({
        message:
          "End date cannot be before start date",
      });
    }

    /* -------------------------------------------------------
       CREATE LEAVE

       IMPORTANT:
       Client cannot directly set Approved/Rejected.

       Every newly created leave is Pending.
    ------------------------------------------------------- */

    const newLeave = {
      leaveType: String(leaveType).trim(),
      startDate,
      endDate,
      reason: reason
        ? String(reason).trim()
        : "",
      status: "Pending",
    };

    /* -------------------------------------------------------
       ADD LEAVE
    ------------------------------------------------------- */

    employee.leaves.push(newLeave);

    await employee.save();

    const createdLeave =
      employee.leaves[
        employee.leaves.length - 1
      ];

    console.log(
      `Leave created successfully | Requester: ${requesterRole} | Employee: ${employee.name}`
    );

    return res.status(201).json(
      createdLeave
    );
  } catch (error) {
    console.error(
      "CREATE LEAVE ERROR:",
      error
    );

    return res.status(500).json({
      message: "Failed to create leave",
      error: error.message,
    });
  }
};


/* =========================================================
   UPDATE LEAVE
   PUT /api/employees/:employeeId/leaves/:leaveId

   EMPLOYEE
   -> Cannot edit / approve / reject

   HR
   -> Can approve/reject Employee leave
   -> Cannot approve/reject HR leave
   -> Cannot edit leave details

   ADMIN
   -> Can edit
   -> Can approve/reject Employee leave
   -> Can approve/reject HR leave
========================================================= */

const updateLeave = async (req, res) => {
  try {
    const employee = await Employee.findById(
      req.params.employeeId
    );

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    const leave = employee.leaves.id(
      req.params.leaveId
    );

    if (!leave) {
      return res.status(404).json({
        message: "Leave record not found",
      });
    }

    const requesterRole = req.user?.role;

    /* =====================================================
       EMPLOYEE
    ===================================================== */

    if (requesterRole === "Employee") {
      return res.status(403).json({
        message:
          "Employees cannot approve, reject, or edit leave requests",
      });
    }

    /* =====================================================
       HR
    ===================================================== */

    if (requesterRole === "HR") {
      /*
        HR can ONLY approve or reject.
      */

      if (
        req.body.status !== "Approved" &&
        req.body.status !== "Rejected"
      ) {
        return res.status(403).json({
          message:
            "HR can only approve or reject employee leave requests",
        });
      }

      /*
        IMPORTANT:
        HR cannot approve/reject HR leave.
      */

      if (employee.role === "HR") {
        return res.status(403).json({
          message:
            "HR cannot approve or reject HR leave requests. Only Admin can approve or reject HR leave requests.",
        });
      }

      /* APPROVE */

      if (
        req.body.status === "Approved"
      ) {
        leave.status = "Approved";
        leave.approvedAt = new Date();
        leave.rejectionReason = "";
      }

      /* REJECT */

      if (
        req.body.status === "Rejected"
      ) {
        leave.status = "Rejected";
        leave.approvedAt = null;
        leave.rejectionReason =
          req.body.rejectionReason || "";
      }

      await employee.save();

      return res.status(200).json(
        leave
      );
    }

    /* =====================================================
       ADMIN
    ===================================================== */

    if (requesterRole === "Admin") {
      const {
        leaveType,
        startDate,
        endDate,
        reason,
        status,
        rejectionReason,
      } = req.body;

      /* EDIT LEAVE TYPE */

      if (
        leaveType !== undefined
      ) {
        leave.leaveType =
          String(leaveType).trim();
      }

      /* EDIT START DATE */

      if (
        startDate !== undefined
      ) {
        leave.startDate =
          startDate;
      }

      /* EDIT END DATE */

      if (
        endDate !== undefined
      ) {
        leave.endDate =
          endDate;
      }

      /* EDIT REASON */

      if (
        reason !== undefined
      ) {
        leave.reason =
          String(reason).trim();
      }

      /* VALIDATE DATES */

      const finalStart =
        new Date(
          leave.startDate
        );

      const finalEnd =
        new Date(
          leave.endDate
        );

      if (
        Number.isNaN(
          finalStart.getTime()
        ) ||
        Number.isNaN(
          finalEnd.getTime()
        )
      ) {
        return res.status(400).json({
          message: "Invalid leave dates",
        });
      }

      if (
        finalEnd < finalStart
      ) {
        return res.status(400).json({
          message:
            "End date cannot be before start date",
        });
      }

      /* APPROVE / REJECT */

      if (
        status !== undefined
      ) {
        if (
          status !== "Pending" &&
          status !== "Approved" &&
          status !== "Rejected"
        ) {
          return res.status(400).json({
            message:
              "Invalid leave status",
          });
        }

        leave.status = status;

        if (
          status === "Approved"
        ) {
          leave.approvedAt =
            new Date();

          leave.rejectionReason =
            "";
        }

        if (
          status === "Rejected"
        ) {
          leave.approvedAt =
            null;

          leave.rejectionReason =
            rejectionReason || "";
        }

        if (
          status === "Pending"
        ) {
          leave.approvedAt =
            null;

          leave.rejectionReason =
            "";
        }
      }

      await employee.save();

      return res.status(200).json(
        leave
      );
    }

    /* =====================================================
       UNKNOWN ROLE
    ===================================================== */

    return res.status(403).json({
      message:
        "You do not have permission to manage leave requests",
    });
  } catch (error) {
    console.error(
      "UPDATE LEAVE ERROR:",
      error
    );

    return res.status(500).json({
      message: "Failed to update leave",
      error: error.message,
    });
  }
};


/* =========================================================
   DELETE LEAVE
   DELETE /api/employees/:employeeId/leaves/:leaveId

   ADMIN ONLY THROUGH ROUTE RBAC
========================================================= */

const deleteLeave = async (req, res) => {
  try {
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

    const leave = employee.leaves.id(
      req.params.leaveId
    );

    if (!leave) {
      return res.status(404).json({
        message: "Leave record not found",
      });
    }

    leave.deleteOne();

    await employee.save();

    return res.status(200).json({
      message:
        "Leave deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE LEAVE ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to delete leave",
      error: error.message,
    });
  }
};


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  getLeaves,
  createLeave,
  updateLeave,
  deleteLeave,
};