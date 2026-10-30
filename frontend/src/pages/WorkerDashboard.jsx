import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import "./WorkerDashboard.css";



function WorkerDashboard() {

  const navigate = useNavigate();



  const [complaints, setComplaints] = useState([]);

  const [notifications, setNotifications] = useState([]);

  const [unreadCount, setUnreadCount] = useState(0);

  const [activeSection, setActiveSection] = useState("dashboard");

  const [taskFilter, setTaskFilter] = useState("all");
  const [completionPhotos, setCompletionPhotos] = useState({});
  const [uploadingId, setUploadingId] = useState(null);



  const user = JSON.parse(localStorage.getItem("smartcityUser"));



  const workerEmail = user?.email || "";

  const workerName = user?.name || "Field Worker";



  useEffect(() => {

    if (!workerEmail) return;



    fetch(

      `http://127.0.0.1:5000/api/worker-complaints?email=${encodeURIComponent(

        workerEmail

      )}`

    )

      .then((response) => response.json())

      .then((data) => setComplaints(data))

      .catch((error) =>

        console.error("Error fetching worker complaints:", error)

      );



    fetch(

      `http://127.0.0.1:5000/api/notifications?email=${encodeURIComponent(

        workerEmail

      )}`

    )

      .then((response) => response.json())

      .then((data) => setNotifications(data))

      .catch((error) =>

        console.error("Error fetching notifications:", error)

      );



    fetch(

      `http://127.0.0.1:5000/api/notifications/unread-count?email=${encodeURIComponent(

        workerEmail

      )}`

    )

      .then((response) => response.json())

      .then((data) => setUnreadCount(data.unread_count))

      .catch((error) =>

        console.error("Error fetching unread count:", error)

      );

  }, [workerEmail]);



  const handleMarkAsRead = async (notificationId) => {

    try {

      const response = await fetch(

        `http://127.0.0.1:5000/api/notifications/${notificationId}/read`,

        {

          method: "PUT",

        }

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



  const handleResolve = async (complaintId) => {
    const photo = completionPhotos[complaintId];
    if (!photo) {
      alert("Please select a completion photo first.");
      return;
    }
    if (!photo.type.startsWith("image/")) {
      alert("Please choose an image file.");
      return;
    }
    if (photo.size > 10 * 1024 * 1024) {
      alert("Photo must be smaller than 10 MB.");
      return;
    }
    const formData = new FormData();
    formData.append("worker_email", workerEmail);
    formData.append("completion_photo", photo);
    setUploadingId(complaintId);
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/api/complaints/${encodeURIComponent(complaintId)}/complete`,
        { method: "POST", body: formData }
      );
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || "Could not complete task.");
        return;
      }
      setComplaints((previous) => previous.map((complaint) =>
        complaint.complaint_id === complaintId ? data : complaint
      ));
      setCompletionPhotos((previous) => {
        const next = { ...previous };
        delete next[complaintId];
        return next;
      });
      alert("Completion photo uploaded! Complaint marked as resolved.");
    } catch (error) {
      console.error("Error uploading completion photo:", error);
      alert("Cannot connect to backend.");
    } finally {
      setUploadingId(null);
    }
  };

  const handleLogout = () => {

    localStorage.removeItem("smartcityUser");

    navigate("/login");

  };



  const assignedCount = complaints.length;



  const activeCount = complaints.filter(

    (complaint) => complaint.status === "Assigned"

  ).length;



  const resolvedCount = complaints.filter(

    (complaint) => complaint.status === "Resolved"

  ).length;



  const filteredComplaints = complaints.filter((complaint) => {

    if (taskFilter === "active") {

      return complaint.status === "Assigned";

    }



    if (taskFilter === "resolved") {

      return complaint.status === "Resolved";

    }



    return true;

  });



  const completedComplaints = complaints.filter(

    (complaint) => complaint.status === "Resolved"

  );



  return (

    <div className="worker-app">

      {/* SIDEBAR */}

      <aside className="worker-sidebar">

        <div className="worker-brand">

          <div className="brand-building">🏙️</div>



          <div>

            <h2>SmartCity</h2>

            <p>Worker Portal</p>

          </div>

        </div>



        <nav className="worker-nav">

          <button

            className={activeSection === "dashboard" ? "active" : ""}

            onClick={() => setActiveSection("dashboard")}

          >

            <span>▦</span>

            Dashboard

          </button>



          <button

            className={activeSection === "tasks" ? "active" : ""}

            onClick={() => setActiveSection("tasks")}

          >

            <span>📋</span>

            My Tasks

          </button>



          <button

            className={activeSection === "notifications" ? "active" : ""}

            onClick={() => setActiveSection("notifications")}

          >

            <span>🔔</span>

            Notifications



            {unreadCount > 0 && (

              <span className="sidebar-notification-badge">

                {unreadCount}

              </span>

            )}

          </button>



          <button

            className={activeSection === "completed" ? "active" : ""}

            onClick={() => setActiveSection("completed")}

          >

            <span>✓</span>

            Completed Tasks

          </button>



          <button

            className={activeSection === "profile" ? "active" : ""}

            onClick={() => setActiveSection("profile")}

          >

            <span>👤</span>

            My Profile

          </button>

        </nav>



        <div className="worker-sidebar-bottom">

          <div className="worker-mini-profile">

            <div className="worker-mini-avatar">👷</div>



            <div>

              <strong>{workerName}</strong>

              <span>{workerEmail}</span>

            </div>

          </div>



          <button className="worker-logout-btn" onClick={handleLogout}>

            ↪ Logout

          </button>

        </div>

      </aside>



      {/* MAIN */}

      <main className="worker-main">

        <div className="worker-content">

          {activeSection === "dashboard" && (

            <>

              {/* WELCOME */}

              <section className="worker-welcome">

                <div className="welcome-worker">

                  <div className="worker-big-avatar">

                    <span>👷</span>

                    <i></i>

                  </div>



                  <div>

                    <p className="welcome-small">Welcome </p>

                    <h1>{workerName} 👋</h1>

                    <span className="worker-email">{workerEmail}</span>



                    <p className="welcome-description">

                      Your work keeps our city clean, green and healthy.

                    </p>

                  </div>

                </div>



                <div className="worker-city-scene">

                  <div className="cloud cloud-one">☁</div>

                  <div className="cloud cloud-two">☁</div>



                  <div className="city-buildings">

                    <span>▥</span>

                    <span>▥</span>

                    <span>▥</span>

                    <span>▥</span>

                    <span>▥</span>

                  </div>



                  <div className="worker-vehicle">🚛</div>

                  <div className="worker-tree">🌳</div>

                </div>



                <div className="worker-motivation">

                  <span className="leaf-icon">🌿</span>



                  <div>

                    <strong>

                      Small actions make a big difference.

                    </strong>

                    <p>Keep going!</p>

                  </div>

                </div>

              </section>



              {/* STATS */}

              <section className="worker-stats">

                <div className="worker-stat-card stat-blue">

                  <div className="worker-stat-icon">📋</div>



                  <div>

                    <strong>{assignedCount}</strong>

                    <h3>Assigned Tasks</h3>

                    <p>Total complaints assigned to you</p>

                  </div>

                </div>



                <div className="worker-stat-card stat-orange">

                  <div className="worker-stat-icon">⏳</div>



                  <div>

                    <strong>{activeCount}</strong>

                    <h3>Active Tasks</h3>

                    <p>Currently waiting for resolution</p>

                  </div>

                </div>



                <div className="worker-stat-card stat-green">

                  <div className="worker-stat-icon">✓</div>



                  <div>

                    <strong>{resolvedCount}</strong>

                    <h3>Resolved Tasks</h3>

                    <p>Tasks successfully completed</p>

                  </div>

                </div>



                <div className="worker-stat-card stat-purple">

                  <div className="worker-stat-icon">🔔</div>



                  <div>

                    <strong>{unreadCount}</strong>

                    <h3>Notifications</h3>

                    <p>Unread work updates</p>

                  </div>

                </div>

              </section>



              {/* DASHBOARD BODY */}

              <section className="worker-dashboard-grid">

                <TaskPanel

                  complaints={complaints}

                  filteredComplaints={filteredComplaints}

                  taskFilter={taskFilter}

                  setTaskFilter={setTaskFilter}

                  handleResolve={handleResolve}
                  completionPhotos={completionPhotos}
setCompletionPhotos={setCompletionPhotos}
uploadingId={uploadingId}

                />



                <div className="worker-side-column">

                  <div className="progress-card">

                    <div className="small-panel-heading">

                      <div>

                        <span>📊</span>

                        <h3>Work Progress</h3>

                      </div>

                    </div>



                    <div className="progress-circle">

                      <div>

                        <strong>

                          {resolvedCount}/{assignedCount}

                        </strong>

                        <span>Completed</span>

                      </div>

                    </div>



                    <div className="progress-details">

                      <div>

                        <span className="dot green"></span>

                        <p>Resolved</p>

                        <strong>{resolvedCount}</strong>

                      </div>



                      <div>

                        <span className="dot orange"></span>

                        <p>Active</p>

                        <strong>{activeCount}</strong>

                      </div>

                    </div>

                  </div>



                  <div className="recent-notifications-card">

                    <div className="small-panel-heading">

                      <div>

                        <span>🔔</span>

                        <h3>Recent Notifications</h3>

                      </div>



                      <button

                        onClick={() =>

                          setActiveSection("notifications")

                        }

                      >

                        View All

                      </button>

                    </div>



                    {notifications.length === 0 ? (

                      <div className="worker-empty-small">

                        No notifications yet.

                      </div>

                    ) : (

                      notifications.slice(0, 3).map((notification) => (

                        <div

                          className={`mini-notification ${

                            notification.is_read === 0

                              ? "unread"

                              : ""

                          }`}

                          key={notification.id}

                        >

                          <div className="mini-notification-icon">

                            📋

                          </div>



                          <div>

                            <strong>

                              Complaint Update

                            </strong>



                            <p>{notification.message}</p>



                            <span>

                              {notification.complaint_id}

                            </span>

                          </div>

                        </div>

                      ))

                    )}

                  </div>

                </div>

              </section>

            </>

          )}



          {/* MY TASKS */}

          {activeSection === "tasks" && (

            <section className="worker-full-section">

              <div className="worker-page-heading">

                <div>

                  <span className="worker-kicker">

                    Field Operations

                  </span>

                  <h1>My Assigned Tasks</h1>

                  <p>

                    View and manage complaints assigned to you.

                  </p>

                </div>



                <span className="worker-total-pill">

                  {assignedCount} Tasks

                </span>

              </div>



              <TaskPanel

                complaints={complaints}

                filteredComplaints={filteredComplaints}

                taskFilter={taskFilter}

                setTaskFilter={setTaskFilter}

                handleResolve={handleResolve}
                  completionPhotos={completionPhotos}
                  setCompletionPhotos={setCompletionPhotos}
                  uploadingId={uploadingId}

                hideOuterTitle

              />

            </section>

          )}



          {/* NOTIFICATIONS */}

          {activeSection === "notifications" && (

            <section className="worker-full-section">

              <div className="worker-page-heading">

                <div>

                  <span className="worker-kicker">

                    Notification Center

                  </span>

                  <h1>Notifications</h1>

                  <p>

                    Assignment alerts and complaint updates.

                  </p>

                </div>



                <span className="worker-total-pill">

                  {unreadCount} Unread

                </span>

              </div>



              <div className="worker-notification-list">

                {notifications.length === 0 ? (

                  <div className="worker-empty">

                    <span>🔔</span>

                    <h3>No notifications</h3>

                    <p>

                      New task notifications will appear here.

                    </p>

                  </div>

                ) : (

                  notifications.map((notification) => (

                    <div

                      className={`worker-notification-item ${

                        notification.is_read === 0

                          ? "notification-unread"

                          : ""

                      }`}

                      key={notification.id}

                    >

                      <div className="notification-left">

                        <div className="notification-main-icon">

                          📋

                        </div>



                        <div>

                          <div className="notification-title-row">

                            <h3>

                              New Complaint Assignment

                            </h3>



                            {notification.is_read === 0 && (

                              <span className="new-pill">

                                New

                              </span>

                            )}

                          </div>



                          <p>{notification.message}</p>



                          <span className="notification-complaint-id">

                            Complaint ID:{" "}

                            {notification.complaint_id}

                          </span>

                        </div>

                      </div>



                      <div className="notification-actions">

                        {notification.is_read === 0 ? (

                          <button

                            onClick={() =>

                              handleMarkAsRead(

                                notification.id

                              )

                            }

                          >

                            ✓ Mark as Read

                          </button>

                        ) : (

                          <span className="notification-read">

                            ✓ Read

                          </span>

                        )}

                      </div>

                    </div>

                  ))

                )}

              </div>

            </section>

          )}



          {/* COMPLETED */}

          {activeSection === "completed" && (

            <section className="worker-full-section">

              <div className="worker-page-heading">

                <div>

                  <span className="worker-kicker">

                    Completed Work

                  </span>

                  <h1>Completed Tasks</h1>

                  <p>

                    Complaints you have successfully resolved.

                  </p>

                </div>



                <span className="worker-total-pill">

                  {resolvedCount} Completed

                </span>

              </div>



              <CompletedTasks

                complaints={completedComplaints}

              />

            </section>

          )}



          {/* PROFILE */}

          {activeSection === "profile" && (

            <section className="worker-full-section">

              <div className="worker-page-heading">

                <div>

                  <span className="worker-kicker">

                    Worker Account

                  </span>

                  <h1>My Profile</h1>

                  <p>Your Smart City worker information.</p>

                </div>

              </div>



              <div className="worker-profile-large">

                <div className="profile-avatar-large">

                  👷

                </div>



                <div className="profile-information">

                  <span className="profile-role">

                    Municipal Field Worker

                  </span>



                  <h2>{workerName}</h2>

                  <p>{workerEmail}</p>



                  <div className="profile-stats">

                    <div>

                      <strong>{assignedCount}</strong>

                      <span>Total Tasks</span>

                    </div>



                    <div>

                      <strong>{activeCount}</strong>

                      <span>Active</span>

                    </div>



                    <div>

                      <strong>{resolvedCount}</strong>

                      <span>Completed</span>

                    </div>

                  </div>

                </div>

              </div>

            </section>

          )}

        </div>

      </main>

    </div>

  );

}



function TaskPanel({
  complaints,
  filteredComplaints,
  taskFilter,
  setTaskFilter,
  handleResolve,
  completionPhotos,
  setCompletionPhotos,
  uploadingId,
  hideOuterTitle = false,
}) {

  const activeCount = complaints.filter(

    (complaint) => complaint.status === "Assigned"

  ).length;



  const resolvedCount = complaints.filter(

    (complaint) => complaint.status === "Resolved"

  ).length;



  return (

    <div className="worker-task-panel">

      {!hideOuterTitle && (

        <div className="task-panel-title">

          <div>

            <span>📋</span>

            <h2>My Assigned Tasks</h2>

          </div>



          <span className="task-record-count">

            {complaints.length} Records

          </span>

        </div>

      )}



      <div className="task-toolbar">

        <div className="task-filters">

          <button

            className={taskFilter === "all" ? "active" : ""}

            onClick={() => setTaskFilter("all")}

          >

            All ({complaints.length})

          </button>



          <button

            className={taskFilter === "active" ? "active" : ""}

            onClick={() => setTaskFilter("active")}

          >

            Active ({activeCount})

          </button>



          <button

            className={taskFilter === "resolved" ? "active" : ""}

            onClick={() => setTaskFilter("resolved")}

          >

            Resolved ({resolvedCount})

          </button>

        </div>

      </div>



      {filteredComplaints.length === 0 ? (

        <div className="worker-empty">

          <span>📋</span>

          <h3>No tasks found</h3>

          <p>No complaints are available in this category.</p>

        </div>

      ) : (

        <div className="worker-task-list">

          {filteredComplaints.map((complaint) => (

            <div

              className="worker-task-row"

              key={complaint.id}

            >

              <div className="task-category-icon">

                {getCategoryIcon(complaint.category)}

              </div>



              <div className="task-main-info">

                <strong>{complaint.complaint_id}</strong>

                <span>{complaint.category}</span>



                <p>

                  📍 {complaint.location}

                </p>

              </div>



              <div className="task-description">

                <span>Description</span>

                <p>{complaint.description}</p>

              </div>
              <div style={{ marginTop: "8px" }}>
  {complaint.photo ? (
    <a
      href={`http://127.0.0.1:5000/uploads/${complaint.photo}`}
      target="_blank"
      rel="noreferrer"
      style={{
        color: "#2563eb",
        fontSize: "13px",
        fontWeight: "600",
        textDecoration: "none",
      }}
    >
      📷 View Citizen Photo
    </a>
  ) : (
    <span style={{ color: "#888", fontSize: "12px" }}>
      No citizen photo uploaded
    </span>
  )}
</div>



              <div className="task-status-area">

                <span

                  className={`worker-status ${getStatusClass(

                    complaint.status

                  )}`}

                >

                  {complaint.status}

                </span>

              </div>



              <div className="task-action-area">

                {complaint.status === "Assigned" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 190 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#285675" }}>
                      📷 Completion Photo (Required)
                    </label>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      aria-label={`Completion photo for ${complaint.complaint_id}`}
                      onChange={(event) => setCompletionPhotos((previous) => ({
                        ...previous,
                        [complaint.complaint_id]: event.target.files?.[0] || null,
                      }))}
                      style={{ width: "100%", maxWidth: 230, fontSize: 12 }}
                    />
                    {completionPhotos[complaint.complaint_id] && (
                      <span style={{ fontSize: 11, color: "#16845d", overflowWrap: "anywhere" }}>
                        ✓ {completionPhotos[complaint.complaint_id].name}
                      </span>
                    )}
                    <button
                      className="resolve-task-btn"
                      disabled={uploadingId === complaint.complaint_id}
                      onClick={() => handleResolve(complaint.complaint_id)}
                    >
                      {uploadingId === complaint.complaint_id ? "Uploading..." : "📷 Upload & Resolve"}
                    </button>
                  </div>
                ) : complaint.status === "Resolved" ? (

                  <span className="completed-task-label">

                    ✓ Completed

                  </span>

                ) : (

                  <span className="waiting-task-label">

                    In Process

                  </span>

                )}

              </div>

            </div>

          ))}

        </div>

      )}

    </div>

  );

}



function CompletedTasks({ complaints }) {

  if (complaints.length === 0) {

    return (

      <div className="worker-empty">

        <span>✓</span>

        <h3>No completed tasks yet</h3>

        <p>

          Resolved complaints will automatically appear here.

        </p>

      </div>

    );

  }



  return (

    <div className="completed-grid">

      {complaints.map((complaint) => (

        <div

          className="completed-card"

          key={complaint.id}

        >

          <div className="completed-icon">

            {getCategoryIcon(complaint.category)}

          </div>



          <div className="completed-content">

            <div className="completed-card-top">

              <strong>{complaint.complaint_id}</strong>

              <span>✓ Resolved</span>

            </div>



            <h3>{complaint.category}</h3>



            <p>📍 {complaint.location}</p>



            <div className="completed-description">

              {complaint.description}

            </div>

          </div>

        </div>

      ))}

    </div>

  );

}



function getCategoryIcon(category) {

  const value = category?.toLowerCase() || "";



  if (value.includes("garbage")) return "🗑️";

  if (value.includes("light")) return "💡";

  if (value.includes("water")) return "💧";



  if (

    value.includes("road") ||

    value.includes("pothole")

  ) {

    return "🛣️";

  }



  if (

    value.includes("tree") ||

    value.includes("environment")

  ) {

    return "🌳";

  }



  if (value.includes("drain")) return "🌊";



  return "📋";

}



function getStatusClass(status) {

  if (status === "Resolved") return "status-resolved";

  if (status === "Assigned") return "status-assigned";

  if (status === "Under Review") return "status-review";



  return "status-default";

}



export default WorkerDashboard;