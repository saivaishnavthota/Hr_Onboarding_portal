import React, { useEffect, useRef, useState } from "react";
import "../Styles/ApplyLeave.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";

export default function ApplyLeave() {
const user = JSON.parse(localStorage.getItem("user"));
const employeeId = user?.id;

  const formSectionRef = useRef(null);

  const [leaveBalances, setLeaveBalances] = useState({});
  const [leaveHistory, setLeaveHistory] = useState([]);

  const [leaveType, setLeaveType] = useState("");
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalDays, setTotalDays] = useState(0);

  const [activeTab, setActiveTab] = useState("apply");
  const [toast, setToast] = useState({ message: null, isError: false });


const fetchData = React.useCallback(() => {
  const token = localStorage.getItem("token");
  if (!token || !employeeId) {
    console.error("User not logged in or ID missing!");
    return;
  }
  fetch(`https://92a58a58219c.ngrok-free.app/leave_balances/${employeeId}`, {
    headers: { "Authorization": `Bearer ${token}` }
  })
    .then(async (res) => {
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error("Invalid JSON response:", text);
        throw e;
      }
    })
    .then((data) => setLeaveBalances(data))
    .catch((err) => console.error("Error fetching balances:", err));

  fetch(`https://92a58a58219c.ngrok-free.app/all_leaves/${employeeId}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    }
  })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP error! ${res.status}`);
      return res.json();
    })
    .then((data) => setLeaveHistory(data))
    .catch((err) => console.error("Error fetching history:", err));
}, [employeeId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  const handleScrollToForm = () => {
    formSectionRef.current.scrollIntoView({ behavior: "smooth" });
  };

  
  const calculateDays = (start, end) => {
    if (start && end) {
      let s = new Date(start),
        e = new Date(end),
        count = 0;
      while (s <= e) {
        if (s.getDay() !== 0 && s.getDay() !== 6) {
          count++;
        }
        s.setDate(s.getDate() + 1);
      }
      setTotalDays(count);
    }
  };

  
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!leaveType) {
    alert("Please select a leave type");
    return;
  }
  if (totalDays <= 0) {
    alert("Please select valid start and end dates");
    return;
  }
  if (!reason.trim()) {
    alert("Please provide a reason");
    return;
  }

  try {

    const token = localStorage.getItem("token"); 
    if (!token) {
      alert("You are not logged in!");
      return;
    }

    const response = await fetch("https://7af2b81040a6.ngrok-free.app/apply_leave", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` // Include JWT
      },
      body: JSON.stringify({
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason
      }),
    });


    const data = await response.json();

      if (data.success) {
        setToast({ message: data.message || "Leave applied successfully!", isError: false });
      } else {
        setToast({ message: data.error || "Error apply", isError: true });
      }

     
      setLeaveType("");
      setReason("");
      setStartDate("");
      setEndDate("");
      setTotalDays(0);
      setActiveTab("history");

     
      fetchData();
    }
  catch (err) {
    console.error("Error applying leave:", err);
    alert("Failed to apply leave. Check console for details.");
  }
};

useEffect(() => {
           if (toast.message) {
             const timer = setTimeout(() => setToast({ message: null, isError: false }), 2000);
          return () => clearTimeout(timer);
          }
        }, [toast]);

  const totalAvailable =
    (leaveBalances.Sick?.available || 0) +
    (leaveBalances.Casual?.available || 0) +
    (leaveBalances.Annual?.available || 0);

  const totalApplied =
    (leaveBalances.Sick?.applied || 0) +
    (leaveBalances.Casual?.applied || 0) +
    (leaveBalances.Annual?.applied || 0);

  return (
    <div className="apply-leave-container container py-4">
      <h3 className="text-center mb-4">Apply for Leave</h3>

      {toast.message && (
        <div className={`toast-message ${toast.isError ? "error" : "success"}`}>
          <FontAwesomeIcon icon={toast.isError ? faTimesCircle : faCheckCircle} className="me-2" />
          {toast.message}
        </div>
      )}

    
      <div className="row text-center mb-4">
        <div className="col-md-6">
          <div className="leave-summary">
            <h5>Total Applied Leaves</h5>
            <p>{totalApplied}</p>
          </div>
        </div>
        <div className="col-md-6">
          <div className="leave-summary">
            <h5>Total Available Leaves</h5>
            <p>{totalAvailable}</p>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-end mb-3">
        <button className="btn btn-primary" onClick={handleScrollToForm}>
          Apply Leave
        </button>
      </div>

     
      <div className="leave-cards-wrapper mb-4">
        <div className="leave-card sick text-center">
          <h5>Sick Leave</h5>
          <p>Applied: {leaveBalances.Sick?.applied || 0}</p>
          <p>Available: {leaveBalances.Sick?.available || 0}</p>
        </div>
        <div className="leave-card casual text-center">
          <h5>Casual Leave</h5>
          <p>Applied: {leaveBalances.Casual?.applied || 0}</p>
          <p>Available: {leaveBalances.Casual?.available || 0}</p>
        </div>
        <div className="leave-card annual text-center">
          <h5>Annual/Earned Leave</h5>
          <p>Applied: {leaveBalances.Annual?.applied || 0}</p>
          <p>Available: {leaveBalances.Annual?.available || 0}</p>
        </div>
      </div>

      <hr />

      
      <div ref={formSectionRef} className="form-section mt-4">
        <ul className="nav nav-tabs">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "apply" ? "active" : ""}`}
              onClick={() => setActiveTab("apply")}
            >
              Apply Leave
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "history" ? "active" : ""}`}
              onClick={() => setActiveTab("history")}
            >
              Past Leaves
            </button>
          </li>
        </ul>

        <div className="tab-content p-3 border border-top-0">
        
          {activeTab === "apply" && (
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label>Leave Type</label>
                <select
                  className="form-control"
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                >
                  <option value="">-- Select Leave Type --</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Casual">Casual Leave</option>
                  <option value="Annual">Annual/Earned Leave</option>
                  <option value="Maternity">Maternity Leave</option>
                  <option value="Paternity">Paternity Leave</option>
                </select>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label>Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      calculateDays(e.target.value, endDate);
                    }}
                  />
                </div>
                <div className="col-md-6">
                  <label>End Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      calculateDays(startDate, e.target.value);
                    }}
                  />
                </div>
              </div>

              <div className="mb-3">
  <label>Total Days for Leave</label>
  <p className="form-control">
    {totalDays > 0 ? totalDays : "Select Start and End Date"}
  </p>
</div>


              <div className="mb-3">
                <label>Reason</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for leave"
                ></textarea>
              </div>

              <button type="submit" className="btn btn-success">
                Apply for Leave
              </button>
            </form>
          )}

          {/* Past Leaves */}
          {activeTab === "history" && (
            <div className="leave-history">
              {leaveHistory.length === 0 ? (
                <p>No leaves applied yet.</p>
              ) : (
                <table className="table table-bordered table-striped">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Leave Type</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Total Days</th>
                      <th>Reason</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveHistory.map((leave, index) => (
                      <tr key={index}>
                        <td>{leave.id}</td>
                        <td>{leave.type}</td>
                        <td>{leave.startDate}</td>
                        <td>{leave.endDate}</td>
                        <td>{leave.days}</td>
                        <td>{leave.reason}</td>
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
    </div>
  );
}