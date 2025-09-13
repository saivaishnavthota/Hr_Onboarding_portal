import React, { useState, useEffect } from "react";
import axios from "axios";
import "./NewUserDetails.css";
import { useNavigate } from "react-router-dom";

export default function NewUserDetails() {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState({
    fullName: "",
    email: "",
    dob: "",
    phone: "",
    doj: "",
    address: "",
    graduationYear: "",
    workExp: "",
    contactName: "",
    contactNumber: "",
    relationship: "",
    gender: "",
  });

  const [toast, setToast] = useState({ message: null, isError: false });

  // ✅ Load saved form data if exists
  useEffect(() => {
    const savedData = localStorage.getItem("employeeDetails");
    if (savedData) setEmployee(JSON.parse(savedData));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmployee((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Show toast for 3 seconds
  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast({ message: null, isError: false }), 3000);
  };

  const handleSaveDraft = async () => {
    try {
      await axios.post("http://localhost:5000/api/employees/draft", employee);
      showToast("Draft saved successfully!");
    } catch (err) {
      console.error(err);
      showToast("Failed to save draft", true);
    }
  };

  const handleGoToDocs = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/employees", employee);

      localStorage.setItem("employeeDetails", JSON.stringify(res.data));
      showToast("Employee details submitted successfully!");
      navigate("/new-user-form/docs");
    } catch (err) {
      console.error(err);
      showToast("Error submitting employee details", true);
    }
  };

  return (
    <div className="new-container">
      {/* Toast Notification */}
      {toast.message && (
        <div className={`toast-message ${toast.isError ? "error" : "success"}`}>
          {toast.message}
        </div>
      )}

      <div className="employee-details">
        <div className="form-section">
          <h2>Onboarding Employee Details</h2>
          <h4>Please fill the details below</h4>
          <div className="form-grid">
            <div>
              <label>Full Name</label>
              <input
                type="text"
                name="fullName"
                value={employee.fullName}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={employee.email}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label>Date Of Birth</label>
              <input
                type="date"
                name="dob"
                value={employee.dob}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label>Phone Number</label>
              <input
                type="text"
                name="phone"
                value={employee.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label>Gender</label>
              <select
                name="gender"
                className="form-select"
                value={employee.gender}
                onChange={handleChange}
                required
              >
                <option value="">--  Gender --</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label>Date of Joining</label>
              <input
                type="date"
                name="doj"
                value={employee.doj}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label>Latest Graduation Year</label>
              <input
                type="number"
                name="graduationYear"
                value={employee.graduationYear}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label id="star">Work Experience (years)</label>
              <input
                type="number"
                name="workExp"
                value={employee.workExp}
                onChange={handleChange}
              />
            </div>
            <div className="form-grid full-width">
              <div>
                <label>Emergency Contact Name</label>
                <input
                  type="text"
                  name="contactName"
                  value={employee.contactName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label>Contact Number</label>
                <input
                  type="number"
                  name="contactNumber"
                  value={employee.contactNumber}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label>Relationship</label>
                <input
                  type="text"
                  name="relationship"
                  value={employee.relationship}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="full-width">
              <label>Address</label>
              <textarea
                name="address"
                value={employee.address}
                onChange={handleChange}
                required
              ></textarea>
            </div>
          </div>
        </div>

        <div className="button-section">
          <button className="new-button" onClick={handleSaveDraft}>
            Save Draft
          </button>
          <button className="new-button" onClick={handleGoToDocs}>
            Documents Upload
          </button>
        </div>
      </div>
    </div>
  );
}
