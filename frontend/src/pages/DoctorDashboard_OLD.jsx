import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/DoctorDashboard.css";

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState('availability');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [doctorProfile, setDoctorProfile] = useState({});
  
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
  }, [navigate]);

  const fetchDoctorProfile = async (email) => {
    try {
      const res = await fetch(`http://localhost:3000/api/doctor/profile/${email}`);
      if (res.ok) {
        const data = await res.json();
        setDoctorProfile(data);
      }
    } catch (err) {
      console.error('Error fetching doctor profile:', err);
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
              className={`doctor-sidebar-item ${activeView === 'availability' ? 'active' : ''}`}
              onClick={() => setActiveView('availability')}
            >
              <span className="doctor-sidebar-icon">📅</span>
              <span>Edit Availability</span>
            </div>
            <div 
              className={`doctor-sidebar-item ${activeView === 'appointments' ? 'active' : ''}`}
              onClick={() => setActiveView('appointments')}
            >
              <span className="doctor-sidebar-icon">🩺</span>
              <span>My Appointments</span>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="doctor-main">
          {message && <div className={`doctor-message ${message.includes('✅') ? 'success' : 'error'}`}>{message}</div>}

          {/* Availability View */}
          {activeView === 'availability' && (
            <div className="availability-view">
              <h1>Edit Availability</h1>
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

          {/* Appointments View */}
          {activeView === 'appointments' && (
            <div className="doctor-appointments-view">
              <h1>My Appointments</h1>
              <div className="doctor-no-data">
                <p>Appointments feature coming soon</p>
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
        </main>
      </div>
    </div>
  );
}
