import { useEffect, useMemo, useState } from "react";

import { usePermissions } from "../context/PermissionContext";

import { useAuth } from "../context/AuthContext";

import {

  Calendar,

  CheckCircle2,

  Clock,

  XCircle,

  Plus,

  Pencil,

  Trash2,

  X,

  Save,

  Search,

  RefreshCw,

  BriefcaseBusiness,

  CalendarCheck2,

} from "lucide-react";

import {

  getEmployees,

  createLeave,

  updateLeave,

  deleteLeave,

} from "../api/employeeApi";

function Leave() {

  const { user } = useAuth();

  const { role: permissionRole, hasPermission } = usePermissions();

  // AuthContext is the source of truth for the logged-in account.

  // PermissionContext can initialize a moment later.

  const role = user?.role || permissionRole;

  const isEmployee = role === "Employee";

  const isHR = role === "HR";

  const isAdmin = role === "Admin";

  // Employee and HR can apply for their own leave.

  // Admin can add leave according to permissions.

  // HR must see the Apply Leave button even if the

  // permission matrix does not contain leave:add/add_own.

  const canCreateLeave =

    isEmployee ||

    isHR ||

    hasPermission("leave", "add") ||

    hasPermission("leave", "add_own");

  const canEditLeave = hasPermission("leave", "edit");

  const canDeleteLeave = hasPermission("leave", "delete");

  const canApproveLeave = hasPermission("leave", "approve");

  const canRejectLeave = hasPermission("leave", "reject");

  // Admin can fully edit leave requests.

  // HR can review Employee leave through Approve/Reject.

  const canReviewLeave =

    canEditLeave ||

    canApproveLeave ||

    canRejectLeave;

  const [employees, setEmployees] = useState([]);

  const [leaveRecords, setLeaveRecords] = useState([]);

  const [loading, setLoading] = useState(true);

  const [leaveLoading, setLeaveLoading] = useState(false);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");

  const [typeFilter, setTypeFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);

  const [editingLeave, setEditingLeave] = useState(null);

  const [form, setForm] = useState({

    employeeId: "",

    leaveType: "Casual Leave",

    startDate: "",

    endDate: "",

    reason: "",

    status: "Pending",

    rejectionReason: "",

  });

  /* =========================================================

     CHECK SPECIFIC LEAVE PERMISSION

     ADMIN:

       Can review all leaves.

     HR:

       Can review Employee leaves.

       Cannot review/approve/reject HR leaves.

     EMPLOYEE:

       Cannot review leaves.

  ========================================================= */

  const canReviewSpecificLeave = (leave) => {

    if (!canReviewLeave) {

      return false;

    }

    // HR cannot approve or reject HR leave.

    if (

      isHR &&

      leave?.employeeRole === "HR"

    ) {

      return false;

    }

    return true;

  };

  /* =========================================================

     LOAD ALL EMPLOYEES + LEAVES

  ========================================================= */

  const loadLeaves = async () => {

    try {

      setLoading(true);

      const data = await getEmployees();

      const employeeList = data || [];

      setEmployees(employeeList);

      const allLeaves = [];

      employeeList.forEach((employee) => {

        if (Array.isArray(employee.leaves)) {

          employee.leaves.forEach((leave) => {

            allLeaves.push({

              ...leave,

              // Employee information

              employeeId: employee._id,

              employeeName: employee.name,

              employeeEmail: employee.email,

              department: employee.department,

              // IMPORTANT:

              // Keep the role of the employee who owns

              // this leave request.

              employeeRole: employee.role,

            });

          });

        }

      });

      /*

        GET /api/employees already scopes Employee accounts

        to their linked employee profile.

        Admin/HR receive all employee profiles.

        Therefore we do not filter the returned employee list

        again here.

      */

      setLeaveRecords(allLeaves);

    } catch (err) {

      console.error(

        "Failed to load leave records",

        err

      );

      alert(

        err.response?.data?.message ||

          "Failed to load leave records"

      );

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    // Wait for authenticated user.

    if (!user) return;

    loadLeaves();

  }, [

    user?.id,

    user?.role,

    permissionRole,

  ]);

  /* =========================================================

     FORM

  ========================================================= */

  const handleInput = (e) => {

    const { name, value } = e.target;

    setForm((previous) => ({

      ...previous,

      [name]: value,

    }));

  };

  const resetForm = () => {

    setForm({

      employeeId: "",

      leaveType: "Casual Leave",

      startDate: "",

      endDate: "",

      reason: "",

      status: "Pending",

      rejectionReason: "",

    });

  };

  /* =========================================================

     OPEN ADD MODAL

  ========================================================= */

  const openAddModal = () => {

    if (!canCreateLeave) {

      alert(

        "You do not have permission to apply for leave."

      );

      return;

    }

    setEditingLeave(null);

    resetForm();

    /*

      Employee -> own profile

      HR       -> own HR profile

      Admin    -> can select employee

    */

    // Employee/HR must apply only for their own Employee profile.

    // Prefer employeeId from the login token. If it is missing,

    // fall back to the matching employee email returned by the API.

    if (isEmployee || isHR) {

      const ownEmployee =

        employees.find(

          (employee) =>

            String(employee._id) === String(user?.employeeId)

        ) ||

        employees.find(

          (employee) =>

            user?.email &&

            employee?.email?.toLowerCase() ===

              user.email.toLowerCase()

        );

      if (!ownEmployee) {

        alert(

          "Your Employee profile could not be found. Please contact Admin."

        );

        return;

      }

      setForm((previous) => ({

        ...previous,

        employeeId: ownEmployee._id,

      }));

    }

    setShowModal(true);

  };

  /* =========================================================

     OPEN EDIT / REVIEW MODAL

  ========================================================= */

  const openEditModal = (leave) => {

    if (!canReviewSpecificLeave(leave)) {

      if (

        isHR &&

        leave?.employeeRole === "HR"

      ) {

        alert(

          "HR cannot approve or reject HR leave requests. Only Admin can approve or reject HR leave requests."

        );

      } else {

        alert(

          "You do not have permission to manage this leave request."

        );

      }

      return;

    }

    setEditingLeave(leave);

    setForm({

      employeeId: leave.employeeId,

      leaveType:

        leave.leaveType || "Casual Leave",

      startDate: leave.startDate || "",

      endDate: leave.endDate || "",

      reason: leave.reason || "",

      status: leave.status || "Pending",

      rejectionReason:

        leave.rejectionReason || "",

    });

    setShowModal(true);

  };

  /* =========================================================

     CLOSE MODAL

  ========================================================= */

  const closeModal = () => {

    if (leaveLoading) return;

    setShowModal(false);

    setEditingLeave(null);

    resetForm();

  };

  /* =========================================================

     CREATE / UPDATE

  ========================================================= */

  const handleSubmit = async (e) => {

    e.preventDefault();

    /* -------------------------------------------------------

       CREATE

    \------------------------------------------------------- */

    if (

      !canCreateLeave &&

      !editingLeave

    ) {

      alert(

        "You do not have permission to apply for leave."

      );

      return;

    }

    /* -------------------------------------------------------

       UPDATE

    \------------------------------------------------------- */

    if (

      editingLeave &&

      !canReviewSpecificLeave(editingLeave)

    ) {

      if (

        isHR &&

        editingLeave?.employeeRole === "HR"

      ) {

        alert(

          "HR cannot approve or reject HR leave requests. Only Admin can approve or reject HR leave requests."

        );

      } else {

        alert(

          "You do not have permission to manage this leave request."

        );

      }

      return;

    }

    /*

      HR without edit permission can only select:

      Approved or Rejected.

    */

    if (

      editingLeave &&

      !canEditLeave &&

      !(

        (canApproveLeave &&

          form.status === "Approved") ||

        (canRejectLeave &&

          form.status === "Rejected")

      )

    ) {

      alert(

        "Please select Approved or Rejected."

      );

      return;

    }

    /* -------------------------------------------------------

   EMPLOYEE / HR OWN PROFILE PROTECTION

   IMPORTANT:

   This check applies ONLY when creating a NEW leave.

   Employee:

   \- Can apply only for their own leave.

   HR:

   \- Can apply only for their own leave.

   \- CAN approve/reject Employee leave.

   \- CANNOT approve/reject HR leave.

   Admin:

   \- No restriction here.

\------------------------------------------------------- */

if (!editingLeave && (isEmployee || isHR)) {

  const ownEmployeeId =

    user?.employeeId ||

    employees.find(

      (employee) =>

        user?.email &&

        employee?.email?.toLowerCase() ===

          user.email.toLowerCase()

    )?._id;

  if (

    !ownEmployeeId ||

    String(form.employeeId) !== String(ownEmployeeId)

  ) {

    alert(

      isHR

        ? "HR can only apply for leave for their own profile."

        : "You can only apply for leave for your own profile."

    );

    return;

  }

}

    /* -------------------------------------------------------

       REQUIRED FIELDS

    \------------------------------------------------------- */

    if (

      !form.employeeId ||

      !form.leaveType ||

      !form.startDate ||

      !form.endDate

    ) {

      alert(

        "Please select an employee and fill in leave type, start date and end date."

      );

      return;

    }

    /* -------------------------------------------------------

       DATE VALIDATION

    \------------------------------------------------------- */

    if (

      new Date(form.endDate) <

      new Date(form.startDate)

    ) {

      alert(

        "End date cannot be before start date."

      );

      return;

    }

    try {

      setLeaveLoading(true);

      /* =====================================================

         UPDATE EXISTING LEAVE

      ===================================================== */

      if (editingLeave) {

        const updatedLeave =

          await updateLeave(

            form.employeeId,

            editingLeave._id,

            canEditLeave

              ? {

                  leaveType:

                    form.leaveType,

                  startDate:

                    form.startDate,

                  endDate:

                    form.endDate,

                  reason:

                    form.reason,

                  status:

                    form.status,

                  rejectionReason:

                    form.rejectionReason,

                }

              : {

                  status:

                    form.status,

                  ...(canRejectLeave &&

                  form.status ===

                    "Rejected"

                    ? {

                        rejectionReason:

                          form.rejectionReason,

                      }

                    : {}),

                }

          );

        setLeaveRecords(

          (previous) =>

            previous.map((leave) =>

              leave._id ===

              editingLeave._id

                ? {

                    ...leave,

                    ...updatedLeave,

                    employeeId:

                      form.employeeId,

                    // Preserve employee role

                    employeeRole:

                      leave.employeeRole,

                  }

                : leave

            )

        );

      }

      /* =====================================================

         CREATE NEW LEAVE

      ===================================================== */

      else {

        const newLeave =

          await createLeave(

            form.employeeId,

            {

              leaveType:

                form.leaveType,

              startDate:

                form.startDate,

              endDate:

                form.endDate,

              reason:

                form.reason,

            }

          );

        const employee =

          employees.find(

            (item) =>

              String(item._id) ===

              String(form.employeeId)

          );

        setLeaveRecords(

          (previous) => [

            {

              ...newLeave,

              employeeId:

                form.employeeId,

              employeeName:

                employee?.name ||

                "Unknown",

              employeeEmail:

                employee?.email ||

                "",

              department:

                employee?.department ||

                "",

              employeeRole:

                employee?.role || "",

            },

            ...previous,

          ]

        );

      }

      closeModal();

    } catch (err) {

      console.error(err);

      alert(

        err.response?.data?.message ||

          "Failed to save leave"

      );

    } finally {

      setLeaveLoading(false);

    }

  };

  /* =========================================================

     DELETE

  ========================================================= */

  const handleDelete = async (leave) => {

    if (!canDeleteLeave) {

      alert(

        "You do not have permission to delete leave."

      );

      return;

    }

    const confirmed =

      window.confirm(

        `Are you sure you want to delete the leave request for ${leave.employeeName}?`

      );

    if (!confirmed) return;

    try {

      setLeaveLoading(true);

      await deleteLeave(

        leave.employeeId,

        leave._id

      );

      setLeaveRecords(

        (previous) =>

          previous.filter(

            (item) =>

              item._id !== leave._id

          )

      );

    } catch (err) {

      console.error(err);

      alert(

        err.response?.data?.message ||

          "Failed to delete leave"

      );

    } finally {

      setLeaveLoading(false);

    }

  };

  /* =========================================================

     FILTERS

  ========================================================= */

  const filteredLeaves = useMemo(() => {

    return [...leaveRecords]

      .filter((leave) => {

        const searchText =

          search.toLowerCase();

        const matchesSearch =

          leave.employeeName

            ?.toLowerCase()

            .includes(searchText) ||

          leave.employeeEmail

            ?.toLowerCase()

            .includes(searchText) ||

          leave.leaveType

            ?.toLowerCase()

            .includes(searchText);

        const matchesStatus =

          statusFilter === "All" ||

          leave.status ===

            statusFilter;

        const matchesType =

          typeFilter === "All" ||

          leave.leaveType ===

            typeFilter;

        return (

          matchesSearch &&

          matchesStatus &&

          matchesType

        );

      })

      .sort(

        (a, b) =>

          new Date(b.startDate) -

          new Date(a.startDate)

      );

  }, [

    leaveRecords,

    search,

    statusFilter,

    typeFilter,

  ]);

  /* =========================================================

     STATS

  ========================================================= */

  const stats = useMemo(() => {

    return {

      total:

        leaveRecords.length,

      pending:

        leaveRecords.filter(

          (leave) =>

            leave.status ===

            "Pending"

        ).length,

      approved:

        leaveRecords.filter(

          (leave) =>

            leave.status ===

            "Approved"

        ).length,

      rejected:

        leaveRecords.filter(

          (leave) =>

            leave.status ===

            "Rejected"

        ).length,

    };

  }, [leaveRecords]);

  const leaveTypes = [

    ...new Set(

      leaveRecords

        .map(

          (leave) =>

            leave.leaveType

        )

        .filter(Boolean)

    ),

  ];

  /* =========================================================

     REFRESH

  ========================================================= */

  const handleRefresh = () => {

    loadLeaves();

  };

  /* =========================================================

     TODAY / INSIGHTS

  ========================================================= */

  const todayKey =

    new Date()

      .toISOString()

      .split("T")[0];

  const activeLeavesToday =

    leaveRecords.filter(

      (leave) => {

        if (

          leave.status !==

          "Approved"

        ) {

          return false;

        }

        const start =

          leave.startDate?.slice(

            0,

            10

          );

        const end =

          leave.endDate?.slice(

            0,

            10

          );

        return (

          start &&

          end &&

          start <= todayKey &&

          end >= todayKey

        );

      }

    ).length;

  const upcomingApprovedLeaves =

    leaveRecords.filter(

      (leave) => {

        return (

          leave.status ===

            "Approved" &&

          leave.startDate?.slice(

            0,

            10

          ) > todayKey

        );

      }

    ).length;

  const totalLeaveDays =

    leaveRecords.reduce(

      (sum, leave) => {

        if (

          !leave.startDate ||

          !leave.endDate

        ) {

          return sum;

        }

        const start =

          new Date(

            leave.startDate

          );

        const end =

          new Date(

            leave.endDate

          );

        const diff =

          Math.floor(

            (end - start) /

              (1000 *

                60 *

                60 *

                24)

          ) + 1;

        return (

          sum +

          Math.max(0, diff)

        );

      },

      0

    );

  /* =========================================================

     DATE

  ========================================================= */

  const formatDate = (date) => {

    if (!date) return "-";

    return new Date(

      date

    ).toLocaleDateString(

      "en-IN",

      {

        day: "2-digit",

        month: "short",

        year: "numeric",

      }

    );

  };

  /* =========================================================

     STATUS BADGE

  ========================================================= */

  const StatusBadge = ({

    status,

  }) => {

    if (

      status === "Approved"

    ) {

      return (

        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">

          <CheckCircle2

            size={14}

          />

          Approved

        </span>

      );

    }

    if (

      status === "Rejected"

    ) {

      return (

        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">

          <XCircle

            size={14}

          />

          Rejected

        </span>

      );

    }

    return (

      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">

        <Clock

          size={14}

        />

        Pending

      </span>

    );

  };

  /* =========================================================

     LOADING

  ========================================================= */

  if (loading) {

    return (

      <div className="flex min-h-[500px] items-center justify-center">

        <div className="text-center">

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600" />

          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">

            Loading leave records...

          </p>

        </div>

      </div>

    );

  }

  /* =========================================================

     PAGE

  ========================================================= */

  return (

    <div className="min-h-screen min-w-0 bg-slate-100 dark:bg-slate-900">

      {/* =====================================================

          HEADER

      ===================================================== */}

      <div className="mb-4 flex min-w-0 flex-col gap-4 sm:mb-6 md:flex-row md:items-center md:justify-between">

        <div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">

            Leave Management

          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

            {isEmployee

              ? "Apply for and view your own leave requests"

              : "Manage employee leave requests"}

          </p>

        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">

          <button

            type="button"

            onClick={

              handleRefresh

            }

            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto"

          >

            <RefreshCw

              size={17}

            />

            Refresh

          </button>

          {canCreateLeave && (

            <button

              onClick={

                openAddModal

              }

              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 sm:w-auto"

            >

              <Plus

                size={18}

              />

              Apply Leave

            </button>

          )}

        </div>

      </div>

      {/* =====================================================

          STATS

      ===================================================== */}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-slate-500 dark:text-slate-400">

                Total Leaves

              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">

                {stats.total}

              </p>

            </div>

            <div className="rounded-xl bg-blue-100 p-3 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">

              <Calendar

                size={22}

              />

            </div>

          </div>

        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-slate-500 dark:text-slate-400">

                Pending

              </p>

              <p className="mt-1 text-2xl font-bold text-yellow-600">

                {stats.pending}

              </p>

            </div>

            <div className="rounded-xl bg-yellow-100 p-3 text-yellow-600 dark:bg-yellow-900/30">

              <Clock

                size={22}

              />

            </div>

          </div>

        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-slate-500 dark:text-slate-400">

                Approved

              </p>

              <p className="mt-1 text-2xl font-bold text-green-600">

                {stats.approved}

              </p>

            </div>

            <div className="rounded-xl bg-green-100 p-3 text-green-600 dark:bg-green-900/30">

              <CheckCircle2

                size={22}

              />

            </div>

          </div>

        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-slate-500 dark:text-slate-400">

                Rejected

              </p>

              <p className="mt-1 text-2xl font-bold text-red-600">

                {stats.rejected}

              </p>

            </div>

            <div className="rounded-xl bg-red-100 p-3 text-red-600 dark:bg-red-900/30">

              <XCircle

                size={22}

              />

            </div>

          </div>

        </div>

      </div>

      {/* =====================================================

          LEAVE INSIGHTS

      ===================================================== */}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

        <LeaveInsight

          icon={CalendarCheck2}

          label="On Leave Today"

          value={

            activeLeavesToday

          }

          detail="Approved leave requests covering today"

        />

        <LeaveInsight

          icon={Calendar}

          label="Upcoming Approved"

          value={

            upcomingApprovedLeaves

          }

          detail="Approved requests starting later"

        />

        <LeaveInsight

          icon={

            BriefcaseBusiness

          }

          label="Total Leave Days"

          value={

            totalLeaveDays

          }

          detail="Days across all leave requests"

        />

      </div>

      {/* =====================================================

          FILTERS

      ===================================================== */}

      <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800 sm:p-5">

        <div className="grid min-w-0 gap-3 sm:gap-4 md:grid-cols-3">

          {/* SEARCH */}

          <div className="relative">

            <Search

              size={18}

              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"

            />

            <input

              type="text"

              value={search}

              onChange={(e) =>

                setSearch(

                  e.target.value

                )

              }

              placeholder="Search employee or leave type..."

              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"

            />

          </div>

          {/* STATUS */}

          <select

            value={

              statusFilter

            }

            onChange={(e) =>

              setStatusFilter(

                e.target.value

              )

            }

            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"

          >

            <option value="All">

              All Status

            </option>

            <option value="Pending">

              Pending

            </option>

            <option value="Approved">

              Approved

            </option>

            <option value="Rejected">

              Rejected

            </option>

          </select>

          {/* TYPE */}

          <select

            value={

              typeFilter

            }

            onChange={(e) =>

              setTypeFilter(

                e.target.value

              )

            }

            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"

          >

            <option value="All">

              All Leave Types

            </option>

            {leaveTypes.map(

              (type) => (

                <option

                  key={type}

                  value={type}

                >

                  {type}

                </option>

              )

            )}

          </select>

          <button

            type="button"

            onClick={() => {

              setSearch("");

              setStatusFilter(

                "All"

              );

              setTypeFilter(

                "All"

              );

            }}

            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-700"

          >

            Clear Filters

          </button>

        </div>

      </div>

      {/* =====================================================

          LEAVE TABLE

      ===================================================== */}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-800">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[900px]">

            <thead>

              <tr className="border-b border-slate-200 dark:border-slate-700">

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                  Employee

                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                  Leave Type

                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                  From

                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                  To

                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                  Status

                </th>

                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">

                  Actions

                </th>

              </tr>

            </thead>

            <tbody>

              {filteredLeaves.map(

                (leave) => (

                  <tr

                    key={

                      leave._id

                    }

                    className="border-b border-slate-100 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/30"

                  >

                    {/* EMPLOYEE */}

                    <td className="px-6 py-5">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">

                          {leave.employeeName

                            ?.split(

                              " "

                            )

                            .map(

                              (

                                name

                              ) =>

                                name[0]

                            )

                            .join(

                              ""

                            )

                            .slice(

                              0,

                              2

                            )

                            .toUpperCase()}

                        </div>

                        <div>

                          <p className="font-semibold text-slate-900 dark:text-white">

                            {

                              leave.employeeName

                            }

                          </p>

                          <p className="text-xs text-slate-500 dark:text-slate-400">

                            {leave.department ||

                              leave.employeeEmail}

                          </p>

                        </div>

                      </div>

                    </td>

                    {/* TYPE */}

                    <td className="px-6 py-5 text-sm font-medium text-slate-700 dark:text-slate-300">

                      {

                        leave.leaveType

                      }

                    </td>

                    {/* FROM */}

                    <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400">

                      {formatDate(

                        leave.startDate

                      )}

                    </td>

                    {/* TO */}

                    <td className="px-6 py-5 text-sm text-slate-600 dark:text-slate-400">

                      {formatDate(

                        leave.endDate

                      )}

                    </td>

                    {/* STATUS */}

                    <td className="px-6 py-5">

                      <StatusBadge

                        status={

                          leave.status

                        }

                      />

                    </td>

                    {/* ACTIONS */}

                    <td className="px-6 py-5">

                      <div className="flex justify-end gap-2">

                        {/* 

                          IMPORTANT:

                          HR cannot review HR leave.

                          Admin can review all leave.

                        */}

                        {canReviewSpecificLeave(

                          leave

                        ) && (

                          <button

                            type="button"

                            onClick={() =>

                              openEditModal(

                                leave

                              )

                            }

                            className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"

                            title={

                              canEditLeave

                                ? "Edit leave"

                                : "Review leave"

                            }

                          >

                            <Pencil

                              size={17}

                            />

                          </button>

                        )}

                        {canDeleteLeave && (

                          <button

                            type="button"

                            onClick={() =>

                              handleDelete(

                                leave

                              )

                            }

                            className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"

                            title="Delete leave"

                          >

                            <Trash2

                              size={17}

                            />

                          </button>

                        )}

                      </div>

                    </td>

                  </tr>

                )

              )}

            </tbody>

          </table>

        </div>

        {/* ===================================================

            EMPTY

        =================================================== */}

        {filteredLeaves.length ===

          0 && (

            <div className="p-12 text-center">

              <Calendar

                size={45}

                className="mx-auto text-slate-300"

              />

              <h3 className="mt-4 font-semibold text-slate-700 dark:text-slate-300">

                No leave records found

              </h3>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

                Try changing your search or filters.

              </p>

            </div>

          )}

      </div>

      {/* =====================================================

          MODAL

      ===================================================== */}

      {showModal &&

        (canCreateLeave ||

          canReviewLeave) && (

          <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/50 p-2 sm:items-center sm:p-4">

            <div className="max-h-[95dvh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-slate-800 sm:max-h-[90vh]">

              {/* MODAL HEADER */}

              <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 dark:border-slate-700 sm:px-6 sm:py-5">

                <div>

                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">

                    {editingLeave

                      ? "Edit Leave"

                      : "Apply Leave"}

                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

                    {editingLeave

                      ? "Update the leave request"

                      : "Create a new employee leave request"}

                  </p>

                </div>

                <button

                  type="button"

                  onClick={

                    closeModal

                  }

                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"

                >

                  <X

                    size={20}

                  />

                </button>

              </div>

              {/* FORM */}

              <form

                onSubmit={

                  handleSubmit

                }

                className="space-y-5 p-4 sm:p-6"

              >

                {/* EMPLOYEE SELECTOR

                     Admin only.

                     Employee and HR apply for their own profile,

                     so they do not see an Employee selector.

                */}

                {isAdmin && (

                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">

                      Employee

                    </label>

                    <select

                      name="employeeId"

                      value={form.employeeId}

                      onChange={handleInput}

                      disabled={!!editingLeave}

                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:disabled:bg-slate-700"

                    >

                      <option value="">

                        Select Employee

                      </option>

                      {employees.map((employee) => (

                        <option

                          key={employee._id}

                          value={employee._id}

                        >

                          {employee.name} -{" "}

                          {employee.department || employee.email}

                        </option>

                      ))}

                    </select>

                  </div>

                )}

                {/* TYPE */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">

                    Leave Type

                  </label>

                  <select

                    name="leaveType"

                    value={

                      form.leaveType

                    }

                    onChange={

                      handleInput

                    }

                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"

                  >

                    <option value="Casual Leave">

                      Casual Leave

                    </option>

                    <option value="Sick Leave">

                      Sick Leave

                    </option>

                    <option value="Earned Leave">

                      Earned Leave

                    </option>

                    <option value="Annual Leave">

                      Annual Leave

                    </option>

                    <option value="Emergency Leave">

                      Emergency Leave

                    </option>

                    <option value="Other">

                      Other

                    </option>

                  </select>

                </div>

                {/* DATES */}

                <div className="grid gap-5 sm:grid-cols-2">

                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">

                      Start Date

                    </label>

                    <input

                      type="date"

                      name="startDate"

                      value={

                        form.startDate

                      }

                      onChange={

                        handleInput

                      }

                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"

                    />

                  </div>

                  <div>

                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">

                      End Date

                    </label>

                    <input

                      type="date"

                      name="endDate"

                      value={

                        form.endDate

                      }

                      onChange={

                        handleInput

                      }

                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"

                    />

                  </div>

                </div>

                {/* STATUS */}

                {editingLeave &&

                  (canApproveLeave ||

                    canRejectLeave) && (

                    <div>

                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">

                        Status

                      </label>

                      <select

                        name="status"

                        value={

                          form.status

                        }

                        onChange={

                          handleInput

                        }

                        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"

                      >

                        {canEditLeave && (

                          <option value="Pending">

                            Pending

                          </option>

                        )}

                        {canApproveLeave &&

                          /*

                            HR must not get Approved option

                            when the leave belongs to HR.

                          */

                          !(

                            isHR &&

                            editingLeave?.employeeRole ===

                              "HR"

                          ) && (

                            <option value="Approved">

                              Approved

                            </option>

                          )}

                        {canRejectLeave &&

                          /*

                            HR must not get Rejected option

                            when the leave belongs to HR.

                          */

                          !(

                            isHR &&

                            editingLeave?.employeeRole ===

                              "HR"

                          ) && (

                            <option value="Rejected">

                              Rejected

                            </option>

                          )}

                      </select>

                    </div>

                  )}

                {/* REASON */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">

                    Reason

                  </label>

                  <textarea

                    name="reason"

                    value={

                      form.reason

                    }

                    onChange={

                      handleInput

                    }

                    rows={4}

                    placeholder="Enter reason for leave..."

                    className="w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"

                  />

                </div>

                {/* REJECTION REASON */}

                {editingLeave &&

                  canRejectLeave &&

                  form.status ===

                    "Rejected" &&

                  !(

                    isHR &&

                    editingLeave?.employeeRole ===

                      "HR"

                  ) && (

                    <div>

                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">

                        Rejection Reason

                      </label>

                      <textarea

                        name="rejectionReason"

                        value={

                          form.rejectionReason

                        }

                        onChange={

                          handleInput

                        }

                        rows={3}

                        placeholder="Enter rejection reason..."

                        className="w-full resize-none rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"

                      />

                    </div>

                  )}

                {/* BUTTONS */}

                <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-5 dark:border-slate-700 sm:flex-row sm:justify-end sm:gap-3">

                  <button

                    type="button"

                    onClick={

                      closeModal

                    }

                    className="w-full rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 sm:w-auto"

                  >

                    Cancel

                  </button>

                  <button

                    type="submit"

                    disabled={

                      leaveLoading

                    }

                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"

                  >

                    {editingLeave ? (

                      <Save

                        size={17}

                      />

                    ) : (

                      <Plus

                        size={17}

                      />

                    )}

                    {leaveLoading

                      ? "Saving..."

                      : editingLeave

                      ? "Update Leave"

                      : "Apply Leave"}

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

   LEAVE INSIGHT

========================================================= */

function LeaveInsight({

  icon: Icon,

  label,

  value,

  detail,

}) {

  return (

    <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">

      <div className="flex items-start justify-between gap-4">

        <div>

          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">

            {label}

          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">

            {value}

          </p>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">

            {detail}

          </p>

        </div>

        <div className="rounded-xl bg-blue-100 p-3 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">

          <Icon size={21} />

        </div>

      </div>

    </div>

  );

}

export default Leave;