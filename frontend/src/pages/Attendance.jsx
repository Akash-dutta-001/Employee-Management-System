import { useEffect, useMemo, useState } from "react";

import { usePermissions } from "../context/PermissionContext";

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

  UserCheck,

} from "lucide-react";

import {

  getEmployees,

  createAttendance,

  updateAttendance,

  deleteAttendance,

} from "../api/employeeApi";

function Attendance() {

  const {

    canAdd,

    canEdit,

    canDelete,

  } = usePermissions();

  const [employees, setEmployees] = useState([]);

  const [attendanceRecords, setAttendanceRecords] = useState([]);

  const [loading, setLoading] = useState(true);

  const [attendanceLoading, setAttendanceLoading] = useState(false);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");

  const [monthFilter, setMonthFilter] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [editingAttendance, setEditingAttendance] = useState(null);

  const [form, setForm] = useState({

    employeeId: "",

    date: "",

    status: "Present",

    checkIn: "",

    checkOut: "",

    hours: "",

    note: "",

  });

  /* =========================================================

     LOAD EMPLOYEES + ATTENDANCE

  ========================================================= */

  const loadAttendance = async () => {

    try {

      setLoading(true);

      const data = await getEmployees();

      const employeeList = data || [];

      setEmployees(employeeList);

      const records = [];

      employeeList.forEach((employee) => {

        (employee.attendance || []).forEach((attendance) => {

          records.push({

            ...attendance,

            attendanceId: attendance._id,

            employeeId: employee._id,

            employeeName: employee.name,

            employeeEmail: employee.email,

            department: employee.department,

            employeeRole: employee.role,

          });

        });

      });

      records.sort((a, b) => {

        return new Date(b.date) - new Date(a.date);

      });

      setAttendanceRecords(records);

    } catch (error) {

      console.error(error);

      alert(

        error.response?.data?.message ||

        "Failed to load attendance records"

      );

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    loadAttendance();

  }, []);

  const handleRefresh = () => {

    loadAttendance();

  };

  /* =========================================================

     STATS

  ========================================================= */

  const stats = useMemo(() => {

    const total = attendanceRecords.length;

    const present = attendanceRecords.filter(

      (item) => item.status === "Present"

    ).length;

    const absent = attendanceRecords.filter(

      (item) => item.status === "Absent"

    ).length;

    const halfDay = attendanceRecords.filter(

      (item) => item.status === "Half Day"

    ).length;

    const leave = attendanceRecords.filter(

      (item) => item.status === "Leave"

    ).length;

    const workingRecords = total - leave;

    const attendanceRate =

      workingRecords > 0

        ? (

          ((present + halfDay * 0.5) / workingRecords) *

          100

        ).toFixed(1)

        : 0;

    const today = new Date().toISOString().split("T")[0];

    const todayRecords = attendanceRecords.filter(

      (item) => item.date?.startsWith(today)

    );

    const todayPresent = todayRecords.filter(

      (item) => item.status === "Present"

    ).length;

    const todayAbsent = todayRecords.filter(

      (item) => item.status === "Absent"

    ).length;

    const todayHalfDay = todayRecords.filter(

      (item) => item.status === "Half Day"

    ).length;

    const todayLeave = todayRecords.filter(

      (item) => item.status === "Leave"

    ).length;

    const todayRate =

      todayRecords.length > 0

        ? (

          ((todayPresent + todayHalfDay * 0.5) /

            Math.max(1, todayRecords.length - todayLeave)) *

          100

        ).toFixed(1)

        : 0;

    return {

      total,

      present,

      absent,

      halfDay,

      leave,

      attendanceRate,

      todayRecords: todayRecords.length,

      todayPresent,

      todayAbsent,

      todayHalfDay,

      todayLeave,

      todayRate,

    };

  }, [attendanceRecords]);

  /* =========================================================

     FILTERS

  ========================================================= */

  const filteredRecords = useMemo(() => {

    return attendanceRecords.filter((record) => {

      const matchesSearch =

        record.employeeName

          ?.toLowerCase()

          .includes(search.toLowerCase()) ||

        record.department

          ?.toLowerCase()

          .includes(search.toLowerCase()) ||

        record.employeeEmail

          ?.toLowerCase()

          .includes(search.toLowerCase());

      const matchesStatus =

        statusFilter === "All" ||

        record.status === statusFilter;

      const matchesMonth =

        !monthFilter ||

        record.date?.startsWith(monthFilter);

      return (

        matchesSearch &&

        matchesStatus &&

        matchesMonth

      );

    });

  }, [

    attendanceRecords,

    search,

    statusFilter,

    monthFilter,

  ]);

  /* =========================================================

     MODAL

  ========================================================= */

  const openCreateModal = () => {

    if (!canAdd("attendance")) return;

    setEditingAttendance(null);

    setForm({

      employeeId: "",

      date: new Date().toISOString().split("T")[0],

      status: "Present",

      checkIn: "",

      checkOut: "",

      hours: "",

      note: "",

    });

    setShowModal(true);

  };

  const openEditModal = (record) => {

    if (!canEdit("attendance")) return;

    setEditingAttendance(record);

    setForm({

      employeeId: record.employeeId,

      date: record.date || "",

      status: record.status || "Present",

      checkIn: record.checkIn || "",

      checkOut: record.checkOut || "",

      hours:

        record.checkIn && record.checkOut

          ? calculateWorkingHours(record.checkIn, record.checkOut)

          : record.hours !== undefined && record.hours !== null

            ? record.hours

            : "",

      note: record.note || "",

    });

    setShowModal(true);

  };

  const closeModal = () => {

    if (attendanceLoading) return;

    setShowModal(false);

    setEditingAttendance(null);

    setForm({

      employeeId: "",

      date: "",

      status: "Present",

      checkIn: "",

      checkOut: "",

      hours: "",

      note: "",

    });

  };

  /* =========================================================

     FORM HANDLING

  ========================================================= */

  const calculateWorkingHours = (checkIn, checkOut) => {

    if (!checkIn || !checkOut) return "";

    const [inHour, inMinute] = checkIn.split(":").map(Number);

    const [outHour, outMinute] = checkOut.split(":").map(Number);

    if ([inHour, inMinute, outHour, outMinute].some(Number.isNaN)) {

      return "";

    }

    let startMinutes = inHour * 60 + inMinute;

    let endMinutes = outHour * 60 + outMinute;

    // Support overnight shifts such as 22:00 -> 06:00.

    if (endMinutes < startMinutes) {

      endMinutes += 24 * 60;

    }

    return Number(((endMinutes - startMinutes) / 60).toFixed(2));

  };

  const handleChange = (e) => {

    const { name, value } = e.target;

    setForm((prev) => {

      const next = {

        ...prev,

        [name]: value,

      };

      if (name === "checkIn" || name === "checkOut") {

        next.hours = calculateWorkingHours(

          name === "checkIn" ? value : prev.checkIn,

          name === "checkOut" ? value : prev.checkOut

        );

      }

      return next;

    });

  };

  /* =========================================================

     CREATE / UPDATE

  ========================================================= */

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (editingAttendance && !canEdit("attendance")) return;

    if (!editingAttendance && !canAdd("attendance")) return;

    if (!editingAttendance && !form.employeeId) {

      alert("Please select an employee.");

      return;

    }

    if (!form.date) {

      alert("Please select a date.");

      return;

    }

    if (

      form.hours !== "" &&

      Number(form.hours) < 0

    ) {

      alert("Hours cannot be negative.");

      return;

    }

    try {

      setAttendanceLoading(true);

      const calculatedHours = calculateWorkingHours(

        form.checkIn,

        form.checkOut

      );

      const attendanceData = {

        date: form.date,

        status: form.status,

        hours:

          calculatedHours === ""

            ? 0

            : Number(calculatedHours),

        checkIn: form.checkIn,

        checkOut: form.checkOut,

        note: form.note,

      };

      /* CREATE */

      if (!editingAttendance) {

        const newAttendance = await createAttendance(

          form.employeeId,

          attendanceData

        );

        const employee = employees.find(

          (item) => item._id === form.employeeId

        );

        const record = {

          ...newAttendance,

          attendanceId: newAttendance._id,

          employeeId: form.employeeId,

          employeeName: employee?.name || "Unknown",

          employeeEmail: employee?.email || "",

          department: employee?.department || "",

          employeeRole: employee?.role || "",

        };

        setAttendanceRecords((prev) =>

          [record, ...prev].sort(

            (a, b) =>

              new Date(b.date) - new Date(a.date)

          )

        );

        alert("Attendance marked successfully.");

      }

      /* UPDATE */

      else {

        const updatedAttendance =

          await updateAttendance(

            editingAttendance.employeeId,

            editingAttendance.attendanceId,

            attendanceData

          );

        setAttendanceRecords((prev) =>

          prev

            .map((record) =>

              record.attendanceId ===

                editingAttendance.attendanceId

                ? {

                  ...record,

                  ...updatedAttendance,

                  attendanceId:

                    updatedAttendance._id ||

                    record.attendanceId,

                }

                : record

            )

            .sort(

              (a, b) =>

                new Date(b.date) -

                new Date(a.date)

            )

        );

        alert("Attendance updated successfully.");

      }

      closeModal();

    } catch (error) {

      console.error(error);

      alert(

        error.response?.data?.message ||

        "Failed to save attendance"

      );

    } finally {

      setAttendanceLoading(false);

    }

  };

  /* =========================================================

     DELETE

  ========================================================= */

  const handleDelete = async (record) => {

    if (!canDelete("attendance")) return;

    const confirmed = window.confirm(

      `Are you sure you want to delete attendance for ${record.employeeName} on ${formatDate(

        record.date

      )}?`

    );

    if (!confirmed) return;

    try {

      await deleteAttendance(

        record.employeeId,

        record.attendanceId

      );

      setAttendanceRecords((prev) =>

        prev.filter(

          (item) =>

            item.attendanceId !==

            record.attendanceId

        )

      );

      alert("Attendance deleted successfully.");

    } catch (error) {

      console.error(error);

      alert(

        error.response?.data?.message ||

        "Failed to delete attendance"

      );

    }

  };

  /* =========================================================

     HELPERS

  ========================================================= */

  const formatDate = (date) => {

    if (!date) return "-";

    return new Date(date).toLocaleDateString(

      "en-IN",

      {

        day: "2-digit",

        month: "short",

        year: "numeric",

      }

    );

  };

  const getInitials = (name) => {

    if (!name) return "?";

    return name

      .split(" ")

      .map((word) => word[0])

      .join("")

      .substring(0, 2)

      .toUpperCase();

  };

  const getStatusClasses = (status) => {

    switch (status) {

      case "Present":

        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";

      case "Absent":

        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";

      case "Half Day":

        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";

      case "Leave":

        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";

      default:

        return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";

    }

  };

  /* =========================================================

     LOADING

  ========================================================= */

  if (loading) {

    return (

      <div className="flex min-h-[70vh] items-center justify-center">

        <div className="flex flex-col items-center gap-3">

          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />

          <p className="text-sm text-slate-500 dark:text-slate-400">

            Loading attendance...

          </p>

        </div>

      </div>

    );

  }

  /* =========================================================

     UI

  ========================================================= */

  return (

    <div className="min-w-0 text-slate-900 dark:text-white">

      {/* =====================================================

          HEADER

      ===================================================== */}

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">

            Attendance Management

          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

            Track and manage employee attendance

          </p>

        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">

          <button

            onClick={handleRefresh}

            disabled={loading}

            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto"

          >

            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />

            Refresh

          </button>

          {canAdd("attendance") && (

            <button

              onClick={openCreateModal}

              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"

            >

              <Plus size={18} />

              Mark Attendance

            </button>

          )}

        </div>

      </div>

      {/* =====================================================

          TODAY SUMMARY

      ===================================================== */}

      <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800 sm:p-5">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <div className="flex items-center gap-2">

              <UserCheck size={20} className="text-blue-600 dark:text-blue-400" />

              <h2 className="font-semibold text-slate-900 dark:text-white">

                Today's Attendance

              </h2>

            </div>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

              Quick overview of attendance records for today.

            </p>

          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

            <TodayMetric label="Present" value={stats.todayPresent} />

            <TodayMetric label="Absent" value={stats.todayAbsent} />

            <TodayMetric label="Half Day" value={stats.todayHalfDay} />

            <TodayMetric label="Leave" value={stats.todayLeave} />

          </div>

        </div>

        <div className="mt-5">

          <div className="mb-2 flex items-center justify-between text-xs">

            <span className="text-slate-500 dark:text-slate-400">

              Today's attendance rate

            </span>

            <span className="font-semibold text-slate-700 dark:text-slate-200">

              {stats.todayRate}%

            </span>

          </div>

          <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">

            <div

              className="h-full rounded-full bg-blue-600 transition-all"

              style={{ width: `${Math.min(100, Number(stats.todayRate))}%` }}

            />

          </div>

        </div>

      </div>

      {/* =====================================================

          STATS

      ===================================================== */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

        {/* Total */}

        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-slate-500 dark:text-slate-400">

                Total Records

              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">

                {stats.total}

              </h2>

            </div>

            <div className="rounded-xl bg-blue-100 p-3 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">

              <Calendar size={22} />

            </div>

          </div>

        </div>

        {/* Present */}

        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-slate-500 dark:text-slate-400">

                Present

              </p>

              <h2 className="mt-2 text-2xl font-bold text-green-600">

                {stats.present}

              </h2>

            </div>

            <div className="rounded-xl bg-green-100 p-3 text-green-600 dark:bg-green-900/30 dark:text-green-400">

              <CheckCircle2 size={22} />

            </div>

          </div>

        </div>

        {/* Absent */}

        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-slate-500 dark:text-slate-400">

                Absent

              </p>

              <h2 className="mt-2 text-2xl font-bold text-red-600">

                {stats.absent}

              </h2>

            </div>

            <div className="rounded-xl bg-red-100 p-3 text-red-600 dark:bg-red-900/30 dark:text-red-400">

              <XCircle size={22} />

            </div>

          </div>

        </div>

        {/* Half Day */}

        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-slate-500 dark:text-slate-400">

                Half Day

              </p>

              <h2 className="mt-2 text-2xl font-bold text-yellow-600">

                {stats.halfDay}

              </h2>

            </div>

            <div className="rounded-xl bg-yellow-100 p-3 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">

              <Clock size={22} />

            </div>

          </div>

        </div>

        {/* Leave */}

        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-slate-500 dark:text-slate-400">

                Leave

              </p>

              <h2 className="mt-2 text-2xl font-bold text-blue-600">

                {stats.leave}

              </h2>

            </div>

            <div className="rounded-xl bg-blue-100 p-3 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">

              <Calendar size={22} />

            </div>

          </div>

        </div>

        {/* Rate */}

        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-slate-500 dark:text-slate-400">

                Attendance Rate

              </p>

              <h2 className="mt-2 text-2xl font-bold text-purple-600">

                {stats.attendanceRate}%

              </h2>

            </div>

            <div className="rounded-xl bg-purple-100 p-3 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">

              %

            </div>

          </div>

        </div>

      </div>

      {/* =====================================================

          FILTERS

      ===================================================== */}

      <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800 sm:p-5">

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

          {/* Search */}

          <div className="relative">

            <Search

              size={18}

              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"

            />

            <input

              type="text"

              placeholder="Search employee..."

              value={search}

              onChange={(e) =>

                setSearch(e.target.value)

              }

              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-900/30"

            />

          </div>

          {/* Status */}

          <select

            value={statusFilter}

            onChange={(e) =>

              setStatusFilter(e.target.value)

            }

            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-900/30"

          >

            <option value="All">All Status</option>

            <option value="Present">Present</option>

            <option value="Absent">Absent</option>

            <option value="Half Day">Half Day</option>

            <option value="Leave">Leave</option>

          </select>

          {/* Month */}

          <div className="relative">

            <Calendar

              size={18}

              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"

            />

            <input

              type="month"

              value={monthFilter}

              onChange={(e) =>

                setMonthFilter(e.target.value)

              }

              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-900/30"

            />

          </div>

        </div>

        {(search ||

          statusFilter !== "All" ||

          monthFilter) && (

            <div className="mt-4 flex items-center justify-between">

              <p className="text-sm text-slate-500 dark:text-slate-400">

                Showing{" "}

                <span className="font-semibold text-slate-900 dark:text-white">

                  {filteredRecords.length}

                </span>{" "}

                records

              </p>

              <button

                onClick={() => {

                  setSearch("");

                  setStatusFilter("All");

                  setMonthFilter("");

                }}

                className="text-sm font-medium text-blue-600 hover:text-blue-700"

              >

                Clear Filters

              </button>

            </div>

          )}

      </div>

      {/* =====================================================

          TABLE

      ===================================================== */}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-800">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1050px] text-left">

            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">

              <tr>

                <th className="px-4 py-4 sm:px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">

                  Employee

                </th>

                <th className="px-4 py-4 sm:px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">

                  Date

                </th>

                <th className="px-4 py-4 sm:px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">

                  Status

                </th>

                <th className="px-4 py-4 sm:px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">

                  Check In

                </th>

                <th className="px-4 py-4 sm:px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">

                  Check Out

                </th>

                <th className="px-4 py-4 sm:px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">

                  Hours

                </th>

                <th className="px-4 py-4 sm:px-6 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">

                  Note

                </th>

                <th className="px-4 py-4 sm:px-6 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">

                  Actions

                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">

              {filteredRecords.length === 0 ? (

                <tr>

                  <td

                    colSpan="8"

                    className="px-6 py-16 text-center"

                  >

                    <Calendar

                      size={42}

                      className="mx-auto mb-3 text-slate-300 dark:text-slate-600"

                    />

                    <p className="font-medium text-slate-600 dark:text-slate-300">

                      No attendance records found

                    </p>

                    <p className="mt-1 text-sm text-slate-400">

                      Try changing your filters or mark new attendance.

                    </p>

                  </td>

                </tr>

              ) : (

                filteredRecords.map((record) => (

                  <tr

                    key={record.attendanceId}

                    className="transition hover:bg-slate-50 dark:hover:bg-slate-700/30"

                  >

                    {/* Employee */}

                    <td className="px-6 py-4">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">

                          {getInitials(

                            record.employeeName

                          )}

                        </div>

                        <div>

                          <p className="font-medium text-slate-900 dark:text-white">

                            {record.employeeName}

                          </p>

                          <p className="text-xs text-slate-500 dark:text-slate-400">

                            {record.department}

                          </p>

                        </div>

                      </div>

                    </td>

                    {/* Date */}

                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">

                      {formatDate(record.date)}

                    </td>

                    {/* Status */}

                    <td className="px-6 py-4">

                      <span

                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(

                          record.status

                        )}`}

                      >

                        {record.status}

                      </span>

                    </td>

                    {/* Check In */}

                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">

                      {record.checkIn || "-"}

                    </td>

                    {/* Check Out */}

                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">

                      {record.checkOut || "-"}

                    </td>

                    {/* Hours */}

                    <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-200">

                      {record.hours || 0} hrs

                    </td>

                    {/* Note */}

                    <td className="max-w-[220px] px-6 py-4">

                      <p

                        className="truncate text-sm text-slate-500 dark:text-slate-400"

                        title={record.note || ""}

                      >

                        {record.note || "-"}

                      </p>

                    </td>

                    {/* Actions */}

                    <td className="px-6 py-4">

                      <div className="flex justify-end gap-2">

                        {canEdit("attendance") && (

                          <button

                            onClick={() =>

                              openEditModal(record)

                            }

                            className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"

                            title="Edit attendance"

                          >

                            <Pencil size={17} />

                          </button>

                        )}

                        {canDelete("attendance") && (

                          <button

                            onClick={() =>

                              handleDelete(record)

                            }

                            className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"

                            title="Delete attendance"

                          >

                            <Trash2 size={17} />

                          </button>

                        )}

                      </div>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

        {/* Footer */}

        {filteredRecords.length > 0 && (

          <div className="border-t border-slate-200 px-4 py-4 dark:border-slate-700 sm:px-6">

            <p className="text-sm text-slate-500 dark:text-slate-400">

              Showing{" "}

              <span className="font-semibold text-slate-700 dark:text-slate-200">

                {filteredRecords.length}

              </span>{" "}

              of{" "}

              <span className="font-semibold text-slate-700 dark:text-slate-200">

                {attendanceRecords.length}

              </span>{" "}

              attendance records

            </p>

          </div>

        )}

      </div>

      {/* =====================================================

          MODAL

      ===================================================== */}

      {showModal && (

        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-2 sm:items-center sm:p-4">

          <div className="max-h-[95dvh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-slate-800 sm:max-h-[90vh] sm:rounded-2xl">

            {/* Modal Header */}

            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-700 sm:px-6 sm:py-5">

              <div>

                <h2 className="text-xl font-bold text-slate-900 dark:text-white">

                  {editingAttendance

                    ? "Edit Attendance"

                    : "Mark Attendance"}

                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

                  {editingAttendance

                    ? "Update attendance details"

                    : "Add a new attendance record"}

                </p>

              </div>

              <button

                onClick={closeModal}

                disabled={attendanceLoading}

                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"

              >

                <X size={20} />

              </button>

            </div>

            {/* Modal Form */}

            <form

              onSubmit={handleSubmit}

              className="space-y-5 p-4 sm:p-6"

            >

              {/* Employee */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">

                  Employee

                </label>

                <select

                  name="employeeId"

                  value={form.employeeId}

                  onChange={handleChange}

                  disabled={!!editingAttendance}

                  required

                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-900/30 dark:disabled:bg-slate-700"

                >

                  <option value="">

                    Select Employee

                  </option>

                  {employees.map((employee) => (

                    <option

                      key={employee._id}

                      value={employee._id}

                    >

                      {employee.name} —{" "}

                      {employee.department}

                    </option>

                  ))}

                </select>

              </div>

              {/* Date + Status */}

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">

                    Date

                  </label>

                  <input

                    type="date"

                    name="date"

                    value={form.date}

                    onChange={handleChange}

                    required

                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-900/30"

                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">

                    Status

                  </label>

                  <select

                    name="status"

                    value={form.status}

                    onChange={handleChange}

                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-900/30"

                  >

                    <option value="Present">

                      Present

                    </option>

                    <option value="Absent">

                      Absent

                    </option>

                    <option value="Half Day">

                      Half Day

                    </option>

                    <option value="Leave">

                      Leave

                    </option>

                  </select>

                </div>

              </div>

              {/* Check In + Check Out + Hours */}

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">

                    Check In

                  </label>

                  <input

                    type="time"

                    name="checkIn"

                    value={form.checkIn}

                    onChange={handleChange}

                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-900/30"

                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">

                    Check Out

                  </label>

                  <input

                    type="time"

                    name="checkOut"

                    value={form.checkOut}

                    onChange={handleChange}

                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-blue-900/30"

                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">

                    Hours

                  </label>

                  <input

                    type="number"

                    name="hours"

                    value={form.hours}

                    readOnly

                    tabIndex={-1}

                    min="0"

                    max="24"

                    step="0.01"

                    placeholder="Automatically calculated"

                    className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"

                  />

                </div>

              </div>

              {/* Note */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">

                  Note

                </label>

                <textarea

                  name="note"

                  value={form.note}

                  onChange={handleChange}

                  rows="3"

                  placeholder="Add an optional note..."

                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-blue-900/30"

                />

              </div>

              {/* Buttons */}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-700 sm:flex-row sm:justify-end">

                <button

                  type="button"

                  onClick={closeModal}

                  disabled={attendanceLoading}

                  className="w-full rounded-xl border border-slate-200 px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 sm:w-auto"

                >

                  Cancel

                </button>

                <button

                  type="submit"

                  disabled={attendanceLoading}

                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"

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

                        : "Mark Attendance"}

                    </>

                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  );

}

function TodayMetric({ label, value }) {

  return (

    <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">

      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>

      <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">

        {value}

      </p>

    </div>

  );

}

export default Attendance;
