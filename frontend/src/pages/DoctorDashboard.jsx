import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/DoctorDashboard.css";
import DoctorAvatar from "../components/DoctorAvatar";
import { getAuthHeaders } from "../utils/api";

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState('appointments');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [doctorProfile, setDoctorProfile] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [todayCount, setTodayCount] = useState(0);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [filter, setFilter] = useState('all'); // all, today, upcoming, completed, cancelled
  const [specializations, setSpecializations] = useState([]);
  const [scheduleLoaded, setScheduleLoaded] = useState(false);
  const [totalSlots, setTotalSlots] = useState(0);
  
  // Prescription modal states
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState(null);
  const [loadingPrescription, setLoadingPrescription] = useState(false);
  
  // Edit profile form state
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    gender: '',
    degrees: '',
    experienceYears: '',
    fees: '',
    specializationId: '',
    license: ''
  });
  
  const [schedule, setSchedule] = useState({
    Sunday: { selected: false, startTime: '09:00', endTime: '17:00', interval: 30 },
    Monday: { selected: false, startTime: '09:00', endTime: '17:00', interval: 30 },
    Tuesday: { selected: false, startTime: '09:00', endTime: '17:00', interval: 30 },
    Wednesday: { selected: false, startTime: '09:00', endTime: '17:00', interval: 30 },
    Thursday: { selected: false, startTime: '09:00', endTime: '17:00', interval: 30 },
    Friday: { selected: false, startTime: '09:00', endTime: '17:00', interval: 30 },
    Saturday: { selected: false, startTime: '09:00', endTime: '17:00', interval: 30 }
  });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userData.token || userData.role?.toUpperCase() !== 'DOCTOR') {
      navigate('/login');
      return;
    }
    setUser(userData);
    fetchDoctorProfile(userData.email);
    fetchAppointments(userData.email);
    fetchTodayCount(userData.email);
    fetchSpecializations();
    fetchDoctorSchedule(userData.email);
  }, [navigate]);

  const fetchDoctorSchedule = async (email) => {
    try {
      const res = await fetch(`http://localhost:3000/api/doctor/schedule/${email}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.schedule) {
          setSchedule(data.schedule);
          setScheduleLoaded(true);
          setTotalSlots(data.totalSlots || 0);
        }
      } else {
        setScheduleLoaded(false);
        setTotalSlots(0);
      }
    } catch (err) {
      setScheduleLoaded(false);
      setTotalSlots(0);
    }
  };

  const fetchDoctorProfile = async (email) => {
    try {
      const res = await fetch(`http://localhost:3000/api/doctor/profile/${email}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setDoctorProfile(data);
        
        // Fetch total appointments using SQL function
        if (data.doctorId) {
          fetchTotalAppointments(data.doctorId);
        }
        
        // Populate edit form with current data
        setEditForm({
          name: data.name || '',
          phone: data.phone || '',
          gender: data.gender || '',
          degrees: data.degrees || '',
          experienceYears: data.experienceYears || '',
          fees: data.fees || '',
          specializationId: data.specializationId || '',
          license: data.license && data.license !== 'Not provided' ? data.license : ''
        });
        
        // Check if license exists - redirect to verification if not
        if (!data.license || data.license === 'Not provided') {
          navigate('/doctor/license-verification');
        }
      }
    } catch (err) {
      // Error fetching profile
    }
  };

  // const fetchSpecializations = async () => {
  //   try {
  //     const res = await fetch('http://localhost:3000/api/specialties');
  //     if (res.ok) {
  //       const data = await res.json();
  //       setSpecializations(data);
  //     }
  //   } catch (err) {
  //     // Error fetching specializations
  //   }
  // };
const fetchSpecializations = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/specialties');
    if (res.ok) {
      const data = await res.json();
      // Map to format expected by dropdown: {ID, NAME}
      const mapped = (data.specialties || []).map(spec => ({
        ID: spec.id,
        NAME: spec.name
      }));
      setSpecializations(mapped);
    }
  } catch (err) {
    console.error('Error fetching specializations:', err);
  }
};
  const fetchAppointments = async (email) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/doctor/appointments/${email}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments || []);
      }
    } catch (err) {
      // Error fetching appointments
    } finally {
      setLoading(false);
    }
  };

  const handleViewPrescription = async (prescriptionId) => {
    setLoadingPrescription(true);
    setShowPrescriptionModal(true);
    setPrescriptionData(null);

    try {
      const res = await fetch(`http://localhost:3000/api/prescriptions/${prescriptionId}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.prescription) {
          setPrescriptionData(data.prescription);
        } else {
          setPrescriptionData({ error: 'Invalid prescription data format' });
        }
      } else {
        const errorData = await res.json();
        setPrescriptionData({ error: errorData.message || 'Failed to load prescription' });
      }
    } catch (err) {
      setPrescriptionData({ error: 'Network error loading prescription' });
    } finally {
      setLoadingPrescription(false);
    }
  };
const handleCompleteAppointment = async (appointmentId) => {
  if (!window.confirm('Mark this appointment as completed?')) return;

  setLoading(true);
  try {
    const res = await fetch(
      `http://localhost:3000/api/doctor/appointments/${appointmentId}/complete`,
      { 
        method: 'PUT',
        headers: getAuthHeaders()
      }
    );
    const data = await res.json();

    if (res.ok) {
      setMessage('Appointment marked as completed');
      fetchAppointments(user.email);   // refresh the list
      fetchTodayCount(user.email);     // refresh the badge count
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage(data.error || 'Failed to complete appointment');
    }
  } catch (err) {
    setMessage('Server error');
  } finally {
    setLoading(false);
  }
};
  const fetchTodayCount = async (email) => {
    try {
      const res = await fetch(`http://localhost:3000/api/doctor/appointments/${email}/today-count`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setTodayCount(data.totalPatients || 0);
      }
    } catch (err) {
      // Error fetching today count
    }
  };

  const fetchTotalAppointments = async (doctorId) => {
    console.log('🔍 fetchTotalAppointments called with doctorId:', doctorId);
    try {
      const url = `http://localhost:3000/api/doctor/appointment-count/${doctorId}`;
      console.log('📡 Fetching from:', url);
      
      const res = await fetch(url, {
        headers: getAuthHeaders()
      });
      console.log('📥 Response status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Response data:', data);
        setTotalAppointments(data.appointmentCount || 0);
      } else {
        console.error('❌ Response not OK:', res.status, res.statusText);
      }
    } catch (err) {
      console.error('❌ Error fetching total appointments:', err);
    }
  };

  const handleScheduleChange = (day, field, value) => {
    setSchedule({
      ...schedule,
      [day]: {
        ...schedule[day],
        [field]: value
      }
    });
  };

  const handleSaveAvailability = async () => {
    setLoading(true);
    setMessage('');

    try {
      // Use PUT for update (since we're replacing existing schedule)
      const res = await fetch('http://localhost:3000/api/doctor/update-schedule', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          email: user.email,
          schedule
        })
      });

      const result = await res.json();

      if (res.ok) {
        setMessage(result.message);
        // Refresh schedule from database
        await fetchDoctorSchedule(user.email);
        setTimeout(() => setMessage(''), 5000);
      } else {
        setMessage((result.error || 'Failed to save availability'));
      }
    } catch (err) {
      setMessage('❌ Server error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const getFilteredAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sort by nearest first
    const sorted = [...appointments].sort((a, b) => {
      return new Date(a.appointmentDate) - new Date(b.appointmentDate);
    });

    switch (filter) {
      case 'today':
        return sorted.filter(apt => {
          const aptDate = new Date(apt.appointmentDate);
          aptDate.setHours(0, 0, 0, 0);
          return aptDate.getTime() === today.getTime() && apt.status === 'BOOKED';
        });
      case 'upcoming':
        return sorted.filter(apt => {
          const aptDate = new Date(apt.appointmentDate);
          aptDate.setHours(0, 0, 0, 0);
          return apt.status === 'BOOKED' && aptDate > today;
        });
      case 'completed':
        return sorted.filter(apt => apt.status === 'COMPLETED');
      case 'cancelled':
        return sorted.filter(apt => apt.status === 'CANCELLED');
      default:
        return sorted;
    }
  };

  const filteredAppointments = getFilteredAppointments();

  // Count appointments by category
  const appointmentCounts = {
    all: appointments.length,
    today: appointments.filter(apt => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const aptDate = new Date(apt.appointmentDate);
      aptDate.setHours(0, 0, 0, 0);
      return aptDate.getTime() === today.getTime() && apt.status === 'BOOKED';
    }).length,
    upcoming: appointments.filter(apt => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const aptDate = new Date(apt.appointmentDate);
      aptDate.setHours(0, 0, 0, 0);
      return apt.status === 'BOOKED' && aptDate > today;
    }).length,
    completed: appointments.filter(apt => apt.status === 'COMPLETED').length,
    cancelled: appointments.filter(apt => apt.status === 'CANCELLED').length
  };

  // Prescription Modal Component
  const PrescriptionModal = ({ show, onClose, prescription, loading }) => {
    if (!show) return null;
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, color: '#1f2937' }}>📄 Prescription Details</h2>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#6b7280'
              }}
            >
              ✕
            </button>
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Loading prescription...</p>
            </div>
          ) : prescription?.error ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>
              <p>{prescription.error}</p>
            </div>
          ) : prescription ? (
            <div>
              {/* Prescription content - same as PatientDashboard */}
              <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>Doctor</p>
                    <p style={{ margin: 0, fontWeight: '600', color: '#1f2937' }}>{prescription.doctorName || 'N/A'}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>Date Issued</p>
                    <p style={{ margin: 0, fontWeight: '600', color: '#1f2937' }}>
                      {prescription.dateIssued ? new Date(prescription.dateIssued).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {prescription.chiefComplaints && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#1f2937' }}>Chief Complaints</h3>
                  <p style={{ margin: 0, padding: '0.75rem', background: '#fef3c7', borderRadius: '6px', color: '#92400e' }}>
                    {prescription.chiefComplaints}
                  </p>
                </div>
              )}

              {prescription.diagnosis && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#1f2937' }}>Diagnosis</h3>
                  <p style={{ margin: 0, padding: '0.75rem', background: '#dbeafe', borderRadius: '6px', color: '#1e40af' }}>
                    {prescription.diagnosis}
                  </p>
                </div>
              )}

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', color: '#1f2937' }}>Prescribed Medicines</h3>
                {prescription.medicines && prescription.medicines.length > 0 ? (
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {prescription.medicines.map((med, index) => (
                      <div key={index} style={{
                        padding: '1rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        background: '#f9fafb'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: '600', color: '#1f2937', display: 'block' }}>{med.medicineName}</span>
                            {med.manufacturer && (
                              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>by {med.manufacturer}</span>
                            )}
                          </div>
                          {med.dosage && (
                            <span style={{ 
                              background: '#dbeafe', 
                              color: '#1e40af', 
                              padding: '0.25rem 0.75rem', 
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              whiteSpace: 'nowrap',
                              marginLeft: '0.5rem'
                            }}>
                              {med.dosage}
                            </span>
                          )}
                        </div>
                        {med.duration && (
                          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                            Duration: {med.duration}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No medicines prescribed</p>
                )}
              </div>

              {prescription.instructions && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#1f2937' }}>Instructions</h3>
                  <p style={{ margin: 0, padding: '0.75rem', background: '#dcfce7', borderRadius: '6px', color: '#166534', fontSize: '0.875rem' }}>
                    {prescription.instructions}
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="doctor-dashboard-new">
      <PrescriptionModal
        show={showPrescriptionModal}
        onClose={() => setShowPrescriptionModal(false)}
        prescription={prescriptionData}
        loading={loadingPrescription}
      />
      {/* Header */}
      <header className="doctor-header">
        <div className="doctor-logo" onClick={() => navigate('/')}>
          <span className="doctor-logo-icon">🏥</span>
          <span className="logo-text">DOCAPPOINTER</span>
        </div>
        
        <div className="doctor-profile-dropdown">
          <div className="doctor-profile-icon" onClick={() => setShowProfileMenu(!showProfileMenu)}>
            <span className="doctor-user-avatar">
              <DoctorAvatar gender={doctorProfile.gender} size={40} />
            </span>
            <span className="doctor-user-name-header">{user?.name}</span>
            <span className="doctor-dropdown-arrow">▼</span>
          </div>
          
          {showProfileMenu && (
            <div className="doctor-profile-menu">
              <div className="doctor-profile-menu-item" onClick={() => { setActiveView('profile'); setShowProfileMenu(false); }}>
                <span>👤</span> View Profile
              </div>
              <div className="doctor-profile-menu-item" onClick={() => { setActiveView('editProfile'); setShowProfileMenu(false); }}>
                <span>✏️</span> Edit Profile
              </div>
              <div className="doctor-profile-menu-item" onClick={handleLogout}>
                <span>🚪</span> Logout
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="doctor-dashboard-body">
        {/* Sidebar */}
        <aside className="doctor-sidebar">
          <nav className="doctor-sidebar-nav">
            <div 
              className={`doctor-sidebar-item ${activeView === 'appointments' ? 'active' : ''}`}
              onClick={() => setActiveView('appointments')}
            >
              <span className="doctor-sidebar-icon">🩺</span>
              <span>My Appointments</span>
            </div>
            <div 
              className={`doctor-sidebar-item ${activeView === 'availability' ? 'active' : ''}`}
              onClick={() => setActiveView('availability')}
            >
              <span className="doctor-sidebar-icon">📅</span>
              <span>Availability Schedule</span>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="doctor-main">
          {message && <div className={`doctor-message ${message.includes('successfully') || message.includes('completed') ? 'success' : 'error'}`}>{message}</div>}

          {/* Appointments View */}
          {activeView === 'appointments' && (
            <div className="doctor-appointments-view">
              <div className="appointments-header">
                <h1>My Appointments</h1>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div className="today-count-badge">
                    📊 Today's Patients: <strong>{todayCount}</strong>
                  </div>
                  <div className="today-count-badge" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    📈 Total Appointments: <strong>{totalAppointments}</strong>
                  </div>
                </div>
              </div>

              <div className="appointments-filters" style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
                borderBottom: '2px solid #e5e7eb',
                paddingBottom: '0.5rem'
              }}>
                {[
                  { key: 'all', label: 'All', icon: '📋', color: '#6b7280' },
                  { key: 'today', label: 'Today', icon: '📅', color: '#f59e0b' },
                  { key: 'upcoming', label: 'Upcoming', icon: '🔜', color: '#3b82f6' },
                  { key: 'completed', label: 'Completed', icon: '✅', color: '#10b981' },
                  { key: 'cancelled', label: 'Cancelled', icon: '❌', color: '#ef4444' }
                ].map(filterOption => (
                  <button
                    key={filterOption.key}
                    onClick={() => setFilter(filterOption.key)}
                    style={{
                      padding: '0.75rem 1.25rem',
                      border: filter === filterOption.key ? `2px solid ${filterOption.color}` : '2px solid transparent',
                      background: filter === filterOption.key ? `${filterOption.color}15` : 'white',
                      color: filter === filterOption.key ? filterOption.color : '#6b7280',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: filter === filterOption.key ? '600' : '500',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                    onMouseOver={(e) => {
                      if (filter !== filterOption.key) {
                        e.currentTarget.style.background = '#f3f4f6';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (filter !== filterOption.key) {
                        e.currentTarget.style.background = 'white';
                      }
                    }}
                  >
                    <span>{filterOption.icon}</span>
                    <span>{filterOption.label}</span>
                    <span style={{
                      background: filter === filterOption.key ? filterOption.color : '#e5e7eb',
                      color: filter === filterOption.key ? 'white' : '#6b7280',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {appointmentCounts[filterOption.key]}
                    </span>
                  </button>
                ))}
              </div>
              
              {loading ? (
                <div className="doctor-loading">Loading appointments...</div>
              ) : filteredAppointments.length === 0 ? (
                <div className="doctor-no-data">
                  <p>No {filter !== 'all' ? filter : ''} appointments found</p>
                </div>
              ) : (
                <div className="doctor-appointments-list">
                  {filteredAppointments.map((apt) => (
                    <div key={apt.appointmentId} className="doctor-appointment-card">
                      <div className="doctor-apt-header">
                        <div>
                          <h3>{apt.patientName}</h3>
                          <p className="apt-email">{apt.patientEmail}</p>
                        </div>
                        <span className={`doctor-apt-status ${apt.status?.toLowerCase()}`}>
                          {apt.status}
                        </span>
                      </div>
                      <div className="doctor-apt-details">
                        <p><strong>Date:</strong> {new Date(apt.appointmentDate).toLocaleDateString()}</p>
                        <p><strong>Time:</strong> {apt.startTime} - {apt.endTime}</p>
                        <p><strong>Phone:</strong> {apt.patientPhone || 'N/A'}</p>
                      </div>
                      <div className="apt-actions">

  {/* No prescription yet → show Write button */}
  {apt.status === 'BOOKED' && !apt.hasPrescription && (
    <button
      className="btn-write-prescription"
      onClick={() => navigate(`/doctor/prescription/${apt.appointmentId}`)}
    >
      ✍️ Write Prescription
    </button>
  )}

  {/* Prescription exists → one line */}
  {apt.hasPrescription && (
    <div style={{
      marginTop: '0.75rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.6rem 0.75rem',
      border: '1.5px solid #bbf7d0',
      borderRadius: '10px',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
    }}>

      {/* Badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.3rem',
        background: 'linear-gradient(90deg, #16a34a, #15803d)',
        color: 'white',
        padding: '0.4rem 0.65rem',
        borderRadius: '7px',
        fontSize: '0.75rem',
        fontWeight: '700',
        whiteSpace: 'nowrap',
        flex: '0 0 auto'
      }}>
        ✅ Prescribed
      </div>

      {/* View button */}
      <button
        onClick={() => handleViewPrescription(apt.prescriptionId)}
        style={{
          flex: 1,
          padding: '0.4rem 0.5rem',
          background: 'white',
          color: '#15803d',
          border: '1.5px solid #16a34a',
          borderRadius: '7px',
          cursor: 'pointer',
          fontSize: '0.75rem',
          fontWeight: '600',
          whiteSpace: 'nowrap'
        }}
        onMouseOver={e => e.currentTarget.style.background = '#f0fdf4'}
        onMouseOut={e => e.currentTarget.style.background = 'white'}
      >
        📄 View
      </button>

      {/* Complete button */}
      {apt.status === 'BOOKED' && (
        <button
          onClick={() => handleCompleteAppointment(apt.appointmentId)}
          disabled={loading}
          style={{
            flex: 1,
            padding: '0.4rem 0.5rem',
            background: loading ? '#d1d5db' : 'linear-gradient(90deg, #16a34a, #15803d)',
            color: 'white',
            border: 'none',
            borderRadius: '7px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '0.75rem',
            fontWeight: '600',
            whiteSpace: 'nowrap'
          }}
          onMouseOver={e => { if (!loading) e.currentTarget.style.opacity = '0.88'; }}
          onMouseOut={e => { if (!loading) e.currentTarget.style.opacity = '1'; }}
        >
          {loading ? '⏳ Wait...' : '✔️ Complete'}
        </button>
      )}

    </div>
  )}

</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          )}

          {/* Availability View */}
          {activeView === 'availability' && (
            <div className="availability-view">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h1 style={{ margin: 0 }}>Availability Schedule</h1>
                {scheduleLoaded && totalSlots > 0 && (
                  <div style={{
                    padding: '0.5rem 1rem',
                    background: '#eff6ff',
                    border: '1px solid #3b82f6',
                    borderRadius: '6px',
                    color: '#1e40af',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}>
                    {totalSlots} slots available
                  </div>
                )}
              </div>
              
              {!scheduleLoaded && (
                <div style={{
                  padding: '0.75rem 1rem',
                  background: '#fef3c7',
                  border: '1px solid #f59e0b',
                  borderRadius: '6px',
                  marginBottom: '1rem',
                  color: '#92400e',
                  fontSize: '0.9rem'
                }}>
                  No schedule found. Set your availability below and click Save.
                </div>
              )}
              
              <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                Set your working hours for each day. Appointment slots will be generated based on your interval.
              </p>
              
              <div className="availability-form">
                {DAYS.map((day) => (
                  <div key={day} className={`day-schedule ${schedule[day].selected ? 'active' : ''}`}>
                    <div className="day-header">
                      <input
                        type="checkbox"
                        className="day-checkbox"
                        checked={schedule[day].selected}
                        onChange={(e) => handleScheduleChange(day, 'selected', e.target.checked)}
                      />
                      <span className="day-name">{day}</span>
                    </div>
                    
                    {schedule[day].selected && (
                      <div className="time-inputs">
                        <div className="time-input-group">
                          <label>Start Time</label>
                          <input
                            type="time"
                            value={schedule[day].startTime}
                            onChange={(e) => handleScheduleChange(day, 'startTime', e.target.value)}
                          />
                        </div>
                        <div className="time-input-group">
                          <label>End Time</label>
                          <input
                            type="time"
                            value={schedule[day].endTime}
                            onChange={(e) => handleScheduleChange(day, 'endTime', e.target.value)}
                          />
                        </div>
                        <div className="time-input-group">
                          <label>Interval (minutes)</label>
                          <select
                            value={schedule[day].interval}
                            onChange={(e) => handleScheduleChange(day, 'interval', parseInt(e.target.value))}
                          >
                            <option value="15">15 minutes</option>
                            <option value="20">20 minutes</option>
                            <option value="25">25 minutes</option>
                            <option value="30">30 minutes</option>
                            <option value="45">45 minutes</option>
                            <option value="60">60 minutes</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                <button 
                  className="save-availability-btn"
                  onClick={handleSaveAvailability}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Availability'}
                </button>
              </div>
            </div>
          )}

          {/* Profile View */}
          {activeView === 'profile' && (
            <div className="doctor-profile-view">
              <h1>My Profile</h1>
              
              <div className="doctor-profile-display">
                <div className="doctor-profile-avatar-large">
                  <DoctorAvatar gender={doctorProfile.gender} size={120} />
                </div>
                <div className="doctor-profile-info">
                  <div className="doctor-info-row">
                    <label>Name:</label>
                    <span>{doctorProfile.name || user?.name || 'Not provided'}</span>
                  </div>
                  <div className="doctor-info-row">
                    <label>Email:</label>
                    <span>{doctorProfile.email || user?.email || 'Not provided'}</span>
                  </div>
                  <div className="doctor-info-row">
                    <label>Phone:</label>
                    <span>{doctorProfile.phone || user?.phone || 'Not provided'}</span>
                  </div>
                  <div className="doctor-info-row">
                    <label>Gender:</label>
                    <span>{doctorProfile.gender || 'Not provided'}</span>
                  </div>
                  <div className="doctor-info-row">
                    <label>License Number:</label>
                    <span style={{ fontFamily: 'Courier New, monospace', letterSpacing: '1px', fontWeight: '600', color: '#2563eb' }}>
                      {doctorProfile.license && doctorProfile.license !== 'Not provided' ? doctorProfile.license : 'Not provided'}
                    </span>
                  </div>
                  <div className="doctor-info-row">
                    <label>Specialization:</label>
                    <span>{doctorProfile.specialization || 'Not provided'}</span>
                  </div>
                  <div className="doctor-info-row">
                    <label>Degrees:</label>
                    <span>{doctorProfile.degrees || 'Not provided'}</span>
                  </div>
                  <div className="doctor-info-row">
                    <label>Experience:</label>
                    <span>{doctorProfile.experienceYears ? `${doctorProfile.experienceYears} years` : 'Not provided'}</span>
                  </div>
                  <div className="doctor-info-row">
                    <label>Consultation Fee:</label>
                    <span>{doctorProfile.fees ? `৳${doctorProfile.fees}` : 'Not set'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit Profile View */}
          {activeView === 'editProfile' && (
            <div className="doctor-profile-view">
              <h1>Edit Profile</h1>
              
              <div className="doctor-edit-form">
                <div className="edit-section">
                  <h3>Update Profile Information</h3>
                  <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
                    Update your professional details and qualifications
                  </p>
                  
                  <div className="auth-input-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Full Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      placeholder="Enter your full name"
                      className="auth-input"
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px' }}
                    />
                  </div>

                  <div className="auth-input-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Phone Number</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      placeholder="Enter phone number"
                      maxLength="11"
                      className="auth-input"
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px' }}
                    />
                  </div>

                  <div className="auth-input-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Gender</label>
                    <select
                      value={editForm.gender}
                      onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                      className="auth-input"
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px' }}
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  <div className="auth-input-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>License Number</label>
                    <input
                      type="text"
                      value={editForm.license}
                      onChange={(e) => setEditForm({...editForm, license: e.target.value.toUpperCase()})}
                      placeholder="e.g., BM12345"
                      maxLength="20"
                      className="auth-input"
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        border: '1px solid #d1d5db', 
                        borderRadius: '8px',
                        fontFamily: 'Courier New, monospace',
                        letterSpacing: '1px'
                      }}
                    />
                    <small style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                      5-20 characters, letters and numbers only
                    </small>
                  </div>

                  <div className="auth-input-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Specialization</label>
                    <select
                      value={editForm.specializationId}
                      onChange={(e) => setEditForm({...editForm, specializationId: e.target.value})}
                      className="auth-input"
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px' }}
                    >
                      <option value="" disabled>Select specialization</option>
                      {Array.isArray(specializations) && specializations.map(spec => (
                        <option key={spec.ID} value={spec.ID}>{spec.NAME}</option>
                      ))}
                    </select>
                  </div>

                  <div className="auth-input-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Degrees</label>
                    <input
                      type="text"
                      value={editForm.degrees}
                      onChange={(e) => setEditForm({...editForm, degrees: e.target.value})}
                      placeholder="e.g., MBBS, MD, PhD"
                      className="auth-input"
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px' }}
                    />
                  </div>

                  <div className="auth-input-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Experience (Years)</label>
                    <input
                      type="number"
                      min="0"
                      max="70"
                      value={editForm.experienceYears}
                      onChange={(e) => setEditForm({...editForm, experienceYears: e.target.value})}
                      placeholder="e.g., 5"
                      className="auth-input"
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px' }}
                    />
                  </div>

                  <div className="auth-input-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Consultation Fee (৳)</label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.fees}
                      onChange={(e) => setEditForm({...editForm, fees: e.target.value})}
                      placeholder="e.g., 500"
                      className="auth-input"
                      style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px' }}
                    />
                  </div>

                  {message && (
                    <div className={`doctor-message ${message.includes('successfully') ? 'success' : 'error'}`}>
                      {message}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                      className="btn-update-license"
                      onClick={async () => {
                        setLoading(true);
                        setMessage('');
                        
                        // Validate
                        if (!editForm.name || !editForm.phone) {
                          setMessage('Name and phone are required');
                          setLoading(false);
                          return;
                        }
                        
                        if (editForm.phone && !/^\d{11}$/.test(editForm.phone)) {
                          setMessage('Phone must be 11 digits');
                          setLoading(false);
                          return;
                        }

                        // Validate license if provided
                        if (editForm.license) {
                          const trimmedLicense = editForm.license.trim();
                          if (trimmedLicense.length < 5 || trimmedLicense.length > 20) {
                            setMessage('License number must be 5-20 characters');
                            setLoading(false);
                            return;
                          }
                          if (!/^[A-Z0-9]+$/.test(trimmedLicense)) {
                            setMessage('License number can only contain letters and numbers');
                            setLoading(false);
                            return;
                          }
                        }

                        try {
                          // Update user info (name, phone)
                          const userRes = await fetch('http://localhost:3000/api/profile/update', {
                            method: 'PUT',
                            headers: getAuthHeaders(),
                            body: JSON.stringify({
                              email: user.email,
                              name: editForm.name,
                              phone: editForm.phone
                            })
                          });

                          if (!userRes.ok) {
                            const error = await userRes.json();
                            setMessage(error.error || 'Failed to update profile');
                            setLoading(false);
                            return;
                          }

                          // Update doctor-specific info
                          const doctorRes = await fetch('http://localhost:3000/api/doctor/profile/update', {
                            method: 'PUT',
                            headers: getAuthHeaders(),
                            body: JSON.stringify({
                              email: user.email,
                              degrees: editForm.degrees,
                              experienceYears: parseInt(editForm.experienceYears) || 0,
                              fees: parseInt(editForm.fees) || 0,
                              gender: editForm.gender
                            })
                          });

                          if (!doctorRes.ok) {
                            const error = await doctorRes.json();
                            setMessage(error.error || 'Failed to update doctor profile');
                            setLoading(false);
                            return;
                          }

                          // Update specialization if provided
                          if (editForm.specializationId) {
                            const specRes = await fetch('http://localhost:3000/api/doctor/specialization', {
                              method: 'POST',
                              headers: getAuthHeaders(),
                              body: JSON.stringify({
                                email: user.email,
                                specializationId: parseInt(editForm.specializationId)
                              })
                            });

                            if (!specRes.ok) {
                              const error = await specRes.json();
                              setMessage(error.error || 'Failed to update specialization');
                              setLoading(false);
                              return;
                            }
                          }

                          // Update license if provided
                          if (editForm.license && editForm.license.trim()) {
                            const licenseRes = await fetch('http://localhost:3000/api/doctor/license', {
                              method: 'PUT',
                              headers: getAuthHeaders(),
                              body: JSON.stringify({
                                email: user.email,
                                licenseNumber: editForm.license.trim()
                              })
                            });

                            if (!licenseRes.ok) {
                              const error = await licenseRes.json();
                              setMessage(error.error || 'Failed to update license');
                              setLoading(false);
                              return;
                            }
                          }

                          setMessage('Profile updated successfully');
                          
                          // Update localStorage
                          const updatedUser = {...user, name: editForm.name, phone: editForm.phone};
                          localStorage.setItem('user', JSON.stringify(updatedUser));
                          setUser(updatedUser);
                          
                          // Refresh profile
                          await fetchDoctorProfile(user.email);
                          
                          setTimeout(() => {
                            setMessage('');
                            setActiveView('profile');
                          }, 2000);
                        } catch (err) {
                          setMessage('Server error');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                    >
                      {loading ? 'Updating...' : 'Update Profile'}
                    </button>
                    
                    <button 
                      className="btn-update-license"
                      style={{ background: '#6b7280' }}
                      onClick={() => {
                        setActiveView('profile');
                        setMessage('');
                      }}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
