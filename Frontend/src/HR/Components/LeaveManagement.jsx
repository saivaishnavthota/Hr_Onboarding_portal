import React, { useEffect, useState } from "react";
import "../Styles/LeaveManagement.css";

export default function LeaveManagement() {
  const [activeTab, setActiveTab] = useState("pending");
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [toast, setToast] = useState({ message: null, isError: false });

  
  const fetchLeaves = () => {
  
    fetch("http://localhost:5000/api/hr/pending-leaves")
      .then((res) => res.json())
      .then((data) => setPendingLeaves(data))
      .catch((err) => console.error("Error fetching pending leaves:", err));

    fetch("http://localhost:5000/api/hr/all-leaves")
      .then((res) => res.json())
      .then((data) => setAllRequests(data))
      .catch((err) => console.error("Error fetching all leaves:", err));
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleAction = (leaveId, action) => {
    fetch(`http://localhost:5000/api/hr/leave-action/${leaveId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setToast({ message: data.message || "Action successful!", isError: false });
          fetchLeaves();
        } else {
          setToast({ message: data.error || "Action failed", isError: true });
        }
      })
      .catch((err) => setToast({ message: "Server error", isError: true }));
  };

  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ message: null, isError: false }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <div className="hr-leave-container container py-4">
      {toast.message && (
        <div className={`toast-message ${toast.isError ? "error" : "success"}`}>
          {toast.message}
        </div>
      )}
      <h3 className="text-center mb-4">HR Leave Management</h3>

      <div className="tabs-wrapper mb-4">
        <button
          className={`tab-btn ${activeTab === "pending" ? "active" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          Pending Leaves
        </button>
        <button
          className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All Requests
        </button>
      </div>

      <div className="tab-content">
      
        {activeTab === "pending" && (
          <div className="table-responsive">
            {pendingLeaves.length === 0 ? (
              <p>No pending leave requests.</p>
            ) : (
              <table className="table table-bordered table-hover">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Employee Name / Email</th>
                    <th>Leave Type</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Days</th>
                    <th>Action</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingLeaves.map((leave) => (
                    <tr key={leave.id}>
                      <td>{leave.employee_id}</td>
                      <td>
                        {leave.employee_name}
                        <br />
                        <small>{leave.email}</small>
                      </td>
                      <td>{leave.leave_type}</td>
                      <td>{leave.start_date}</td>
                      <td>{leave.end_date}</td>
                      <td>{leave.days}</td>
                      <td>
                        <button
                          className="btn btn-success btn-sm me-2"
                          onClick={() => handleAction(leave.id, "Approved")}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleAction(leave.id, "Rejected")}
                        >
                          Reject
                        </button>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            leave.status === "Pending"
                              ? "bg-warning text-dark"
                              : leave.status === "Approved"
                              ? "bg-success"
                              : "bg-danger"
                          }`}
                        >
                          {leave.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "all" && (
          <div className="table-responsive">
            {allRequests.length === 0 ? (
              <p>No processed leave requests.</p>
            ) : (
              <table className="table table-bordered table-hover">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Employee Name / Email</th>
                    <th>Leave Type</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Days</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allRequests.map((leave) => (
                    <tr key={leave.id}>
                      <td>{leave.employee_id}</td>
                      <td>
                        {leave.employee_name}
                        <br />
                        <small>{leave.email}</small>
                      </td>
                      <td>{leave.leave_type}</td>
                      <td>{leave.start_date}</td>
                      <td>{leave.end_date}</td>
                      <td>{leave.days}</td>
                      <td>
                        <span
                          className={`badge ${
                            leave.status === "Approved"
                              ? "bg-success"
                              : "bg-danger"
                          }`}
                        >
                          {leave.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
