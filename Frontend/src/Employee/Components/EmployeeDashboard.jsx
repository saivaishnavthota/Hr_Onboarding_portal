import { useState, useEffect } from "react"; 
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import EmployeeAttendance from "./EmployeeAttendence";
import EmployeeUploadDocs from "./EmployeeUploadDocs"
import ApplyLeave from "./ApplyLeave";
import UpdatePassword from "./UpdatePassword";
import Logo from "../../assets/Nxzen-logo.jpg"; 
import Profile from "./Profile";
import { Link, Routes, Route, useNavigate } from "react-router-dom";
import {
  faArrowLeft,
  faArrowRight,
  faCalendarCheck,
  faPaperPlane,
  faUpload,
  faKey,
  faCircleUser 
} from "@fortawesome/free-solid-svg-icons";
import "../Styles/EmployeeDashboard.css"
import NewUserDocsUpload from "../../OnboardingEmployee/NewUserDocsUpload";

export default function EmployeeDashboard() {
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
    { name: "Add Attendance", icon: faCalendarCheck, path: "attendance" },
    { name: "Apply Leave", icon: faPaperPlane, path: "apply-leave" },
    { name: "Upload Documents", icon: faUpload, path: "upload-docs" },
    { name: "Set Password", icon: faKey, path: "change-password" },
  ];

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="header">
        <div className="logo" onClick={() => navigate("/")}>
          <img src={Logo} alt="Company Logo" className="logo-img" />
          <h2 className="logo-text">Employee Dashboard</h2>
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
        {/* Toggle Sidebar */}
        <button
          className="toggle-btn"
          onClick={() => setIsOpen(!isOpen)}
        >
          <FontAwesomeIcon icon={isOpen ? faArrowLeft : faArrowRight} />
        </button>

        {/* Sidebar */}
        <aside className={`sidebar ${isOpen ? "open" : "collapsed"}`}>
          <nav>
            {menuItems.map((item, idx) => (
              <div key={idx} className="menu-item">
                <Link
                   to={`/employee-dashboard/${item.path}`}
 
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
            <Route index element={<h3>Welcome to Employee Dashboard</h3>} />
            {/* <Route path="attendance" element={<EmployeeAttendance />} /> */}
            <Route path="upload-docs" element={<EmployeeUploadDocs />} />
            <Route path="apply-leave" element={<ApplyLeave />} />
            <Route path="change-password" element={<UpdatePassword />} />
            <Route path="profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
