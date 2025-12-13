import "./LogoTitle.css";
import logo from "../../../../assets/logo1.png";
import React from "react";

interface LogoTitleProps {
  title: string;
  subtitle?: string; // <-- add this
}

const LogoTitle: React.FC<LogoTitleProps> = ({ title, subtitle }) => {
  return (
    <div className="logo-container">
      <img src={logo} className="logo" />

      <h2 className="title">{title}</h2>

      {subtitle && <p className="subtitle">{subtitle}</p>}
    </div>
  );
};

export default LogoTitle;
