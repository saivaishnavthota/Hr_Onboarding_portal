import React, { useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function Employees() {
  const [month, setMonth] = useState("09");
  const [year, setYear] = useState("2025");
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");


  const employees =fetch("http://127.0.0.1:8000/users/employees")

  
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase());
    const matchesDept =
      department === "All" || emp.department === department;
    return matchesSearch && matchesDept;
  });

  const totalEmployees = employees.length;
  const totalPresent = employees.reduce((sum, e) => sum + e.present, 0);
  const totalWfh = employees.reduce((sum, e) => sum + e.wfh, 0);
  const totalLeave = employees.reduce((sum, e) => sum + e.leave, 0);


  const exportToExcel = () => {
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
  };

 
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`Attendance Report - ${month}/${year}`, 14, 15);

    doc.autoTable({
      startY: 25,
      head: [["#", "Name", "Email", "Department", "Present", "WFH", "Leave"]],
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
  };

  return (
    <div className="container py-4">
      <h3 className="text-center mb-4">HR Attendance Dashboard</h3>
      <div className="row mb-4">
        <div className="col-md-3">
          <label>Month</label>
          <select
            className="form-select"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            <option value="01">January</option>
            <option value="02">February</option>
            <option value="03">March</option>
            <option value="04">April</option>
            <option value="05">May</option>
            <option value="06">June</option>
            <option value="07">July</option>
            <option value="08">August</option>
            <option value="09">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>
        </div>
        <div className="col-md-3">
          <label>Year</label>
          <select
            className="form-select"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
          </select>
        </div>

       
<div className="col-md-6 d-flex align-items-end justify-content-end">
  <button className="btn btn-success btn-sm me-2" onClick={exportToExcel}>
    Export Excel
  </button>
  <button className="btn btn-danger btn-sm" onClick={exportToPDF}>
    Export PDF
  </button>
</div>
      </div>

  
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
    <option value="IT">Development</option>
    <option value="HR">Data</option>
    <option value="Finance">Cloud</option>
  </select>

  
  <button
    className="btn btn-secondary btn-sm"
    onClick={() => {
      setSearch("");
      setDepartment("All");
    }}
  >
    Reset
  </button>
</div>


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
