// AdminSidebar.tsx
// Location: src/features/auth/Admin/Sidebar/AdminSidebar.tsx
//
// Left navigation menu for admin dashboard.
// Uses Lucide React icons (same as your Home page).
// NavLink automatically adds active class when URL matches.

import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,  // Dashboard home icon
  Clock,            // Pending review
  MapPin,           // All places
  PlusCircle,       // Add place
  Users,            // Users list
  BarChart2,        // Reports
  Settings,         // Settings
  LogOut,           // Logout button
} from "lucide-react";
import "./AdminSidebar.css";

// Each nav item: where it goes, what label, which icon component
const NAV_ITEMS = [
  { to: "/admin",           label: "Dashboard",  Icon: LayoutDashboard, end: true },
  { to: "/admin/pending",   label: "Pending",    Icon: Clock },
  { to: "/admin/places",    label: "All Places", Icon: MapPin },
  { to: "/admin/add-place", label: "Add Place",  Icon: PlusCircle },
  { to: "/admin/users",     label: "Users",      Icon: Users },
  { to: "/admin/reports",   label: "Reports",    Icon: BarChart2 },
  { to: "/admin/settings",  label: "Settings",   Icon: Settings },
];

export default function AdminSidebar() {
  const navigate = useNavigate();

  // Logout: clear storage and redirect to login
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  // Get admin name from localStorage (set during login)
  const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const initials = user.first_name?.[0]?.toUpperCase() || "A";

  return (
    <aside className="asb-root">

      {/* ── LOGO ──────────────────────────────────── */}
      <div className="asb-logo">
        <div className="asb-logo-mark">L</div>
        <div className="asb-logo-text">
          <span className="asb-logo-name">LoKally</span>
          <span className="asb-logo-tag">Admin Panel</span>
        </div>
      </div>

      {/* ── NAV LINKS ─────────────────────────────── */}
      <nav className="asb-nav">
        <div className="asb-nav-label">MAIN MENU</div>

        {NAV_ITEMS.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            // isActive = true when current URL matches this link
            className={({ isActive }) =>
              `asb-navitem ${isActive ? "asb-navitem--active" : ""}`
            }
          >
            <Icon size={18} className="asb-navitem-icon" strokeWidth={2} />
            <span className="asb-navitem-label">{label}</span>
            <span className="asb-navitem-dot" />
          </NavLink>
        ))}
      </nav>

      {/* ── PROFILE + LOGOUT ──────────────────────── */}
      <div className="asb-bottom">
        <div className="asb-profile">
          <div className="asb-avatar">{initials}</div>
          <div className="asb-profile-info">
            <div className="asb-profile-name">
              {user.first_name} {user.last_name}
            </div>
            <div className="asb-profile-role">Administrator</div>
          </div>
        </div>

        <button className="asb-logout" onClick={handleLogout}>
          <LogOut size={15} strokeWidth={2} />
          Logout
        </button>
      </div>

    </aside>
  );
}
