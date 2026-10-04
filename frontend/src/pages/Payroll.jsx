import { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";

import { usePermissions } from "../context/PermissionContext";

import {

  Wallet,

  Users,

  Clock3,

  TrendingUp,

  Plus,

  Search,

  Filter,

  Pencil,

  Trash2,

  CheckCircle,

  X,

  Eye,

  Printer,

} from "lucide-react";

import {

  getPayrollRecords,

  createPayroll,

  updatePayroll,

  deletePayroll,

  markPayrollAsPaid,

} from "../api/payrollApi";

import { getEmployees } from "../api/employeeApi";

function Payroll() {

  const { user } = useAuth();

  const { role: permissionRole, hasPermission } = usePermissions();

  // AuthContext is the source of truth for the logged-in account.

  const role = user?.role || permissionRole;

  const isEmployee = role === "Employee";

  const isHR = role === "HR";

  const isAdmin = role === "Admin";

  const canCreatePayroll = hasPermission("payroll", "add");

  const canEditPayroll = hasPermission("payroll", "edit");

  const canDeletePayroll = hasPermission("payroll", "delete");

  const canMarkPaid = hasPermission("payroll", "pay");

  // HR cannot manage their own HR payroll record.

  // Admin can manage HR payroll normally.

  // Use both employeeId and email so the rule still works if an older

  // login session has a stale/missing employeeId.

  const isOwnHRPayroll = (record) => {

    if (!isHR || !record) return false;

    const employeeRole =

      record.employee?.role || record.employeeRole || "";

    if (String(employeeRole).toLowerCase() !== "hr") {

      return false;

    }

    const payrollEmployeeId =

      record.employee?._id || record.employee;

    const sameEmployeeId =

      user?.employeeId &&

      payrollEmployeeId &&

      String(payrollEmployeeId) === String(user.employeeId);

    const sameEmail =

      user?.email &&

      record.employee?.email &&

      String(record.employee.email).toLowerCase() ===

        String(user.email).toLowerCase();

    return Boolean(sameEmployeeId || sameEmail);

  };

  const isAdminPayroll = (record) => {

    if (!isHR || !record) return false;

    const employeeRole = String(

      record.employee?.role || record.employeeRole || ""

    ).toLowerCase();

    return (

      employeeRole === "admin" ||

      employeeRole === "administrator"

    );

  };

  const isRestrictedHRPayroll = (record) =>

    isOwnHRPayroll(record) || isAdminPayroll(record);

  const [payrollRecords, setPayrollRecords] = useState([]);

  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [saving, setSaving] = useState(false);

  const [editingPayroll, setEditingPayroll] = useState(null);

  const [statusFilter, setStatusFilter] = useState("All");

  const [showFilter, setShowFilter] = useState(false);

  const [selectedPayslip, setSelectedPayslip] = useState(null);

  const [form, setForm] = useState({

    employee: "",

    payPeriod: "",

    basicSalary: "",

    allowances: "",

    deductions: "",

    notes: "",

  });

  const payPeriods = [

    "January 2026",

    "February 2026",

    "March 2026",

    "April 2026",

    "May 2026",

    "June 2026",

    "July 2026",

    "August 2026",

    "September 2026",

    "October 2026",

    "November 2026",

    "December 2026",

  ];

  // =========================================================

  // LOAD PAYROLL

  // =========================================================

  const loadPayroll = async () => {

    try {

      setLoading(true);

      const data = await getPayrollRecords();

      const visibleRecords = isEmployee

        ? (data || []).filter(

            (record) =>

              user?.employeeId &&

              String(

                record.employee?._id || record.employee

              ) === String(user.employeeId)

          )

        : data || [];

      setPayrollRecords(visibleRecords);

    } catch (error) {

      console.error(

        "Failed to load payroll:",

        error

      );

    } finally {

      setLoading(false);

    }

  };

  // =========================================================

  // LOAD EMPLOYEES

  // =========================================================

  const loadEmployees = async () => {

    try {

      const data = await getEmployees();

      setEmployees(data);

    } catch (error) {

      console.error(

        "Failed to load employees:",

        error

      );

    }

  };

  useEffect(() => {

    loadPayroll();

    loadEmployees();

  }, []);

  // =========================================================

  // FORM CHANGE

  // =========================================================

  const handleChange = (e) => {

    const { name, value } = e.target;

    setForm((prev) => ({

      ...prev,

      [name]: value,

    }));

  };

  // =========================================================

  // OPEN ADD MODAL

  // =========================================================

  const openAddModal = () => {

    if (!canCreatePayroll) {

      alert("You do not have permission to add payroll records.");

      return;

    }

    setEditingPayroll(null);

    setForm({

      employee: "",

      payPeriod: "",

      basicSalary: "",

      allowances: "",

      deductions: "",

      notes: "",

    });

    setShowModal(true);

  };

  // =========================================================

  // OPEN EDIT MODAL

  // =========================================================

  const openEditModal = (record) => {

    if (isOwnHRPayroll(record)) {

      alert(

        "HR cannot edit their own payroll record. Only Admin can edit HR payroll."

      );

      return;

    }

    if (isAdminPayroll(record)) {

      alert(

        "HR cannot edit Admin payroll. Only Admin can manage Admin payroll."

      );

      return;

    }

    if (!canEditPayroll) {

      alert("You do not have permission to edit payroll records.");

      return;

    }

    setEditingPayroll(record);

    setForm({

      employee:

        record.employee?._id ||

        record.employee ||

        "",

      payPeriod: record.payPeriod || "",

      basicSalary: record.basicSalary || "",

      allowances: record.allowances || "",

      deductions: record.deductions || "",

      notes: record.notes || "",

    });

    setShowModal(true);

  };

  // =========================================================

  // CLOSE ADD/EDIT MODAL

  // =========================================================

  const closeModal = () => {

    if (saving) return;

    setShowModal(false);

    setEditingPayroll(null);

  };

  // =========================================================

  // CREATE / UPDATE PAYROLL

  // =========================================================

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (

      editingPayroll &&

      isOwnHRPayroll(editingPayroll)

    ) {

      alert(

        "HR cannot edit their own payroll record. Only Admin can edit HR payroll."

      );

      return;

    }

    if (

      editingPayroll &&

      isAdminPayroll(editingPayroll)

    ) {

      alert(

        "HR cannot edit Admin payroll. Only Admin can manage Admin payroll."

      );

      return;

    }

    if (editingPayroll && !canEditPayroll) {

      alert("You do not have permission to edit payroll records.");

      return;

    }

    if (!editingPayroll && !canCreatePayroll) {

      alert("You do not have permission to create payroll records.");

      return;

    }

    if (!form.employee) {

      alert("Please select an employee");

      return;

    }

    if (!form.payPeriod) {

      alert("Please enter the pay period");

      return;

    }

    if (!form.basicSalary) {

      alert("Please enter the basic salary");

      return;

    }

    try {

      setSaving(true);

      const payrollData = {

        employee: form.employee,

        payPeriod: form.payPeriod,

        basicSalary: Number(form.basicSalary),

        allowances: Number(form.allowances || 0),

        deductions: Number(form.deductions || 0),

        notes: form.notes,

      };

      // UPDATE

      if (editingPayroll) {

        const updatedPayroll =

          await updatePayroll(

            editingPayroll._id,

            payrollData

          );

        setPayrollRecords((prev) =>

          prev.map((record) =>

            record._id === editingPayroll._id

              ? updatedPayroll

              : record

          )

        );

      }

      // CREATE

      else {

        const newPayroll =

          await createPayroll(payrollData);

        setPayrollRecords((prev) => [

          newPayroll,

          ...prev,

        ]);

      }

      setShowModal(false);

      setEditingPayroll(null);

      setForm({

        employee: "",

        payPeriod: "",

        basicSalary: "",

        allowances: "",

        deductions: "",

        notes: "",

      });

    } catch (error) {

      console.error(

        "Failed to save payroll:",

        error

      );

      alert(

        error.response?.data?.message ||

        "Failed to save payroll"

      );

    } finally {

      setSaving(false);

    }

  };

  // =========================================================

  // DELETE PAYROLL

  // =========================================================

  const handleDelete = async (id) => {

    if (!canDeletePayroll) {

      alert("You do not have permission to delete payroll records.");

      return;

    }

    const confirmed = window.confirm(

      "Are you sure you want to delete this payroll record?"

    );

    if (!confirmed) return;

    try {

      await deletePayroll(id);

      setPayrollRecords((prev) =>

        prev.filter(

          (record) => record._id !== id

        )

      );

    } catch (error) {

      console.error(

        "Failed to delete payroll:",

        error

      );

      alert(

        error.response?.data?.message ||

        "Failed to delete payroll"

      );

    }

  };

  // =========================================================

  // MARK AS PAID

  // =========================================================

  const handleMarkPaid = async (id) => {

    const record = payrollRecords.find(

      (item) => item._id === id

    );

    if (isOwnHRPayroll(record)) {

      alert(

        "HR cannot approve or mark their own payroll as paid. Only Admin can do this."

      );

      return;

    }

    if (isAdminPayroll(record)) {

      alert(

        "HR cannot approve or mark Admin payroll as paid. Only Admin can do this."

      );

      return;

    }

    if (!canMarkPaid) {

      alert("You do not have permission to mark payroll as paid.");

      return;

    }

    try {

      const updated =

        await markPayrollAsPaid(id);

      setPayrollRecords((prev) =>

        prev.map((record) =>

          record._id === id

            ? updated

            : record

        )

      );

    } catch (error) {

      console.error(

        "Failed to mark payroll as paid:",

        error

      );

      alert(

        error.response?.data?.message ||

        "Failed to mark payroll as paid"

      );

    }

  };

  // =========================================================

  // SEARCH + FILTER

  // =========================================================

  const filteredRecords =

    payrollRecords.filter((record) => {

      const matchesSearch =

        record.employee?.name

          ?.toLowerCase()

          .includes(search.toLowerCase());

      const matchesStatus =

        statusFilter === "All" ||

        record.status === statusFilter;

      return matchesSearch && matchesStatus;

    });

  // =========================================================

  // SUMMARY

  // =========================================================

  const totalPayroll =

    payrollRecords.reduce(

      (total, record) =>

        total +

        Number(record.netSalary || 0),

      0

    );

  const employeesPaid =

    payrollRecords.filter(

      (record) =>

        record.status === "Paid"

    ).length;

  const pendingPayroll =

    payrollRecords.filter(

      (record) =>

        record.status === "Pending"

    ).length;

  const averageSalary =

    payrollRecords.length > 0

      ? totalPayroll /

      payrollRecords.length

      : 0;

  // =========================================================

  // CURRENCY

  // =========================================================

  const formatCurrency = (amount) => {

    return `₹${Number(

      amount || 0

    ).toLocaleString("en-IN")}`;

  };

  // =========================================================

  // LIVE NET SALARY

  // =========================================================

  const netSalary =

    Number(form.basicSalary || 0) +

    Number(form.allowances || 0) -

    Number(form.deductions || 0);

  // =========================================================

  // PRINT PAYSLIP

  // =========================================================

  const handlePrintPayslip = () => {

    window.print();

  };

  return (

    <div>

      {/* =====================================================

          PAGE HEADER

      ===================================================== */}

      <div className="flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div>

          <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">

            Payroll

          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

            {isEmployee

              ? "View your own payslips and payroll records"

              : isHR

              ? "Manage employee salaries and payroll records. Your own HR payroll can only be managed by Admin."

              : "Manage employee salaries and payroll records"}

          </p>

        </div>

        {canCreatePayroll && (

          <button

            onClick={openAddModal}

            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 sm:w-auto"

          >

            <Plus size={18} />

            Add Payroll

          </button>

        )}

      </div>

      {/* =====================================================

          SUMMARY CARDS

      ===================================================== */}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* Total Payroll */}

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-slate-500 dark:text-slate-400">

                Total Payroll

              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">

                {formatCurrency(totalPayroll)}

              </h2>

            </div>

            <div className="rounded-lg bg-blue-100 p-3 text-blue-600 dark:bg-blue-950 dark:text-blue-400">

              <Wallet size={21} />

            </div>

          </div>

          <p className="mt-3 text-xs text-slate-400">

            Current payroll records

          </p>

        </div>

        {/* Employees Paid */}

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-slate-500 dark:text-slate-400">

                Employees Paid

              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">

                {employeesPaid}

              </h2>

            </div>

            <div className="rounded-lg bg-green-100 p-3 text-green-600 dark:bg-green-950 dark:text-green-400">

              <Users size={21} />

            </div>

          </div>

          <p className="mt-3 text-xs text-slate-400">

            Paid payroll records

          </p>

        </div>

        {/* Pending Payroll */}

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-slate-500 dark:text-slate-400">

                Pending Payroll

              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">

                {pendingPayroll}

              </h2>

            </div>

            <div className="rounded-lg bg-yellow-100 p-3 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400">

              <Clock3 size={21} />

            </div>

          </div>

          <p className="mt-3 text-xs text-slate-400">

            Awaiting payment

          </p>

        </div>

        {/* Average Salary */}

        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm text-slate-500 dark:text-slate-400">

                Average Net Salary

              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">

                {formatCurrency(averageSalary)}

              </h2>

            </div>

            <div className="rounded-lg bg-purple-100 p-3 text-purple-600 dark:bg-purple-950 dark:text-purple-400">

              <TrendingUp size={21} />

            </div>

          </div>

          <p className="mt-3 text-xs text-slate-400">

            Per payroll record

          </p>

        </div>

      </div>

      {/* =====================================================

          PAYROLL TABLE

      ===================================================== */}

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">

        {/* Header */}

        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 dark:border-slate-800 sm:p-5 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">

              Payroll Records

            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

              {isEmployee

                ? "View your salary payments"

                : "Manage employee salary payments"}

            </p>

          </div>

          <div className="flex min-w-0 flex-col gap-2 sm:flex-row">

            {/* Search */}

            <div className="relative min-w-0">

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

                className="w-full min-w-0 rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:w-56"

              />

            </div>

            {/* Filter */}

            <div className="relative min-w-0">

              <button

                onClick={() =>

                  setShowFilter(!showFilter)

                }

                className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"

              >

                <Filter size={16} />

                Filter

              </button>

              {showFilter && (

                <div className="absolute right-0 top-12 z-20 w-44 rounded-lg border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">

                  <button

                    onClick={() => {

                      setStatusFilter("All");

                      setShowFilter(false);

                    }}

                    className={`w-full rounded-md px-3 py-2 text-left text-sm ${statusFilter === "All"

                      ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"

                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"

                      }`}

                  >

                    All

                  </button>

                  <button

                    onClick={() => {

                      setStatusFilter("Pending");

                      setShowFilter(false);

                    }}

                    className={`w-full rounded-md px-3 py-2 text-left text-sm ${statusFilter === "Pending"

                      ? "bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400"

                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"

                      }`}

                  >

                    Pending

                  </button>

                  <button

                    onClick={() => {

                      setStatusFilter("Paid");

                      setShowFilter(false);

                    }}

                    className={`w-full rounded-md px-3 py-2 text-left text-sm ${statusFilter === "Paid"

                      ? "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400"

                      : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"

                      }`}

                  >

                    Paid

                  </button>

                </div>

              )}

            </div>

          </div>

        </div>

        {/* Loading */}

        {loading ? (

          <div className="px-5 py-16 text-center text-sm text-slate-500 dark:text-slate-400">

            Loading payroll records...

          </div>

        ) : filteredRecords.length === 0 ? (

          <div className="px-5 py-16 text-center">

            <div className="flex flex-col items-center">

              <div className="rounded-full bg-slate-100 p-4 text-slate-400 dark:bg-slate-800">

                <Wallet size={28} />

              </div>

              <h3 className="mt-4 font-medium text-slate-900 dark:text-white">

                No payroll records

              </h3>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

                Add a payroll record to get started.

              </p>

              {canCreatePayroll && (

                <button

                  onClick={openAddModal}

                  className="mt-4 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"

                >

                  <Plus size={17} />

                  Add Payroll

                </button>

              )}

            </div>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1100px] text-left text-sm">

              <thead className="bg-slate-50 dark:bg-slate-950">

                <tr>

                  <th className="px-5 py-4 font-medium text-slate-500 dark:text-slate-400">

                    Employee

                  </th>

                  <th className="px-5 py-4 font-medium text-slate-500 dark:text-slate-400">

                    Department

                  </th>

                  <th className="px-5 py-4 font-medium text-slate-500 dark:text-slate-400">

                    Pay Period

                  </th>

                  <th className="px-5 py-4 font-medium text-slate-500 dark:text-slate-400">

                    Basic Salary

                  </th>

                  <th className="px-5 py-4 font-medium text-slate-500 dark:text-slate-400">

                    Allowances

                  </th>

                  <th className="px-5 py-4 font-medium text-slate-500 dark:text-slate-400">

                    Deductions

                  </th>

                  <th className="px-5 py-4 font-medium text-slate-500 dark:text-slate-400">

                    Net Salary

                  </th>

                  <th className="px-5 py-4 font-medium text-slate-500 dark:text-slate-400">

                    Status

                  </th>

                  <th className="px-5 py-4 text-right font-medium text-slate-500 dark:text-slate-400">

                    Actions

                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredRecords.map(

                  (record) => (

                    <tr

                      key={record._id}

                      className="border-t border-slate-100 dark:border-slate-800"

                    >

                      <td className="px-5 py-4">

                        <div className="font-medium text-slate-900 dark:text-white">

                          {record.employee?.name ||

                            "Unknown Employee"}

                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400">

                          {record.employee?.role ||

                            ""}

                        </div>

                      </td>

                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">

                        {record.employee?.department ||

                          "-"}

                      </td>

                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">

                        {record.payPeriod}

                      </td>

                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">

                        {formatCurrency(

                          record.basicSalary

                        )}

                      </td>

                      <td className="px-5 py-4 text-green-600 dark:text-green-400">

                        +

                        {formatCurrency(

                          record.allowances

                        )}

                      </td>

                      <td className="px-5 py-4 text-red-600 dark:text-red-400">

                        -

                        {formatCurrency(

                          record.deductions

                        )}

                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">

                        {formatCurrency(

                          record.netSalary

                        )}

                      </td>

                      <td className="px-5 py-4">

                        {record.status ===

                          "Paid" ? (

                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-400">

                            <CheckCircle

                              size={13}

                            />

                            Paid

                          </span>

                        ) : (

                          <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400">

                            Pending

                          </span>

                        )}

                      </td>

                      {/* ACTIONS */}

                      <td className="px-5 py-4">

                        <div className="flex justify-end gap-2">

                          {/* View Payslip */}

                          <button

                            onClick={() =>

                              setSelectedPayslip(

                                record

                              )

                            }

                            title="View payslip"

                            className="rounded-lg p-2 text-purple-600 transition hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-950"

                          >

                            <Eye size={17} />

                          </button>

                          {/* Mark Paid */}

                          {canMarkPaid &&

                            !isRestrictedHRPayroll(record) &&

                            record.status ===

                              "Pending" && (

                              <button

                                onClick={() =>

                                  handleMarkPaid(

                                    record._id

                                  )

                                }

                                title="Mark as paid"

                                className="rounded-lg p-2 text-green-600 transition hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950"

                              >

                                <CheckCircle

                                  size={17}

                                />

                              </button>

                            )}

                          {/* Edit */}

                          {canEditPayroll &&

                            !isRestrictedHRPayroll(record) &&

                            record.status !== "Paid" && (

                              <button

                                onClick={() =>

                                  openEditModal(record)

                                }

                                title="Edit payroll"

                                className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"

                              >

                                <Pencil size={17} />

                              </button>

                            )}

                          {/* Delete */}

                          {canDeletePayroll && (

                            <button

                              onClick={() =>

                                handleDelete(

                                  record._id

                                )

                              }

                              title="Delete payroll"

                              className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"

                            >

                              <Trash2 size={17} />

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

        )}

      </div>

      {/* =====================================================

          ADD / EDIT PAYROLL MODAL

      ===================================================== */}

      {showModal && (canCreatePayroll || canEditPayroll) && (

        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/50 p-2 sm:items-center sm:p-4">

          <div className="max-h-[95dvh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl dark:bg-slate-900 sm:max-h-[90vh]">

            {/* Header */}

            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-800 sm:px-6">

              <div>

                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">

                  {editingPayroll

                    ? "Edit Payroll"

                    : "Add Payroll"}

                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

                  {editingPayroll

                    ? "Update the employee payroll record"

                    : "Create a new employee payroll record"}

                </p>

              </div>

              <button

                onClick={closeModal}

                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"

              >

                <X size={20} />

              </button>

            </div>

            {/* Form */}

            <form

              onSubmit={handleSubmit}

              className="space-y-5 p-4 sm:p-6"

            >

              {/* Employee + Pay Period */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">

                    Employee

                  </label>

                  <select

                    name="employee"

                    value={form.employee}

                    onChange={handleChange}

                    required

                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"

                  >

                    <option value="">

                      Select employee

                    </option>

                    {employees

                      .filter((employee) => {

                        if (!isHR) return true;

                        const employeeRole = String(

                          employee.role || ""

                        ).toLowerCase();

                        return (

                          employeeRole !== "hr" &&

                          employeeRole !== "admin" &&

                          employeeRole !== "administrator"

                        );

                      })

                      .map((employee) => (

                        <option

                          key={employee._id}

                          value={employee._id}

                        >

                          {employee.name} -{" "}

                          {employee.department}

                        </option>

                      ))}

                  </select>

                </div>

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">

                    Pay Period

                  </label>

                  <select

                    name="payPeriod"

                    value={form.payPeriod}

                    onChange={handleChange}

                    required

                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"

                  >

                    <option value="">

                      Select pay period

                    </option>

                    {payPeriods.map((period) => (

                      <option key={period} value={period}>

                        {period}

                      </option>

                    ))}

                  </select>

                </div>

              </div>

              {/* Salary */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">

                    Basic Salary

                  </label>

                  <input

                    type="number"

                    name="basicSalary"

                    value={form.basicSalary}

                    onChange={handleChange}

                    min="0"

                    required

                    placeholder="0"

                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"

                  />

                </div>

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">

                    Allowances

                  </label>

                  <input

                    type="number"

                    name="allowances"

                    value={form.allowances}

                    onChange={handleChange}

                    min="0"

                    placeholder="0"

                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"

                  />

                </div>

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">

                    Deductions

                  </label>

                  <input

                    type="number"

                    name="deductions"

                    value={form.deductions}

                    onChange={handleChange}

                    min="0"

                    placeholder="0"

                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"

                  />

                </div>

              </div>

              {/* Net Salary */}

              <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-950">

                <div className="flex items-center justify-between">

                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">

                    Net Salary

                  </span>

                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">

                    {formatCurrency(netSalary)}

                  </span>

                </div>

                <p className="mt-1 text-xs text-slate-400">

                  Basic Salary + Allowances −

                  Deductions

                </p>

              </div>

              {/* PAYMENT STATUS INFORMATION */}

              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950/40">

                <div className="flex items-start gap-3">

                  <Clock3

                    size={18}

                    className="mt-0.5 shrink-0 text-yellow-600 dark:text-yellow-400"

                  />

                  <div>

                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">

                      Payroll will be created as Pending

                    </p>

                    <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-400">

                      Payment status and payment date are managed automatically.

                      Use "Mark as Paid" after the salary has been paid.

                    </p>

                  </div>

                </div>

              </div>

              {/* Notes */}

              <div>

                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">

                  Notes

                </label>

                <textarea

                  name="notes"

                  value={form.notes}

                  onChange={handleChange}

                  rows="3"

                  placeholder="Optional notes..."

                  className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"

                />

              </div>

              {/* Buttons */}

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">

                <button

                  type="button"

                  onClick={closeModal}

                  disabled={saving}

                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 sm:w-auto"

                >

                  Cancel

                </button>

                <button

                  type="submit"

                  disabled={saving}

                  className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"

                >

                  {saving

                    ? "Saving..."

                    : editingPayroll

                      ? "Update Payroll"

                      : "Save Payroll"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* =====================================================

          PAYSLIP MODAL

      ===================================================== */}

      {selectedPayslip && (

        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/50 p-2 sm:items-center sm:p-4">

          <div className="max-h-[95dvh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl dark:bg-slate-900 sm:max-h-[90vh]">

            {/* Payslip Header */}

            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-800 sm:px-6">

              <div>

                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">

                  Payslip

                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

                  Salary details for{" "}

                  {selectedPayslip.payPeriod}

                </p>

              </div>

              <button

                onClick={() =>

                  setSelectedPayslip(null)

                }

                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"

              >

                <X size={20} />

              </button>

            </div>

            {/* Payslip Content */}

            <div className="p-4 sm:p-6">

              {/* Company */}

              <div className="border-b border-slate-200 pb-5 dark:border-slate-800">

                <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">

                  Employee

                  <span className="text-blue-600 dark:text-blue-400">

                    Hub

                  </span>

                </h1>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

                  Employee Management System

                </p>

              </div>

              {/* Employee Information */}

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">

                    Employee Name

                  </p>

                  <p className="mt-1 font-medium text-slate-900 dark:text-white">

                    {selectedPayslip.employee?.name ||

                      "Unknown Employee"}

                  </p>

                </div>

                <div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">

                    Department

                  </p>

                  <p className="mt-1 font-medium text-slate-900 dark:text-white">

                    {selectedPayslip.employee?.department ||

                      "-"}

                  </p>

                </div>

                <div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">

                    Role

                  </p>

                  <p className="mt-1 font-medium text-slate-900 dark:text-white">

                    {selectedPayslip.employee?.role ||

                      "-"}

                  </p>

                </div>

                <div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">

                    Pay Period

                  </p>

                  <p className="mt-1 font-medium text-slate-900 dark:text-white">

                    {selectedPayslip.payPeriod}

                  </p>

                </div>

              </div>

              {/* Salary Breakdown */}

              <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">

                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">

                  <h3 className="font-medium text-slate-900 dark:text-white">

                    Salary Breakdown

                  </h3>

                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">

                  <div className="flex items-center justify-between px-4 py-3">

                    <span className="text-sm text-slate-600 dark:text-slate-400">

                      Basic Salary

                    </span>

                    <span className="font-medium text-slate-900 dark:text-white">

                      {formatCurrency(

                        selectedPayslip.basicSalary

                      )}

                    </span>

                  </div>

                  <div className="flex items-center justify-between px-4 py-3">

                    <span className="text-sm text-slate-600 dark:text-slate-400">

                      Allowances

                    </span>

                    <span className="font-medium text-green-600 dark:text-green-400">

                      +

                      {formatCurrency(

                        selectedPayslip.allowances

                      )}

                    </span>

                  </div>

                  <div className="flex items-center justify-between px-4 py-3">

                    <span className="text-sm text-slate-600 dark:text-slate-400">

                      Deductions

                    </span>

                    <span className="font-medium text-red-600 dark:text-red-400">

                      -

                      {formatCurrency(

                        selectedPayslip.deductions

                      )}

                    </span>

                  </div>

                  <div className="flex items-center justify-between bg-slate-50 px-4 py-4 dark:bg-slate-950">

                    <span className="font-semibold text-slate-900 dark:text-white">

                      Net Salary

                    </span>

                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">

                      {formatCurrency(

                        selectedPayslip.netSalary

                      )}

                    </span>

                  </div>

                </div>

              </div>

              {/* Payment Information */}

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">

                    Payment Status

                  </p>

                  <div className="mt-1">

                    {selectedPayslip.status ===

                      "Paid" ? (

                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-400">

                        <CheckCircle size={13} />

                        Paid

                      </span>

                    ) : (

                      <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400">

                        Pending

                      </span>

                    )}

                  </div>

                </div>

                <div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">

                    Payment Date

                  </p>

                  <p className="mt-1 font-medium text-slate-900 dark:text-white">

                    {selectedPayslip.paymentDate ||

                      "Not paid yet"}

                  </p>

                </div>

              </div>

              {/* Notes */}

              {selectedPayslip.notes && (

                <div className="mt-6 rounded-lg bg-slate-50 p-4 dark:bg-slate-950">

                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">

                    Notes

                  </p>

                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">

                    {selectedPayslip.notes}

                  </p>

                </div>

              )}

              {/* Footer */}

              <div className="mt-6 flex flex-col-reverse justify-end gap-2 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:gap-3">

                <button

                  onClick={handlePrintPayslip}

                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"

                >

                  <Printer size={17} />

                  Print Payslip

                </button>

                <button

                  onClick={() =>

                    setSelectedPayslip(null)

                  }

                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"

                >

                  Close

                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}

export default Payroll;
