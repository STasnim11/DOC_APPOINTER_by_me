import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";

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
      // 1️⃣ Send login request
      const res = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pass: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Login failed");
        setLoading(false);
        return;
      }

      const { role } = data.user;

      // 2️⃣ Save essential info in localStorage
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("userEmail", data.user.email);
      localStorage.setItem("userRole", role);

      // 3️⃣ Redirect based on role (case-insensitive)
      const userRole = role.toUpperCase();
      
      if (userRole === "DOCTOR") {
        navigate("/doctor/dashboard");
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

  return (
    <AuthLayout title="LOGIN">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="input-field"
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="input-field"
      />

      <button
        className="submit-btn"
        onClick={handleLogin}
        disabled={loading}
      >
        {loading ? "Logging in..." : "LOGIN"}
      </button>

      {message && <p className="message">{message}</p>}
    </AuthLayout>
  );
}