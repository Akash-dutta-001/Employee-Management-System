import { useEffect, useState } from "react";



import {



  Users,



  UserCheck,



  UserX,



  ClipboardList,



  CheckCircle,



  Clock,



  AlertCircle,



  ArrowRight,



  Wallet,



  CalendarCheck,



  CalendarDays,



  RefreshCw,



} from "lucide-react";



import { useNavigate } from "react-router-dom";



import { useAuth } from "../context/AuthContext";



import { usePermissions } from "../context/PermissionContext";



import { getEmployees } from "../api/employeeApi";



import { getPayrollRecords } from "../api/payrollApi";



function Dashboard() {



  const navigate = useNavigate();



  const { user } = useAuth();



  const { role, canAccess } = usePermissions();



  const isEmployee = role === "Employee";



  const canManageEmployees = !isEmployee && canAccess("employees");



  const [employees, setEmployees] = useState([]);



  const [payrollRecords, setPayrollRecords] = useState([]);



  const [loading, setLoading] = useState(true);



  const [error, setError] = useState("");



  useEffect(() => {



    loadDashboardData();



  }, [role, user?.employeeId]);



  const loadDashboardData = async () => {



    try {



      setLoading(true);



      setError("");



      const [employeeData, payrollData] = await Promise.all([



        getEmployees(),



        getPayrollRecords(),



      ]);



      const visibleEmployees = employeeData || [];



      const visiblePayroll = payrollData || [];



      setEmployees(visibleEmployees);



      setPayrollRecords(visiblePayroll);



    } catch (err) {



      console.error(err);



      setError(



        err.response?.data?.message ||



        "Unable to load dashboard data"



      );



    } finally {



      setLoading(false);



    }



  };



  // ============================================================



  // CALCULATE DASHBOARD DATA



// ============================================================



const totalEmployees = employees.length;



const activeEmployees = employees.filter(



  (employee) => employee.status === "Active"



).length;



const inactiveEmployees = employees.filter(



  (employee) => employee.status === "Inactive"



).length;



const allTasks = employees.flatMap(



  (employee) => employee.tasks || []



);



const totalTasks = allTasks.length;



const completedTasks = allTasks.filter(



  (task) => task.status === "Completed"



).length;



const inProgressTasks = allTasks.filter(



  (task) => task.status === "In Progress"



).length;



const pendingTasks = allTasks.filter(



  (task) => task.status === "Pending"



).length;



const reviewTasks = allTasks.filter(



  (task) => task.status === "Review"



).length;



// ============================================================



// ATTENDANCE, LEAVE & PAYROLL SUMMARY



// ============================================================



const today = new Date();



const todayKey = today.toISOString().slice(0, 10);



const todayAttendance = employees.flatMap((employee) =>



  Array.isArray(employee.attendance)



    ? employee.attendance.filter((record) => {



      const recordDate = record.date



        ? new Date(record.date).toISOString().slice(0, 10)



        : "";



      return recordDate === todayKey;



    })



    : []



);



const presentToday = todayAttendance.filter(



  (record) => record.status === "Present"



).length;



const lateToday = todayAttendance.filter(



  (record) => record.status === "Late"



).length;



const absentToday = todayAttendance.filter(



  (record) => record.status === "Absent"



).length;



const pendingLeaves = employees.reduce((count, employee) => {



  const leaves = Array.isArray(employee.leaves) ? employee.leaves : [];



  return (



    count +



    leaves.filter((leave) => leave.status === "Pending").length



  );



}, 0);



const paidPayroll = payrollRecords



  .filter((record) => record.status === "Paid")



  .reduce(



    (total, record) => total + Number(record.netSalary || 0),



    0



  );



const pendingPayroll = payrollRecords



  .filter((record) => record.status === "Pending")



  .reduce(



    (total, record) => total + Number(record.netSalary || 0),



    0



  );



const formatCurrency = (amount) =>



  `₹${Number(amount || 0).toLocaleString("en-IN")}`;



// ============================================================



// LOADING



// ============================================================



if (loading) {



  return (



    <div className="flex min-h-[500px] items-center justify-center">



      <div className="text-center">



        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600" />



        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">



          Loading dashboard...



        </p>



      </div>



    </div>



  );



}



// ============================================================



// DASHBOARD



// ============================================================



return (



  <div className="min-h-screen min-w-0 bg-slate-100 p-4 dark:bg-slate-900 sm:p-5 lg:p-6">



    {/* HEADER */}



    <div className="mb-6">



      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">



        <div>



          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">



            Dashboard



          </h1>



          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">



            Overview of your employee management system



          </p>



        </div>



        <button



          onClick={loadDashboardData}



          disabled={loading}



          className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"



        >



          <RefreshCw



            size={17}



            className={loading ? "animate-spin" : ""}



          />



          Refresh



        </button>



      </div>



    </div>



    {/* ERROR */}



    {error && (



      <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">



        <AlertCircle size={20} />



        <span>{error}</span>



      </div>



    )}



    {/* ========================================================



          EMPLOYEE / OWN INFORMATION STATS



      \\======================================================== */}



    {isEmployee ? (



      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">



        <StatCard



          icon={<Users size={22} />}



          title="My Profile"



          value={employees.length > 0 ? "Active" : "—"}



          description="Your employee profile"



        />



        <StatCard



          icon={<ClipboardList size={22} />}



          title="My Tasks"



          value={totalTasks}



          description="Your assigned tasks"



        />



        <StatCard



          icon={<CalendarCheck size={22} />}



          title="My Attendance"



          value={presentToday}



          description="Present today"



        />



        <StatCard



          icon={<Wallet size={22} />}



          title="My Payroll"



          value={formatCurrency(



            payrollRecords.reduce(



              (total, record) =>



                total + Number(record.netSalary || 0),



              0



            )



          )}



          description="Visible payroll records"



        />



      </div>



    ) : (



      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">



        <StatCard



          icon={<Users size={22} />}



          title="Total Employees"



          value={totalEmployees}



          description="All employees"



        />



        <StatCard



          icon={<UserCheck size={22} />}



          title="Active Employees"



          value={activeEmployees}



          description="Currently active"



        />



        <StatCard



          icon={<UserX size={22} />}



          title="Inactive Employees"



          value={inactiveEmployees}



          description="Currently inactive"



        />



        <StatCard



          icon={<ClipboardList size={22} />}



          title="Total Tasks"



          value={totalTasks}



          description="Across all employees"



        />



      </div>



    )}



      {/* ========================================================



          ATTENDANCE / LEAVE / PAYROLL



      \\======================================================== */}



    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">



      <StatCard



        icon={<CalendarCheck size={22} />}



        title={isEmployee ? "Present Today" : "Present Today"}



        value={presentToday}



        description={isEmployee ? "Your attendance" : `${lateToday} late today`}



      />



      <StatCard



        icon={<UserX size={22} />}



        title={isEmployee ? "Absent Today" : "Absent Today"}



        value={absentToday}



        description={isEmployee ? "Your attendance" : "Today's attendance"}



      />



      <StatCard



        icon={<CalendarDays size={22} />}



        title={isEmployee ? "My Pending Leave" : "Pending Leaves"}



        value={pendingLeaves}



        description={isEmployee ? "Your leave requests" : "Awaiting approval"}



      />



      <StatCard



        icon={<Wallet size={22} />}



        title={isEmployee ? "Pending Payroll" : "Pending Payroll"}



        value={formatCurrency(pendingPayroll)}



        description={



          isEmployee



            ? "Your pending payroll"



            : `${payrollRecords.filter((record) => record.status === "Pending").length} pending records`



        }



      />



    </div>



    {/* ========================================================



          PAYROLL SUMMARY



      \\======================================================== */}



    <div className="mb-6 min-w-0 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800 sm:p-6">



      <div className="mb-5 flex items-center justify-between">



        <div>



          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">



            Payroll Summary



          </h2>



          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">



            Current payroll records



          </p>



        </div>



        <Wallet size={22} className="text-blue-600" />



      </div>



      <div className="grid gap-4 sm:grid-cols-2">



        <SummaryRow



          label="Paid Payroll"



          value={formatCurrency(paidPayroll)}



        />



        <SummaryRow



          label="Pending Payroll"



          value={formatCurrency(pendingPayroll)}



        />



      </div>



      <div className="mt-5 flex flex-wrap gap-3">



        <button



          onClick={() => navigate("/payroll")}



          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"



        >



          Open Payroll



        </button>



        {canAccess("reports") && (



          <button



            onClick={() => navigate("/reports")}



            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"



          >



            View Reports



          </button>



        )}



      </div>



    </div>



    {/* ========================================================



          TASK OVERVIEW



      \\======================================================== */}



    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">



      <TaskCard



        icon={<Clock size={20} />}



        title="Pending"



        value={pendingTasks}



      />



      <TaskCard



        icon={<ClipboardList size={20} />}



        title="In Progress"



        value={inProgressTasks}



      />



      <TaskCard



        icon={<AlertCircle size={20} />}



        title="Review"



        value={reviewTasks}



      />



      <TaskCard



        icon={<CheckCircle size={20} />}



        title="Completed"



        value={completedTasks}



      />



    </div>



    {/* ========================================================



          TASK PROGRESS



      \\======================================================== */}



    <div className="mb-6 grid min-w-0 gap-4 lg:grid-cols-2 lg:gap-6">



      {/* TASK PROGRESS */}



      <div className="min-w-0 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800 sm:p-6">



        <div className="mb-5 flex items-center justify-between">



          <div>



            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">



              Task Progress



            </h2>



            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">



              Current task status



            </p>



          </div>



          <ClipboardList



            size={22}



            className="text-blue-600"



          />



        </div>



        <div className="space-y-5">



          <ProgressRow



            label="Completed"



            value={completedTasks}



            total={totalTasks}



          />



          <ProgressRow



            label="In Progress"



            value={inProgressTasks}



            total={totalTasks}



          />



          <ProgressRow



            label="Review"



            value={reviewTasks}



            total={totalTasks}



          />



          <ProgressRow



            label="Pending"



            value={pendingTasks}



            total={totalTasks}



          />



        </div>



      </div>



      {/* EMPLOYEE OVERVIEW - management roles only */}



      {!isEmployee && (



        <div className="min-w-0 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800 sm:p-6">



          <div className="mb-5 flex items-center justify-between">



            <div>



              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">



                Employee Overview



              </h2>



              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">



                Current workforce status



              </p>



            </div>



            <Users



              size={22}



              className="text-blue-600"



            />



          </div>



          <div className="space-y-5">



            <ProgressRow



              label="Active Employees"



              value={activeEmployees}



              total={totalEmployees}



            />



            <ProgressRow



              label="Inactive Employees"



              value={inactiveEmployees}



              total={totalEmployees}



            />



          </div>



        </div>



      )}



    </div>



    {/* ========================================================



        QUICK ACTIONS



    \\======================================================== */}



    <div className="mb-6 min-w-0 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800 sm:p-6">



        <div className="mb-5">



          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">



            Quick Actions



          </h2>



          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">



            {isEmployee



              ? "Quickly access your employee information"



              : "Quickly access the main employee management modules"}



          </p>



        </div>



        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">



          {canManageEmployees && (



            <QuickAction



              label="Employees"



              description="Manage employees"



              onClick={() => navigate("/employees")}



            />



          )}



          {isEmployee && user?.employeeId && (



            <QuickAction



              label="My Profile"



              description="View your profile"



              onClick={() =>



                navigate(`/employees/${user.employeeId}`)



              }



            />



          )}



          {canAccess("attendance") && (



            <QuickAction



              label="Attendance"



              description={isEmployee ? "View your attendance" : "Manage attendance"}



              onClick={() => navigate("/attendance")}



            />



          )}



          {canAccess("leave") && (



            <QuickAction



              label="Leave"



              description={isEmployee ? "Apply or view your leave" : "Review leave requests"}



              onClick={() => navigate("/leave")}



            />



          )}



          {canAccess("tasks") && (



            <QuickAction



              label="Tasks"



              description={isEmployee ? "View your tasks" : "Manage employee tasks"}



              onClick={() => navigate("/tasks")}



            />



          )}



        </div>



    </div>



    {/* ========================================================



        RECENT EMPLOYEES



      \\======================================================== */}



            {canManageEmployees && (



        <div className="rounded-2xl bg-white shadow-sm dark:bg-slate-800">



      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 dark:border-slate-700 sm:px-6 sm:py-5">



        <div>



          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">



            Employees



          </h2>



          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">



            Employees currently in the system



          </p>



        </div>



        <button



          onClick={() => navigate("/employees")}



          className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"



        >



          View All



          <ArrowRight size={16} />



        </button>



      </div>



      <div className="divide-y divide-slate-100 dark:divide-slate-700">



        {employees.length === 0 ? (



          <div className="px-6 py-12 text-center">



            <Users



              size={36}



              className="mx-auto text-slate-300"



            />



            <p className="mt-3 font-medium text-slate-700 dark:text-slate-300">



              No employees found



            </p>



            <button



              onClick={() => navigate("/employees")}



              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"



            >



              Add Employee



            </button>



          </div>



        ) : (



          employees.slice(0, 5).map((employee) => (



            <div



              key={employee._id}



              className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-700/30 sm:px-6"



            >



              <div className="flex min-w-0 items-center gap-3">



                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">



                  {employee.avatar ||



                    employee.name



                      ?.split(" ")



                      .map(



                        (name) => name[0]



                      )



                      .join("")



                      .slice(0, 2)



                      .toUpperCase()}



                </div>



                <div>



                  <p className="break-words font-semibold text-slate-900 dark:text-white">



                    {employee.name}



                  </p>



                  <p className="text-sm text-slate-500 dark:text-slate-400">



                    {employee.role}



                  </p>



                </div>



              </div>



              <div className="flex items-center gap-2 sm:gap-4">



                <span



                  className={



                    employee.status === "Active"



                      ? "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400"



                      : "rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400"



                  }



                >



                  {employee.status}



                </span>



                <button



                  onClick={() =>



                    navigate(



                      `/employees/${employee._id}`



                    )



                  }



                  className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"



                  title="View Employee"



                >



                  <ArrowRight size={18} />



                </button>



              </div>



            </div>



          ))



        )}



      </div>



    </div>



      )}



    </div>



  );



}



/* ============================================================



   STAT CARD



\\============================================================ */



function StatCard({



  icon,



  title,



  value,



  description,



}) {



  return (



    <div className="min-w-0 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800 sm:p-5">



      <div className="flex items-start justify-between">



        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">



          {icon}



        </div>



      </div>



      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">



        {title}



      </p>



      <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">



        {value}



      </p>



      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">



        {description}



      </p>



    </div>



  );



}



/* ============================================================



   TASK CARD



\\============================================================ */



function TaskCard({



  icon,



  title,



  value,



}) {



  return (



    <div className="min-w-0 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800 sm:p-5">



      <div className="flex min-w-0 items-center gap-3">



        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">



          {icon}



        </div>



        <div>



          <p className="text-sm text-slate-500 dark:text-slate-400">



            {title}



          </p>



          <p className="text-xl font-bold text-slate-900 dark:text-white">



            {value}



          </p>



        </div>



      </div>



    </div>



  );



}



/* ============================================================



   PROGRESS ROW



\\============================================================ */



function ProgressRow({



  label,



  value,



  total,



}) {



  const percentage =



    total > 0



      ? Math.round((value / total) * 100)



      : 0;



  return (



    <div>



      <div className="mb-2 flex items-center justify-between">



        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">



          {label}



        </span>



        <span className="text-sm font-semibold text-slate-900 dark:text-white">



          {value}{" "}



          <span className="font-normal text-slate-400">



            ({percentage}%)



          </span>



        </span>



      </div>



      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">



        <div



          className="h-full rounded-full bg-blue-600 transition-all duration-500"



          style={{



            width: `${percentage}%`,



          }}



        />



      </div>



    </div>



  );



}



function SummaryRow({ label, value }) {



  return (



    <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-900 sm:px-4">



      <span className="text-sm text-slate-500 dark:text-slate-400">



        {label}



      </span>



      <span className="min-w-0 break-words text-right font-semibold text-slate-900 dark:text-white">



        {value}



      </span>



    </div>



  );



}



function QuickAction({ label, description, onClick }) {



  return (



    <button



      onClick={onClick}



      className="group flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-900 dark:hover:bg-blue-950/30"



    >



      <div>



        <p className="break-words font-semibold text-slate-900 dark:text-white">



          {label}



        </p>



        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">



          {description}



        </p>



      </div>



      <ArrowRight



        size={18}



        className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600 dark:text-slate-500 dark:group-hover:text-blue-400"



      />



    </button>



  );



}



export default Dashboard;