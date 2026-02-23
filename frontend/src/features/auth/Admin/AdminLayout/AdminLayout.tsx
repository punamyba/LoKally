

import { Outlet } from "react-router-dom";
import AdminSidebar from "../Sidebar/AdminSidebar";
import "./AdminLayout.css";

export default function AdminLayout() {
  return (
    <div className="adl-root">
      {/* Left sidebar — always visible */}
      <AdminSidebar />

      {/* Right content area — changes based on route */}
      <main className="adl-main">
        <Outlet />
      </main>
    </div>
  );
}
