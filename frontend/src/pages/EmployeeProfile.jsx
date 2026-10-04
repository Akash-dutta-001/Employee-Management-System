import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  FileText,
  Eye,
  Download,
  Upload,
  Award,
  ShieldCheck,
} from "lucide-react";
import {
  getEmployee,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getLeaves,
  createLeave,
  updateLeave,
  deleteLeave,
  getPerformanceReviews,
  createPerformanceReview,
  updatePerformanceReview,
  deletePerformanceReview,
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
} from "../api/employeeApi";
function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const storedUser = JSON.parse(localStorage.getItem("employeehub_user") || "null");
  const currentRole = storedUser?.role || "";
  const isEmployee = currentRole === "Employee";
  const canManageDocuments = currentRole === "Admin" || currentRole === "HR";
  const canManageAttendance = currentRole === "Admin" || currentRole === "HR";
  const canManageTasks = currentRole === "Admin" || currentRole === "HR";
  const canEditLeave = currentRole === "Admin";
  const canApproveLeave = currentRole === "Admin" || currentRole === "HR";
  const canManageReviews = currentRole === "Admin" || currentRole === "HR";
  const requestedTab = searchParams.get("tab");
  const [employee, setEmployee] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [performanceReviews, setPerformanceReviews] = useState([]);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [editingPerformance, setEditingPerformance] = useState(null);
  const [performanceForm, setPerformanceForm] = useState({
    reviewDate: "",
    rating: 5,
    feedback: "",
    strengths: "",
    improvements: "",
  });
  const [documents, setDocuments] = useState([]);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [documentForm, setDocumentForm] = useState({
    documentName: "",
    documentType: "Other",
    documentNumber: "",
    issueDate: "",
    expiryDate: "",
    documentFile: null,
  });
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);
  const [leaveForm, setLeaveForm] = useState({
    leaveType: "Casual Leave",
    startDate: "",
    endDate: "",
    reason: "",
    status: "Pending",
    rejectionReason: "",
  });
  const [activeTab, setActiveTab] = useState(
    ["Overview", "Attendance", "Tasks", "Leave", "Performance", "Documents"].includes(requestedTab)
      ? requestedTab
      : "Overview"
  );
  const [loading, setLoading] = useState(true);
  const [taskLoading, setTaskLoading] = useState(false);
  const [attendanceLoading, setAttendanceLoading] =
    useState(false);
  const [error, setError] = useState("");
  /* =========================================================
  TASK MODAL
  ========================================================= */
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    status: "Pending",
    priority: "Medium",
    dueDate: "",
    hours: 0,
  }); /* =========================================================
ATTENDANCE MODAL
========================================================= */
  const [showAttendanceModal, setShowAttendanceModal] =
    useState(false);
  const [editingAttendance, setEditingAttendance] =
    useState(null);
  const [attendanceForm, setAttendanceForm] = useState({
    date: "",
    status: "Present",
    hours: 8,
    checkIn: "",
    checkOut: "",
    note: "",
  });
  /* =========================================================
  LOAD EMPLOYEE
  ========================================================= */

  // Load employee profile
  useEffect(() => {
    loadEmployee();
  }, [id]);

  const loadEmployee = async () => {
    try {
      setLoading(true);
      setError("");

      const employeeData = await getEmployee(id);
      setEmployee(employeeData);

      // Load the other sections in the background.
      // Do not wait for them before showing the profile.
      Promise.all([
        loadTasks(),
        loadAttendance(),
        loadLeaves(),
        loadPerformanceReviews(),
        loadDocuments(),
      ]).catch((err) => {
        console.error("Failed to load profile sections:", err);
      });
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        "Failed to load employee"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshAll = async () => {
    await loadEmployee();
  };


  /* =========================================================
  LEAVE FUNCTIONS
  ========================================================= */
  const loadLeaves = async () => {
    try {
      setLeaveLoading(true);
      const data = await getLeaves(id);
      setLeaves(data || []);
    } catch (err) {
      console.error("Failed to load leaves", err);
    } finally {
      setLeaveLoading(false);
    }
  };
  const handleLeaveInput = (e) => {
    const { name, value } = e.target;
    setLeaveForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };
  const openAddLeaveModal = () => {
    setEditingLeave(null);
    setLeaveForm({
      leaveType: "Casual Leave",
      startDate: "",
      endDate: "",
      reason: "",
      status: "Pending",
      rejectionReason: "",
    });
    setShowLeaveModal(true);
  };
  const openEditLeaveModal = (leave) => {
    setEditingLeave(leave);
    setLeaveForm({
      leaveType: leave.leaveType || "Casual Leave", startDate: leave.startDate || "",
      endDate: leave.endDate || "",
      reason: leave.reason || "",
      status: leave.status || "Pending",
      rejectionReason: leave.rejectionReason || "",
    });
    setShowLeaveModal(true);
  };
  const closeLeaveModal = () => {
    if (leaveLoading) return;
    setShowLeaveModal(false);
    setEditingLeave(null);
  };
  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    if (editingLeave && !canEditLeave) {
      alert("You do not have permission to edit leave records.");
      return;
    }
    if (!leaveForm.leaveType || !leaveForm.startDate || !leaveForm.endDate) {
      alert("Please fill in leave type, start date and end date.");
      return;
    }
    if (new Date(leaveForm.endDate) < new Date(leaveForm.startDate)) {
      alert("End date cannot be before start date.");
      return;
    }
    try {
      setLeaveLoading(true);
      if (editingLeave) {
        const updatedLeave = await updateLeave(
          id,
          editingLeave._id,
          {
            leaveType: leaveForm.leaveType,
            startDate: leaveForm.startDate,
            endDate: leaveForm.endDate,
            reason: leaveForm.reason,
            status: leaveForm.status,
            rejectionReason: leaveForm.rejectionReason,
          }
        );
        setLeaves((previous) =>
          previous.map((leave) =>
            leave._id === editingLeave._id ? updatedLeave : leave
          )
        );
      } else {
        const newLeave = await createLeave(id, {
          leaveType: leaveForm.leaveType,
          startDate: leaveForm.startDate,
          endDate: leaveForm.endDate,
          reason: leaveForm.reason,
        });
        setLeaves((previous) => [newLeave, ...previous]);
      }
      setShowLeaveModal(false);
      setEditingLeave(null);
    } catch (err) {
      console.error("Failed to save leave:", err);
      alert(err.response?.data?.message || "Failed to save leave");
    } finally {
      setLeaveLoading(false);
    }
  };
  const handleDeleteLeave = async (leaveId) => {
    if (!canEditLeave) {
      alert("You do not have permission to delete leave records.");
      return;
    }
    const confirmed = window.confirm(
      "Are you sure you want to delete this leave record?"
    );
    if (!confirmed) return;
    try {
      setLeaveLoading(true);
      await deleteLeave(id, leaveId);
      setLeaves((previous) =>
        previous.filter((leave) => leave._id !== leaveId)
      );
    } catch (err) {
      console.error("Failed to delete leave:", err);
      alert(err.response?.data?.message || "Failed to delete leave");
    } finally {
      setLeaveLoading(false);
    }
  };
  /* =========================================================
  PERFORMANCE FUNCTIONS
  ========================================================= */
  const loadPerformanceReviews = async () => {
    try {
      setPerformanceLoading(true);
      const data = await getPerformanceReviews(id);
      setPerformanceReviews(data || []);
    } catch (err) {
      console.error("Failed to load performance reviews", err);
    } finally {
      setPerformanceLoading(false);
    }
  };
  const openAddPerformanceModal = () => {
    setEditingPerformance(null);
    setPerformanceForm({
      reviewDate: new Date().toISOString().split("T")[0],
      rating: 5,
      feedback: "",
      strengths: "",
      improvements: "",
    });
    setShowPerformanceModal(true);
  };
  const openEditPerformanceModal = (review) => {
    setEditingPerformance(review);
    setPerformanceForm({
      reviewDate: review.reviewDate || "",
      rating: review.rating || 5,
      feedback: review.feedback || "",
      strengths: review.strengths || "",
      improvements: review.improvements || "",
    });
    setShowPerformanceModal(true);
  };
  const closePerformanceModal = () => {
    if (performanceLoading) return;
    setShowPerformanceModal(false);
    setEditingPerformance(null);
  };
  const handlePerformanceInput = (e) => {
    const { name, value } = e.target;
    setPerformanceForm((previous) => ({
      ...previous,
      [name]: name === "rating" ? Number(value) : value,
    }));
  };
  const handlePerformanceSubmit = async (e) => {
    e.preventDefault();
    if (!canManageReviews) {
      alert("Employees can only view performance reviews.");
      return;
    }
    if (!performanceForm.reviewDate) {
      alert("Review date is required.");
      return;
    }
    if (performanceForm.rating < 1 || performanceForm.rating > 5) {
      alert("Rating must be between 1 and 5.");
      return;
    }
    try {
      setPerformanceLoading(true);
      if (editingPerformance) {
        const updatedReview = await updatePerformanceReview(
          id,
          editingPerformance._id,
          performanceForm
        );
        setPerformanceReviews((previous) =>
          previous.map((review) =>
            review._id === editingPerformance._id ? updatedReview : review
          )
        );
      } else {
        const newReview = await createPerformanceReview(id, performanceForm);
        setPerformanceReviews((previous) => [newReview, ...previous]);
      }
      setShowPerformanceModal(false);
      setEditingPerformance(null);
    } catch (err) {
      console.error("Failed to save performance review:", err);
      alert(err.response?.data?.message || "Failed to save performance review");
    } finally {
      setPerformanceLoading(false);
    }
  };
  const handleDeletePerformance = async (reviewId) => {
    if (!canManageReviews) {
      alert("Employees can only view performance reviews.");
      return;
    }
    const confirmed = window.confirm(
      "Are you sure you want to delete this performance review?"
    );
    if (!confirmed) return;
    try {
      setPerformanceLoading(true);
      await deletePerformanceReview(id, reviewId);
      setPerformanceReviews((previous) =>
        previous.filter((review) => review._id !== reviewId)
      );
    } catch (err) {
      console.error("Failed to delete performance review:", err);
      alert(err.response?.data?.message || "Failed to delete performance review");
    } finally {
      setPerformanceLoading(false);
    }
  };
  const performanceStats = useMemo(() => {
    const total = performanceReviews.length;
    const averageRating =
      total === 0
        ? 0
        : (
          performanceReviews.reduce(
            (sum, review) => sum + Number(review.rating || 0),
            0
          ) / total
        ).toFixed(1);
    return { total, averageRating };
  }, [performanceReviews]);

/* =========================================================
   DOCUMENT FUNCTIONS
========================================================= */

const loadDocuments = async () => {
  try {
    setDocumentLoading(true);

    const data = await getDocuments(id);

    setDocuments(data || []);
  } catch (err) {
    console.error("Failed to load documents:", err);
  } finally {
    setDocumentLoading(false);
  }
};

const handleDocumentInput = (e) => {
  const { name, value, files } = e.target;

  setDocumentForm((previous) => ({
    ...previous,
    [name]:
      name === "documentFile"
        ? files?.[0] || null
        : value,
  }));
};

const openAddDocumentModal = () => {
  setEditingDocument(null);

  setDocumentForm({
    documentName: "",
    documentType: "Other",
    documentNumber: "",
    issueDate: "",
    expiryDate: "",
    documentFile: null,
  });

  setShowDocumentModal(true);
};

const openEditDocumentModal = (document) => {
  setEditingDocument(document);

  setDocumentForm({
    documentName: document.documentName || "",
    documentType: document.documentType || "Other",
    documentNumber: document.documentNumber || "",
    issueDate: document.issueDate || "",
    expiryDate: document.expiryDate || "",
    documentFile: null,
  });

  setShowDocumentModal(true);
};

const closeDocumentModal = () => {
  setShowDocumentModal(false);
  setEditingDocument(null);

  setDocumentForm({
    documentName: "",
    documentType: "Other",
    documentNumber: "",
    issueDate: "",
    expiryDate: "",
    documentFile: null,
  });
};

const handleDocumentSubmit = async (e) => {
  e.preventDefault();

  if (!documentForm.documentName.trim()) {
    alert("Document name is required.");
    return;
  }

  if (!editingDocument && !documentForm.documentFile) {
    alert("Please select a document file.");
    return;
  }

  if (documentForm.documentFile && documentForm.documentFile.size > 10 * 1024 * 1024) {
    alert("Document file must be 10 MB or smaller.");
    return;
  }

  if (
    documentForm.issueDate &&
    documentForm.expiryDate &&
    new Date(documentForm.expiryDate) <
      new Date(documentForm.issueDate)
  ) {
    alert("Expiry date cannot be before issue date.");
    return;
  }

  try {
    setDocumentLoading(true);

    const formData = new FormData();

    formData.append(
      "documentName",
      documentForm.documentName
    );

    formData.append(
      "documentType",
      documentForm.documentType
    );

    formData.append(
      "documentNumber",
      documentForm.documentNumber
    );

    formData.append(
      "issueDate",
      documentForm.issueDate
    );

    formData.append(
      "expiryDate",
      documentForm.expiryDate
    );

    if (documentForm.documentFile) {
      formData.append(
        "documentFile",
        documentForm.documentFile
      );
    }

    if (editingDocument) {
      const updatedDocument =
        await updateDocument(
          id,
          editingDocument._id,
          formData
        );

      setDocuments((previous) =>
        previous.map((document) =>
          document._id === editingDocument._id
            ? updatedDocument
            : document
        )
      );
    } else {
      const newDocument =
        await createDocument(id, formData);

      setDocuments((previous) => [
        newDocument,
        ...previous,
      ]);
    }

    closeDocumentModal();
  } catch (err) {
    console.error(
      "Failed to save document:",
      err
    );

    alert(
      err.response?.data?.message ||
        "Failed to save document"
    );
  } finally {
    setDocumentLoading(false);
  }
};

const handleDeleteDocument = async (documentId) => {
  if (!canManageDocuments) {
    alert("You do not have permission to delete documents.");
    return;
  }
  const confirmed = window.confirm(
    "Are you sure you want to delete this document?"
  );

  if (!confirmed) return;

  try {
    setDocumentLoading(true);

    await deleteDocument(id, documentId);

    setDocuments((previous) =>
      previous.filter(
        (document) => document._id !== documentId
      )
    );
  } catch (err) {
    console.error(
      "Failed to delete document:",
      err
    );

    alert(
      err.response?.data?.message ||
        "Failed to delete document"
    );
  } finally {
    setDocumentLoading(false);
  }
};

const getDocumentUrl = (fileUrl) => {
  if (!fileUrl) return "";

return `https://employeehub-backend-y0or.onrender.com${fileUrl}`;
};

/* =========================================================
TASK FUNCTIONS
========================================================= */ const loadTasks = async () => {
    try {
      const data = await getTasks(id);
      setTasks(data || []);
    } catch (err) {
      console.error("Failed to load tasks", err);
    }
  };
  const handleTaskInput = (e) => {
    const { name, value } = e.target;
    setTaskForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };
  const openTaskModal = () => {
    setTaskForm({
      title: "",
      description: "",
      status: "Pending",
      priority: "Medium",
      dueDate: "",
      hours: 0,
    });
    setShowTaskModal(true);
  };
  const closeTaskModal = () => {
    if (taskLoading) return;
    setShowTaskModal(false);
  };
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!canManageTasks) { alert("You do not have permission to create tasks."); return; }
    if (!taskForm.title.trim()) {
      alert("Task title is required.");
      return;
    }
    try {
      setTaskLoading(true);
      const newTask = await createTask(id, taskForm);
      setTasks((previous) => [
        ...previous,
        newTask,
      ]);
      setShowTaskModal(false);
      setTaskForm({
        title: "",
        description: "",
        status: "Pending",
        priority: "Medium",
        dueDate: "",
        hours: 0,
      });
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.message ||
        "Failed to create task"
      );
    } finally {
      setTaskLoading(false);
    }
  };
  const changeTaskStatus = async (
    taskId,
    newStatus
  ) => {
    if (!canManageTasks) { alert("You do not have permission to change task status."); return; }
    try {
      const updatedTask = await updateTask(
        id,
        taskId,
        {
          status: newStatus,
        }
      );
      setTasks((previous) =>
        previous.map((task) =>
          task._id === taskId
            ? updatedTask
            : task
        ));
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.message ||
        "Failed to update task"
      );
    }
  };
  const handleDeleteTask = async (taskId) => {
    if (!canManageTasks) { alert("You do not have permission to delete tasks."); return; }
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );
    if (!confirmed) return;
    try {
      await deleteTask(id, taskId);
      setTasks((previous) =>
        previous.filter(
          (task) => task._id !== taskId
        )
      );
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.message ||
        "Failed to delete task"
      );
    }
  };
  /* =========================================================
  ATTENDANCE FUNCTIONS
  ========================================================= */
  const loadAttendance = async () => {
    try {
      setAttendanceLoading(true);
      const data = await getAttendance(id);
      setAttendance(data || []);
    } catch (err) {
      console.error(
        "Failed to load attendance",
        err
      );
    } finally {
      setAttendanceLoading(false);
    }
  };
  const openAddAttendanceModal = () => {
    setEditingAttendance(null);
    setAttendanceForm({
      date: new Date()
        .toISOString()
        .split("T")[0],
      status: "Present",
      hours: 8,
      checkIn: "",
      checkOut: "",
      note: "",
    });
    setShowAttendanceModal(true);
  };
  const openEditAttendanceModal = (record) => {
    setEditingAttendance(record);
    setAttendanceForm({
      date: record.date || "",
      status: record.status || "Present",
      hours: record.hours || 0,
      checkIn: record.checkIn || "",
      checkOut: record.checkOut || "",
      note: record.note || "",
    });
    setShowAttendanceModal(true);
  };
  const closeAttendanceModal = () => {
    setShowAttendanceModal(false);
    setEditingAttendance(null);
  };
  const handleAttendanceInput = (e) => {
    const { name, value } = e.target; setAttendanceForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };
  const handleAttendanceSubmit = async (e) => {
    e.preventDefault();
    if (!canManageAttendance) { alert("Employees can only view attendance records."); return; }
    if (!attendanceForm.date) {
      alert("Attendance date is required.");
      return;
    }
    try {
      setAttendanceLoading(true);
      if (editingAttendance) {
        const updatedRecord =
          await updateAttendance(
            id,
            editingAttendance._id,
            attendanceForm
          );
        setAttendance((previous) =>
          previous.map((record) =>
            record._id === editingAttendance._id
              ? updatedRecord
              : record
          )
        );
      } else {
        const newRecord =
          await createAttendance(
            id,
            attendanceForm
          );
        setAttendance((previous) => [
          ...previous,
          newRecord,
        ]);
      }
      closeAttendanceModal();
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.message ||
        "Failed to save attendance"
      );
    } finally {
      setAttendanceLoading(false);
    }
  };
  const handleDeleteAttendance = async (
    attendanceId
  ) => {
    if (!canManageAttendance) { alert("Employees can only view attendance records."); return; }
    const confirmed = window.confirm(
      "Are you sure you want to delete this attendance record?"
    );
    if (!confirmed) return;
    try {
      await deleteAttendance(
        id,
        attendanceId
      );
      setAttendance((previous) =>
        previous.filter(
          (record) =>
            record._id !== attendanceId
        )
      );
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.message ||
        "Failed to delete attendance"
      );
    }
  };
  /* =========================================================
  ATTENDANCE CALCULATIONS
  ========================================================= */
  const attendanceStats = useMemo(() => {
    const total = attendance.length;
    const present = attendance.filter((record) => record.status === "Present"
    ).length;
    const late = attendance.filter(
      (record) => record.status === "Late"
    ).length;
    const absent = attendance.filter(
      (record) => record.status === "Absent"
    ).length;
    const attended = present + late;
    const percentage =
      total === 0
        ? 0
        : Math.round((attended / total) * 100);
    const totalHours = attendance.reduce(
      (sum, record) =>
        sum + Number(record.hours || 0),
      0
    );
    return {
      total,
      present,
      late,
      absent,
      percentage,
      totalHours,
    };
  }, [attendance]);
  /* =========================================================
  TASK CALCULATIONS
  ========================================================= */
  const taskStats = useMemo(() => {
    return {
      total: tasks.length,
      completed: tasks.filter(
        (task) => task.status === "Completed"
      ).length,
      inProgress: tasks.filter(
        (task) => task.status === "In Progress"
      ).length,
      pending: tasks.filter(
        (task) => task.status === "Pending"
      ).length,
      review: tasks.filter(
        (task) => task.status === "Review"
      ).length,
    };
  }, [tasks]);
  /* =========================================================
  LOADING
========================================================= */
  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600" />
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Loading employee...
          </p>
        </div>
      </div>
    );
  }
  /* =========================================================
  ERROR
  ========================================================= */
  if (!employee) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-sm dark:bg-slate-800">
        <XCircle
          size={45}
          className="mx-auto text-red-500"
        />
        <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
          Employee not found
        </h2>
        <button
          onClick={() => navigate("/employees")} className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Back to Employees
        </button>
      </div>
    );
  }
  /* =========================================================
  TABS
  ========================================================= */
  const tabs = [
    "Overview",
    "Attendance",
    "Tasks",
    "Leave",
    "Performance",
    "Documents",
  ];
  return (
    <div className="min-w-0 text-slate-900 dark:text-white">
      {/* =====================================================
BACK BUTTON
===================================================== */}
      <button
        onClick={() => navigate("/employees")}
        className="mb-5 flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
      >
        <ArrowLeft size={18} />
        Back to Employees
      </button>
      {/* =====================================================
PROFILE HEADER
===================================================== */}
      <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800 sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white">
              {employee.avatar ||
                employee.name
                  ?.split(" ")
                  .map((name) => name[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
            </div>
            <div>
<h1 className="break-words text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
                {employee.name}
              </h1>
              <p className="mt-1 text-slate-500 dark:text-slate-400">
                {employee.role}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Briefcase size={15} />
                  {employee.department}
                </span>
                <span>•</span>
                <span
                  className={
                    employee.status === "Active"
                      ? "font-medium text-green-600"
                      : "font-medium text-red-600"
                  }
                >
                  {employee.status}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MiniStat
              label="Tasks"
              value={taskStats.total}
            />
            <MiniStat
              label="Completed"
              value={taskStats.completed}
            />
            <MiniStat label="Attendance"
              value={`${attendanceStats.percentage}%`}
            />
          </div>
        </div>
      </div>
      {/* =====================================================
TABS
===================================================== */}
      <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm dark:bg-slate-800">
        <div className="flex min-w-max border-b border-slate-200 dark:border-slate-700">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={
                activeTab === tab
                  ? "border-b-2 border-blue-600 px-6 py-4 text-sm font-semibold text-blue-600"
                  : "border-b-2 border-transparent px-6 py-4 text-sm font-medium text-slate-500 hover:text-blue-600 dark:text-slate-400"
              }
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      {/* =====================================================
TAB CONTENT
===================================================== */}
      <div className="mt-6">
        {/* ===================================================
OVERVIEW
=================================================== */}
        {activeTab === "Overview" && (
          <>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-800 lg:col-span-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Personal Information
                </h2>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <InfoItem icon={<User size={18} />} label="Full Name" value={employee.name} />
                  <InfoItem icon={<Mail size={18} />} label="Email" value={employee.email} />
                  <InfoItem icon={<Phone size={18} />} label="Phone" value={employee.phone || "Not available"} />
                  <InfoItem icon={<MapPin size={18} />} label="Location" value={employee.location || "Not available"} />
                  <InfoItem icon={<Briefcase size={18} />} label="Department" value={employee.department} />
                  <InfoItem icon={<Calendar size={18} />} label="Joining Date" value={employee.joiningDate || "Not available"} />
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800 sm:p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Work Summary
                </h2>
                <div className="mt-5 space-y-4">
                  <SummaryRow label="Total Tasks" value={taskStats.total} />
                  <SummaryRow label="Completed Tasks" value={taskStats.completed} />
                  <SummaryRow label="In Progress" value={taskStats.inProgress} />
                  <SummaryRow label="Pending" value={taskStats.pending} />
                  <SummaryRow label="Attendance" value={`${attendanceStats.percentage}%`} />
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-800">
              <div className="flex items-center gap-3">
                <ShieldCheck size={21} className="text-blue-600 dark:text-blue-400" />
                <div>
                  <h2 className="text-lg font-bold">Profile Snapshot</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Quick view of this employee's records.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SnapshotCard label="Leave Requests" value={leaves.length} />
                <SnapshotCard label="Performance Reviews" value={performanceStats.total} />
                <SnapshotCard label="Documents" value={documents.length} />
                <SnapshotCard label="Attendance Records" value={attendanceStats.total} />
              </div>
            </div>
          </>
        )}
        {/* ===================================================
ATTENDANCE
=================================================== */}
        {activeTab === "Attendance" && (
          <div className="space-y-6">
            {/* Attendance Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
<h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Attendance
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Manage attendance records for{" "}
                  {employee.name}
                </p>
              </div>
              {canManageAttendance && (
                <button
                  onClick={openAddAttendanceModal}
                  className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Plus size={18} />
                  Mark Attendance
                </button>
              )}
            </div>
            {/* Attendance Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <AttendanceStat
                icon={<Calendar size={20} />}
                label="Total Days"
                value={attendanceStats.total}
              />
              <AttendanceStat
                icon={<CheckCircle2 size={20} />}
                label="Present"
                value={attendanceStats.present}
              />
              <AttendanceStat
                icon={<AlertCircle size={20} />}
                label="Late"
                value={attendanceStats.late}
              />
              <AttendanceStat
                icon={<XCircle size={20} />} label="Absent"
                value={attendanceStats.absent}
              />
              <AttendanceStat
                icon={<Clock size={20} />}
                label="Total Hours"
                value={attendanceStats.totalHours}
              />
            </div>
            {/* Attendance Percentage */}
            <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Attendance Percentage
                  </p>
                  <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
                    {attendanceStats.percentage}%
                  </p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <CheckCircle2 size={28} />
                </div>
              </div>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{
                    width: `${attendanceStats.percentage}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Present and Late days are counted as attended days.
              </p>
            </div>
            {/* Attendance Table */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-800">
              {attendanceLoading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600" />
                </div>
              ) : attendance.length === 0 ? (
                <div className="p-12 text-center">
                  <Calendar
                    size={42}
                    className="mx-auto text-slate-300"
                  />
                  <h3 className="mt-4 font-semibold text-slate-700 dark:text-slate-300">
                    No attendance records
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Click "Mark Attendance" to add the first record.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto overscroll-x-contain">
                  <table className="w-full min-w-[950px] text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Date
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Status
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Check In
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500"> Check Out
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Hours
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Note
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...attendance]
                        .sort(
                          (a, b) =>
                            new Date(b.date) -
                            new Date(a.date)
                        )
                        .map((record) => (
                          <tr
                            key={record._id}
                            className="border-b border-slate-100 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/30"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Calendar
                                  size={16}
                                  className="text-slate-400"
                                />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                  {formatDate(record.date)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <AttendanceBadge
                                status={record.status}
                              />
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                              {record.checkIn || "-"}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
{record.checkOut || "-"}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                              {record.hours || 0} hrs
                            </td>
                            <td className="max-w-[200px] truncate px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                              {record.note || "-"}
                            </td>
                            <td className="px-6 py-4">
                              {canManageAttendance && (
                                <div className="flex justify-end gap-2">
                                <button
                                  onClick={() =>
                                    openEditAttendanceModal(
                                      record
                                    )
                                  }
                                  className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                                  title="Edit attendance"
                                >
                                  <Pencil size={17} />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteAttendance(
                                      record._id
                                    )
                                  }
                                  className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                                  title="Delete attendance"
                                >
                                  <Trash2 size={17} />
                                </button>
                                </div>
                              )}
                            </td> </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        {/* ===================================================
TASKS
=================================================== */}
        {activeTab === "Tasks" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Tasks
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Tasks assigned to {employee.name}
                </p>
              </div>
              {canManageTasks && (
                <button
                  onClick={openTaskModal}
                  className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Plus size={18} />
                  Create Task
                </button>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <TaskStat
                label="Pending"
                value={taskStats.pending}
              />
              <TaskStat
                label="In Progress"
                value={taskStats.inProgress}
              />
              <TaskStat
                label="Review"
                value={taskStats.review}
              />
              <TaskStat
                label="Completed"
                value={taskStats.completed}
              />
            </div>
            <div className="grid gap-5 xl:grid-cols-4">
              {[
                "Pending",
                "In Progress",
                "Review",
                "Completed",
              ].map((status) => {
                const statusTasks = tasks.filter(
                  (task) => task.status === status
                );
                return (
                  <div
                    key={status}
                    className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {status}
                      </h3>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        {statusTasks.length}
                      </span>
                    </div> <div className="space-y-3">
                      {statusTasks.length === 0 ? (
                        <p className="py-8 text-center text-sm text-slate-400">
                          No tasks
                        </p>
                      ) : (
                        statusTasks.map((task) => (
                          <div
                            key={task._id}
                            className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                                {task.title}
                              </h4>
                              {canManageTasks && (
                                <button
                                  onClick={() => handleDeleteTask(task._id)}
                                  className="text-slate-400 hover:text-red-500"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                            {task.description && (
                              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                {task.description}
                              </p>
                            )}
                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                {task.priority}
                              </span>
                              {task.dueDate && (
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                  Due: {formatDate(task.dueDate)}
                                </span>
                              )}
                            </div>
                            {canManageTasks && <select
                              value={task.status}
                              onChange={(e) =>
                                changeTaskStatus(
                                  task._id,
                                  e.target.value
                                )
                              }
                              className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs dark:border-slate-600 dark:bg-slate-700dark:text-white"
                            >
                              <option>
                                Pending
                              </option>
                              <option>
                                In Progress
                              </option>
                              <option>
                                Review
                              </option>
                              <option>
                                Completed
                              </option>
                            </select>}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* ===================================================
LEAVE
=================================================== */}
        {activeTab === "Leave" && (<div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Leave Management
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Manage leave requests for {employee.name}
              </p>
            </div>
            <button
              onClick={openAddLeaveModal}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus size={18} />
              Apply Leave
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Total Leaves", leaves.length, "text-slate-900 dark:text-white"],
              ["Pending", leaves.filter((leave) => leave.status === "Pending").length, "text-yellow-600"],
              ["Approved", leaves.filter((leave) => leave.status === "Approved").length, "text-green-600"],
              ["Rejected", leaves.filter((leave) => leave.status === "Rejected").length, "text-red-600"],
            ].map(([label, value, valueClass]) => (
              <div key={label} className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800 sm:p-5">
                <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
                <p className={`mt-1 text-2xl font-bold ${valueClass}`}>{value}</p>
              </div>
            ))}
          </div>
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-800">
            {leaveLoading && leaves.length === 0 ? (
              <div className="flex items-center justify-center p-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600" />
              </div>
            ) : leaves.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar size={42} className="mx-auto text-slate-300" />
<h3 className="mt-4 font-semibold text-slate-700 dark:text-slate-300">
                  No leave records
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Click "Apply Leave" to add the first leave request.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {[...leaves]
                  .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
                  .map((leave) => (
                    <div key={leave._id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                              {leave.leaveType}
                            </h3>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${leave.status === "Approved"
                              ? "bg-green-100 text-green-700"
                              : leave.status === "Rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                              }`}>
                              {leave.status}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
                            <span><strong>From:</strong> {formatDate(leave.startDate)}</span>
                            <span><strong>To:</strong> {formatDate(leave.endDate)}</span>
                            {leave.appliedAt && (
                              <span><strong>Applied:</strong> {formatDate(leave.appliedAt)}</span>
                            )}
                          </div>
                          {leave.reason && (
                            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                              <strong>Reason:</strong> {leave.reason}
                            </p>
                          )}
                          {leave.status === "Rejected" && leave.rejectionReason && (
                            <p className="mt-2 text-sm text-red-600">
                              <strong>Rejection Reason:</strong> {leave.rejectionReason}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {canEditLeave && <button
                            onClick={() => openEditLeaveModal(leave)} className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                            title="Edit leave"
                          >
                            <Pencil size={17} />
                          </button>}
                          {canEditLeave && <button
                            onClick={() => handleDeleteLeave(leave._id)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                            title="Delete leave"
                          >
                            <Trash2 size={17} />
                          </button>}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
        )}
        {/* ===================================================
PERFORMANCE
=================================================== */}
        {activeTab === "Performance" && (
          <div className="space-y-6">
<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Performance Management
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Manage performance reviews for {employee.name}
                </p>
              </div>
              {canManageReviews && (
                <button
                  onClick={openAddPerformanceModal}
                  className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Plus size={18} />
                  Add Performance Review
                </button>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800 sm:p-5">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total Reviews</p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {performanceStats.total}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800 sm:p-5">
                <p className="text-sm text-slate-500 dark:text-slate-400">Average Rating</p>
                <p className="mt-1 text-2xl font-bold text-yellow-600">
                  {performanceStats.averageRating}/5
                </p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800 sm:col-span-2">
                <p className="text-sm text-slate-500 dark:text-slate-400">Task Completion</p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {taskStats.total === 0 ? 0 : Math.round((taskStats.completed / taskStats.total) * 100)}%
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-white shadow-sm dark:bg-slate-800">
              <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <Award size={24} className="text-yellow-500" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Performance Reviews</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Review history and manager feedback
                    </p>
                  </div>
                </div>
              </div>
              {performanceLoading && performanceReviews.length === 0 ? (
                <div className="flex items-center justify-center p-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600" />
                </div>
              ) : performanceReviews.length === 0 ? (
                <div className="p-12 text-center">
                  <Award size={42} className="mx-auto text-slate-300" />
                  <h3 className="mt-4 font-semibold text-slate-700 dark:text-slate-300">No performance reviews</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {canManageReviews
                      ? 'Click "Add Performance Review" to add the first review.'
                      : "Performance reviews are view-only for employees."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {[...performanceReviews]
                    .sort((a, b) => new Date(b.reviewDate) - new Date(a.reviewDate))
                    .map((review) => (
                      <div key={review._id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                              <h4 className="font-semibold text-slate-900 dark:text-white">
                                Review — {formatDate(review.reviewDate)}
                              </h4>
                              <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700">
{review.rating}/5
                              </span>
                            </div>
                            {review.feedback && (
                              <div className="mt-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Manager Feedback</p>
                                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{review.feedback}</p>
                              </div>
                            )}
                            <div className="mt-4 grid gap-4 md:grid-cols-2">
                              {review.strengths && (
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-green-600">Strengths</p>
                                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{review.strengths}</p>
                                </div>
                              )}
                              {review.improvements && (
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Areas for Improvement</p>
                                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{review.improvements}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          {canManageReviews && (
                            <div className="flex shrink-0 items-center gap-2">
                              <button
                                onClick={() => openEditPerformanceModal(review)}
                                className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                                title="Edit performance review"
                              >
                                <Pencil size={17} />
                              </button>
                              <button
                                onClick={() => handleDeletePerformance(review._id)}
                                className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                                title="Delete performance review"
                              >
                                <Trash2 size={17} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
        {/* ===================================================
DOCUMENTS
=================================================== */}
        {activeTab === "Documents" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Employee Documents
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Manage documents for {employee.name}
                </p>
              </div>
              <button
                onClick={openAddDocumentModal}
                className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Upload size={18} />
                {isEmployee ? "Upload My Document" : "Upload Document"}
              </button>
            </div>
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-800">
              {documentLoading && documents.length === 0 ? (
                <div className="flex items-center justify-center p-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600" />
</div>
              ) : documents.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <FileText size={32} />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-white">
                    No documents uploaded
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Upload the employee's resume, ID proof,
                    certificates or other documents.
                  </p>
                  <button
                    onClick={openAddDocumentModal}
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    <Upload size={17} />
                    {isEmployee ? "Upload My First Document" : "Upload First Document"}
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto overscroll-x-contain">
                  <table className="w-full min-w-[1000px] text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Document</th>
                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Document Number</th>
                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Issue Date</th>
                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Expiry Date</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((document) => (
                        <tr
                          key={document._id}
                          className="border-b border-slate-100 last:border-0 dark:border-slate-700"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                <FileText size={20} />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-slate-900 dark:text-white">
                                  {document.documentName}
                                </p>
                                <p className="max-w-[250px] truncate text-xs text-slate-500 dark:text-slate-400">
                                  {document.fileName || "No file"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                            {document.documentType || "Other"}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                            {document.documentNumber || "—"}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                            {document.issueDate || "—"}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                            {document.expiryDate || "—"}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              {document.fileUrl && (
                                <a
                                  href={getDocumentUrl(document.fileUrl)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                                  title="View document"
                                >
                                  <Eye size={17} />
                                </a>
                              )}
                              {document.fileUrl && (
                                <a
                                  href={getDocumentUrl(document.fileUrl)}
                                  download={document.fileName}
                                  className="rounded-lg p-2 text-slate-500 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400"
                                  title="Download document"
                                >
                                  <Download size={17} />
                                </a>
                              )}
                              {canManageDocuments && (
                                <>
                                  <button
                                    onClick={() => openEditDocumentModal(document)}
                                    className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                                    title="Edit document"
                                  >
                                    <Pencil size={17} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDocument(document._id)}
                                    className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                                    title="Delete document"
                                  >
                                    <Trash2 size={17} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {/* =====================================================
PERFORMANCE REVIEW MODAL
===================================================== */}
      {showDocumentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-slate-800 sm:max-h-[90dvh]">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-700 sm:px-6 sm:py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingDocument ? "Edit Document" : "Upload Document"}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {employee.name}
                </p>
              </div>
              <button
                onClick={closeDocumentModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleDocumentSubmit} className="space-y-5 p-4 sm:p-6">
              <FormInput
                label="Document Name"
                name="documentName"
                value={documentForm.documentName}
                onChange={handleDocumentInput}
                placeholder="e.g. Aadhaar Card"
                required
              />
              <div>
<label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Document Type
                </label>
                <select
                  name="documentType"
                  value={documentForm.documentType}
                  onChange={handleDocumentInput}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                >
                  <option value="Resume">Resume</option>
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="PAN Card">PAN Card</option>
                  <option value="Passport">Passport</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Offer Letter">Offer Letter</option>
                  <option value="Experience Certificate">Experience Certificate</option>
                  <option value="Education Certificate">Education Certificate</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <FormInput
                label="Document Number"
                name="documentNumber"
                value={documentForm.documentNumber}
                onChange={handleDocumentInput}
                placeholder="e.g. XXXX XXXX XXXX"
              />
              <div className="grid gap-5 md:grid-cols-2">
                <FormInput
                  label="Issue Date"
                  name="issueDate"
                  type="date"
                  value={documentForm.issueDate}
                  onChange={handleDocumentInput}
                />
                <FormInput
                  label="Expiry Date"
                  name="expiryDate"
                  type="date"
                  value={documentForm.expiryDate}
                  onChange={handleDocumentInput}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  {editingDocument ? "Replace File (Optional)" : "Document File"}
                  {!editingDocument && (
                    <span className="ml-1 text-red-500">*</span>
                  )}
                </label>
                <input
                  type="file"
                  name="documentFile"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleDocumentInput}
                  required={!editingDocument}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:file:bg-blue-900/30 dark:file:text-blue-400"
                />
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Allowed: PDF, JPG, PNG, DOC and DOCX. Maximum size: 10 MB.
                </p>
                {editingDocument && editingDocument.fileName && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Current file:{" "}
                    <span className="font-medium">
                      {editingDocument.fileName}
                    </span>
                  </p>
                )}
              </div>
<div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-700 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeDocumentModal}
                  disabled={documentLoading}
                  className="w-full rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={documentLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {documentLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      {editingDocument ? "Update Document" : "Upload Document"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showPerformanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-slate-800 sm:max-h-[90dvh]">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-700 sm:px-6 sm:py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingPerformance ? "Edit Performance Review" : "Add Performance Review"}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{employee.name}</p>
              </div>
              <button
                onClick={closePerformanceModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePerformanceSubmit} className="space-y-5 p-4 sm:p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <FormInput
                  label="Review Date"
                  name="reviewDate"
                  type="date"
                  value={performanceForm.reviewDate}
                  onChange={handlePerformanceInput}
                  required
                />
                <FormInput
                  label="Rating (1-5)"
                  name="rating"
                  type="number"
                  value={performanceForm.rating}
                  onChange={handlePerformanceInput}
                  min="1"
                  max="5"
                  step="1"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Manager Feedback</label>
                <textarea
                  name="feedback"
                  value={performanceForm.feedback}
                  onChange={handlePerformanceInput}
                  rows="4"
                  placeholder="Enter manager feedback..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Strengths</label>
                <textarea
                  name="strengths"
                  value={performanceForm.strengths}
                  onChange={handlePerformanceInput}
                  rows="3"
                  placeholder="Key strengths..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Areas for Improvement</label>
                <textarea
                  name="improvements"
                  value={performanceForm.improvements}
                  onChange={handlePerformanceInput}
                  rows="3"
                  placeholder="Areas that need improvement..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-700 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closePerformanceModal}
                  disabled={performanceLoading}
                  className="w-full rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={performanceLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {performanceLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      {editingPerformance ? "Update Review" : "Save Review"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* =====================================================
CREATE TASK MODAL
===================================================== */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-slate-800 sm:max-h-[90dvh]">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-700 sm:px-6 sm:py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Create Task
</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Assign a new task to {employee.name}
                </p>
              </div>
              <button
                onClick={closeTaskModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={handleCreateTask}
              className="space-y-5 p-4 sm:p-6"
            >
              <FormInput
                label="Task Title"
                name="title"
                value={taskForm.title}
                onChange={handleTaskInput}
                placeholder="Build employee dashboard"
                required
              />
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Description
                </label>
                <textarea
                  name="description"
                  value={taskForm.description}
                  onChange={handleTaskInput}
                  rows="4"
                  placeholder="Describe the task..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <SelectInput
                  label="Status"
                  name="status"
                  value={taskForm.status}
                  onChange={handleTaskInput}
                  options={[
                    "Pending",
                    "In Progress",
                    "Review",
                    "Completed",
                  ]}
                />
                <SelectInput
                  label="Priority"
                  name="priority"
                  value={taskForm.priority}
                  onChange={handleTaskInput}
                  options={[
                    "Low",
                    "Medium",
                    "High",
                  ]}
                />
                <FormInput label="Due Date"
                  name="dueDate"
                  type="date"
                  value={taskForm.dueDate}
                  onChange={handleTaskInput}
                />
                <FormInput
                  label="Hours"
                  name="hours"
                  type="number"
                  value={taskForm.hours}
                  onChange={handleTaskInput}
                  min="0"
                />
              </div>
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-700 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeTaskModal}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={taskLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 sm:w-auto"
                >
                  {taskLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      Create Task
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* =====================================================
ATTENDANCE MODAL
===================================================== */}
      {showAttendanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-slate-800 sm:max-h-[90dvh]">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-700 sm:px-6 sm:py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingAttendance
                    ? "Edit Attendance"
                    : "Mark Attendance"}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {employee.name}
                </p>
              </div>
              <button
                onClick={closeAttendanceModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={handleAttendanceSubmit}
              className="space-y-5 p-4 sm:p-6"
            >
              <FormInput label="Date"
                name="date"
                type="date"
                value={attendanceForm.date}
                onChange={handleAttendanceInput}
                required
              />
              <SelectInput
                label="Status"
                name="status"
                value={attendanceForm.status}
                onChange={handleAttendanceInput}
                options={[
                  "Present",
                  "Late",
                  "Absent",
                ]}
              />
              <div className="grid gap-5 md:grid-cols-2">
                <FormInput
                  label="Check In"
                  name="checkIn"
                  type="time"
                  value={attendanceForm.checkIn}
                  onChange={handleAttendanceInput}
                />
                <FormInput
                  label="Check Out"
                  name="checkOut"
                  type="time"
                  value={attendanceForm.checkOut}
                  onChange={handleAttendanceInput}
                />
                <FormInput
                  label="Working Hours"
                  name="hours"
                  type="number"
                  value={attendanceForm.hours}
                  onChange={handleAttendanceInput}
                  min="0"
                  step="0.5"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Note
                </label>
                <textarea
                  name="note"
                  value={attendanceForm.note}
                  onChange={handleAttendanceInput}
                  rows="3"
                  placeholder="Optional note..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-700 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeAttendanceModal}
                  disabled={attendanceLoading}
                  className="w-full rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={attendanceLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {attendanceLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      {editingAttendance
                        ? "Update Attendance"
                        : "Save Attendance"}
                    </>)}
                </button>
              </div>
            </form>
</div>
        </div>
      )}
    </div>
  );
}
/* =========================================================
HELPER COMPONENTS
========================================================= */
function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-700/50">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}
function InfoItem({
  icon,
  label,
  value,
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-slate-400">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">
          {value}
        </p>
      </div>
    </div>
  );
}
function SummaryRow({
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 dark:border-slate-700">
      <span className="text-sm text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <span className="font-semibold text-slate-900 dark:text-white">
        {value}
      </span>
    </div>
  );
}
function AttendanceStat({
  icon,
  label,
  value,
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800 sm:p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
        {icon}
      </div>
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white"> {value}
      </p>
    </div>
  );
}
function AttendanceBadge({
  status,
}) {
  if (status === "Present") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
        <CheckCircle2 size={13} />
        Present
      </span>
    );
  }
  if (status === "Late") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
        <AlertCircle size={13} />
        Late
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
      <XCircle size={13} />
      Absent
    </span>
  );
}
function TaskStat({
  label,
  value,
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800 sm:p-5">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}
function PerformanceRow({
  label,
  value,
}) {
  return (
    <div>
      <div className="mb-2 flex justify-between">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {label}
        </span>
        <span className="text-sm font-bold text-slate-900 dark:text-white">
          {value}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className="h-full rounded-full bg-blue-600"
          style={{
            width: `${value}%`,
          }}
        />
      </div>
    </div>
  );
}
function EmptySection({
  icon,
  title,
  description,
}) {
  return (
    <div className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-slate-800 sm:p-12"> <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
      {icon}
    </div>
      <h2 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}
function FormInput({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  min,
  step,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        step={step}
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-400"
      />
    </div>
  );
}
function SelectInput({
  label,
  name,
  value,
  onChange,
  options,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

/* =========================================================
DATE FORMATTER
========================================================= */
function formatDate(dateString) {
  if (!dateString) return "-";
  const parts = dateString.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateString;
}
function SnapshotCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

export default EmployeeProfile;
