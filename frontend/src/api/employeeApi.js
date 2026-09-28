import axios from "axios";

/* =========================================================
   API CONFIGURATION
========================================================= */

const API = axios.create({
baseURL: "https://employeehub-backend-y0r.onrender.com/api"});

/* =========================================================
   AUTHENTICATION + FORM DATA HANDLING
========================================================= */

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("employeehub_token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    // IMPORTANT:
    // Let Axios/browser automatically set the correct
    // multipart/form-data Content-Type and boundary.
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    } else {
      config.headers = config.headers || {};
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/* =========================================================
   RESPONSE ERROR HANDLING
========================================================= */

API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.error(
        "Authentication error:",
        error.response?.data?.message
      );
    }

    if (error.response?.status === 403) {
      console.error(
        "Permission denied:",
        error.response?.data?.message
      );
    }

    if (error.response?.status === 404) {
      console.error(
        "API route not found:",
        error.config?.url
      );
    }

    return Promise.reject(error);
  }
);

/* =========================================================
   EMPLOYEE API
========================================================= */

export const getEmployees = async () => {
  const response = await API.get("/employees");
  return response.data;
};

export const getEmployee = async (id) => {
  const response = await API.get(`/employees/${id}`);
  return response.data;
};

export const createEmployee = async (employee) => {
  const response = await API.post("/employees", employee);
  return response.data;
};

export const updateEmployee = async (id, employee) => {
  const response = await API.put(`/employees/${id}`, employee);
  return response.data;
};

export const deleteEmployee = async (id) => {
  const response = await API.delete(`/employees/${id}`);
  return response.data;
};

/* =========================================================
   TASK API
========================================================= */

export const getTasks = async (employeeId) => {
  const response = await API.get(
    `/employees/${employeeId}/tasks`
  );
  return response.data;
};

export const createTask = async (employeeId, task) => {
  const response = await API.post(
    `/employees/${employeeId}/tasks`,
    task
  );
  return response.data;
};

export const updateTask = async (
  employeeId,
  taskId,
  task
) => {
  const response = await API.put(
    `/employees/${employeeId}/tasks/${taskId}`,
    task
  );
  return response.data;
};

export const deleteTask = async (
  employeeId,
  taskId
) => {
  const response = await API.delete(
    `/employees/${employeeId}/tasks/${taskId}`
  );
  return response.data;
};

/* =========================================================
   ATTENDANCE API
========================================================= */

export const getAttendance = async (employeeId) => {
  const response = await API.get(
    `/employees/${employeeId}/attendance`
  );
  return response.data;
};

export const createAttendance = async (
  employeeId,
  attendance
) => {
  const response = await API.post(
    `/employees/${employeeId}/attendance`,
    attendance
  );
  return response.data;
};

export const updateAttendance = async (
  employeeId,
  attendanceId,
  attendance
) => {
  const response = await API.put(
    `/employees/${employeeId}/attendance/${attendanceId}`,
    attendance
  );
  return response.data;
};

export const deleteAttendance = async (
  employeeId,
  attendanceId
) => {
  const response = await API.delete(
    `/employees/${employeeId}/attendance/${attendanceId}`
  );
  return response.data;
};

/* =========================================================
   LEAVE API
========================================================= */

export const getLeaves = async (employeeId) => {
  const response = await API.get(
    `/employees/${employeeId}/leaves`
  );
  return response.data;
};

export const createLeave = async (
  employeeId,
  leaveData
) => {
  const response = await API.post(
    `/employees/${employeeId}/leaves`,
    leaveData
  );
  return response.data;
};

export const updateLeave = async (
  employeeId,
  leaveId,
  leaveData
) => {
  const response = await API.put(
    `/employees/${employeeId}/leaves/${leaveId}`,
    leaveData
  );
  return response.data;
};

export const deleteLeave = async (
  employeeId,
  leaveId
) => {
  const response = await API.delete(
    `/employees/${employeeId}/leaves/${leaveId}`
  );
  return response.data;
};

/* =========================================================
   PERFORMANCE API
========================================================= */

export const getPerformanceReviews = async (
  employeeId
) => {
  const response = await API.get(
    `/employees/${employeeId}/performance`
  );
  return response.data;
};

export const createPerformanceReview = async (
  employeeId,
  performanceData
) => {
  const response = await API.post(
    `/employees/${employeeId}/performance`,
    performanceData
  );
  return response.data;
};

export const updatePerformanceReview = async (
  employeeId,
  reviewId,
  performanceData
) => {
  const response = await API.put(
    `/employees/${employeeId}/performance/${reviewId}`,
    performanceData
  );
  return response.data;
};

export const deletePerformanceReview = async (
  employeeId,
  reviewId
) => {
  const response = await API.delete(
    `/employees/${employeeId}/performance/${reviewId}`
  );
  return response.data;
};

/* =========================================================
   DOCUMENTS API
========================================================= */

export const getDocuments = async (employeeId) => {
  const response = await API.get(
    `/employees/${employeeId}/documents`
  );
  return response.data;
};

/*
CREATE / UPLOAD DOCUMENT
*/

export const createDocument = async (
  employeeId,
  documentData
) => {
  const response = await API.post(
    `/employees/${employeeId}/documents`,
    documentData
  );

  return response.data;
};

/*
UPDATE DOCUMENT
*/

export const updateDocument = async (
  employeeId,
  documentId,
  documentData
) => {
  const response = await API.put(
    `/employees/${employeeId}/documents/${documentId}`,
    documentData
  );

  return response.data;
};

/*
DELETE DOCUMENT
*/

export const deleteDocument = async (
  employeeId,
  documentId
) => {
  const response = await API.delete(
    `/employees/${employeeId}/documents/${documentId}`
  );

  return response.data;
};

/* =========================================================
   EXPORT
========================================================= */

export default API;