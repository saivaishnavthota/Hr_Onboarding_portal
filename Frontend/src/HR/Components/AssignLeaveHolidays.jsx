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
      .get("http://127.0.0.1:8000/locations")
      .then((res) => {
        const data = res.data;
        if (Array.isArray(data.data)) {
          setLocations(data.data);
        } else {
          console.error("Unexpected locations response:", data);
          setLocations([]);
        }
      })
      .catch((err) => {
        console.error(err);
        setLocations([]);
      });
  }, []);

  // Fetch employees
  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/users/employees")
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
        holiday_date: formData.date,
        holiday_name: formData.reason,
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
      setHolidays(res.data.data || []);
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
      setHolidays(res.data.data || []);
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

  // ✅ FIX: use emp.id consistently
  const handleEmployeeChange = (id, field, value) => {
    setEmployees((prev) =>
      prev.map((emp) =>
        emp.id === id ? { ...emp, [field]: value } : emp
      )
    );
  };

  const handleSubmitRow = async (id) => {
    const updatedEmployee = employees.find((emp) => emp.id === id);

    if (
      updatedEmployee.sick_leaves < 0 ||
      updatedEmployee.casual_leaves < 0 ||
      updatedEmployee.paid_leaves < 0
    ) {
      toast.error("Leave values cannot be negative!");
      return;
    }

    try {
      await axios.put(`http://127.0.0.1:8000/leave-balance/${id}`, {
        sick_leaves: updatedEmployee.sick_leaves,
        casual_leaves: updatedEmployee.casual_leaves,
        paid_leaves: updatedEmployee.paid_leaves,
      });
      toast.success(`Employee ${updatedEmployee.name}'s leaves updated!`);
      setEditingRow(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update leaves.");
    }
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
                ? locations.find((loc) => loc.id === Number(selectedLocation))
                    ?.name
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
                    <td>{h.holiday_date}</td>
                    <td>{h.holiday_name}</td>
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
                ? locations.find((loc) => loc.id === Number(selectedLocation))
                    ?.name
                : ""}
            </h5>
            <Calendar
              tileClassName={({ date, view }) => {
                if (view === "month") {
                  const localDate = date.toLocaleDateString("en-CA");
                  if (holidays.some((h) => h.holiday_date === localDate)) {
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
              <th>Sick Leaves</th>
              <th>Casual Leaves</th>
              <th>Paid Leaves</th>
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

                {["sick_leaves", "casual_leaves", "paid_leaves"].map((field) => (
                  <td key={field}>
                    <input
                      type="number"
                      value={emp[field] ?? 0}
                      onChange={(e) =>
                        handleEmployeeChange(emp.id, field, Number(e.target.value))
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
