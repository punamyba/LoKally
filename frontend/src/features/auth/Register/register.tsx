import React, { useState } from "react";
import "./register.css";
import { useForm } from "react-hook-form";
import { FaUser, FaEnvelope, FaLock, FaPhone, FaBirthdayCake } from "react-icons/fa";
import { Link } from "react-router-dom";

import FormInput from "../Components/FormComponents/FormInput";
import AuthButton from "../Components/FormComponents/AuthButton";
import LogoTitle from "../Components/FormComponents/LogoTitle";
import RadioInput from "../Components/FormComponents/RadioInput";

const Register = () => {
  const { register, handleSubmit, control, formState: { errors } } = useForm();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dob: "",
    address: "",
    phone: "",
    password: "",
    confirmPassword: "",
    gender: ""
  });

  const handleRegister = (data: any) => {
    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    console.log("REGISTER DATA:", { ...form, ...data });
    alert("Registration Successful!");
  };

  return (
    <div className="page-bg">
      <div className="card">
        
        <LogoTitle title="LoKally" />

        <p className="subtitle">Create your account</p>

        <form onSubmit={handleSubmit(handleRegister)}>

          {/* First Name */}
          <FormInput
            icon={<FaUser className="icon" />}
            type="text"
            placeholder="First Name"
            {...register("firstName", { required: "First name required" })}
            onChange={(e: any) => setForm({ ...form, firstName: e.target.value })}
            error={errors.firstName?.message as string}
          />

          {/* Last Name */}
          <FormInput
            icon={<FaUser className="icon" />}
            type="text"
            placeholder="Last Name"
            {...register("lastName", { required: "Last name required" })}
            onChange={(e: any) => setForm({ ...form, lastName: e.target.value })}
            error={errors.lastName?.message as string}
          />

          {/* Email */}
          <FormInput
            icon={<FaEnvelope className="icon" />}
            type="email"
            placeholder="Your Email"
            {...register("email", { required: "Email required" })}
            onChange={(e: any) => setForm({ ...form, email: e.target.value })}
            error={errors.email?.message as string}
          />

          {/* Phone */}
          <FormInput
            icon={<FaPhone className="icon" />}
            type="text"
            placeholder="Phone Number"
            {...register("phone", { required: "Phone number required" })}
            onChange={(e: any) => setForm({ ...form, phone: e.target.value })}
            error={errors.phone?.message as string}
          />

          {/* Date of Birth */}
          <FormInput
            icon={<FaBirthdayCake className="icon" />}
            type="date"
            placeholder="Date of Birth"
            {...register("dob", { required: "Date of birth required" })}
            onChange={(e: any) => setForm({ ...form, dob: e.target.value })}
            error={errors.dob?.message as string}
          />

          {/* Address */}
          <FormInput
            icon={<FaUser className="icon" />}
            type="text"
            placeholder="Address"
            {...register("address", { required: "Address required" })}
            onChange={(e: any) => setForm({ ...form, address: e.target.value })}
            error={errors.address?.message as string}
          />

          {/* Gender (Radio) */}
          <RadioInput
            control={control}
            name="gender"
            label="Gender"
            rules={{ required: "Gender is required" }}
            options={[
              { value: "Male", label: "Male" },
              { value: "Female", label: "Female" },
              { value: "Others", label: "Others" }
            ]}
          />

          {/* Password */}
          <FormInput
            icon={<FaLock className="icon" />}
            type="password"
            placeholder="Password"
            {...register("password", { required: "Password required" })}
            onChange={(e: any) => setForm({ ...form, password: e.target.value })}
            error={errors.password?.message as string}
          />

          {/* Confirm Password */}
          <FormInput
            icon={<FaLock className="icon" />}
            type="password"
            placeholder="Confirm Password"
            {...register("confirmPassword", { required: "Confirm password required" })}
            onChange={(e: any) => setForm({ ...form, confirmPassword: e.target.value })}
            error={errors.confirmPassword?.message as string}
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
