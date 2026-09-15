const Employee = require("../models/Employee");

// ===============================
// GET ATTENDANCE
// ===============================
const getAttendance = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.employeeId);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    res.status(200).json(employee.attendance);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch attendance",
      error: error.message,
    });
  }
};

// ===============================
// CREATE ATTENDANCE
// ===============================
const createAttendance = async (req, res) => {
  try {
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

    // Date is required
    if (!date) {
      return res.status(400).json({
        message: "Date is required",
      });
    }

    // Prevent duplicate attendance for the same date
    const existingAttendance = employee.attendance.find(
      (record) => record.date === date
    );

    if (existingAttendance) {
      return res.status(400).json({
        message: "Attendance already exists for this date",
      });
    }

    employee.attendance.push({
      date,
      status: status || "Present",
      hours: hours !== undefined ? Number(hours) : 0,
      checkIn: checkIn || "",
      checkOut: checkOut || "",
      note: note || "",
    });

    await employee.save();

    res.status(201).json({
      message: "Attendance created successfully",
      attendance: employee.attendance[
        employee.attendance.length - 1
      ],
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create attendance",
      error: error.message,
    });
  }
};

// ===============================
// UPDATE ATTENDANCE
// ===============================
const updateAttendance = async (req, res) => {
  try {
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

    // --------------------------------
    // Update date
    // --------------------------------
    if (date !== undefined) {
      // Prevent changing the date to one
      // that already has attendance
      const duplicate = employee.attendance.find(
        (record) =>
          record._id.toString() !== req.params.attendanceId &&
          record.date === date
      );

      if (duplicate) {
        return res.status(400).json({
          message: "Attendance already exists for this date",
        });
      }

      if (!date) {
        return res.status(400).json({
          message: "Date is required",
        });
      }

      attendance.date = date;
    }

    // --------------------------------
    // Update status
    // --------------------------------
    if (status !== undefined) {
      attendance.status = status;
    }

    // --------------------------------
    // Update hours
    // --------------------------------
    if (hours !== undefined) {
      attendance.hours = Number(hours);
    }

    // --------------------------------
    // Update check-in
    // --------------------------------
    if (checkIn !== undefined) {
      attendance.checkIn = checkIn;
    }

    // --------------------------------
    // Update check-out
    // --------------------------------
    if (checkOut !== undefined) {
      attendance.checkOut = checkOut;
    }

    // --------------------------------
    // Update note
    // --------------------------------
    if (note !== undefined) {
      attendance.note = note;
    }

    await employee.save();

    res.status(200).json({
      message: "Attendance updated successfully",
      attendance,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update attendance",
      error: error.message,
    });
  }
};

// ===============================
// DELETE ATTENDANCE
// ===============================
const deleteAttendance = async (req, res) => {
  try {
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
      message: "Attendance deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete attendance",
      error: error.message,
    });
  }
};

// ===============================
// EXPORT CONTROLLERS
// ===============================
module.exports = {
  getAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
};