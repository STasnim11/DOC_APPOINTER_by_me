import { useState } from "react";
import AuthLayout from "../components/AuthLayout";
import "../index.css";
import { useNavigate } from "react-router-dom";

export default function DoctorSetup() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const userEmail = localStorage.getItem("userEmail"); // optional, just for display

  const [doctorData, setDoctorData] = useState({
    licenseNumber: "",
    degrees: "",
    experienceYears: "",
    deptId: "",
    branchId: "",
  });

  const [message, setMessage] = useState("");

  // handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDoctorData((prev) => ({ ...prev, [name]: value }));
  };

  // submit profile only (Step 1)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId || !userEmail) {
      setMessage("Error: No login info found. Please log in first.");
      return;
    }

    if (
      !doctorData.licenseNumber ||
      !doctorData.degrees ||
      !doctorData.experienceYears ||
      !doctorData.deptId ||
      !doctorData.branchId
    ) {
      setMessage("Please fill all required fields!");
      return;
    }

    setMessage("Saving profile...");

    try {
      const res = await fetch("http://localhost:3000/api/doctor/profile/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          email: userEmail,
          licenseNumber: doctorData.licenseNumber,
          degrees: doctorData.degrees,
          experienceYears: Number(doctorData.experienceYears),
          deptId: Number(doctorData.deptId),
          branchId: Number(doctorData.branchId),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save doctor profile");

      setMessage("Profile saved successfully!");

      // redirect to next step: specialization setup
      navigate("/doctor/specialization/setup");
    } catch (err) {
      console.error(err);
      setMessage("Error: " + err.message);
    }
  };

  return (
    <AuthLayout title={`Doctor Setup (${userEmail || "Doctor"})`}>
      <form onSubmit={handleSubmit} className="setup-form">
        <div className="form-group">
          <label>License Number</label>
          <input
            type="text"
            name="licenseNumber"
            value={doctorData.licenseNumber}
            onChange={handleInputChange}
            className="input-field"
            required
          />
        </div>

        <div className="form-group">
          <label>Degrees</label>
          <input
            type="text"
            name="degrees"
            value={doctorData.degrees}
            onChange={handleInputChange}
            className="input-field"
            required
          />
        </div>

        <div className="form-group">
          <label>Years of Experience</label>
          <input
            type="number"
            name="experienceYears"
            value={doctorData.experienceYears}
            onChange={handleInputChange}
            className="input-field"
            required
          />
        </div>

        <div className="form-group">
          <label>Department ID</label>
          <input
            type="number"
            name="deptId"
            value={doctorData.deptId}
            onChange={handleInputChange}
            className="input-field"
            required
          />
        </div>

        <div className="form-group">
          <label>Branch ID</label>
          <input
            type="number"
            name="branchId"
            value={doctorData.branchId}
            onChange={handleInputChange}
            className="input-field"
            required
          />
        </div>

        <button type="submit" className="submit-btn">
          Save Profile
        </button>
        {message && <p className="message">{message}</p>}
      </form>
    </AuthLayout>
  );
}