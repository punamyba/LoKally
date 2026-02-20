// App.tsx — Main routing file
// Controls which page shows based on the URL

import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Auth pages
import Login from "./features/auth/Login/login";
import Register from "./features/auth/Register/register";
import Home from "./features/auth/Home/Home";
import ForgotPassword from "./features/auth/forgot_Password/ForgotPaswword";
import VerifyOTP from "./features/auth/forgot_Password/VerfyOTP";
import ResetPassword from "./features/auth/forgot_Password/ResetPassword";
import ExploreMap from "./features/auth/Map/ExploreMap";

// Guards — protect routes from unauthorized access
import AuthGuard from "./shared/guards/authGuard";
import AdminGuard from "./shared/guards/adminGuard";

// Admin pages
import AdminLayout from "../src/features/auth/Admin/AdminLayout/AdminLayout";
import AdminDashboard from "../src/features/auth/Admin/AdminDashboard/AdminDashboard";
import AdminPending from "../src/features/auth/Admin/AdminPendingList/AdminPending";
import AdminPlaces from "../src/features/auth/Admin/Places/AdminPlaces";
import AdminAddPlace from "../src/features/auth/Admin/AdminAddPlace/AdminAddPlace";
import AdminUsers from "../src/features/auth/Admin/UsersLists/AdminUsers";
import { AdminReports, AdminSettings } from "../src/features/auth/Admin/Placeholder/AdminPlaceholder";

function App() {
  // Shared state for forgot-password 3-step flow
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");

  return (
    <BrowserRouter>
      <Routes>

        {/* Public routes — anyone can visit */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword onNext={setEmail} />} />
        <Route path="/verify-otp" element={<VerifyOTP email={email} onVerified={(token) => setResetToken(token)} />} />
        <Route path="/reset-password" element={<ResetPassword email={email} resetSessionToken={resetToken} />} />

        {/* User routes — must be logged in */}
        <Route path="/home" element={<AuthGuard><Home /></AuthGuard>} />
        <Route path="/explore-map" element={<ExploreMap />} />

        {/* Admin routes — must be logged in AND role = "admin" */}
        {/* AdminLayout has the sidebar; each child fills the content area */}
        <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
          <Route index element={<AdminDashboard />} />
          <Route path="pending" element={<AdminPending />} />
          <Route path="places" element={<AdminPlaces />} />
          <Route path="add-place" element={<AdminAddPlace />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
