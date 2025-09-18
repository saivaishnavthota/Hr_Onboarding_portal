import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faTimesCircle,
  faEnvelope,
  faLock,
  faSignInAlt,
} from "@fortawesome/free-solid-svg-icons";
import "../Styles/EmployeeLogin.css";
import CompanyLogo from "../../assets/Nxzen-logo.jpg";
import loginImage from "../../assets/nxzen-image1.jpg";

const EmployeeLogin = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [toast, setToast] = useState({ message: null, isError: false });
  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🔹 Login request
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${API_BASE_URL}/users/login`, formData);

      localStorage.setItem("token", data.access_token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.employeeId,
          name: data.name,
          role: data.role,
          company_email: data.company_email,
          email: data.email,
          onboarding_status: data.onboarding_status,
          is_new_user: data.is_new_user,
        })
      );

      setToast({ message: data.message || "Login successful!", isError: false });

      setTimeout(() => {
        if (data.is_new_user) {
          navigate("/change-password");
        } else if (!data.onboarding_status) {
          navigate("/new-user-form");
        } else if (data.role === "HR") {
          navigate("/hr-dashboard");
        } else if (data.role === "Manager") {
          navigate("/manager-dashboard");
        } else {
          navigate("/employee-dashboard");
        }
      }, 1000);
    } catch (err) {
      console.error("Login error:", err);
      setToast({
        message: err.response?.data?.error || "Invalid credentials",
        isError: true,
      });
    }
  };

  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(
        () => setToast({ message: null, isError: false }),
        1500
      );
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <div className="login-page">
      <div className="login-left">
        <img src={loginImage} alt="Login Visual" className="login-image" />
      </div>

      <div className="login-right">
        <div className="login-container shadow-lg p-4 rounded">
          <div className="text-center mb-4">
            <img
              src={CompanyLogo}
              alt="Company Logo"
              className="company-logo mb-3"
            />
            <h2>Login</h2>
          </div>

          {toast.message && (
            <div
              className={`toast-message ${toast.isError ? "error" : "success"}`}
            >
              <FontAwesomeIcon
                icon={toast.isError ? faTimesCircle : faCheckCircle}
                className="me-2"
              />
              {toast.message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3 input-group">
              <span className="input-group-text">
                <FontAwesomeIcon icon={faEnvelope} />
              </span>
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

            <div className="mb-3 input-group">
              <span className="input-group-text">
                <FontAwesomeIcon icon={faLock} />
              </span>
              <input
                type="password"
                name="password"
                className="form-control"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="btn-login w-100">
              <FontAwesomeIcon icon={faSignInAlt} className="me-2" />
              Login
            </button>
          </form>

          {/* 🔹 Redirect to ForgotPassword Page */}
          <p
            className="forgot-password text-center mt-3"
            style={{
              color: "blue",
              cursor: "pointer",
              textDecoration: "underline",
            }}
            onClick={() => navigate("/forgot-password")}
          >
            Forgot Password?
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLogin;