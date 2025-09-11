import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "../Styles/EmployeeAttendence.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";
 
export default function EmployeeAttendence() {
  const [activeTab, setActiveTab] = useState("weekly");
  const [attendance, setAttendance] = useState({});
 
  const formatDate = (date) => date.toISOString().split("T")[0];
 
  const getWeekDates = () => {
  const today = new Date();
  const monday = new Date(today);
 
  monday.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
 
 
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
};
 
 
  const weekDates = getWeekDates();
 
  const handleFieldChange = (date, field, value) => {
    const key = formatDate(date);
    setAttendance((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };
 
  const summary = {
    Present: weekDates.filter((d) => attendance[formatDate(d)]?.action === "Present").length,
    WFH: weekDates.filter((d) => attendance[formatDate(d)]?.action === "WFH").length,
    Leave: weekDates.filter((d) => attendance[formatDate(d)]?.action === "Leave").length,
  };
 
  const getStatusColor = (status) => {
    if (status === "Present") return "green";
    if (status === "WFH") return "blue";
    if (status === "Leave") return "red";
    return "black";
  };
 
  const formatFullDate = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
 
 const getCurrentWeekRange = () => {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
 
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
 
  return `${formatFullDate(monday)} - ${formatFullDate(friday)}`;
};
 
const [toast, setToast] = useState({ message: null, isError: false });
  const token = localStorage.getItem("token");
  const handleSubmit = async () => {
    try {
      const response = await fetch("https://7af2b81040a6.ngrok-free.app/attendance", {
        method: "POST",
       headers: {
       "Content-Type": "application/json",
       "Authorization": `Bearer ${token}`,   // ✅ must be inside headers
       },
        body: JSON.stringify(attendance),
          });

      const data = await response.json();
     
      if (data.success) {
       setToast({ message: data.message || "Attendence Submitted successfully!", isError: false });
      } else {
         setToast({ message: data.error || "Invalid credentials", isError: true });
      }
    } catch (err) {
      console.error("Login error:", err);
      setToast({ message: "Server error, please try again.", isError: true });
    }
  };
 
  useEffect(() => {
      if (toast.message) {
        const timer = setTimeout(() => setToast({ message: null, isError: false }), 2000);
        return () => clearTimeout(timer);
      }
    }, [toast]);
 
  return (
    <div className="attendance-container container py-4">
      {toast.message && (
      <div className={`toast-message ${toast.isError ? "error" : "success"}`}>
        <FontAwesomeIcon
          icon={toast.isError ? faTimesCircle : faCheckCircle}
          className="me-2"
        />
        {toast.message}
      </div>
    )}
      <h3 className="text-center mb-4">Employee Attendance</h3>
       
   
      <ul className="nav nav-tabs">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "weekly" ? "active" : ""}`}
            onClick={() => setActiveTab("weekly")}
          >
            Weekly View
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "calendar" ? "active" : ""}`}
            onClick={() => setActiveTab("calendar")}
          >
            Calendar View
          </button>
        </li>
      </ul>
 
      <div className="tab-content p-3 border border-top-0">
       
        {activeTab === "weekly" && (
          <>
            <div className="row text-center mb-4">
              <div className="col-md-4"><h6>Present</h6><p className="text-success">{summary.Present}</p></div>
              <div className="col-md-4"><h6>Work From Home</h6><p className="text-primary">{summary.WFH}</p></div>
              <div className="col-md-4"><h6>Leave</h6><p className="text-danger">{summary.Leave}</p></div>
            </div>
 
            <h5 className="week-heading text-center">Current Week: {getCurrentWeekRange()}</h5>
 
            <table className="table table-bordered text-center attendance-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Date</th>
                  <th>Action</th>
                  <th>Status</th>
                  <th>No. of Hours</th>
                  <th>Project Name</th>
                </tr>
              </thead>
              <tbody>
                {weekDates.map((date, idx) => {
                  const key = formatDate(date);
                  const entry = attendance[key] || {};
                  return (
                    <tr key={idx}>
                      <td>{date.toLocaleDateString("en-US", { weekday: "long" })}</td>
                      <td>{date.getDate()}-{date.toLocaleDateString("en-US", { month: "short" })}</td>
                      <td>
                        <select
                          className="form-control"
                          value={entry.action || ""}
                          onChange={(e) => handleFieldChange(date, "action", e.target.value)}
                        >
                          <option value="">-- Select --</option>
                          <option value="Present">Present</option>
                          <option value="WFH">WFH</option>
                          <option value="Leave">Leave</option>
                        </select>
                      </td>
                      <td style={{ color: getStatusColor(entry.action) }}>
                        {entry.action || "Not Marked"}
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Hours"
                          value={entry.hours || ""}
                          onChange={(e) => handleFieldChange(date, "hours", e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Project Name"
                          value={entry.project || ""}
                          onChange={(e) => handleFieldChange(date, "project", e.target.value)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
 
            <div className="text-center mt-3">
              <button className="btn btn-primary" onClick={handleSubmit}>
                Submit Attendance
              </button>
            </div>
          </>
        )}
 
       
        {activeTab === "calendar" && (
          <Calendar
            value={null}
            onChange={() => {}}
            onClickDay={() => {}}
            tileContent={({ date }) => {
              const key = formatDate(date);
              const entry = attendance[key];
              return entry?.action ? (
                <div
                  style={{
                    fontSize: "0.7rem",
                    marginTop: "3px",
                    color: getStatusColor(entry.action),
                  }}
                >
                  {entry.action} ({entry.hours || "-"}h)
                </div>
              ) : null;
            }}
          />
        )}
      </div>
    </div>
  );
}