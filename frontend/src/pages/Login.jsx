import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage("Please enter email and password");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pass: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || data.message || "Login failed");
        setLoading(false);
        return;
      }

      const { role } = data.user;
      localStorage.clear();

      const userWithToken = { ...data.user, token: data.token };
      localStorage.setItem("user", JSON.stringify(userWithToken));
      localStorage.setItem("userEmail", data.user.email);
      localStorage.setItem("userRole", role);

      const userRole = role.toUpperCase();
      
      if (userRole === "DOCTOR") {
        // Check if doctor has license
        const profileRes = await fetch(`http://localhost:3000/api/doctor/profile/${data.user.email}`);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (!profileData.license || profileData.license === 'Not provided') {
            navigate("/doctor/license-verification");
          } else {
            navigate("/doctor/dashboard");
          }
        } else {
          navigate("/doctor/license-verification");
        }
      } else if (userRole === "PATIENT") {
        navigate("/patient/dashboard");
      } else if (userRole === "ADMIN") {
        navigate("/admin/dashboard");
      } else {
        setMessage("Unknown role: " + role);
      }

    } catch (err) {
      console.error(err);
      setMessage("Server error ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-left">
          <div className="auth-logo">
            <span className="auth-logo-icon">🏥</span>
            <span>DOCAPPOINTER</span>
          </div>
          <h1 className="auth-title">Welcome Back!</h1>
          <p className="auth-subtitle">
            Sign in to access your account and manage your appointments with trusted healthcare professionals.
          </p>
          <div className="auth-features">
            <div className="auth-feature">
              <div className="auth-feature-icon">📅</div>
              <span>Easy appointment booking</span>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">👨‍⚕️</div>
              <span>Connect with qualified doctors</span>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">🔒</div>
              <span>Secure and private</span>
            </div>
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-card">
            <div className="auth-card-header">
              <h2 className="auth-card-title">Sign In</h2>
              <p className="auth-card-subtitle">Enter your credentials to continue</p>
            </div>

            <div className="auth-form">
              <div className="auth-input-group">
                <label className="auth-input-label">Email Address</label>
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="auth-input"
                />
              </div>

              <div className="auth-input-group">
                <label className="auth-input-label">Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="auth-input"
                />
              </div>

              <button
                className="auth-submit-btn"
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>

              {message && (
                <div className={`auth-message ${message.includes('✅') || message.includes('successful') ? 'success' : 'error'}`}>
                  {message}
                </div>
              )}
            </div>

            <div className="auth-footer">
              Don't have an account?{' '}
              <span className="auth-footer-link" onClick={() => navigate('/signup')}>
                Sign Up
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}