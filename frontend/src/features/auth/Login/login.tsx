import React from "react";
import "./login.css";
import logo from "../../../assets/logo1.png";
import { Link } from "react-router-dom";
import { FaEnvelope, FaLock } from "react-icons/fa";

const Login = () => {
  return (
    <div className="page-bg">
      <div className="card">
        <img src={logo} className="logo" />

        <h2 className="title">LoKally</h2>

        <div className="input-box">
          <FaEnvelope className="icon" />
          <input type="email" placeholder="Your Email" />
        </div>

        <div className="input-box">
          <FaLock className="icon" />
          <input type="password" placeholder="Password" />
        </div>

        <button className="btn">Sign In</button>

        <p className="switch-text">
          Don’t have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
