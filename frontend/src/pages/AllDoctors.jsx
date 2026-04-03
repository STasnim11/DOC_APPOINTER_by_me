import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import '../styles/AllDoctors.css';
import DoctorAvatar from '../components/DoctorAvatar';

const getSpecialtyIcon = (specialty) => {
  const icons = {
    'General physician': '🩺',
    'Gynecologist': '👶',
    'Dermatologist': '💆',
    'Pediatricians': '🧸',
    'Neurologist': '🧠',
    'Gastroenterologist': '🫁',
    'Cardiology': '❤️',
    'Orthopedic': '🦴',
    'Psychiatry': '🧘',
    'Ophthalmology': '👁️'
  };
  return icons[specialty] || '👨‍⚕️';
};

export default function AllDoctors() {
  const navigate = useNavigate();
  const location = useLocation();
  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState(location.state?.specialty || null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSpecialties();
    fetchAllDoctors();
  }, []);

  useEffect(() => {
    if (selectedSpecialty) {
      fetchDoctorsBySpecialty();
    } else {
      fetchAllDoctors();
    }
  }, [selectedSpecialty]);

  const fetchSpecialties = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/specialties');
      if (res.ok) {
        const data = await res.json();
        setSpecialties(data.specialties || []);
      }
    } catch (err) {
      console.error('Error fetching specialties:', err);
    }
  };

  const fetchAllDoctors = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/timetable/all-doctors');
      if (res.ok) {
        const data = await res.json();
        setDoctors(data.doctors || []);
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorsBySpecialty = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/timetable/doctors-by-specialty?specialty=${encodeURIComponent(selectedSpecialty)}`);
      if (res.ok) {
        const data = await res.json();
        setDoctors(data.doctors || []);
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSpecialtyClick = (specialty) => {
    if (selectedSpecialty === specialty) {
      setSelectedSpecialty(null);
    } else {
      setSelectedSpecialty(specialty);
    }
  };

  return (
    <div className="all-doctors-page">
      {/* Header */}
      <header className="doctors-header">
        <div className="logo" onClick={() => navigate('/')}>
          <span className="logo-icon">🏥</span>
          <span className="logo-text">DOCAPPOINTER</span>
        </div>
        <nav className="nav-menu">
          <a href="/#home" onClick={(e) => { e.preventDefault(); navigate('/'); }}>HOME</a>
          <a href="#doctors" className="active">ALL DOCTORS</a>
          <a href="/#about" onClick={(e) => { e.preventDefault(); navigate('/'); }}>ABOUT</a>
          <a href="/#contact" onClick={(e) => { e.preventDefault(); navigate('/'); }}>CONTACT</a>
        </nav>
        <button className="btn-create-account" onClick={() => navigate('/signup')}>
          Create account
        </button>
      </header>

      <div className="doctors-content">
        {/* Sidebar */}
        <aside className="specialty-sidebar">
          <h3>Filter by Specialty</h3>
          <div className="specialty-list">
            {specialties.map((spec) => (
              <div
                key={spec.id}
                className={`specialty-item ${selectedSpecialty === spec.name ? 'selected' : ''}`}
                onClick={() => handleSpecialtyClick(spec.name)}
              >
                <span className="spec-icon">{getSpecialtyIcon(spec.name)}</span>
                <span>{spec.name}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Doctors Grid */}
        <main className="doctors-main">
          {loading ? (
            <div className="loading">Loading doctors...</div>
          ) : doctors.length === 0 ? (
            <div className="no-doctors">
              <p>No doctors available{selectedSpecialty ? ` for ${selectedSpecialty}` : ''}</p>
              {selectedSpecialty && (
                <button className="btn-clear-filter" onClick={() => setSelectedSpecialty(null)}>
                  Clear Filter
                </button>
              )}
            </div>
          ) : (
            <div className="doctors-grid-all">
              {doctors.map((doctor) => (
                <div 
                  key={doctor.id}
                  className="doctor-card-all"
                  onClick={() => navigate(`/doctor/${doctor.id}`)}
                >
                  <div className="doctor-avatar-all" style={{
                    width: '100%',
                    height: '200px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: doctor.gender === 'Male' 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : doctor.gender === 'Female'
                      ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                      : 'linear-gradient(135deg, #a8a8a8 0%, #6b6b6b 100%)'
                  }}>
                    <DoctorAvatar gender={doctor.gender} size={100} />
                  </div>
                  <div className="doctor-info-all">
                    <div className="doctor-status-all">
                      <span className="status-dot-all"></span>
                      <span>Available</span>
                    </div>
                    <h3>{doctor.name}</h3>
                    <p className="doctor-specialty-all">{doctor.specialty}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
