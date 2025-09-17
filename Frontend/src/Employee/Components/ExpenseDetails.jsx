import React, { useState, useEffect } from "react";
import axios from "axios";
import "../Styles/ExpenseDetails.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faTimesCircle
} from "@fortawesome/free-solid-svg-icons";
 
export default function ExpenseDetails() {
  const [activeTab, setActiveTab] = useState("submit");
  
  const [toast, showToast] = useState({ message: null, isError: false });
  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    currency: "",
    description: "",
    expense_date: "",
    tax_included: false,
    attachment: null,
  });
  const [expenses, setExpenses] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
 const [expenseDetails, setExpenseDetails] = useState([]);

  const user = JSON.parse(localStorage.getItem("user"));
  const employeeId = user?.id;
 
  // Fetch history from backend
  useEffect(() => {
    if (activeTab === "history") {
      axios
        .get(`http://localhost:8000/expenses/employee/${employeeId}`) 
        .then((res) => {
          setExpenses(res.data);
        })
        .catch((err) => {
          console.error("Error fetching expenses:", err);
          showToast("Failed to fetch expense history.", true);
        });
    }
  }, [activeTab, employeeId]);
 
  // Handle form changes
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "file" ? files[0] : value,
    }));
  };
 
  // Submit expense
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
 
      // Add employee ID
      data.append("employee_id", employeeId);
      data.append("category", formData.category);
      data.append("amount", formData.amount);
      data.append("currency", formData.currency);
      data.append("description", formData.description);
      data.append("expense_date", formData.expense_date);
      data.append("tax_included", formData.tax_included);
      if (formData.attachment) {
        data.append("file", formData.attachment);
      }
 
      await axios.post("http://localhost:8000/expenses/submit-exp", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
 
      alert("Expense submitted!");
 
      // Reset form
      setFormData({
        category: "",
        amount: "",
        currency: "",
        description: "",
        expense_date: "",
        tax_included: false,
        attachment: null,
      });
 
      // Redirect to history tab
      setActiveTab("history");
    } catch (err) {
      console.error("Error submitting expense:", err);
      showToast("Failed to submit expense.", true);
    }
  };
 
  // Clear form
  const handleClear = () => {
    setFormData({
      category: "",
      amount: "",
      currency: "",
      description: "",
      expense_date: "",
      tax_included: false,
      attachment: null,
    });
  };
 const fetchExpenseDetails = async (requestId) => {
  try {
    const res = await axios.get(`http://localhost:8000/expenses/details/${requestId}`);
    setExpenseDetails(Array.isArray(res.data) ? res.data : []);
  } catch (err) {
    console.error("Error fetching expense details:", err);
    showToast("Failed to fetch expense details.", true);
  }
};
  
const toggleExpand = async (id) => {
  if (expandedId === id) {
    setExpandedId(null);
    setExpenseDetails([]);
  } else {
    setExpandedId(id);
    await fetchExpenseDetails(id);
  }
};
 
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
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
 
            <label>Expense Date</label>
            <input
              type="date"
              name="expense_date"
              value={formData.expense_date}
              onChange={handleChange}
              required
              max={new Date().toISOString().split("T")[0]}
            />
 
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="tax_included"
                checked={formData.tax_included}
                onChange={handleChange}
              />
              Tax is included in the amount
            </label>
 
            <label>Attachment (Supported Formats: PDF, JPG, PNG)</label>
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
                <li key={exp.request_id} className="history-item">
                  <strong>{exp.category}</strong>
                  <div>
                    <button
                      className="btn-hide"
                      onClick={() => toggleExpand(exp.request_id)}
                    >
                      {expandedId === exp.request_id ? "Hide" : "View"}
                    </button>
                    <span
                      className={`status ${
                        exp.status === "approved"
                          ? "status-approved"
                          : exp.status === "rejected"
                          ? "status-rejected"
                          : "status-pending"
                      }`}
                    >
                      {exp.status || "Pending Manager Approval"}
                    </span>
                  </div>
                  {expandedId === exp.request_id && (
                    <div style={{ marginTop: "10px" }}>
                      <p>
                        <strong>Amount:</strong> {exp.amount} {exp.currency}
                      </p>
                      <p>
                        <strong>Description:</strong> {exp.description}
                      </p>
                      <p>
                        <strong>Date:</strong> {exp.expense_date}
                      </p>
                      <p>
                        <strong>Tax Included:</strong>{" "}
                        {exp.tax_included ? "Yes" : "No"}
                      </p>

                      {exp.attachments &&
                        exp.attachments.map((att) => (
                          <p key={att.attachment_id}>
                            <a
                              href={`http://localhost:8000/${att.file_path}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View Attachment
                            </a>
                          </p>
                        ))}

                          <table className="expense-details-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Reason</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseDetails.map((detail, idx) => (
                    <tr key={idx}>
                      <td>{detail.name}</td>
                      <td>{detail.reason || "-"}</td>
                      <td>{detail.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

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
 
 