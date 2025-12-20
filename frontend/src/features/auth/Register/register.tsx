import React from "react";
import "./register.css";
import { useForm } from "react-hook-form";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaPhone,
  FaBirthdayCake,
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";

import FormInput from "../Components/FormComponents/FormInput";
import AuthButton from "../Components/FormComponents/AuthButton";
import LogoTitle from "../Components/FormComponents/LogoTitle";
import RadioInput from "../Components/FormComponents/RadioInput";

import { registerApi } from "../../../shared/config/api";

/* =========================
   FRONTEND FORM TYPE
========================= */
type RegisterFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  address: string;
  gender: "Male" | "Female" | "Other";
  password: string;
  confirmPassword: string;
};

const Register = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const password = watch("password");

  /* =========================
     SUBMIT HANDLER
  ========================= */
  const handleRegister = async (data: RegisterFormData) => {
    if (data.password !== data.confirmPassword) {
      alert("❌ Passwords do not match");
      return;
    }

    try {
      await registerApi({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        dob: data.dob,
        address: data.address,
        gender: data.gender, // ✅ DB SAFE
        password: data.password,
        confirm_password: data.confirmPassword,
      });

      alert(
        "✅ Registered successfully!\n📧 Please check your email to verify your account."
      );

      navigate("/"); // back to login
    } catch (err: any) {
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="page-bg">
      <div className="card">
        <LogoTitle title="LoKally" />
        <p className="subtitle">Create your account</p>

        <form onSubmit={handleSubmit(handleRegister)}>
          <FormInput
            icon={<FaUser className="icon" />}
            placeholder="First Name"
            {...register("firstName", { required: "First name required" })}
            error={errors.firstName?.message}
          />

          <FormInput
            icon={<FaUser className="icon" />}
            placeholder="Last Name"
            {...register("lastName", { required: "Last name required" })}
            error={errors.lastName?.message}
          />

          <FormInput
            icon={<FaEnvelope className="icon" />}
            type="email"
            placeholder="Email"
            {...register("email", { required: "Email required" })}
            error={errors.email?.message}
          />

          <FormInput
            icon={<FaPhone className="icon" />}
            placeholder="Phone Number"
            {...register("phone", { required: "Phone required" })}
            error={errors.phone?.message}
          />

          <FormInput
            icon={<FaBirthdayCake className="icon" />}
            type="date"
            {...register("dob", { required: "Date of birth required" })}
            error={errors.dob?.message}
          />

          <FormInput
            icon={<FaUser className="icon" />}
            placeholder="Address"
            {...register("address", { required: "Address required" })}
            error={errors.address?.message}
          />

          <RadioInput
            control={control}
            name="gender"
            label="Gender"
            rules={{ required: "Gender required" }}
            options={[
              { value: "Male", label: "Male" },
              { value: "Female", label: "Female" },
              { value: "Other", label: "Other" },
            ]}
          />

          <FormInput
            icon={<FaLock className="icon" />}
            type="password"
            placeholder="Password"
            {...register("password", {
              required: "Password required",
              minLength: { value: 6, message: "Min 6 characters" },
            })}
            error={errors.password?.message}
          />

          <FormInput
            icon={<FaLock className="icon" />}
            type="password"
            placeholder="Confirm Password"
            {...register("confirmPassword", {
              required: "Confirm password",
              validate: (v) => v === password || "Passwords do not match",
            })}
            error={errors.confirmPassword?.message}
          />

          <AuthButton text="Register Now" />
        </form>

        <p className="switch-text">
          Already have an account? <Link to="/">Sign In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
