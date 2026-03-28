import { Link } from "react-router-dom";
import "./Footer.css";
import { Heart, Mail, Facebook, Instagram, Twitter, Sparkles, Map, Users, Shield } from "lucide-react";
import logo from "../../../../../assets/logo1.png";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="ft-root">
<div className="ft-inner">

        {/* Brand */}
        <div className="ft-brand">
          <div className="ft-logo">
            <img src={logo} alt="LoKally" className="ft-logo-img" />
            <div>
              <div className="ft-logo-name">LoKally</div>
              <div className="ft-logo-sub">NEPAL</div>
            </div>
          </div>
          <p className="ft-tagline">
            Discover Nepal's hidden gems, share your adventures, and explore authentic local experiences — powered by AI.
          </p>
          <div className="ft-socials">
            <a href="#" className="ft-social" aria-label="Facebook"><Facebook size={16} /></a>
            <a href="#" className="ft-social" aria-label="Instagram"><Instagram size={16} /></a>
            <a href="#" className="ft-social" aria-label="Twitter"><Twitter size={16} /></a>
            <a href="#" className="ft-social" aria-label="Email"><Mail size={16} /></a>
          </div>
        </div>

        {/* Links */}
        <div className="ft-links-group">
          <div className="ft-links-col">
            <div className="ft-col-title"><Map size={13} /> Explore</div>
            <Link to="/explore-map" className="ft-link">Map View</Link>
            <Link to="/ai-search" className="ft-link ft-link--ai"><Sparkles size={11} /> AI Search</Link>
            <Link to="/community" className="ft-link">Community</Link>
            <Link to="/home" className="ft-link">Home</Link>
          </div>
          <div className="ft-links-col">
            <div className="ft-col-title"><Users size={13} /> Account</div>
            <Link to="/profile" className="ft-link">My Profile</Link>
            <Link to="/settings" className="ft-link">Settings</Link>
            <Link to="/register" className="ft-link">Join LoKally</Link>
            <Link to="/contact" className="ft-link">Contact Us</Link>
          </div>
          <div className="ft-links-col">
            <div className="ft-col-title"><Shield size={13} /> Legal</div>
            <Link to="/privacy" className="ft-link">Privacy Policy</Link>
            <Link to="/terms" className="ft-link">Terms of Service</Link>
            <Link to="/cookies" className="ft-link">Cookies</Link>
            <Link to="/about" className="ft-link">About Us</Link>
          </div>
        </div>

        {/* Newsletter */}
        <div className="ft-newsletter">
          <div className="ft-nl-title">Stay in the loop</div>
          <p className="ft-nl-text">Get hidden gems and travel tips from Nepal directly to your inbox.</p>
          <div className="ft-nl-form">
            <input type="email" placeholder="your@email.com" className="ft-nl-input" />
            <button className="ft-nl-btn">Subscribe</button>
          </div>
        </div>

      </div>

      <div className="ft-divider" />

      <div className="ft-bottom">
        <p className="ft-copy">© {currentYear} <strong>LoKally Nepal</strong> — Crafted with <Heart size={12} fill="currentColor" /> in Nepal</p>
        <div className="ft-powered">
          <Sparkles size={12} /> AI-Powered Discovery
        </div>
      </div>

    </footer>
  );
}