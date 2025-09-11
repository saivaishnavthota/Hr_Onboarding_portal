import React, { useEffect, useState } from "react";

export default function ManagerEmployees() {
  const [employees, setEmployees] = useState([]);
  const [editRow, setEditRow] = useState(null);
  const [projectInput, setProjectInput] = useState({}); 
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const fetchEmployees = () => {
    fetch(`${API_BASE_URL}/employees`)
      .then((res) => res.json())
      .then((data) => setEmployees(data))
      .catch((err) => console.error("Error fetching employees:", err));
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const submitProject = (empId) => {
    const project = projectInput[empId];
    if (!project) return;

    fetch(`/${empId}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project }),
    })
      .then((res) => res.json())
      .then(() => {
        fetchEmployees(); 
        setProjectInput((prev) => ({ ...prev, [empId]: "" })); 
        setEditRow(null);
      })
      .catch((err) => console.error("Error submitting project:", err));
  };

  return (
    <div className="manager-employees">
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
