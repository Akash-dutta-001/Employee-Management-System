
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CheckSquare,
  CalendarDays,
  Wallet,
  BarChart3,
  FileText,
  FolderOpen,
  Settings,
  UserCircle2,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePermissions } from "../context/PermissionContext";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, module: "dashboard" },
  { name: "Employees", icon: Users, module: "employees" },
  { name: "Attendance", icon: CalendarCheck, module: "attendance" },
  { name: "Tasks", icon: CheckSquare, module: "tasks" },
  { name: "Leave", icon: CalendarDays, module: "leave" },
  { name: "Payroll", icon: Wallet, module: "payroll" },
  { name: "Performance", icon: BarChart3, module: "performance" },
  { name: "Reports", icon: FileText, module: "reports" },
  { name: "Documents", icon: FolderOpen, module: "documents" },
  { name: "Settings", icon: Settings, module: "settings" },
];

function Sidebar({ isOpen = false, onClose = () => {} }) {
  const { user } = useAuth();
  const { role, canAccess } = usePermissions();

  const visibleItems = menuItems.filter((item) => {
    if (item.module === "dashboard") return true;
    if (item.module === "employees") return role === "Admin" || role === "HR";
    if (item.module === "documents") return role === "Employee";
    return canAccess(item.module);
  });

  return (
    <>
      {/* MOBILE OVERLAY */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-slate-800/80 bg-[#07111f] text-slate-300 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* BRAND */}
        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-slate-800/80 px-6">
          <div className="flex items-center">
            <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-900/30">
              <Users size={21} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Employee<span className="text-blue-500">Hub</span>
              </h1>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
                Workforce
              </p>
            </div>
          </div>

          {/* MOBILE CLOSE BUTTON */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto px-3 py-6">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Main Menu
          </p>

          <div className="space-y-1">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const path =
                item.module === "dashboard" ? "/" : `/${item.module}`;

              return (
                <NavLink
                  key={item.name}
                  to={path}
                  end={item.module === "dashboard"}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                        : "text-slate-400 hover:bg-slate-800/70 hover:text-white"
                    }`
                  }
                >
                  <Icon size={19} strokeWidth={1.9} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}

            {role === "Employee" && (user?.employeeId || user?.employee) && (
              <>
                <div className="my-5 border-t border-slate-800/80" />
                <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  My Workspace
                </p>
                <NavLink
                  to={`/employees/${user.employeeId || user.employee}`}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                        : "text-slate-400 hover:bg-slate-800/70 hover:text-white"
                    }`
                  }
                >
                  <UserCircle2 size={19} />
                  <span>My Profile</span>
                </NavLink>
              </>
            )}
          </div>
        </nav>

        {/* USER FOOTER */}
        <div className="border-t border-slate-800/80 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-slate-900/70 px-3 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {user?.name || "User"}
              </p>
              <p className="truncate text-xs text-slate-500">
                {user?.role || "Employee"}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
