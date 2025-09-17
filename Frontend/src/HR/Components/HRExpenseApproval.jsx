import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../Manager/Styles/ManagerExpenseApproval.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";

export default function HRExpenseApproval() {
  const [expenses, setExpenses] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [editingStatus, setEditingStatus] = useState({});
  const [toast, setToast] = useState({ message: "", isError: false });

  
  const [reasonModal, setReasonModal] = useState({
    isOpen: false,
    expenseId: null,
    reason: "",
    status:"",
  });
 


  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await axios.get("mock-data.json");
      setExpenses(res.data);
    } catch (err) {
      console.error("Error fetching expenses:", err);
      showToast("Failed to load expenses", true);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleStatusChange = (id, newStatus) => {
    setEditingStatus((prev) => ({ ...prev, [id]: newStatus }));
  };

  const saveStatus = async (id) => {
    const status = editingStatus[id];
    if (!status) return;


    if (status==="Rejected" || status==="Approved"){
      setReasonModal({ isOpen: true, expenseId: id, reason: "" });
      return;
    }

    try {
      await axios.put(
        `http://localhost:8000/expenses/mgr-upd-status/${id}`,
        null,
        { params: { status } }
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
      await axios.put(
        `http://localhost:8000/expenses/mgr-upd-status/${reasonModal.expenseId}`,
        null,
        { params: { status: reasonModal, reason: reasonModal.reason } }
      );
    
      fetchExpenses();
      showToast(`Status updated to "${reasonModal.status}"`, false);
    
       setReasonModal({ isOpen: false, expenseId: null, reason: "",status:"" });

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
      <h4 className="heading">HR Expense Approvals</h4>

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
             <th>Reason</th>
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
                  <td>{exp.reason || "-"}</td>
                </tr>

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

      
      {reasonModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h5>Reason for Rejection</h5>
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
                  setReasonModal({ isOpen: false, expenseId: null, reason: "", status:"" })
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
