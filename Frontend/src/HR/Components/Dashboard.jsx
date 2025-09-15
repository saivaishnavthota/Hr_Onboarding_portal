import { useState, useEffect } from "react"; 
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Logo from "../../assets/Nxzen-logo.jpg";
import CreateEmployee from "./CreateEmployee";
import Employees from "./Employees";
import EmployeeForm from "./EmployeeForm";
import OnboardingDocs from "./OnboardingDocs";
import LeaveManagement from "./LeaveManagement";
import UpdatePassword from "../../Employee/Components/UpdatePassword";
import { Link, Routes, Route, useNavigate } from "react-router-dom";
import {
  faArrowLeft,
  faArrowRight,
  faCalendarAlt,
  faPaperPlane,
  faUpload,
  faKey,
  faUser,
  faReceipt,
  faCoins,
  faFileAlt,
  faCircleUser
} from "@fortawesome/free-solid-svg-icons";

import "../Styles/Dashboard.css"
import DocumentCollection from "./DocumentCollection";
import HRExpenseApproval from "./HRExpenseApproval";

export default function Dashboard() {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setIsOpen(false);
      else setIsOpen(true);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

   const [username, setUsername] = useState("");

  useEffect(() => {
    
    const storedUser = localStorage.getItem("username");
    if (storedUser) {
      setUsername(storedUser);
    }
  }, []);


 const menuItems = [
  { name: "Create Employee", icon: faUser, path: "create-employee" },
  { name: "Employees Attendance", icon: faCalendarAlt , path: "employee-attendance" },
  { name: "Employees Form", icon: faReceipt, path: "employees-form" },
  { name: "Onboarded Employees", icon: faUpload, path: "onboard-employees" },
  { name: "Documents Collection", icon: faFileAlt , path: "collect-docs" },
  { name: "Leave Management", icon: faPaperPlane, path: "leave-manage" },
  { name: "Expense Management", icon: faCoins, path: "expense-approval" },
  { name: "Change Password", icon: faKey, path: "change-password" },
];


  return (
    <div className="dashboard">
      
      <header className="header">
        <div className="logo" onClick={() => navigate("/")}>
          <img src={Logo} alt="Company Logo" className="logo-img" />
          <h2 className="logo-text">HR Dashboard</h2>
        </div>
         <div className="profile"  style={{
                        display: "flex",
                        alignItems: "center",  
                        gap: "8px",
                        height: "100%",   
                      }}>
                           <FontAwesomeIcon icon={faCircleUser} size="2x" />
                             <span>
                            {username || "Guest"}
                            </span>
                        </div>
      </header>

      <div className="main">
        <button
          className="toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
        >
          <FontAwesomeIcon icon={isOpen ? faArrowLeft : faArrowRight} />
        </button>

        <aside className={`sidebar ${isOpen ? "open" : "collapsed"}`}>
          <nav>
            {menuItems.map((item, idx) => (
              <div key={idx} className="menu-item">
                <Link
                  to={`/hr-dashboard/${item.path}`}
                  className="menu-link"
                  onClick={() => window.scrollTo(0, 0)}
                >
                  <FontAwesomeIcon icon={item.icon} className="menu-icon" />
                  {isOpen && <span className="menu-text">{item.name}</span>}
                </Link>
                {!isOpen && <span className="tooltip">{item.name}</span>}
              </div>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="content">
          <Routes>
    <Route index element={<h3>Welcome to HR Dashboard</h3>} />
    <Route path="create-employee" element={<CreateEmployee />} />
    <Route path="employee-attendance" element={<Employees />} />
    <Route path="employees-form" element={<EmployeeForm />} />
    <Route path="onboard-employees" element={<OnboardingDocs />} />
    <Route path="collect-docs" element={<DocumentCollection />} />
    <Route path="leave-manage" element={<LeaveManagement />} />
    <Route path="expense-approval" element={<HRExpenseApproval />} /> 
    <Route path="change-password" element={<UpdatePassword/>}/>
  </Routes>
        </main>
      </div>
    </div>
  );
}
