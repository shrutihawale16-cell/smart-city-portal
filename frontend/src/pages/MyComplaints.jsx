
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MyComplaints.css";

const API_BASE = "http://127.0.0.1:5000";

function MyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("smartcityUser") || "null"
  );

  useEffect(() => {
    if (!user?.email) return;

    fetch(
      `${API_BASE}/api/my-complaints?email=${encodeURIComponent(
        user.email
      )}`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch complaints");
        }
        return response.json();
      })
      .then((data) => {
        setComplaints(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error("Error fetching complaints:", error);
      });
  }, [user?.email]);

  return (
    <div className="my-complaints-page">
      <div className="my-complaints-container">
        <button
          className="back-dashboard-btn"
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button>

        <h1>My Complaints</h1>

        <p className="my-complaints-subtitle">
          View and track all the issues you have reported.
        </p>

        {complaints.length === 0 ? (
          <div className="empty-complaints">
            <h3>No complaints yet</h3>
            <p>
              Your submitted complaints will appear here.
            </p>
          </div>
        ) : (
          <div className="my-complaints-list">
            {complaints.map((complaint) => (
              <div
                className="my-complaint-card"
                key={complaint.id}
              >
                <div className="complaint-card-header">
                  <h3>{complaint.complaint_id}</h3>

                  <span
                    className={`citizen-status ${(
                      complaint.status || ""
                    )
                      .toLowerCase()
                      .replaceAll(" ", "-")}`}
                  >
                    {complaint.status}
                  </span>
                </div>

                <p>
                  <strong>Category:</strong>{" "}
                  {complaint.category}
                </p>

                <p>
                  <strong>Location:</strong>{" "}
                  {complaint.location}
                </p>

                <p>
                  <strong>Description:</strong>{" "}
                  {complaint.description}
                </p>

                <div className="complaint-photo-area">
                  <strong>📷 Before Photo:</strong>

                  {complaint.photo ? (
                    <a
                      href={`${API_BASE}/uploads/${complaint.photo}`}
                      target="_blank"
                      rel="noreferrer"
                      className="view-photo-btn"
                    >
                      View Before Photo
                    </a>
                  ) : (
                    <span className="no-photo-text">
                      No Photo
                    </span>
                  )}
                </div>

                {complaint.status === "Resolved" && (
                  <div
                    className="complaint-photo-area"
                    style={{ marginTop: "12px" }}
                  >
                    <strong>✅ After Photo:</strong>

                    {complaint.completion_photo ? (
                      <a
                        href={`${API_BASE}/uploads/${complaint.completion_photo}`}
                        target="_blank"
                        rel="noreferrer"
                        className="view-photo-btn"
                      >
                        📷 View Completion Photo
                      </a>
                    ) : (
                      <span className="no-photo-text">
                        Completion photo not available
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyComplaints;
