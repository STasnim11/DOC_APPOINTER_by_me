import { useState } from "react";
import AuthLayout from "../components/AuthLayout";
import "../index.css";

export default function DoctorTimeSlots() {
  const email = localStorage.getItem("userEmail");

  const [formData, setFormData] = useState({
    dayOfWeek: "",
    startTime: "",
    endTime: "",
    interval: "15",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:3000/api/doctor/timeslots/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          timeSlots: [formData],
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✅ Time slot saved successfully");
      } else {
        setMessage(data.error || "❌ Failed to save");
      }
    } catch {
      setMessage("❌ Server error");
    }
  };

  return (
    <AuthLayout title="Set Your Availability">
      <form onSubmit={handleSubmit} className="timeslot-form">

        {/* DAY */}
        <label className="form-label">Day</label>
        <select
          name="dayOfWeek"
          className="input-field"
          value={formData.dayOfWeek}
          onChange={handleChange}
          required
        >
          <option value="">Select working day</option>
          <option>Sunday</option>
          <option>Monday</option>
          <option>Tuesday</option>
          <option>Wednesday</option>
          <option>Thursday</option>
          <option>Friday</option>
          <option>Saturday</option>
        </select>

        {/* TIME ROW */}
        <div className="time-row">
          <div>
            <label className="form-label">Start Time</label>
            <input
              type="time"
              name="startTime"
              className="input-field"
              value={formData.startTime}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="form-label">End Time</label>
            <input
              type="time"
              name="endTime"
              className="input-field"
              value={formData.endTime}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* INTERVAL */}
        <label className="form-label">Appointment Interval (minutes)</label>
        <input
          type="number"
          name="interval"
          className="input-field"
          value={formData.interval}
          onChange={handleChange}
          min="5"
          step="5"
          required
        />

        <button type="submit" className="submit-btn">
          Save Availability
        </button>

        {message && (
          <p className="message">{message}</p>
        )}
      </form>
    </AuthLayout>
  );
}