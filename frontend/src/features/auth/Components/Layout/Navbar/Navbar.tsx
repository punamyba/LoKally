import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";
import { LogOut, Menu, X, Users2, Mail, Compass, User, ChevronDown, Settings } from "lucide-react";
import NotificationDropdown from "../../../Notifications/NotificationDropdown";

const API    = (import.meta.env.VITE_API_URL || "http://localhost:5001/api");
const SERVER = import.meta.env.VITE_API_BASE_URL || API.replace("/api", "");

const getAvatarUrl = (avatar?: string | null): string | null => {
  if (!avatar) return null;
  if (avatar.includes("|||")) return avatar.split("|||")[1];
  if (avatar.startsWith("http")) return avatar;
  if (avatar.startsWith("/")) return `${SERVER}${avatar}`;
  return null;
};

const Navbar = () => {
  const [open,        setOpen]        = useState(false);
  const [scrolled,    setScrolled]    = useState(false);
  const [dropOpen,    setDropOpen]    = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try { return JSON.parse(localStorage.getItem("currentUser") || "{}"); }
    catch { return {}; }
  });

  const navigate = useNavigate();
  const location = useLocation();

  const isLoggedIn = !!localStorage.getItem("token");
  const isHome     = location.pathname === "/home" || location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setDropOpen(false); setOpen(false); }, [location.pathname]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${API}/user/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setCurrentUser(d.data);
          localStorage.setItem("currentUser", JSON.stringify(d.data));
        }
      })
      .catch(() => {});
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".lk-user-wrap")) setDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  const firstName = ((currentUser?.first_name || currentUser?.name || "User") as string).trim().split(" ")[0];
  const fullName  = `${currentUser?.first_name || ""} ${currentUser?.last_name || ""}`.trim() || "Explorer";
  const picUrl    = getAvatarUrl(currentUser?.avatar);
  const initials  = `${currentUser?.first_name?.[0] || ""}${currentUser?.last_name?.[0] || ""}`.toUpperCase() || "U";

  return (
    <header className={`lk-nav ${isHome && !scrolled ? "lk-nav--transparent" : "lk-nav--scrolled"}`}>
      <div className="lk-nav__inner">

        {/* Brand */}
        <Link to={isLoggedIn ? "/home" : "/"} className="lk-brand">
          <div className="lk-brand__text">
            <div className="lk-brand__main">LoKally</div>
            <div className="lk-brand__sub">NEPAL</div>
          </div>
        </Link>

        <div className="lk-actions">
          <nav className="lk-links">
            {isLoggedIn && (
              <NavLink to="/home" className={({ isActive }) => isActive ? "lk-link lk-link--active" : "lk-link"}>
                Home
              </NavLink>
            )}
            <NavLink to="/explore-map" className={({ isActive }) => isActive ? "lk-link lk-link--active" : "lk-link"}>
              Map View
            </NavLink>
            {isLoggedIn && (
              <NavLink to="/community" className={({ isActive }) => isActive ? "lk-link lk-link--active" : "lk-link"}>
                Community
              </NavLink>
            )}
            <NavLink to="/contact" className={({ isActive }) => isActive ? "lk-link lk-link--active" : "lk-link"}>
              Contact
            </NavLink>
          </nav>

          {/* Bell — NotificationDropdown is the bell + dropdown */}
          {isLoggedIn && <NotificationDropdown />}

          {/* User chip + dropdown */}
          {isLoggedIn ? (
            <div className="lk-user-wrap">
              <button className="lk-userChip" type="button" onClick={() => setDropOpen(d => !d)}>
                {picUrl
                  ? <img src={picUrl} alt={firstName} className="lk-userChip__pic" />
                  : <span className="lk-userChip__avatar">{initials}</span>
                }
                <span className="lk-userChip__name">{firstName}</span>
                <ChevronDown size={13} strokeWidth={2.5} className={`lk-chevron ${dropOpen ? "lk-chevron--open" : ""}`} />
              </button>

              {dropOpen && (
                <div className="lk-dropdown">
                  <div className="lk-drop-header">
                    <div className="lk-drop-avatar">
                      {picUrl
                        ? <img src={picUrl} alt={fullName} />
                        : <span>{initials}</span>
                      }
                    </div>
                    <div className="lk-drop-info">
                      <div className="lk-drop-name">{fullName}</div>
                      <div className="lk-drop-email">{currentUser?.email || ""}</div>
                    </div>
                  </div>

                  <div className="lk-drop-divider" />

                  <button className="lk-drop-item" onClick={() => navigate("/profile")} type="button">
                    <User size={15} strokeWidth={2} /> My Profile
                  </button>
                  <button className="lk-drop-item" onClick={() => navigate("/settings")} type="button">
                    <Settings size={15} strokeWidth={2} /> Settings
                  </button>

                  <div className="lk-drop-divider" />

                  <button className="lk-drop-item lk-drop-item--logout" onClick={handleLogout} type="button">
                    <LogOut size={15} strokeWidth={2} /> Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="lk-authBtns">
              <Link to="/" className="lk-btn lk-btn--ghost">Login</Link>
              <Link to="/register" className="lk-btn lk-btn--primary">Get Started</Link>
            </div>
          )}

          {/* Mobile toggle */}
          <button className="lk-menuBtn" onClick={() => setOpen(!open)} type="button">
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lk-mobile">
          <NavLink to="/explore-map"
            className={({ isActive }) => isActive ? "lk-mItem lk-mItem--active" : "lk-mItem"}
            onClick={() => setOpen(false)}>
            <Compass size={18} /><span>Explore</span>
          </NavLink>
          {isLoggedIn && (
            <NavLink to="/community"
              className={({ isActive }) => isActive ? "lk-mItem lk-mItem--active" : "lk-mItem"}
              onClick={() => setOpen(false)}>
              <Users2 size={18} /><span>Community</span>
            </NavLink>
          )}
          <NavLink to="/contact"
            className={({ isActive }) => isActive ? "lk-mItem lk-mItem--active" : "lk-mItem"}
            onClick={() => setOpen(false)}>
            <Mail size={18} /><span>Contact</span>
          </NavLink>
          {isLoggedIn && (
            <NavLink to="/profile"
              className={({ isActive }) => isActive ? "lk-mItem lk-mItem--active" : "lk-mItem"}
              onClick={() => setOpen(false)}>
              {picUrl
                ? <img src={picUrl} alt={firstName} className="lk-mItem__pic" />
                : <span className="lk-mItem__initial">{initials}</span>
              }
              <span>My Profile</span>
            </NavLink>
          )}
          <div className="lk-mDivider" />
          {isLoggedIn ? (
            <button className="lk-mLogout" onClick={handleLogout} type="button">
              <LogOut size={18} /><span>Logout</span>
            </button>
          ) : (
            <div className="lk-mAuth">
              <Link to="/" className="lk-btn lk-btn--ghost" onClick={() => setOpen(false)}>Login</Link>
              <Link to="/register" className="lk-btn lk-btn--primary" onClick={() => setOpen(false)}>Get Started</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;