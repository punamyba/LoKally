import React from "react";
import "./authLayout.css";
import bgVideo from "../../../../assets/ity.mp4";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="auth-wrapper">
      {/* VIDEO BACKGROUND */}
      <video
        className="auth-video"
        src={bgVideo}
        autoPlay
        loop
        muted
        playsInline
      />

      {/* DARK OVERLAY */}
      <div className="auth-overlay" />

      {/* CONTENT */}
      <div className="auth-content">{children}</div>
    </div>
  );
};

export default AuthLayout;
