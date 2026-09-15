const User = require("../models/User");
const Employee = require("../models/Employee");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const normalizeRole = (role) => {
  if (!role) return "Employee";

  const normalized = role.toString().trim().toLowerCase();

  if (normalized === "admin") return "Admin";
  if (normalized === "hr") return "HR";
  if (normalized === "employee") return "Employee";

  return null;
};

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      employeeId: user.employee || null,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const ensureEmployeeProfile = async (user, { activate = true } = {}) => {
  if (!user || !["Admin", "HR"].includes(user.role)) return null;

  let employee = null;

  if (user.employee) {
    employee = await Employee.findById(user.employee);
  }

  if (!employee) {
    employee = await Employee.findOne({ email: user.email });
  }

  if (!employee) {
    employee = await Employee.create({
      name: user.name,
      role: user.role === "Admin" ? "Administrator" : "HR",
      department:
        user.department ||
        (user.role === "Admin" ? "Administration" : "Human Resources"),
      email: user.email,
      status: activate ? "Active" : "Inactive",
    });
  } else if (activate && employee.status !== "Active") {
    employee.status = "Active";
    await employee.save();
  }

  if (String(user.employee || "") !== String(employee._id)) {
    user.employee = employee._id;
    await user.save();
  }

  return employee;
};

/*
=========================================================
PUBLIC REGISTRATION
=========================================================

Employee:
- User creates the account from the Login page.
- No MongoDB Employee/Profile ID is required.
- Backend automatically creates the Employee profile and links it.
- Account is active immediately.

HR:
- User creates the account from the Login page.
- No Employee/Profile ID is required.
- Account is stored as Pending.
- Admin must approve it before login is allowed.
*/
const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      jobRole,
      department,
    } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const normalizedRole = normalizeRole(role);

    // Admin cannot be created through public registration.
    if (!normalizedRole || normalizedRole === "Admin") {
      return res.status(403).json({
        message:
          "Public registration is available only for Employee or HR accounts",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // =====================================================
    // EMPLOYEE REGISTRATION
    // =====================================================

    if (normalizedRole === "Employee") {
      if (!jobRole?.trim() || !department?.trim()) {
        return res.status(400).json({
          message: "Employee Job Role and Department are required",
        });
      }

      const existingEmployee = await Employee.findOne({
        email: normalizedEmail,
      });

      if (existingEmployee) {
        return res.status(400).json({
          message:
            "An Employee Profile already exists with this email.",
        });
      }

      const employee = await Employee.create({
        name: name.trim(),
        role: jobRole.trim(),
        department: department.trim(),
        email: normalizedEmail,
        status: "Active",
      });

      const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: "Employee",
        employee: employee._id,
        department: department.trim(),
        registrationStatus: "Approved",
        isActive: true,
      });

      const token = generateToken(user);

      return res.status(201).json({
        message: "Employee account and profile created successfully",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          employee: user.employee,
          department: user.department,
          registrationStatus: user.registrationStatus,
        },
      });
    }

// =====================================================
// HR REGISTRATION
// =====================================================

if (normalizedRole === "HR") {

  // Department is OPTIONAL during public HR registration.
  // If no department is entered, use Human Resources.
  const hrDepartment =
    department?.trim() || "Human Resources";

  // ---------------------------------------------------
  // CHECK FOR EXISTING EMPLOYEE PROFILE
  // ---------------------------------------------------

  const existingEmployee = await Employee.findOne({
    email: normalizedEmail,
  });

  if (existingEmployee) {
    return res.status(400).json({
      message:
        "An Employee Profile already exists with this email.",
    });
  }

  // ---------------------------------------------------
  // CREATE EMPLOYEE PROFILE FOR HR
  // ---------------------------------------------------

  // HR is also an employee in EmployeeHub.
  // No Employee/Profile ID is required.

  const employee = await Employee.create({
    name: name.trim(),

    // HR's position inside Employee collection
    role: "HR",

    department: hrDepartment,

    email: normalizedEmail,

    // HR profile exists immediately.
    // HR login still requires Admin approval.
    status: "Active",
  });

  try {

    // -------------------------------------------------
    // CREATE HR USER ACCOUNT
    // -------------------------------------------------

    const user = await User.create({
      name: name.trim(),

      email: normalizedEmail,

      password: hashedPassword,

      role: "HR",

      // IMPORTANT:
      // Link HR User -> Employee Profile
      employee: employee._id,

      department: hrDepartment,

      // HR must be approved by Admin
      registrationStatus: "Pending",

      // HR cannot login until approved
      isActive: false,
    });

    // -------------------------------------------------
    // SUCCESS
    // -------------------------------------------------

    return res.status(201).json({
      message:
        "HR account and Employee profile created successfully and is pending Admin verification",

      pendingApproval: true,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,

        // Employee Profile ID
        employee: user.employee,

        department: user.department,

        registrationStatus:
          user.registrationStatus,
      },
    });

  } catch (userError) {

    // If User creation fails,
    // remove the Employee profile.
    await Employee.findByIdAndDelete(
      employee._id
    );

    throw userError;
  }
}

  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const normalizedRole = normalizeRole(user.role);

    if (!normalizedRole) {
      return res.status(403).json({
        message: "Invalid user role",
      });
    }

    // -----------------------------------------------------
    // HR APPROVAL CHECK
    // -----------------------------------------------------
    if (
      normalizedRole === "HR" &&
      user.registrationStatus !== "Approved"
    ) {
      if (user.registrationStatus === "Rejected") {
        return res.status(403).json({
          message:
            "Your HR account was rejected by an Admin. Please contact the Admin.",
        });
      }

      return res.status(403).json({
        message:
          "Your HR account is pending Admin verification. You cannot log in until an Admin approves it.",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        message: "Your account is inactive",
      });
    }

    // Admin and HR are also employee records. Repair older accounts
    // that were created before this relationship was enforced.
    if (normalizedRole === "Admin" || normalizedRole === "HR") {
      await ensureEmployeeProfile(user, { activate: true });
    }

    if (user.role !== normalizedRole) {
      user.role = normalizedRole;
      await user.save();
    }

    // Employee users must have their automatically created profile.
    if (normalizedRole === "Employee") {
      if (!user.employee) {
        return res.status(403).json({
          message:
            "Your Employee account is not linked to an Employee Profile. Please contact Admin/HR.",
        });
      }

      const employee = await Employee.findById(user.employee);

      if (!employee) {
        return res.status(403).json({
          message: "Your Employee Profile no longer exists.",
        });
      }
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: normalizedRole,
        employee: user.employee || null,
        department: user.department || "",
        registrationStatus: user.registrationStatus,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("employee");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (
      user.role === "HR" &&
      user.registrationStatus !== "Approved"
    ) {
      return res.status(403).json({
        message: "Your HR account is not approved",
      });
    }

    if (user.role === "Admin" || user.role === "HR") {
      await ensureEmployeeProfile(user, { activate: true });
      await user.populate("employee");
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      message: "Failed to get current user",
    });
  }
};

/*
=========================================================
ADMIN: HR VERIFICATION
=========================================================
*/

const getHrRequests = async (req, res) => {
  try {
    if (req.user?.role !== "Admin") {
      return res.status(403).json({
        message: "Only Admin can review HR registration requests",
      });
    }

    const requests = await User.find({
      role: "HR",
      registrationStatus: "Pending",
    })
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      requests,
    });
  } catch (error) {
    console.error("Get HR requests error:", error);

    return res.status(500).json({
      message: "Failed to fetch HR registration requests",
    });
  }
};

const approveHr = async (req, res) => {
  try {
    if (req.user?.role !== "Admin") {
      return res.status(403).json({
        message: "Only Admin can approve HR accounts",
      });
    }

    const user = await User.findOne({
      _id: req.params.id,
      role: "HR",
    });

    if (!user) {
      return res.status(404).json({
        message: "HR account not found",
      });
    }

    // =====================================================
    // REPAIR / CREATE EMPLOYEE PROFILE
    // =====================================================

    let employee = null;

    // Existing linked Employee
    if (user.employee) {
      employee = await Employee.findById(user.employee);
    }

    // Try finding by email for older HR accounts
    if (!employee) {
      employee = await Employee.findOne({
        email: user.email,
      });
    }

    // Create Employee profile if it doesn't exist
    if (!employee) {
      employee = await Employee.create({
        name: user.name,
        role: "HR",
        department:
          user.department || "Human Resources",
        email: user.email,
        status: "Active",
      });
    }

    // =====================================================
    // LINK USER TO EMPLOYEE
    // =====================================================

    user.employee = employee._id;

    // =====================================================
    // APPROVE HR
    // =====================================================

    user.registrationStatus = "Approved";
    user.isActive = true;

    await user.save();

    return res.status(200).json({
      message:
        "HR account approved and Employee profile linked successfully",

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employee: user.employee,
        department: user.department,
        registrationStatus: user.registrationStatus,
        isActive: user.isActive,
      },
    });

  } catch (error) {
    console.error("Approve HR error:", error);

    return res.status(500).json({
      message: "Failed to approve HR account",
      error: error.message,
    });
  }
};

const rejectHr = async (req, res) => {
  try {
    if (req.user?.role !== "Admin") {
      return res.status(403).json({
        message: "Only Admin can reject HR accounts",
      });
    }

    const user = await User.findOne({
      _id: req.params.id,
      role: "HR",
    });

    if (!user) {
      return res.status(404).json({
        message: "HR account not found",
      });
    }

    user.registrationStatus = "Rejected";
    user.isActive = false;
    await user.save();

    return res.status(200).json({
      message: "HR account rejected",
    });
  } catch (error) {
    console.error("Reject HR error:", error);

    return res.status(500).json({
      message: "Failed to reject HR account",
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  getHrRequests,
  approveHr,
  rejectHr,
};