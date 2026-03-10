import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Clock,
  MapPin,
  PlusCircle,
  Users,
  BarChart2,
  Settings,
  LogOut,
  MessageSquare,
  Users2,
} from "lucide-react";
import "./AdminSidebar.css";

const NAV_ITEMS = [
  { to: "/admin",             label: "Dashboard",        Icon: LayoutDashboard, end: true },
  { to: "/admin/pending",     label: "Pending",          Icon: Clock },
  { to: "/admin/places",      label: "All Places",       Icon: MapPin },
  { to: "/admin/add-place",   label: "Add Place",        Icon: PlusCircle },
  { to: "/admin/users",       label: "Users",            Icon: Users },
  { to: "/admin/contact",     label: "Contact Messages", Icon: MessageSquare },
  { to: "/admin/community",   label: "Community",        Icon: Users2 },        // ← NEW
  { to: "/admin/reports",     label: "Reports",          Icon: BarChart2 },
  { to: "/admin/settings",    label: "Settings",         Icon: Settings },
];

export default function AdminSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const initials = user.first_name?.[0]?.toUpperCase() || "A";

  return (
    <aside className="asb-root">

      <div className="asb-logo">
        <div className="asb-logo-mark">L</div>
        <div className="asb-logo-text">
          <span className="asb-logo-name">LoKally</span>
          <span className="asb-logo-tag">Admin Panel</span>
        </div>
      </div>

      <nav className="asb-nav">
        <div className="asb-nav-label">MAIN MENU</div>

        {NAV_ITEMS.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
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