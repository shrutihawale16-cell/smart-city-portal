import { useEffect, useState } from "react";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [userFilter, setUserFilter] = useState("All");

  const loggedInUser = JSON.parse(
    localStorage.getItem("smartcityUser") || "{}"
  );

  const adminName = loggedInUser?.name || "Admin";
  const adminEmail = loggedInUser?.email || "admin@smartcity.com";

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/complaints")
      .then((response) => response.json())
      .then((data) => {
        setComplaints(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error("Error fetching complaints:", error);
      });

    fetch("http://127.0.0.1:5000/api/users")
      .then((response) => response.json())
      .then((data) => {
        setUsers(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
      });
  }, []);

  const filteredComplaints = complaints.filter((complaint) => {
    const search = searchTerm.toLowerCase();

    const complaintId = (complaint.complaint_id || "").toLowerCase();
    const category = (complaint.category || "").toLowerCase();
    const location = (complaint.location || "").toLowerCase();

    const matchesSearch =
      complaintId.includes(search) ||
      category.includes(search) ||
      location.includes(search);

    const matchesStatus =
      statusFilter === "All" || complaint.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const filteredUsers = users.filter((user) => {
    if (userFilter === "All") {
      return true;
    }

    return user.role === userFilter;
  });

  const totalComplaints = complaints.length;

  const submitted = complaints.filter(
    (complaint) => complaint.status === "Submitted"
  ).length;

  const underReview = complaints.filter(
    (complaint) => complaint.status === "Under Review"
  ).length;

  const assigned = complaints.filter(
    (complaint) => complaint.status === "Assigned"
  ).length;

  const resolved = complaints.filter(
    (complaint) => complaint.status === "Resolved"
  ).length;

  const categoryReport = complaints.reduce((report, complaint) => {
    const category = complaint.category || "Other";

    if (report[category]) {
      report[category] += 1;
    } else {
      report[category] = 1;
    }

    return report;
  }, {});

  const handleLogout = () => {
    localStorage.removeItem("smartcityUser");
    window.location.href = "/";
  };

  const openUsers = (role = "All") => {
    setUserFilter(role);
    setActiveSection("users");
  };

  const getCategoryIcon = (category = "") => {
    const value = category.toLowerCase();

    if (value.includes("street")) return "💡";
    if (value.includes("garbage")) return "🗑️";
    if (value.includes("water")) return "💧";
    if (value.includes("road") || value.includes("pothole")) return "🛣️";

    return "🏙️";
  };

  const getStatusClass = (status = "") => {
    return `status-badge status-${status
      .toLowerCase()
      .replace(/\s+/g, "-")}`;
  };

  const renderComplaintTable = (limit = null) => {
    const data = limit
      ? filteredComplaints.slice(0, limit)
      : filteredComplaints;

    if (data.length === 0) {
      return (
        <div className="no-complaints">
          <div>📋</div>
          <h3>No complaints found</h3>
          <p>No complaints match your current search or filter.</p>
        </div>
      );
    }

    return (
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Complaint ID</th>
              <th>Category</th>
              <th>Location</th>
              <th>Description</th>
              <th>Photo</th>
              <th>Assigned Worker</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {data.map((complaint) => (
              <tr key={complaint.id || complaint.complaint_id}>
                <td>
                  <strong>{complaint.complaint_id}</strong>
                </td>

                <td>
                  <div className="category-cell">
                    <span>{getCategoryIcon(complaint.category)}</span>
                    {complaint.category}
                  </div>
                </td>

                <td>{complaint.location}</td>

                <td className="description-cell">
                  {complaint.description}
                </td>

                <td>
                  {complaint.photo ? (
                    <a
                      href={`http://127.0.0.1:5000/uploads/${complaint.photo}`}
                      target="_blank"
                      rel="noreferrer"
                      className="photo-link"
                    >
                      View Photo
                    </a>
                  ) : (
                    <span className="no-photo">No Photo</span>
                  )}
                </td>

                <td>
                  {complaint.assigned_worker || (
                    <span className="not-assigned">Not Assigned</span>
                  )}
                </td>

                <td>
                  <span className={getStatusClass(complaint.status)}>
                    {complaint.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="admin-app">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="brand-icon">🏙️</div>

          <div>
            <h2>Smart City</h2>
            <p>Admin Panel</p>
          </div>
        </div>

        <nav className="admin-nav">
          <button
            className={`admin-nav-item ${
              activeSection === "dashboard" ? "active" : ""
            }`}
            onClick={() => setActiveSection("dashboard")}
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            className={`admin-nav-item ${
              activeSection === "complaints" ? "active" : ""
            }`}
            onClick={() => setActiveSection("complaints")}
          >
            <span>▤</span>
            Complaints
          </button>

          <button
            className={`admin-nav-item ${
              activeSection === "users" ? "active" : ""
            }`}
            onClick={() => openUsers("All")}
          >
            <span>👥</span>
            User Management
          </button>

          <div className="admin-subnav">
            <button onClick={() => openUsers("Citizen")}>
              Citizens
            </button>

            <button onClick={() => openUsers("Municipal Officer")}>
              Municipal Officers
            </button>

            <button onClick={() => openUsers("Worker")}>
              Field Workers
            </button>
          </div>

          <button
            className={`admin-nav-item ${
              activeSection === "reports" ? "active" : ""
            }`}
            onClick={() => setActiveSection("reports")}
          >
            <span>▥</span>
            Reports
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="admin-mini-profile">
            <div className="admin-avatar">A</div>

            <div>
              <strong>{adminName}</strong>
              <span>System Administrator</span>
            </div>
          </div>

          <button className="admin-logout" onClick={handleLogout}>
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN AREA */}
      <main className="admin-main">
        {/* TOP BAR */}
        <header className="admin-topbar">
          <div className="top-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search complaints, users or locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="top-admin-profile">
            <div className="top-avatar">A</div>

            <div>
              <strong>{adminName}</strong>
              <span>{adminEmail}</span>
            </div>
          </div>
        </header>

        <div className="admin-content">
          {/* DASHBOARD */}
          {activeSection === "dashboard" && (
            <>
              <section className="admin-welcome">
                <div className="welcome-copy">
                  <p>SMART CITY ADMINISTRATION</p>

                  <h1>
                    Welcome 
                    <br />
                    {adminName}! 👋
                  </h1>

                  <span>
                    Together for a cleaner, greener and smarter city.
                  </span>
                </div>

                <div className="welcome-city">
                  <div className="sun"></div>
                  <div className="cloud cloud-one">☁</div>
                  <div className="cloud cloud-two">☁</div>

                  <div className="city-buildings">
                    <span>▥</span>
                    <span>▥</span>
                    <span>▥</span>
                    <span>▥</span>
                    <span>▥</span>
                  </div>

                  <div className="city-trees">
                    🌳 🌲 🌳 🌲 🌳
                  </div>
                </div>

                <div className="welcome-message">
                  <strong>Smart City</strong>
                  <span>Cleaner City</span>
                  <span>Happier People</span>
                </div>
              </section>

              <section className="admin-stats">
                <div className="admin-stat-card total-card">
                  <div className="stat-icon">▤</div>
                  <div>
                    <h2>{totalComplaints}</h2>
                    <p>Total Complaints</p>
                  </div>
                </div>

                <div className="admin-stat-card submitted-card">
                  <div className="stat-icon">➤</div>
                  <div>
                    <h2>{submitted}</h2>
                    <p>Submitted</p>
                  </div>
                </div>

                <div className="admin-stat-card review-card">
                  <div className="stat-icon">◷</div>
                  <div>
                    <h2>{underReview}</h2>
                    <p>Under Review</p>
                  </div>
                </div>

                <div className="admin-stat-card assigned-card">
                  <div className="stat-icon">♟</div>
                  <div>
                    <h2>{assigned}</h2>
                    <p>Assigned</p>
                  </div>
                </div>

                <div className="admin-stat-card resolved-card">
                  <div className="stat-icon">✓</div>
                  <div>
                    <h2>{resolved}</h2>
                    <p>Resolved</p>
                  </div>
                </div>
              </section>

              <section className="admin-panel dashboard-complaints">
                <div className="panel-heading">
                  <div>
                    <h2>Complaint Overview</h2>
                    <p>
                      View and monitor complaints submitted by citizens.
                    </p>
                  </div>

                  <button
                    className="view-all-btn"
                    onClick={() => setActiveSection("complaints")}
                  >
                    View All →
                  </button>
                </div>

                {renderComplaintTable(5)}
              </section>
            </>
          )}

          {/* COMPLAINTS PAGE */}
          {activeSection === "complaints" && (
            <section className="admin-panel page-panel">
              <div className="page-heading">
                <div>
                  <p className="page-label">CITY OPERATIONS</p>
                  <h1>Complaints</h1>
                  <span>
                    Search and monitor all citizen complaints.
                  </span>
                </div>
              </div>

              <div className="complaint-controls">
                <div className="page-search">
                  <span>⌕</span>

                  <input
                    type="text"
                    placeholder="Search complaint, category or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <select
                  className="filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Status</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              {renderComplaintTable()}
            </section>
          )}

          {/* USER MANAGEMENT */}
          {activeSection === "users" && (
            <section className="admin-panel page-panel">
              <div className="page-heading user-page-heading">
                <div>
                  <p className="page-label">ACCOUNT DIRECTORY</p>
                  <h1>User Management</h1>
                  <span>
                    View registered citizens, municipal officers and field
                    workers.
                  </span>
                </div>

                <div className="user-filter-tabs">
                  <button
                    className={userFilter === "All" ? "active" : ""}
                    onClick={() => setUserFilter("All")}
                  >
                    All
                  </button>

                  <button
                    className={userFilter === "Citizen" ? "active" : ""}
                    onClick={() => setUserFilter("Citizen")}
                  >
                    Citizens
                  </button>

                  <button
                    className={
                      userFilter === "Municipal Officer" ? "active" : ""
                    }
                    onClick={() => setUserFilter("Municipal Officer")}
                  >
                    Officers
                  </button>

                  <button
                    className={userFilter === "Worker" ? "active" : ""}
                    onClick={() => setUserFilter("Worker")}
                  >
                    Workers
                  </button>
                </div>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="no-complaints">
                  <div>👥</div>
                  <h3>No users found</h3>
                  <p>No users are available for this role.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="admin-table user-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <div className="user-name-cell">
                              <div className="small-user-avatar">
                                {(user.name || "U")
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <strong>{user.name}</strong>
                            </div>
                          </td>

                          <td>{user.email}</td>

                          <td>
                            <span className="role-badge">
                              {user.role}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* REPORTS */}
          {activeSection === "reports" && (
            <section className="admin-panel page-panel">
              <div className="page-heading">
                <div>
                  <p className="page-label">CITY INSIGHTS</p>
                  <h1>Reports & Analytics</h1>
                  <span>
                    Category-wise complaint distribution across the city.
                  </span>
                </div>
              </div>

              {Object.keys(categoryReport).length === 0 ? (
                <div className="no-complaints">
                  <div>▥</div>
                  <h3>No report data available</h3>
                </div>
              ) : (
                <div className="reports-grid">
                  {Object.entries(categoryReport).map(
                    ([category, count]) => (
                      <div className="report-card" key={category}>
                        <div className="report-icon">
                          {getCategoryIcon(category)}
                        </div>

                        <div>
                          <h3>{category}</h3>

                          <strong>{count}</strong>

                          <p>
                            Complaint{count !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;