import React, { useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTimes, faCheck } from "@fortawesome/free-solid-svg-icons";


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
        {label}:{" "}
        {selectedValues.length > 0 ? `${selectedValues.length} selected` : "None"}
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
 
  
  const fetchEmployees = () => {
    fetch("http://127.0.0.1:8000/users/employees")
      .then((res) => res.json())
      .then((data) => setEmployees(data))
      .catch((err) => console.error("Error fetching employees:", err));
  };

  useEffect(() => {
    fetchEmployees();

    fetch("http://127.0.0.1:8000/users/managers")
      .then((res) => res.json())
      .then((data) => setManagersList(data))
      .catch((err) => console.error("Error fetching managers:", err));

    fetch("http://127.0.0.1:8000/users/hrs")
      .then((res) => res.json())
      .then((data) => setHRList(data))
      .catch((err) => console.error("Error fetching HR:", err));
  }, []);

  const submitChanges = (empId) => {
    const hrIds = selectedHR[empId] || [];
    const mgrIds = selectedMgr[empId] || [];

    const requests = [];

if (hrIds.length > 0 || mgrIds.length > 0) {
  requests.push(
    fetch("http://127.0.0.1:8000/users/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        emp_id: editRow.id,     // or however you track the employee
        manager1_id: mgrIds[0] || null,
        manager2_id: mgrIds[1] || null,
        manager3_id: mgrIds[2] || null,
        hr1_id: hrIds[0] || null,
        hr2_id: hrIds[1] || null,
      }),
    })
  );
}


    Promise.all(requests)
      .then(() => {
        fetchEmployees();
        setEditRow(null);
      })
      .catch((err) => console.error("Error submitting:", err));
  };

  return (
    <div className="employee-form">
      <div className="table-responsive m-5">
        <table className="table table-sm table-bordered table-striped text-center small-table-text">
          <thead className="thead-dark">
            <tr>
              <th>S.No</th>
              <th>Employee Details</th>
              <th>Role</th>
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
                    <span style={{ fontSize: "0.85em", color: "#888" }}>
                      {emp.email}
                    </span>
                  </td>
                  <td>{emp.role}</td>
                 <td>
  {!isEditing && (
    emp.hr.length > 0 ? (
      emp.hr.map((hr, i) => <div key={i}>{hr}</div>)
    ) : (
      <span style={{ color: "#999" }}>Not Assigned</span>
    )
  )}

  {isEditing && (
    <DropdownCheckbox
      label="HR"
      options={HRList}
      selectedValues={selectedHR[emp.employeeId] || []}
      onChange={(updated) =>
        setSelectedHR((prev) => ({
          ...prev,
          [emp.employeeId]: updated,
        }))
      }
    />
  )}
</td>

                 <td>
  {!isEditing && (
    emp.managers.length > 0 ? (
      emp.managers.map((mgr, i) => <div key={i}>{mgr}</div>)
    ) : (
      <span style={{ color: "#999" }}>Not Assigned</span>
    )
  )}

  {isEditing && (
    <DropdownCheckbox
      label="Manager"
      options={managersList}
      selectedValues={selectedMgr[emp.employeeId] || []}
      onChange={(updated) =>
        setSelectedMgr((prev) => ({
          ...prev,
          [emp.employeeId]: updated,
        }))
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
                          
                          setSelectedHR((prev) => ({
                            ...prev,
                            [emp.employeeId]: emp.hr || [],
                          }));
                          setSelectedMgr((prev) => ({
                            ...prev,
                            [emp.employeeId]: emp.managers || [],
                          }));
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
