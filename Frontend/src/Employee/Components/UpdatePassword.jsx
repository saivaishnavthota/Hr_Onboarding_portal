import React, { useState, useEffect } from "react";

import { useNavigate, useLocation } from "react-router-dom";

import axios from "axios";

import "../Styles/UpdatePassword.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";
 
const UpdatePassword = () => {

  const [formData, setFormData] = useState({

    currentPassword: "",

    newPassword: "",

    confirmPassword: "",

  });
 
  const [toast, setToast] = useState({ message: null, isError: false });

  const API_BASE_URL =

    process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:5000";
 
  const navigate = useNavigate();

  const location = useLocation();
 
  const queryParams = new URLSearchParams(location.search);

  const resetToken = queryParams.get("token");

  const fromForgot = queryParams.get("from") === "forgot";
 
  // ✅ Check onboarding_status instead of is_new_user

 const onboardingStatus = JSON.parse(localStorage.getItem("user") || "{}")?.onboarding_status;
const isNewUser = onboardingStatus === false; // correct mapping
 
  const handleChange = (e) => {

    const { name, value } = e.target;

    setFormData({ ...formData, [name]: value });

  };
 
  const showToast = (message, isError = false) => {

    setToast({ message, isError });

  };
 
  const handleSubmit = async (e) => {

    e.preventDefault();
 
    if (formData.newPassword !== formData.confirmPassword) {

      showToast("New password and Confirm password do not match!", true);

      return;

    }
 
    try {
if (resetToken || fromForgot) {
  // Forgot password flow
  await axios.post(`${API_BASE_URL}/users/reset-password`, {
    token: resetToken,
    newPassword: formData.newPassword,
  });

  showToast("Password reset successfully! Redirecting to login...", false);
  setTimeout(() => navigate("/"), 1500);

} else if (isNewUser) {
  // New user must update password once
  const token = localStorage.getItem("token");
  await axios.post(
    `${API_BASE_URL}/users/change-password`,
    { newPassword: formData.newPassword },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  showToast("Password updated successfully! Please login again.", false);

  // 🔹 Force re-login after password update
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  setTimeout(() => navigate("/"), 1500);
}



    }catch (err) {

      console.error("Password update error:", err);

      showToast(

        err.response?.data?.error ||

          "Something went wrong. Please try again later.",

        true

      );

    }

  };
 
  // Auto-hide toast after 2.5s

  useEffect(() => {

    if (toast.message) {

      const timer = setTimeout(

        () => setToast({ message: null, isError: false }),

        2500

      );

      return () => clearTimeout(timer);

    }

  }, [toast]);
 
  return (
<div className="container d-flex justify-content-center align-items-center min-vh-100">

      {toast.message && (
<div className={`toast-message ${toast.isError ? "error" : "success"}`}>
<FontAwesomeIcon

            icon={toast.isError ? faTimesCircle : faCheckCircle}

            className="me-2"

          />

          {toast.message}
</div>

      )}
<div className="form-box shadow-lg p-4 rounded">
<h2 className="text-center mb-4">Change Password</h2>
<form onSubmit={handleSubmit}>

          {/* Show current password only for normal users */}

          {!resetToken && !isNewUser && !fromForgot && (
<div className="mb-3">
<label className="form-label">Current Password</label>
<input

                type="password"

                name="currentPassword"

                className="form-control"

                placeholder="Enter current password"

                value={formData.currentPassword}

                onChange={handleChange}

                required

              />
</div>

          )}
 
          {/* Always show new + confirm */}
<div className="mb-3">
<label className="form-label">New Password</label>
<input

              type="password"

              name="newPassword"

              className="form-control"

              placeholder="Enter new password"

              value={formData.newPassword}

              onChange={handleChange}

              required

            />
</div>
 
          <div className="mb-3">
<label className="form-label">Confirm Password</label>
<input

              type="password"

              name="confirmPassword"

              className="form-control"

              placeholder="Confirm new password"

              value={formData.confirmPassword}

              onChange={handleChange}

              required

            />
</div>
 
          <button type="submit" className="btn-submit w-100">

            Submit
</button>
</form>
</div>
</div>

  );

};
 
export default UpdatePassword;

 