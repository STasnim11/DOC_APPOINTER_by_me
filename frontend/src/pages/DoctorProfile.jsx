import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import '../styles/DoctorProfile.css';

export default function DoctorProfile() {
  const navigate = useNavigate();
  const { doctorId } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const [weekDates, setWeekDates] = useState([]);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    fetchDoctorDetails();
    generateWeekDates();
  }, [doctorId]);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDate]);

  const generateWeekDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        full: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        date: date.getDate()
      });
    }
    setWeekDates(dates);
    setSelectedDate(dates[0].full);
  };

  const fetchDoctorDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/timetable/doctor/${doctorId}`);
      if (res.ok) {
        const data = await res.json();
        setDoctor(data.doctor);
      }
    } catch (err) {
      console.error('Error fetching doctor:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const res = await fetch(
        `http://localhost:3000/api/appointments/available-slots/${doctorId}?date=${selectedDate}`
      );
      if (res.ok) {
        const data = await res.json();
        setAvailableSlots(data.slots || []);
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
    }
  };

  const handleBookAppointment = async () => {
    if (!user || !user.token) {
      navigate('/login');
      return;
    }

    if (user.role?.toUpperCase() !== 'PATIENT') {
      setMessage('❌ Only patients can book appointments');
      return;
    }

    if (!selectedSlot) {
      setMessage('❌ Please select a time slot');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/appointments/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          patientEmail: user.email,
          doctorId: parseInt(doctorId),
          appointmentDate: selectedDate,
          timeSlotId: selectedSlot.timeSlotId,
          type: 'General'
        })
      });

      const result = await res.json();

      if (res.ok) {
        setMessage('✅ Appointment booked successfully!');
        setSelectedSlot(null);
        fetchAvailableSlots();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ ' + (result.error || 'Failed to book appointment'));
      }
    } catch (err) {
      console.error('Error booking appointment:', err);
      setMessage('❌ Server error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !doctor) {
    return <div className="loading-page">Loading...</div>;
  }

  if (!doctor) {
    return <div className="loading-page">Doctor not found</div>;
  }

  return (
    <div className="doctor-profile-page">
      {/* Header */}
      <header className="profile-header">
        <div className="logo" onClick={() => navigate('/')}>
          <span className="logo-icon">🏥</span>
          <span className="logo-text">DOCAPPOINTER</span>
        </div>
        <nav className="nav-menu">
          <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>HOME</a>
          <a href="/all-doctors" onClick={(e) => { e.preventDefault(); navigate('/all-doctors'); }}>ALL DOCTORS</a>
          <a href="/#about" onClick={(e) => { e.preventDefault(); navigate('/'); }}>ABOUT</a>
          <a href="/#contact" onClick={(e) => { e.preventDefault(); navigate('/'); }}>CONTACT</a>
        </nav>
        {user?.token ? (
          <button className="btn-account" onClick={() => navigate(user.role === 'PATIENT' ? '/patient/dashboard' : '/doctor/dashboard')}>
            My Account
          </button>
        ) : (
          <button className="btn-account" onClick={() => navigate('/login')}>
            Login
          </button>
        )}
      </header>

      <div className="profile-content">
        {/* Doctor Info Card */}
        <div className="doctor-info-card">
          <div className="doctor-image-section">
            <img 
              src={`https://images.unsplash.com/photo-${doctor.id % 2 === 0 ? '1612349317150-e413f6a5b16d' : '1559839734-2b71ea197ec2'}?w=400&h=400&fit=crop`}
              alt={doctor.name} 
              className="doctor-profile-img"
              onError={(e) => {
                e.target.src = '/src/assets/default.png';
              }}
            />
          </div>
          
          <div className="doctor-details-section">
            <h1>
              {doctor.name} 
              <span className="verified-badge">✓</span>
            </h1>
            <p className="doctor-credentials">
              {doctor.degrees || 'MBBS'} - {doctor.specialty}
              <span className="experience-badge">{doctor.experienceYears} Years</span>
            </p>
            
            <div className="about-section">
              <h3>About</h3>
              <p>
                Dr. {doctor.name.split(' ')[1]} is a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, 
                early diagnosis, and effective treatment strategies. Dr. {doctor.name.split(' ')[1]} has a strong commitment to delivering 
                comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment.
              </p>
            </div>
            
            <div className="fee-section">
              <strong>Appointment fee:</strong> <span className="fee-amount">${doctor.fee || 50}</span>
            </div>
          </div>
        </div>

        {/* Booking Section */}
        <div className="booking-section-profile">
          <h2>Booking slots</h2>
          
          {/* Week Days */}
          <div className="week-selector">
            {weekDates.map((dateObj) => (
              <div
                key={dateObj.full}
                className={`day-card ${selectedDate === dateObj.full ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedDate(dateObj.full);
                  setSelectedSlot(null);
                }}
              >
                <div className="day-name">{dateObj.day}</div>
                <div className="day-number">{dateObj.date}</div>
              </div>
            ))}
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div className="time-slots-section">
              {availableSlots.length === 0 ? (
                <div className="no-slots">No available slots for this date</div>
              ) : (
                <div className="time-slots-grid">
                  {availableSlots.map((slot) => (
                    <div
                      key={slot.timeSlotId}
                      className={`time-slot ${selectedSlot?.timeSlotId === slot.timeSlotId ? 'selected' : ''}`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {slot.startTime}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Book Button */}
          {message && <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>{message}</div>}
          
          <button 
            className="btn-book-appointment-profile"
            onClick={handleBookAppointment}
            disabled={!selectedSlot || loading}
          >
            {loading ? 'Booking...' : 'Book an appointment'}
          </button>
        </div>
      </div>
    </div>
  );
}
