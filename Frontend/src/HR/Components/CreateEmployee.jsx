import React, { useState, useEffect } from "react";
import axios from "axios";
import "../Styles/CreateEmployee.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";
const CreateEmployee = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    type: "",
  });

  const [toast, setToast] = useState({ message: null, isError: false });
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://127.0.0.1:8000/users/hr/create_employee", formData);

      showToast(`✅ Employee Created! ID: ${response.data.id}`, false);

      setFormData({ name: "", email: "", role: "", type: "" });
    } catch (error) {
      console.error("Error creating employee:", error);
      showToast(
        error.response?.data?.error || "Server error, please try again.",
        true
      );
    }
  };

  // Auto-hide toast after 2.5 seconds
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
        <h2 className="text-center mb-4">Registration</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input
              type="text"
              name="name"
              className="form-control"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Email ID</label>
            <input
              type="email"
              name="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Role</label>
            <select
              name="role"
              className="form-select"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="">-- Select Role --</option>
              <option value="HR">HR</option>
              <option value="Manager">Manager</option>
              <option value="Employee">Employee</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Employment Type</label>
            <select
              name="type"
              className="form-select"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="">-- Type --</option>
              <option value="Full-Time">Full time</option>
              <option value="Contract">Contract</option>
              <option value="Intern">Intern</option>
            </select>
          </div>

          <div className="center-btn">
            <button type="submit" className="btn btn-primary w-50">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEmployee;
