import React from "react";
import "./register.css";
import logo from "../../../assets/logo1.png";
import { Link } from "react-router-dom";
import { FaUser, FaEnvelope, FaLock, FaPhone, FaBirthdayCake } from "react-icons/fa";

const Register = () => {
  return (
    <div className="page-bg">
      <div className="card">
        <img src={logo} className="logo" />

        <h2 className="title">LoKally</h2>
        <p className="subtitle">Create your account</p>

        <div className="input-box">
          <FaUser className="icon" />
          <input type="text" placeholder="Full Name" />
        </div>

        <div className="input-box">
          <FaBirthdayCake className="icon" />
          <input type="date" />
        </div>

        <div className="input-box">
          <FaEnvelope className="icon" />
          <input type="email" placeholder="Your Email" />
        </div>

        <div className="input-box">
          <FaPhone className="icon" />
          <input type="text" placeholder="Phone Number" />
        </div>

        <div className="input-box">
          <FaLock className="icon" />
          <input type="password" placeholder="Password" />
        </div>

        <div className="input-box">
          <FaLock className="icon" />
          <input type="password" placeholder="Confirm Password" />
        </div>

        <button className="btn">Register Now</button>

        <p className="switch-text">
          Already have an account? <Link to="/">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
