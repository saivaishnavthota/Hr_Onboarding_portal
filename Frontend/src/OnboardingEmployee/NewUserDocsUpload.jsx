import React, { useState, useEffect } from "react";
import { FaUpload, FaCheckCircle } from "react-icons/fa";

import "./NewUserDocsUpload.css";
import { useNavigate } from "react-router-dom"; 
const acceptedFormats = [".pdf", ".doc", ".docx", ".jpg", ".png"];

const sections = {
  employeeDocs: {
    title: "Employee Documents",
    fields: [
      { name: "resume", label: "Updated Resume", required: false },
      { name: "offerLetter", label: "Offer Letter", required: false },
      { name: "compensation", label: "Latest Compensation Letter", required: false },
      { name: "experience", label: "Experience & Relieving Letter", required: false },
      { name: "payslips", label: "Latest 3 months Pay Slips", required: false },
      { name: "form16", label: "Form 16/ Form 12B / Taxable Income Statement", required: false },
    ],
  },
  educationDocs: {
    title: "Educational Documents",
    fields: [
      { name: "ssc", label: "SSC Certificate", required: false },
      { name: "hsc", label: "HSC Certificate", required: false },
      { name: "hscMark", label: "HSC Marksheet", required: false },
      { name: "gradMark", label: "Graduation Marksheet", required: false },
      { name: "latestGrad", label: "Latest Graduation", required: true },
      { name: "pgMark", label: "Post-Graduation Marksheet", required: false },
      { name: "pgCert", label: "Post-Graduation Certificate", required: false },
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
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
    const navigate = useNavigate(); 

  
  const isFormValid = () => {
    for (const [, section] of Object.entries(sections)) {
      for (const field of section.fields) {
        if (field.required && !files[field.name]) {
          return false;
        }
      }
    }
    return true;
  };

 
  const handleDraft = async () => {
    const formData = new FormData();
    Object.keys(files).forEach((key) => {
      if (files[key] instanceof File) {
        formData.append(key, files[key]);
      }
    });

    try {
      const response = await fetch("http://127.0.0.1:8000/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("Draft saved successfully!");
      } else {
        alert("Failed to save draft.");
      }
    } catch (error) {
      console.error(error);
      alert("Error while saving draft.");
    }
  };


  // Submit API
 const handleSubmit = async () => {
  if (!isFormValid()) {
    alert("Please upload all required documents before submitting!");
    return;
  }

  try {
    for (const [docType, file] of Object.entries(files)) {
      if (file) {
        const formData = new FormData();
        formData.append("employeeId", 1); // replace with actual employeeId from user context/session
        formData.append("doc_type", docType);
        formData.append("file", file);

        const response = await fetch("http://127.0.0.1:8000/documents/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();
        console.log(result);
      }
    }

    alert("All documents submitted successfully!");
  } catch (error) {
    console.error(error);
    alert("Error while submitting documents.");
  }
};


  const handleSubmitAll = async () => {
  const employeeDetails = JSON.parse(localStorage.getItem("employeeDetails"));

  if (!employeeDetails) {
    alert("Employee details missing! Please go back and fill the form.");
    return;
  }

  if (!isFormValid()) {
    alert("Please upload all required documents before submitting!");
    return;
  }

  const formData = new FormData();

  Object.keys(employeeDetails).forEach((key) => {
    formData.append(key, employeeDetails[key]);
  });
  
  Object.keys(files).forEach((key) => {
    if (files[key] instanceof File) {
      formData.append(key, files[key]);
    }
  });

  try {
    const response = await fetch("http://127.0.0.1:8000/documents/upload", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      alert("Employee registered successfully!");
      localStorage.removeItem("employeeDetails"); 

      navigate("/");
    } else {
      alert("Failed to submit details and documents.");
    }
  } catch (error) {
    console.error(error);
    alert("Error while submitting employee registration.");
  }
};


  
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`http://127.0.0.1:8000/documents/`, {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
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
        }
      } catch (err) {
        console.error("Error fetching uploaded docs:", err);
      }
    }

    fetchData();
  }, [API_BASE_URL]);

 
  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setFiles({ ...files, [field]: file });
      setPreviewUrls({ ...previewUrls, [field]: URL.createObjectURL(file) });
    }
  };


  const getUploadedCount = (section) =>
    section.fields.filter((f) => files[f.name]).length;

  return (
    <div className="upload-container">
      <div className="upload-box">
        <h4>Documents Upload</h4>
        <h6 id="text"> <span className="required">*</span> marked documents are mandatory to upload</h6>

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
                      {field.label}{" "}
                      {field.required && <span className="required">*</span>}
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
  <button type="button" className="btn back" onClick={() => navigate("/new-user-form")}>
    ⬅ Back
  </button>
  <button type="button" className="btn draft" onClick={handleDraft}>
    Save Draft
  </button>
  <button type="button" className="btn submit" onClick={handleSubmitAll}>
    Submit All
  </button>
</div>

      </div>
    </div>
  );
}
