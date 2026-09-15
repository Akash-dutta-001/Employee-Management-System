const Payroll = require("../models/Payroll");
const Employee = require("../models/Employee");

const getLinkedEmployeeId = (req) => req.user?.employeeId || null;

const isPrivilegedRole = (req) =>
  req.user?.role === "Admin" || req.user?.role === "HR";

const ensureOwnEmployee = (req, employeeId) => {
  const linkedEmployeeId = getLinkedEmployeeId(req);

  if (req.user?.role !== "Employee") {
    return true;
  }

  return (
    linkedEmployeeId &&
    employeeId &&
    String(linkedEmployeeId) === String(employeeId)
  );
};

const ensureOwnPayroll = (req, payroll) => {
  if (req.user?.role !== "Employee") {
    return true;
  }

  return ensureOwnEmployee(
    req,
    payroll?.employee?._id || payroll?.employee
  );
};

// HR can manage payroll for other employees, but cannot
// create, edit, or mark paid their own HR payroll.
const isOwnHRPayroll = (req, employeeId) => {
  if (req.user?.role !== "HR") {
    return false;
  }

  return (
    req.user?.employeeId &&
    employeeId &&
    String(req.user.employeeId) === String(employeeId)
  );
};

const isAdminEmployee = (employee) => {
  const role = String(employee?.role || "").toLowerCase();

  return role === "admin" || role === "administrator";
};

const isRestrictedHRTarget = async (req, employeeId) => {
  if (req.user?.role !== "HR" || !employeeId) {
    return false;
  }

  if (isOwnHRPayroll(req, employeeId)) {
    return true;
  }

  const employee = await Employee.findById(employeeId).select(
    "role email name"
  );

  return isAdminEmployee(employee);
};


// =========================================================
// GET ALL PAYROLL RECORDS
// =========================================================

const getPayrollRecords = async (req, res) => {
  try {
    let query = {};

    if (req.user?.role === "Employee") {
      if (!getLinkedEmployeeId(req)) {
        return res.status(403).json({
          message: "Your account is not linked to an employee profile",
        });
      }

      query.employee = getLinkedEmployeeId(req);
    }

    const payrollRecords = await Payroll.find(query)
      .populate("employee", "name role department email")
      .sort({ createdAt: -1 });

    res.status(200).json(payrollRecords);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch payroll records",
      error: error.message,
    });
  }
};

// =========================================================
// GET ONE PAYROLL RECORD
// =========================================================

const getPayrollRecord = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id).populate(
      "employee",
      "name role department email"
    );

    if (!payroll) {
      return res.status(404).json({
        message: "Payroll record not found",
      });
    }

    if (!ensureOwnPayroll(req, payroll)) {
      return res.status(403).json({
        message: "You can only access your own payroll records",
      });
    }

    res.status(200).json(payroll);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch payroll record",
      error: error.message,
    });
  }
};

// =========================================================
// GET PAYROLL RECORDS FOR ONE EMPLOYEE
// =========================================================

const getEmployeePayroll = async (req, res) => {
  try {
    if (!ensureOwnEmployee(req, req.params.employeeId)) {
      return res.status(403).json({
        message: "You can only access your own payroll records",
      });
    }

    const employee = await Employee.findById(req.params.employeeId);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    const payrollRecords = await Payroll.find({
      employee: req.params.employeeId,
    }).sort({ createdAt: -1 });

    res.status(200).json(payrollRecords);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch employee payroll",
      error: error.message,
    });
  }
};

// =========================================================
// CREATE PAYROLL RECORD
// =========================================================

const createPayroll = async (req, res) => {
  try {
    if (
      req.user?.role !== "Admin" &&
      req.user?.role !== "HR"
    ) {
      return res.status(403).json({
        message: "You do not have permission to create payroll records",
      });
    }

    const {
      employee,
      payPeriod,
      basicSalary,
      allowances,
      deductions,
      notes,
    } = req.body;

    // -------------------------------------------------------
    // Validate employee
    // -------------------------------------------------------

    const employeeRecord = await Employee.findById(employee);

    if (!employeeRecord) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    // HR cannot create payroll for their own HR profile.
    if (
      employeeRecord.role === "HR" &&
      isOwnHRPayroll(req, employeeRecord._id)
    ) {
      return res.status(403).json({
        message:
          "HR cannot add payroll for their own profile. Only Admin can add HR payroll.",
      });
    }

    if (
      req.user?.role === "HR" &&
      isAdminEmployee(employeeRecord)
    ) {
      return res.status(403).json({
        message:
          "HR cannot add payroll for Admin. Only Admin can manage Admin payroll.",
      });
    }

    // -------------------------------------------------------
    // Validate required fields
    // -------------------------------------------------------

    if (!payPeriod) {
      return res.status(400).json({
        message: "Pay period is required",
      });
    }

    if (
      basicSalary === undefined ||
      basicSalary === null ||
      basicSalary === ""
    ) {
      return res.status(400).json({
        message: "Basic salary is required",
      });
    }

    // -------------------------------------------------------
    // Convert salary values to numbers
    // -------------------------------------------------------

    const basic = Number(basicSalary);
    const allowanceAmount = Number(allowances || 0);
    const deductionAmount = Number(deductions || 0);

    if (isNaN(basic) || basic < 0) {
      return res.status(400).json({
        message: "Basic salary must be a valid number",
      });
    }

    if (isNaN(allowanceAmount) || allowanceAmount < 0) {
      return res.status(400).json({
        message: "Allowances must be a valid number",
      });
    }

    if (isNaN(deductionAmount) || deductionAmount < 0) {
      return res.status(400).json({
        message: "Deductions must be a valid number",
      });
    }

    // -------------------------------------------------------
    // Calculate net salary
    // -------------------------------------------------------

    const netSalary =
      basic +
      allowanceAmount -
      deductionAmount;

    if (netSalary < 0) {
      return res.status(400).json({
        message: "Net salary cannot be negative",
      });
    }

    // -------------------------------------------------------
    // Create payroll
    // -------------------------------------------------------

    const payroll = await Payroll.create({
      employee,
      payPeriod,
      basicSalary: basic,
      allowances: allowanceAmount,
      deductions: deductionAmount,
      netSalary,
      status: "Pending",
      paymentDate: "",
      notes: notes || "",
    });

    // -------------------------------------------------------
    // Return populated record
    // -------------------------------------------------------

    const populatedPayroll = await Payroll.findById(
      payroll._id
    ).populate(
      "employee",
      "name role department email"
    );

    res.status(201).json(populatedPayroll);
  } catch (error) {
    res.status(400).json({
      message: "Failed to create payroll",
      error: error.message,
    });
  }
};

// =========================================================
// UPDATE PAYROLL RECORD
// =========================================================

const updatePayroll = async (req, res) => {
  try {
    if (
      req.user?.role !== "Admin" &&
      req.user?.role !== "HR"
    ) {
      return res.status(403).json({
        message: "You do not have permission to edit payroll records",
      });
    }

    const payroll = await Payroll.findById(
      req.params.id
    );

    if (!payroll) {
      return res.status(404).json({
        message: "Payroll record not found",
      });
    }

    // HR cannot edit their own HR payroll.
    if (isOwnHRPayroll(req, payroll.employee)) {
      return res.status(403).json({
        message:
          "HR cannot edit their own payroll. Only Admin can edit HR payroll.",
      });
    }

    if (
      req.user?.role === "HR" &&
      await isRestrictedHRTarget(req, payroll.employee)
    ) {
      return res.status(403).json({
        message:
          "HR cannot edit Admin payroll. Only Admin can manage Admin payroll.",
      });
    }

    if (payroll.status === "Paid") {
      return res.status(400).json({
        message: "Paid payroll records cannot be edited. Create a new record if a correction is required.",
      });
    }

    const {
      employee,
      payPeriod,
      basicSalary,
      allowances,
      deductions,
      notes,
    } = req.body;

    // -------------------------------------------------------
    // Validate employee if changed
    // -------------------------------------------------------

    if (employee) {
      const employeeRecord =
        await Employee.findById(employee);

      if (!employeeRecord) {
        return res.status(404).json({
          message: "Employee not found",
        });
      }

      if (
        employeeRecord.role === "HR" &&
        isOwnHRPayroll(req, employeeRecord._id)
      ) {
        return res.status(403).json({
          message:
            "HR cannot assign payroll to their own profile. Only Admin can manage HR payroll.",
        });
      }

      if (
        req.user?.role === "HR" &&
        isAdminEmployee(employeeRecord)
      ) {
        return res.status(403).json({
          message:
            "HR cannot assign payroll to Admin. Only Admin can manage Admin payroll.",
        });
      }

      payroll.employee = employee;
    }

    // -------------------------------------------------------
    // Update fields
    // -------------------------------------------------------

    if (payPeriod !== undefined) {
      if (!payPeriod) {
        return res.status(400).json({
          message: "Pay period is required",
        });
      }

      payroll.payPeriod = payPeriod;
    }

    if (basicSalary !== undefined) {
      const basic = Number(basicSalary);

      if (isNaN(basic) || basic < 0) {
        return res.status(400).json({
          message: "Basic salary must be a valid number",
        });
      }

      payroll.basicSalary = basic;
    }

    if (allowances !== undefined) {
      const allowanceAmount = Number(allowances);

      if (
        isNaN(allowanceAmount) ||
        allowanceAmount < 0
      ) {
        return res.status(400).json({
          message: "Allowances must be a valid number",
        });
      }

      payroll.allowances = allowanceAmount;
    }

    if (deductions !== undefined) {
      const deductionAmount = Number(deductions);

      if (
        isNaN(deductionAmount) ||
        deductionAmount < 0
      ) {
        return res.status(400).json({
          message: "Deductions must be a valid number",
        });
      }

      payroll.deductions = deductionAmount;
    }

    if (notes !== undefined) {
      payroll.notes = notes;
    }

    // -------------------------------------------------------
    // Recalculate net salary
    // -------------------------------------------------------

    payroll.netSalary =
      payroll.basicSalary +
      payroll.allowances -
      payroll.deductions;

    if (payroll.netSalary < 0) {
      return res.status(400).json({
        message: "Net salary cannot be negative",
      });
    }

    await payroll.save();

    const updatedPayroll =
      await Payroll.findById(
        payroll._id
      ).populate(
        "employee",
        "name role department email"
      );

    res.status(200).json(updatedPayroll);
  } catch (error) {
    res.status(400).json({
      message: "Failed to update payroll",
      error: error.message,
    });
  }
};

// =========================================================
// DELETE PAYROLL RECORD
// =========================================================

const deletePayroll = async (req, res) => {
  try {
    if (req.user?.role !== "Admin") {
      return res.status(403).json({
        message: "Only Admin can delete payroll records",
      });
    }

    const payroll =
      await Payroll.findByIdAndDelete(
        req.params.id
      );

    if (!payroll) {
      return res.status(404).json({
        message: "Payroll record not found",
      });
    }

    res.status(200).json({
      message: "Payroll record deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete payroll record",
      error: error.message,
    });
  }
};

// =========================================================
// MARK PAYROLL AS PAID
// =========================================================

const markPayrollAsPaid = async (req, res) => {
  try {
    if (
      req.user?.role !== "Admin" &&
      req.user?.role !== "HR"
    ) {
      return res.status(403).json({
        message: "You do not have permission to mark payroll as paid",
      });
    }

    const payroll =
      await Payroll.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({
        message: "Payroll record not found",
      });
    }

    // HR cannot approve/mark their own HR payroll as Paid.
    if (isOwnHRPayroll(req, payroll.employee)) {
      return res.status(403).json({
        message:
          "HR cannot approve or mark their own payroll as paid. Only Admin can do this.",
      });
    }

    if (
      req.user?.role === "HR" &&
      await isRestrictedHRTarget(req, payroll.employee)
    ) {
      return res.status(403).json({
        message:
          "HR cannot approve or mark Admin payroll as paid. Only Admin can do this.",
      });
    }

    payroll.status = "Paid";

    if (!payroll.paymentDate) {
      payroll.paymentDate =
        new Date().toISOString().split("T")[0];
    }

    await payroll.save();

    const updatedPayroll =
      await Payroll.findById(
        payroll._id
      ).populate(
        "employee",
        "name role department email"
      );

    res.status(200).json(updatedPayroll);
  } catch (error) {
    res.status(500).json({
      message: "Failed to mark payroll as paid",
      error: error.message,
    });
  }
};

// =========================================================
// EXPORTS
// =========================================================

module.exports = {
  getPayrollRecords,
  getPayrollRecord,
  getEmployeePayroll,
  createPayroll,
  updatePayroll,
  deletePayroll,
  markPayrollAsPaid,
};