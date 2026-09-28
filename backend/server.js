require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");

const employeeRoutes = require("./routes/employeeRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const taskRoutes = require("./routes/taskRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const payrollRoutes = require("./routes/payrollRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());

/* =========================================================
   UPLOADED FILES
========================================================= */

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

/* =========================================================
   API ROUTES
========================================================= */

app.use("/api/auth", authRoutes);

app.use("/api/employees", employeeRoutes);
app.use("/api/employees", leaveRoutes);
app.use("/api/employees", taskRoutes);
app.use("/api/employees", attendanceRoutes);
app.use("/api/payroll", payrollRoutes);

/* =========================================================
   TEST ROUTE
========================================================= */

app.get("/", (req, res) => {
  res.json({
    message: "Employee Management API is running",
  });
});

/* =========================================================
   SERVER
========================================================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});