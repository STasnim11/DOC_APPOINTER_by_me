import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/WritePrescription.css";

export default function WritePrescription() {
  const navigate = useNavigate();
  const { appointmentId } = useParams();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [medicines, setMedicines] = useState([]);
  
  const [formData, setFormData] = useState({
    chiefComplaints: "",
    investigations: "",
    requiredTests: "",
    diagnosis: "",
    history: "",
    instructions: "",
    visitAgainAt: "",
    prescribedMedicines: [{ medicineName: "", dosage: "", duration: "" }]
  });

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/prescriptions/medicines');
      if (res.ok) {
        const data = await res.json();
        setMedicines(data.medicines || []);
      }
    } catch (err) {
      console.error('Error fetching medicines:', err);
    }
  };

  const handleAddMedicine = () => {
    setFormData({
      ...formData,
      prescribedMedicines: [...formData.prescribedMedicines, { medicineName: "", dosage: "", duration: "" }]
    });
  };

  const handleRemoveMedicine = (index) => {
    const newMedicines = formData.prescribedMedicines.filter((_, i) => i !== index);
    setFormData({ ...formData, prescribedMedicines: newMedicines });
  };

  const handleMedicineChange = (index, field, value) => {
    const newMedicines = [...formData.prescribedMedicines];
    newMedicines[index][field] = value;
    setFormData({ ...formData, prescribedMedicines: newMedicines });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch('http://localhost:3000/api/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appointmentId: parseInt(appointmentId),
          ...formData,
          medicines: formData.prescribedMedicines.filter(m => m.medicineName)
        })
      });

      const result = await res.json();

      if (res.ok) {
        setMessage("✅ Prescription created successfully!");
        setTimeout(() => {
          navigate('/doctor/dashboard');
        }, 2000);
      } else {
        setMessage("❌ " + (result.message || "Failed to create prescription"));
      }
    } catch (err) {
      console.error('Error creating prescription:', err);
      setMessage("❌ Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="write-prescription-page">
      <div className="prescription-container">
        <div className="prescription-header">
          <h1>Write Prescription</h1>
          <button className="btn-back" onClick={() => navigate('/doctor/dashboard')}>
            ← Back to Dashboard
          </button>
        </div>

        {message && (
          <div className={`prescription-message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="prescription-form">
          <div className="form-section">
            <h3>Patient Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Chief Complaints</label>
                <textarea
                  value={formData.chiefComplaints}
                  onChange={(e) => setFormData({ ...formData, chiefComplaints: e.target.value })}
                  rows="3"
                  placeholder="Patient's main complaints..."
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>History</label>
                <textarea
                  value={formData.history}
                  onChange={(e) => setFormData({ ...formData, history: e.target.value })}
                  rows="3"
                  placeholder="Medical history..."
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Examination & Diagnosis</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Investigations</label>
                <textarea
                  value={formData.investigations}
                  onChange={(e) => setFormData({ ...formData, investigations: e.target.value })}
                  rows="2"
                  placeholder="Physical examination findings..."
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Required Tests</label>
                <textarea
                  value={formData.requiredTests}
                  onChange={(e) => setFormData({ ...formData, requiredTests: e.target.value })}
                  rows="2"
                  placeholder="Lab tests, imaging, etc..."
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Diagnosis</label>
                <textarea
                  value={formData.diagnosis}
                  onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                  rows="2"
                  placeholder="Final diagnosis..."
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="section-header">
              <h3>Prescribed Medicines</h3>
              <button type="button" className="btn-add-medicine" onClick={handleAddMedicine}>
                + Add Medicine
              </button>
            </div>

            {formData.prescribedMedicines.map((med, index) => (
              <div key={index} className="medicine-row">
                <div className="medicine-fields">
                  <div className="form-group">
                    <label>Medicine Name</label>
                    <input
                      type="text"
                      value={med.medicineName}
                      onChange={(e) => handleMedicineChange(index, 'medicineName', e.target.value)}
                      placeholder="Enter medicine name"
                      list={`medicines-list-${index}`}
                    />
                    <datalist id={`medicines-list-${index}`}>
                      {medicines.map((m) => (
                        <option key={m.id} value={m.medicineName} />
                      ))}
                    </datalist>
                  </div>
                  <div className="form-group">
                    <label>Dosage</label>
                    <input
                      type="text"
                      value={med.dosage}
                      onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                      placeholder="e.g., 1 tablet"
                    />
                  </div>
                  <div className="form-group">
                    <label>Duration</label>
                    <input
                      type="text"
                      value={med.duration}
                      onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                      placeholder="e.g., 7 days"
                    />
                  </div>
                </div>
                {formData.prescribedMedicines.length > 1 && (
                  <button
                    type="button"
                    className="btn-remove-medicine"
                    onClick={() => handleRemoveMedicine(index)}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="form-section">
            <h3>Additional Instructions</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Instructions</label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  rows="3"
                  placeholder="Diet, lifestyle advice, precautions..."
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Next Visit Date (Optional)</label>
                <input
                  type="date"
                  value={formData.visitAgainAt}
                  onChange={(e) => setFormData({ ...formData, visitAgainAt: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate('/doctor/dashboard')}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Creating Prescription...' : 'Create Prescription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
