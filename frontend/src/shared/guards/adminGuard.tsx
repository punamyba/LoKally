import React from "react";
import { Navigate } from "react-router-dom";

type Props = {
  children: React.ReactNode;
};

export default function AdminGuard({ children }: Props) {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("currentUser");

  if (!token || !userStr) return <Navigate to="/" replace />;

  try {
    const user = JSON.parse(userStr);
    if (user.role !== "admin") return <Navigate to="/home" replace />;
    return <>{children}</>;
  } catch {
    return <Navigate to="/" replace />;
  }
}
