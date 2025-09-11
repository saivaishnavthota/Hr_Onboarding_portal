import React, { useState, useEffect } from "react";
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
  });

  // ✅ Load saved form data if exists
  useEffect(() => {
    const savedData = localStorage.getItem("employeeDetails");
    if (savedData) {
      setEmployee(JSON.parse(savedData));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmployee((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveDraft = async () => {
    try {
      await fetch("http://localhost:5000/api/employees/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employee),
      });
      alert("Draft saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save draft");
    }
  };

const handleGoToDocs = async () => {
  try {
    // ✅ Send employee details to backend
    const res = await fetch("http://localhost:5000/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(employee),
    });

    if (!res.ok) {
      throw new Error("Failed to submit employee details");
    }

    const savedEmployee = await res.json();
    localStorage.setItem("employeeDetails", JSON.stringify(savedEmployee));

    // ✅ Navigate to docs upload page
    navigate("/new-user-form/docs");
  } catch (err) {
    console.error(err);
    alert("Error submitting employee details");
  }
};


  return (
    <div className="container">
      <div className="employee-details">
        <div className="form-section">
          <h2>Onboarding Employee Details</h2>
          <h4>Please fill the details below</h4>
          <div className="form-grid">
            <div>
              <label>Full Name</label>
              <input type="text" name="fullName" value={employee.fullName}
               onChange={handleChange} required/>
            </div>
            <div>
              <label>Email</label>
              <input type="email" name="email" value={employee.email} 
              onChange={handleChange} required />
            </div>
             <div>
              <label>Date Of Birth</label>
              <input type="date" name="dob" value={employee.dob} 
              onChange={handleChange} required />
            </div>
            <div>
              <label>Phone Number</label>
              <input type="text" name="phone" value={employee.phone} 
              onChange={handleChange} required />
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
              <input type="date" name="doj" value={employee.doj} 
              onChange={handleChange} required />
            </div>
            <div>
              <label>Latest Graduation Year</label>
              <input type="number" name="graduationYear" value={employee.graduationYear} 
              onChange={handleChange} required />
            </div>
            <div>
              <label id="star">Work Experience (years)</label>
              <input type="number" name="workExp" value={employee.workExp} 
              onChange={handleChange} />
            </div>
            <div>
              <label>Emergency Contact Name</label>
              <input type="text" name="contactName" value={employee.contactName} 
              onChange={handleChange} required />
            </div>
            <div>
              <label>Contact Number</label>
              <input type="text" name="contactNumber" value={employee.contactNumber} 
              onChange={handleChange} required />
            </div>
            <div>
              <label>Relationship</label>
              <input type="text" name="relationship" value={employee.relationship} 
              onChange={handleChange} required/>
            </div>
            <div className="full-width">
              <label>Address</label>
              <textarea name="address" value={employee.address} 
              onChange={handleChange} required></textarea>
            </div>
          </div>
        </div>

        <div className="button-section">
          <button onClick={handleSaveDraft}>Save Draft</button>
          <button onClick={handleGoToDocs}>Documents Upload</button>
        </div>
      </div>
    </div>
  );
}
