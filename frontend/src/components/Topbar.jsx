import { useState } from "react";
import {
  Bell,
  ChevronDown,
  LogOut,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Topbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <header className="fixed left-64 right-0 top-0 z-40 h-16 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex h-full items-center justify-between px-6">

        {/* =====================================================
            LEFT
        ===================================================== */}

        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Employee Management System
          </p>
        </div>

        {/* =====================================================
            RIGHT
        ===================================================== */}

        <div className="flex items-center gap-4">

          {/* Notifications */}

          <button
            type="button"
            className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <Bell size={20} />

            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-500" />
          </button>

          {/* User Menu */}

          <div className="relative">

            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-800"
            >

              {/* Avatar */}

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                {user?.name
                  ? user.name.charAt(0).toUpperCase()
                  : "U"}
              </div>

              {/* User Information */}

              <div className="hidden text-left sm:block">
                <p className="max-w-32 truncate text-sm font-medium text-slate-900 dark:text-white">
                  {user?.name || "User"}
                </p>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {user?.role || "Employee"}
                </p>
              </div>

              <ChevronDown
                size={16}
                className={`text-slate-400 transition ${
                  menuOpen ? "rotate-180" : ""
                }`}
              />

            </button>

            {/* =================================================
                DROPDOWN
            ================================================= */}

            {menuOpen && (
              <div className="absolute right-0 top-12 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">

                {/* User Header */}

                <div className="border-b border-slate-200 px-4 py-4 dark:border-slate-700">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
                      {user?.name
                        ? user.name.charAt(0).toUpperCase()
                        : "U"}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {user?.name || "User"}
                      </p>

                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {user?.email || ""}
                      </p>
                    </div>

                  </div>

                  {/* Role */}

                  <div className="mt-3">
                    <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                      {user?.role || "Employee"}
                    </span>
                  </div>

                </div>

                {/* Profile */}

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/settings");
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <User size={17} />
                  Profile & Settings
                </button>

                {/* Logout */}

                <div className="border-t border-slate-200 p-2 dark:border-slate-700">

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    <LogOut size={17} />
                    Logout
                  </button>

                </div>

              </div>
            )}

          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;