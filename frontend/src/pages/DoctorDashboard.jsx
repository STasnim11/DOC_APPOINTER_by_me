import { useEffect, useState } from "react";
import defaultImg from "../assets/default.png";
import "../index.css"; // global styles
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import enUS from "date-fns/locale/en-US";

export default function DoctorDashboard() {
  // Doctor state
  const [doctor, setDoctor] = useState({
    name: "",
    license: "Not provided",
    specialization: "Not provided",
    photo: null,
  });

  // Availability state
  const [availability, setAvailability] = useState({
    Sunday: { active: false, start: "10:00", end: "18:00" },
    Monday: { active: false, start: "10:00", end: "18:00" },
    Tuesday: { active: false, start: "10:00", end: "18:00" },
    Wednesday: { active: false, start: "10:00", end: "18:00" },
    Thursday: { active: false, start: "10:00", end: "18:00" },
    Friday: { active: false, start: "10:00", end: "18:00" },
    Saturday: { active: false, start: "10:00", end: "18:00" },
  });

  // Appointments state
  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState("");

  // Time options for dropdown
  const timeOptions = [];
  for (let h = 10; h <= 22; h++) {
    timeOptions.push(h.toString().padStart(2, "0") + ":00");
    timeOptions.push(h.toString().padStart(2, "0") + ":30");
  }

  // Setup calendar localizer
  const locales = { "en-US": enUS };
  const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

  // Convert appointments to calendar events
  const events = appointments.map((appt) => ({
    id: appt.id,
    title: `${appt.patientName} (${appt.status})`,
    start: new Date(`${appt.date}T${appt.startTime}`),
    end: new Date(`${appt.date}T${appt.endTime}`),
  }));

  // Fetch doctor profile from backend
  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        const email = localStorage.getItem("userEmail");
        if (!email) return;

        const res = await fetch(`http://localhost:3000/api/doctor/profile/${email}`);
        const data = await res.json();

        if (res.ok) {
          setDoctor({
            name: data.name || "",
            license: data.license || "Not provided",
            specialization: data.specialization || "Not provided",
            photo: data.photo || null,
          });

          // Set availability if present
          if (data.availability) setAvailability(data.availability);

          // Set appointments if present
          if (data.appointments) setAppointments(data.appointments);
        } else {
          console.error("Failed to fetch doctor profile:", data.error);
        }
      } catch (err) {
        console.error("Error fetching doctor profile:", err);
      }
    };

    fetchDoctorProfile();
  }, []);

  // Handle availability changes
  const handleAvailabilityChange = (day, field, value) => {
    setAvailability({
      ...availability,
      [day]: { ...availability[day], [field]: value },
    });
  };

  // Save availability to backend
  const handleSaveAvailability = async () => {
    try {
      const email = localStorage.getItem("userEmail");
      const res = await fetch(`http://localhost:3000/api/doctor/availability/${email}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability }),
      });
      if (res.ok) {
        setMessage("Availability updated ✅");
        setTimeout(() => setMessage(""), 3000);
      } else {
        const data = await res.json();
        setMessage(data.error || "Failed to save availability ❌");
      }
    } catch (err) {
      console.error(err);
      setMessage("Server error ❌");
    }
  };

  return (
    <div className="container" style={{ padding: "20px" }}>
      {/* PROFILE CARD */}
      <div className="card fade-in" style={{ maxWidth: "500px", margin: "0 auto 30px auto", padding: "20px" }}>
        <div className="accent-stripe"></div>
        <div className="logo">⚡ DOC APPOINTER</div>
        <h2>Doctor Profile</h2>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <img
            src={doctor.photo || defaultImg}
            alt="Doctor"
            style={{ width: "120px", height: "120px", borderRadius: "50%", objectFit: "cover", marginBottom: "10px" }}
          />
        </div>
        <p><strong>Name:</strong> {doctor.name}</p>
        <p><strong>License:</strong> {doctor.license}</p>
        <p><strong>Specialization:</strong> {doctor.specialization}</p>
      </div>

      {/* AVAILABILITY */}
      <div className="card fade-in" style={{ maxWidth: "700px", margin: "0 auto 30px auto", padding: "20px" }}>
        <div className="accent-stripe"></div>
        <h2>Edit Availability</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "15px" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Day</th>
              <th>Active</th>
              <th>Start Time</th>
              <th>End Time</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(availability).map((day) => (
              <tr key={day}>
                <td>{day}</td>
                <td style={{ textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={availability[day].active}
                    onChange={(e) => handleAvailabilityChange(day, "active", e.target.checked)}
                  />
                </td>
                <td style={{ textAlign: "center" }}>
                  <select
                    value={availability[day].start}
                    onChange={(e) => handleAvailabilityChange(day, "start", e.target.value)}
                  >
                    {timeOptions.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </td>
                <td style={{ textAlign: "center" }}>
                  <select
                    value={availability[day].end}
                    onChange={(e) => handleAvailabilityChange(day, "end", e.target.value)}
                  >
                    {timeOptions.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="submit-btn" style={{ marginTop: "15px" }} onClick={handleSaveAvailability}>
          Save Availability
        </button>
        {message && <p className="message">{message}</p>}
      </div>

      {/* APPOINTMENTS CALENDAR */}
      <div className="card fade-in" style={{ maxWidth: "900px", margin: "0 auto 50px auto", padding: "20px" }}>
        <div className="accent-stripe"></div>
        <h2>Upcoming Appointments</h2>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 500, marginTop: 20 }}
        />
      </div>
    </div>
  );
}