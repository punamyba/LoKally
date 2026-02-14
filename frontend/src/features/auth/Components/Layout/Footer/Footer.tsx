import { Link } from "react-router-dom";
import "./Footer.css";
import { MapPin, Compass, Heart, Mail, Facebook, Instagram, Twitter, ExternalLink } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      {/* Wave Decoration */}
      <div className="footer-wave">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0 C150,80 350,0 600,50 C850,100 1050,20 1200,60 L1200,120 L0,120 Z" />
        </svg>
      </div>

      <div className="footer-container">
        {/* Main Footer Content */}
        <div className="footer-grid">
          {/* Brand Section */}
          <div className="footer-brand">
            <div className="footer-logo">
              <div className="footer-logo-icon">
                <MapPin size={28} strokeWidth={2.5} />
              </div>
              <div className="footer-logo-text">
                <span className="footer-logo-main">LoKally</span>
                <span className="footer-logo-sub">Explore Nepal</span>
              </div>
            </div>
            <p className="footer-tagline">
              Discover Nepal's hidden treasures, share your adventures, and connect with 
              fellow explorers. Every journey starts with a single step.
            </p>
            
            {/* Social Links */}
            <div className="footer-social">
              <a href="#" className="social-btn" aria-label="Facebook">
                <Facebook size={18} />
              </a>
              <a href="#" className="social-btn" aria-label="Instagram">
                <Instagram size={18} />
              </a>
              <a href="#" className="social-btn" aria-label="Twitter">
                <Twitter size={18} />
              </a>
              <a href="#" className="social-btn" aria-label="Email">
                <Mail size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h3 className="footer-heading">
              <Compass size={18} />
              Quick Links
            </h3>
            <ul className="footer-links">
              <li>
                <Link to="/explore-map">
                  Explore Map
                  <ExternalLink size={14} />
                </Link>
              </li>
              <li>
                <Link to="/dashboard">
                  Dashboard
                  <ExternalLink size={14} />
                </Link>
              </li>
              <li>
                <Link to="/about">
                  About Us
                  <ExternalLink size={14} />
                </Link>
              </li>
              <li>
                <Link to="/contact">
                  Contact
                  <ExternalLink size={14} />
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div className="footer-section">
            <h3 className="footer-heading">
              <Heart size={18} />
              Community
            </h3>
            <ul className="footer-links">
              <li>
                <Link to="/register">
                  Join Community
                  <ExternalLink size={14} />
                </Link>
              </li>
              <li>
                <Link to="/guidelines">
                  Guidelines
                  <ExternalLink size={14} />
                </Link>
              </li>
              <li>
                <Link to="/blog">
                  Travel Blog
                  <ExternalLink size={14} />
                </Link>
              </li>
              <li>
                <Link to="/success-stories">
                  Success Stories
                  <ExternalLink size={14} />
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="footer-section footer-newsletter">
            <h3 className="footer-heading">
              <Mail size={18} />
              Stay Updated
            </h3>
            <p className="newsletter-text">
              Get the latest hidden gems and travel tips delivered to your inbox.
            </p>
            <div className="newsletter-form">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="newsletter-input"
              />
              <button className="newsletter-btn">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="footer-stats">
          <div className="stat-item">
            <div className="stat-number">5,678+</div>
            <div className="stat-label">Explorers</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-number">1,234+</div>
            <div className="stat-label">Places Shared</div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-number">892+</div>
            <div className="stat-label">Verified Spots</div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <div className="footer-bottom-left">
            <p className="copyright">
              © {currentYear} <strong>LoKally</strong>. Crafted with <Heart size={14} fill="currentColor" /> in Nepal
            </p>
          </div>
          <div className="footer-bottom-right">
            <Link to="/privacy" className="footer-legal">Privacy Policy</Link>
            <span className="footer-dot">•</span>
            <Link to="/terms" className="footer-legal">Terms of Service</Link>
            <span className="footer-dot">•</span>
            <Link to="/cookies" className="footer-legal">Cookies</Link>
          </div>
        </div>
      </div>

      {/* Background Decoration */}
      <div className="footer-bg-decoration"></div>
    </footer>
  );
}