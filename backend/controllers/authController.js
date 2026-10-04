
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

const ensureEmployeeProfile = async (
  user,
  { activate = true } = {}
) => {
  if (!user || !["Admin", "HR"].includes(user.role)) {
    return null;
  }

  let employee = null;

  if (user.employee) {
    employee = await Employee.findById(user.employee);
  }

  if (!employee) {
    employee = await Employee.findOne({
      email: user.email,
    });
  }

  if (!employee) {
    employee = await Employee.create({
      name: user.name,
      role: user.role === "Admin" ? "Administrator" : "HR",
      department:
        user.department ||
        (user.role === "Admin"
          ? "Administration"
          : "Human Resources"),
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
      // Department is optional during public HR registration.
      const hrDepartment =
        department?.trim() || "Human Resources";

      const existingEmployee = await Employee.findOne({
        email: normalizedEmail,
      });

      if (existingEmployee) {
        return res.status(400).json({
          message:
            "An Employee Profile already exists with this email.",
        });
      }

      // HR is also an employee in EmployeeHub.
      const employee = await Employee.create({
        name: name.trim(),
        role: "HR",
        department: hrDepartment,
        email: normalizedEmail,
        status: "Active",
      });

      try {
        const user = await User.create({
          name: name.trim(),
          email: normalizedEmail,
          password: hashedPassword,
          role: "HR",
          employee: employee._id,
          department: hrDepartment,
          registrationStatus: "Pending",
          isActive: false,
        });

        return res.status(201).json({
          message:
            "HR account and Employee profile created successfully and is pending Admin verification",
          pendingApproval: true,
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
      } catch (userError) {
        // Remove the Employee profile if User creation fails.
        await Employee.findByIdAndDelete(employee._id);
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

// =========================================================
// LOGIN WITH PERFORMANCE TIMING
// =========================================================

const login = async (req, res) => {
  const loginStart = Date.now();
  let lastStep = loginStart;

  const logLoginStep = (step) => {
    const now = Date.now();

    console.log(
      `[LOGIN TIMING] ${step}: ${now - lastStep} ms`
    );

    lastStep = now;
  };

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Find user in MongoDB
    const user = await User.findOne({
      email: normalizedEmail,
    });

    logLoginStep("User database lookup");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // 2. Compare password
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    logLoginStep("Password comparison");

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // 3. Normalize role
    const normalizedRole = normalizeRole(user.role);

    if (!normalizedRole) {
      return res.status(403).json({
        message: "Invalid user role",
      });
    }

    // 4. Check HR approval
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

    // 5. Check whether account is active
    if (user.isActive === false) {
      return res.status(403).json({
        message: "Your account is inactive",
      });
    }

    // 6. Ensure Admin and HR have Employee profiles
    if (
      normalizedRole === "Admin" ||
      normalizedRole === "HR"
    ) {
      await ensureEmployeeProfile(user, {
        activate: true,
      });

      logLoginStep("Ensure employee profile");
    }

    // 7. Save normalized role if needed
    if (user.role !== normalizedRole) {
      user.role = normalizedRole;
      await user.save();
    }

    logLoginStep("Role normalization and save");

    // 8. Check Employee profile for Employee accounts
    if (normalizedRole === "Employee") {
      if (!user.employee) {
        return res.status(403).json({
          message:
            "Your Employee account is not linked to an Employee Profile. Please contact Admin/HR.",
        });
      }

      const employee = await Employee.findById(
        user.employee
      );

      logLoginStep("Employee profile lookup");

      if (!employee) {
        return res.status(403).json({
          message: "Your Employee Profile no longer exists.",
        });
      }
    }

    // 9. Generate JWT
    const token = generateToken(user);

    logLoginStep("JWT generation");

    // 10. Send login response
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
  } finally {
    console.log(
      `[LOGIN TIMING] Total: ${Date.now() - loginStart} ms`
    );
  }
};

// =========================================================
// GET CURRENT USER
// =========================================================

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
      await ensureEmployeeProfile(user, {
        activate: true,
      });

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

// =========================================================
// ADMIN: HR VERIFICATION
// =========================================================

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

    // Repair or create Employee profile
    let employee = null;

    if (user.employee) {
      employee = await Employee.findById(user.employee);
    }

    if (!employee) {
      employee = await Employee.findOne({
        email: user.email,
      });
    }

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

    // Link User to Employee
    user.employee = employee._id;

    // Approve HR
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

// =========================================================
// EXPORTS
// =========================================================

module.exports = {
  register,
  login,
  getMe,
  getHrRequests,
  approveHr,
  rejectHr,
};
