import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Management.css';

export default function DatabaseFeatures() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ doctors: [], branches: [], patients: [] });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [message, setMessage] = useState('');

  // Form states for procedures
  const [appointmentForm, setAppointmentForm] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: '',
    timeSlotId: '',
    appointmentType: 'consultation'
  });

  const [billForm, setBillForm] = useState({
    appointmentId: '',
    consultationFee: ''
  });

  const [stockForm, setStockForm] = useState({
    medicationId: '',
    quantity: ''
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      const res = await fetch('http://localhost:3000/api/admin/db-features/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        setMessage('Failed to fetch statistics');
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setMessage('Error loading statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      const res = await fetch('http://localhost:3000/api/admin/db-features/book-appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(appointmentForm)
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`✅ ${data.message} (ID: ${data.appointmentId})`);
        setAppointmentForm({
          patientId: '',
          doctorId: '',
          appointmentDate: '',
          timeSlotId: '',
          appointmentType: 'consultation'
        });
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (err) {
      console.error('Error booking appointment:', err);
      setMessage('❌ Server error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBill = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      const res = await fetch('http://localhost:3000/api/admin/db-features/generate-bill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(billForm)
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`✅ ${data.message} (Bill ID: ${data.billId})`);
        setBillForm({ appointmentId: '', consultationFee: '' });
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (err) {
      console.error('Error generating bill:', err);
      setMessage('❌ Server error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      const res = await fetch('http://localhost:3000/api/admin/db-features/update-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(stockForm)
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`✅ ${data.message}`);
        setStockForm({ medicationId: '', quantity: '' });
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (err) {
      console.error('Error updating stock:', err);
      setMessage('❌ Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="management-container">
      <header className="management-header">
        <h1>🔧 Database Features Demo</h1>
        <button onClick={() => navigate('/admin/dashboard')} className="back-btn">
          ← Back to Dashboard
        </button>
      </header>

      <div className="header-actions" style={{ padding: '20px 30px', background: 'white', borderBottom: '1px solid #ddd' }}>
        <button 
          className={activeTab === 'overview' ? 'active' : ''} 
          onClick={() => setActiveTab('overview')}
        >
          📊 Functions Overview
        </button>
        <button 
          className={activeTab === 'procedures' ? 'active' : ''} 
          onClick={() => setActiveTab('procedures')}
        >
          ⚙️ Procedures
        </button>
        <button 
          className={activeTab === 'triggers' ? 'active' : ''} 
          onClick={() => setActiveTab('triggers')}
        >
          ⚡ Triggers Info
        </button>
      </div>

      {message && (
        <div style={{ padding: '15px 30px' }}>
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        </div>
      )}

      <div className="list-view">
        {activeTab === 'overview' && (
          <div>
            <h2>Database Functions in Action</h2>
            <p style={{ color: '#666', marginBottom: '30px' }}>
              These statistics are calculated using Oracle database functions
            </p>

            {loading ? (
              <div className="loading">Loading statistics...</div>
            ) : (
              <>
                {/* Doctors with Appointment Count */}
                <div style={{ marginBottom: '40px' }}>
                  <h3>🩺 Top Doctors by Appointments (fn_get_doctor_appointment_count)</h3>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Doctor ID</th>
                          <th>Doctor Name</th>
                          <th>Total Appointments</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.doctors.length > 0 ? (
                          stats.doctors.map((doc) => (
                            <tr key={doc.doctorId}>
                              <td>{doc.doctorId}</td>
                              <td>{doc.doctorName}</td>
                              <td><strong>{doc.appointmentCount}</strong></td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="3">No data available</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Branches with Bed Occupancy */}
                <div style={{ marginBottom: '40px' }}>
                  <h3>🏥 Branch Bed Occupancy Rates (fn_calculate_bed_occupancy)</h3>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Branch ID</th>
                          <th>Branch Name</th>
                          <th>Occupancy Rate (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.branches.length > 0 ? (
                          stats.branches.map((branch) => (
                            <tr key={branch.branchId}>
                              <td>{branch.branchId}</td>
                              <td>{branch.branchName}</td>
                              <td>
                                <strong style={{ 
                                  color: branch.occupancyRate > 80 ? '#e74c3c' : 
                                         branch.occupancyRate > 50 ? '#f39c12' : '#27ae60' 
                                }}>
                                  {branch.occupancyRate}%
                                </strong>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="3">No data available</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Patients with Total Expenses */}
                <div style={{ marginBottom: '40px' }}>
                  <h3>💰 Top Patients by Medical Expenses (fn_get_patient_total_expenses)</h3>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Patient ID</th>
                          <th>Patient Name</th>
                          <th>Total Expenses</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.patients.length > 0 ? (
                          stats.patients.map((patient) => (
                            <tr key={patient.patientId}>
                              <td>{patient.patientId}</td>
                              <td>{patient.patientName}</td>
                              <td><strong>${patient.totalExpenses}</strong></td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="3">No data available</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'procedures' && (
          <div>
            <h2>Database Stored Procedures</h2>
            <p style={{ color: '#666', marginBottom: '30px' }}>
              Test the stored procedures with validation and transaction control
            </p>

            {/* Book Appointment Procedure */}
            <div style={{ marginBottom: '40px', background: 'white', padding: '25px', borderRadius: '8px' }}>
              <h3>📅 Book Appointment (sp_book_appointment)</h3>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
                Books appointment with validation: checks time slot availability, doctor assignment, and prevents duplicates
              </p>
              <form onSubmit={handleBookAppointment}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label>Patient ID *</label>
                    <input
                      type="number"
                      value={appointmentForm.patientId}
                      onChange={(e) => setAppointmentForm({...appointmentForm, patientId: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Doctor ID *</label>
                    <input
                      type="number"
                      value={appointmentForm.doctorId}
                      onChange={(e) => setAppointmentForm({...appointmentForm, doctorId: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Appointment Date *</label>
                    <input
                      type="date"
                      value={appointmentForm.appointmentDate}
                      onChange={(e) => setAppointmentForm({...appointmentForm, appointmentDate: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Time Slot ID *</label>
                    <input
                      type="number"
                      value={appointmentForm.timeSlotId}
                      onChange={(e) => setAppointmentForm({...appointmentForm, timeSlotId: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Appointment Type *</label>
                    <select
                      value={appointmentForm.appointmentType}
                      onChange={(e) => setAppointmentForm({...appointmentForm, appointmentType: e.target.value})}
                    >
                      <option value="consultation">Consultation</option>
                      <option value="follow-up">Follow-up</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="submit-btn" disabled={loading} style={{ marginTop: '15px' }}>
                  {loading ? 'Booking...' : 'Book Appointment'}
                </button>
              </form>
            </div>

            {/* Generate Bill Procedure */}
            <div style={{ marginBottom: '40px', background: 'white', padding: '25px', borderRadius: '8px' }}>
              <h3>💵 Generate Bill (sp_generate_bill)</h3>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
                Generates comprehensive bill including consultation fee, medicine costs, and lab test charges
              </p>
              <form onSubmit={handleGenerateBill}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label>Appointment ID *</label>
                    <input
                      type="number"
                      value={billForm.appointmentId}
                      onChange={(e) => setBillForm({...billForm, appointmentId: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Consultation Fee *</label>
                    <input
                      type="number"
                      value={billForm.consultationFee}
                      onChange={(e) => setBillForm({...billForm, consultationFee: e.target.value})}
                      required
                      placeholder="e.g., 500"
                    />
                  </div>
                </div>
                <button type="submit" className="submit-btn" disabled={loading} style={{ marginTop: '15px' }}>
                  {loading ? 'Generating...' : 'Generate Bill'}
                </button>
              </form>
            </div>

            {/* Update Stock Procedure */}
            <div style={{ marginBottom: '40px', background: 'white', padding: '25px', borderRadius: '8px' }}>
              <h3>💊 Update Medicine Stock (sp_update_medicine_stock)</h3>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
                Updates medicine stock with validation to prevent negative inventory
              </p>
              <form onSubmit={handleUpdateStock}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div className="form-group">
                    <label>Medicine ID *</label>
                    <input
                      type="number"
                      value={stockForm.medicationId}
                      onChange={(e) => setStockForm({...stockForm, medicationId: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Quantity to Deduct *</label>
                    <input
                      type="number"
                      value={stockForm.quantity}
                      onChange={(e) => setStockForm({...stockForm, quantity: e.target.value})}
                      required
                      placeholder="e.g., 10"
                    />
                  </div>
                </div>
                <button type="submit" className="submit-btn" disabled={loading} style={{ marginTop: '15px' }}>
                  {loading ? 'Updating...' : 'Update Stock'}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'triggers' && (
          <div>
            <h2>Database Triggers</h2>
            <p style={{ color: '#666', marginBottom: '30px' }}>
              Automatic triggers that execute on database events
            </p>

            <div style={{ display: 'grid', gap: '20px' }}>
              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #3498db' }}>
                <h3>⏰ Auto-Update Timestamps</h3>
                <p><strong>Triggers:</strong> trg_update_medicines_timestamp, trg_update_labtests_timestamp, trg_update_beds_timestamp</p>
                <p><strong>Event:</strong> BEFORE UPDATE</p>
                <p><strong>Action:</strong> Automatically sets UPDATED_AT to current timestamp when records are modified</p>
                <p style={{ color: '#666', fontSize: '14px' }}>
                  ✅ Active on: MEDICINES, LAB_TESTS, HOSPITAL_BEDS tables
                </p>
              </div>

              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #e74c3c' }}>
                <h3>🛏️ Validate Bed Booking</h3>
                <p><strong>Trigger:</strong> trg_validate_bed_booking</p>
                <p><strong>Event:</strong> BEFORE INSERT on BED_BOOKING_APPOINTMENTS</p>
                <p><strong>Action:</strong> Validates bed is available before allowing booking</p>
                <p style={{ color: '#666', fontSize: '14px' }}>
                  ✅ Prevents double-booking of beds
                </p>
              </div>

              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #27ae60' }}>
                <h3>🔄 Auto-Update Bed Status</h3>
                <p><strong>Trigger:</strong> trg_update_bed_status_on_booking</p>
                <p><strong>Event:</strong> AFTER INSERT on BED_BOOKING_APPOINTMENTS</p>
                <p><strong>Action:</strong> Automatically marks bed as 'occupied' when booked</p>
                <p style={{ color: '#666', fontSize: '14px' }}>
                  ✅ Keeps bed status synchronized with bookings
                </p>
              </div>

              <div style={{ background: 'white', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #f39c12' }}>
                <h3>💊 Validate Medicine Stock</h3>
                <p><strong>Trigger:</strong> trg_validate_medicine_stock</p>
                <p><strong>Event:</strong> BEFORE INSERT on PRESCRIBED_MED</p>
                <p><strong>Action:</strong> Prevents prescribing out-of-stock medicines</p>
                <p style={{ color: '#666', fontSize: '14px' }}>
                  ✅ Ensures medicines are available before prescription
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
