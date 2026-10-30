import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./OfficerDashboard.css";
import officerAvatar from "../assets/officer-avatar.png";

function OfficerDashboard() {
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [selectedWorkers, setSelectedWorkers] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeSection, setActiveSection] = useState("dashboard");

  const loggedInUser = JSON.parse(localStorage.getItem("smartcityUser"));
  const officerEmail = loggedInUser?.email || "";
  const officerName = loggedInUser?.name || "Municipal Officer";

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/complaints")
      .then((response) => response.json())
      .then((data) => setComplaints(data))
      .catch((error) => console.error("Error fetching complaints:", error));

    fetch("http://127.0.0.1:5000/api/workers")
      .then((response) => response.json())
      .then((data) => setWorkers(data))
      .catch((error) => console.error("Error fetching workers:", error));

    if (officerEmail) {
      fetch(
        `http://127.0.0.1:5000/api/notifications?email=${encodeURIComponent(
          officerEmail
        )}`
      )
        .then((response) => response.json())
        .then((data) => setNotifications(data))
        .catch((error) =>
          console.error("Error fetching notifications:", error)
        );

      fetch(
        `http://127.0.0.1:5000/api/notifications/unread-count?email=${encodeURIComponent(
          officerEmail
        )}`
      )
        .then((response) => response.json())
        .then((data) => setUnreadCount(data.unread_count))
        .catch((error) =>
          console.error("Error fetching unread count:", error)
        );
    }
  }, [officerEmail]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/api/notifications/${notificationId}/read`,
        { method: "PUT" }
      );

      if (response.ok) {
        setNotifications((previousNotifications) =>
          previousNotifications.map((notification) =>
            notification.id === notificationId
              ? { ...notification, is_read: 1 }
              : notification
          )
        );
        setUnreadCount((previousCount) =>
          previousCount > 0 ? previousCount - 1 : 0
        );
      } else {
        alert("Cannot mark notification as read.");
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      alert("Cannot connect to backend.");
    }
  };

  const handleReview = async (complaintId) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/api/complaints/${complaintId}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "Under Review" }),
        }
      );

      const updatedComplaint = await response.json();

      if (response.ok) {
        setComplaints((previousComplaints) =>
          previousComplaints.map((complaint) =>
            complaint.complaint_id === complaintId
              ? updatedComplaint
              : complaint
          )
        );
      } else {
        alert(updatedComplaint.message);
      }
    } catch (error) {
      console.error("Error reviewing complaint:", error);
      alert("Cannot update complaint.");
    }
  };

  const handleAssign = async (complaintId) => {
    const workerEmail = selectedWorkers[complaintId];

    if (!workerEmail) {
      alert("Please select a worker.");
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:5000/api/complaints/${complaintId}/assign`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ worker_email: workerEmail }),
        }
      );

      const updatedComplaint = await response.json();

      if (response.ok) {
        setComplaints((previousComplaints) =>
          previousComplaints.map((complaint) =>
            complaint.complaint_id === complaintId
              ? updatedComplaint
              : complaint
          )
        );
        alert("Complaint assigned successfully.");
      } else {
        alert(updatedComplaint.message);
      }
    } catch (error) {
      console.error("Error assigning complaint:", error);
      alert("Cannot assign complaint.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("smartcityUser");
    navigate("/login");
  };

  const submittedCount = complaints.filter(
    (complaint) => complaint.status === "Submitted"
  ).length;

  const reviewCount = complaints.filter(
    (complaint) => complaint.status === "Under Review"
  ).length;

  const resolvedCount = complaints.filter(
    (complaint) => complaint.status === "Resolved"
  ).length;

  const assignedCount = complaints.filter(
    (complaint) => complaint.status === "Assigned"
  ).length;

  const visibleComplaints =
    activeSection === "assignments"
      ? complaints.filter(
          (complaint) =>
            complaint.status === "Under Review" ||
            complaint.status === "Assigned"
        )
      : complaints;

  return (
    <div className="officer-app">
      <aside className="officer-sidebar">
        <div className="sidebar-brand">
          <div className="brand-city-icon">🏙️</div>
          <div>
            <h2>SmartCity</h2>
            <span>Cleaner • Greener • Better</span>
          </div>
        </div>

        <nav className="officer-nav">
          <button
            className={activeSection === "dashboard" ? "nav-active" : ""}
            onClick={() => setActiveSection("dashboard")}
          >
            <span>▦</span>
            Dashboard
          </button>

          <button
            className={activeSection === "complaints" ? "nav-active" : ""}
            onClick={() => setActiveSection("complaints")}
          >
            <span>▤</span>
            Complaints
          </button>

          <button
            className={activeSection === "assignments" ? "nav-active" : ""}
            onClick={() => setActiveSection("assignments")}
          >
            <span>👥</span>
            Assignments
          </button>

          <button
            className={activeSection === "workers" ? "nav-active" : ""}
            onClick={() => setActiveSection("workers")}
          >
            <span>👷</span>
            Workers
          </button>

          <button
            className={activeSection === "notifications" ? "nav-active" : ""}
            onClick={() => setActiveSection("notifications")}
          >
            <span>🔔</span>
            Notifications
            {unreadCount > 0 && (
              <span className="sidebar-notification-count">{unreadCount}</span>
            )}
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-mini-profile">
            <div className="mini-avatar">
              <img
                src={officerAvatar}
                alt="Municipal Officer"
                className="officer-avatar-img"
              />
            </div>

            <div>
              <strong>{officerName}</strong>
              <span>{officerEmail}</span>
            </div>
          </div>

          <button className="officer-logout-btn" onClick={handleLogout}>
            ↪ Logout
          </button>
        </div>
      </aside>

      <main className="officer-main">
        <header className="officer-topbar">
          <div>
            <p className="topbar-page-label">Municipal Operations</p>
            <h3>
              {activeSection === "dashboard" && "Dashboard Overview"}
              {activeSection === "complaints" && "Citizen Complaints"}
              {activeSection === "assignments" && "Worker Assignments"}
              {activeSection === "workers" && "Field Workers"}
              {activeSection === "notifications" && "Notifications"}
            </h3>
          </div>

          <div className="topbar-right">
            <button
              className="topbar-bell"
              onClick={() => setActiveSection("notifications")}
            >
              🔔
              {unreadCount > 0 && <span>{unreadCount}</span>}
            </button>

            <div className="topbar-profile">
              <div className="profile-avatar">
                <img
                  src={officerAvatar}
                  alt="Municipal Officer"
                  className="officer-avatar-img"
                />
              </div>

              <div>
                <strong>{officerName}</strong>
                <span>{officerEmail}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="officer-content">
          {activeSection === "dashboard" && (
            <>
              <section className="officer-hero">
                <div className="hero-profile">
                  <div className="hero-avatar">
                    <img
                      src={officerAvatar}
                      alt="Municipal Officer"
                      className="officer-avatar-img"
                    />
                    <span></span>
                  </div>

                  <div>
                    <p>Welcome ,</p>
                    <h1>{officerName}</h1>
                    <span className="hero-email">{officerEmail}</span>
                    <p className="hero-description">
                      Manage citizen complaints, coordinate field workers and
                      help build a cleaner, better city.
                    </p>
                  </div>
                </div>

                <div className="hero-city">
                  <div className="city-skyline">
                    <span>▥</span>
                    <span>▥</span>
                    <span>▥</span>
                    <span>▥</span>
                    <span>▥</span>
                  </div>

                  <div className="hero-quote">
                    <strong>🌿 “A cleaner city is a happier city.”</strong>
                    <p>Let's make a difference together.</p>
                  </div>
                </div>
              </section>

              <section className="officer-stats-grid">
                <div className="modern-stat-card stat-card-blue">
                  <div className="stat-icon stat-blue">▤</div>
                  <div>
                    <h2>{complaints.length}</h2>
                    <p>Total Complaints</p>
                  </div>
                </div>

                <div className="modern-stat-card stat-card-yellow">
                  <div className="stat-icon stat-yellow">⌛</div>
                  <div>
                    <h2>{reviewCount}</h2>
                    <p>Under Review</p>
                  </div>
                </div>

                <div className="modern-stat-card stat-card-green">
                  <div className="stat-icon stat-green">✓</div>
                  <div>
                    <h2>{resolvedCount}</h2>
                    <p>Resolved</p>
                  </div>
                </div>

                <div className="modern-stat-card stat-card-purple">
                  <div className="stat-icon stat-purple">👥</div>
                  <div>
                    <h2>{workers.length}</h2>
                    <p>Field Workers</p>
                  </div>
                </div>
              </section>

              <section className="dashboard-lower-grid">
                <ComplaintPanel
                  complaints={complaints.slice(0, 6)}
                  workers={workers}
                  selectedWorkers={selectedWorkers}
                  setSelectedWorkers={setSelectedWorkers}
                  handleReview={handleReview}
                  handleAssign={handleAssign}
                  title="Recent Complaints"
                />

                <NotificationPanel
                  notifications={notifications.slice(0, 5)}
                  handleMarkAsRead={handleMarkAsRead}
                  setActiveSection={setActiveSection}
                  compact
                />
              </section>
            </>
          )}

          {activeSection === "complaints" && (
            <section className="full-section-card">
              <div className="section-heading">
                <div>
                  <span className="section-kicker">Complaint Management</span>
                  <h2>All Citizen Complaints</h2>
                  <p>Review incoming issues and monitor their current status.</p>
                </div>
                <span className="section-total">
                  {complaints.length} Complaints
                </span>
              </div>

              <ComplaintPanel
                complaints={complaints}
                workers={workers}
                selectedWorkers={selectedWorkers}
                setSelectedWorkers={setSelectedWorkers}
                handleReview={handleReview}
                handleAssign={handleAssign}
                hideHeader
              />
            </section>
          )}

          {activeSection === "assignments" && (
            <section className="full-section-card">
              <div className="section-heading">
                <div>
                  <span className="section-kicker">Field Operations</span>
                  <h2>Worker Assignments</h2>
                  <p>
                    Assign reviewed complaints to available field workers.
                  </p>
                </div>
                <span className="section-total">{assignedCount} Assigned</span>
              </div>

              <ComplaintPanel
                complaints={visibleComplaints}
                workers={workers}
                selectedWorkers={selectedWorkers}
                setSelectedWorkers={setSelectedWorkers}
                handleReview={handleReview}
                handleAssign={handleAssign}
                hideHeader
              />
            </section>
          )}

          {activeSection === "workers" && (
            <section className="full-section-card">
              <div className="section-heading">
                <div>
                  <span className="section-kicker">Municipal Team</span>
                  <h2>Field Workers</h2>
                  <p>Workers currently available for complaint assignments.</p>
                </div>
                <span className="section-total">{workers.length} Workers</span>
              </div>

              <div className="worker-grid">
                {workers.map((worker, index) => (
                  <div className="worker-profile-card" key={worker.id}>
                    <div className="worker-avatar">
                      {worker.name.charAt(0)}
                    </div>
                    <div className="worker-online-dot"></div>

                    <h3>{worker.name}</h3>
                    <p>{worker.email}</p>

                    <span className="worker-role">
                      Field Worker {index + 1}
                    </span>

                    <div className="worker-card-footer">
                      <span>● Active</span>
                      <strong>
                        {
                          complaints.filter(
                            (complaint) =>
                              complaint.assigned_worker === worker.email &&
                              complaint.status !== "Resolved"
                          ).length
                        }{" "}
                        Active Tasks
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeSection === "notifications" && (
            <section className="full-section-card">
              <div className="section-heading">
                <div>
                  <span className="section-kicker">Notification Center</span>
                  <h2>Officer Notifications</h2>
                  <p>New citizen complaints and operational updates.</p>
                </div>
                <span className="section-total">{unreadCount} Unread</span>
              </div>

              <NotificationPanel
                notifications={notifications}
                handleMarkAsRead={handleMarkAsRead}
                setActiveSection={setActiveSection}
              />
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

function ComplaintPanel({
  complaints,
  workers,
  selectedWorkers,
  setSelectedWorkers,
  handleReview,
  handleAssign,
  title,
  hideHeader,
}) {
  return (
    <div
      className={hideHeader ? "complaint-panel plain-panel" : "complaint-panel"}
    >
      {!hideHeader && (
        <div className="panel-title">
          <div>
            <span className="panel-title-icon">▤</span>
            <h2>{title}</h2>
          </div>
          <span className="panel-count">{complaints.length} Records</span>
        </div>
      )}

      <div className="complaint-table-wrapper">
        <table className="complaint-table">
          <thead>
            <tr>
              <th>Complaint ID</th>
              <th>Category</th>
              <th>Location</th>
              <th>Status</th>
              <th>Worker</th>
              <th>Photos</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {complaints.length === 0 ? (
              <tr>
                <td colSpan="6">
                  <div className="empty-table">No complaints available.</div>
                </td>
              </tr>
            ) : (
              complaints.map((complaint) => (
                <tr key={complaint.id}>
                  <td>
                    <strong className="complaint-id">
                      {complaint.complaint_id}
                    </strong>
                  </td>

                  <td>
                    <div className="category-cell">
                      <span className="category-icon">
                        {getCategoryIcon(complaint.category)}
                      </span>
                      {complaint.category}
                    </div>
                  </td>

                  <td>{complaint.location}</td>

                  <td>
                    <span
                      className={`modern-status ${getStatusClass(
                        complaint.status
                      )}`}
                    >
                      {complaint.status}
                    </span>
                  </td>

                  <td>
                    {complaint.assigned_worker ? (
                      <span className="assigned-worker-text">
                        {complaint.assigned_worker}
                      </span>
                    ) : (
                      <span className="not-assigned">Not assigned</span>
                    )}
                  </td>

                  <td>
                    {complaint.status === "Submitted" && (
                      <button
                        className="table-action-btn"
                        onClick={() =>
                          handleReview(complaint.complaint_id)
                        }
                      >
                        Review
                      </button>
                    )}

                    {complaint.status === "Under Review" && (
                      <div className="table-assignment">
                        <select
                          value={
                            selectedWorkers[complaint.complaint_id] || ""
                          }
                          onChange={(e) =>
                            setSelectedWorkers({
                              ...selectedWorkers,
                              [complaint.complaint_id]: e.target.value,
                            })
                          }
                        >
                          <option value="">Select Worker</option>
                          {workers.map((worker) => (
                            <option key={worker.id} value={worker.email}>
                              {worker.name}
                            </option>
                          ))}
                        </select>

                        <button
                          className="table-action-btn assign-action"
                          onClick={() =>
                            handleAssign(complaint.complaint_id)
                          }
                        >
                          Assign
                        </button>
                      </div>
                    )}

                    {complaint.status === "Assigned" && (
                      <span className="action-complete">Assigned ✓</span>
                    )}

                    {complaint.status === "Resolved" && (
                      <span className="action-resolved">Completed ✓</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NotificationPanel({
  notifications,
  handleMarkAsRead,
  setActiveSection,
  compact,
}) {
  return (
    <div
      className={`notification-panel ${compact ? "compact-panel" : ""}`}
    >
      <div className="panel-title">
        <div>
          <span className="panel-title-icon">🔔</span>
          <h2>Notifications</h2>
        </div>

        {compact && (
          <button
            className="view-all-btn"
            onClick={() => setActiveSection("notifications")}
          >
            View All →
          </button>
        )}
      </div>

      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="notification-empty">
            <div>🔔</div>
            <strong>You're all caught up!</strong>
            <p>No notifications available.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              className={`modern-notification ${
                notification.is_read === 0 ? "notification-unread" : ""
              }`}
              key={notification.id}
            >
              <div className="notification-dot"></div>
              <div className="notification-icon-box">▤</div>

              <div className="notification-details">
                <strong>{notification.message}</strong>
                <span>Complaint ID: {notification.complaint_id}</span>

                {notification.is_read === 0 ? (
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    Mark as Read
                  </button>
                ) : (
                  <small>✓ Read</small>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function getStatusClass(status) {
  if (status === "Submitted") return "status-submitted";
  if (status === "Under Review") return "status-review";
  if (status === "Assigned") return "status-assigned";
  if (status === "Resolved") return "status-resolved";
  return "";
}

function getCategoryIcon(category) {
  const value = category?.toLowerCase() || "";

  if (value.includes("garbage")) return "♻";
  if (value.includes("water")) return "💧";
  if (value.includes("light")) return "💡";
  if (value.includes("road") || value.includes("pothole")) return "🚧";

  return "📋";
}

export default OfficerDashboard;
