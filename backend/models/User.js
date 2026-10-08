const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["Admin", "HR", "Employee"],
      default: "Employee",
    },

    // Password reset
    resetPasswordToken: {
      type: String,
      default: undefined,
    },

    resetPasswordExpires: {
      type: Date,
      default: undefined,
    },

    // Email verification
    emailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationToken: {
      type: String,
      default: undefined,
    },

    emailVerificationExpires: {
      type: Date,
      default: undefined,
    },

    // Admin email change
    pendingEmail: {
      type: String,
      default: undefined,
      lowercase: true,
      trim: true,
    },

    pendingEmailVerificationToken: {
      type: String,
      default: undefined,
    },

    pendingEmailVerificationExpires: {
      type: Date,
      default: undefined,
    },

    // User ↔ Employee relationship
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    department: {
      type: String,
      default: "",
      trim: true,
    },

    // HR approval status
    registrationStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Approved",
    },

    // Account status
    // IMPORTANT:
    // New accounts start inactive.
    // Controllers explicitly activate them after
    // verification/approval.
    isActive: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);