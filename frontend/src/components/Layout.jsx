import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function Layout() {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <Sidebar />

      <Topbar />

      <main className="ml-64 min-h-screen bg-slate-100 pt-16 dark:bg-slate-950">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;