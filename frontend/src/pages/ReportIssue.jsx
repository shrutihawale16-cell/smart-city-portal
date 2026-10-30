import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ReportIssue.css";

function ReportIssue() {
  const navigate = useNavigate();

  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState(null);
  const [complaintId, setComplaintId] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const user = JSON.parse(localStorage.getItem("smartcityUser"));
  

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const formData = new FormData();

    formData.append("category", category);
    formData.append("location", location);
    formData.append("description", description);
    formData.append("citizen_email", user?.email || "");

    if (photo) {
      formData.append("photo", photo);
    }

    const response = await fetch(
      "http://127.0.0.1:5000/api/complaints",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (response.ok) {
      setComplaintId(data.complaint_id);
      setSubmitted(true);
    } else {
      alert(data.message || "Something went wrong!");
    }

  } catch (error) {
    console.error(error);
    alert("Cannot connect to backend!");
  }
};


  if (submitted) {
    return (
      <div className="report-page">

        <div className="report-container success-container">

          <div className="success-icon">
            ✅
          </div>

          <h1>Complaint Submitted!</h1>

          <p>
            Your complaint has been successfully registered.
          </p>

          <div className="complaint-id-box">

            <p>Your Complaint ID</p>

            <h2>{complaintId}</h2>

          </div>

          <p>
            Please save this Complaint ID to track your complaint.
          </p>
          <button
  type="button"
  className="report-back-btn"
  onClick={() => navigate("/dashboard")}
>
  ← Back to Dashboard
</button>

        </div>

      </div>
    );
  }


return (
  <div className="report-page">
    <div className="report-container">

      <button
        type="button"
        className="report-back-btn"
        onClick={() => navigate("/dashboard")}
      >
        ← Back to Dashboard
      </button>

      <div className="report-header">

          <h1>Report an Issue</h1>

          <p>
            Help us improve your city by reporting a civic problem.
          </p>

        </div>


        <form
          className="report-form"
          onSubmit={handleSubmit}
        >

          <label>Issue Category</label>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >

            <option value="">
              Select an issue
            </option>

            <option value="Garbage Management">
              Garbage Management
            </option>

            <option value="Road & Potholes">
              Road & Potholes
            </option>

            <option value="Street Lights">
              Street Lights
            </option>

            <option value="Water Supply">
              Water Supply
            </option>

          </select>


          <label>Location</label>

          <input
            type="text"
            placeholder="Enter the location of the issue"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />


          <label>Issue Description</label>

          <textarea
            rows="5"
            placeholder="Describe the problem..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          ></textarea>

<label>Upload Photo</label>

<input
  type="file"
  accept="image/*"
  onChange={(e) => setPhoto(e.target.files[0])}
  required
/>

{photo && (
  <div className="photo-preview">
    <img
      src={URL.createObjectURL(photo)}
      alt="Selected complaint"
    />

    <p>📷 {photo.name}</p>
  </div>
)}

          <button type="submit">
            Submit Complaint
          </button>

        </form>

      </div>

    </div>
  );
}

export default ReportIssue;