const mongoose = require("mongoose");
const dotenv = require("dotenv");

const User = require("../models/User");
const Employee = require("../models/Employee");

dotenv.config();

const HR_EMAIL = "hr@employeehub.com";

async function linkHRProfile() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    const user = await User.findOne({
      email: HR_EMAIL,
      role: "HR",
    });

    if (!user) {
      console.log(`HR user not found: ${HR_EMAIL}`);
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log(`HR found: ${user.name} (${user.email})`);

    // Check whether the HR user is already linked
    if (user.employee) {
      const existingEmployee = await Employee.findById(user.employee);

      if (existingEmployee) {
        console.log("HR is already linked to an Employee profile.");
        console.log("Employee ID:", existingEmployee._id.toString());

        await mongoose.disconnect();
        process.exit(0);
      }
    }

    // Check for an existing Employee profile
    let employee = await Employee.findOne({
      email: HR_EMAIL,
    });

    if (!employee) {
      employee = await Employee.create({
        name: user.name,
        role: "HR",
        department: "Human Resources",
        email: HR_EMAIL,
        phone: "",
        location: "",
        joiningDate: "",
        status: "Active",
        avatar: "",
      });

      console.log("HR Employee profile created.");
    } else {
      console.log("HR Employee profile already exists.");

      // Make sure the profile is marked HR
      employee.role = "HR";
      employee.department = "Human Resources";
      await employee.save();
    }

    // Link User -> Employee
    user.employee = employee._id;
    await user.save();

    console.log("");
    console.log("========================================");
    console.log("HR PROFILE LINKED SUCCESSFULLY");
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

linkHRProfile();