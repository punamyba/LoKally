import React, { useState } from 'react';
import './home.css';
import { 
  Search, 
  MapPin, 
  Users, 
  Award, 
  Map, 
  Upload, 
  Compass,
  Mountain,
  Droplets,
  Church,
  Waves,
  Home as HomeIcon,
  Menu,
  X,
  User,
  Heart,
  MessageCircle,
  Star
} from 'lucide-react';
import { useNavigate } from "react-router-dom";


const Home = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const categories = [
    { name: 'Mountains', icon: <Mountain />, count: 45 },
    { name: 'Waterfalls', icon: <Droplets />, count: 32 },
    { name: 'Temples', icon: <Church />, count: 67 },
    { name: 'Lakes', icon: <Waves />, count: 28 },
    { name: 'Villages', icon: <HomeIcon />, count: 54 },
  ];

  const featuredPlaces = [
    {
      id: 1,
      name: 'Lumbini, Nepal',
      image: 'https://lumbinidevtrust.gov.np/',
      info: '167 Recommend Stay',
      likes: 234,
      comments: 45,
      verified: true
    },
    {
      id: 2,
      name: 'Pokhara, Nepal',
      image: '',
      info: '189 Recommend Stay',
      likes: 189,
      comments: 32,
      verified: true
    },
    {
      id: 3,
      name: 'Chitwan, Nepal',
      image: '',
      info: '123 Recommend Stay',
      likes: 156,
      comments: 28,
      verified: true
    }
  ];
  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const navigate = useNavigate();

  return (
    <div className="home-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-circle">L</div>
            <div className="logo-text">LoKally</div>
          </div>
          
          <nav className={`nav-links ${menuOpen ? 'active' : ''}`}>
            <a href="#map">Map</a>
            <a href="#explore">Explore</a>
            <a href="#community">Community</a>
            <a href="#about">About</a>
          </nav>
          
          <div className="desktop-actions">
            <button className="add-btn">
              <Upload size={18} />
              Add Place
            </button>
            <button onClick={logout}>Logout</button>
            <div className="profile-circle">
              <User size={20} />
            </div>
          </div>
          
          <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="main">
        {/* Hero */}
        <div className="hero">
          <h1 className="hero-title">Discover Nepal's Hidden Gems</h1>
          <p className="hero-subtitle">Explore, Share & Verify lesser-known destinations</p>
        </div>

        {/* Search */}
        <div className="search-bar">
          <Search className="search-icon" size={20} />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Where are you going?"
          />
          <button className="filter-btn">Filter</button>
        </div>

        {/* Stats */}
        <div className="stats">
          <div className="stat-card">
            <MapPin size={24} color="#167ee0" />
            <div>
              <div className="stat-number">1,234</div>
              <div className="stat-label">Hidden Places</div>
            </div>
          </div>
          <div className="stat-card">
            <Users size={24} color="#1b8d28" />
            <div>
              <div className="stat-number">5,678</div>
              <div className="stat-label">Explorers</div>
            </div>
          </div>
          <div className="stat-card">
            <Award size={24} color="#ff9500" />
            <div>
              <div className="stat-number">892</div>
              <div className="stat-label">Verified</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
        <div 
            className="action-card"
            onClick={() => navigate("/explore-map")}
            style={{ cursor: "pointer" }}
            >
            <Map size={40} color="#167ee0" />
            <h3 className="action-title">Explore Map</h3>
            <p className="action-desc">View all hidden places</p>
        </div>

          <div className="action-card">
            <Upload size={40} color="#1b8d28" />
            <h3 className="action-title">Add Place</h3>
            <p className="action-desc">Share your discovery</p>
          </div>
          <div className="action-card">
            <Compass size={40} color="#ff9500" />
            <h3 className="action-title">Recommendations</h3>
            <p className="action-desc">Places you'll love</p>
          </div>
        </div>

        {/* Categories */}
        <h2 className="section-title">Explore by Category</h2>
        <div className="categories">
          {categories.map((cat, idx) => (
            <div key={idx} className="category-card">
              <div className="category-icon">{cat.icon}</div>
              <div className="category-name">{cat.name}</div>
              <div className="category-count">{cat.count} places</div>
            </div>
          ))}
        </div>

        {/* Featured Places */}
        <h2 className="section-title">Featured Destinations</h2>
        <div className="places-grid">
          {featuredPlaces.map((place) => (
            <div key={place.id} className="place-card">
              <img src={place.image} alt={place.name} className="place-image" />
              {place.verified && (
                <div className="verified-badge">
                  <Star size={14} fill="#fff" />
                  Verified
                </div>
              )}
              <div className="place-overlay">
                <div className="place-name">{place.name}</div>
                <div className="place-info">{place.info}</div>
                <div className="place-actions">
                  <span>
                    <Heart size={16} /> {place.likes}
                  </span>
                  <span>
                    <MessageCircle size={16} /> {place.comments}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="cta">
          <h2 className="cta-title">Found a Hidden Gem?</h2>
          <p className="cta-text">Share it with the community and help others discover Nepal's beauty</p>
          <button className="cta-button">
            <Upload size={20} />
            Add Your Discovery
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div>
            <h3 className="footer-title">LoKally</h3>
            <p className="footer-text">Discover Nepal's hidden treasures</p>
          </div>
          <div>
            <h4 className="footer-heading">Quick Links</h4>
            <a href="#" className="footer-link">About Us</a>
            <a href="#" className="footer-link">How It Works</a>
            <a href="#" className="footer-link">FAQs</a>
          </div>
          <div>
            <h4 className="footer-heading">Community</h4>
            <a href="#" className="footer-link">Guidelines</a>
            <a href="#" className="footer-link">Report Issue</a>
            <a href="#" className="footer-link">Contact</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 LoKally. Made with love in Nepal</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;