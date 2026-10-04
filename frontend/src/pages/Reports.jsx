import { useEffect, useMemo, useState } from "react";

import {

    FileText,

    Users,

    UserCheck,

    UserX,

    Clock3,

    Wallet,

    CalendarDays,

    TrendingUp,

    Search,

    Printer,

    RefreshCw,

    CheckCircle2,

    AlertCircle,

    XCircle,

} from "lucide-react";

import { getEmployees } from "../api/employeeApi";

import { getPayrollRecords } from "../api/payrollApi";

function Reports() {

    const [employees, setEmployees] = useState([]);

    const [payrollRecords, setPayrollRecords] = useState([]);

    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");

    const [reportType, setReportType] = useState("Overview");

    // =========================================================

    // LOAD REPORT DATA

    // =========================================================

    const loadReports = async () => {

        try {

            setLoading(true);

            const [employeeData, payrollData] =

                await Promise.all([

                    getEmployees(),

                    getPayrollRecords(),

                ]);

            setEmployees(employeeData || []);

            setPayrollRecords(payrollData || []);

        } catch (error) {

            console.error("Failed to load reports:", error);

            alert(

                error.response?.data?.message ||

                "Failed to load reports"

            );

        } finally {

            setLoading(false);

        }

    };

    useEffect(() => {

        loadReports();

    }, []);

    // =========================================================

    // HELPERS

    // =========================================================

    const formatCurrency = (amount) => {

        return `₹${Number(amount || 0).toLocaleString(

            "en-IN"

        )}`;

    };

    const formatDate = (date) => {

        if (!date) return "-";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {

            return date;

        }

        return parsedDate.toLocaleDateString("en-IN");

    };

    // =========================================================

    // EMPLOYEE REPORT DATA

    // =========================================================

    const employeeStats = useMemo(() => {

        const totalEmployees = employees.length;

        const activeEmployees = employees.filter(

            (employee) =>

                !employee.status ||

                employee.status === "Active"

        ).length;

        const inactiveEmployees = employees.filter(

            (employee) =>

                employee.status &&

                employee.status !== "Active"

        ).length;

        const departments = new Set(

            employees

                .map((employee) => employee.department)

                .filter(Boolean)

        );

        return {

            totalEmployees,

            activeEmployees,

            inactiveEmployees,

            departments: departments.size,

        };

    }, [employees]);

    // =========================================================

    // ATTENDANCE REPORT DATA

    // =========================================================

    const attendanceStats = useMemo(() => {

        let total = 0;

        let present = 0;

        let late = 0;

        let absent = 0;

        let totalHours = 0;

        employees.forEach((employee) => {

            const attendance = Array.isArray(

                employee.attendance

            )

                ? employee.attendance

                : [];

            attendance.forEach((record) => {

                total++;

                if (record.status === "Present") {

                    present++;

                }

                if (record.status === "Late") {

                    late++;

                }

                if (record.status === "Absent") {

                    absent++;

                }

                totalHours += Number(record.hours || 0);

            });

        });

        const attendancePercentage =

            total > 0

                ? Math.round(

                    ((present + late) / total) * 100

                )

                : 0;

        return {

            total,

            present,

            late,

            absent,

            totalHours,

            attendancePercentage,

        };

    }, [employees]);

    // =========================================================

    // LEAVE REPORT DATA

    // =========================================================

    const leaveStats = useMemo(() => {

        let total = 0;

        let pending = 0;

        let approved = 0;

        let rejected = 0;

        employees.forEach((employee) => {

            const leaves = Array.isArray(employee.leaves)

                ? employee.leaves

                : [];

            leaves.forEach((leave) => {

                total++;

                if (leave.status === "Pending") {

                    pending++;

                }

                if (leave.status === "Approved") {

                    approved++;

                }

                if (leave.status === "Rejected") {

                    rejected++;

                }

            });

        });

        return {

            total,

            pending,

            approved,

            rejected,

        };

    }, [employees]);

    // =========================================================

    // PERFORMANCE REPORT DATA

    // =========================================================

    const performanceStats = useMemo(() => {

        let totalReviews = 0;

        let totalRating = 0;

        employees.forEach((employee) => {

            const reviews = Array.isArray(

                employee.performanceReviews

            )

                ? employee.performanceReviews

                : [];

            reviews.forEach((review) => {

                totalReviews++;

                totalRating += Number(

                    review.rating || 0

                );

            });

        });

        const averageRating =

            totalReviews > 0

                ? (totalRating / totalReviews).toFixed(1)

                : "0.0";

        return {

            totalReviews,

            averageRating,

        };

    }, [employees]);

    // =========================================================

    // PAYROLL REPORT DATA

    // =========================================================

    const payrollStats = useMemo(() => {

        const totalPayroll =

            payrollRecords.reduce(

                (total, record) =>

                    total +

                    Number(record.netSalary || 0),

                0

            );

        const paidPayroll =

            payrollRecords

                .filter(

                    (record) => record.status === "Paid"

                )

                .reduce(

                    (total, record) =>

                        total +

                        Number(record.netSalary || 0),

                    0

                );

        const pendingPayroll =

            payrollRecords

                .filter(

                    (record) =>

                        record.status === "Pending"

                )

                .reduce(

                    (total, record) =>

                        total +

                        Number(record.netSalary || 0),

                    0

                );

        const paidCount =

            payrollRecords.filter(

                (record) => record.status === "Paid"

            ).length;

        const pendingCount =

            payrollRecords.filter(

                (record) => record.status === "Pending"

            ).length;

        return {

            totalPayroll,

            paidPayroll,

            pendingPayroll,

            paidCount,

            pendingCount,

        };

    }, [payrollRecords]);

    // =========================================================

    // DEPARTMENT REPORT

    // =========================================================

    const departmentReport = useMemo(() => {

        const departmentMap = {};

        employees.forEach((employee) => {

            const department =

                employee.department || "Unassigned";

            if (!departmentMap[department]) {

                departmentMap[department] = {

                    name: department,

                    employees: 0,

                    present: 0,

                    absent: 0,

                    leaves: 0,

                };

            }

            departmentMap[department].employees++;

            const attendance = Array.isArray(

                employee.attendance

            )

                ? employee.attendance

                : [];

            attendance.forEach((record) => {

                if (record.status === "Present") {

                    departmentMap[department].present++;

                }

                if (record.status === "Absent") {

                    departmentMap[department].absent++;

                }

            });

            const leaves = Array.isArray(employee.leaves)

                ? employee.leaves

                : [];

            departmentMap[department].leaves +=

                leaves.length;

        });

        return Object.values(departmentMap);

    }, [employees]);

    // =========================================================

    // EMPLOYEE SEARCH REPORT

    // =========================================================

    const employeeReport = useMemo(() => {

        return employees.filter((employee) =>

            employee.name

                ?.toLowerCase()

                .includes(search.toLowerCase())

        );

    }, [employees, search]);

    // =========================================================

    // PRINT REPORT

    // =========================================================

    const handlePrint = () => {

        window.print();

    };

    // =========================================================

    // LOADING

    // =========================================================

    if (loading) {

        return (

            <div className="flex min-h-[500px] items-center justify-center">

                <div className="text-center">

                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600" />

                    <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">

                        Loading reports...

                    </p>

                </div>

            </div>

        );

    }

    // =========================================================

    // PAGE

    // =========================================================

    return (

        <div className="w-full min-w-0 space-y-4 sm:space-y-6">

            {/* =====================================================

          HEADER

      ===================================================== */}

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                <div>

                    <div className="flex items-center gap-3">

                        <div className="rounded-xl bg-blue-100 p-3 text-blue-600 dark:bg-blue-950 dark:text-blue-400">

                            <FileText size={22} />

                        </div>

                        <div>

                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">

                                Reports

                            </h1>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

                                View employee management reports and statistics

                            </p>

                        </div>

                    </div>

                </div>

                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">

                    <button

                        onClick={loadReports}

                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:w-auto"

                    >

                        <RefreshCw size={17} />

                        Refresh

                    </button>

                    <button

                        onClick={handlePrint}

                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 sm:w-auto"

                    >

                        <Printer size={17} />

                        Print Report

                    </button>

                </div>

            </div>

            {/* =====================================================

          REPORT TYPE

      ===================================================== */}

            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                    <div>

                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">

                            Report Type

                        </p>

                        <p className="text-xs text-slate-500 dark:text-slate-400">

                            Select the information you want to view

                        </p>

                    </div>

                    <select

                        value={reportType}

                        onChange={(e) =>

                            setReportType(e.target.value)

                        }

                        className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 sm:w-auto sm:px-4 dark:border-slate-700 dark:bg-slate-950 dark:text-white"

                    >

                        <option value="Overview">

                            Overview

                        </option>

                        <option value="Employees">

                            Employee Report

                        </option>

                        <option value="Attendance">

                            Attendance Report

                        </option>

                        <option value="Leave">

                            Leave Report

                        </option>

                        <option value="Payroll">

                            Payroll Report

                        </option>

                        <option value="Performance">

                            Performance Report

                        </option>

                        <option value="Departments">

                            Department Report

                        </option>

                    </select>

                </div>

            </div>

            {/* =====================================================

          OVERVIEW

      ===================================================== */}

            {(reportType === "Overview" ||

                reportType === "Employees") && (

                    <>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                            {/* Employees */}

                            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">

                                <div className="flex items-center justify-between">

                                    <div>

                                        <p className="text-sm text-slate-500 dark:text-slate-400">

                                            Total Employees

                                        </p>

                                        <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">

                                            {employeeStats.totalEmployees}

                                        </p>

                                    </div>

                                    <div className="rounded-lg bg-blue-100 p-3 text-blue-600 dark:bg-blue-950 dark:text-blue-400">

                                        <Users size={21} />

                                    </div>

                                </div>

                            </div>

                            {/* Active */}

                            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">

                                <div className="flex items-center justify-between">

                                    <div>

                                        <p className="text-sm text-slate-500 dark:text-slate-400">

                                            Active Employees

                                        </p>

                                        <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">

                                            {employeeStats.activeEmployees}

                                        </p>

                                    </div>

                                    <div className="rounded-lg bg-green-100 p-3 text-green-600 dark:bg-green-950 dark:text-green-400">

                                        <UserCheck size={21} />

                                    </div>

                                </div>

                            </div>

                            {/* Attendance */}

                            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">

                                <div className="flex items-center justify-between">

                                    <div>

                                        <p className="text-sm text-slate-500 dark:text-slate-400">

                                            Attendance Rate

                                        </p>

                                        <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">

                                            {attendanceStats.attendancePercentage}%

                                        </p>

                                    </div>

                                    <div className="rounded-lg bg-purple-100 p-3 text-purple-600 dark:bg-purple-950 dark:text-purple-400">

                                        <CalendarDays size={21} />

                                    </div>

                                </div>

                            </div>

                            {/* Payroll */}

                            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">

                                <div className="flex items-center justify-between">

                                    <div>

                                        <p className="text-sm text-slate-500 dark:text-slate-400">

                                            Total Payroll

                                        </p>

                                        <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">

                                            {formatCurrency(

                                                payrollStats.totalPayroll

                                            )}

                                        </p>

                                    </div>

                                    <div className="rounded-lg bg-yellow-100 p-3 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400">

                                        <Wallet size={21} />

                                    </div>

                                </div>

                            </div>

                        </div>

                    </>

                )}

            {/* =====================================================

          ATTENDANCE REPORT

      ===================================================== */}

            {(reportType === "Overview" ||

                reportType === "Attendance") && (

                    <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">

                        <div className="border-b border-slate-200 p-5 dark:border-slate-800">

                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">

                                Attendance Report

                            </h2>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

                                Overall employee attendance statistics

                            </p>

                        </div>

                        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-5">

                            <ReportStat

                                icon={<CalendarDays size={20} />}

                                label="Total Records"

                                value={attendanceStats.total}

                            />

                            <ReportStat

                                icon={<CheckCircle2 size={20} />}

                                label="Present"

                                value={attendanceStats.present}

                            />

                            <ReportStat

                                icon={<AlertCircle size={20} />}

                                label="Late"

                                value={attendanceStats.late}

                            />

                            <ReportStat

                                icon={<XCircle size={20} />}

                                label="Absent"

                                value={attendanceStats.absent}

                            />

                            <ReportStat

                                icon={<Clock3 size={20} />}

                                label="Total Hours"

                                value={`${attendanceStats.totalHours} hrs`}

                            />

                        </div>

                    </div>

                )}

            {/* =====================================================

          LEAVE REPORT

      ===================================================== */}

            {(reportType === "Overview" ||

                reportType === "Leave") && (

                    <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">

                        <div className="border-b border-slate-200 p-5 dark:border-slate-800">

                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">

                                Leave Report

                            </h2>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

                                Employee leave request summary

                            </p>

                        </div>

                        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">

                            <ReportStat

                                icon={<CalendarDays size={20} />}

                                label="Total Leaves"

                                value={leaveStats.total}

                            />

                            <ReportStat

                                icon={<Clock3 size={20} />}

                                label="Pending"

                                value={leaveStats.pending}

                            />

                            <ReportStat

                                icon={<CheckCircle2 size={20} />}

                                label="Approved"

                                value={leaveStats.approved}

                            />

                            <ReportStat

                                icon={<XCircle size={20} />}

                                label="Rejected"

                                value={leaveStats.rejected}

                            />

                        </div>

                    </div>

                )}

            {/* =====================================================

          PAYROLL REPORT

      ===================================================== */}

            {(reportType === "Overview" ||

                reportType === "Payroll") && (

                    <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">

                        <div className="border-b border-slate-200 p-5 dark:border-slate-800">

                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">

                                Payroll Report

                            </h2>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

                                Salary payment summary

                            </p>

                        </div>

                        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">

                            <ReportStat

                                icon={<Wallet size={20} />}

                                label="Total Payroll"

                                value={formatCurrency(

                                    payrollStats.totalPayroll

                                )}

                            />

                            <ReportStat

                                icon={<CheckCircle2 size={20} />}

                                label="Paid Payroll"

                                value={formatCurrency(

                                    payrollStats.paidPayroll

                                )}

                            />

                            <ReportStat

                                icon={<Clock3 size={20} />}

                                label="Pending Payroll"

                                value={formatCurrency(

                                    payrollStats.pendingPayroll

                                )}

                            />

                            <ReportStat

                                icon={<Users size={20} />}

                                label="Paid Employees"

                                value={`${payrollStats.paidCount} / ${payrollRecords.length}`}

                            />

                        </div>

                    </div>

                )}

            {/* =====================================================

          PERFORMANCE REPORT

      ===================================================== */}

            {(reportType === "Overview" ||

                reportType === "Performance") && (

                    <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">

                        <div className="border-b border-slate-200 p-5 dark:border-slate-800">

                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">

                                Performance Report

                            </h2>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

                                Employee performance review summary

                            </p>

                        </div>

                        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">

                            <ReportStat

                                icon={<FileText size={20} />}

                                label="Total Reviews"

                                value={performanceStats.totalReviews}

                            />

                            <ReportStat

                                icon={<TrendingUp size={20} />}

                                label="Average Rating"

                                value={`${performanceStats.averageRating} / 5`}

                            />

                        </div>

                    </div>

                )}

            {/* =====================================================

          DEPARTMENT REPORT

      ===================================================== */}

            {(reportType === "Overview" ||

                reportType === "Departments") && (

                    <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">

                        <div className="border-b border-slate-200 p-5 dark:border-slate-800">

                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">

                                Department Report

                            </h2>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

                                Employee distribution by department

                            </p>

                        </div>

                        {departmentReport.length === 0 ? (

                            <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">

                                No department data available.

                            </div>

                        ) : (

                            <div className="overflow-x-auto">

                                <table className="w-full text-left text-sm">

                                    <thead className="bg-slate-50 dark:bg-slate-950">

                                        <tr>

                                            <th className="px-5 py-4 font-medium text-slate-500 dark:text-slate-400">

                                                Department

                                            </th>

                                            <th className="px-5 py-4 font-medium text-slate-500 dark:text-slate-400">

                                                Employees

                                            </th>

                                            <th className="px-5 py-4 font-medium text-slate-500 dark:text-slate-400">

                                                Present

                                            </th>

                                            <th className="px-5 py-4 font-medium text-slate-500 dark:text-slate-400">

                                                Absent

                                            </th>

                                            <th className="px-5 py-4 font-medium text-slate-500 dark:text-slate-400">

                                                Leave Records

                                            </th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {departmentReport.map(

                                            (department) => (

                                                <tr

                                                    key={department.name}

                                                    className="border-t border-slate-100 dark:border-slate-800"

                                                >

                                                    <td className="px-5 py-4 font-medium text-slate-900 dark:text-white">

                                                        {department.name}

                                                    </td>

                                                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">

                                                        {department.employees}

                                                    </td>

                                                    <td className="px-5 py-4 text-green-600 dark:text-green-400">

                                                        {department.present}

                                                    </td>

                                                    <td className="px-5 py-4 text-red-600 dark:text-red-400">

                                                        {department.absent}

                                                    </td>

                                                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">

                                                        {department.leaves}

                                                    </td>

                                                </tr>

                                            )

                                        )}

                                    </tbody>

                                </table>

                            </div>

                        )}

                    </div>

                )}

            {/* =====================================================

          EMPLOYEE LIST

      ===================================================== */}

            {reportType === "Employees" && (

                <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">

                    <div className="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">

                        <div>

                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">

                                Employee Report

                            </h2>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

                                Employee details and current status

                            </p>

                        </div>

                        <div className="relative">

                            <Search

                                size={17}

                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"

                            />

                            <input

                                type="text"

                                placeholder="Search employee..."

                                value={search}

                                onChange={(e) =>

                                    setSearch(e.target.value)

                                }

                                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:w-64"

                            />

                        </div>

                    </div>

                    <div className="overflow-x-auto">

                        <table className="w-full text-left text-sm">

                            <thead className="bg-slate-50 dark:bg-slate-950">

                                <tr>

                                    <th className="px-5 py-4 font-medium text-slate-500 dark:text-slate-400">

                                        Employee

                                    </th>

                                    <th className="px-5 py-4 font-medium text-slate-500 dark:text-slate-400">

                                        Department

                                    </th>

                                    <th className="px-5 py-4 font-medium text-slate-500 dark:text-slate-400">

                                        Role

                                    </th>

                                    <th className="px-5 py-4 font-medium text-slate-500 dark:text-slate-400">

                                        Email

                                    </th>

                                    <th className="px-5 py-4 font-medium text-slate-500 dark:text-slate-400">

                                        Status

                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {employeeReport.map(

                                    (employee) => (

                                        <tr

                                            key={employee._id}

                                            className="border-t border-slate-100 dark:border-slate-800"

                                        >

                                            <td className="px-5 py-4 font-medium text-slate-900 dark:text-white">

                                                {employee.name || "-"}

                                            </td>

                                            <td className="px-5 py-4 text-slate-600 dark:text-slate-300">

                                                {employee.department || "-"}

                                            </td>

                                            <td className="px-5 py-4 text-slate-600 dark:text-slate-300">

                                                {employee.role || "-"}

                                            </td>

                                            <td className="px-5 py-4 text-slate-600 dark:text-slate-300">

                                                {employee.email || "-"}

                                            </td>

                                            <td className="px-5 py-4">

                                                <span

                                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${!employee.status ||

                                                        employee.status ===

                                                        "Active"

                                                        ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"

                                                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"

                                                        }`}

                                                >

                                                    {!employee.status ||

                                                        employee.status ===

                                                        "Active" ? (

                                                        <>

                                                            <CheckCircle2

                                                                size={13}

                                                            />

                                                            Active

                                                        </>

                                                    ) : (

                                                        <>

                                                            <XCircle

                                                                size={13}

                                                            />

                                                            {employee.status}

                                                        </>

                                                    )}

                                                </span>

                                            </td>

                                        </tr>

                                    )

                                )}

                            </tbody>

                        </table>

                    </div>

                </div>

            )}

            {/* =====================================================

    PRINT-ONLY REPORT

===================================================== */}

            <div className="print-report">

                <div className="print-header">

                    <h1>EmployeeHub</h1>

                    <p>Employee Management System</p>

                    <h2>Management Report</h2>

                    <p className="print-date">

                        Generated on:{" "}

                        {new Date().toLocaleDateString("en-IN")}

                    </p>

                </div>

                {/* Employee Summary */}

                <div className="print-section">

                    <h3>Employee Summary</h3>

                    <div className="print-grid">

                        <div>

                            <span>Total Employees</span>

                            <strong>

                                {employeeStats.totalEmployees}

                            </strong>

                        </div>

                        <div>

                            <span>Active Employees</span>

                            <strong>

                                {employeeStats.activeEmployees}

                            </strong>

                        </div>

                        <div>

                            <span>Inactive Employees</span>

                            <strong>

                                {employeeStats.inactiveEmployees}

                            </strong>

                        </div>

                        <div>

                            <span>Departments</span>

                            <strong>

                                {employeeStats.departments}

                            </strong>

                        </div>

                    </div>

                </div>

                {/* Attendance Summary */}

                <div className="print-section">

                    <h3>Attendance Summary</h3>

                    <div className="print-grid">

                        <div>

                            <span>Attendance Rate</span>

                            <strong>

                                {attendanceStats.attendancePercentage}%

                            </strong>

                        </div>

                        <div>

                            <span>Present</span>

                            <strong>

                                {attendanceStats.present}

                            </strong>

                        </div>

                        <div>

                            <span>Late</span>

                            <strong>

                                {attendanceStats.late}

                            </strong>

                        </div>

                        <div>

                            <span>Absent</span>

                            <strong>

                                {attendanceStats.absent}

                            </strong>

                        </div>

                        <div>

                            <span>Total Hours</span>

                            <strong>

                                {attendanceStats.totalHours} hrs

                            </strong>

                        </div>

                    </div>

                </div>

                {/* Leave Summary */}

                <div className="print-section">

                    <h3>Leave Summary</h3>

                    <div className="print-grid">

                        <div>

                            <span>Total Leaves</span>

                            <strong>

                                {leaveStats.total}

                            </strong>

                        </div>

                        <div>

                            <span>Pending</span>

                            <strong>

                                {leaveStats.pending}

                            </strong>

                        </div>

                        <div>

                            <span>Approved</span>

                            <strong>

                                {leaveStats.approved}

                            </strong>

                        </div>

                        <div>

                            <span>Rejected</span>

                            <strong>

                                {leaveStats.rejected}

                            </strong>

                        </div>

                    </div>

                </div>

                {/* Payroll Summary */}

                <div className="print-section">

                    <h3>Payroll Summary</h3>

                    <div className="print-grid">

                        <div>

                            <span>Total Payroll</span>

                            <strong>

                                {formatCurrency(

                                    payrollStats.totalPayroll

                                )}

                            </strong>

                        </div>

                        <div>

                            <span>Paid Payroll</span>

                            <strong>

                                {formatCurrency(

                                    payrollStats.paidPayroll

                                )}

                            </strong>

                        </div>

                        <div>

                            <span>Pending Payroll</span>

                            <strong>

                                {formatCurrency(

                                    payrollStats.pendingPayroll

                                )}

                            </strong>

                        </div>

                        <div>

                            <span>Paid Employees</span>

                            <strong>

                                {payrollStats.paidCount}

                            </strong>

                        </div>

                        <div>

                            <span>Pending Employees</span>

                            <strong>

                                {payrollStats.pendingCount}

                            </strong>

                        </div>

                    </div>

                </div>

                {/* Performance Summary */}

                <div className="print-section">

                    <h3>Performance Summary</h3>

                    <div className="print-grid">

                        <div>

                            <span>Total Reviews</span>

                            <strong>

                                {performanceStats.totalReviews}

                            </strong>

                        </div>

                        <div>

                            <span>Average Rating</span>

                            <strong>

                                {performanceStats.averageRating} / 5

                            </strong>

                        </div>

                    </div>

                </div>

                {/* Department Summary */}

                <div className="print-section">

                    <h3>Department Summary</h3>

                    <table className="print-table">

                        <thead>

                            <tr>

                                <th>Department</th>

                                <th>Employees</th>

                                <th>Present</th>

                                <th>Absent</th>

                                <th>Leave Records</th>

                            </tr>

                        </thead>

                        <tbody>

                            {departmentReport.map(

                                (department) => (

                                    <tr key={department.name}>

                                        <td>

                                            {department.name}

                                        </td>

                                        <td>

                                            {department.employees}

                                        </td>

                                        <td>

                                            {department.present}

                                        </td>

                                        <td>

                                            {department.absent}

                                        </td>

                                        <td>

                                            {department.leaves}

                                        </td>

                                    </tr>

                                )

                            )}

                        </tbody>

                    </table>

                </div>

                <div className="print-footer">

                    EmployeeHub — Employee Management System

                </div>

            </div>

            <style>{`

  .print-report {

    display: none;

  }

  @media print {

    @page {

      size: A4;

      margin: 15mm;

    }

    body {

      background: white !important;

    }

    body * {

      visibility: hidden !important;

    }

    .print-report,

    .print-report * {

      visibility: visible !important;

    }

    .print-report {

      display: block !important;

      position: absolute;

      left: 0;

      top: 0;

      width: 100%;

      background: white !important;

      color: #111827 !important;

      font-family: Arial, sans-serif;

      padding: 10px;

    }

    .print-header {

      text-align: center;

      border-bottom: 2px solid #111827;

      padding-bottom: 15px;

      margin-bottom: 20px;

    }

    .print-header h1 {

      margin: 0;

      font-size: 28px;

      font-weight: 700;

    }

    .print-header p {

      margin: 4px 0;

      font-size: 12px;

      color: #4b5563;

    }

    .print-header h2 {

      margin: 18px 0 5px;

      font-size: 20px;

      text-transform: uppercase;

    }

    .print-date {

      font-size: 11px !important;

    }

    .print-section {

      margin-bottom: 22px;

      page-break-inside: avoid;

    }

    .print-section h3 {

      margin: 0 0 10px;

      padding-bottom: 6px;

      border-bottom: 1px solid #d1d5db;

      font-size: 15px;

      font-weight: 700;

      text-transform: uppercase;

    }

    .print-grid {

      display: grid;

      grid-template-columns: repeat(2, 1fr);

      gap: 8px;

    }

    .print-grid > div {

      display: flex;

      justify-content: space-between;

      border: 1px solid #d1d5db;

      padding: 9px 10px;

    }

    .print-grid span {

      font-size: 12px;

      color: #4b5563;

    }

    .print-grid strong {

      font-size: 12px;

      color: #111827;

    }

    .print-table {

      width: 100%;

      border-collapse: collapse;

      font-size: 11px;

    }

    .print-table th,

    .print-table td {

      border: 1px solid #d1d5db;

      padding: 8px;

      text-align: left;

    }

    .print-table th {

      font-weight: 700;

      background: #f3f4f6 !important;

    }

    .print-footer {

      margin-top: 30px;

      padding-top: 10px;

      border-top: 1px solid #d1d5db;

      text-align: center;

      font-size: 10px;

      color: #6b7280;

    }

  }

`}</style>

        </div>

    );

}

// =========================================================

// REPORT STAT COMPONENT

// =========================================================

function ReportStat({

    icon,

    label,

    value,

}) {

    return (

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">

            <div className="flex items-center gap-3">

                <div className="rounded-lg bg-blue-100 p-2.5 text-blue-600 dark:bg-blue-950 dark:text-blue-400">

                    {icon}

                </div>

                <div>

                    <p className="text-xs text-slate-500 dark:text-slate-400">

                        {label}

                    </p>

                    <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">

                        {value}

                    </p>

                </div>

            </div>

        </div>

    );

}

export default Reports;
