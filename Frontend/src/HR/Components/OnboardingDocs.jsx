import React, { useEffect, useState } from "react";
import "../Styles/OnboardingDocs.css";

export default function OnboardingDocs() {
  const [employees, setEmployees] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;


  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/employees`);
        const data = await res.json();
        setEmployees(data);
      } catch (err) {
        console.error("Error fetching employee docs", err);
      }
    };
    fetchEmployees();
  }, []);

  const handleRequestDocs = async (employeeId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/show-documents/${employeeId}`,
        { method: "POST" }
      );
      if (res.ok) {
        alert("Request sent successfully!");
      } else {
        alert("Failed to send request.");
      }
    } catch (err) {
      console.error(err);
      alert("Error sending request.");
    }
  };

 
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentEmployees = employees.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(employees.length / rowsPerPage);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  if (!employees.length) return <p>Loading...</p>;

  const docFields = Object.keys(employees[0].documents);

  return (
    <div className="docs-table-wrapper">
      <h3>Employee Documents Status</h3>
      <div className="table-scroll">
        <table className="docs-table">
          <thead>
            <tr>
              <th>Name (Email)</th>
              <th>Role</th>
              <th>Summary</th>
              {docFields.map((field) => (
                <th key={field}>{field}</th>
              ))}
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentEmployees.map((emp) => {
              const uploadedCount = Object.values(emp.documents).filter(Boolean)
                .length;
              const totalDocs = Object.keys(emp.documents).length;
              return (
                <tr key={emp._id}>
                  <td>
                    {emp.name} <br />
                    <small>{emp.email}</small>
                  </td>
                  <td>{emp.role}</td>
                  <td>
                    <span className="summary-pill">
                      {uploadedCount}/{totalDocs} uploaded
                    </span>
                  </td>
                  {docFields.map((field) => (
                    <td key={field}>
                      <span
                        className={`status-pill ${
                          emp.documents[field] ? "uploaded" : "not-uploaded"
                        }`}
                      >
                        {emp.documents[field] ? "Uploaded" : "Not Uploaded"}
                      </span>
                    </td>
                  ))}
                  <td>
                    <button
                      className="request-btn"
                      onClick={() => handleRequestDocs(emp._id)}
                    >
                      Request Docs
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button onClick={() => goToPage(currentPage - 1)}>◀</button>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            className={currentPage === i + 1 ? "active" : ""}
            onClick={() => goToPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
        <button onClick={() => goToPage(currentPage + 1)}>▶</button>
        <span className="page-info">
          Page {currentPage} of {totalPages}
        </span>
      </div>
    </div>
  );
}
