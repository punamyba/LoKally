import React, { useState } from 'react';
import './home.css';
import { 
  Search, 
  MapPin, 
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
import Navbar from "../Components/Layout/Navbar/Navbar";
import Footer from "../Components/Layout/Footer/Footer";
import "../Components/Layout/Navbar/Navbar.css";
import "../Components/Layout/Footer/Footer.css";






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
      image: 'https://upload.wikimedia.org/wikipedia/commons/1/18/BRP_Lumbini_Mayadevi_temple.jpg',
      info: '167 Recommend Stay',
      likes: 234,
      comments: 45,
      verified: true
    },
    {
      id: 2,
      name: 'Pokhara, Nepal',
      image: 'https://www.acethehimalaya.com/wp-content/uploads/2024/02/things-to-do-in-pokhara.jpg',
      info: '189 Recommend Stay',
      likes: 189,
      comments: 32,
      verified: true
    },
    {
      id: 3,
      name: 'Chitwan, Nepal',
      image: 'https://www.magicalnepal.com/wp-content/uploads/2025/06/1-1.jpg',
      info: '123 Recommend Stay',
      likes: 156,
      comments: 28,
      verified: true
    },
    {
      id: 4,
      name: 'Annapurna, Nepal',
      image: 'https://media.nepaltrekadventures.com/uploads/img/annapurna-base-camp-in-nepal-1.webp',
      info: '245 Recommend Stay',
      likes: 312,
      comments: 56,
      verified: true
    },
    {
      id: 5,
      name: 'Bhaktapur, Nepal',
      image: 'https://assets-cdn.kathmandupost.com/uploads/source/news/2020/opinion/7-lead-for-online%20(7).jpg',
      info: '198 Recommend Stay',
      likes: 267,
      comments: 41,
      verified: true
    },
    {
      id: 6,
      name: 'Rara Lake, Nepal',
      image: 'https://www.himalayajourneys.com/assets/images/Rara%20lake%20Jeep%20tour.jpg',
      info: '156 Recommend Stay',
      likes: 178,
      comments: 34,
      verified: true
    },
    {
      id: 7,
      name: 'Mustang, Nepal',
      image: 'https://media.sublimetrails.com/uploads/img/breathtaking-landscape-of-mustang-nepal1.webp',
      info: '134 Recommend Stay',
      likes: 145,
      comments: 29,
      verified: true
    }
  ];

  const logout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <div className="home-container">
     
    <Navbar />
      

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

        {/* Quick Actions */}
        <div className="quick-actions">
          <div 
            className="action-card"
            onClick={() => window.location.href = "/explore-map"}
          >
            <MapPin size={40} color="#167ee0" />
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

        {/* Community Section */}
        <div className="community-section">
          <h2 className="community-title">Join Our Explorer Community</h2>
          <p className="community-text">Connect with travelers, share experiences, and discover authentic Nepal together</p>
          <div className="community-stats">
            <div className="community-stat">
              <User size={30} color="#167ee0" />
              <div className="stat-number">5,678</div>
              <div className="stat-label">Active Explorers</div>
            </div>
            <div className="community-stat">
              <MapPin size={30} color="#1b8d28" />
              <div className="stat-number">1,234</div>
              <div className="stat-label">Places Shared</div>
            </div>
            <div className="community-stat">
              <Star size={30} color="#ff9500" />
              <div className="stat-number">892</div>
              <div className="stat-label">Verified Spots</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;