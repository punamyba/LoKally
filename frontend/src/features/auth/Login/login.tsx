import "./login.css";
import { useForm } from "react-hook-form";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { Link, useNavigate, useLocation } from "react-router-dom";

import FormInput from "../Components/FormComponents/FormInput";
import AuthButton from "../Components/FormComponents/AuthButton";
import LogoTitle from "../Components/FormComponents/LogoTitle";
import { useEffect } from "react";
import { loginApi } from "../../../shared/config/api";
import AuthLayout from "../Components/authlayout/AuthLayout";

type LoginFormData = {
  email: string;
  password: string;
};

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      const res = await loginApi(data);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("currentUser", JSON.stringify(res.data.user));

      // role check (admin vs user)
      const role = res.data.user?.role;

      if (role === "admin") {
        navigate("/admin");
      } else {
        navigate("/home");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message;

      if (msg?.includes("verify")) {
        alert("Please verify your email before logging in");
      } else {
        alert(msg || "Login failed");
      }
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get("verify");

    if (status === "success") {
      alert("Email verified successfully. Please login.");
    }

    if (status === "invalid") {
      alert("Invalid or expired verification link.");
    }
  }, [location.search]);

  return (
    <AuthLayout>
      <div className="card">
        <LogoTitle title="LoKally" />

        <form onSubmit={handleSubmit(onSubmit)}>
          <FormInput
            icon={<FaEnvelope className="icon" />}
            type="email"
            placeholder="Your Email"
            {...register("email", {
              required: "Email is required",
            })}
            error={errors.email?.message}
          />

          <FormInput
            icon={<FaLock className="icon" />}
            type="password"
            placeholder="Password"
            {...register("password", {
              required: "Password is required",
            })}
            error={errors.password?.message}
          />

          <div className="forgot-wrapper">
            <a href="/forgot-password" className="forgot-text">
              Forgot password?
            </a>
          </div>

          <AuthButton text="Sign In" />
        </form>

        <p className="switch-text">
          Don’t have an account? <Link to="/register">Sign Up</Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Login;
