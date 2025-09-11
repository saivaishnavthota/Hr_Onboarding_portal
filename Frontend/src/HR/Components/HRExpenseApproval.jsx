import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../Manager/Styles/ManagerExpenseApproval.css";

export default function HRExpenseApproval() {
  const [expenses, setExpenses] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [editingStatus, setEditingStatus] = useState({}); // store selected status

  // Fetch all expenses
  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/expenses");
      setExpenses(res.data);
    } catch (err) {
      console.error("Error fetching expenses:", err);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Handle dropdown change
  const handleStatusChange = (id, newStatus) => {
    setEditingStatus((prev) => ({ ...prev, [id]: newStatus }));
  };

  // Save new status to backend
  const saveStatus = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/expenses/${id}`, {
        status: editingStatus[id],
      });
      fetchExpenses();
      setEditingStatus((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    } catch (err) {
      console.error("Error saving status:", err);
    }
  };

  return (
    <div className="manager-container">
      <h4 className="heading">HR Expense Approvals</h4>

      <table className="manager-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((exp) => {
            const currentStatus = exp.status || "Pending";
            const selectedStatus = editingStatus[exp.id] || currentStatus;

            return (
              <React.Fragment key={exp.id}>
                <tr>
                  <td>{exp.employeeName}
                  <span> <small>
                  {exp.employeeEmail} </small></span></td> 

                  <td>{exp.category}</td>
                  <td>
                    {exp.amount} {exp.currency}
                  </td>
                  <td>
                    <span className={`status ${currentStatus.toLowerCase()}`}>
                      {currentStatus}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-view"
                      onClick={() => toggleExpand(exp.id)}
                    >
                      {expandedId === exp.id ? "Hide" : "View"}
                    </button>

                    <select
                      value={selectedStatus}
                      onChange={(e) =>
                        handleStatusChange(exp.id, e.target.value)
                      }
                    >
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>

                    <button
                      className="btn-save"
                      onClick={() => saveStatus(exp.id)}
                      disabled={selectedStatus === currentStatus} // ✅ disable if unchanged
                    >
                      Save
                    </button>
                  </td>
                </tr>

                {/* Expanded row */}
                {expandedId === exp.id && (
                  <tr className="expand-row">
                    <td colSpan="6">
                      <div className="details">
                        <p>
                          <strong>Description:</strong> {exp.description}
                        </p>
                        <p>
                          <strong>Date:</strong> {exp.date}
                        </p>
                        <p>
                          <strong>Tax Included:</strong>{" "}
                          {exp.taxIncluded ? "Yes" : "No"}
                        </p>
                        {exp.attachment && (
                          <p>
                            <a
                              href={exp.attachment}
                              target="_blank"
                              rel="noreferrer"
                            >
                              View Attachment
                            </a>
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
