// AdminLayout.tsx
// This is the SHELL of the admin dashboard.
// It has two parts:
//   - Left side: AdminSidebar (navigation menu)
//   - Right side: <Outlet /> — this is where child pages render
//
// When you visit /admin/pending, React Router puts <AdminPending />
// inside the <Outlet /> automatically. Sidebar stays fixed.

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
