import React, { useState, useEffect } from "react";
import axios from "axios";
import "./NewUserDetails.css";
import { useNavigate } from "react-router-dom";

export default function NewUserDetails() {
  const navigate = useNavigate();
  


const user = JSON.parse(localStorage.getItem("user") || "{}");
const employeeId = user.id;
const email=user.email;

  const [employee, setEmployee] = useState({
    employee_id:employeeId,
    full_name: "",
    personal_email: email,
    dob: "",
    contact_no: "",
   
    address: "",
    graduation_year: "",
    work_experience_years: "",
    emergency_contact_name: "",
    emergency_contact_number: "",
    emergency_contact_relation: "",
    gender: "",
  });

  const [toast, setToast] = useState({ message: null, isError: false });

  // ✅ Load saved form data if exists
  

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
      await axios.post("http://127.0.0.1:8000/onboarding/details", employee);
      showToast("Draft saved successfully!");
    } catch (err) {
      console.error(err);
      showToast("Failed to save draft", true);
    }
  };

  const handleGoToDocs = async () => {
    try {
      console.log(user)
      console.log(employee)
      
      const res = await axios.post("http://127.0.0.1:8000/onboarding/details", employee);

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
                name="full_name"
                value={employee.full_name}
                onChange={handleChange}
                required
              />
            </div>
             <div>
              <label>email</label>
              <input
                type="text"
                name="personal_email"
                value={employee.personal_email}
                onChange={handleChange}
                readOnly
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
                name="contact_no"
                value={employee.contact_no}
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
              <label>Latest Graduation Year</label>
              <input
                type="number"
                name="graduation_year"
                value={employee.graduation_year}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label id="star">Work Experience (years)</label>
              <input
                type="number"
                name="work_experience_years"
                value={employee.work_experience_years}
                onChange={handleChange}
              />
            </div>
            <div className="form-grid full-width">
              <div>
                <label>Emergency Contact Name</label>
                <input
                  type="text"
                  name="emergency_contact_name"
                  value={employee.emergency_contact_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label>Contact Number</label>
                <input
                  type="number"
                  name="emergency_contact_number"
                  value={employee.emergency_contact_number}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label>Relationship</label>
                <input
                  type="text"
                  name="emergency_contact_relation"
                  value={employee.emergency_contact_relation}
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
