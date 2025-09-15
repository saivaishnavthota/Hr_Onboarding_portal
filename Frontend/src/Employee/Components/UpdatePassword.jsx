import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../Styles/UpdatePassword.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";
const UpdatePassword = () => {
  const [formData, setFormData] = useState({
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [toast, setToast] = useState({ message: null, isError: false });
  const navigate = useNavigate();

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
      const response = await axios.post(
        "https://7af2b81040a6.ngrok-free.app/reset_password",
        formData
      );

      showToast(response.data.message || "Password changed successfully!", false);

      setTimeout(() => {
        navigate("/employee-login");
      }, 1500);
    } catch (error) {
      console.error("Error updating password:", error);
      showToast(
        error.response?.data?.error || "Something went wrong. Please try again later.",
        true
      );
    }
  };

  // Auto-hide toast after 2.5s
  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ message: null, isError: false }), 2500);
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
          <div className="mb-3">
            <label className="form-label">Email Id</label>
            <input
              type="email"
              name="email"
              className="form-control"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

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
