import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/UpdatePassword.css";
const UpdatePassword = () => {

    const [formData, setFormData] = useState({
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const navigate = useNavigate(); 

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (formData.newPassword !== formData.confirmPassword) {
    alert("New password and Confirm password do not match!");
    return;
  }

  try {
    const response = await fetch("https://7af2b81040a6.ngrok-free.app/reset_password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (response.ok) {
      alert(data.message || "Password changed successfully!");
      navigate("/employee-login");
    } else {
      alert(data.error || "Failed to update password");
    }
  } catch (error) {
    console.error("Error updating password:", error);
    alert("Something went wrong. Please try again later.");
  }
};

  return (
     <div className="container d-flex justify-content-center align-items-center min-vh-100">
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
  )
}

export default UpdatePassword
