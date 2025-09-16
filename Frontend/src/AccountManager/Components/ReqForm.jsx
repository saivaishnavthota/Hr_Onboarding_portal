import { useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import "../Styles/ReqForm.css";

export default function ReqForm() {
  const [reqData, setReqData] = useState({
    requirement: "",
    location: "",
    employmentType: "",
    workMode: "",
  });

  const [schema, setSchema] = useState({ fields: [] });
  const [dynamicData, setDynamicData] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: "", isError: false });

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast({ message: "", isError: false }), 3000);
  };

  const handleStaticChange = (e) => {
    const { name, value } = e.target;
    setReqData({ ...reqData, [name]: value });
  };

  const handleDynamicChange = (name, value) => {
    setDynamicData({ ...dynamicData, [name]: value });
  };

  const handleDynamicFileChange = (name, file) => {
    setDynamicData({ ...dynamicData, [name]: file });
  };

  const fetchSchema = async () => {
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5000/generate-schema", reqData);
      setSchema(res.data);
      showToast("Dynamic form generated!");
    } catch (err) {
      console.error(err);
      showToast("Failed to generate dynamic form", true);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(reqData).forEach(([k, v]) => formData.append(k, v));
    Object.entries(dynamicData).forEach(([k, v]) => formData.append(k, v));

    try {
      await axios.post("http://localhost:5000/job-requisition", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showToast("Job requisition submitted successfully!");
      setReqData({ requirement: "", location: "", employmentType: "", workMode: "" });
      setDynamicData({});
      setSchema({ fields: [] });
    } catch (err) {
      console.error(err);
      showToast("Failed to submit requisition", true);
    }
  };

  return (
    <div className="job-req-container">
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

      <form className="job-req-form" onSubmit={handleFinalSubmit}>
        <h2>Job Requisition</h2>

        {/* Requirement full width */}
        <div className="form-group full-width">
          <label>Requirement</label>
          <input
            type="text"
            name="requirement"
            value={reqData.requirement}
            onChange={handleStaticChange}
          />
        </div>

        {/* Other static fields in grid */}
        <div className="form-grid">
          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              name="location"
              value={reqData.location}
              onChange={handleStaticChange}
            />
          </div>
          <div className="form-group">
            <label>Employment Type</label>
            <select
              name="employmentType"
              value={reqData.employmentType}
              onChange={handleStaticChange}
            >
              <option value="">Select</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
            </select>
          </div>
          <div className="form-group">
            <label>Work Mode</label>
            <select
              name="workMode"
              value={reqData.workMode}
              onChange={handleStaticChange}
            >
              <option value="">Select</option>
              <option value="Onsite">Onsite</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>
        </div>

        {schema.fields.length === 0 && (
          <button
            type="button"
            className="btn-secondary"
            onClick={fetchSchema}
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Dynamic Form"}
          </button>
        )}

        {/* Dynamic fields in grid */}
        {schema.fields.length > 0 && (
          <>
            <h3>Additional Job Details</h3>
            <div className="form-grid">
              {schema.fields.map((field, idx) => (
                <div
                  key={idx}
                  className={`form-group ${field.type === "textarea" ? "full-width" : ""}`}
                >
                  <label>{field.label}</label>
                  {field.type === "text" && (
                    <input
                      type="text"
                      onChange={(e) => handleDynamicChange(field.name, e.target.value)}
                    />
                  )}
                  {field.type === "number" && (
                    <input
                      type="number"
                      onChange={(e) => handleDynamicChange(field.name, e.target.value)}
                    />
                  )}
                  {field.type === "textarea" && (
                    <textarea
                      onChange={(e) => handleDynamicChange(field.name, e.target.value)}
                    />
                  )}
                  {field.type === "select" && (
                    <select
                      onChange={(e) => handleDynamicChange(field.name, e.target.value)}
                    >
                      <option value="">Select</option>
                      {field.options.map((opt, i) => (
                        <option key={i} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}
                  {field.type === "date" && (
                    <input
                      type="date"
                      onChange={(e) => handleDynamicChange(field.name, e.target.value)}
                    />
                  )}
                  {field.type === "file" && (
                    <input
                      type="file"
                      onChange={(e) => handleDynamicFileChange(field.name, e.target.files[0])}
                    />
                  )}
                </div>
              ))}
            </div>

            <button type="submit" className="btn-primary">
              Submit Requisition
            </button>
          </>
        )}
      </form>
    </div>
  );
}
