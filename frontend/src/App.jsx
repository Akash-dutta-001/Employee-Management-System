import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";

import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import EmployeeProfile from "./pages/EmployeeProfile";
import Attendance from "./pages/Attendance";
import Tasks from "./pages/Tasks";
import Leave from "./pages/Leave";
import Payroll from "./pages/Payroll";
import Performance from "./pages/Performance";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Documents from "./pages/Documents";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import PermissionRoute from "./components/PermissionRoute";

import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import VerifyEmail from "./pages/VerifyEmail";
import VerifyNewEmail from "./pages/VerifyNewEmail";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =================================================
            PUBLIC ROUTE
        ================================================= */}

        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/verify-new-email/:token" element={<VerifyNewEmail />} />


        {/* =================================================
            AUTHENTICATED ROUTES
        ================================================= */}

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>

            {/* Dashboard */}
            <Route path="/" element={<Dashboard />} />


            {/* =================================================
                EMPLOYEE MANAGEMENT
                Full Employees page requires "view".
                Employees only have "view_own", so they cannot
                open the complete employee management page.
            ================================================= */}

            <Route element={<PermissionRoute module="employees" action="view" />}>
              <Route
                path="/employees"
                element={<Employees />}
              />
            </Route>


            {/* =================================================
                EMPLOYEE PROFILE
                Admin/HR can view any profile.
                Employee can pass with view_own, while the
                backend must enforce ownership for the requested ID.
            ================================================= */}

            <Route element={<PermissionRoute module="employees" action="view" />}>
              <Route
                path="/employees/:id"
                element={<EmployeeProfile />}
              />
            </Route>


            {/* Attendance */}
            <Route element={<PermissionRoute module="attendance" action="view" />}>
              <Route
                path="/attendance"
                element={<Attendance />}
              />
            </Route>


            {/* Tasks */}
            <Route element={<PermissionRoute module="tasks" action="view" />}>
              <Route
                path="/tasks"
                element={<Tasks />}
              />
            </Route>


            {/* Leave */}
            <Route element={<PermissionRoute module="leave" action="view" />}>
              <Route
                path="/leave"
                element={<Leave />}
              />
            </Route>


            {/* Payroll */}
            <Route element={<PermissionRoute module="payroll" action="view" />}>
              <Route
                path="/payroll"
                element={<Payroll />}
              />
            </Route>


            {/* Performance */}
            <Route element={<PermissionRoute module="performance" action="view" />}>
              <Route
                path="/performance"
                element={<Performance />}
              />
            </Route>


            {/* Reports */}
            {/* Employee has no reports permission, so this remains blocked. */}
            <Route element={<PermissionRoute module="reports" action="view" />}>
              <Route
                path="/reports"
                element={<Reports />}
              />
            </Route>


            {/* Documents */}
            <Route path="/documents" element={<Documents />} />


            {/* Settings */}
            <Route element={<PermissionRoute module="settings" action="view" />}>
              <Route
                path="/settings"
                element={<Settings />}
              />
            </Route>

          </Route>
        </Route>


        {/* =================================================
            UNKNOWN ROUTES
        ================================================= */}

        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
