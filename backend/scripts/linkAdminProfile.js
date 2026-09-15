const mongoose = require("mongoose");
const dotenv = require("dotenv");

const User = require("../models/User");
const Employee = require("../models/Employee");

dotenv.config();

const ADMIN_EMAIL = "admin@employeehub.com";

async function linkAdminProfile() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    // Find the existing Admin user
    const user = await User.findOne({
      email: ADMIN_EMAIL,
      role: "Admin",
    });

    if (!user) {
      console.log(`Admin user not found: ${ADMIN_EMAIL}`);
      process.exit(1);
    }

    console.log(`Admin found: ${user.name} (${user.email})`);

    // If already linked, stop
    if (user.employee) {
      const existingEmployee = await Employee.findById(user.employee);

      if (existingEmployee) {
        console.log("Admin is already linked to an Employee profile.");
        console.log("Employee ID:", existingEmployee._id.toString());
        process.exit(0);
      }
    }

    // Check whether an Employee profile already exists
    let employee = await Employee.findOne({
      email: ADMIN_EMAIL,
    });

    // Create Employee profile if needed
    if (!employee) {
      employee = await Employee.create({
        name: user.name,
        role: "Admin",
        department: "Administration",
        email: ADMIN_EMAIL,
        phone: "",
        location: "",
        joiningDate: "",
        status: "Active",
        avatar: "",
      });

      console.log("Employee profile created.");
    } else {
      console.log("Employee profile already exists.");
    }

    // Link User to Employee
    user.employee = employee._id;
    await user.save();

    console.log("");
    console.log("========================================");
    console.log("ADMIN PROFILE LINKED SUCCESSFULLY");
    console.log("========================================");
    console.log("User:", user.email);
    console.log("Role:", user.role);
    console.log("Employee:", employee.name);
    console.log("Employee ID:", employee._id.toString());
    console.log("========================================");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

linkAdminProfile();