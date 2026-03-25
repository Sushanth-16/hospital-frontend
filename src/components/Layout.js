import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

function Layout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="page-container">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
