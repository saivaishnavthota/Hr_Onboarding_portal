import React, { useState, useEffect } from "react";
import { FaUpload, FaCheckCircle } from "react-icons/fa";
import axios from "axios";
import "./NewUserDocsUpload.css";
import { useNavigate } from "react-router-dom";

const acceptedFormats = [".pdf", ".doc", ".docx", ".jpg", ".png"];


const user = JSON.parse(localStorage.getItem("user") || "{}");
const employeeId = user.id;  // ✅ employeeId comes from the saved user object



const sections = {

  employeeDocs: {

    title: "Employee Documents",

    fields: [

      { name: "updated_resume", label: "Updated Resume", required: false },

      { name: "offer_letter", label: "Offer Letter", required: false },

      { name: "latest_compensation_letter", label: "Latest Compensation Letter", required: false },

      { name: "experience_relieving_letter", label: "Experience & Relieving Letter", required: false },

      { name: "latest_3_months_payslips", label: "Latest 3 months Pay Slips", required: false },

      { name: "form16_or_12b_or_taxable_income", label: "Form 16/ Form 12B / Taxable Income Statement", required: false },

    ],

  },

  educationDocs: {

    title: "Educational Documents",

    fields: [

      { name: "ssc_certificate", label: "SSC Certificate", required: false },

      { name: "hsc_certificate", label: "HSC Certificate", required: false },

      { name: "hsc_marksheet", label: "HSC Marksheet", required: false },

      { name: "graduation_marksheet", label: "Graduation Marksheet", required: false },

      { name: "latest_graduation_certificate", label: "Latest Graduation", required: true },

      { name: "postgraduation_marksheet", label: "Post-Graduation Marksheet", required: false },

      { name: "postgraduation_certificate", label: "Post-Graduation Certificate", required: false },

    ],

  },

  identityDocs: {

    title: "Identity Proof",

    fields: [

      { name: "aadhar", label: "Aadhar", required: true },

      { name: "pan", label: "PAN", required: true },

      { name: "passport", label: "Passport", required: false },

    ],

  },

};

export default function NewUserDocsUpload() {
  const [files, setFiles] = useState({});
  const [previewUrls, setPreviewUrls] = useState({});
  const [openSection, setOpenSection] = useState(null);
  const [toast, setToast] = useState({ message: null, isError: false });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const isFormValid = () => {
    for (const [, section] of Object.entries(sections)) {
      for (const field of section.fields) {
        if (field.required && !files[field.name]) return false;
      }
    }
    return true;
  };

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast({ message: null, isError: false }), 3000);
  };

  const handleDraft = async () => {
    const formData = new FormData();

     formData.append("employeeId", employeeId);
     
    Object.keys(files).forEach((key) => {
      if (files[key] instanceof File) formData.append(key, files[key]);
    });

    try {
      await axios.post("http://127.0.0.1:8000/onboarding/upload", formData);
      showToast("Draft saved successfully!");
    } catch (err) {
      console.error(err);
      showToast("Failed to save draft", true);
    }
  };

  const handleSubmitAll = async () => {
    if (!isFormValid()) {
      showToast("Please upload all required documents before submitting!", true);
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append("employeeId", employeeId);
    Object.keys(files).forEach((key) => {
      if (files[key] instanceof File) formData.append(key, files[key]);
    });

    try {
      await axios.post("http://127.0.0.1:8000/onboarding/upload", formData);
      showToast("Documents submitted successfully!");
    } catch (err) {
      console.error(err);
      showToast("Error while submitting employee documents.", true);
      setSubmitting(false);
    }
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setFiles({ ...files, [field]: file });
      setPreviewUrls({ ...previewUrls, [field]: URL.createObjectURL(file) });
    }
  };

  const getUploadedCount = (section) =>
    section.fields.filter((f) => files[f.name]).length;

  // ✅ Fetch previously uploaded files
  useEffect(() => {
    async function fetchData() {
      try {
        const { data } = await axios.get(`http://127.0.0.1:8000/onboarding/doc/${employeeId}`, {
          withCredentials: true,
        });
        const fetchedFiles = {};
        const fetchedPreviews = {};
        Object.keys(data).forEach((field) => {
          if (data[field]) {
            fetchedPreviews[field] = data[field];
            fetchedFiles[field] = { name: data[field].split("/").pop(), url: data[field] };
          }
        });
        setFiles(fetchedFiles);
        setPreviewUrls(fetchedPreviews);
      } catch (err) {
        console.error("Error fetching uploaded docs:", err);
      }
    }
    fetchData();
  }, []);

  if (submitting) {
    return (
      <div className="thank-you-container">
        <div className="thank-you-box">
          <div className="spinner"></div>
          <h2>Thank You for Completing Onboarding Process</h2>
          <p>We will get back to you soon...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="upload-container">
      {toast.message && (
        <div className={`toast-message ${toast.isError ? "error" : "success"}`}>
          {toast.message}
        </div>
      )}

      <div className="upload-box">
        <h4>Documents Upload</h4>
        <h6 id="text">
          <span className="required">*</span> marked documents are mandatory
        </h6>

        {Object.entries(sections).map(([key, section]) => (
          <div key={key} className="section">
            <div
              className="section-header"
              onClick={() => setOpenSection(openSection === key ? null : key)}
            >
              <h5>{section.title}</h5>
              <span className="count">
                {getUploadedCount(section)} / {section.fields.length} uploaded
              </span>
              <span className="arrow">{openSection === key ? "▲" : "▼"}</span>
            </div>

            {openSection === key && (
              <div className="section-content">
                {section.fields.map((field) => (
                  <div
                    key={field.name}
                    className={`upload-card ${files[field.name] ? "uploaded" : ""}`}
                    onClick={() => document.getElementById(field.name).click()}
                  >
                    <div className="upload-label">
                      {field.label} {field.required && <span className="required">*</span>}
                    </div>

                    <div className="upload-status">
                      {files[field.name] ? (
                        <>
                          <FaCheckCircle className="icon success" /> Uploaded
                        </>
                      ) : (
                        <>
                          <FaUpload className="icon" /> Click to upload
                        </>
                      )}
                    </div>

                    <input
                      id={field.name}
                      type="file"
                      accept={acceptedFormats.join(",")}
                      style={{ display: "none" }}
                      onChange={(e) => handleFileChange(e, field.name)}
                      disabled={submitting}
                    />

                    {files[field.name] && (
                      <a
                        href={previewUrls[field.name]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="preview-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {files[field.name].name || "View File"}
                      </a>
                    )}
                  </div>
                ))}
                <p className="note">
                  Accepted formats: {acceptedFormats.join(", ")}
                </p>
              </div>
            )}
          </div>
        ))}

        <div className="button-group">
          <button type="button" className="btn back" onClick={() => navigate("/new-user-form")} disabled={submitting}>
            ⬅ Back
          </button>
          <button type="button" className="btn draft" onClick={handleDraft} disabled={submitting}>
            Save Draft
          </button>
          <button type="button" className="btn submit" onClick={handleSubmitAll} disabled={submitting}>
            Submit All
          </button>
        </div>
      </div>
    </div>
  );
}
