import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/DoctorDashboard.css";

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
  const [filter, setFilter] = useState('all'); // all, upcoming, completed, cancelled
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseError, setLicenseError] = useState('');
  
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
  }, [navigate]);

  const fetchDoctorProfile = async (email) => {
    try {
      const res = await fetch(`http://localhost:3000/api/doctor/profile/${email}`);
      if (res.ok) {
        const data = await res.json();
        setDoctorProfile(data);
        
        // Check if license exists - redirect to verification if not
        if (!data.license || data.license === 'Not provided') {
          navigate('/doctor/license-verification');
        }
      }
    } catch (err) {
      console.error('Error fetching doctor profile:', err);
    }
  };

  const fetchAppointments = async (email) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/doctor/appointments/${email}`);
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.appointments || []);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayCount = async (email) => {
    try {
      const res = await fetch(`http://localhost:3000/api/doctor/appointments/${email}/today-count`);
      if (res.ok) {
        const data = await res.json();
        setTodayCount(data.totalPatients || 0);
      }
    } catch (err) {
      console.error('Error fetching today count:', err);
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
      const res = await fetch('http://localhost:3000/api/doctor/setup-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: user.email,
          schedule
        })
      });

      const result = await res.json();

      if (res.ok) {
        setMessage('✅ ' + result.message);
        setTimeout(() => setMessage(''), 5000);
      } else {
        setMessage('❌ ' + (result.error || 'Failed to save availability'));
      }
    } catch (err) {
      console.error('Error saving availability:', err);
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

    switch (filter) {
      case 'upcoming':
        return appointments.filter(apt => {
          const aptDate = new Date(apt.appointmentDate);
          aptDate.setHours(0, 0, 0, 0);
          return apt.status === 'BOOKED' && aptDate >= today;
        });
      case 'completed':
        return appointments.filter(apt => apt.status === 'COMPLETED');
      case 'cancelled':
        return appointments.filter(apt => apt.status === 'CANCELLED');
      default:
        return appointments;
    }
  };

  const filteredAppointments = getFilteredAppointments();

  return (
    <div className="doctor-dashboard-new">
      {/* Header */}
      <header className="doctor-header">
        <div className="doctor-logo" onClick={() => navigate('/')}>
          <span className="doctor-logo-icon">🏥</span>
          <span className="logo-text">DOCAPPOINTER</span>
        </div>
        
        <div className="doctor-profile-dropdown">
          <div className="doctor-profile-icon" onClick={() => setShowProfileMenu(!showProfileMenu)}>
            <span className="doctor-user-avatar">👨‍⚕️</span>
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
          {message && <div className={`doctor-message ${message.includes('✅') ? 'success' : 'error'}`}>{message}</div>}

          {/* Appointments View */}
          {activeView === 'appointments' && (
            <div className="doctor-appointments-view">
              <div className="appointments-header">
                <h1>My Appointments</h1>
                <div className="today-count-badge">
                  📊 Today's Patients: <strong>{todayCount}</strong>
                </div>
              </div>

              <div className="appointments-filters">
                <button 
                  className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  All ({appointments.length})
                </button>
                <button 
                  className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
                  onClick={() => setFilter('upcoming')}
                >
                  Upcoming
                </button>
                <button 
                  className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                  onClick={() => setFilter('completed')}
                >
                  Completed
                </button>
                <button 
                  className={`filter-btn ${filter === 'cancelled' ? 'active' : ''}`}
                  onClick={() => setFilter('cancelled')}
                >
                  Cancelled
                </button>
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
                        <p><strong>Type:</strong> {apt.type || 'General'}</p>
                        <p><strong>Phone:</strong> {apt.patientPhone || 'N/A'}</p>
                      </div>
                      <div className="apt-actions">
                        {apt.status === 'BOOKED' && !apt.hasPrescription && (
                          <button 
                            className="btn-write-prescription"
                            onClick={() => navigate(`/doctor/prescription/${apt.appointmentId}`)}
                          >
                            ✍️ Write Prescription
                          </button>
                        )}
                        {apt.hasPrescription && (
                          <div className="prescription-badge">
                            ✅ Prescription Added
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
              <h1>Availability Schedule</h1>
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
                  <span className="doctor-avatar-icon">👨‍⚕️</span>
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
                    <label>Specialization:</label>
                    <span>{doctorProfile.specialization || 'Not provided'}</span>
                  </div>
                  <div className="doctor-info-row">
                    <label>Experience:</label>
                    <span>{doctorProfile.experienceYears ? `${doctorProfile.experienceYears} years` : 'Not provided'}</span>
                  </div>
                  <div className="doctor-info-row">
                    <label>Degrees:</label>
                    <span>{doctorProfile.degrees || 'Not provided'}</span>
                  </div>
                  <div className="doctor-info-row">
                    <label>License:</label>
                    <span>{doctorProfile.license || 'Not provided'}</span>
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
                  <h3>Update License Number</h3>
                  <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                    Current License: <strong>{doctorProfile.license || 'Not provided'}</strong>
                  </p>
                  
                  <div className="license-input-group">
                    <label>New License Number</label>
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value.toUpperCase())}
                      placeholder="Enter new license number (e.g., MD12345)"
                      maxLength="20"
                      className="license-input"
                    />
                    <small className="license-hint">
                      5-20 alphanumeric characters (letters and numbers only)
                    </small>
                  </div>

                  {licenseError && (
                    <div className="license-error">
                      {licenseError}
                    </div>
                  )}

                  <button 
                    className="btn-update-license"
                    onClick={async (e) => {
                      e.preventDefault();
                      setLicenseError('');
                      setLoading(true);

                      const trimmedLicense = licenseNumber.trim().toUpperCase();

                      if (trimmedLicense.length < 5 || trimmedLicense.length > 20) {
                        setLicenseError('License must be 5-20 characters long');
                        setLoading(false);
                        return;
                      }

                      if (!/^[A-Z0-9]+$/.test(trimmedLicense)) {
                        setLicenseError('License can only contain letters and numbers');
                        setLoading(false);
                        return;
                      }

                      try {
                        const res = await fetch('http://localhost:3000/api/doctor/license', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            email: user.email,
                            licenseNumber: trimmedLicense
                          })
                        });

                        const result = await res.json();

                        if (res.ok) {
                          setMessage('✅ ' + result.message);
                          setLicenseNumber('');
                          fetchDoctorProfile(user.email);
                          setTimeout(() => {
                            setMessage('');
                            setActiveView('profile');
                          }, 2000);
                        } else {
                          setLicenseError(result.error || 'Failed to update license');
                        }
                      } catch (err) {
                        console.error('Error updating license:', err);
                        setLicenseError('Server error');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading || !licenseNumber}
                  >
                    {loading ? 'Updating...' : 'Update License'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
