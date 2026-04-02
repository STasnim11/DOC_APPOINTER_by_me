import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css";

function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState({
    length: false,
    capital: false,
    number: false,
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const checkPassword = (password) => {
    setPasswordStatus({
      length: password.length >= 8,
      capital: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
    });
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      setMessage("Please enter your name.");
      return;
    }
    if (!formData.email.includes("@")) {
      setMessage("Please enter a valid email address.");
      return;
    }
    if (!passwordStatus.length || !passwordStatus.capital || !passwordStatus.number) {
      setMessage("Password does not meet all requirements.");
      return;
    }
    if (!/^\d{11}$/.test(formData.phone)) {
      setMessage("Phone must be 11 digits.");
      return;
    }
    if (!formData.role) {
      setMessage("Please select a role.");
      return;
    }

    setLoading(true);
    setMessage("Creating your account...");

    try {
      const response = await fetch("http://localhost:3000/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          pass: formData.password,
          phone: formData.phone,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("🎉 Signup successful!");

        const userWithToken = { 
          ...data.user, 
          token: data.token 
        };
        
        localStorage.clear();
        localStorage.setItem("user", JSON.stringify(userWithToken));
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("userEmail", data.user.email);
        localStorage.setItem("userRole", data.user.role);

        setTimeout(() => {
          if (formData.role === "DOCTOR") {
            navigate("/doctor/license-verification");
          } else if (formData.role === "PATIENT") {
            navigate("/patient/setup");
          } else if (formData.role === "ADMIN") {
            navigate("/admin/dashboard");
          }
        }, 1000);
      } else {
        setMessage(data.error || "Signup failed ❌");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("Server not responding ❌");
    } finally {
      setLoading(false);
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
          <h1 className="auth-title">Join Us Today!</h1>
          <p className="auth-subtitle">
            Create your account and start your journey to better healthcare management.
          </p>
          <div className="auth-features">
            <div className="auth-feature">
              <div className="auth-feature-icon">⚡</div>
              <span>Quick and easy registration</span>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">🎯</div>
              <span>Personalized experience</span>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">💼</div>
              <span>For patients and doctors</span>
            </div>
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-card">
            <div className="auth-card-header">
              <h2 className="auth-card-title">Create Account</h2>
              <p className="auth-card-subtitle">Fill in your details to get started</p>
            </div>

            <div className="auth-form">
              <div className="auth-input-group">
                <label className="auth-input-label">Full Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  className="auth-input"
                />
              </div>

              <div className="auth-input-group">
                <label className="auth-input-label">Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="auth-input"
                />
              </div>

              <div className="auth-input-group">
                <label className="auth-input-label">Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => {
                    handleChange(e);
                    checkPassword(e.target.value);
                  }}
                  className="auth-input"
                />
              </div>

              {formData.password && (
                <div className="password-hints">
                  <p className={`password-hint ${passwordStatus.length ? 'valid' : 'invalid'}`}>
                    {passwordStatus.length ? "✔" : "❌"} At least 8 characters
                  </p>
                  <p className={`password-hint ${passwordStatus.capital ? 'valid' : 'invalid'}`}>
                    {passwordStatus.capital ? "✔" : "❌"} At least 1 CAPITAL letter
                  </p>
                  <p className={`password-hint ${passwordStatus.number ? 'valid' : 'invalid'}`}>
                    {passwordStatus.number ? "✔" : "❌"} At least 1 number
                  </p>
                </div>
              )}

              <div className="auth-input-group">
                <label className="auth-input-label">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  placeholder="01234567890 (11 digits)"
                  value={formData.phone}
                  onChange={handleChange}
                  maxLength="11"
                  className="auth-input"
                />
              </div>

              <div className="auth-input-group">
                <label className="auth-input-label">I am a</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="auth-input"
                >
                  <option value="">Select your role</option>
                  <option value="PATIENT">Patient</option>
                  <option value="DOCTOR">Doctor</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <button 
                className="auth-submit-btn" 
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>

              {message && (
                <div className={`auth-message ${message.includes('successful') || message.includes('🎉') ? 'success' : 'error'}`}>
                  {message}
                </div>
              )}
            </div>

            <div className="auth-footer">
              Already have an account?{' '}
              <span className="auth-footer-link" onClick={() => navigate('/login')}>
                Sign In
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;