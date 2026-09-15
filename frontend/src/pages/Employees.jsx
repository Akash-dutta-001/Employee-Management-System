import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "../context/PermissionContext";

import {
  Search,
  Plus,
  RefreshCw,
  UserCheck,
  UserX,
  UsersRound,
  FilterX,
  Users,
  Mail,
  MapPin,
  Briefcase,
  Eye,
  Pencil,
  Trash2,
  X,
  Save,
} from "lucide-react";

import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../api/employeeApi";

function Employees() {
  const navigate = useNavigate();

  const {
    canAdd,
    canEdit,
    canDelete,
  } = usePermissions();

  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [status, setStatus] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    role: "",
    department: "",
    email: "",
    phone: "",
    location: "",
    joiningDate: "",
    status: "Active",
    avatar: "",
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  // ============================================================
  // LOAD EMPLOYEES
  // ============================================================

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getEmployees();

      setEmployees(data || []);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to load employees"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadEmployees();
  };

  // ============================================================
  // FORM HANDLING
  // ============================================================

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openAddModal = () => {
    if (!canAdd("employees")) return;

    setEditingEmployee(null);

    setFormData({
      name: "",
      role: "",
      department: "",
      email: "",
      phone: "",
      location: "",
      joiningDate: "",
      status: "Active",
      avatar: "",
    });

    setShowModal(true);
  };

  const openEditModal = (employee) => {
    if (!canEdit("employees")) return;

    setEditingEmployee(employee);

    setFormData({
      name: employee.name || "",
      role: employee.role || "",
      department: employee.department || "",
      email: employee.email || "",
      phone: employee.phone || "",
      location: employee.location || "",
      joiningDate: employee.joiningDate || "",
      status: employee.status || "Active",
      avatar: employee.avatar || "",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingEmployee(null);
  };

  // ============================================================
  // CREATE / UPDATE EMPLOYEE
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editingEmployee && !canEdit("employees")) return;
    if (!editingEmployee && !canAdd("employees")) return;

    if (
      !formData.name.trim() ||
      !formData.role.trim() ||
      !formData.department.trim() ||
      !formData.email.trim()
    ) {
      alert(
        "Name, role, department and email are required."
      );

      return;
    }

    try {
      setSaving(true);
      setError("");

      if (editingEmployee) {
        // UPDATE
        const updatedEmployee = await updateEmployee(
          editingEmployee._id,
          formData
        );

        setEmployees((previousEmployees) =>
          previousEmployees.map((employee) =>
            employee._id === editingEmployee._id
              ? updatedEmployee
              : employee
          )
        );
      } else {
        // CREATE
        const newEmployee =
          await createEmployee(formData);

        setEmployees((previousEmployees) => [
          newEmployee,
          ...previousEmployees,
        ]);
      }

      setShowModal(false);
      setEditingEmployee(null);
    } catch (err) {
      console.error(err);

      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to save employee";

      setError(message);

      alert(message);
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // DELETE EMPLOYEE
  // ============================================================

  const handleDelete = async (id, name) => {
    if (!canDelete("employees")) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteEmployee(id);

      setEmployees((previousEmployees) =>
        previousEmployees.filter(
          (employee) => employee._id !== id
        )
      );
    } catch (err) {
      console.error(err);

      const message =
        err.response?.data?.message ||
        "Failed to delete employee";

      setError(message);
      alert(message);
    }
  };

  // ============================================================
  // EMPLOYEE INSIGHTS
  // ============================================================

  const activeCount = employees.filter(
    (employee) => employee.status === "Active"
  ).length;

  const inactiveCount = employees.filter(
    (employee) => employee.status === "Inactive"
  ).length;

  const departmentCounts = employees.reduce((counts, employee) => {
    const key = employee.department || "Unassigned";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});

  const topDepartment =
    Object.entries(departmentCounts).sort((a, b) => b[1] - a[1])[0] || null;

  // ============================================================
  // FILTERS
  // ============================================================

  const departments = [
    "All",
    ...new Set(
      employees
        .map((employee) => employee.department)
        .filter(Boolean)
    ),
  ];

  const filteredEmployees = employees.filter(
    (employee) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        employee.name
          ?.toLowerCase()
          .includes(searchText) ||
        employee.email
          ?.toLowerCase()
          .includes(searchText) ||
        employee.role
          ?.toLowerCase()
          .includes(searchText) ||
        employee.department
          ?.toLowerCase()
          .includes(searchText);

      const matchesDepartment =
        department === "All" ||
        employee.department === department;

      const matchesStatus =
        status === "All" ||
        employee.status === status;

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesStatus
      );
    }
  );

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600" />

          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Loading employees...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Employees
          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage all employees in your organization
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          {canAdd("employees") && (
            <button
              onClick={openAddModal}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <Plus size={18} />
              Add Employee
            </button>
          )}
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-6 flex items-center justify-between rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          <span>{error}</span>

          <button
            onClick={() => setError("")}
            className="rounded p-1 hover:bg-red-100 dark:hover:bg-red-900/30"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* STATS */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <EmployeeStat
          icon={<Users size={20} />}
          label="Total Employees"
          value={employees.length}
        />

        <EmployeeStat
          icon={<UserCheck size={20} />}
          label="Active"
          value={activeCount}
        />

        <EmployeeStat
          icon={<UserX size={20} />}
          label="Inactive"
          value={inactiveCount}
        />

        <EmployeeStat
          icon={<Briefcase size={20} />}
          label="Departments"
          value={Math.max(departments.length - 1, 0)}
        />

        <EmployeeStat
          icon={<UsersRound size={20} />}
          label="Top Department"
          value={topDepartment ? topDepartment[0] : "—"}
        />
      </div>

      {/* FILTERS */}
      <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
        <div className="grid gap-4 lg:grid-cols-3">
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
                setSearch(e.target.value)
              }
              placeholder="Search employees..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>

          {/* DEPARTMENT */}
          <select
            value={department}
            onChange={(e) =>
              setDepartment(e.target.value)
            }
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          >
            {departments.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item === "All"
                  ? "All Departments"
                  : item}
              </option>
            ))}
          </select>

          {/* STATUS */}
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value)
            }
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {filteredEmployees.length}
            </span>{" "}
            matching employees
          </p>

          {(search || department !== "All" || status !== "All") && (
            <button
              onClick={() => {
                setSearch("");
                setDepartment("All");
                setStatus("All");
              }}
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <FilterX size={16} />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* DEPARTMENT DISTRIBUTION */}
      {employees.length > 0 && (
        <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Department Distribution
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Employee count by department
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(departmentCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([name, count]) => {
                const percentage = Math.round(
                  (count / Math.max(1, employees.length)) * 100
                );

                return (
                  <div
                    key={name}
                    className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                        {name}
                      </span>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {count}
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                      {percentage}% of employees
                    </p>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Employee
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Department
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Contact
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Location
                </th>

                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Status
                </th>

                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center"
                  >
                    <Users
                      size={36}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 font-medium text-slate-700 dark:text-slate-300">
                      No employees found
                    </p>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Try changing your search or filters.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(
                  (employee) => (
                    <tr
                      key={employee._id}
                      className="border-b border-slate-100 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/40"
                    >
                      {/* EMPLOYEE */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
                            {employee.avatar ||
                              employee.name
                                ?.split(" ")
                                .map(
                                  (name) =>
                                    name[0]
                                )
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {employee.name}
                            </p>

                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                              {employee.role}
                            </p>
                            {employee.joiningDate && (
                              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                                Joined {employee.joiningDate}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* DEPARTMENT */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Briefcase
                            size={16}
                            className="text-slate-400"
                          />

                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {employee.department}
                          </span>
                        </div>
                      </td>

                      {/* CONTACT */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Mail
                            size={16}
                            className="text-slate-400"
                          />

                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {employee.email}
                          </span>
                        </div>
                      </td>

                      {/* LOCATION */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin
                            size={16}
                            className="text-slate-400"
                          />

                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {employee.location ||
                              "Not available"}
                          </span>
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="px-6 py-4">
                        <span
                          className={
                            employee.status ===
                            "Active"
                              ? "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }
                        >
                          {employee.status}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          {/* VIEW */}
                          <button
                            onClick={() =>
                              navigate(
                                `/employees/${employee._id}`
                              )
                            }
                            className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                            title="View Employee"
                          >
                            <Eye size={18} />
                          </button>

                          {/* EDIT */}
                          {canEdit("employees") && (
                            <button
                              onClick={() =>
                                openEditModal(employee)
                              }
                              className="rounded-lg p-2 text-slate-500 hover:bg-yellow-50 hover:text-yellow-600 dark:hover:bg-yellow-900/20"
                              title="Edit Employee"
                            >
                              <Pencil size={18} />
                            </button>
                          )}

                          {/* DELETE */}
                          {canDelete("employees") && (
                            <button
                              onClick={() =>
                                handleDelete(
                                  employee._id,
                                  employee.name
                                )
                              }
                              className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                              title="Delete Employee"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="border-t border-slate-200 px-6 py-4 dark:border-slate-700">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Showing{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {filteredEmployees.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {employees.length}
            </span>{" "}
            employees
          </p>
        </div>
      </div>

      {/* ========================================================
          ADD / EDIT EMPLOYEE MODAL
      ======================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-slate-800">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-700">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingEmployee
                    ? "Edit Employee"
                    : "Add Employee"}
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {editingEmployee
                    ? "Update employee information"
                    : "Enter employee information"}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="p-6"
            >
              <div className="grid gap-5 md:grid-cols-2">
                {/* NAME */}
                <FormInput
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Rahul Sharma"
                  required
                />

                {/* ROLE */}
                <FormInput
                  label="Role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  placeholder="Software Developer"
                  required
                />

                {/* DEPARTMENT */}
                <FormInput
                  label="Department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  placeholder="IT"
                  required
                />

                {/* EMAIL */}
                <FormInput
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="rahul@company.com"
                  required
                />

                {/* PHONE */}
                <FormInput
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+91 9876543210"
                />

                {/* LOCATION */}
                <FormInput
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Kolkata"
                />

                {/* JOINING DATE */}
                <FormInput
                  label="Joining Date"
                  name="joiningDate"
                  type="date"
                  value={formData.joiningDate}
                  onChange={handleInputChange}
                />

                {/* STATUS */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Status
                  </label>

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  >
                    <option value="Active">
                      Active
                    </option>

                    <option value="Inactive">
                      Inactive
                    </option>
                  </select>
                </div>

                {/* AVATAR */}
                <FormInput
                  label="Avatar Initials"
                  name="avatar"
                  value={formData.avatar}
                  onChange={handleInputChange}
                  placeholder="RS"
                />
              </div>

              {/* BUTTONS */}
              <div className="mt-7 flex justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-700">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      {editingEmployee
                        ? "Update Employee"
                        : "Create Employee"}
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

/* ============================================================
   FORM INPUT
============================================================ */

function FormInput({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-400"
      />
    </div>
  );
}

/* ============================================================
   EMPLOYEE STAT
============================================================ */

function EmployeeStat({
  icon,
  label,
  value,
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

export default Employees;