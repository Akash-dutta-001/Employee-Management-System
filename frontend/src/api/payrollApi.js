
import axios from "axios";

const API = axios.create({
  baseURL: "https://employeehub-backend-y0or.onrender.com/api",
});

// =====================================
// CACHE SETTINGS
// =====================================

const payrollCache = new Map();
const pendingRequests = new Map();
const CACHE_DURATION = 15000; // 15 seconds

// Clear cached payroll data after a successful change
const clearPayrollCache = () => {
  payrollCache.clear();
};

// GET request with caching and duplicate-request prevention
const cachedGet = async (url) => {
  const token = localStorage.getItem("employeehub_token") || "";
  const cacheKey = `${token}:${url}`;

  // Return cached data if it is still valid
  const cached = payrollCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return { data: cached.data };
  }

  // Reuse an already-running request for the same URL
  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

  const request = API.get(url)
    .then((response) => {
      payrollCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
      });

      return response;
    })
    .finally(() => {
      pendingRequests.delete(cacheKey);
    });

  pendingRequests.set(cacheKey, request);

  return request;
};

// =====================================
// REQUEST INTERCEPTOR
// =====================================

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("employeehub_token");

    config.headers = config.headers || {};

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// =====================================
// RESPONSE INTERCEPTOR
// =====================================

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      console.error("Unauthorized. Please log in again.");
    } else if (status === 403) {
      console.error("You do not have permission to access payroll.");
    } else if (status === 404) {
      console.error("Payroll API endpoint not found:", error.config?.url);
    } else {
      console.error("Payroll API request failed:", error.message);
    }

    return Promise.reject(error);
  }
);

// =====================================
// GET ALL PAYROLL RECORDS
// =====================================

export const getPayrollRecords = async () => {
  const response = await cachedGet("/payroll");
  return response.data;
};

// =====================================
// GET ONE PAYROLL RECORD
// =====================================

export const getPayrollRecord = async (payrollId) => {
  const response = await cachedGet(`/payroll/${payrollId}`);
  return response.data;
};

// =====================================
// GET PAYROLL FOR ONE EMPLOYEE
// =====================================

export const getEmployeePayroll = async (employeeId) => {
  const response = await cachedGet(
    `/payroll/employee/${employeeId}`
  );
  return response.data;
};

// =====================================
// CREATE PAYROLL
// =====================================

export const createPayroll = async (payrollData) => {
  const response = await API.post("/payroll", payrollData);

  clearPayrollCache();

  return response.data;
};

// =====================================
// UPDATE PAYROLL
// =====================================

export const updatePayroll = async (payrollId, payrollData) => {
  const response = await API.put(
    `/payroll/${payrollId}`,
    payrollData
  );

  clearPayrollCache();

  return response.data;
};

// =====================================
// DELETE PAYROLL
// =====================================

export const deletePayroll = async (payrollId) => {
  const response = await API.delete(`/payroll/${payrollId}`);

  clearPayrollCache();

  return response.data;
};

// =====================================
// MARK PAYROLL AS PAID
// =====================================

export const markPayrollAsPaid = async (payrollId) => {
  const response = await API.patch(
    `/payroll/${payrollId}/pay`
  );

  clearPayrollCache();

  return response.data;
};

// =====================================
// DEFAULT EXPORT
// =====================================

export default API;
