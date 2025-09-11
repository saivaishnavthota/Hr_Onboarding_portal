import React, { useState } from "react";
import "../Styles/DocumentCollection.css";

export default function DocumentCollection() {
  const [employeeId, setEmployeeId] = useState("");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

 const handleFetchDocs = async (e) => {
  e.preventDefault();
  if (!employeeId.trim()) return alert("Enter an Employee ID");
  
  setLoading(true);
  try {
    const res = await fetch(`http://127.0.0.1:8000/documents/${employeeId}`);
    const data = await res.json();
    console.log("Docs response:", data);

    // Convert JSON into array for table
    const transformed = Object.entries(data)
      .filter(([key]) => key !== "employeeId" && key !== "uploaded_at") // skip metadata
      .map(([key, value]) => ({
        name: key,
        uploaded: value,
        url: value ? `http://127.0.0.1:8000/documents/${data.employeeId}/${key}` : null,
      }));

    setDocuments(transformed);
  } catch (err) {
    console.error(err);
    alert("Failed to fetch documents");
  } finally {
    setLoading(false);
  }
};


  const handleRequestDocs = async () => {
    try {
      await fetch(`http://127.0.0.1:8000/documents/${employeeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      alert("Request sent successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to send request");
    }
  };

  return (
    <div className="doc-container">
      <div className="doc-form">
        <h3>Employee Document Collection</h3>
        <form onSubmit={handleFetchDocs} className="doc-search">
          <input
            type="text"
            placeholder="Enter Employee ID"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          />
          <button type="submit">Fetch Documents</button>
        </form>
      </div>

      {loading && (
  <div className="spinner-container">
    <div className="spinner"></div>
    <p>Loading documents...</p>
  </div>
)}


      {!loading && documents.length > 0 && (
        <div className="doc-table-wrapper">
          <h3>Documents for Employee ID: {employeeId}</h3>
          <table className="doc-table">
            <thead>
              <tr>
                <th>Document Name</th>
                <th>Preview</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc, idx) => (
                <tr key={idx}>
                  <td>{doc.name}</td>
                  <td>
                    {doc.url ? (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        Open file
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    <span
                      className={`status-pill ${doc.uploaded ? "uploaded" : "not-uploaded"}`}
                    >
                      {doc.uploaded ? "Uploaded" : "Not Uploaded"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="request-btn-container">
            <button className="request-btn" onClick={handleRequestDocs}>
              Request Document
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
