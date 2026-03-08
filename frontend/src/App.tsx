import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./features/auth/Login/login";
import Register from "./features/auth/Register/register";
import Home from "./features/auth/Home/Home";
import ForgotPassword from "./features/auth/forgot_Password/ForgotPaswword";
import VerifyOTP from "./features/auth/forgot_Password/VerfyOTP";
import ResetPassword from "./features/auth/forgot_Password/ResetPassword";
import ExploreMap from "./features/auth/Map/ExploreMap";
import PlaceDetail from "./features/auth/Map/PlaceDetails";

import AuthGuard from "./shared/guards/authGuard";
import AdminGuard from "./shared/guards/adminGuard";

import AdminLayout from "./features/auth/Admin/AdminLayout/AdminLayout";
import AdminDashboard from "./features/auth/Admin/AdminDashboard/AdminDashboard";
import AdminPending from "./features/auth/Admin/AdminPendingList/AdminPending";
import AdminPendingDetail from "./features/auth/Admin/AdminPendingList/AdminPendingDetail";
import AdminPlaces from "./features/auth/Admin/Places/AdminPlaces";
import AdminAddPlace from "./features/auth/Admin/AdminAddPlace/AdminAddPlace";
import AdminUsers from "./features/auth/Admin/UsersLists/AdminUsers";
import { AdminReports, AdminSettings } from "./features/auth/Admin/Placeholder/AdminPlaceholder";

import ContactUs from "./features/auth/ContactUs/ContactUs";
import AdminContactInbox from "./features/auth/Admin/AdminContactInbox/AdminContactInbox";

import CommunityFeed from "./features/auth/Community/CommunityFeed/CommunityFeed";
import AdminCommunity from "./features/auth/Admin/AdminCommunity/AdminCommunity";

function App() {
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");

  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/forgot-password"
          element={<ForgotPassword onNext={setEmail} />}
        />
        <Route
          path="/verify-otp"
          element={<VerifyOTP email={email} onVerified={(t) => setResetToken(t)} />}
        />
        <Route
          path="/reset-password"
          element={<ResetPassword email={email} resetSessionToken={resetToken} />}
        />

        {/* Public app routes */}
        <Route path="/explore-map" element={<ExploreMap />} />
        <Route path="/place/:id" element={<PlaceDetail />} />

        {/* Protected user route */}
        <Route
          path="/home"
          element={
            <AuthGuard>
              <Home />
            </AuthGuard>
          }
        />

        {/* Contact */}
        <Route path="/contact" element={<ContactUs />} />

        {/* Community */}
        <Route
          path="/community"
          element={
            <AuthGuard>
              <CommunityFeed currentUser={currentUser} />
            </AuthGuard>
          }
        />

        <Route
          path="/admin/community"
          element={
            <AdminGuard>
              <AdminCommunity />
            </AdminGuard>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="pending" element={<AdminPending />} />
          <Route path="pending/:id" element={<AdminPendingDetail />} />
          <Route path="places" element={<AdminPlaces />} />
          <Route path="add-place" element={<AdminAddPlace />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="contact" element={<AdminContactInbox />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;