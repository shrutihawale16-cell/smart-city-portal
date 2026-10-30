import { useState } from "react";
import "./TrackComplaint.css";

function TrackComplaint() {
  const [complaintId, setComplaintId] = useState("");
  const [complaint, setComplaint] = useState(null);
  const [error, setError] = useState("");

  const handleTrack = async (e) => {
    e.preventDefault();

    if (complaintId.trim() === "") {
      return;
    }

    try {
      setError("");
      setComplaint(null);

      const response = await fetch(
        `http://127.0.0.1:5000/api/complaints/${complaintId.trim()}`
      );

      const data = await response.json();

      if (response.ok) {
        setComplaint(data);
      } else {
        setError("Complaint not found. Please check your Complaint ID.");
      }
    } catch (error) {
      console.error(error);
      setError("Cannot connect to backend.");
    }
  };

  const handleTrackAgain = () => {
    setComplaint(null);
    setComplaintId("");
    setError("");
  };

  return (
    <div className="track-page">

      <div className="track-container">

        {!complaint ? (

          <>
            <div className="track-header">
              <div className="status-icon">🔍</div>

              <h1>Track Your Complaint</h1>

              <p>
                Enter your Complaint ID to check the current status.
              </p>
            </div>

            <form
              className="track-form"
              onSubmit={handleTrack}
            >

              <label>Complaint ID</label>

              <input
                type="text"
                placeholder="Example: CMP-6949"
                value={complaintId}
                onChange={(e) =>
                  setComplaintId(e.target.value)
                }
              />

              <button type="submit">
                Track Complaint
              </button>

            </form>

            {error && (
              <p className="error-message">
                {error}
              </p>
            )}
          </>

        ) : (

          <div className="status-result">

            <div className="status-icon">
              🔍
            </div>

            <h1>Complaint Status</h1>

            <p className="found-id">
              Complaint ID:{" "}
              <strong>{complaint.complaint_id}</strong>
            </p>


            {/* Complaint Details */}

            <div className="complaint-details">

              <div className="complaint-detail-row">
                <div className="detail-label">
                  Complaint ID
                </div>

                <div className="detail-value">
                  {complaint.complaint_id}
                </div>
              </div>


              <div className="complaint-detail-row">
                <div className="detail-label">
                  Category
                </div>

                <div className="detail-value">
                  {complaint.category}
                </div>
              </div>


              <div className="complaint-detail-row">
                <div className="detail-label">
                  Location
                </div>

                <div className="detail-value">
                  {complaint.location}
                </div>
              </div>


              <div className="complaint-detail-row">
                <div className="detail-label">
                  Description
                </div>

                <div className="detail-value">
                  {complaint.description}
                </div>
              </div>


              <div className="complaint-detail-row">
                <div className="detail-label">
                  Current Status
                </div>

                <div className="detail-value">
                  <strong>{complaint.status}</strong>
                </div>
              </div>

            </div>


            {/* Status Timeline */}

            <div className="status-card">

              <div className="status-step completed">

                <div className="circle">
                  ✓
                </div>

                <div>
                  <h3>Complaint Submitted</h3>

                  <p>
                    Your complaint has been successfully registered.
                  </p>
                </div>

              </div>


              <div className="status-line"></div>


              <div className="status-step active">

                <div className="circle">
                  2
                </div>

                <div>
                  <h3>Under Review</h3>

                  <p>
                    Municipal authorities are reviewing your complaint.
                  </p>
                </div>

              </div>


              <div className="status-line"></div>


              <div className="status-step">

                <div className="circle">
                  3
                </div>

                <div>
                  <h3>Assigned</h3>

                  <p>
                    Issue will be assigned to the concerned department.
                  </p>
                </div>

              </div>


              <div className="status-line"></div>


              <div className="status-step">

                <div className="circle">
                  4
                </div>

                <div>
                  <h3>Resolved</h3>

                  <p>
                    The reported issue will be marked as resolved.
                  </p>
                </div>

              </div>

            </div>


            <button
              className="track-again-btn"
              onClick={handleTrackAgain}
            >
              Track Another Complaint
            </button>

          </div>

        )}

      </div>

    </div>
  );
}

export default TrackComplaint;