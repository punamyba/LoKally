import type { JSX } from "react";
import { Navigate } from "react-router-dom";

type Props = {
  children: JSX.Element;
};

const AuthGuard = ({ children }: Props) => {
  const token = localStorage.getItem("token");

  // ❌ not logged in
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // ✅ logged in
  return children;
};

export default AuthGuard;
