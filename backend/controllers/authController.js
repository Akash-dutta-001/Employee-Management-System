const User = require("../models/User");
const Employee = require("../models/Employee");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

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
  { activate = false } = {}
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
      email: user.email.toLowerCase(),
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
      email: user.email.toLowerCase(),
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

    const verificationToken = crypto.randomBytes(32).toString("hex");

    const hashedVerificationToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    const verificationExpires =
      Date.now() + 24 * 60 * 60 * 1000;

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
        isActive: false,
        emailVerified: false,
        emailVerificationToken: hashedVerificationToken,
        emailVerificationExpires: verificationExpires,
      });

      const verificationUrl =
        `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

      const response = await fetch(
        "https://api.brevo.com/v3/smtp/email",
        {
          method: "POST",
          headers: {
            accept: "application/json",
            "api-key": process.env.BREVO_API_KEY,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            sender: {
              name: process.env.BREVO_FROM_NAME,
              email: process.env.BREVO_FROM_EMAIL,
            },
            to: [
              {
                email: user.email,
              },
            ],
            subject: "Verify your EmployeeHub email",
            textContent: `Verify your EmployeeHub account by opening this link: ${verificationUrl}`,
            htmlContent: `
              <p>Welcome to EmployeeHub.</p>
              <p>Click the link below to verify your email address.</p>
              <p><a href="${verificationUrl}">Verify Email</a></p>
              <p>This link expires in 24 hours.</p>
            `,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `Brevo verification email failed: ${errorData}`
        );
      }

      return res.status(201).json({
        message:
          "Account created. Please check your email to verify your account.",
      });
    }

    if (normalizedRole === "HR") {
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
          emailVerified: false,
          emailVerificationToken: hashedVerificationToken,
          emailVerificationExpires: verificationExpires,
        });

        const verificationUrl =
          `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

        const response = await fetch(
          "https://api.brevo.com/v3/smtp/email",
          {
            method: "POST",
            headers: {
              accept: "application/json",
              "api-key": process.env.BREVO_API_KEY,
              "content-type": "application/json",
            },
            body: JSON.stringify({
              sender: {
                name: process.env.BREVO_FROM_NAME,
                email: process.env.BREVO_FROM_EMAIL,
              },
              to: [{ email: user.email }],
              subject: "Verify your EmployeeHub email",
              textContent: `Verify your EmployeeHub account by opening this link: ${verificationUrl}`,
              htmlContent: `
                <p>Welcome to EmployeeHub.</p>
                <p>Click the link below to verify your email address.</p>
                <p><a href="${verificationUrl}">Verify Email</a></p>
                <p>This link expires in 24 hours.</p>
              `,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(
            `Brevo verification email failed: ${errorData}`
          );
        }

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

const login = async (req, res) => {
  const loginStart = Date.now();
  let lastStep = loginStart;

  const requestId =
    req.requestId ||
    `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const logLoginStep = (step) => {
    const now = Date.now();

    console.log(
      `[LOGIN TIMING][${requestId}] ${step}: ${
        now - lastStep
      } ms (elapsed: ${now - loginStart} ms)`
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

    const user = await User.findOne({
      email: normalizedEmail,
    });

    logLoginStep("User database lookup");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (user.emailVerified === false) {
      if (
        user.role === "Admin" &&
        !user.emailVerificationToken
      ) {
        user.emailVerified = true;
        await user.save();
      } else {
        return res.status(403).json({
          message: "Please verify your email before logging in.",
        });
      }
    }

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

    const normalizedRole = normalizeRole(user.role);

    if (!normalizedRole) {
      return res.status(403).json({
        message: "Invalid user role",
      });
    }

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

    if (
      normalizedRole === "Admin" ||
      normalizedRole === "HR"
    ) {
      let employee = null;

      if (user.employee) {
        employee = await Employee.findById(user.employee);
      }

      if (!employee) {
        employee = await Employee.findOne({
          email: normalizedEmail,
        });
      }

      if (!employee) {
        return res.status(403).json({
          message: "Your Employee Profile was not found",
        });
      }

      if (employee.status === "Inactive") {
        if (user.isActive !== false) {
          user.isActive = false;
          await user.save();
        }

        return res.status(403).json({
          message: "Your account is inactive",
        });
      }

      if (user.isActive === false) {
        return res.status(403).json({
          message: "Your account is inactive",
        });
      }

      if (
        String(user.employee || "") !==
        String(employee._id)
      ) {
        user.employee = employee._id;
        await user.save();
      }

      logLoginStep("Admin/HR status check");
    }

    if (normalizedRole === "Employee") {
      if (user.isActive === false) {
        return res.status(403).json({
          message: "Your account is inactive",
        });
      }

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

      if (employee.status === "Inactive") {
        user.isActive = false;
        await user.save();

        return res.status(403).json({
          message: "Your account is inactive",
        });
      }
    }

    if (user.role !== normalizedRole) {
      user.role = normalizedRole;
      await user.save();
    }

    logLoginStep("Role normalization and save");

    const token = generateToken(user);

    logLoginStep("JWT generation");

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
      `[LOGIN TIMING][${requestId}] Total: ${
        Date.now() - loginStart
      } ms`
    );
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

    if (user.isActive === false) {
      return res.status(403).json({
        message: "Your account is inactive",
      });
    }

    if (user.role === "Admin" || user.role === "HR") {
      await ensureEmployeeProfile(user, {
        activate: false,
      });

      await user.populate("employee");

      if (
        user.employee &&
        user.employee.status === "Inactive"
      ) {
        return res.status(403).json({
          message: "Your account is inactive",
        });
      }
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

    employee.status = "Active";
    employee.email = user.email;
    employee.name = user.name;

    await employee.save();

    user.employee = employee._id;
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

    if (user.employee) {
      await Employee.findByIdAndUpdate(user.employee, {
        status: "Inactive",
      });
    }

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

const forgotPassword = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    const genericMessage =
      "If an account exists with this email, a password reset link has been sent.";

    if (!user) {
      return res.status(200).json({
        message: genericMessage,
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordExpires =
      Date.now() + 15 * 60 * 1000;

    await user.save();

    const resetUrl =
      `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const response = await fetch(
      "https://api.brevo.com/v3/smtp/email",
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": process.env.BREVO_API_KEY,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: {
            name: process.env.BREVO_FROM_NAME,
            email: process.env.BREVO_FROM_EMAIL,
          },
          to: [
            {
              email: user.email,
            },
          ],
          subject: "EmployeeHub Password Reset",
          textContent: `You requested a password reset. Open this link within 15 minutes: ${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
          htmlContent: `
            <p>You requested a password reset for your EmployeeHub account.</p>
            <p><a href="${resetUrl}">Reset your password</a></p>
            <p>This link expires in 15 minutes and can only be used once.</p>
            <p>If you did not request this, you can ignore this email.</p>
          `,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Brevo email failed: ${errorData}`);
    }

    return res.status(200).json({
      message: genericMessage,
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      message:
        "Unable to process your request right now. Please try again later.",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message: "Token and new password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message:
          "This reset link is invalid or has expired. Please request a new one.",
      });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return res.status(200).json({
      message:
        "Password reset successful. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      message:
        "Unable to reset your password right now. Please try again later.",
    });
  }
};


const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        message: "Verification token is required",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message:
          "This verification link is invalid or has expired.",
      });
    }

    // ---------------------------------------------------------
    // Mark email as verified
    // ---------------------------------------------------------

    user.emailVerified = true;

    // ---------------------------------------------------------
    // Employee
    //
    // A newly registered Employee starts with:
    // User.isActive = false
    // Employee.status = Active
    //
    // Email verification is what activates the account.
    // ---------------------------------------------------------

    if (user.role === "Employee") {
      user.isActive = true;

      if (user.employee) {
        const employee = await Employee.findById(user.employee);

        if (employee) {
          employee.status = "Active";
          await employee.save();
        }
      }
    }

    // ---------------------------------------------------------
    // Admin
    //
    // This path is intended for a NEW Admin created by another
    // Admin through createAdmin().
    //
    // createAdmin() creates:
    // User.isActive = false
    // Employee.status = Inactive
    //
    // Verification activates that NEW Admin.
    // ---------------------------------------------------------

    if (user.role === "Admin") {
      user.isActive = true;

      let employee = null;

      if (user.employee) {
        employee = await Employee.findById(user.employee);
      }

      if (!employee) {
        employee = await Employee.findOne({
          email: user.email.trim().toLowerCase(),
        });
      }

      if (employee) {
        employee.status = "Active";
        employee.email = user.email;

        await employee.save();

        if (
          String(user.employee || "") !==
          String(employee._id)
        ) {
          user.employee = employee._id;
        }
      }
    }

    // ---------------------------------------------------------
    // HR
    //
    // IMPORTANT:
    // Email verification does NOT activate HR.
    //
    // HR must still be approved by an Admin.
    // approveHr() is responsible for:
    //
    // registrationStatus = Approved
    // isActive = true
    // Employee.status = Active
    // ---------------------------------------------------------

    if (user.role === "HR") {
      // Keep HR inactive until Admin approval.
      user.isActive = false;
    }

    // ---------------------------------------------------------
    // Consume verification token
    // ---------------------------------------------------------

    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    return res.status(200).json({
      message:
        user.role === "HR"
          ? "Email verified successfully. Your account is pending Admin approval."
          : "Email verified successfully. You can now log in.",
    });

  } catch (error) {
    console.error("Email verification error:", error);

    return res.status(500).json({
      message: "Unable to verify your email right now.",
    });
  }
};


const requestAdminEmailChange = async (req, res) => {
  try {
    if (req.user?.role !== "Admin") {
      return res.status(403).json({
        message: "Only Admin can change the Admin email",
      });
    }

    const newEmail = req.body.email?.trim().toLowerCase();

    if (!newEmail) {
      return res.status(400).json({
        message: "New email is required",
      });
    }

    if (newEmail === req.user.email?.toLowerCase()) {
      return res.status(400).json({
        message:
          "New email must be different from your current email",
      });
    }

    const existingUser = await User.findOne({
      email: newEmail,
      _id: { $ne: req.user.id },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "This email is already registered",
      });
    }

    const existingEmployee = await Employee.findOne({
      email: newEmail,
    });

    if (existingEmployee) {
      return res.status(400).json({
        message:
          "An Employee Profile already exists with this email",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user || user.role !== "Admin") {
      return res.status(404).json({
        message: "Admin account not found",
      });
    }

    const verificationToken =
      crypto.randomBytes(32).toString("hex");

    const hashedVerificationToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    user.pendingEmail = newEmail;
    user.pendingEmailVerificationToken =
      hashedVerificationToken;
    user.pendingEmailVerificationExpires =
      Date.now() + 24 * 60 * 60 * 1000;

    await user.save();

    const verificationUrl =
      `${process.env.FRONTEND_URL}/verify-new-email/${verificationToken}`;

    const response = await fetch(
      "https://api.brevo.com/v3/smtp/email",
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": process.env.BREVO_API_KEY,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: {
            name: process.env.BREVO_FROM_NAME,
            email: process.env.BREVO_FROM_EMAIL,
          },
          to: [{ email: newEmail }],
          subject: "Verify your new EmployeeHub email",
          textContent: `Verify your new EmployeeHub email by opening this link: ${verificationUrl}`,
          htmlContent: `
            <p>You requested to change your EmployeeHub Admin email.</p>
            <p><a href="${verificationUrl}">Verify New Email</a></p>
            <p>This link expires in 24 hours.</p>
            <p>If you did not request this change, you can ignore this email.</p>
          `,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();

      user.pendingEmail = undefined;
      user.pendingEmailVerificationToken = undefined;
      user.pendingEmailVerificationExpires = undefined;

      await user.save();

      throw new Error(`Brevo email failed: ${errorData}`);
    }

    return res.status(200).json({
      message:
        "Verification email sent to the new email address.",
    });
  } catch (error) {
    console.error("Admin email change error:", error);

    return res.status(500).json({
      message:
        "Unable to send email verification right now.",
    });
  }
};

const verifyNewAdminEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        message: "Verification token is required",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      role: "Admin",
      pendingEmailVerificationToken: hashedToken,
      pendingEmailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message:
          "This verification link is invalid or has expired.",
      });
    }

    const oldEmail = user.email;
    const newEmail = user.pendingEmail;

    const existingUser = await User.findOne({
      email: newEmail,
      _id: { $ne: user._id },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "This email is already registered.",
      });
    }

    user.email = newEmail;
    user.emailVerified = true;
    user.pendingEmail = undefined;
    user.pendingEmailVerificationToken = undefined;
    user.pendingEmailVerificationExpires = undefined;

    await user.save();

    if (user.employee) {
      await Employee.findByIdAndUpdate(user.employee, {
        email: newEmail,
      });
    } else {
      await Employee.findOneAndUpdate(
        { email: oldEmail },
        { email: newEmail }
      );
    }

    return res.status(200).json({
      message:
        "Admin email changed successfully. Please use the new email for your next login.",
    });
  } catch (error) {
    console.error("Verify new Admin email error:", error);

    return res.status(500).json({
      message:
        "Unable to verify the new email right now.",
    });
  }
};

const createAdmin = async (req, res) => {
  try {
    if (req.user?.role !== "Admin") {
      return res.status(403).json({
        message: "Only Admin can create another Admin",
      });
    }

    const {
      name,
      email,
      password,
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

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User with this email already exists",
      });
    }

    const existingEmployee = await Employee.findOne({
      email: normalizedEmail,
    });

    if (existingEmployee) {
      return res.status(400).json({
        message:
          "An Employee Profile already exists with this email",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken =
      crypto.randomBytes(32).toString("hex");

    const hashedVerificationToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    const verificationExpires =
      Date.now() + 24 * 60 * 60 * 1000;

    const employee = await Employee.create({
      name: name.trim(),
      role: jobRole?.trim() || "Administrator",
      department:
        department?.trim() || "Administration",
      email: normalizedEmail,
      status: "Inactive",
    });

    try {
      const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: "Admin",
        employee: employee._id,
        department:
          department?.trim() || "Administration",
        registrationStatus: "Approved",
        isActive: false,
        emailVerified: false,
        emailVerificationToken: hashedVerificationToken,
        emailVerificationExpires: verificationExpires,
      });

      const verificationUrl =
        `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

      const response = await fetch(
        "https://api.brevo.com/v3/smtp/email",
        {
          method: "POST",
          headers: {
            accept: "application/json",
            "api-key": process.env.BREVO_API_KEY,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            sender: {
              name: process.env.BREVO_FROM_NAME,
              email: process.env.BREVO_FROM_EMAIL,
            },
            to: [{ email: user.email }],
            subject:
              "Verify your EmployeeHub Admin account",
            textContent: `Your EmployeeHub Admin account was created. Verify your email by opening this link: ${verificationUrl}`,
            htmlContent: `
              <p>Your EmployeeHub Admin account has been created.</p>
              <p><a href="${verificationUrl}">Verify Email</a></p>
              <p>This link expires in 24 hours.</p>
            `,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(
          `Brevo verification email failed: ${errorData}`
        );
      }

      return res.status(201).json({
        message:
          "Admin account created. Verification email sent successfully.",
      });
    } catch (error) {
      await User.deleteOne({
        email: normalizedEmail,
      });

      await Employee.findByIdAndDelete(employee._id);

      throw error;
    }
  } catch (error) {
    console.error("Create Admin error:", error);

    return res.status(500).json({
      message: "Unable to create Admin account",
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
  forgotPassword,
  resetPassword,
  verifyEmail,
  requestAdminEmailChange,
  verifyNewAdminEmail,
  createAdmin,
};