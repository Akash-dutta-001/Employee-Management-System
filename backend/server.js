
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const { randomUUID } = require("crypto");
const { performance } = require("perf_hooks");

const connectDB = require("./config/db");

const employeeRoutes = require("./routes/employeeRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const taskRoutes = require("./routes/taskRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const payrollRoutes = require("./routes/payrollRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.set("trust proxy", 1);

/* =========================================================
   REQUEST TIMING
========================================================= */

app.use((req, res, next) => {
  const startTime = performance.now();

  req.requestId = randomUUID();

  res.on("finish", () => {
    const duration = (performance.now() - startTime).toFixed(2);

    console.log(
      `[REQUEST TIMING][${req.requestId}] ${req.method} ${req.originalUrl} | Status: ${res.statusCode} | Total: ${duration} ms`
    );
  });

  next();
});

/* =========================================================
   CORS
========================================================= */

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://employee-management-system-eight-wine.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

/* =========================================================
   MIDDLEWARE
========================================================= */

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
   SERVER STARTUP
========================================================= */

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
};

startServer();
