import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import '../styles/Home.css';
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

export default function Home() {
  const navigate = useNavigate();
  const [specialties, setSpecialties] = useState([]);
  const [topDoctors, setTopDoctors] = useState([]);

  useEffect(() => {
    fetchSpecialties();
    fetchTopDoctors();
  }, []);

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

  const fetchTopDoctors = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/timetable/top-doctors');
      if (res.ok) {
        const data = await res.json();
        setTopDoctors(data.doctors || []);
      }
    } catch (err) {
      console.error('Error fetching top doctors:', err);
    }
  };

  return (
    <div className="home-page">
      {/* Header */}
      <header className="home-header">
        <div className="logo">
          <span className="logo-icon">🏥</span>
          <span className="logo-text">DOCAPPOINTER</span>
        </div>
        <nav className="nav-menu">
          <a href="#home">HOME</a>
          <a href="#doctors">ALL DOCTORS</a>
          <a href="#about">ABOUT</a>
          <a href="#contact">CONTACT</a>
        </nav>
        <button className="btn-create-account" onClick={() => navigate('/signup')}>
          Create account
        </button>
      </header>

      {/* Hero Banner */}
      <section className="hero-banner" id="home">
        <div className="hero-content">
          <h1>Book Appointment<br />With Trusted Doctors</h1>
          <div className="hero-features">
            <div className="feature-item">
              <div className="hero-doctors-grid">
                <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=250&fit=crop" alt="Doctor 1" className="hero-doctor-img" />
                <img src="https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&h=250&fit=crop" alt="Doctor 2" className="hero-doctor-img" />
                <img src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=250&fit=crop" alt="Doctor 3" className="hero-doctor-img" />
              </div>
            </div>
            <div className="feature-text">
              <p>Simply browse through our extensive list of trusted doctors,</p>
              <p>schedule your appointment hassle-free.</p>
            </div>
          </div>
          <button className="btn-book-appointment" onClick={() => navigate('/patient/dashboard')}>
            Book appointment →
          </button>
        </div>
      </section>

      {/* Find by Specialty */}
      <section className="specialty-section" id="doctors">
        <h2>Find by Specialty</h2>
        <p className="section-subtitle">Browse through our extensive list of trusted doctors by their specialty.</p>
        
        <div className="specialty-grid">
          {specialties.length === 0 ? (
            <div className="no-specialties">
              <p>No specialties available. Please add specializations first.</p>
            </div>
          ) : (
            specialties.map((spec) => (
              <div 
                key={spec.id} 
                className="specialty-card"
                onClick={() => navigate('/all-doctors', { state: { specialty: spec.name } })}
              >
                <div className="specialty-icon">{getSpecialtyIcon(spec.name)}</div>
                <p className="specialty-name">{spec.name}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Top Doctors */}
      <section className="doctors-section">
        <h2>Top Doctors to Book</h2>
        <p className="section-subtitle">Doctors with the highest number of appointments.</p>
        
        <div className="doctors-grid">
          {topDoctors.length === 0 ? (
            <div className="no-doctors">
              <p>No doctors available yet.</p>
            </div>
          ) : (
            topDoctors.slice(0, 3).map((doctor) => (
              <div 
                key={doctor.id} 
                className="doctor-card"
                onClick={() => navigate(`/doctor/${doctor.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="doctor-avatar-home" style={{
                  width: '100%',
                  height: '200px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: doctor.gender === 'Male' 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : doctor.gender === 'Female'
                    ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                    : 'linear-gradient(135deg, #a8a8a8 0%, #6b6b6b 100%)',
                  borderRadius: '12px 12px 0 0'
                }}>
                  <DoctorAvatar gender={doctor.gender} size={100} />
                </div>
                <div className="doctor-info">
                  <div className="doctor-status">
                    <span className="status-dot"></span>
                    <span>Available</span>
                  </div>
                  <h3>{doctor.name}</h3>
                  <p className="doctor-specialty">{doctor.specialty}</p>
                  <p className="doctor-appointments">{doctor.totalAppointments} appointments</p>
                </div>
              </div>
            ))
          )}
        </div>
        
        <button className="btn-more" onClick={() => navigate('/all-doctors')}>
          more →
        </button>
      </section>

      {/* About Section */}
      <section className="about-section" id="about">
        <div className="about-container">
          <div className="about-header">
            <h2>About DOCAPPOINTER</h2>
            <div className="about-divider"></div>
          </div>
          
          <div className="about-content">
            <div className="about-text">
              <p className="about-intro">
                Welcome to DOCAPPOINTER, your trusted healthcare companion in the digital age. We're revolutionizing the way patients connect with healthcare professionals, making quality medical care accessible to everyone, anytime, anywhere.
              </p>
              
              <div className="about-features">
                <div className="about-feature">
                  <span className="feature-icon">🎯</span>
                  <div>
                    <h3>Our Mission</h3>
                    <p>To bridge the gap between patients and healthcare providers through innovative technology, ensuring timely access to quality medical care for all.</p>
                  </div>
                </div>
                
                <div className="about-feature">
                  <span className="feature-icon">💡</span>
                  <div>
                    <h3>Our Vision</h3>
                    <p>To become the leading healthcare appointment platform, empowering patients with seamless access to medical services and enabling doctors to focus on what matters most - patient care.</p>
                  </div>
                </div>
                
                <div className="about-feature">
                  <span className="feature-icon">⭐</span>
                  <div>
                    <h3>Why Choose Us</h3>
                    <p>With DOCAPPOINTER, you get instant appointment booking, verified healthcare professionals, secure medical records, lab test scheduling, and 24/7 support - all in one platform.</p>
                  </div>
                </div>
              </div>
              
              <div className="about-stats">
                <div className="stat-item">
                  <h3>500+</h3>
                  <p>Qualified Doctors</p>
                </div>
                <div className="stat-item">
                  <h3>10,000+</h3>
                  <p>Happy Patients</p>
                </div>
                <div className="stat-item">
                  <h3>50+</h3>
                  <p>Specializations</p>
                </div>
                <div className="stat-item">
                  <h3>24/7</h3>
                  <p>Support Available</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer" id="contact">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <span className="logo-icon">🏥</span>
              <span className="logo-text">DOCAPPOINTER</span>
            </div>
            <p>Your trusted platform for booking appointments with qualified doctors.</p>
          </div>
          
          <div className="footer-section">
            <h4>COMPANY</h4>
            <ul>
              <li><a href="#home">Home</a></li>
              <li><a href="#about">About us</a></li>
              <li><a href="#contact">Contact us</a></li>
              <li><a href="#privacy">Privacy policy</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>GET IN TOUCH</h4>
            <p>+1-212-456-7890</p>
            <p>contact@docappointer.com</p>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>Copyright 2024 @ DOCAPPOINTER - All Right Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
