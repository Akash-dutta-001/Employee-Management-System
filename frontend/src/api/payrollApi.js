import axios from "axios";

const API = axios.create({
baseURL: "https://employeehub-backend-y0or.onrender.com/api"});

// Add the JWT token to every payroll request.
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("employeehub_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// =========================================================
// GET ALL PAYROLL RECORDS
// =========================================================

export const getPayrollRecords = async () => {
  const response = await API.get("/payroll");
  return response.data;
};

// =========================================================
// GET ONE PAYROLL RECORD
// =========================================================

export const getPayrollRecord = async (payrollId) => {
  const response = await API.get(`/payroll/${payrollId}`);
  return response.data;
};

// =========================================================
// GET PAYROLL FOR ONE EMPLOYEE
// =========================================================

export const getEmployeePayroll = async (employeeId) => {
  const response = await API.get(`/payroll/employee/${employeeId}`);
  return response.data;
};

// =========================================================
// CREATE PAYROLL
// =========================================================

export const createPayroll = async (payrollData) => {
  const response = await API.post("/payroll", payrollData);
  return response.data;
};

// =========================================================
// UPDATE PAYROLL
// =========================================================

export const updatePayroll = async (payrollId, payrollData) => {
  const response = await API.put(`/payroll/${payrollId}`, payrollData);
  return response.data;
};

// =========================================================
// DELETE PAYROLL
// =========================================================

export const deletePayroll = async (payrollId) => {
  const response = await API.delete(`/payroll/${payrollId}`);
  return response.data;
};

// =========================================================
// MARK PAYROLL AS PAID
// =========================================================

export const markPayrollAsPaid = async (payrollId) => {
  const response = await API.patch(`/payroll/${payrollId}/pay`);
  return response.data;
};

export default API;