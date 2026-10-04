import { useEffect, useState } from "react";

import { usePermissions } from "../context/PermissionContext";

import { useAuth } from "../context/AuthContext";

import {

  Plus,

  Search,

  Trash2,

  X,

  Calendar,

  RefreshCw,

  Clock3,

  CheckCircle2,

} from "lucide-react";

import {

  getEmployees,

  createTask,

  updateTask,

  deleteTask,

} from "../api/employeeApi";

function Task() {

  const { role, hasPermission } = usePermissions();

  const { user } = useAuth();

  const canCreateTasks =

    hasPermission("tasks", "add") ||

    hasPermission("tasks", "add_own");

  const canEditTasks =

    hasPermission("tasks", "edit") ||

    hasPermission("tasks", "edit_own");

  const canDeleteTasks = hasPermission("tasks", "delete");

  const [employees, setEmployees] = useState([]);

  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [search, setSearch] = useState("");

  const [filterPriority, setFilterPriority] = useState("All");

  const [filterStatus, setFilterStatus] = useState("All");

  const [newTask, setNewTask] = useState({

    title: "",

    description: "",

    employeeId: "",

    priority: "Medium",

    dueDate: "",

    hours: 0,

  });

  const statuses = [

    "Pending",

    "In Progress",

    "Review",

    "Completed",

  ];

  // ==============================

  // LOAD TASKS FROM MONGODB

  // ==============================

  const loadTasks = async () => {

    try {

      setLoading(true);

      setError("");

      const data = await getEmployees();

      setEmployees(data);

      const allTasks = data.flatMap((employee) =>

        (employee.tasks || []).map((task) => ({

          ...task,

          employeeId: employee._id,

          employeeName: employee.name,

          employeeAvatar: employee.avatar,

        }))

      );

      // The backend already applies employee-level visibility.

      // For Employee accounts GET /api/employees returns only their

      // linked employee profile, so do NOT filter again on the frontend.

      // Admin/HR receive all employees from the same endpoint.

      setTasks(allTasks);

    } catch (err) {

      console.error("Load tasks error:", err);

      setError(

        err.response?.data?.message ||

          "Unable to load tasks."

      );

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    loadTasks();

  }, [role, user?.employeeId]);

  const handleRefresh = () => {

    loadTasks();

  };

  // ==============================

  // TASK SUMMARY

  // ==============================

  const todayKey = new Date().toISOString().split("T")[0];

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(

    (task) => task.status === "Completed"

  ).length;

  const overdueTasks = tasks.filter(

    (task) =>

      task.dueDate &&

      task.dueDate < todayKey &&

      task.status !== "Completed"

  ).length;

  const totalEstimatedHours = tasks.reduce(

    (sum, task) => sum + (Number(task.hours) || 0),

    0

  );

  const completionRate =

    totalTasks > 0

      ? Math.round((completedTasks / totalTasks) * 100)

      : 0;

  // ==============================

  // CREATE TASK

  // ==============================

  const handleCreateTask = async (e) => {

    e.preventDefault();

    if (!canCreateTasks) {

      alert("You do not have permission to create tasks.");

      return;

    }

    if (!newTask.title.trim()) {

      alert("Please enter a task title.");

      return;

    }

    if (!newTask.employeeId) {

      alert("Please select an employee.");

      return;

    }

    try {

      const employee = employees.find(

        (emp) => emp._id === newTask.employeeId

      );

      if (!employee) {

        alert("Employee not found.");

        return;

      }

      const taskData = {

        title: newTask.title.trim(),

        description: newTask.description.trim(),

        status: "Pending",

        priority: newTask.priority,

        dueDate: newTask.dueDate,

        hours: Number(newTask.hours) || 0,

      };

      // Save to MongoDB

      const createdTask = await createTask(

        employee._id,

        taskData

      );

      // Add returned MongoDB task to UI

      setTasks((prev) => [

        ...prev,

        {

          ...createdTask,

          employeeId: employee._id,

          employeeName: employee.name,

          employeeAvatar: employee.avatar,

        },

      ]);

      // Reset form

      setNewTask({

        title: "",

        description: "",

        employeeId: "",

        priority: "Medium",

        dueDate: "",

        hours: 0,

      });

      setShowModal(false);

    } catch (err) {

      console.error("Create task error:", err);

      alert(

        err.response?.data?.message ||

          "Failed to create task."

      );

    }

  };

  // ==============================

  // CHANGE STATUS

  // ==============================

  const handleStatusChange = async (

    taskId,

    employeeId,

    newStatus

  ) => {

    if (!canEditTasks) {

      alert("You do not have permission to update tasks.");

      return;

    }

    try {

      // Update MongoDB

      const updatedTask = await updateTask(

        employeeId,

        taskId,

        {

          status: newStatus,

        }

      );

      // Update UI

      setTasks((prev) =>

        prev.map((task) =>

          task._id === taskId

            ? {

                ...task,

                ...updatedTask,

                employeeId: task.employeeId,

                employeeName: task.employeeName,

                employeeAvatar: task.employeeAvatar,

              }

            : task

        )

      );

    } catch (err) {

      console.error("Update task error:", err);

      alert(

        err.response?.data?.message ||

          "Failed to update task."

      );

    }

  };

  // ==============================

  // DELETE TASK

  // ==============================

  const handleDelete = async (

    taskId,

    employeeId

  ) => {

    if (!canDeleteTasks) {

      alert("You do not have permission to delete tasks.");

      return;

    }

    const confirmed = window.confirm(

      "Are you sure you want to delete this task?"

    );

    if (!confirmed) return;

    try {

      // Delete from MongoDB

      await deleteTask(employeeId, taskId);

      // Remove from UI

      setTasks((prev) =>

        prev.filter(

          (task) => task._id !== taskId

        )

      );

    } catch (err) {

      console.error("Delete task error:", err);

      alert(

        err.response?.data?.message ||

          "Failed to delete task."

      );

    }

  };

  // ==============================

  // SEARCH + FILTER

  // ==============================

  const filteredTasks = tasks.filter((task) => {

    const searchText = search.toLowerCase();

    const matchesSearch =

      task.title

        ?.toLowerCase()

        .includes(searchText) ||

      task.employeeName

        ?.toLowerCase()

        .includes(searchText);

    const matchesPriority =

      filterPriority === "All" ||

      task.priority === filterPriority;

    const matchesStatus =

      filterStatus === "All" ||

      task.status === filterStatus;

    return (

      matchesSearch &&

      matchesPriority &&

      matchesStatus

    );

  });

  const getTasksByStatus = (status) => {

    return filteredTasks.filter(

      (task) => task.status === status

    );

  };

  // ==============================

  // LOADING

  // ==============================

  if (loading) {

    return (

      <div className="flex min-h-[400px] items-center justify-center">

        <p className="text-slate-500 dark:text-slate-400">

          Loading tasks...

        </p>

      </div>

    );

  }

  // ==============================

  // ERROR

  // ==============================

  if (error) {

    return (

      <div className="rounded-xl bg-red-50 p-6 text-center text-red-600 dark:bg-red-900/20 dark:text-red-400">

        {error}

      </div>

    );

  }

  return (

    <div className="min-w-0 space-y-4 sm:space-y-6">

      {/* HEADER */}

      <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">

            Tasks

          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

            {role === "Employee"

              ? "View and update your assigned tasks"

              : "Manage and track tasks across all employees"}

          </p>

        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">

          <button

            onClick={handleRefresh}

            className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"

          >

            <RefreshCw size={17} />

            Refresh

          </button>

          {canCreateTasks && (

            <button

              onClick={() => setShowModal(true)}

              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"

            >

              <Plus size={18} />

              Create Task

            </button>

          )}

        </div>

      </div>

      {/* TASK SUMMARY */}

      <div className="grid min-w-0 grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:gap-4 xl:grid-cols-4">

        <SummaryCard

          icon={CheckCircle2}

          label="Completion Rate"

          value={`${completionRate}%`}

          detail={`${completedTasks} of ${totalTasks} tasks completed`}

        />

        <SummaryCard

          icon={Clock3}

          label="Overdue"

          value={overdueTasks}

          detail="Open tasks past due date"

        />

        <SummaryCard

          icon={Calendar}

          label="Estimated Hours"

          value={totalEstimatedHours}

          detail="Total planned task hours"

        />

        <SummaryCard

          icon={Plus}

          label="Total Tasks"

          value={totalTasks}

          detail="Across all employees"

        />

      </div>

      {/* STATISTICS */}

      <div className="grid min-w-0 grid-cols-1 gap-3 min-[400px]:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 sm:gap-4">

        {statuses.map((status) => (

          <div

            key={status}

            className="rounded-xl bg-white p-5 shadow-sm dark:bg-slate-800"

          >

            <p className="text-sm text-slate-500 dark:text-slate-400">

              {status}

            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">

              {

                tasks.filter(

                  (task) =>

                    task.status === status

                ).length

              }

            </p>

          </div>

        ))}

      </div>

      {/* SEARCH + FILTER */}

      <div className="flex min-w-0 flex-col gap-3 rounded-xl bg-white p-3 shadow-sm dark:bg-slate-800 sm:p-4 md:flex-row">

        <div className="relative flex-1">

          <Search

            size={18}

            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"

          />

          <input

            type="text"

            placeholder="Search tasks or employees..."

            value={search}

            onChange={(e) =>

              setSearch(e.target.value)

            }

            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"

          />

        </div>

        <select

          value={filterPriority}

          onChange={(e) =>

            setFilterPriority(e.target.value)

          }

          className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"

        >

          <option value="All">All</option>

          <option value="High">High</option>

          <option value="Medium">Medium</option>

          <option value="Low">Low</option>

        </select>

        <select

          value={filterStatus}

          onChange={(e) => setFilterStatus(e.target.value)}

          className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"

        >

          <option value="All">All Statuses</option>

          {statuses.map((status) => (

            <option key={status} value={status}>

              {status}

            </option>

          ))}

        </select>

      </div>

      {/* KANBAN BOARD */}

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">

        {statuses.map((status) => (

          <div

            key={status}

            className="min-w-0 min-h-[300px] rounded-xl bg-slate-200/70 p-3 dark:bg-slate-800/70 sm:min-h-[500px] sm:p-4"

          >

            {/* COLUMN HEADER */}

            <div className="mb-4 flex items-center justify-between">

              <h2 className="font-semibold text-slate-800 dark:text-white">

                {status}

              </h2>

              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">

                {getTasksByStatus(status).length}

              </span>

            </div>

            {/* TASKS */}

            <div className="space-y-4">

              {getTasksByStatus(status).map(

                (task) => (

                  <div

                    key={task._id}

                    className="min-w-0 rounded-xl bg-white p-3 shadow-sm dark:bg-slate-700 sm:p-4"

                  >

                    {/* TITLE */}

                    <div className="flex items-start justify-between gap-2">

                      <h3 className="font-semibold text-slate-900 dark:text-white">

                        {task.title}

                      </h3>

                      {canDeleteTasks && (

                        <button

                          onClick={() =>

                            handleDelete(

                              task._id,

                              task.employeeId

                            )

                          }

                          className="text-slate-400 hover:text-red-500"

                          title="Delete task"

                        >

                          <Trash2 size={16} />

                        </button>

                      )}

                    </div>

                    {/* DESCRIPTION */}

                    <p className="mt-2 text-sm leading-5 text-slate-500 dark:text-slate-400">

                      {task.description ||

                        "No description"}

                    </p>

                    {/* EMPLOYEE */}

                    <div className="mt-4 flex items-center gap-2">

                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">

                        {task.employeeAvatar ||

                          "NA"}

                      </div>

                      <div>

                        <p className="text-xs text-slate-400">

                          Assigned to

                        </p>

                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">

                          {task.employeeName}

                        </p>

                      </div>

                    </div>

                    {/* PRIORITY */}

                    <div className="mt-4">

                      <span

                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${

                          task.priority === "High"

                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"

                            : task.priority === "Medium"

                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"

                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"

                        }`}

                      >

                        {task.priority}

                      </span>

                    </div>

                    {/* DUE DATE */}

                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">

                      <Calendar size={14} />

                      {task.dueDate ||

                        "No due date"}

                    </div>

                    {/* HOURS */}

                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">

                      Estimated:{" "}

                      {task.hours || 0} hrs

                    </p>

                    {/* STATUS */}

                    <select

                      value={task.status}

                      onChange={(e) =>

                        handleStatusChange(

                          task._id,

                          task.employeeId,

                          e.target.value

                        )

                      }

                      disabled={!canEditTasks}

                      className="mt-4 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-600 dark:text-white"

                    >

                      {statuses.map(

                        (option) => (

                          <option

                            key={option}

                            value={option}

                          >

                            {option}

                          </option>

                        )

                      )}

                    </select>

                  </div>

                )

              )}

              {getTasksByStatus(status)

                .length === 0 && (

                <div className="rounded-lg border-2 border-dashed border-slate-300 p-8 text-center text-sm text-slate-400 dark:border-slate-600">

                  No tasks

                </div>

              )}

            </div>

          </div>

        ))}

      </div>

      {/* CREATE TASK MODAL */}

      {showModal && canCreateTasks && (

        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/50 p-2 sm:items-center sm:p-4">

          <div className="my-2 max-h-[95dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-xl dark:bg-slate-800 sm:my-0 sm:max-h-[90vh] sm:p-6">

            {/* MODAL HEADER */}

            <div className="mb-5 flex items-center justify-between">

              <div>

                <h2 className="text-xl font-bold text-slate-900 dark:text-white">

                  Create Task

                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

                  Assign a task to an employee

                </p>

              </div>

              <button

                onClick={() =>

                  setShowModal(false)

                }

                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"

              >

                <X size={20} />

              </button>

            </div>

            {/* FORM */}

            <form

              onSubmit={handleCreateTask}

              className="space-y-4"

            >

              {/* TITLE */}

              <div>

                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">

                  Task Title

                </label>

                <input

                  type="text"

                  value={newTask.title}

                  onChange={(e) =>

                    setNewTask({

                      ...newTask,

                      title: e.target.value,

                    })

                  }

                  placeholder="Enter task title"

                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"

                />

              </div>

              {/* DESCRIPTION */}

              <div>

                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">

                  Description

                </label>

                <textarea

                  rows="3"

                  value={newTask.description}

                  onChange={(e) =>

                    setNewTask({

                      ...newTask,

                      description:

                        e.target.value,

                    })

                  }

                  placeholder="Enter task description"

                  className="w-full resize-none rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"

                />

              </div>

              {/* EMPLOYEE */}

              <div>

                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">

                  Assign Employee

                </label>

                <select

                  value={newTask.employeeId}

                  onChange={(e) =>

                    setNewTask({

                      ...newTask,

                      employeeId:

                        e.target.value,

                    })

                  }

                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"

                >

                  <option value="">

                    Select employee

                  </option>

                  {employees.map(

                    (employee) => (

                      <option

                        key={employee._id}

                        value={employee._id}

                      >

                        {employee.name} —{" "}

                        {employee.role}

                      </option>

                    )

                  )}

                </select>

              </div>

              {/* PRIORITY */}

              <div>

                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">

                  Priority

                </label>

                <select

                  value={newTask.priority}

                  onChange={(e) =>

                    setNewTask({

                      ...newTask,

                      priority:

                        e.target.value,

                    })

                  }

                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-700 dark:text-white"

                >

                  <option value="Low">

                    Low

                  </option>

                  <option value="Medium">

                    Medium

                  </option>

                  <option value="High">

                    High

                  </option>

                </select>

              </div>

              {/* DUE DATE */}

              <div>

                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">

                  Due Date

                </label>

                <input

                  type="date"

                  value={newTask.dueDate}

                  onChange={(e) =>

                    setNewTask({

                      ...newTask,

                      dueDate:

                        e.target.value,

                    })

                  }

                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"

                />

              </div>

              {/* HOURS */}

              <div>

                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">

                  Estimated Hours

                </label>

                <input

                  type="number"

                  min="0"

                  value={newTask.hours}

                  onChange={(e) =>

                    setNewTask({

                      ...newTask,

                      hours:

                        e.target.value,

                    })

                  }

                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-700 dark:text-white"

                />

              </div>

              {/* BUTTONS */}

              <div className="flex flex-col-reverse gap-2 pt-3 sm:flex-row sm:justify-end sm:gap-3">

                <button

                  type="button"

                  onClick={() =>

                    setShowModal(false)

                  }

                  className="w-full rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 sm:w-auto"

                >

                  Cancel

                </button>

                <button

                  type="submit"

                  className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto"

                >

                  Create Task

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  );

}

function SummaryCard({ icon: Icon, label, value, detail }) {

  return (

    <div className="rounded-xl bg-white p-5 shadow-sm dark:bg-slate-800">

      <div className="flex items-center justify-between">

        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">

          {label}

        </p>

        <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">

          <Icon size={18} />

        </div>

      </div>

      <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">

        {value}

      </p>

      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">

        {detail}

      </p>

    </div>

  );

}

export default Task;
