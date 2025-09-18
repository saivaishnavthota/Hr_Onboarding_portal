import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../Styles/ForgotPassword.css";

const ForgetPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);
  const [step, setStep] = useState(1); // 👈 step control
  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000";

  const handleRequestLink = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${API_BASE_URL}/users/forgot_password`, { email });
      setMessage(data.message || "Password reset link sent to your email.");
      setIsError(false);
      setStep(2); // 👈 move to next step
    } catch (err) {
      console.error("Forgot password error:", err);
      setMessage(err.response?.data?.error || "Failed to send reset link.");
      setIsError(true);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(`${API_BASE_URL}/users/verify_otp`, {
        email,
        otp: resetCode,
      });
      setMessage(data.message || "Code verified successfully!");
      setIsError(false);

      // 👇 redirect to reset-password page
      setTimeout(() => navigate("/change-password"), 1500);
    } catch (err) {
      console.error("Code verification error:", err);
      setMessage(err.response?.data?.error || "Invalid or expired code.");
      setIsError(true);
    }
  };

  return (
    <div className="forgot-container">
      <div className="forgot-box shadow-lg">
        <h2 className="text-center">Forgot Password ?</h2>

        {step === 1 && (
          <form onSubmit={handleRequestLink} className="forgot-form">
            <input
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit">Send Reset Link</button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyCode} className="forgot-form">
            <input
              type="text"
              placeholder="Enter reset code"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              required
            />
            <button type="submit">Verify Code</button>
          </form>
        )}

        {message && (
          <p className={`message ${isError ? "error" : "success"}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default ForgetPassword;