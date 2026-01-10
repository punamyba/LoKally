import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../../shared/config/axiosinstance";
import "./auth.css";
import AuthLayout from "../Components/authlayout/AuthLayout";

const ForgotPassword = ({ onNext }: { onNext: (email: string) => void }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const res = await axios.post("/forgot-password", { email });
      setMsg(res.data.message);

      onNext(email);
      navigate("/verify-otp");
    } catch {
      setMsg("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 className="title">Forgot Password</h2>
        <p className="subtitle">Enter your registered email</p>

        <form onSubmit={submit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
          />

          <button className="btn" disabled={loading}>
            {loading ? "Sending..." : "Send Code"}
          </button>
        </form>

        {msg && <p className="info">{msg}</p>}
      </div>
    </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
