import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import smartCityLogo from "../assets/smartcity-logo.png";

function Login() {
  const [userType, setUserType] = useState("Citizen");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [workerNotificationCount, setWorkerNotificationCount] = useState(0);
  const [officerNotificationCount, setOfficerNotificationCount] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    fetch(
      "http://127.0.0.1:5000/api/notifications/unread-count?email=worker@smartcity.com"
    )
      .then((response) => response.json())
      .then((data) => {
        setWorkerNotificationCount(data.unread_count || 0);
      })
      .catch((error) => {
        console.error("Error fetching worker notifications:", error);
      });

    fetch(
      "http://127.0.0.1:5000/api/notifications/unread-count?email=officer@smartcity.com"
    )
      .then((response) => response.json())
      .then((data) => {
        setOfficerNotificationCount(data.unread_count || 0);
      })
      .catch((error) => {
        console.error("Error fetching officer notifications:", error);
      });
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem(
          "smartcityUser",
          JSON.stringify(data.user)
        );

        if (data.user.role === "Admin") {
          navigate("/admin");
        } else if (data.user.role === "Municipal Officer") {
          navigate("/officer");
        } else if (data.user.role === "Worker") {
          navigate("/worker");
        } else {
          navigate("/dashboard");
        }
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Cannot connect to backend.");
    }
  };

  return (
    <div className="login-page">
      {/* LEFT VISUAL AREA */}
      <section className="login-visual">
        <div className="visual-content">
          <p className="visual-tag">SMART CITY</p>

          <h1>
            Together for a
            <br />
            Cleaner, Greener
            <br />
            and <span>Smarter City</span> 🌿
          </h1>

          <p className="visual-description">
            Report issues
            <b>•</b>
            Improve infrastructure
            <b>•</b>
            Build a better tomorrow
          </p>
        </div>

        <div className="city-scene">
          <div className="scene-sun"></div>

          <div className="scene-cloud cloud-a">☁</div>
          <div className="scene-cloud cloud-b">☁</div>

          <div className="scene-buildings">
            <span>▥</span>
            <span>▥</span>
            <span>▥</span>
            <span>▥</span>
            <span>▥</span>
            <span>▥</span>
            <span>▥</span>
          </div>

          <div className="scene-trees">
            🌳 🌲 🌳 🌲 🌳 🌲
          </div>

          <div className="scene-water"></div>
        </div>

        <div className="city-features">
          <div>
            <span>🍃</span>
            <strong>Clean</strong>
            <p>Environment</p>
          </div>

          <div>
            <span>👥</span>
            <strong>Active</strong>
            <p>Community</p>
          </div>

          <div>
            <span>⚙️</span>
            <strong>Smart</strong>
            <p>Infrastructure</p>
          </div>

          <div>
            <span>🛡️</span>
            <strong>Better</strong>
            <p>Governance</p>
          </div>
        </div>
      </section>

      {/* RIGHT LOGIN AREA */}
      <section className="login-right">
        <div className="login-card">
          <div className="brand-logo">
            <img
              src={smartCityLogo}
              alt="SmartCity Operational Portal"
              className="smartcity-logo-img"
            />
          </div>

          <div className="login-heading">
            <h2>Welcome back! 👋</h2>
            <p>Login to continue to your account.</p>
          </div>

          {/* ROLE SELECTOR */}
          <div className="user-type">
            <button
              type="button"
              className={userType === "Citizen" ? "type-active" : ""}
              onClick={() => setUserType("Citizen")}
            >
              <span className="role-icon">👥</span>
              <span>Citizen</span>

              {userType === "Citizen" && (
                <span className="selected-check">✓</span>
              )}
            </button>

            <button
              type="button"
              className={`officer-type-button ${
                userType === "Municipal Officer" ? "type-active" : ""
              }`}
              onClick={() => setUserType("Municipal Officer")}
            >
              <span className="role-icon">🏢</span>
              <span>Municipal Officer</span>

              {officerNotificationCount > 0 && (
                <span className="officer-login-notification-badge">
                  {officerNotificationCount}
                </span>
              )}

              {userType === "Municipal Officer" && (
                <span className="selected-check">✓</span>
              )}
            </button>

            <button
              type="button"
              className={`worker-type-button ${
                userType === "Worker" ? "type-active" : ""
              }`}
              onClick={() => setUserType("Worker")}
            >
              <span className="role-icon">👷</span>
              <span>Worker</span>

              {workerNotificationCount > 0 && (
                <span className="worker-notification-badge">
                  {workerNotificationCount}
                </span>
              )}

              {userType === "Worker" && (
                <span className="selected-check">✓</span>
              )}
            </button>

            <button
              type="button"
              className={userType === "Admin" ? "type-active" : ""}
              onClick={() => setUserType("Admin")}
            >
              <span className="role-icon">🛡️</span>
              <span>Admin</span>

              {userType === "Admin" && (
                <span className="selected-check">✓</span>
              )}
            </button>
          </div>

          {/* LOGIN FORM */}
          <form onSubmit={handleLogin}>
            <label>Email Address</label>

            <div className="login-input-box">
              <span>✉</span>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <label>Password</label>

            <div className="login-input-box">
              <span>🔒</span>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="login-submit">
              Login <span>→</span>
            </button>

            {userType === "Citizen" && (
              <p className="register-text">
                New citizen?{" "}
                <span onClick={() => navigate("/register")}>
                  Create Account
                </span>
              </p>
            )}
          </form>

          <div className="login-footer">
            <span></span>
            <p>Smart City Operational Portal</p>
            <span></span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Login;