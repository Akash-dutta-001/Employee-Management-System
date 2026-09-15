const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

const connectDB = require("./config/db");

const Employee = require("./models/Employee");
const User = require("./models/User");

dotenv.config();

const employees = [
  {
    name: "Rahul Sharma",
    role: "Software Developer",
    department: "IT",
    email: "rahul@company.com",
    phone: "+91 9876543210",
    location: "Kolkata",
    joiningDate: "10 Jan 2024",
    status: "Active",
    avatar: "RS",

    tasks: [
      {
        title: "Employee Dashboard UI",
        description:
          "Build the employee dashboard using React and Tailwind CSS.",
        status: "Completed",
        priority: "High",
        dueDate: "05 Sep 2026",
        hours: 12,
      },
      {
        title: "Employee API Integration",
        description:
          "Connect the employee frontend with the backend API.",
        status: "In Progress",
        priority: "High",
        dueDate: "12 Sep 2026",
        hours: 8,
      },
      {
        title: "Attendance Module",
        description:
          "Implement employee attendance tracking.",
        status: "Review",
        priority: "Medium",
        dueDate: "15 Sep 2026",
        hours: 6,
      },
    ],
  },

  {
    name: "Priya Singh",
    role: "UI/UX Designer",
    department: "Design",
    email: "priya@company.com",
    phone: "+91 9876543211",
    location: "Kolkata",
    joiningDate: "15 Mar 2024",
    status: "Active",
    avatar: "PS",

    tasks: [
      {
        title: "Dashboard Design",
        description:
          "Design the employee dashboard.",
        status: "Completed",
        priority: "High",
        dueDate: "08 Sep 2026",
        hours: 10,
      },
      {
        title: "Mobile UI",
        description:
          "Create responsive mobile layouts.",
        status: "In Progress",
        priority: "Medium",
        dueDate: "15 Sep 2026",
        hours: 6,
      },
    ],
  },

  {
    name: "Amit Roy",
    role: "Backend Developer",
    department: "IT",
    email: "amit@company.com",
    phone: "+91 9876543212",
    location: "Kolkata",
    joiningDate: "20 May 2023",
    status: "Active",
    avatar: "AR",

    tasks: [
      {
        title: "API Development",
        description:
          "Develop employee APIs.",
        status: "Completed",
        priority: "High",
        dueDate: "07 Sep 2026",
        hours: 15,
      },
      {
        title: "MongoDB Integration",
        description:
          "Connect backend with MongoDB.",
        status: "In Progress",
        priority: "High",
        dueDate: "18 Sep 2026",
        hours: 8,
      },
    ],
  },
];

// =========================================================
// SEED USERS
// =========================================================

const createUsers = async (insertedEmployees) => {
  const adminPassword = await bcrypt.hash(
    "Admin@123",
    10
  );

  const hrPassword = await bcrypt.hash(
    "HR@123456",
    10
  );

  const employeePassword = await bcrypt.hash(
    "Employee@123",
    10
  );

  // Find Rahul Sharma's Employee document
  const rahul = insertedEmployees.find(
    (employee) =>
      employee.email === "rahul@company.com"
  );

  if (!rahul) {
    throw new Error(
      "Rahul Sharma employee record was not found"
    );
  }

  return [
    {
      name: "Admin",
      email: "admin@employeehub.com",
      password: adminPassword,
      role: "Admin",
      employee: null,
      isActive: true,
    },

    {
      name: "HR Manager",
      email: "hr@employeehub.com",
      password: hrPassword,
      role: "HR",
      employee: null,
      isActive: true,
    },

    {
      name: "Rahul Sharma",
      email: "employee@employeehub.com",
      password: employeePassword,
      role: "Employee",

      // Link login account to Rahul's employee record
      employee: rahul._id,

      isActive: true,
    },
  ];
};

// =========================================================
// SEED DATABASE
// =========================================================

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Employee.deleteMany({});
    await User.deleteMany({});

    console.log(
      "Old employees and users removed"
    );

    // Insert employees
    const insertedEmployees =
      await Employee.insertMany(employees);

    console.log(
      "Employees inserted successfully"
    );

    // Create users with Employee relationship
    const users = await createUsers(
      insertedEmployees
    );

    await User.insertMany(users);

    console.log(
      "Users inserted successfully"
    );

    console.log("\n====================================");
    console.log(
      "EmployeeHub Login Credentials"
    );
    console.log("====================================");

    console.log("\nADMIN");
    console.log(
      "Email: admin@employeehub.com"
    );
    console.log("Password: Admin@123");

    console.log("\nHR");
    console.log(
      "Email: hr@employeehub.com"
    );
    console.log("Password: HR@123456");

    console.log("\nEMPLOYEE");
    console.log(
      "Email: employee@employeehub.com"
    );
    console.log("Password: Employee@123");

    console.log("\n====================================");

    console.log(
      "\nEmployee user linked to:",
      "Rahul Sharma"
    );

    console.log(
      "Employee ID:",
      insertedEmployees.find(
        (employee) =>
          employee.email === "rahul@company.com"
      )._id
    );

    console.log(
      "\n===================================="
    );

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

seedDatabase();