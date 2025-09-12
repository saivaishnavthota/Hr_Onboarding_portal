import React, { useState, useEffect } from "react";
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
    doj: "",
    address: "",
    gender:"",
    graduation_year: "",
    work_experience_years: "",
    emergency_contact_name: "",
    emergency_contact_number: "",
    emergency_contact_relation: "",
  });

  

 

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmployee((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveDraft = async () => {
    try {
      await fetch("http://127.0.0.1:8000/users/onboard", {
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
    console.log(localStorage.getItem("user"));

    console.log("Sending employee payload:", employee);

    const res = await fetch("http://127.0.0.1:8000/users/onboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(employee),
    });

    if (!res.ok) {
       const errorData = await res.json();
      throw new Error("Failed to submit employee details");
    }

    const savedEmployee = await res.json();
   

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
              <input type="text" name="full_name" value={employee.full_name}
               onChange={handleChange} required/>
            </div>
            
             <div>
              <label>Date Of Birth</label>
              <input type="date" name="dob" value={employee.dob} 
              onChange={handleChange} required />
            </div>
            <div>
              <label>Phone Number</label>
              <input type="text" name="contact_no" value={employee.contact_no} 
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
              <input type="number" name="graduation_year" value={employee.graduation_year} 
              onChange={handleChange} required />
            </div>
            <div>
              <label id="star">Work Experience (years)</label>
              <input type="number" name="work_experience_years" value={employee.work_experience_years} 
              onChange={handleChange} />
            </div>
            <div>
              <label>Emergency Contact Name</label>
              <input type="text" name="emergency_contact_name" value={employee.emergency_contact_name} 
              onChange={handleChange} required />
            </div>
            <div>
              <label>Contact Number</label>
              <input type="text" name="emergency_contact_number" value={employee.emergency_contact_number} 
              onChange={handleChange} required />
            </div>
            <div>
              <label>Relationship</label>
              <input type="text" name="emergency_contact_relation" value={employee.emergency_contact_relation} 
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
