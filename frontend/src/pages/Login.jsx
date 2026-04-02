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
        setMessage(data.error || data.message || "Login failed");
        setLoading(false);
        return;
      }

      console.log('Login response:', data);
      console.log('Token from response:', data.token);
      console.log('User from response:', data.user);

      const { role } = data.user;

      // 2️⃣ Clear old storage first
      localStorage.clear();

      // 3️⃣ Save essential info in localStorage (including token)
      const userWithToken = { ...data.user, token: data.token };
      localStorage.setItem("user", JSON.stringify(userWithToken));
      localStorage.setItem("userEmail", data.user.email);
      localStorage.setItem("userRole", role);

      console.log('Stored user:', userWithToken);
      console.log('Token stored:', !!data.token);
      console.log('Full localStorage user:', localStorage.getItem('user'));

      // 4️⃣ Redirect based on role (case-insensitive)
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
      
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button
          onClick={() => {
            localStorage.clear();
            alert('Storage cleared! Now login again.');
          }}
          style={{
            background: '#f39c12',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Clear Storage & Retry
        </button>
      </div>
    </AuthLayout>
  );
}