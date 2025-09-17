import React, { useEffect, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import "../Styles/DocumentCollection.css";

export default function DocumentCollection() {
  const [employees, setEmployees] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState({ message: "", isError: false });

  const rowsPerPage = 5;
  const API_BASE_URL =
    process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000";

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axios.get("mock-data.json");// `${API_BASE_URL}/documents/all-documents`
        setEmployees(res.data);
      } catch (err) {
        console.error("Error fetching employee docs", err);
        showToast("Failed to load employee data", true);
      }
    };
    fetchEmployees();
  }, [API_BASE_URL]);

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => {
      setToast({ message: "", isError: false });
    }, 3000);
  };

  const handleRequestDocs = async (employeeId) => {
    const requestedAt = new Date().toISOString();
    try {
      const res = await axios.post(
        `${API_BASE_URL}/show-documents/${employeeId}`,
        { requestedAt }
      );
      if (res.status === 200) {
        // Update employee request logs in UI
        setEmployees((prev) =>
          prev.map((emp) =>
            emp._id === employeeId
              ? {
                  ...emp,
                  requestLogs: [...(emp.requestLogs || []), requestedAt],
                }
              : emp
          )
        );
        showToast("Request sent successfully!");
      } else {
        showToast("Failed to send request.", true);
      }
    } catch (err) {
      console.error(err);
      showToast("Error sending request.", true);
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

  // Safe: get document fields from first employee that has documents

  const firstWithDocs = employees.find(
    (emp) => emp.documents && Object.keys(emp.documents).length > 0
  );
  const docFields = firstWithDocs ? Object.keys(firstWithDocs.documents) : [];

  return (
    <div className="docs-table-wrapper">
      <h3>Employee Documents Status</h3>

      {/* Custom toast */}
      {toast.message && (
        <div
          className={`toast-message ${toast.isError ? "error" : "success"}`}
        >
          <FontAwesomeIcon
            icon={toast.isError ? faTimesCircle : faCheckCircle}
            className="me-2"
          />
          {toast.message}
        </div>
      )}

      <div className="table-scroll">
        <table className="docs-table">
          <thead className="text-center">
            <tr>
              <th>Employee Details</th>
              <th>Employment Type</th>
              <th>Summary</th>
              {docFields.map((field) => (
                <th key={field}>{field}</th>
              ))}
              <th>Action</th>
              <th>Request Log</th>
            </tr>
          </thead>
          <tbody className="text-center">
            {currentEmployees.map((emp) => {
              const uploadedCount = Object.values(emp.documents).filter(
                Boolean
              ).length;
              const totalDocs = Object.keys(emp.documents).length;

              return (
                <tr key={emp._id}>
                  <td>
                    <strong>
                      {emp.name} <br />
                    </strong>
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


                  {/* Action Column */}
                  <td>
                    <button
                      className="request-btn"
                      onClick={() => handleRequestDocs(emp._id)}
                    >
                      Request Docs
                    </button>
                  </td>

                      {/* Request Log Column */}
                  <td>
                    {emp.requestLogs && emp.requestLogs.length > 0 ? (
                      <ol className="request-log-list">
                        {emp.requestLogs
                          .slice()
                          .reverse()
                          .map((log, idx) => (
                            <li key={idx}>
                              {new Date(log).toLocaleString()}
                            </li>
                          ))}
                      </ol>
                    ) : (
                      <span className="no-log">No Requests</span>
                    )}
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
