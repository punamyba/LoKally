import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { MapPin, User, LogOut, Menu, X, Compass } from "lucide-react";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="logo">
          <div className="logo-icon">
            <MapPin size={24} strokeWidth={2.5} />
          </div>
          <div className="logo-text">
            <span className="logo-main">LoKally</span>
            <span className="logo-sub">Nepal</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="nav-center">
          <NavLink to="/explore-map" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <Compass size={18} />
            <span>Explore</span>
          </NavLink>
          
          {isLoggedIn && (
            <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
              <User size={18} />
              <span>Dashboard</span>
            </NavLink>
          )}
        </div>

        {/* Desktop Actions */}
        <div className="nav-right">
          {isLoggedIn ? (
            <>
              <div className="user-profile">
                <div className="user-avatar">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="user-info">
                  <span className="user-name">{currentUser.name || "User"}</span>
                  <span className="user-role">Explorer</span>
                </div>
              </div>
              <button onClick={handleLogout} className="btn btn-logout">
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="mobile-toggle" 
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="mobile-menu">
          <NavLink 
            to="/explore-map" 
            className={({ isActive }) => `mobile-link ${isActive ? "active" : ""}`}
            onClick={() => setOpen(false)}
          >
            <Compass size={20} />
            <span>Explore Map</span>
          </NavLink>
          
          {isLoggedIn && (
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => `mobile-link ${isActive ? "active" : ""}`}
              onClick={() => setOpen(false)}
            >
              <User size={20} />
              <span>Dashboard</span>
            </NavLink>
          )}

          <div className="mobile-divider"></div>

          {isLoggedIn ? (
            <>
              <div className="mobile-profile">
                <div className="user-avatar">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="user-info">
                  <span className="user-name">{currentUser.name || "User"}</span>
                  <span className="user-role">Explorer</span>
                </div>
              </div>
              <button onClick={handleLogout} className="btn btn-logout btn-full">
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <div className="mobile-actions">
              <Link to="/login" className="btn btn-ghost btn-full" onClick={() => setOpen(false)}>
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-full" onClick={() => setOpen(false)}>
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;