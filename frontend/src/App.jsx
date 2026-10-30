
import AdminDashboard from "./pages/AdminDashboard";
import "./App.css";
import { Routes, Route, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import ReportIssue from "./pages/ReportIssue";
import TrackComplaint from "./pages/TrackComplaint";
import Register from "./pages/Register";
import Login from "./pages/Login";
import MyComplaints from "./pages/MyComplaints";
import OfficerDashboard from "./pages/OfficerDashboard";
import WorkerDashboard from "./pages/WorkerDashboard";
function ProtectedAdmin() {
  const user = JSON.parse(
    localStorage.getItem("smartcityUser")
  );

  if (!user || user.role !== "Admin") {
    return <Login />;
  }

  return <AdminDashboard />;
}
function ProtectedCitizen({ children }) {
  const user = JSON.parse(
    localStorage.getItem("smartcityUser")
  );

  if (!user || user.role !== "Citizen") {
    return <Login />;
  }

  return children;
}
function ProtectedOfficer({ children }) {
  const user = JSON.parse(
    localStorage.getItem("smartcityUser")
  );

  if (!user || user.role !== "Municipal Officer") {
    return <Login />;
  }

  return children;
}
function ProtectedWorker({ children }) {
  const user = JSON.parse(
    localStorage.getItem("smartcityUser")
  );

  if (!user || user.role !== "Worker") {
    return <Login />;
  }

  return children;
}

function Dashboard() {
  const [stats, setStats] = useState({
    citizens: 0,
    total_complaints: 0,
    resolved: 0,
    pending: 0,
  });

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/dashboard-stats")
      .then((response) => response.json())
      .then((data) => {
        setStats(data);
      })
      .catch((error) => {
        console.error("Error fetching dashboard stats:", error);
      });
  }, []);

  return (
    <div className="app">

      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">
          🏙️ SmartCity
        </div>

        <div className="nav-links">
          <Link to="/dashboard">Home</Link>
          <a href="#">Services</a>
          <a href="#">About</a>
          <button
  className="login-btn"
  onClick={() => {
    localStorage.removeItem("smartcityUser");
    window.location.href = "/";
  }}
>
  Logout
</button>
        </div>
      </nav>


      {/* Hero Section */}
      <section className="hero">

        <div className="hero-content">
          <p className="tagline">SMART CITY • SMART SERVICES</p>

          <h1>
            Building a <span>Smarter</span> City Together
          </h1>

          <p className="hero-text">
            A centralized platform to report civic issues,
            track complaints and connect citizens with
            municipal services.
          </p>

          <div className="hero-buttons">

  <Link to="/report-issue">
    <button className="primary-btn">
      Report an Issue
    </button>
  </Link>

  <Link to="/track-complaint">
    <button className="secondary-btn">
      Track Complaint
    </button>
  </Link>

  <Link to="/my-complaints">
    <button className="secondary-btn">
      My Complaints
    </button>
  </Link>

</div>
</div>
        <div className="hero-icon">
          🏙️
        </div>

      </section>


      {/* Statistics */}
      <section className="stats">

        <div className="stat-card">
          <h2>{stats.citizens}</h2>
          <p>Citizens</p>
        </div>

        <div className="stat-card">
          <h2>{stats.total_complaints}</h2>
          <p>Complaints</p>
        </div>

        <div className="stat-card">
          <h2>{stats.resolved}</h2>
          <p>Resolved</p>
        </div>

        <div className="stat-card">
          <h2>{stats.pending}</h2>
          <p>Pending</p>
        </div>

      </section>


      {/* Services */}
      <section className="services">

        <div className="section-heading">
          <p>OUR SERVICES</p>
          <h2>Making City Services Easier</h2>
        </div>

        <div className="service-grid">

          <div className="service-card">
            <div className="service-icon">🗑️</div>
            <h3>Garbage Management</h3>
            <p>
              Report garbage-related civic issues
              and track their resolution.
            </p>
          </div>

          <div className="service-card">
            <div className="service-icon">🛣️</div>
            <h3>Road Issues</h3>
            <p>
              Report potholes and other road-related
              problems in your area.
            </p>
          </div>

          <div className="service-card">
            <div className="service-icon">💡</div>
            <h3>Street Lights</h3>
            <p>
              Report damaged or non-working
              street lights.
            </p>
          </div>

          <div className="service-card">
            <div className="service-icon">💧</div>
            <h3>Water Issues</h3>
            <p>
              Report water leakage and other
              public water problems.
            </p>
          </div>

        </div>

      </section>


      {/* Footer */}
      <footer>
        <h3>🏙️ Smart City Operational Portal</h3>
        <p>Making cities smarter, safer and better.</p>
      </footer>

    </div>
  );
}


function App() {
  return (
    <Routes>

  {/* Login Page */}
  <Route path="/" element={<Login />} />

  <Route path="/register" element={<Register />} />

  {/* Citizen Dashboard */}
  <Route
    path="/dashboard"
    element={
      <ProtectedCitizen>
        <Dashboard />
      </ProtectedCitizen>
    }
  />
  

  {/* Report Issue Page */}
  <Route
    path="/report-issue"
    element={
      <ProtectedCitizen>
        <ReportIssue />
      </ProtectedCitizen>
    }
  />

  {/* Track Complaint Page */}
  <Route
    path="/track-complaint"
    element={
      <ProtectedCitizen>
        <TrackComplaint />
      </ProtectedCitizen>
    }
  />

  {/* My Complaints Page */}
  <Route
    path="/my-complaints"
    element={
      <ProtectedCitizen>
        <MyComplaints />
      </ProtectedCitizen>
    }
  />

  {/* Admin Dashboard */}
  <Route
    path="/admin"
    element={<ProtectedAdmin />}
  />
  <Route
  path="/officer"
  element={
    <ProtectedOfficer>
      <OfficerDashboard />
    </ProtectedOfficer>
  }
/>
<Route
  path="/worker"
  element={
    <ProtectedWorker>
      <WorkerDashboard />
    </ProtectedWorker>
  }
/>

</Routes>
  );
}
export default App;