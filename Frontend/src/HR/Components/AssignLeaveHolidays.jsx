import React, { useEffect, useState } from "react";
import axios from "axios";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSyncAlt } from "@fortawesome/free-solid-svg-icons";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../Styles/AssignLeaveHolidays.css";

export default function AssignLeaveHolidays() {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [formData, setFormData] = useState({ date: "", reason: "" });
  const [holidays, setHolidays] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [editingRow, setEditingRow] = useState(null);
  const [showHolidaysTable, setShowHolidaysTable] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // Fetch locations
  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/locations/")
      .then((res) => setLocations(res.data))
      .catch((err) => console.error(err));
  }, []);

  // Fetch employees
  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/users")
      .then((res) => setEmployees(res.data))
      .catch((err) => console.error(err));
  }, []);

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };


const handleAddHoliday = async () => {
  if (!selectedLocation) {
    toast.error("Please select a location!");
    return;
  }
  if (!formData.date || !formData.reason) {
    toast.warn("Both date and reason are required!");
    return;
  }
  try {
    await axios.post("http://127.0.0.1:8000/calendar/add", {
      location_id: Number(selectedLocation),
      date: formData.date,
      reason: formData.reason,
    });
    toast.success("Holiday added successfully!");
    setFormData({ date: "", reason: "" });
    handleViewHolidays(); // refresh holidays
  } catch (err) {
    console.error(err);
    toast.error("Failed to add holiday.");
  }
};


const handleViewHolidays = async () => {
  if (!selectedLocation) {
    toast.error("Select a location first!");
    return;
  }
  try {
    const res = await axios.get(
      `http://127.0.0.1:8000/calendar/by-location/${selectedLocation}`
    );
    setHolidays(res.data || []);
    setShowHolidaysTable(true);
    setShowCalendar(false);
    toast.info("Showing holidays table!");
  } catch (err) {
    console.error(err);
    toast.error("Failed to fetch holidays.");
  }
};


 const handleViewCalendar = async () => {
  if (!selectedLocation) {
    toast.error("Select a location first!");
    return;
  }
  try {
    const res = await axios.get(
      `http://127.0.0.1:8000/calendar/by-location/${selectedLocation}`
    );
    setHolidays(res.data || []);
    setShowCalendar(true);
    setShowHolidaysTable(false);
    toast.info("Showing holiday calendar!");
  } catch (err) {
    console.error(err);
    toast.error("Failed to fetch calendar holidays.");
  }
};


  // 🔄 Refresh Section 1
  const handleRefresh = () => {
    setSelectedLocation("");
    setFormData({ date: "", reason: "" });
    setHolidays([]);
    setShowHolidaysTable(false);
    setShowCalendar(false);
    toast.success("Section reset!");
  };

  const handleEditRow = (id) => setEditingRow(id);

  const handleEmployeeChange = (id, field, value) => {
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === id ? { ...emp, [field]: value } : emp))
    );
  };

  const handleSubmitRow = (id) => {
    const updatedEmployee = employees.find((emp) => emp.id === id);
    console.log("Updated employee:", updatedEmployee);

    // Example validation
    if (
      updatedEmployee.sickLeave < 0 ||
      updatedEmployee.casualLeave < 0 ||
      updatedEmployee.annualLeave < 0
    ) {
      toast.error("Leave values cannot be negative!");
      return;
    }

    toast.success(`Employee ${updatedEmployee.name}'s leaves updated!`);
    setEditingRow(null);
  };

  return (
    <div className="assign-container">
      <ToastContainer position="top-right" autoClose={2000} />
      <h2 className="page-title">Assign Leave & Holidays</h2>

      {/* Section 1: Location & Holidays */}
      <div className="section">
        <h3 className="sub-title">Location & Public Holidays</h3>

        <div className="form-section">
          <label className="label">Location:</label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="dropdown"
          >
            <option value="">-- Select Location --</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-section">
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleFormChange}
            className="input"
            required
          />
          <input
            type="text"
            name="reason"
            value={formData.reason}
            onChange={handleFormChange}
            placeholder="Reason"
            className="input"
            required
          />
          <button onClick={handleAddHoliday} className="btn add-btn">
            Add
          </button>
          <button onClick={handleViewHolidays} className="btn view-btn">
            View
          </button>
          <button onClick={handleViewCalendar} className="btn calendar-btn">
            Calendar
          </button>
          <button onClick={handleRefresh} className="btn refresh-btn">
            <FontAwesomeIcon icon={faSyncAlt} />
          </button>
        </div>

        {showHolidaysTable && (
          <div className="table-wrapper">
            <h5 className="text-center">
              Public Holidays for{" "}
              {selectedLocation
                ? locations.find((loc) => loc.id === selectedLocation)?.name
                : ""}
            </h5>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {holidays.map((h, i) => (
                  <tr key={i}>
                    <td>{h.date}</td>
                    <td>{h.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showCalendar && (
          <div className="calendar-wrapper">
            <h5 className="text-center">
              Public Holidays for{" "}
              {selectedLocation
                ? locations.find((loc) => loc.id === selectedLocation)?.name
                : ""}
            </h5>
            <Calendar
              tileClassName={({ date, view }) => {
                if (view === "month") {
                  const localDate = date.toLocaleDateString("en-CA");
                  if (holidays.some((h) => h.date === localDate)) {
                    return "holiday-date";
                  }
                }
                return null;
              }}
            />
          </div>
        )}
      </div>

      {/* Section 2: Employees */}
      <div className="section">
        <h3 className="sub-title">Employee Leaves</h3>
        <table className="custom-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Type</th>
              <th>Sick</th>
              <th>Casual</th>
              <th>Annual</th>
              <th>Maternity</th>
              <th>Paternity</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id}>
                <td>{emp.id}</td>
                <td>{emp.name}</td>
                <td>{emp.email}</td>
                <td>{emp.type}</td>
                {[
                  "sickLeave",
                  "casualLeave",
                  "annualLeave",
                  "maternity",
                  "paternity",
                ].map((field) => (
                  <td key={field}>
                    <input
                      type="number"
                      value={emp[field]}
                      onChange={(e) =>
                        handleEmployeeChange(emp.id, field, e.target.value)
                      }
                      disabled={editingRow !== emp.id}
                      className="table-input"
                    />
                  </td>
                ))}
                <td>
                  {editingRow === emp.id ? (
                    <button
                      className="btn submit-btn"
                      onClick={() => handleSubmitRow(emp.id)}
                    >
                      Submit
                    </button>
                  ) : (
                    <button
                      className="btn edit-btn"
                      onClick={() => handleEditRow(emp.id)}
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
