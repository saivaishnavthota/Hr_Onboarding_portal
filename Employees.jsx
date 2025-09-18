import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export default function Employees() {
  const [month, setMonth] = useState("09");
  const [year, setYear] = useState("2025");
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = "http://127.0.0.1:8000";

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token"); // JWT token from login

        const res = await axios.get(`${API_BASE_URL}/attendance/hr-assigned`, {
          params: { month: parseInt(month), year: parseInt(year) },
          headers: { Authorization: `Bearer ${token}` },
        });

        const formatted = res.data.map(emp => ({
          id: emp.employee_id,
          name: emp.name,
          email: emp.email,
          department: emp.department || "N/A",
          present: emp.present || 0,
          wfh: emp.wfh || 0,
          leave: emp.leave || 0
        }));

        setEmployees(formatted);
        toast.success("Employees loaded successfully!");
      } catch (err) {
        console.error("Error fetching employees:", err);
        setError("Failed to load employees");
        toast.error("Failed to load employees");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [month, year]);

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase());
    const matchesDept = department === "All" || (emp.department && emp.department === department);
    return matchesSearch && matchesDept;
  });

  // Summary stats
  const totalEmployees = employees.length;
  const totalPresent = employees.reduce((sum, e) => sum + e.present, 0);
  const totalWfh = employees.reduce((sum, e) => sum + e.wfh, 0);
  const totalLeave = employees.reduce((sum, e) => sum + e.leave, 0);

  // Export Excel
  const exportToExcel = () => {
    if (filteredEmployees.length === 0) {
      toast.info("No employees to export");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(
      filteredEmployees.map((emp) => ({
        Name: emp.name,
        Email: emp.email,
        Department: emp.department,
        "Present Days": emp.present,
        "WFH Days": emp.wfh,
        "Leave Days": emp.leave,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `Attendance_${month}-${year}.xlsx`);
    toast.success("Excel exported successfully!");
  };

  // Export PDF
  const exportToPDF = () => {
    if (filteredEmployees.length === 0) {
      toast.info("No employees to export");
      return;
    }

    const doc = new jsPDF();
    doc.text(`Attendance Report - ${month}/${year}`, 14, 15);

    autoTable(doc, {
      startY: 25,
      head: [["S.No", "Name", "Email", "Department", "Present", "WFH", "Leave"]],
      body: filteredEmployees.map((emp, i) => [
        i + 1,
        emp.name,
        emp.email,
        emp.department,
        emp.present,
        emp.wfh,
        emp.leave,
      ]),
    });

    doc.save(`Attendance_${month}-${year}.pdf`);
    toast.success("PDF exported successfully!");
  };

  if (loading) return <p>Loading employees...</p>;
  if (error) return <p className="text-danger">{error}</p>;

  return (
    <div className="container py-4">
      <ToastContainer position="top-right" autoClose={3000} />
      <h3 className="text-center mb-4">HR Attendance Dashboard</h3>

      {/* Filters & Export */}
      <div className="row mb-4">
        <div className="col-md-3">
          <label>Month</label>
          <select className="form-select" value={month} onChange={(e) => setMonth(e.target.value)}>
            {Array.from({ length: 12 }, (_, i) => {
              const val = (i + 1).toString().padStart(2, "0");
              const name = new Date(0, i).toLocaleString("default", { month: "long" });
              return <option key={val} value={val}>{name}</option>;
            })}
          </select>
        </div>
        <div className="col-md-3">
          <label>Year</label>
          <select className="form-select" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
          </select>
        </div>
        <div className="col-md-6 d-flex align-items-end justify-content-end">
          <button className="btn btn-success btn-sm me-2" onClick={exportToExcel}>Export Excel</button>
          <button className="btn btn-danger btn-sm" onClick={exportToPDF}>Export PDF</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row text-center mb-4">
        <div className="col-md-3">
          <div className="card p-3 shadow-sm">
            <h6>Total Employees</h6>
            <h4>{totalEmployees}</h4>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-3 shadow-sm text-success">
            <h6>Total Present</h6>
            <h4>{totalPresent}</h4>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-3 shadow-sm text-primary">
            <h6>Work From Home</h6>
            <h4>{totalWfh}</h4>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card p-3 shadow-sm text-danger">
            <h6>Total Leave</h6>
            <h4>{totalLeave}</h4>
          </div>
        </div>
      </div>

      {/* Search & Department Filter */}
      <div className="d-flex mb-3 gap-2">
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="Search employee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: "400px" }}
        />
        <select
          className="form-select form-control-sm"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          style={{ maxWidth: "200px" }}
        >
          <option value="All">All Departments</option>
          {[...new Set(employees.map(e => e.department))].map(dep => (
            <option key={dep} value={dep}>{dep}</option>
          ))}
        </select>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => { setSearch(""); setDepartment("All"); toast.info("Filters reset"); }}
        >
          Reset
        </button>
      </div>

      {/* Employee Table */}
      <div className="table-responsive">
        <table className="table table-sm table-bordered table-striped text-center small-table-text">
          <thead className="thead-dark">
            <tr>
              <th>S.No</th>
              <th>Employee</th>
              <th>Department</th>
              <th>Present Days</th>
              <th>WFH Days</th>
              <th>Leave Days</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan="6">No employees found</td>
              </tr>
            ) : (
              filteredEmployees.map((emp, index) => (
                <tr key={emp.id}>
                  <td>{index + 1}</td>
                  <td>
                    <strong>{emp.name}</strong>
                    <br />
                    <small>{emp.email}</small>
                  </td>
                  <td>{emp.department}</td>
                  <td className="text-success">{emp.present}</td>
                  <td className="text-primary">{emp.wfh}</td>
                  <td className="text-danger">{emp.leave}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-muted text-right">
        Showing {filteredEmployees.length} of {employees.length} employees
      </p>
    </div>
  );
}
