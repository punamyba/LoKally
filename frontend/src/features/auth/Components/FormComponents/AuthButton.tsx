import React from "react";
import "./AuthButton.css";

interface AuthButtonProps {
  text: string;
}

const AuthButton: React.FC<AuthButtonProps> = ({ text }) => {
  return (
    <button className="auth-btn" type="submit">
      {text}
    </button>
  );
};

export default AuthButton;
