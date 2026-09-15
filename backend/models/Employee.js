const mongoose = require("mongoose");

/* =========================================================
   TASK SCHEMA
========================================================= */

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status: { type: String, enum: ["Pending", "In Progress", "Review", "Completed"], default: "Pending" },
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    dueDate: { type: String, default: "" },
    hours: { type: Number, default: 0 },
  },
  { timestamps: true }
);

/* =========================================================
   ATTENDANCE SCHEMA
========================================================= */

const attendanceSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    status: { type: String, enum: ["Present", "Absent", "Half Day", "Leave"], default: "Present" },
    hours: { type: Number, default: 0 },
    checkIn: { type: String, default: "" },
    checkOut: { type: String, default: "" },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

/* =========================================================
   LEAVE SCHEMA
========================================================= */

const leaveSchema = new mongoose.Schema(
  {
    leaveType: { type: String, enum: ["Casual Leave", "Sick Leave", "Earned Leave", "Unpaid Leave", "Emergency Leave", "Other"], required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    reason: { type: String, default: "", trim: true },
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    appliedAt: { type: Date, default: Date.now },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: "" },
  },
  { timestamps: true }
);

/* =========================================================
   PERFORMANCE REVIEW SCHEMA
========================================================= */

const performanceSchema = new mongoose.Schema(
  {
    reviewDate: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    feedback: { type: String, default: "", trim: true },
    strengths: { type: String, default: "", trim: true },
    improvements: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

/* =========================================================
   DOCUMENT SCHEMA
========================================================= */

const documentSchema = new mongoose.Schema(
  {
    documentName: {
      type: String,
      required: true,
      trim: true,
    },

    documentType: {
      type: String,
      enum: [
        "Resume",
        "Aadhaar Card",
        "PAN Card",
        "Passport",
        "Driving License",
        "Offer Letter",
        "Experience Certificate",
        "Education Certificate",
        "Other",
      ],
      default: "Other",
    },

    documentNumber: {
      type: String,
      default: "",
      trim: true,
    },

    issueDate: {
      type: String,
      default: "",
    },

    expiryDate: {
      type: String,
      default: "",
    },

    fileName: {
      type: String,
      default: "",
    },

    fileUrl: {
      type: String,
      default: "",
    },

    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

/* =========================================================
   EMPLOYEE SCHEMA
========================================================= */

const employeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      required: true,
    },

    department: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      default: "",
    },

    location: {
      type: String,
      default: "",
    },

    joiningDate: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    avatar: {
      type: String,
      default: "",
    },

    /* =====================================================
       TASKS
    ===================================================== */

    tasks: [taskSchema],

    /* =====================================================
       ATTENDANCE
    ===================================================== */

    attendance: [attendanceSchema],

    /* =====================================================
       LEAVES
    ===================================================== */

    leaves: [leaveSchema],

    /* =====================================================
       PERFORMANCE REVIEWS
    ===================================================== */

    performanceReviews: [performanceSchema],

    /* =====================================================
       DOCUMENTS
    ===================================================== */

    documents: [documentSchema],
  },

  {
    timestamps: true,
  }
);

/* =========================================================
   EXPORT MODEL
========================================================= */

module.exports = mongoose.model(
  "Employee",
  employeeSchema
);