import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import "./Navbar.css";
import { LogOut, Menu, X, Bell, Users2, Mail, Compass, User } from "lucide-react";

const Navbar = () => {
  const [open, setOpen]         = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();

  const isLoggedIn = !!localStorage.getItem("token");
  const isHome     = location.pathname === "/home" || location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  const currentUser = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("currentUser") || "{}"); }
    catch { return {}; }
  }, [isLoggedIn]);

  const firstName = (currentUser?.first_name || currentUser?.name || "User")
    .toString().trim().split(" ")[0];

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

        {/* RIGHT: nav links + actions */}
        <div className="lk-actions">
          <nav className="lk-links">
            {isLoggedIn && (
              <NavLink to="/home"
                className={({ isActive }) => isActive ? "lk-link lk-link--active" : "lk-link"}>
                Home
              </NavLink>
            )}
            <NavLink to="/explore-map"
              className={({ isActive }) => isActive ? "lk-link lk-link--active" : "lk-link"}>
              Map View
            </NavLink>
            {isLoggedIn && (
              <NavLink to="/community"
                className={({ isActive }) => isActive ? "lk-link lk-link--active" : "lk-link"}>
                Community
              </NavLink>
            )}
            <NavLink to="/contact"
              className={({ isActive }) => isActive ? "lk-link lk-link--active" : "lk-link"}>
              Contact
            </NavLink>
          </nav>

          {/* Notification */}
          <button className="lk-iconBtn" type="button" aria-label="Notifications">
            <Bell size={20} />
            <span className="lk-dot" />
          </button>

          {/* User chip / auth */}
          {isLoggedIn ? (
            <button className="lk-userChip" type="button"
              onClick={() => navigate("/home")} aria-label="Profile">
              <span className="lk-userChip__avatar">
                {firstName.charAt(0).toUpperCase()}
              </span>
              <span className="lk-userChip__name">{firstName}</span>
            </button>
          ) : (
            <div className="lk-authBtns">
              <Link to="/" className="lk-btn lk-btn--ghost">Login</Link>
              <Link to="/register" className="lk-btn lk-btn--primary">Get Started</Link>
            </div>
          )}

          {/* Logout */}
          {isLoggedIn && (
            <button className="lk-logout" onClick={handleLogout} type="button">
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          )}

          {/* Mobile toggle */}
          <button className="lk-menuBtn" onClick={() => setOpen(!open)}
            aria-label="Toggle menu" type="button">
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
            <NavLink to="/home"
              className={({ isActive }) => isActive ? "lk-mItem lk-mItem--active" : "lk-mItem"}
              onClick={() => setOpen(false)}>
              <User size={18} /><span>Home</span>
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