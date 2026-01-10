import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../../shared/config/axiosinstance";
import "./auth.css";
import AuthLayout from "../Components/authlayout/AuthLayout";


interface Props {
  email: string;
  resetSessionToken: string;
}

const ResetPassword = ({ email, resetSessionToken }: Props) => {
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const navigate = useNavigate();

  const reset = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await axios.post("/reset-password", {
        email,
        resetSessionToken,
        newPassword: password,
      });

      setMsg("Password reset successful. Redirecting to login...");
      setTimeout(() => navigate("/"), 1500);
    } catch {
      setMsg("Reset failed");
    }
  };

  return (
    <AuthLayout>
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 className="title">Reset Password</h2>
        <p className="subtitle">Enter your new password</p>

        <form onSubmit={reset}>
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="btn">Reset Password</button>
        </form>

        {msg && <p className="success">{msg}</p>}
      </div>
    </div>
    </AuthLayout>
  );
};

export default ResetPassword;
