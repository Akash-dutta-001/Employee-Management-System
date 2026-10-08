import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// =====================================
// CACHE SETTINGS
// =====================================

const apiCache = new Map();
const pendingRequests = new Map();
const CACHE_DURATION = 15000; // 15 seconds

const clearApiCache = () => {
  apiCache.clear();
};

const cachedGet = async (url) => {
  const token = localStorage.getItem("employeehub_token") || "";
  const cacheKey = `${token}:${url}`;

  const cached = apiCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return { data: cached.data };
  }

  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

  const request = API.get(url)
    .then((response) => {
      apiCache.set(cacheKey, {
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

    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    } else {
      config.headers["Content-Type"] = "application/json";
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
      console.error("You do not have permission to perform this action.");
    } else if (status === 404) {
      console.error("API endpoint not found:", error.config?.url);
    } else {
      console.error("API request failed:", error.message);
    }

    return Promise.reject(error);
  }
);

// =====================================
// EMPLOYEE APIs
// =====================================

export const getEmployees = async () => {
  const response = await cachedGet("/employees");
  return response.data;
};

export const getEmployee = async (id) => {
  const response = await cachedGet(`/employees/${id}`);
  return response.data;
};

export const createEmployee = async (employeeData) => {
  const response = await API.post("/employees", employeeData);
  clearApiCache();
  return response.data;
};

export const updateEmployee = async (id, employeeData) => {
  const response = await API.put(`/employees/${id}`, employeeData);
  clearApiCache();
  return response.data;
};

export const updateEmployeeStatus = async (
  id,
  status
) => {
  const response = await API.patch(
    `/employees/${id}/status`,
    { status }
  );

  return response.data;
};

export const deleteEmployee = async (id) => {
  const response = await API.delete(`/employees/${id}`);
  clearApiCache();
  return response.data;
};

// =====================================
// TASK APIs
// =====================================

export const getTasks = async (employeeId) => {
  const response = await cachedGet(
    `/employees/${employeeId}/tasks`
  );
  return response.data;
};

export const createTask = async (employeeId, taskData) => {
  const response = await API.post(
    `/employees/${employeeId}/tasks`,
    taskData
  );
  clearApiCache();
  return response.data;
};

export const updateTask = async (
  employeeId,
  taskId,
  taskData
) => {
  const response = await API.put(
    `/employees/${employeeId}/tasks/${taskId}`,
    taskData
  );
  clearApiCache();
  return response.data;
};

export const deleteTask = async (employeeId, taskId) => {
  const response = await API.delete(
    `/employees/${employeeId}/tasks/${taskId}`
  );
  clearApiCache();
  return response.data;
};

// =====================================
// ATTENDANCE APIs
// =====================================

export const getAttendance = async (employeeId) => {
  const response = await cachedGet(
    `/employees/${employeeId}/attendance`
  );
  return response.data;
};

export const createAttendance = async (
  employeeId,
  attendanceData
) => {
  const response = await API.post(
    `/employees/${employeeId}/attendance`,
    attendanceData
  );
  clearApiCache();
  return response.data;
};

// Alias for compatibility with existing components
export const markAttendance = createAttendance;

export const updateAttendance = async (
  employeeId,
  attendanceId,
  attendanceData
) => {
  const response = await API.put(
    `/employees/${employeeId}/attendance/${attendanceId}`,
    attendanceData
  );
  clearApiCache();
  return response.data;
};

export const deleteAttendance = async (
  employeeId,
  attendanceId
) => {
  const response = await API.delete(
    `/employees/${employeeId}/attendance/${attendanceId}`
  );
  clearApiCache();
  return response.data;
};

// =====================================
// LEAVE APIs
// =====================================

export const getLeaves = async (employeeId) => {
  const response = await cachedGet(
    `/employees/${employeeId}/leaves`
  );
  return response.data;
};

export const createLeave = async (employeeId, leaveData) => {
  const response = await API.post(
    `/employees/${employeeId}/leaves`,
    leaveData
  );
  clearApiCache();
  return response.data;
};

// Alias for compatibility with existing components
export const applyLeave = createLeave;

export const updateLeave = async (
  employeeId,
  leaveId,
  leaveData
) => {
  const response = await API.put(
    `/employees/${employeeId}/leaves/${leaveId}`,
    leaveData
  );
  clearApiCache();
  return response.data;
};

export const approveLeave = async (employeeId, leaveId) => {
  const response = await API.patch(
    `/employees/${employeeId}/leaves/${leaveId}/approve`
  );
  clearApiCache();
  return response.data;
};

export const rejectLeave = async (employeeId, leaveId) => {
  const response = await API.patch(
    `/employees/${employeeId}/leaves/${leaveId}/reject`
  );
  clearApiCache();
  return response.data;
};

export const deleteLeave = async (employeeId, leaveId) => {
  const response = await API.delete(
    `/employees/${employeeId}/leaves/${leaveId}`
  );
  clearApiCache();
  return response.data;
};

// =====================================
// PERFORMANCE REVIEW APIs
// =====================================

export const getPerformanceReviews = async (employeeId) => {
  const response = await cachedGet(
    `/employees/${employeeId}/performance`
  );
  return response.data;
};

export const createPerformanceReview = async (
  employeeId,
  reviewData
) => {
  const response = await API.post(
    `/employees/${employeeId}/performance`,
    reviewData
  );
  clearApiCache();
  return response.data;
};

export const updatePerformanceReview = async (
  employeeId,
  reviewId,
  reviewData
) => {
  const response = await API.put(
    `/employees/${employeeId}/performance/${reviewId}`,
    reviewData
  );
  clearApiCache();
  return response.data;
};

export const deletePerformanceReview = async (
  employeeId,
  reviewId
) => {
  const response = await API.delete(
    `/employees/${employeeId}/performance/${reviewId}`
  );
  clearApiCache();
  return response.data;
};

// =====================================
// DOCUMENT APIs
// =====================================

export const getDocuments = async (employeeId) => {
  const response = await cachedGet(
    `/employees/${employeeId}/documents`
  );
  return response.data;
};

export const createDocument = async (
  employeeId,
  documentData
) => {
  const response = await API.post(
    `/employees/${employeeId}/documents`,
    documentData
  );
  clearApiCache();
  return response.data;
};

// Alias for compatibility with existing components
export const uploadDocument = createDocument;

export const updateDocument = async (
  employeeId,
  documentId,
  documentData
) => {
  const response = await API.put(
    `/employees/${employeeId}/documents/${documentId}`,
    documentData
  );
  clearApiCache();
  return response.data;
};

export const deleteDocument = async (
  employeeId,
  documentId
) => {
  const response = await API.delete(
    `/employees/${employeeId}/documents/${documentId}`
  );
  clearApiCache();
  return response.data;
};

// =====================================
// DEFAULT EXPORT
// =====================================

export default API;
