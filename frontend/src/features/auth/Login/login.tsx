import React from "react";
import "./login.css";
import { useForm } from "react-hook-form";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { Link } from "react-router-dom";

import FormInput from "../Components/FormComponents/FormInput";
import AuthButton from "../Components/FormComponents/AuthButton";
import LogoTitle from "../Components/FormComponents/LogoTitle";

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  const onSubmit = (data: any) => {
    console.log("Login Data:", data);
    alert("Login Successful!");
  };

  return (
    <div className="page-bg">
      <div className="card">
        <LogoTitle title="LoKally" />

        <form onSubmit={handleSubmit(onSubmit)}>

          {/* Email */}
          <FormInput
            icon={<FaEnvelope className="icon" />}
            type="email"
            placeholder="Your Email"
            {...register("email", {
              required: "Email is required"
            })}
            error={errors.email?.message as string}
          />

          {/* Password */}
          <FormInput
            icon={<FaLock className="icon" />}
            type="password"
            placeholder="Password"
            {...register("password", {
              required: "Password is required"
            })}
            error={errors.password?.message as string}
          />

          {/* Forgot Password — Right aligned */}
          <div className="forgot-wrapper">
            <Link className="forgot-text" to="/forgot">
              Forgot Password
            </Link>
          </div>

          {/* Submit Button */}
          <AuthButton text="Sign In" />

        </form>

        <p className="switch-text">
          Don’t have an account? <Link to="/register">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
