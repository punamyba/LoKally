import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../../shared/config/axiosinstance";
import "./auth.css";
import AuthLayout from "../Components/authlayout/AuthLayout";

interface Props {
  email: string;
  onVerified: (token: string) => void;
}

const VerifyOTP = ({ email, onVerified }: Props) => {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");

  const navigate = useNavigate();

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");

    try {
      const res = await axios.post("/forgot-password/verify", {
        email,
        code,
      });

      onVerified(res.data.resetSessionToken);
      navigate("/reset-password");
    } catch (err: any) {
      setMsg(err.response?.data?.message || "Invalid code");
    }
  };

  return (
    <AuthLayout>
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 className="title">Verify Code</h2>
        <p className="subtitle">6 digit code sent to {email}</p>

        <form onSubmit={verify}>
          <input
            className="otp"
            maxLength={6}
            placeholder="------"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />

          <button className="btn">Verify</button>
        </form>

        {msg && <p className="error">{msg}</p>}
      </div>
    </div>
    </AuthLayout>
  );
};

export default VerifyOTP;
