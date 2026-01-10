import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./features/auth/Login/login";
import Register from "./features/auth/Register/register";
import Home from "./features/auth/Home/Home";
import AuthGuard from "./shared/guards/authGuard";

import ForgotPassword from "./features/auth/forgot_Password/ForgotPaswword";
import VerifyOTP from "./features/auth/forgot_Password/VerfyOTP";
import ResetPassword from "./features/auth/forgot_Password/ResetPassword";

function App() {
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Forgot Password Flow */}
        <Route
          path="/forgot-password"
          element={<ForgotPassword onNext={setEmail} />}
        />

        <Route
          path="/verify-otp"
          element={
            <VerifyOTP
              email={email}
              onVerified={(token) => setResetToken(token)}
            />
          }
        />

        <Route
          path="/reset-password"
          element={
            <ResetPassword
              email={email}
              resetSessionToken={resetToken}
            />
          }
        />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <Home />
            </AuthGuard>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
