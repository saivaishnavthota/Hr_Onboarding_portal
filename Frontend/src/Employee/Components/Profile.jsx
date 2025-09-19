import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../Styles/Profile.css";

export default function Profile() {
  const [employee, setEmployee] = useState(null);
  const navigate = useNavigate();

   useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    axios
      .get(`http://localhost:8080/api/employees/${user.employee_id}`)
      .then((res) => setEmployee(res.data))
      .catch((err) => console.error("Error fetching employee:", err));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  if (!employee) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2 className="profile-title">Employee Profile</h2>

        <div className="profile-grid">
          <p><span>Name:</span> {employee.name}</p>
          <p><span>Email:</span> {employee.email}</p>

          <p><span>Employment Type:</span> {employee.employmentType}</p>
          <p><span>Role:</span> {employee.role}</p>

          <p><span>Contact Number:</span> {employee.contactNumber}</p>
          <p><span>Date of Joining:</span> {employee.dateOfJoining}</p>
          <p><span>Location:</span> {employee.location}</p>

          <p><span>Assigned Managers:</span> {employee.assignedManagers?.join(", ")}</p>
          <p><span>Assigned HRs:</span> {employee.assignedHRs?.join(", ")}</p>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
