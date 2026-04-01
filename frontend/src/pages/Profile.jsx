// src/pages/PatientDashboard.jsx
import { useEffect, useState } from "react";
import AuthLayout from "../components/AuthLayout";

export default function PatientDashboard() {
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

    if (!loggedInUser) {
      setMessage("No user logged in!");
      return;
    }

    setUser(loggedInUser);

    // Fetch patient appointments from backend (replace URL with your API)
const fetchAppointments = async () => {
  try {
    const res = await fetch(
      `http://localhost:3000/api/patient/${loggedInUser.email}/appointments`
    );

    // Debug: log raw response
    const text = await res.text();
    console.log("Raw response from appointments:", text);

    // Only parse JSON if content-type is application/json
    if (res.headers.get("content-type")?.includes("application/json")) {
      const data = JSON.parse(text);

      if (!res.ok) {
        setMessage(data.message || "Failed to fetch appointments");
        return;
      }

      console.log("Appointments fetched:", data);
      // setAppointments(data); // <-- your state update here
    } else {
      console.error("Appointments endpoint did not return JSON");
      setMessage("Failed to fetch appointments ❌");
    }

  } catch (err) {
    console.error("Fetch error:", err);
    setMessage("Server error ❌");
  }
};

    fetchAppointments();
  }, []);

  // Loading / error states
  if (message) {
    return <p style={{ textAlign: "center", marginTop: "50px" }}>{message}</p>;
  }

  if (!user) {
    return <p style={{ textAlign: "center", marginTop: "50px" }}>Loading profile...</p>;
  }

  return (
    <AuthLayout title={`Welcome, ${user.name}`}>
      <div className="profile-section">
        <h2>My Info</h2>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role}</p>

        <button
          className="submit-btn"
          onClick={() => {
            localStorage.removeItem("loggedInUser");
            window.location.href = "/login";
          }}
        >
          Logout
        </button>
      </div>

      <div className="appointments-section">
        <h2>My Appointments</h2>
        {appointments.length === 0 ? (
          <p>No appointments booked yet.</p>
        ) : (
          <ul>
            {appointments.map((appt) => (
              <li key={appt.id}>
                Dr. {appt.doctorName} — {appt.slot} {appt.booked ? "(Booked)" : "(Available)"}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AuthLayout>
  );
}