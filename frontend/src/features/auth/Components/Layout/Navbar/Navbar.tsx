import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { User, LogOut, Menu, X, Compass, Bell, Search } from "lucide-react";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const isLoggedIn = !!localStorage.getItem("token");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("currentUser") || "{}");
    } catch {
      return {};
    }
  }, [isLoggedIn]);

  
  const firstName =
    (currentUser?.first_name || currentUser?.name || "User")
      .toString()
      .trim()
      .split(" ")[0];

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // later: navigate(`/explore-map?search=${encodeURIComponent(q)}`)
    // for now just go explore-map
    navigate("/explore-map");
  };

  return (
    <header className={`lk-nav ${scrolled ? "lk-nav--scrolled" : ""}`}>
      <div className="lk-nav__inner">
        {/* LEFT: Brand text only (no pin icon) */}
        <Link to={isLoggedIn ? "/home" : "/"} className="lk-brand">
          <div className="lk-brand__text">
            <div className="lk-brand__main">LoKally</div>
            <div className="lk-brand__sub">NEPAL</div>
          </div>
        </Link>

        {/* CENTER: Komoot-style search pill */}
        <form className="lk-search" onSubmit={onSearchSubmit}>
          <Search size={18} className="lk-search__icon" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="lk-search__input"
            placeholder="Search places, routes, highlights…"
          />
          {q.trim() ? (
            <button
              type="button"
              className="lk-search__clear"
              onClick={() => setQ("")}
              aria-label="Clear search"
            >
              ✕
            </button>
          ) : null}
        </form>

        {/* RIGHT: actions */}
        <div className="lk-actions">
          {/* Desktop nav links (small + clean) */}
          <nav className="lk-links">
            {isLoggedIn && (
              <NavLink
                to="/home"
                className={({ isActive }) =>
                  isActive ? "lk-link lk-link--active" : "lk-link"
                }
              >
                Home
              </NavLink>
            )}
            <NavLink
              to="/explore-map"
              className={({ isActive }) =>
                isActive ? "lk-link lk-link--active" : "lk-link"
              }
            >
              Map View
            </NavLink>
          </nav>

          {/* Notification */}
          <button className="lk-iconBtn" type="button" aria-label="Notifications">
            <Bell size={20} />
            <span className="lk-dot" />
          </button>

          {/* User chip (simple) */}
          {isLoggedIn ? (
            <button
              className="lk-userChip"
              type="button"
              onClick={() => navigate("/home")}
              aria-label="Profile"
            >
              <span className="lk-userChip__avatar">
                {firstName.charAt(0).toUpperCase()}
              </span>
              <span className="lk-userChip__name">{firstName}</span>
            </button>
          ) : (
            <div className="lk-authBtns">
              <Link to="/" className="lk-btn lk-btn--ghost">
                Login
              </Link>
              <Link to="/register" className="lk-btn lk-btn--primary">
                Get Started
              </Link>
            </div>
          )}

          {/* Logout (desktop) */}
          {isLoggedIn ? (
            <button className="lk-logout" onClick={handleLogout} type="button">
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          ) : null}

          {/* Mobile menu toggle */}
          <button
            className="lk-menuBtn"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            type="button"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {open && (
        <div className="lk-mobile">
          <NavLink
            to="/explore-map"
            className={({ isActive }) =>
              isActive ? "lk-mItem lk-mItem--active" : "lk-mItem"
            }
            onClick={() => setOpen(false)}
          >
            <Compass size={18} />
            <span>Explore</span>
          </NavLink>

          {isLoggedIn && (
            <NavLink
              to="/home"
              className={({ isActive }) =>
                isActive ? "lk-mItem lk-mItem--active" : "lk-mItem"
              }
              onClick={() => setOpen(false)}
            >
              <User size={18} />
              <span>Home</span>
            </NavLink>
          )}

          <div className="lk-mDivider" />

          {isLoggedIn ? (
            <button className="lk-mLogout" onClick={handleLogout} type="button">
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          ) : (
            <div className="lk-mAuth">
              <Link to="/" className="lk-btn lk-btn--ghost" onClick={() => setOpen(false)}>
                Login
              </Link>
              <Link
                to="/register"
                className="lk-btn lk-btn--primary"
                onClick={() => setOpen(false)}
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
