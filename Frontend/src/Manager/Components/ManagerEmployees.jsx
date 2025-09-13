import React, { useEffect, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";

export default function ManagerEmployees() {
  const [employees, setEmployees] = useState([]);
  const [editRow, setEditRow] = useState(null);
  const [projectInput, setProjectInput] = useState({});
  const [toast, setToast] = useState({ message: null, isError: false });
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast({ message: null, isError: false }), 3000);
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/employees`);
      setEmployees(res.data);
      showToast("Employees loaded successfully!");
    } catch (err) {
      console.error("Error fetching employees:", err);
      showToast("Failed to fetch employees", true);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const submitProject = async (empId) => {
    const project = projectInput[empId];
    if (!project) {
      showToast("Project field cannot be empty", true);
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/employees/${empId}/projects`, { project });
      showToast("Project added successfully!");
      fetchEmployees();
      setProjectInput((prev) => ({ ...prev, [empId]: "" }));
      setEditRow(null);
    } catch (err) {
      console.error("Error submitting project:", err);
      showToast("Failed to submit project", true);
    }
  };

  return (
    <div className="manager-employees">
      {/* Toast */}
      {toast.message && (
        <div className={`toast-message ${toast.isError ? "error" : "success"}`}>
          <FontAwesomeIcon
            icon={toast.isError ? faTimesCircle : faCheckCircle}
            className="me-2"
          />
          {toast.message}
        </div>
      )}

      <div className="table-responsive m-5">
        <table className="table table-sm table-bordered table-striped text-center small-table-text">
          <thead className="thead-dark">
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>HR(s)</th>
              <th>Projects</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => {
              const isEditing = editRow === emp.employeeId;
              return (
                <tr key={emp.employeeId}>
                  <td>{emp.employeeId}</td>
                  <td>{emp.name}</td>
                  <td>{emp.email}</td>
                  <td>
                    {emp.hr && emp.hr.length > 0 ? (
                      emp.hr.map((hr, i) => <div key={i}>{hr}</div>)
                    ) : (
                      <span style={{ color: "#999" }}>Not Assigned</span>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        placeholder="Enter project"
                        value={projectInput[emp.employeeId] || ""}
                        onChange={(e) =>
                          setProjectInput((prev) => ({
                            ...prev,
                            [emp.employeeId]: e.target.value,
                          }))
                        }
                      />
                    ) : emp.projects && emp.projects.length > 0 ? (
                      emp.projects.map((p, i) => <div key={i}>{p}</div>)
                    ) : (
                      <span style={{ color: "#999" }}>No Projects</span>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <>
                        <button
                          className="btn btn-sm btn-warning me-2"
                          onClick={() => setEditRow(null)}
                        >
                          Cancel
                        </button>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => submitProject(emp.employeeId)}
                        >
                          Submit
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => setEditRow(emp.employeeId)}
                      >
                        Edit
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
