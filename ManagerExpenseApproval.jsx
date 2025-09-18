import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../Manager/Styles/ManagerExpenseApproval.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";

export default function ManagerExpenseApproval() {
  const [expenses, setExpenses] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [editingStatus, setEditingStatus] = useState({});
  const [toast, setToast] = useState({ message: "", isError: false });

  const [reasonModal, setReasonModal] = useState({
    isOpen: false,
    expenseId: null,
    reason: "",
    status: "", 
  });

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem("token"); 
      const res = await axios.get("http://localhost:8000/expenses/mgr-exp-list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExpenses(res.data);
    } catch (err) {
      console.error("Error fetching expenses:", err.response ? err.response.data : err.message);
      showToast("Failed to load expenses", true);
    }

  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleStatusChange = (id, newStatus) => {
    setEditingStatus((prev) => ({ ...prev, [id]: newStatus }));
  };

  const saveStatus = async (id) => {
    const status = editingStatus[id];
    if (!status) return;

    if (status === "Rejected" || status === "Approved") {
      setReasonModal({ isOpen: true, expenseId: id, reason: "", status });
      return;
    }

    try {
      const token = localStorage.getItem("token"); 
      await axios.put(
        `http://localhost:8000/expenses/mgr-upd-status/${id}`,
        null,
        {
          params: { status },
          headers: { Authorization: `Bearer ${token}` }, 
        }
      );

      fetchExpenses();
      showToast(`Status updated to "${status}"`, false);

      setEditingStatus((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    } catch (err) {
      console.error("Error saving Manager status:", err);
      showToast("Failed to update status", true);
    }
  };

  const handleSubmit = async () => {
    if (!reasonModal.reason.trim()) {
      showToast("Please provide a reason", true);
      return;
    }

    try {
      const token = localStorage.getItem("token"); 

      const formData = new FormData();
      formData.append("status", reasonModal.status);
      formData.append("reason", reasonModal.reason);

      await axios.put(
        `http://localhost:8000/expenses/mgr-upd-status/${reasonModal.expenseId}`,
        formData, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data", 
          },
        }
      );

      fetchExpenses();
      showToast(`Status updated to "${reasonModal.status}"`, false);

      setReasonModal({ isOpen: false, expenseId: null, reason: "", status: "" });

      setEditingStatus((prev) => {
        const updated = { ...prev };
        delete updated[reasonModal.expenseId];
        return updated;
      });
    } catch (err) {
      console.error("Error saving Manager rejection:", err);
      showToast("Failed to update status", true);
    }
  };


  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => {
      setToast({ message: "", isError: false });
    }, 2000);
  };

  return (
    <div className="manager-expense-container">
      <h4 className="heading">Manager Expense Approvals</h4>

      {toast.message && (
        <div className={`toast-message ${toast.isError ? "error" : "success"}`}>
          <FontAwesomeIcon
            icon={toast.isError ? faTimesCircle : faCheckCircle}
            className="me-2"
          />
          {toast.message}
        </div>
      )}

      <table className="manager-table">
        <thead>
          <tr className="text-center">
            <th>Employee Details</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Details</th>
            <th>Status</th>
            <th>Action</th>
            <th>Reason</th> {/* Show rejection reason */}
          </tr>
        </thead>
        <tbody>
          {expenses.map((exp) => {
            const currentStatus = exp.status || "Pending";
            const selectedStatus = editingStatus[exp.id] || currentStatus;

            return (
              <React.Fragment key={exp.id}>
                <tr className="text-center">
                  <td className="details">
                    <b>{exp.employeeName}</b> <br /> 
                    <small>{exp.employeeEmail}</small> 
                  </td>
                  <td>{exp.category}</td>
                  <td>
                    {exp.amount} {exp.currency}
                  </td>
                  <td>
                    <button
                      className="btn-view"
                      onClick={() => toggleExpand(exp.id)}
                    >
                      {expandedId === exp.id ? "Hide" : "View"}
                    </button>
                  </td>
                  <td>
                    <span className={`status ${currentStatus.toLowerCase()}`}>
                      {currentStatus}
                    </span>
                  </td>
                  <td>
                    <select
                      className="dropdown-btn"
                      value={selectedStatus}
                      onChange={(e) =>
                        handleStatusChange(exp.id, e.target.value)
                      }
                    >
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>

                    <button
                      className="btn-save"
                      onClick={() => saveStatus(exp.id)}
                      disabled={selectedStatus === currentStatus}
                    >
                      Save
                    </button>
                  </td>
                  <td>{exp.manager_rejection_reason || "-"}</td> 
                </tr>

                {expandedId === exp.id && (
                  <tr className="expand-row">
                    <td colSpan="7">
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

      {reasonModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h5>Reason for Rejection/Approval</h5>
            <textarea
              value={reasonModal.reason}
              onChange={(e) =>
                setReasonModal((prev) => ({
                  ...prev,
                  reason: e.target.value,
                }))
              }
              placeholder="Enter reason..."
            />
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() =>
                  setReasonModal({ isOpen: false, expenseId: null, reason: "", status: "" })
                }
              >
                Cancel
              </button>
              <button className="btn-confirm" onClick={handleSubmit}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}