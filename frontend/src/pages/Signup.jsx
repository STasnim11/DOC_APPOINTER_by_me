import { useState, useEffect } from "react";
import "../index.css";
import hospitalImg from "../assets/hospital.jpeg";
import { useNavigate } from "react-router-dom";

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
  const [fade, setFade] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState({
    length: false,
    capital: false,
    number: false,
  });

  useEffect(() => {
    setFade(true);
  }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // Live password validation
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

    setMessage("Signing up...");

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
      console.log("Server response:", data);

if (response.ok) {
  setMessage("🎉 Signup successful!");

  // save logged user info properly
  localStorage.setItem("userId", data.user.id);      // <-- save userId returned from backend
  localStorage.setItem("userEmail", data.user.email); // <-- save email
  localStorage.setItem("userRole", data.user.role);   // optional, useful for role-based logic

  // role-based redirect
  setTimeout(() => {
    if (formData.role === "DOCTOR") {
      navigate("/doctor/setup");
    } else if (formData.role === "PATIENT") {
      navigate("/patient/setup");
    } else if (formData.role === "ADMIN") {
      navigate("/admin/dashboard");
    }
  }, 1000);
} else {
        // Show backend error (e.g., email already exists)
        setMessage(data.error || "Signup failed ❌");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("Server not responding ❌");
    }
  };

  return (
    <div className="container">
      <div className={`card ${fade ? "fade-in" : ""}`}>
        <div className="accent-stripe"></div>
        <div className="logo">⚡ DOC APPOINTER</div>
        <h2>SIGN UP</h2>
        <img src={hospitalImg} alt="Hospital" />

        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          className="input-field"
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="input-field"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => {
            handleChange(e);
            checkPassword(e.target.value);
          }}
          className="input-field"
        />

        {/* Live password hints */}
        <div className="password-hints">
          <p style={{ color: passwordStatus.length ? "green" : "red" }}>
            {passwordStatus.length ? "✔" : "❌"} At least 8 characters
          </p>
          <p style={{ color: passwordStatus.capital ? "green" : "red" }}>
            {passwordStatus.capital ? "✔" : "❌"} At least 1 CAPITAL letter
          </p>
          <p style={{ color: passwordStatus.number ? "green" : "red" }}>
            {passwordStatus.number ? "✔" : "❌"} At least 1 number
          </p>
        </div>

        {/* Phone input */}
        <input
          type="text"
          name="phone"
          placeholder="Phone (11 digits)"
          value={formData.phone}
          onChange={handleChange}
          className="input-field"
        />

        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="input-field"
        >
          <option value="">Select Role</option>
          <option value="PATIENT">Patient</option>
          <option value="DOCTOR">Doctor</option>
          <option value="ADMIN">Admin</option>
        </select>

        <button className="submit-btn" onClick={handleSubmit}>
          SIGN UP
        </button>

        <p
          className={`message ${
            message.includes("successful") || message.includes("✅") ? "success" : "error"
          }`}
        >
          {message}
        </p>

        {/* Login option */}
        <div className="login-option">
          <p>Already have an account?</p>
          <button className="login-btn" onClick={() => navigate("/login")}>
            LOGIN
          </button>
        </div>
      </div>
    </div>
  );
}

export default Signup;