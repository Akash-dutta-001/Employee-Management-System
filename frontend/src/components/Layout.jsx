
import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      <Topbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="ml-0 min-h-screen min-w-0 bg-slate-100 pt-16 dark:bg-slate-950 lg:ml-64">
        <div className="min-w-0 p-4 sm:p-5 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;
