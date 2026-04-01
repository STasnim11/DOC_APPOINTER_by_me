import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";

export default function SpecializationSetup() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId"); // logged in doctor
const userEmail = localStorage.getItem("userEmail"); // optional, just for display
  const [specializations, setSpecializations] = useState([]);
  const [selectedSpec, setSelectedSpec] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchSpecializations() {
      try {
        const res = await fetch("http://localhost:3000/api/doctor/specializations");
        const data = await res.json();
        setSpecializations(data);
      } catch (err) {
        console.error("Failed to fetch specializations", err);
      }
    }
    fetchSpecializations();
  }, []);

  const handleSave = async () => {
    if (!selectedSpec) {
      setMessage("Please select a specialization");
      return;
    }

    setMessage("Saving...");

    try {
      const res = await fetch("http://localhost:3000/api/doctor/specialization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           email: userEmail, // ✅ send email instead of userId
          specializationId: selectedSpec,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Specialization saved successfully!");
        // after saving, move to schedule setup page
        setTimeout(() => navigate("/doctor/timeslots"), 1000);
      } else {
        setMessage(data.error || "Failed to save specialization");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error saving specialization");
    }
  };

  return (
    <AuthLayout title="Select Your Specialization">
      <div className="setup-form">
        <label>Select Specialization:</label>
        <select
          value={selectedSpec || ""}
          onChange={(e) => setSelectedSpec(e.target.value)}
          className="input-field"
        >
          <option value="">-- Select --</option>
          {specializations.map((spec) => (
            <option key={spec.ID} value={spec.ID}>
              {spec.NAME}
            </option>
          ))}
        </select>

        <button className="submit-btn" onClick={handleSave}>
          Save Specialization
        </button>
        {message && <p className="message">{message}</p>}
      </div>
    </AuthLayout>
  );
}