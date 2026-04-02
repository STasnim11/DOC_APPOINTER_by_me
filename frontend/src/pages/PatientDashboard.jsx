import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import '../styles/PatientDashboard.css';

export default function PatientDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [specialties, setSpecialties] = useState([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState(location.state?.specialty || '');
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userData.token || userData.role?.toUpperCase() !== 'PATIENT') {
      navigate('/login');
      return;
    }
    setUser(userData);
    fetchSpecialties();
  }, [navigate]);

  useEffect(() => {
    if (selectedSpecialty) {
      fetchDoctorsBySpecialty();
    }
  }, [selectedSpecialty]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDoctor, selectedDate]);

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

  const fetchAvailableSlots = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:3000/api/appointments/available-slots/${selectedDoctor.id}?date=${selectedDate}`
      );
      if (res.ok) {
        const data = await res.json();
        setAvailableSlots(data.slots || []);
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedSlot) {
      setMessage('Please select a time slot');
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
          doctorId: selectedDoctor.id,
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

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="patient-dashboard">
      {/* Header */}
      <header className="patient-header">
        <div className="logo" onClick={() => navigate('/')}>
          <span className="logo-icon">🏥</span>
          <span className="logo-text">DOCAPPOINTER</span>
        </div>
        <div className="header-right">
          <span className="user-name">Welcome, {user?.name}</span>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </header>

      <div className="dashboard-content">
        <h1>Book Your Appointment</h1>

        {/* Step 1: Select Specialty */}
        <section className="booking-section">
          <h2>1. Select Specialty</h2>
          <div className="specialty-selector">
            <select 
              value={selectedSpecialty} 
              onChange={(e) => {
                setSelectedSpecialty(e.target.value);
                setSelectedDoctor(null);
                setSelectedDate('');
                setAvailableSlots([]);
                setSelectedSlot(null);
              }}
              className="select-input"
            >
              <option value="">Choose a specialty...</option>
              {specialties.map((spec) => (
                <option key={spec.id} value={spec.name}>{spec.name}</option>
              ))}
            </select>
          </div>
        </section>

        {/* Step 2: Select Doctor */}
        {selectedSpecialty && (
          <section className="booking-section">
            <h2>2. Select Doctor</h2>
            {loading && !doctors.length ? (
              <div className="loading">Loading doctors...</div>
            ) : doctors.length === 0 ? (
              <div className="no-data">No doctors available for this specialty</div>
            ) : (
              <div className="doctors-list">
                {doctors.map((doctor) => (
                  <div 
                    key={doctor.id}
                    className={`doctor-item ${selectedDoctor?.id === doctor.id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedDoctor(doctor);
                      setSelectedDate('');
                      setAvailableSlots([]);
                      setSelectedSlot(null);
                    }}
                  >
                    <img src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop" alt={doctor.name} className="doctor-avatar" />
                    <div className="doctor-details">
                      <h3>{doctor.name}</h3>
                      <p className="doctor-spec">{doctor.specialty}</p>
                      <p className="doctor-exp">{doctor.experienceYears} years experience</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Step 3: Select Date */}
        {selectedDoctor && (
          <section className="booking-section">
            <h2>3. Select Date</h2>
            <input 
              type="date" 
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedSlot(null);
              }}
              className="date-input"
            />
          </section>
        )}

        {/* Step 4: Select Time Slot */}
        {selectedDoctor && selectedDate && (
          <section className="booking-section">
            <h2>4. Select Time Slot</h2>
            {loading ? (
              <div className="loading">Loading available slots...</div>
            ) : availableSlots.length === 0 ? (
              <div className="no-data">No available slots for this date</div>
            ) : (
              <div className="slots-grid">
                {availableSlots.map((slot) => (
                  <div 
                    key={slot.timeSlotId}
                    className={`slot-item ${selectedSlot?.timeSlotId === slot.timeSlotId ? 'selected' : ''}`}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {slot.startTime} - {slot.endTime}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Book Button */}
        {selectedSlot && (
          <section className="booking-section">
            {message && <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>{message}</div>}
            <button 
              className="btn-book" 
              onClick={handleBookAppointment}
              disabled={loading}
            >
              {loading ? 'Booking...' : 'Confirm Appointment'}
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
