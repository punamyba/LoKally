import "./LogoTitle.css";
import logo from "../../../../assets/logo1.png";
import React from "react";

interface LogoTitleProps {
  title: string;
  subtitle?: string;
}

const LogoTitle: React.FC<LogoTitleProps> = ({ title, subtitle }) => {
  return (
    <div className="authLogo">
      <img src={logo} alt="LoKally Logo" className="authLogo__img" />
      <h2 className="authLogo__title">{title}</h2>
      {subtitle && <p className="authLogo__subtitle">{subtitle}</p>}
    </div>
  );
};

export default LogoTitle;
