import React, { useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTimes, faCheck } from "@fortawesome/free-solid-svg-icons";
import { faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
function DropdownCheckbox({ label, options, selectedValues, onChange }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (value) => {
    let updated;
    if (selectedValues.includes(value)) {
      updated = selectedValues.filter((v) => v !== value);
    } else {
      updated = [...selectedValues, value];
    }
    onChange(updated);
  };

  return (
    <div
      className="dropdown-checkbox"
      ref={dropdownRef}
      style={{ position: "relative", display: "inline-block", width: "200px" }}
    >
      <button
        type="button"
        className="btn btn-sm btn-light w-100 text-start"
        onClick={() => setOpen(!open)}
      >
        {label}: {selectedValues.length > 0 ? `${selectedValues.length} selected` : "None"}
        <span style={{ float: "right" }}>▼</span>
      </button>
      {open && (
        <div
          className="dropdown-menu show p-2 border rounded bg-white shadow-sm"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            width: "100%",
            maxHeight: "200px",
            overflowY: "auto",
            zIndex: 1000,
          }}
        >
          {options.map((opt) => (
            <label key={opt.id} style={{ display: "block", fontSize: "0.85em" }}>
              <input
                type="checkbox"
                checked={selectedValues.includes(opt.id)}
                onChange={() => toggleOption(opt.id)}
              />{" "}
              {opt.name}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EmployeeForm() {
  const [employees, setEmployees] = useState([]);
  const [managersList, setManagersList] = useState([]);
  const [HRList, setHRList] = useState([]);
  const [editRow, setEditRow] = useState(null);
  const [selectedHR, setSelectedHR] = useState({});
  const [selectedMgr, setSelectedMgr] = useState({});
  const [toast, setToast] = useState({ message: null, isError: false });

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const showToast = React.useCallback((message, isError = false) => {
    setToast({ message, isError });
  }, []);

  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ message: null, isError: false }), 2500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchEmployees = React.useCallback(async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/users/employees");
      setEmployees(res.data);
    } catch (err) {
      console.error("Error fetching employees:", err);
      showToast("Failed to fetch employees.", true);
    }
  }, [API_BASE_URL, showToast]);

  const fetchManagers = React.useCallback(async () => {
  try {
    const res = await axios.get("http://127.0.0.1:8000/users/managers");
    setManagersList(Array.isArray(res.data) ? res.data : res.data.managers || []);
  } catch (err) {
    console.error("Error fetching managers:", err);
    showToast("Failed to fetch managers.", true);
  }
}, [API_BASE_URL, showToast]);

const fetchHRs = React.useCallback(async () => {
  try {
    const res = await axios.get("http://127.0.0.1:8000/users/hrs");
    setHRList(Array.isArray(res.data) ? res.data : res.data.HRs || []);
  } catch (err) {
    console.error("Error fetching HR:", err);
    showToast("Failed to fetch HR list.", true);
  }
}, [API_BASE_URL, showToast]);

  useEffect(() => {
    fetchEmployees();
    fetchManagers();
    fetchHRs();
  }, [fetchEmployees, fetchManagers, fetchHRs]);

  const submitChanges = async (empId) => {
    const hrIds = selectedHR[empId] || [];
    const mgrIds = selectedMgr[empId] || [];

    if (hrIds.length === 0 && mgrIds.length === 0) {
      showToast("No HR/Manager selected for assignment.", true);
      return;
    }

    try {
      await axios.post("http://127.0.0.1:8000/users/assign", {
        emp_id: empId,
        manager1_id: mgrIds[0] || null,
        manager2_id: mgrIds[1] || null,
        manager3_id: mgrIds[2] || null,
        hr1_id: hrIds[0] || null,
        hr2_id: hrIds[1] || null,
      });

      showToast("Assignments updated successfully!");
      fetchEmployees();
      setEditRow(null);
    } catch (err) {
      console.error("Error submitting:", err);
      showToast("Failed to update assignments.", true);
    }
  };

  return (
    <div className="employee-form bg-light">
      {toast.message && (
        <div className={`toast-message ${toast.isError ? "error" : "success"}`}>
           <FontAwesomeIcon
                icon={toast.isError ? faTimesCircle : faCheckCircle}
                className="me-2"
              />
          {toast.message}
        </div>
      )}

      <h3 className="text-center my-4">Employee Management</h3>
      <h6 className="text-left m-5">Assign HR/Managers</h6>
      <div className="table-responsive m-5">
        <table className="table table-sm table-bordered table-striped text-center small-table-text">
          <thead className="thead-dark">
            <tr>
              <th>S.No</th>
              <th>Employee Details</th>
              <th>Type</th>
              <th>HR(s)</th>
              <th>Manager(s)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp, empIndex) => {
              const isEditing = editRow === emp.employeeId;
              return (
                <tr key={emp.employeeId}>
                  <td>{empIndex + 1}</td>
                  <td>
                    {emp.name}
                    <br />
                    <span style={{ fontSize: "0.85em", color: "#888" }}>{emp.email}</span>
                  </td>
                  <td>{emp.type}</td>

                  <td>
                    {!isEditing &&
                      (emp.hr.length > 0 ? (
                        emp.hr.map((hr, i) => <div key={i}>{hr}</div>)
                      ) : (
                        <span style={{ color: "#999" }}>Not Assigned</span>
                      ))}

                    {isEditing && (
                      <DropdownCheckbox
                        label="HR"
                        options={HRList}
                        selectedValues={selectedHR[emp.employeeId] || []}
                        onChange={(updated) =>
                          setSelectedHR((prev) => ({ ...prev, [emp.employeeId]: updated }))
                        }
                      />
                    )}
                  </td>

                  <td>
                    {!isEditing &&
                      (emp.managers.length > 0 ? (
                        emp.managers.map((mgr, i) => <div key={i}>{mgr}</div>)
                      ) : (
                        <span style={{ color: "#999" }}>Not Assigned</span>
                      ))}

                    {isEditing && (
                      <DropdownCheckbox
                        label="Manager"
                        options={managersList}
                        selectedValues={selectedMgr[emp.employeeId] || []}
                        onChange={(updated) =>
                          setSelectedMgr((prev) => ({ ...prev, [emp.employeeId]: updated }))
                        }
                      />
                    )}
                  </td>

                  <td>
                    {isEditing ? (
                      <>
                        <button
                          className="btn btn-sm btn-danger me-2"
                          onClick={() => setEditRow(null)}
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => submitChanges(emp.employeeId)}
                        >
                          <FontAwesomeIcon icon={faCheck} />
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => {
                          setEditRow(emp.employeeId);
                          setSelectedHR((prev) => ({ ...prev, [emp.employeeId]: emp.hr || [] }));
                          setSelectedMgr((prev) => ({ ...prev, [emp.employeeId]: emp.managers || [] }));
                        }}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
