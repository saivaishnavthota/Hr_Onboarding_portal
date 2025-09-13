import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom"; // For modals
import axios from "axios";
import { FaEdit, FaTrash } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import "../Styles/OnboardingDocs.css";

export default function OnboardingDocs() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", type: "" });
  const [loadingDocs, setLoadingDocs] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [toast, setToast] = useState({ message: null, isError: false });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/employees");
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch employees", true);
    }
  };

  const handleViewDocuments = async (employee) => {
    setSelectedEmployee(employee);
    setShowDocModal(true);
    setLoadingDocs(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/employees/${employee.id}/documents`);
      setDocuments(res.data);
    } catch (err) {
      console.error(err);
      showToast("Failed to fetch documents", true);
    }
    setLoadingDocs(false);
  };

  const handleApproveDocuments = async () => {
    const allRequiredUploaded = documents
      .filter((doc) => doc.required)
      .every((doc) => doc.status === "Uploaded");

    if (!allRequiredUploaded) {
      showToast("⚠️ All required documents must be uploaded before approving!", true);
      return;
    }

    try {
      await axios.post(
        `http://localhost:5000/api/employees/approve-documents`,
        { employeeId: selectedEmployee.id }
      );

      setDocuments(documents.map((doc) => ({ ...doc, status: "Approved" })));
      setEmployees(
        employees.map((emp) =>
          emp.id === selectedEmployee.id ? { ...emp, status: "Approved" } : emp
        )
      );

      showToast("✅ All documents approved successfully!", false);
    } catch (err) {
      console.error(err);
      showToast("Failed to approve documents", true);
    }
  };

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setEditForm({
      name: employee.name,
      email: employee.email,
      type: employee.type,
    });
    setShowEditModal(true);
  };

  const handleUpdateEmployee = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/employees/${selectedEmployee.id}`,
        editForm
      );
      setEmployees(
        employees.map((emp) =>
          emp.id === selectedEmployee.id ? { ...emp, ...editForm } : emp
        )
      );
      setShowEditModal(false);
      showToast("✅ Employee updated successfully!", false);
    } catch (err) {
      console.error(err);
      showToast("Failed to update employee", true);
    }
  };

  const handleDelete = (employeeId) => {
    setEmployees(employees.filter((emp) => emp.id !== employeeId));
    showToast("Employee deleted successfully!", false);
  };

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast({ message: null, isError: false }), 3000);
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || emp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container py-4">
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

      <h3 className="text-center mb-4">Employee Management</h3>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <input
          type="text"
          className="form-control w-50"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="form-select w-25 ms-2"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
        </select>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered table-striped text-center">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Type</th>
              <th>Documents</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp) => (
                <tr key={emp.id}>
                  <td>{emp.name}</td>
                  <td>{emp.email}</td>
                  <td>
                    <span
                      className={`type ${
                        emp.type === "Intern"
                          ? "type-intern"
                          : emp.type === "Full-Time"
                          ? "type-fulltime"
                          : emp.type === "Contract"
                          ? "type-contract"
                          : "type-default"
                      }`}
                    >
                      {emp.type}
                    </span>
                  </td>
                  <td>
                    <button
                      className="view"
                      onClick={() => handleViewDocuments(emp)}
                    >
                      View Docs
                    </button>
                  </td>
                  <td>
                    <span
                      className={`status-ap-badge ${emp.status
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`}
                    >
                      {emp.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-warning btn-sm me-2"
                      onClick={() => handleEdit(emp)}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(emp.id)}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">No employees found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Documents Modal */}
      {showDocModal &&
        ReactDOM.createPortal(
          <div className="modal-overlay">
            <div className="modal-card docs-modal-card">
              <h4>Documents of {selectedEmployee?.name}</h4>
              {loadingDocs ? (
                <p>Loading documents...</p>
              ) : (
                <>
                  <div className="docs-grid">
                    {documents.map((doc, i) => (
                      <div className="doc-box" key={i}>
                        <span
                          className={`status-badge ${doc.status
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          {doc.status}
                        </span>
                        <div className="doc-name">{doc.name}</div>
                        <div className="doc-preview">
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {doc.fileName || "Preview File"}
                          </a>
                        </div>
                        <div
                          className={`required-tag ${
                            doc.required ? "" : "optional"
                          }`}
                        >
                          {doc.required ? "Required" : "Optional"}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="approve-all-btn">
                    <button
                      className="btn btn-success"
                      onClick={handleApproveDocuments}
                      disabled={documents.every(
                        (doc) => doc.status === "Approved"
                      )}
                    >
                      Approve
                    </button>
                  </div>
                </>
              )}
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowDocModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Edit Employee Modal */}
      {showEditModal &&
        ReactDOM.createPortal(
          <div className="modal-overlay">
            <div className="modal-card edit-modal-card">
              <h4 className="mb-3">Edit Employee</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.type}
                    onChange={(e) =>
                      setEditForm({ ...editForm, type: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="modal-footer mt-3">
                <button
                  className="btn btn-primary me-2"
                  onClick={handleUpdateEmployee}
                >
                  Update
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
