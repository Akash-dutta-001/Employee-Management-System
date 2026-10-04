import { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import {

  Search,

  Users,

  Star,

  TrendingUp,

  Award,

  CalendarDays,

  RefreshCw,

  UserCheck,

  Medal,

  Eye,

  Pencil,

  Trash2,

} from "lucide-react";

import {

  getEmployees,

  createPerformanceReview,

  updatePerformanceReview,

  deletePerformanceReview,

} from "../api/employeeApi";

function Performance() {

  const navigate = useNavigate();

  const { user } = useAuth();

  const role = user?.role || "Employee";

  const isHR = role === "HR";

  const isEmployee = role === "Employee";

  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [ratingFilter, setRatingFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);

  const [editingReview, setEditingReview] = useState(null);

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({

    employeeId: "",

    reviewDate: new Date().toISOString().split("T")[0],

    rating: 5,

    feedback: "",

    strengths: "",

    improvements: "",

  });

  useEffect(() => {

    loadPerformance();

  }, []);

  const loadPerformance = async () => {

    try {

      setLoading(true);

      const data = await getEmployees();

      setEmployees(Array.isArray(data) ? data : []);

    } catch (error) {

      console.error("Failed to load performance:", error);

    } finally {

      setLoading(false);

    }

  };

  const handleRefresh = () => {

    loadPerformance();

  };

  const performanceRecords = useMemo(() => {

    const records = [];

    employees.forEach((employee) => {

      if (!Array.isArray(employee.performanceReviews)) return;

      employee.performanceReviews.forEach((review) => {

        records.push({

          ...review,

          employeeId: employee._id,

          employeeName:

            employee.name ||

            `${employee.firstName || ""} ${employee.lastName || ""}`.trim() ||

            "Unknown Employee",

          department: employee.department || "—",

          employeeRole: employee.role || "",

          employeeCode: employee.employeeId || "—",

        });

      });

    });

    return records.sort(

      (a, b) =>

        new Date(b.reviewDate || 0) -

        new Date(a.reviewDate || 0)

    );

  }, [employees]);

  const filteredRecords = useMemo(() => {

    return performanceRecords.filter((record) => {

      const searchText = search.toLowerCase();

      const matchesSearch =

        record.employeeName.toLowerCase().includes(searchText) ||

        record.department.toLowerCase().includes(searchText) ||

        record.employeeCode.toLowerCase().includes(searchText);

      const rating = Number(record.rating || 0);

      const matchesRating =

        ratingFilter === "All" ||

        rating === Number(ratingFilter);

      return matchesSearch && matchesRating;

    });

  }, [performanceRecords, search, ratingFilter]);

  const stats = useMemo(() => {

    const total = performanceRecords.length;

    const totalRating = performanceRecords.reduce(

      (sum, record) => sum + Number(record.rating || 0),

      0

    );

    const averageRating =

      total > 0

        ? (totalRating / total).toFixed(1)

        : "0.0";

    const fiveStar = performanceRecords.filter(

      (record) => Number(record.rating) === 5

    ).length;

    const fourPlus = performanceRecords.filter(

      (record) => Number(record.rating) >= 4

    ).length;

    const highPerformers = performanceRecords.filter(

      (record) => Number(record.rating) >= 4.5

    ).length;

    const employeesReviewed = new Set(

      performanceRecords.map((record) => record.employeeId)

    ).size;

    return {

      total,

      averageRating,

      fiveStar,

      fourPlus,

      highPerformers,

      employeesReviewed,

    };

  }, [performanceRecords]);

  const isHRRestrictedEmployee = (employee) => {

    if (!isHR || !employee) return false;

    const employeeRole = String(employee.role || "").toLowerCase();

    return (

      employeeRole === "hr" ||

      employeeRole === "admin" ||

      employeeRole === "administrator"

    );

  };

  const isHRRestrictedReview = (review) => {

    if (!isHR || !review) return false;

    const employeeRole = String(review.employeeRole || "").toLowerCase();

    return (

      employeeRole === "hr" ||

      employeeRole === "admin" ||

      employeeRole === "administrator"

    );

  };

  const openAddModal = () => {

    const selectableEmployees = employees.filter(

      (employee) => !isHRRestrictedEmployee(employee)

    );

    if (selectableEmployees.length === 0) {

      alert("There are no eligible employees available for a performance review.");

      return;

    }

    setEditingReview(null);

    setForm({

      employeeId: selectableEmployees[0]?._id || "",

      reviewDate: new Date().toISOString().split("T")[0],

      rating: 5,

      feedback: "",

      strengths: "",

      improvements: "",

    });

    setShowModal(true);

  };

  const openEditModal = (review) => {

    if (isHRRestrictedReview(review)) {

      alert(

        String(review.employeeRole || "").toLowerCase() === "hr"

          ? "HR cannot edit HR performance reviews. Only Admin can manage HR reviews."

          : "HR cannot edit Admin performance reviews. Only Admin can manage Admin reviews."

      );

      return;

    }

    setEditingReview(review);

    setForm({

      employeeId: review.employeeId || "",

      reviewDate: review.reviewDate || "",

      rating: Number(review.rating || 5),

      feedback: review.feedback || "",

      strengths: review.strengths || "",

      improvements: review.improvements || "",

    });

    setShowModal(true);

  };

  const closeModal = () => {

    if (saving) return;

    setShowModal(false);

    setEditingReview(null);

  };

  const handleFormChange = (e) => {

    const { name, value } = e.target;

    setForm((previous) => ({

      ...previous,

      [name]: name === "rating" ? Number(value) : value,

    }));

  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!form.employeeId) {

      alert("Please select an employee.");

      return;

    }

    if (!form.reviewDate) {

      alert("Review date is required.");

      return;

    }

    if (form.rating < 1 || form.rating > 5) {

      alert("Rating must be between 1 and 5.");

      return;

    }

    try {

      setSaving(true);

      const targetEmployee = employees.find(

        (employee) => String(employee._id) === String(form.employeeId)

      );

      if (

        isHR &&

        targetEmployee &&

        isHRRestrictedEmployee(targetEmployee)

      ) {

        alert(

          "HR cannot create or edit performance reviews for HR/Admin profiles. Only Admin can manage those reviews."

        );

        setSaving(false);

        return;

      }

      if (editingReview && isHRRestrictedReview(editingReview)) {

        alert(

          "HR cannot edit HR/Admin performance reviews. Only Admin can manage those reviews."

        );

        setSaving(false);

        return;

      }

      if (editingReview) {

        await updatePerformanceReview(editingReview.employeeId, editingReview._id, {

          reviewDate: form.reviewDate,

          rating: form.rating,

          feedback: form.feedback,

          strengths: form.strengths,

          improvements: form.improvements,

        });

      } else {

        await createPerformanceReview(form.employeeId, {

          reviewDate: form.reviewDate,

          rating: form.rating,

          feedback: form.feedback,

          strengths: form.strengths,

          improvements: form.improvements,

        });

      }

      setShowModal(false);

      setEditingReview(null);

      await loadPerformance();

    } catch (error) {

      console.error("Failed to save performance review:", error);

      alert(error.response?.data?.message || "Failed to save performance review");

    } finally {

      setSaving(false);

    }

  };

  const handleDelete = async (review) => {

    if (isHRRestrictedReview(review)) {

      alert(

        String(review.employeeRole || "").toLowerCase() === "hr"

          ? "HR cannot delete HR performance reviews. Only Admin can manage HR reviews."

          : "HR cannot delete Admin performance reviews. Only Admin can manage Admin reviews."

      );

      return;

    }

    if (!window.confirm("Are you sure you want to delete this performance review?")) {

      return;

    }

    try {

      setSaving(true);

      await deletePerformanceReview(review.employeeId, review._id);

      await loadPerformance();

    } catch (error) {

      console.error("Failed to delete performance review:", error);

      alert(error.response?.data?.message || "Failed to delete performance review");

    } finally {

      setSaving(false);

    }

  };

  const formatDate = (date) => {

    if (!date) return "—";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {

      return date;

    }

    return parsedDate.toLocaleDateString("en-IN", {

      day: "2-digit",

      month: "short",

      year: "numeric",

    });

  };

  const renderStars = (rating) => {

    const value = Number(rating || 0);

    return (

      <div className="flex items-center gap-1">

        {[1, 2, 3, 4, 5].map((star) => (

          <Star

            key={star}

            size={16}

            className={

              star <= value

                ? "fill-yellow-400 text-yellow-400"

                : "text-slate-300 dark:text-slate-600"

            }

          />

        ))}

        <span className="ml-1 text-sm font-medium text-slate-700 dark:text-slate-300">

          {value}/5

        </span>

      </div>

    );

  };

  return (

    <div className="min-h-full min-w-0 p-4 text-slate-900 dark:text-white sm:p-5 lg:p-6">

      {/* Header */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <h1 className="text-2xl font-bold">

            Performance

          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

            Review and monitor employee performance.

          </p>

        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">

          <button

            type="button"

            onClick={handleRefresh}

            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:w-auto dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"

          >

            <RefreshCw size={17} />

            Refresh

          </button>

          {!isEmployee && (

            <button

              type="button"

              onClick={openAddModal}

              disabled={employees.length === 0}

              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"

            >

              <span className="text-lg leading-none">+</span>

              Add Review

            </button>

          )}

        </div>

      </div>

      {/* Statistics */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

        <StatCard

          title="Total Reviews"

          value={stats.total}

          icon={<CalendarDays size={22} />}

        />

        <StatCard

          title="Average Rating"

          value={`${stats.averageRating}/5`}

          icon={<Star size={22} />}

        />

        <StatCard

          title="5 Star Reviews"

          value={stats.fiveStar}

          icon={<Award size={22} />}

        />

        <StatCard

          title="4+ Rating"

          value={stats.fourPlus}

          icon={<TrendingUp size={22} />}

        />

        <StatCard

          title="High Performers"

          value={stats.highPerformers}

          icon={<Medal size={22} />}

        />

        <StatCard

          title="Employees Reviewed"

          value={stats.employeesReviewed}

          icon={<UserCheck size={22} />}

        />

      </div>

      {/* Search / Filter */}

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">

        <div className="flex flex-col gap-4 md:flex-row">

          <div className="relative flex-1">

            <Search

              size={18}

              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"

            />

            <input

              type="text"

              placeholder="Search employee, department or employee ID..."

              value={search}

              onChange={(e) => setSearch(e.target.value)}

              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"

            />

          </div>

          <select

            value={ratingFilter}

            onChange={(e) => setRatingFilter(e.target.value)}

            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"

          >

            <option value="All">All Ratings</option>

            <option value="5">5 Stars</option>

            <option value="4">4 Stars</option>

            <option value="3">3 Stars</option>

            <option value="2">2 Stars</option>

            <option value="1">1 Star</option>

          </select>

          <button

            type="button"

            onClick={() => {

              setSearch("");

              setRatingFilter("All");

            }}

            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"

          >

            Clear Filters

          </button>

        </div>

      </div>

      {/* Performance Table */}

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">

        <div className="flex items-center gap-2 border-b border-slate-200 p-5 dark:border-slate-700">

          <Users

            size={20}

            className="text-blue-600"

          />

          <h2 className="font-semibold">

            Performance Reviews

          </h2>

        </div>

        {loading ? (

          <div className="p-10 text-center text-slate-500 dark:text-slate-400">

            Loading performance reviews...

          </div>

        ) : filteredRecords.length === 0 ? (

          <div className="p-10 text-center text-slate-500 dark:text-slate-400">

            No performance reviews found.

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-slate-50 dark:bg-slate-800">

                <tr>

                  <th className="px-5 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">

                    Employee

                  </th>

                  <th className="px-5 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">

                    Department

                  </th>

                  <th className="px-5 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">

                    Review Date

                  </th>

                  <th className="px-5 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">

                    Rating

                  </th>

                  <th className="px-5 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">

                    Feedback

                  </th>

                  <th className="px-5 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">

                    Strengths

                  </th>

                  <th className="px-5 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">

                    Improvements

                  </th>

                  <th className="px-5 py-3 text-right text-sm font-semibold text-slate-600 dark:text-slate-300">

                    Actions

                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">

                {filteredRecords.map((record, index) => (

                  <tr

                    key={record._id || `${record.employeeId}-${index}`}

                    className="transition hover:bg-slate-50 dark:hover:bg-slate-800/60"

                  >

                    <td className="px-5 py-4">

                      <div className="font-medium">

                        {record.employeeName}

                      </div>

                      <div className="text-xs text-slate-400">

                        {record.employeeCode}

                      </div>

                    </td>

                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">

                      {record.department}

                    </td>

                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">

                      {formatDate(record.reviewDate)}

                    </td>

                    <td className="px-5 py-4">

                      {renderStars(record.rating)}

                    </td>

                    <td className="px-5 py-4">

                      <div className="max-w-xs text-sm text-slate-600 dark:text-slate-300">

                        {record.feedback || "—"}

                      </div>

                    </td>

                    <td className="px-5 py-4">

                      <div className="max-w-xs text-sm text-slate-600 dark:text-slate-300">

                        {record.strengths || "—"}

                      </div>

                    </td>

                    <td className="px-5 py-4">

                      <div className="max-w-xs text-sm text-slate-600 dark:text-slate-300">

                        {record.improvements || "—"}

                      </div>

                    </td>

                    <td className="px-5 py-4">

                      <div className="flex items-center justify-end gap-2">

                        <button

                          type="button"

                          onClick={() =>

                            navigate(`/employees/${record.employeeId}?tab=Performance`)

                          }

                          className="rounded-lg p-2 text-purple-500 transition hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-900/20"

                          title="View performance review"

                          aria-label="View performance review"

                        >

                          <Eye size={20} />

                        </button>

                        {!isEmployee && !isHRRestrictedReview(record) && (

                          <>

                            <button

                              type="button"

                              onClick={() => openEditModal(record)}

                              className="rounded-lg p-2 text-blue-500 transition hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"

                              title="Edit performance review"

                              aria-label="Edit performance review"

                            >

                              <Pencil size={20} />

                            </button>

                            <button

                              type="button"

                              onClick={() => handleDelete(record)}

                              disabled={saving}

                              className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-900/20"

                              title="Delete performance review"

                              aria-label="Delete performance review"

                            >

                              <Trash2 size={20} />

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

      {/* Add / Edit Performance Review Modal */}

      {showModal && (

        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/60 p-2 sm:items-center sm:p-4">

          <div className="my-auto max-h-[95dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl sm:max-h-[90vh] dark:border-slate-700 dark:bg-slate-900">

            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6 dark:border-slate-700">

              <div>

                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">

                  {editingReview ? "Edit Performance Review" : "Add Performance Review"}

                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">

                  Record an employee performance review.

                </p>

              </div>

              <button

                type="button"

                onClick={closeModal}

                disabled={saving}

                className="rounded-lg px-2 py-1 text-xl text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"

              >

                ×

              </button>

            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-4 sm:p-6">

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">

                    Employee

                  </label>

                  <select

                    name="employeeId"

                    value={form.employeeId}

                    onChange={handleFormChange}

                    disabled={Boolean(editingReview) || saving}

                    required

                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"

                  >

                    <option value="">Select employee</option>

                    {employees

                      .filter((employee) => !isHRRestrictedEmployee(employee))

                      .map((employee) => (

                        <option key={employee._id} value={employee._id}>

                          {employee.name || "Unknown Employee"}{employee.department ? ` — ${employee.department}` : ""}

                        </option>

                      ))}

                  </select>

                </div>

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">

                    Review Date

                  </label>

                  <input

                    type="date"

                    name="reviewDate"

                    value={form.reviewDate}

                    onChange={handleFormChange}

                    disabled={saving}

                    required

                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"

                  />

                </div>

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">

                    Rating

                  </label>

                  <select

                    name="rating"

                    value={form.rating}

                    onChange={handleFormChange}

                    disabled={saving}

                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"

                  >

                    <option value={5}>5 - Excellent</option>

                    <option value={4}>4 - Very Good</option>

                    <option value={3}>3 - Good</option>

                    <option value={2}>2 - Needs Improvement</option>

                    <option value={1}>1 - Poor</option>

                  </select>

                </div>

              </div>

              <div>

                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">

                  Feedback

                </label>

                <textarea

                  name="feedback"

                  value={form.feedback}

                  onChange={handleFormChange}

                  disabled={saving}

                  rows={3}

                  placeholder="Overall feedback..."

                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"

                />

              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">

                    Strengths

                  </label>

                  <textarea

                    name="strengths"

                    value={form.strengths}

                    onChange={handleFormChange}

                    disabled={saving}

                    rows={3}

                    placeholder="Key strengths..."

                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"

                  />

                </div>

                <div>

                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">

                    Improvements

                  </label>

                  <textarea

                    name="improvements"

                    value={form.improvements}

                    onChange={handleFormChange}

                    disabled={saving}

                    rows={3}

                    placeholder="Areas for improvement..."

                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"

                  />

                </div>

              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end dark:border-slate-700">

                <button

                  type="button"

                  onClick={closeModal}

                  disabled={saving}

                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:w-auto disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"

                >

                  Cancel

                </button>

                <button

                  type="submit"

                  disabled={saving}

                  className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"

                >

                  {saving ? "Saving..." : editingReview ? "Update Review" : "Save Review"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  );

}

function StatCard({ title, value, icon }) {

  return (

    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm text-slate-500 dark:text-slate-400">

            {title}

          </p>

          <p className="mt-1 text-2xl font-bold">

            {value}

          </p>

        </div>

        <div className="rounded-lg bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">

          {icon}

        </div>

      </div>

    </div>

  );

}

export default Performance;