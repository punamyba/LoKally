import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "../Components/Toast/Toast";

// Yo page Google OAuth callback handle garcha
// Route: /google-callback
// Backend le token + user URL ma diera redirect garcha

export default function GoogleCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const token  = params.get("token");
    const userRaw = params.get("user");

    if (!token || !userRaw) {
      toast.error("Google login failed", "Please try again.");
      navigate("/");
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userRaw));

      // Normal login jastai localStorage ma save
      localStorage.setItem("token", token);
      localStorage.setItem("currentUser", JSON.stringify(user));

      toast.success(`Welcome, ${user.first_name}! 👋`);

      // Role check
      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/home");
      }
    } catch {
      toast.error("Google login failed", "Please try again.");
      navigate("/");
    }
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "sans-serif",
      color: "#4a5568",
      flexDirection: "column",
      gap: 12,
    }}>
      <div style={{ fontSize: 32 }}>🏔️</div>
      <div style={{ fontSize: 15, fontWeight: 600 }}>Signing you in...</div>
    </div>
  );
}