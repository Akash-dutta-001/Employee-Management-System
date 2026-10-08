const Employee = require("../models/Employee");
const fs = require("fs");
const path = require("path");

// =========================================================
// RBAC / OWNERSHIP HELPERS
// =========================================================

const isEmployeeOwner = (req, employeeId) => {

  if (req.user?.role !== "Employee") return true;

  return (

    req.user.employeeId &&

    employeeId &&

    String(req.user.employeeId) === String(employeeId)

  );

};

const requireEmployeeOwner = (req, res, employeeId) => {

  if (!isEmployeeOwner(req, employeeId)) {

    res.status(403).json({

      message: "You can only access your own employee information",

    });

    return false;

  }

  return true;

};

// HR cannot create/edit/delete performance reviews for HR or Admin profiles.

const isRestrictedPerformanceTargetForHR = (req, employee) => {

  if (req.user?.role !== "HR" || !employee) return false;

  const targetRole = String(employee.role || "").toLowerCase();

  return (

    targetRole === "hr" ||

    targetRole === "admin" ||

    targetRole === "administrator"

  );

};

// =========================================================
// GET ALL EMPLOYEES
// =========================================================

const getEmployees = async (req, res) => {
  try {
    if (req.user?.role === "Employee") {
      if (!req.user.employeeId) {
        return res.status(403).json({
          message: "Your account is not linked to an employee profile",
        });
      }

      const employee = await Employee.findById(req.user.employeeId);

      if (!employee) {
        return res.status(404).json({
          message: "Employee profile not found",
        });
      }

      return res.status(200).json([employee]);
    }

    if (
      req.user?.role !== "Admin" &&
      req.user?.role !== "HR"
    ) {
      return res.status(403).json({
        message: "Invalid user role",
      });
    }

    const User = require("../models/User");

    const managementUsers = await User.find({
      role: { $in: ["Admin", "HR"] },
    });

    for (const user of managementUsers) {
      let employee = null;

      if (user.employee) {
        employee = await Employee.findById(user.employee);
      }

      if (!employee && user.email) {
        employee = await Employee.findOne({
          email: user.email.toLowerCase(),
        });

        if (employee) {
          user.employee = employee._id;
          await user.save();
        }
      }
    }

    const employees = await Employee.find().sort({
      createdAt: 1,
    });

    console.log(
      `GET /api/employees -> ${employees.length} employees`
    );

    return res.status(200).json(employees);
  } catch (error) {
    console.error("GET EMPLOYEES ERROR:", error);

    return res.status(500).json({
      message: "Failed to fetch employees",
      error: error.message,
    });
  }
};

// =========================================================
// GET one employee
// =========================================================

const getEmployee = async (req, res) => {

  try {

    if (

      !requireEmployeeOwner(

        req,

        res,

        req.params.id

      )

    ) {

      return;

    }



    const employee = await Employee.findById(req.params.id);



    if (!employee) {

      return res.status(404).json({

        message: "Employee not found",

      });

    }



    res.status(200).json(employee);

  } catch (error) {

    res.status(500).json({

      message: "Failed to fetch employee",

      error: error.message,

    });

  }

};

// =========================================================
// CREATE employee
// =========================================================

const createEmployee = async (req, res) => {

  try {

    const employee = await Employee.create(req.body);

    res.status(201).json(employee);

  } catch (error) {

    res.status(400).json({

      message: "Failed to create employee",

      error: error.message,

    });

  }

};

// =========================================================
// UPDATE Eemployee
// =========================================================
// =========================================================
// UPDATE EMPLOYEE ACCOUNT STATUS
// =========================================================

const updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    // Do NOT allow normal profile update to change account status.
    // Status must be changed through /:id/status.
    const updateData = { ...req.body };
    delete updateData.status;

    // Prevent changing the employee email to an email
    // already used by another employee.
    if (updateData.email) {
      updateData.email = updateData.email.trim().toLowerCase();

      const existingEmployee = await Employee.findOne({
        email: updateData.email,
        _id: { $ne: employee._id },
      });

      if (existingEmployee) {
        return res.status(400).json({
          message: "Another employee already uses this email",
        });
      }
    }

    const updatedEmployee =
      await Employee.findByIdAndUpdate(
        req.params.id,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!updatedEmployee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    return res.status(200).json(updatedEmployee);
  } catch (error) {
    console.error("UPDATE EMPLOYEE ERROR:", error);

    return res.status(400).json({
      message: "Failed to update employee",
      error: error.message,
    });
  }
};


// =========================================================
// DELETE employee
// =========================================================

const deleteEmployee = async (req, res) => {
  try {
    const User = require("../models/User");

    const employee = await Employee.findById(
      req.params.id
    );

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    // ---------------------------------------------------------
    // Find any User connected to this Employee
    // ---------------------------------------------------------

    let linkedUser = await User.findOne({
      employee: employee._id,
    });

    // Fallback: find User using Employee email
    if (!linkedUser && employee.email) {
      linkedUser = await User.findOne({
        email: employee.email
          .trim()
          .toLowerCase(),
      });

      // Repair relationship if found
      if (linkedUser) {
        linkedUser.employee = employee._id;
        await linkedUser.save();
      }
    }

    // ---------------------------------------------------------
    // ADMIN PROTECTION
    // ---------------------------------------------------------

    if (linkedUser?.role === "Admin") {
      return res.status(403).json({
        message:
          "Admin Employee profiles cannot be deleted while the Admin account exists",
      });
    }

    // ---------------------------------------------------------
    // If another User is linked to this Employee,
    // do not leave a broken User → Employee relationship.
    // ---------------------------------------------------------

    if (linkedUser) {
      linkedUser.employee = null;
      await linkedUser.save();
    }

    // ---------------------------------------------------------
    // Delete Employee profile
    // ---------------------------------------------------------

    await Employee.findByIdAndDelete(
      employee._id
    );

    return res.status(200).json({
      message: "Employee deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE EMPLOYEE ERROR:",
      error
    );

    return res.status(500).json({
      message: "Failed to delete employee",
      error: error.message,
    });
  }
};

// =========================================================
// PERFORMANCE MANAGEMENT
// =========================================================

// GET performance reviews for an employee
const getPerformanceReviews = async (req, res) => {

  try {

    if (

      !requireEmployeeOwner(

        req,

        res,

        req.params.employeeId

      )

    ) {

      return;

    }



    const employee = await Employee.findById(req.params.employeeId);



    if (!employee) {

      return res.status(404).json({

        message: "Employee not found",

      });

    }



    res.status(200).json(employee.performanceReviews || []);

  } catch (error) {

    res.status(500).json({

      message: "Failed to fetch performance reviews",

      error: error.message,

    });

  }

};





// CREATE performance review



const createPerformanceReview = async (req, res) => {

  try {

    if (req.user?.role === "Employee") {

      return res.status(403).json({

        message: "You do not have permission to create performance reviews",

      });

    }

    const employee = await Employee.findById(req.params.employeeId);



    if (!employee) {

      return res.status(404).json({

        message: "Employee not found",

      });

    }



    if (isRestrictedPerformanceTargetForHR(req, employee)) {

      return res.status(403).json({

        message:

          "HR cannot create performance reviews for HR/Admin profiles. Only Admin can manage those reviews.",

      });

    }



    const {

      reviewDate,

      rating,

      feedback,

      strengths,

      improvements,

    } = req.body;



    employee.performanceReviews.push({

      reviewDate,

      rating,

      feedback,

      strengths,

      improvements,

    });



    await employee.save();



    const newReview =

      employee.performanceReviews[

      employee.performanceReviews.length - 1

      ];



    res.status(201).json(newReview);

  } catch (error) {

    res.status(400).json({

      message: "Failed to create performance review",

      error: error.message,

    });

  }

};





// UPDATE performance review



const updatePerformanceReview = async (req, res) => {

  try {

    if (req.user?.role === "Employee") {

      return res.status(403).json({

        message: "You do not have permission to edit performance reviews",

      });

    }

    const employee = await Employee.findById(req.params.employeeId);



    if (!employee) {

      return res.status(404).json({

        message: "Employee not found",

      });

    }



    if (isRestrictedPerformanceTargetForHR(req, employee)) {

      return res.status(403).json({

        message:

          "HR cannot edit performance reviews for HR/Admin profiles. Only Admin can manage those reviews.",

      });

    }



    const review = employee.performanceReviews.id(

      req.params.reviewId

    );



    if (!review) {

      return res.status(404).json({

        message: "Performance review not found",

      });

    }



    const {

      reviewDate,

      rating,

      feedback,

      strengths,

      improvements,

    } = req.body;



    review.reviewDate = reviewDate;

    review.rating = rating;

    review.feedback = feedback;

    review.strengths = strengths;

    review.improvements = improvements;



    await employee.save();



    res.status(200).json(review);

  } catch (error) {

    res.status(400).json({

      message: "Failed to update performance review",

      error: error.message,

    });

  }

};





// DELETE performance review



const deletePerformanceReview = async (req, res) => {

  try {

    if (req.user?.role === "Employee") {

      return res.status(403).json({

        message: "You do not have permission to delete performance reviews",

      });

    }

    const employee = await Employee.findById(req.params.employeeId);



    if (!employee) {

      return res.status(404).json({

        message: "Employee not found",

      });

    }



    if (isRestrictedPerformanceTargetForHR(req, employee)) {

      return res.status(403).json({

        message:

          "HR cannot delete performance reviews for HR/Admin profiles. Only Admin can manage those reviews.",

      });

    }



    const review = employee.performanceReviews.id(

      req.params.reviewId

    );



    if (!review) {

      return res.status(404).json({

        message: "Performance review not found",

      });

    }



    review.deleteOne();



    await employee.save();



    res.status(200).json({

      message: "Performance review deleted successfully",

    });

  } catch (error) {

    res.status(500).json({

      message: "Failed to delete performance review",

      error: error.message,

    });

  }

};



// =========================================================

// ATTENDANCE MANAGEMENT

// =========================================================





// GET attendance records for an employee



const getAttendance = async (req, res) => {

  try {

    if (

      !requireEmployeeOwner(

        req,

        res,

        req.params.employeeId

      )

    ) {

      return;

    }



    const employee = await Employee.findById(req.params.employeeId);



    if (!employee) {

      return res.status(404).json({

        message: "Employee not found",

      });

    }



    res.status(200).json(employee.attendance || []);

  } catch (error) {

    res.status(500).json({

      message: "Failed to fetch attendance records",

      error: error.message,

    });

  }

};


// CREATE attendance record
const createAttendance = async (req, res) => {

  try {

    if (req.user?.role === "Employee") {

      return res.status(403).json({

        message: "You do not have permission to create attendance records",

      });

    }

    const employee = await Employee.findById(req.params.employeeId);



    if (!employee) {

      return res.status(404).json({

        message: "Employee not found",

      });

    }



    const {

      date,

      status,

      hours,

      checkIn,

      checkOut,

      note,

    } = req.body;



    employee.attendance.push({

      date,

      status,

      hours,

      checkIn,

      checkOut,

      note,

    });



    await employee.save();



    const newAttendance =

      employee.attendance[

      employee.attendance.length - 1

      ];



    res.status(201).json(newAttendance);

  } catch (error) {

    res.status(400).json({

      message: "Failed to create attendance record",

      error: error.message,

    });

  }

};





// UPDATE attendance record



const updateAttendance = async (req, res) => {

  try {

    if (req.user?.role === "Employee") {

      return res.status(403).json({

        message: "You do not have permission to edit attendance records",

      });

    }

    const employee = await Employee.findById(req.params.employeeId);



    if (!employee) {

      return res.status(404).json({

        message: "Employee not found",

      });

    }



    const attendance = employee.attendance.id(

      req.params.attendanceId

    );



    if (!attendance) {

      return res.status(404).json({

        message: "Attendance record not found",

      });

    }



    const {

      date,

      status,

      hours,

      checkIn,

      checkOut,

      note,

    } = req.body;



    attendance.date = date;

    attendance.status = status;

    attendance.hours = hours;

    attendance.checkIn = checkIn;

    attendance.checkOut = checkOut;

    attendance.note = note;



    await employee.save();



    res.status(200).json(attendance);

  } catch (error) {

    res.status(400).json({

      message: "Failed to update attendance record",

      error: error.message,

    });

  }

};





// DELETE attendance record



const deleteAttendance = async (req, res) => {

  try {

    if (req.user?.role === "Employee") {

      return res.status(403).json({

        message: "You do not have permission to delete attendance records",

      });

    }

    const employee = await Employee.findById(req.params.employeeId);



    if (!employee) {

      return res.status(404).json({

        message: "Employee not found",

      });

    }



    const attendance = employee.attendance.id(

      req.params.attendanceId

    );



    if (!attendance) {

      return res.status(404).json({

        message: "Attendance record not found",

      });

    }



    attendance.deleteOne();



    await employee.save();



    res.status(200).json({

      message: "Attendance record deleted successfully",

    });

  } catch (error) {

    res.status(500).json({

      message: "Failed to delete attendance record",

      error: error.message,

    });

  }

};



// =========================================================

// LEAVE MANAGEMENT

// =========================================================



// GET leaves for an employee

const getLeaves = async (req, res) => {

  try {

    if (

      !requireEmployeeOwner(

        req,

        res,

        req.params.employeeId

      )

    ) {

      return;

    }



    const employee = await Employee.findById(req.params.employeeId);



    if (!employee) {

      return res.status(404).json({

        message: "Employee not found",

      });

    }



    res.status(200).json(employee.leaves || []);

  } catch (error) {

    res.status(500).json({

      message: "Failed to fetch leaves",

      error: error.message,

    });

  }

};



// CREATE leave

const createLeave = async (req, res) => {

  try {

    if (

      !requireEmployeeOwner(

        req,

        res,

        req.params.employeeId

      )

    ) {

      return;

    }



    const employee = await Employee.findById(req.params.employeeId);



    if (!employee) {

      return res.status(404).json({

        message: "Employee not found",

      });

    }



    const {

      leaveType,

      startDate,

      endDate,

      reason,

      status,

      rejectionReason,

    } = req.body;



    if (!leaveType || !startDate || !endDate) {

      return res.status(400).json({

        message: "Leave type, start date and end date are required",

      });

    }



    employee.leaves.push({

      leaveType,

      startDate,

      endDate,

      reason: reason || "",

      status: status || "Pending",

      rejectionReason: rejectionReason || "",

    });



    await employee.save();



    const newLeave =

      employee.leaves[employee.leaves.length - 1];



    res.status(201).json(newLeave);

  } catch (error) {

    res.status(400).json({

      message: "Failed to create leave",

      error: error.message,

    });

  }

};



// UPDATE leave

const updateLeave = async (req, res) => {

  try {

    if (req.user?.role === "Employee") {

      return res.status(403).json({

        message: "You do not have permission to edit leave requests",

      });

    }

    const employee = await Employee.findById(req.params.employeeId);



    if (!employee) {

      return res.status(404).json({

        message: "Employee not found",

      });

    }



    const leave = employee.leaves.id(req.params.leaveId);



    if (!leave) {

      return res.status(404).json({

        message: "Leave not found",

      });

    }



    const {

      leaveType,

      startDate,

      endDate,

      reason,

      status,

      rejectionReason,

    } = req.body;



    leave.leaveType = leaveType;

    leave.startDate = startDate;

    leave.endDate = endDate;

    leave.reason = reason || "";

    leave.status = status || leave.status;

    leave.rejectionReason = rejectionReason || "";



    if (leave.status === "Approved" && !leave.approvedAt) {

      leave.approvedAt = new Date();

    }



    await employee.save();



    res.status(200).json(leave);

  } catch (error) {

    res.status(400).json({

      message: "Failed to update leave",

      error: error.message,

    });

  }

};



// DELETE leave

const deleteLeave = async (req, res) => {

  try {

    if (req.user?.role === "Employee") {

      return res.status(403).json({

        message: "You do not have permission to delete leave requests",

      });

    }

    const employee = await Employee.findById(req.params.employeeId);



    if (!employee) {

      return res.status(404).json({

        message: "Employee not found",

      });

    }



    const leave = employee.leaves.id(req.params.leaveId);



    if (!leave) {

      return res.status(404).json({

        message: "Leave not found",

      });

    }



    leave.deleteOne();



    await employee.save();



    res.status(200).json({

      message: "Leave deleted successfully",

    });

  } catch (error) {

    res.status(500).json({

      message: "Failed to delete leave",

      error: error.message,

    });

  }

};



// =========================================================

// EMPLOYEE DOCUMENT MANAGEMENT

// =========================================================



const getDocuments = async (req, res) => {

  try {

    const employee = await Employee.findById(req.params.employeeId);



    if (!employee) {

      return res.status(404).json({

        message: "Employee not found",

      });

    }



    res.status(200).json(employee.documents || []);

  } catch (error) {

    res.status(500).json({

      message: "Failed to fetch documents",

      error: error.message,

    });

  }

};

const createDocument = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.employeeId);

    if (!employee) {
      // Delete uploaded file if employee doesn't exist
      if (req.file) {
        fs.unlink(req.file.path, () => { });
      }

      return res.status(404).json({
        message: "Employee not found",
      });
    }
    const {
      documentName,
      documentType,
      documentNumber,
      issueDate,
      expiryDate,

    } = req.body;

    if (!documentName) {
      if (req.file) {
        fs.unlink(req.file.path, () => { });
      }
      return res.status(400).json({
        message: "Document name is required",
      });
    }
    const fileName = req.file

      ? req.file.originalname

      : "";



    const fileUrl = req.file

      ? `/uploads/documents/${req.file.filename}`

      : "";



    employee.documents.push({

      documentName,

      documentType: documentType || "Other",

      documentNumber: documentNumber || "",

      issueDate: issueDate || "",

      expiryDate: expiryDate || "",

      fileName,

      fileUrl,

    });



    await employee.save();



    const newDocument =

      employee.documents[

      employee.documents.length - 1

      ];



    res.status(201).json(newDocument);

  } catch (error) {

    // Remove uploaded file if database operation fails

    if (req.file) {

      fs.unlink(req.file.path, () => { });

    }



    res.status(400).json({

      message: "Failed to create document",

      error: error.message,

    });

  }

};
const updateDocument = async (req, res) => {
  try {
    const employee = await Employee.findById(
      req.params.employeeId
    );
    if (!employee) {
      if (req.file) {
        fs.unlink(req.file.path, () => { });
      }
      return res.status(404).json({
        message: "Employee not found",
      });
    }
    const document = employee.documents.id(
      req.params.documentId
    );
    if (!document) {
      if (req.file) {
        fs.unlink(req.file.path, () => { });
      }
      return res.status(404).json({
        message: "Document not found",
      });

    }



    const {

      documentName,

      documentType,

      documentNumber,

      issueDate,

      expiryDate,

    } = req.body;



    if (!documentName) {

      if (req.file) {
        fs.unlink(req.file.path, () => { });
      }

      return res.status(400).json({

        message: "Document name is required",

      });

    }



    document.documentName = documentName;

    document.documentType =

      documentType || "Other";

    document.documentNumber =

      documentNumber || "";

    document.issueDate =

      issueDate || "";

    document.expiryDate =

      expiryDate || "";



    // Replace old file only when a new file is uploaded

    if (req.file) {

      // Delete old file
      if (document.fileUrl) {
        const oldFilePath = path.join(
          process.cwd(),
          document.fileUrl.replace(/^\/+/, "")
        );

        if (fs.existsSync(oldFilePath)) {
          fs.unlink(oldFilePath, () => { });
        }
      }

      document.fileName =
        req.file.originalname;
      document.fileUrl =
        `/uploads/documents/${req.file.filename}`;
    }
    await employee.save();
    res.status(200).json(document);

  } catch (error) {

    if (req.file) {

      fs.unlink(req.file.path, () => { });

    }



    res.status(400).json({

      message: "Failed to update document",

      error: error.message,

    });

  }

};



const deleteDocument = async (req, res) => {

  try {

    const employee = await Employee.findById(

      req.params.employeeId

    );



    if (!employee) {

      return res.status(404).json({

        message: "Employee not found",

      });

    }



    const document = employee.documents.id(

      req.params.documentId

    );



    if (!document) {

      return res.status(404).json({
        message: "Document not found",
      });
    }
    // Keep the file path before removing the document
    const fileUrl = document.fileUrl;
    document.deleteOne();
    await employee.save();

    // Delete the physical uploaded file as well
    if (fileUrl) {
      const filePath = path.join(
        process.cwd(),
        fileUrl.replace(/^\/+/, "")
      );

      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (unlinkError) => {
          if (unlinkError) {
            console.error(
              "Failed to delete uploaded file:",
              unlinkError.message
            );
          }
        });
      }
    }



    res.status(200).json({

      message: "Document deleted successfully",

    });

  } catch (error) {

    console.error(

      "DELETE DOCUMENT ERROR:",

      error

    );



    res.status(500).json({

      message: "Failed to delete document",

      error: error.message,

    });

  }

};

/* =========================================================
   UPDATE EMPLOYEE ACCOUNT STATUS
========================================================= */

const updateEmployeeStatus = async (req, res) => {
  try {
    const User = require("../models/User");

    const { status } = req.body;

    // Validate status
    if (!["Active", "Inactive"].includes(status)) {
      return res.status(400).json({
        message: "Status must be Active or Inactive",
      });
    }

    // Get the currently logged-in user from DB
    const currentUser = await User.findById(req.user.id);

    if (!currentUser) {
      return res.status(401).json({
        message: "Current user account not found",
      });
    }

    // Only Admin can change account status
    if (currentUser.role !== "Admin") {
      return res.status(403).json({
        message: "Only an Admin can change account status",
      });
    }

    // Find employee
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    // Find linked User account
    let targetUser = await User.findOne({
      employee: employee._id,
    });

    // Fallback: match by email
    if (!targetUser && employee.email) {
      targetUser = await User.findOne({
        email: employee.email.trim().toLowerCase(),
      });
    }

    /*
    =========================================================
    ADMIN PROTECTION
    =========================================================
    */

    if (targetUser?.role === "Admin") {
      // -----------------------------------------------------
      // 1. Admin cannot deactivate themselves
      // -----------------------------------------------------
      if (
        status === "Inactive" &&
        String(currentUser._id) === String(targetUser._id)
      ) {
        return res.status(403).json({
          message: "You cannot deactivate your own Admin account",
        });
      }

      // Also check Employee link in case User IDs are not
      // correctly linked.
      if (
        status === "Inactive" &&
        currentUser.employee &&
        String(currentUser.employee) === String(employee._id)
      ) {
        return res.status(403).json({
          message: "You cannot deactivate your own Admin account",
        });
      }

      // -----------------------------------------------------
      // 2. Cannot deactivate the last active Admin
      // -----------------------------------------------------
      if (
        status === "Inactive" &&
        targetUser.isActive === true
      ) {
        const activeAdminCount = await User.countDocuments({
          role: "Admin",
          isActive: true,
        });

        if (activeAdminCount <= 1) {
          return res.status(403).json({
            message: "The last active Admin cannot be deactivated",
          });
        }
      }
    }

    /*
    =========================================================
    UPDATE EMPLOYEE STATUS
    =========================================================
    */

    employee.status = status;

    await employee.save();

    /*
    =========================================================
    UPDATE USER STATUS
    =========================================================
    */

    if (targetUser) {
      targetUser.isActive = status === "Active";

      // Repair Employee ↔ User link if necessary
      targetUser.employee = employee._id;

      await targetUser.save();
    }

    return res.status(200).json({
      message:
        status === "Inactive"
          ? "Employee deactivated successfully"
          : "Employee activated successfully",

      employee,

      user: targetUser
        ? {
            id: targetUser._id,
            role: targetUser.role,
            isActive: targetUser.isActive,
          }
        : null,
    });
  } catch (error) {
    console.error(
      "UPDATE EMPLOYEE STATUS ERROR:",
      error
    );

    return res.status(500).json({
      message: "Failed to update employee account status",
      error: error.message,
    });
  }
};

// =========================================================
// EXPORTS
// =========================================================

module.exports = {
  // Employee
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  deleteEmployee,

  // Attendance
  getAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,

  // Leave
  getLeaves,
  createLeave,
  updateLeave,
  deleteLeave,

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
};