import React, { useState, useEffect } from "react";
import axios from "axios";
import "../Styles/ExpenseDetails.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";
export default function ExpenseDetails() {
  const [activeTab, setActiveTab] = useState("submit");
  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    currency: "",
    description: "",
    date: "",
    taxIncluded: false,
    attachment: null,
  });
  const [expenses, setExpenses] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [toast, setToast] = useState({ message: null, isError: false });

  const user = JSON.parse(localStorage.getItem("user"));
  const employeeId = user?.id;

  // Toast helper
  const showToast = (message, isError = false) => {
    setToast({ message, isError });
  };

  useEffect(() => {
    if (activeTab === "history") {
      axios
        .get(`http://localhost:5000/api/expenses?employeeId=${employeeId}`)
        .then((res) => setExpenses(res.data))
        .catch((err) => {
          console.error("Error fetching expenses:", err);
          showToast("Failed to fetch expense history.", true);
        });
    }
  }, [activeTab, employeeId]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "file" ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });
      data.append("employeeId", employeeId);

      await axios.post("http://localhost:5000/api/expenses", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showToast("Expense submitted successfully!", false);

      setFormData({
        category: "",
        amount: "",
        currency: "",
        description: "",
        date: "",
        taxIncluded: false,
        attachment: null,
      });

      setActiveTab("history");
    } catch (err) {
      console.error("Error submitting expense:", err);
      showToast("Failed to submit expense.", true);
    }
  };

  const handleClear = () => {
    setFormData({
      category: "",
      amount: "",
      currency: "",
      description: "",
      date: "",
      taxIncluded: false,
      attachment: null,
    });
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Auto-hide toast
  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ message: null, isError: false }), 1500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <div className="expense-container">
      {toast.message && (
        <div className={`toast-message ${toast.isError ? "error" : "success"}`}>
            <FontAwesomeIcon
                icon={toast.isError ? faTimesCircle : faCheckCircle}
                className="me-2"
              />
          {toast.message}
        </div>
      )}

      <div className="expense-card">
        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === "submit" ? "active" : ""}`}
            onClick={() => setActiveTab("submit")}
          >
            Submit Expense
          </button>
          <button
            className={`tab ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            Expense History
          </button>
        </div>

        {/* Submit Form */}
        {activeTab === "submit" && (
          <form onSubmit={handleSubmit}>
            <h2>Expense Request</h2>
            <label>Expense Category</label>
            <select name="category" value={formData.category} onChange={handleChange} required>
              <option value="">Select Category</option>
              <option value="Travel">Travel</option>
              <option value="Food">Food</option>
              <option value="Accommodation">Accommodation</option>
              <option value="Office Supplies">Office Supplies</option>
              <option value="Training">Training</option>
              <option value="Gifts">Gifts</option>
              <option value="Miscellaneous">Miscellaneous</option>
              <option value="Other">Other</option>
            </select>

            <div className="form-row">
              <div>
                <label>Amount</label>
                <input type="number" name="amount" value={formData.amount} onChange={handleChange} required />
              </div>
              <div>
                <label>Currency</label>
                <select name="currency" value={formData.currency} onChange={handleChange} required>
                  <option value="">Select Currency</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="INR">INR</option>
                </select>
              </div>
            </div>

            <label>Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} />

            <label>Expense Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              max={new Date().toISOString().split("T")[0]}
            />

            <label className="checkbox-label">
              <input type="checkbox" name="taxIncluded" checked={formData.taxIncluded} onChange={handleChange} />
              Tax is included in the amount
            </label>

            <label>Attachment (PDF, JPG, PNG)</label>
            <input type="file" name="attachment" onChange={handleChange} />

            <div className="button-row">
              <button type="button" className="btn-clear" onClick={handleClear}>
                Clear Form
              </button>
              <button type="submit" className="btn-submit">
                Submit Request
              </button>
            </div>
          </form>
        )}

        {/* Expense History */}
        {activeTab === "history" && (
          <div className="history">
            <h2>Expense History</h2>
            <button className="btn-clear" onClick={() => setActiveTab("submit")} style={{ marginBottom: "16px" }}>
              ← Back
            </button>
            <ul className="history-list">
              {expenses.map((exp) => (
                <li key={exp.id} className="history-item">
                  <strong>{exp.category}</strong>
                  <div>
                    <button className="btn-hide" onClick={() => toggleExpand(exp.id)}>
                      {expandedId === exp.id ? "Hide" : "View"}
                    </button>
                    <span
                      className={`status ${
                        exp.status === "Approved"
                          ? "status-approved"
                          : exp.status === "Rejected"
                          ? "status-rejected"
                          : "status-pending"
                      }`}
                    >
                      {exp.status || "Pending Manager Approval"}
                    </span>
                  </div>
                  {expandedId === exp.id && (
                    <div style={{ marginTop: "10px" }}>
                      <p>
                        <strong>Amount:</strong> {exp.amount} {exp.currency}
                      </p>
                      <p>
                        <strong>Description:</strong> {exp.description}
                      </p>
                      <p>
                        <strong>Date:</strong> {exp.date}
                      </p>
                      <p>
                        <strong>Tax Included:</strong> {exp.taxIncluded ? "Yes" : "No"}
                      </p>
                      {exp.attachment && (
                        <p>
                          <a href={exp.attachment} target="_blank" rel="noreferrer">
                            View Attachment
                          </a>
                        </p>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
