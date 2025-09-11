import React, { useEffect, useState } from "react";
import "../Styles/Profile.css";

export default function Profile() {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    
    const employeeId = localStorage.getItem("employeeId");

    fetch(`http://localhost:5000/api/employee/${employeeId}`)
      .then((res) => res.json())
      .then((data) => {
        setEmployee(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching employee profile:", err);
        setError("Failed to load profile.");
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-center">Loading profile...</p>;
  if (error) return <p className="text-center text-danger">{error}</p>;

  return (
    <div className="employee-profile container py-4">
      <h3 className="text-center mb-4">My Profile</h3>

      <div className="profile-card">
        <div className="profile-header text-center">
          <h4>{employee.name}</h4>
          <p className="text-muted">{employee.designation}</p>
        </div>

        <div className="profile-details">
          <p><strong>Employee ID:</strong> {employee.id}</p>
          <p><strong>Email:</strong> {employee.email}</p>
          <p><strong>Phone:</strong> {employee.phone}</p>
          <p><strong>Department:</strong> {employee.department}</p>
          <p><strong>Date of Joining:</strong> {employee.joining_date}</p>
          <p><strong>Manager:</strong> {employee.manager}</p>
        </div>
      </div>
    </div>
  );
}
