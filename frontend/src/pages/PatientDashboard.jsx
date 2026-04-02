import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import '../styles/PatientDashboard.css';

export default function PatientDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState('appointments');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({});

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userData.token || userData.role?.toUpperCase() !== 'PATIENT') {
      navigate('/login');
      return;
    }
    setUser(userData);
    fetchPatientProfile(userData.email);
    fetchAppointments(userData.email);
  }, [navigate]);

  const fetchPatientProfile = async (email) => {
    try {
      const res = await fetch(`http://localhost:3000/api/patient/profile/${email}`);
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
      }
    } catch (err) {
      console.error('Error fetching patient profile:', err);
    }
  };

  const fetchAppointments = async (email) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/patient/${email}/appointments`);
      if (res.ok) {
        const data = await res.json();
        setAppointments(data || []);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/appointments/${appointmentId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        setMessage('✅ Appointment cancelled successfully');
        fetchAppointments(user.email);
        setTimeout(() => setMessage(''), 3000);
      } else {
        const result = await res.json();
        setMessage('❌ ' + (result.error || 'Failed to cancel appointment'));
      }
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      setMessage('❌ Server error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/patient/update-profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      });

      if (res.ok) {
        const result = await res.json();
        const updatedUser = { ...user, name: profileData.name, phone: profileData.phone };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setMessage('✅ Profile updated successfully');
        setEditMode(false);
        setTimeout(() => setMessage(''), 3000);
      } else {
        const result = await res.json();
        setMessage('❌ ' + (result.error || 'Failed to update profile'));
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setMessage('❌ Server error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!window.confirm('Are you sure you want to delete your profile? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/patient/delete-profile', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (res.ok) {
        localStorage.removeItem('user');
        navigate('/');
      } else {
        const result = await res.json();
        setMessage('❌ ' + (result.error || 'Failed to delete profile'));
      }
    } catch (err) {
      console.error('Error deleting profile:', err);
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
    <div className="patient-dashboard-new">
      {/* Header */}
      <header className="dashboard-header">
        <div className="logo" onClick={() => navigate('/')}>
          <span className="logo-icon">🏥</span>
          <span className="logo-text">DOCAPPOINTER</span>
        </div>
        
        <div className="profile-dropdown">
          <div className="profile-icon" onClick={() => setShowProfileMenu(!showProfileMenu)}>
            <span className="user-avatar" style={{
              background: profileData.gender === 'Female'
                ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {profileData.gender === 'Female' ? '👩' : '👨'}
            </span>
            <span className="user-name-header">{user?.name}</span>
            <span className="dropdown-arrow">▼</span>
          </div>
          
          {showProfileMenu && (
            <div className="profile-menu">
              <div className="profile-menu-item" onClick={() => { setActiveView('profile'); setShowProfileMenu(false); }}>
                <span>👤</span> View Profile
              </div>
              <div className="profile-menu-item" onClick={() => { setActiveView('profile'); setEditMode(true); setShowProfileMenu(false); }}>
                <span>✏️</span> Edit Profile
              </div>
              <div className="profile-menu-item" onClick={handleLogout}>
                <span>🚪</span> Logout
              </div>
              <div className="profile-menu-item danger" onClick={handleDeleteProfile}>
                <span>🗑️</span> Delete Profile
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="dashboard-body">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <nav className="sidebar-nav">
            <div 
              className={`sidebar-item ${activeView === 'appointments' ? 'active' : ''}`}
              onClick={() => setActiveView('appointments')}
            >
              <span className="sidebar-icon">📅</span>
              <span>My Appointments</span>
            </div>
            <div 
              className={`sidebar-item ${activeView === 'book' ? 'active' : ''}`}
              onClick={() => navigate('/all-doctors')}
            >
              <span className="sidebar-icon">➕</span>
              <span>Book Appointment</span>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          {message && <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>{message}</div>}

          {/* My Appointments View */}
          {activeView === 'appointments' && (
            <div className="appointments-view">
              <h1>My Appointments</h1>
              
              {loading ? (
                <div className="loading">Loading appointments...</div>
              ) : appointments.length === 0 ? (
                <div className="no-data">
                  <p>No appointments found</p>
                  <button className="btn-book-new" onClick={() => navigate('/all-doctors')}>
                    Book Your First Appointment
                  </button>
                </div>
              ) : (
                <div className="appointments-list">
                  {appointments.map((apt) => (
                    <div key={apt.appointmentId} className="appointment-card">
                      <div className="apt-header">
                        <h3>Dr. {apt.doctorName}</h3>
                        <span className={`apt-status ${apt.status?.toLowerCase()}`}>
                          {apt.status}
                        </span>
                      </div>
                      <div className="apt-details">
                        <p><strong>Date:</strong> {new Date(apt.appointmentDate).toLocaleDateString()}</p>
                        <p><strong>Time:</strong> {apt.slot}</p>
                      </div>
                      {apt.status === 'BOOKED' && (
                        <button 
                          className="btn-cancel-apt"
                          onClick={() => handleCancelAppointment(apt.appointmentId)}
                          disabled={loading}
                        >
                          Cancel Appointment
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Profile View */}
          {activeView === 'profile' && (
            <div className="profile-view">
              <h1>My Profile</h1>
              
              {editMode ? (
                <form onSubmit={handleUpdateProfile} className="profile-form">
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={profileData.name || ''}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={profileData.email || ''}
                      disabled
                      style={{ background: '#f0f0f0', cursor: 'not-allowed' }}
                    />
                    <small>Email cannot be changed</small>
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="text"
                      value={profileData.phone || ''}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      maxLength="11"
                    />
                  </div>
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      value={profileData.dateOfBirth || ''}
                      onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Gender</label>
                    <select
                      value={profileData.gender || ''}
                      onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Blood Type</label>
                    <select
                      value={profileData.bloodType || ''}
                      onChange={(e) => setProfileData({ ...profileData, bloodType: e.target.value })}
                    >
                      <option value="">Select Blood Type</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Marital Status</label>
                    <select
                      value={profileData.maritalStatus || ''}
                      onChange={(e) => setProfileData({ ...profileData, maritalStatus: e.target.value })}
                    >
                      <option value="">Select Status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Occupation</label>
                    <input
                      type="text"
                      value={profileData.occupation || ''}
                      onChange={(e) => setProfileData({ ...profileData, occupation: e.target.value })}
                      maxLength="50"
                    />
                  </div>
                  <div className="form-group">
                    <label>Address</label>
                    <textarea
                      value={profileData.address || ''}
                      onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                      rows="3"
                    />
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn-cancel" onClick={() => setEditMode(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-save" disabled={loading}>
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="profile-display">
                  <div className="profile-avatar-large" style={{
                    background: profileData.gender === 'Female' 
                      ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  }}>
                    <span className="avatar-icon">
                      {profileData.gender === 'Female' ? '👩' : '👨'}
                    </span>
                  </div>
                  <div className="profile-info">
                    <div className="info-row">
                      <label>Name:</label>
                      <span>{profileData.name || 'Not provided'}</span>
                    </div>
                    <div className="info-row">
                      <label>Email:</label>
                      <span>{profileData.email || 'Not provided'}</span>
                    </div>
                    <div className="info-row">
                      <label>Phone:</label>
                      <span>{profileData.phone || 'Not provided'}</span>
                    </div>
                    <div className="info-row">
                      <label>Date of Birth:</label>
                      <span>{profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toLocaleDateString() : 'Not provided'}</span>
                    </div>
                    <div className="info-row">
                      <label>Gender:</label>
                      <span>{profileData.gender || 'Not provided'}</span>
                    </div>
                    <div className="info-row">
                      <label>Blood Type:</label>
                      <span>{profileData.bloodType || 'Not provided'}</span>
                    </div>
                    <div className="info-row">
                      <label>Marital Status:</label>
                      <span>{profileData.maritalStatus || 'Not provided'}</span>
                    </div>
                    <div className="info-row">
                      <label>Occupation:</label>
                      <span>{profileData.occupation || 'Not provided'}</span>
                    </div>
                    <div className="info-row">
                      <label>Address:</label>
                      <span>{profileData.address || 'Not provided'}</span>
                    </div>
                  </div>
                  <button className="btn-edit-profile" onClick={() => setEditMode(true)}>
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
