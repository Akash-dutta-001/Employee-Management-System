
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const connectDB = require("./config/db");
const Employee = require("./models/Employee");
const User = require("./models/User");

const seedAdmin = async () => {
  try {
    const name = process.env.ADMIN_NAME?.trim();
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!name || !email || !password) {
      throw new Error(
        "ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env"
      );
    }

    if (password.length < 12) {
      throw new Error(
        "Admin password must be at least 12 characters long."
      );
    }

    // Connect to MongoDB Atlas using backend/config/db.js
    await connectDB();

    // Find an existing employee profile for this email.
    let employee = await Employee.findOne({ email });

    // Create a profile if one does not already exist.
    if (!employee) {
      employee = await Employee.create({
        name,
        role: "System Administrator",
        department: "Administration",
        email,
        phone: "",
        location: "",
        joiningDate: new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        status: "Active",
        avatar: name
          .split(/\s+/)
          .map((part) => part.charAt(0))
          .join("")
          .toUpperCase(),
      });

      console.log("Admin employee profile created.");
    } else {
      console.log("Existing employee profile found.");
    }

    // Hash the password before saving it.
    const hashedPassword = await bcrypt.hash(password, 12);

    // Find an existing account for this email.
    let user = await User.findOne({ email });

    if (user) {
      // Update only the matching account.
      user.name = name;
      user.password = hashedPassword;
      user.role = "Admin";
      user.employee = employee._id;
      user.isActive = true;

      await user.save();

      console.log("Existing user updated as Admin.");
    } else {
      // Create a new Admin account.
      user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: "Admin",
        employee: employee._id,
        isActive: true,
      });

      console.log("New Admin account created.");
    }

    console.log("--------------------------------");
    console.log("Admin account is ready!");
    console.log("Email:", user.email);
    console.log("Role:", user.role);
    console.log("Employee profile linked:", employee._id);
    console.log("--------------------------------");

  } catch (error) {
    console.error("Admin seed error:", error.message);
    process.exitCode = 1;
  } finally {
    // Close the database connection after the script finishes.
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
};

seedAdmin();
