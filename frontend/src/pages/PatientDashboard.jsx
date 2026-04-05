import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import '../styles/PatientDashboard.css';
import UserAvatar from '../components/DoctorAvatar';
import { getAuthHeaders } from '../utils/api';

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
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState({ type: '', title: '', message: '' });
  const [appointmentFilter, setAppointmentFilter] = useState('all'); // all, today, upcoming, completed, cancelled
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState(null);
  const [loadingPrescription, setLoadingPrescription] = useState(false);
  const [showLabTestModal, setShowLabTestModal] = useState(false);
  const [currentAppointmentId, setCurrentAppointmentId] = useState(null);
  const [labTestStep, setLabTestStep] = useState(1);
  const [labTests, setLabTests] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [labTestSearch, setLabTestSearch] = useState('');
  const [bookingLabTest, setBookingLabTest] = useState(false);
  const [labTestToken, setLabTestToken] = useState(null);
  const [myLabTests, setMyLabTests] = useState([]);
  
  // Bed booking states
  const [showBedBookingModal, setShowBedBookingModal] = useState(false);
  const [availableBeds, setAvailableBeds] = useState([]);
  const [selectedBed, setSelectedBed] = useState(null);
  const [bedFilter, setBedFilter] = useState({ ward: '', type: '', floor: '' });
  const [bookingBed, setBookingBed] = useState(false);
  const [myBedBookings, setMyBedBookings] = useState([]);
  const [currentBedAppointmentId, setCurrentBedAppointmentId] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!userData.token || userData.role?.toUpperCase() !== 'PATIENT') {
      navigate('/login');
      return;
    }
    
    setUser(userData);
    
    if (userData.email) {
      fetchPatientProfile(userData.email);
      fetchAppointments(userData.email);
    } else {
      setMessage('❌ Session error - please login again');
    }
  }, [navigate]);

  const fetchPatientProfile = async (email) => {
    try {
      const res = await fetch(`http://localhost:3000/api/patient/profile/${email}`, {
        headers: getAuthHeaders()
      });
      
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
      } else {
        const error = await res.json();
        setMessage('❌ Failed to load profile: ' + error.error);
      }
    } catch (err) {
      setMessage('❌ Error loading profile');
    }
  };

  const fetchAppointments = async (email) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/patient/${email}/appointments`, {
        headers: getAuthHeaders()
      });
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
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/appointments/${appointmentId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await res.json();

      if (res.ok) {
        setModalMessage({
          type: 'success',
          title: 'Appointment Cancelled',
          message: 'Your appointment has been successfully cancelled.'
        });
        setShowModal(true);
        fetchAppointments(user.email);
      } else {
        setModalMessage({
          type: 'error',
          title: 'Cancellation Failed',
          message: data.error || 'Unable to cancel appointment. Please try again.'
        });
        setShowModal(true);
      }
    } catch (err) {
      setModalMessage({
        type: 'error',
        title: 'Error',
        message: 'Network error. Please check your connection and try again.'
      });
      setShowModal(true);
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
        
        // Backend returns { success: true, prescription: {...} }
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
      console.error('Error loading prescription:', err);
      setPrescriptionData({ error: 'Network error loading prescription' });
    } finally {
      setLoadingPrescription(false);
    }
  };

  const handleBookLabTest = async (appointmentId) => {
    setCurrentAppointmentId(appointmentId);
    setShowLabTestModal(true);
    setLabTestStep(1);
    setSelectedTest(null);
    setSelectedTechnician(null);
    setLabTestToken(null);
    
    // Fetch lab tests and technicians (public routes, no auth needed)
    try {
      const [testsRes, techsRes] = await Promise.all([
        fetch('http://localhost:3000/api/lab-tests'),
        fetch('http://localhost:3000/api/medical-technicians')
      ]);
      
      if (testsRes.ok) {
        const testsData = await testsRes.json();
        console.log('Lab tests loaded:', testsData);
        setLabTests(testsData.labTests || []);
      } else {
        console.error('Failed to load lab tests:', testsRes.status);
      }
      
      if (techsRes.ok) {
        const techsData = await techsRes.json();
        console.log('Technicians loaded:', techsData);
        setTechnicians(techsData.technicians || []);
      } else {
        console.error('Failed to load technicians:', techsRes.status);
      }
    } catch (err) {
      console.error('Error loading lab test data:', err);
    }
  };

  const handleBookBed = async (appointmentId) => {
    setCurrentBedAppointmentId(appointmentId);
    setShowBedBookingModal(true);
    setSelectedBed(null);
    setBedFilter({ ward: '', type: '', floor: '' });
    
    // Fetch available beds
    try {
      const res = await fetch('http://localhost:3000/api/beds/available', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableBeds(data.beds || []);
      }
    } catch (err) {
      console.error('Error loading available beds:', err);
    }
  };

  const handleConfirmBedBooking = async () => {
    if (!selectedBed) {
      setModalMessage({
        type: 'error',
        title: 'Selection Required',
        message: 'Please select a bed'
      });
      setShowModal(true);
      return;
    }

    setBookingBed(true);

    try {
      const res = await fetch('http://localhost:3000/api/bed-bookings', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          appointmentId: currentBedAppointmentId,
          bedId: selectedBed.id
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setModalMessage({
          type: 'success',
          title: 'Bed Booked Successfully',
          message: `Bed ${selectedBed.bedNumber} in ${selectedBed.wardName} has been booked!`
        });
        setShowModal(true);
        setShowBedBookingModal(false);
        fetchMyBedBookings();
      } else {
        setModalMessage({
          type: 'error',
          title: 'Booking Failed',
          message: data.message || 'Failed to book bed'
        });
        setShowModal(true);
      }
    } catch (err) {
      console.error('Error booking bed:', err);
      setModalMessage({
        type: 'error',
        title: 'Error',
        message: 'Network error. Please try again.'
      });
      setShowModal(true);
    } finally {
      setBookingBed(false);
    }
  };

  const fetchMyBedBookings = async () => {
    if (!user?.email) {
      return;
    }
    
    try {
      const res = await fetch(`http://localhost:3000/api/patient/${user.email}/bed-bookings`, {
        headers: getAuthHeaders()
      });
      
      if (res.ok) {
        const data = await res.json();
        setMyBedBookings(data.bookings || []);
      }
    } catch (err) {
    }
  };

  const handleConfirmLabTestBooking = async () => {
    if (!selectedTest) {
      setModalMessage({
        type: 'error',
        title: 'Selection Required',
        message: 'Please select a lab test'
      });
      setShowModal(true);
      return;
    }

    setBookingLabTest(true);

    try {
      const res = await fetch('http://localhost:3000/api/lab-test-appointments', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          patientEmail: user.email,
          testId: selectedTest.id,
          technicianId: selectedTechnician?.id || null
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setLabTestToken(data.data);
        setLabTestStep(3); // Show success screen
        // Refresh lab tests list
        fetchMyLabTests();
      } else {
        setModalMessage({
          type: 'error',
          title: 'Booking Failed',
          message: data.message || 'Failed to book lab test'
        });
        setShowModal(true);
        setShowLabTestModal(false);
      }
    } catch (err) {
      console.error('Error booking lab test:', err);
      setModalMessage({
        type: 'error',
        title: 'Error',
        message: 'Network error. Please try again.'
      });
      setShowModal(true);
      setShowLabTestModal(false);
    } finally {
      setBookingLabTest(false);
    }
  };

  const fetchMyLabTests = async () => {
    if (!user?.email) return;
    
    try {
      const res = await fetch(`http://localhost:3000/api/patient/${user.email}/lab-tests`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setMyLabTests(data.labTests || []);
      }
    } catch (err) {
      console.error('Error fetching lab tests:', err);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setModalMessage({
        type: 'success',
        title: 'Copied!',
        message: 'Token copied to clipboard'
      });
      setShowModal(true);
    } catch (err) {
      // Fallback for older browsers or if clipboard API fails
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setModalMessage({
          type: 'success',
          title: 'Copied!',
          message: 'Token copied to clipboard'
        });
        setShowModal(true);
      } catch (err2) {
        setModalMessage({
          type: 'error',
          title: 'Copy Failed',
          message: 'Please copy the token manually'
        });
        setShowModal(true);
      }
      document.body.removeChild(textArea);
    }
  };

  // Fetch lab tests on mount
  useEffect(() => {
    if (user?.email) {
      fetchMyLabTests();
    }
  }, [user]);

  // Fetch bed bookings when view changes to bedBookings
  useEffect(() => {
    if (activeView === 'bedBookings' && user?.email) {
      fetchMyBedBookings();
    }
  }, [activeView, user]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const getTodayAppointments = () => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return appointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDate);
      aptDate.setHours(0, 0, 0, 0);
      
      // Check if appointment is today and BOOKED
      if (aptDate.getTime() !== today.getTime() || apt.status !== 'BOOKED') {
        return false;
      }
      
      // Check if appointment time hasn't passed yet
      if (apt.startTime) {
        const [hours, minutes] = apt.startTime.split(':').map(Number);
        const appointmentTime = new Date();
        appointmentTime.setHours(hours, minutes, 0, 0);
        
        // Only show if appointment time is in the future
        return appointmentTime > now;
      }
      
      return true; // If no time specified, show it
    });
  };

  const getFilteredAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Sort by nearest first (ascending date)
    const sorted = [...appointments].sort((a, b) => {
      return new Date(a.appointmentDate) - new Date(b.appointmentDate);
    });
    
    switch (appointmentFilter) {
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
          return aptDate.getTime() > today.getTime() && apt.status === 'BOOKED';
        });
      
      case 'completed':
        return sorted.filter(apt => apt.status === 'COMPLETED');
      
      case 'cancelled':
        return sorted.filter(apt => apt.status === 'CANCELLED');
      
      case 'all':
      default:
        return sorted;
    }
  };

  const todayAppointments = getTodayAppointments();
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
      return aptDate.getTime() > today.getTime() && apt.status === 'BOOKED';
    }).length,
    completed: appointments.filter(apt => apt.status === 'COMPLETED').length,
    cancelled: appointments.filter(apt => apt.status === 'CANCELLED').length
  };

  // Modal Component
  const Modal = ({ show, onClose, type, title, message }) => {
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
        zIndex: 2000
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              {type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>{title}</h3>
            <p style={{ color: '#6b7280', margin: '0 0 1.5rem 0' }}>{message}</p>
            <button
              onClick={onClose}
              style={{
                background: type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6',
                color: 'white',
                border: 'none',
                padding: '0.75rem 2rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    );
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
              {/* Prescription Header */}
              <div style={{ 
                background: '#f3f4f6', 
                padding: '1rem', 
                borderRadius: '8px', 
                marginBottom: '1.5rem' 
              }}>
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

              {/* Chief Complaints */}
              {prescription.chiefComplaints && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#1f2937' }}>Chief Complaints</h3>
                  <p style={{ 
                    margin: 0, 
                    padding: '0.75rem', 
                    background: '#fef3c7', 
                    borderRadius: '6px',
                    color: '#92400e'
                  }}>
                    {prescription.chiefComplaints}
                  </p>
                </div>
              )}

              {/* Diagnosis */}
              {prescription.diagnosis && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#1f2937' }}>Diagnosis</h3>
                  <p style={{ 
                    margin: 0, 
                    padding: '0.75rem', 
                    background: '#dbeafe', 
                    borderRadius: '6px',
                    color: '#1e40af'
                  }}>
                    {prescription.diagnosis}
                  </p>
                </div>
              )}

              {/* Investigations */}
              {prescription.investigations && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#1f2937' }}>Investigations</h3>
                  <p style={{ 
                    margin: 0, 
                    padding: '0.75rem', 
                    background: '#f3f4f6', 
                    borderRadius: '6px',
                    color: '#374151'
                  }}>
                    {prescription.investigations}
                  </p>
                </div>
              )}

              {/* Required Tests */}
              {prescription.requiredTests && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#1f2937' }}>Required Tests</h3>
                  <p style={{ 
                    margin: 0, 
                    padding: '0.75rem', 
                    background: '#f3f4f6', 
                    borderRadius: '6px',
                    color: '#374151'
                  }}>
                    {prescription.requiredTests}
                  </p>
                </div>
              )}

              {/* Medicines */}
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
                        {med.category && (
                          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
                            Category: {med.category}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No medicines prescribed</p>
                )}
              </div>

              {/* History */}
              {prescription.history && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#1f2937' }}>Medical History</h3>
                  <p style={{ 
                    margin: 0, 
                    padding: '0.75rem', 
                    background: '#f3f4f6', 
                    borderRadius: '6px',
                    color: '#374151',
                    fontSize: '0.875rem'
                  }}>
                    {prescription.history}
                  </p>
                </div>
              )}

              {/* Instructions */}
              {prescription.instructions && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#1f2937' }}>Instructions</h3>
                  <p style={{ 
                    margin: 0, 
                    padding: '0.75rem', 
                    background: '#dcfce7', 
                    borderRadius: '6px',
                    color: '#166534',
                    fontSize: '0.875rem'
                  }}>
                    {prescription.instructions}
                  </p>
                </div>
              )}

              {/* Visit Again */}
              {prescription.visitAgainAt && (
                <div style={{ 
                  padding: '0.75rem', 
                  background: '#fef3c7', 
                  borderRadius: '6px',
                  border: '1px solid #fbbf24'
                }}>
                  <p style={{ margin: 0, color: '#92400e', fontSize: '0.875rem' }}>
                    <strong>Follow-up Visit:</strong> {new Date(prescription.visitAgainAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  // Lab Test Booking Modal Component
  const LabTestBookingModal = () => {
    if (!showLabTestModal) return null;

    const filteredTests = labTests.filter(test =>
      test.testName.toLowerCase().includes(labTestSearch.toLowerCase()) ||
      (test.department && test.department.toLowerCase().includes(labTestSearch.toLowerCase()))
    );

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
          maxWidth: '700px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          animation: 'slideIn 0.3s ease-out'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, color: '#1f2937' }}>🧪 Book Lab Test</h2>
            <button
              onClick={() => setShowLabTestModal(false)}
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

          {/* Step Indicator */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
            {[1, 2, 3].map(step => (
              <div key={step} style={{
                flex: 1,
                height: '4px',
                background: labTestStep >= step ? '#14b8a6' : '#e5e7eb',
                borderRadius: '2px',
                transition: 'all 0.3s'
              }} />
            ))}
          </div>

          {/* Step 1: Select Test */}
          {labTestStep === 1 && (
            <div>
              <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Step 1: Select Lab Test</h3>
              
              {/* Search */}
              <input
                type="text"
                placeholder="🔍 Search tests..."
                value={labTestSearch}
                onChange={(e) => setLabTestSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  fontSize: '1rem'
                }}
              />

              {/* Test List */}
              <div style={{ display: 'grid', gap: '0.75rem', maxHeight: '400px', overflow: 'auto' }}>
                {filteredTests.map(test => (
                  <div
                    key={test.id}
                    onClick={() => setSelectedTest(test)}
                    style={{
                      padding: '1rem',
                      border: `2px solid ${selectedTest?.id === test.id ? '#14b8a6' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: selectedTest?.id === test.id ? '#f0fdfa' : 'white',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: '600', color: '#1f2937' }}>{test.testName}</span>
                      <span style={{
                        background: '#14b8a6',
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.875rem',
                        fontWeight: '600'
                      }}>
                        ৳{test.price}
                      </span>
                    </div>
                    {test.department && (
                      <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                        📍 {test.department}
                      </p>
                    )}
                    {test.durationMinutes && (
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                        ⏱️ {test.durationMinutes} minutes
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => setLabTestStep(2)}
                disabled={!selectedTest}
                style={{
                  width: '100%',
                  marginTop: '1.5rem',
                  padding: '0.75rem',
                  background: selectedTest ? '#14b8a6' : '#d1d5db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: selectedTest ? 'pointer' : 'not-allowed'
                }}
              >
                Next: Select Technician →
              </button>
            </div>
          )}

          {/* Step 2: Select Technician */}
          {labTestStep === 2 && (
            <div>
              <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Step 2: Select Medical Technician (Optional)</h3>
              
              <div style={{ display: 'grid', gap: '0.75rem', maxHeight: '400px', overflow: 'auto' }}>
                {technicians.map(tech => (
                  <div
                    key={tech.id}
                    onClick={() => setSelectedTechnician(tech)}
                    style={{
                      padding: '1rem',
                      border: `2px solid ${selectedTechnician?.id === tech.id ? '#14b8a6' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: selectedTechnician?.id === tech.id ? '#f0fdfa' : 'white',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                      {tech.name}
                    </div>
                    {tech.department && (
                      <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                        🏥 {tech.department}
                      </p>
                    )}
                    {tech.experienceYears !== null && tech.experienceYears !== undefined && (
                      <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                        📊 {tech.experienceYears} {tech.experienceYears === 1 ? 'year' : 'years'} experience
                      </p>
                    )}
                    {tech.degrees && (
                      <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', color: '#6b7280' }}>
                        🎓 {tech.degrees}
                      </p>
                    )}
                    {tech.email && (
                      <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
                        📧 {tech.email}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  onClick={() => setLabTestStep(1)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: 'white',
                    color: '#6b7280',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ← Back
                </button>
                <button
                  onClick={handleConfirmLabTestBooking}
                  disabled={bookingLabTest}
                  style={{
                    flex: 2,
                    padding: '0.75rem',
                    background: '#14b8a6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: bookingLabTest ? 'not-allowed' : 'pointer'
                  }}
                >
                  {bookingLabTest ? 'Booking...' : 'Confirm Booking ✓'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {labTestStep === 3 && labTestToken && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
              <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>Lab Test Booked Successfully!</h3>
              
              <div style={{
                background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                padding: '2rem',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                color: 'white'
              }}>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', opacity: 0.9 }}>Your Token Number</p>
                <div
                  onClick={() => copyToClipboard(labTestToken.token)}
                  style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    letterSpacing: '2px',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    marginBottom: '0.5rem'
                  }}
                >
                  {labTestToken.token}
                </div>
                <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8 }}>Click to copy</p>
              </div>

              <div style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'left' }}>
                <p style={{ margin: '0 0 0.5rem 0', color: '#6b7280', fontSize: '0.875rem' }}>Test</p>
                <p style={{ margin: '0 0 1rem 0', fontWeight: '600', color: '#1f2937' }}>{labTestToken.testName}</p>
                
                {labTestToken.technicianName && (
                  <>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#6b7280', fontSize: '0.875rem' }}>Technician</p>
                    <p style={{ margin: '0 0 1rem 0', fontWeight: '600', color: '#1f2937' }}>{labTestToken.technicianName}</p>
                  </>
                )}
                
                <p style={{ margin: '0 0 0.5rem 0', color: '#6b7280', fontSize: '0.875rem' }}>Price</p>
                <p style={{ margin: 0, fontWeight: '600', color: '#14b8a6', fontSize: '1.25rem' }}>৳{labTestToken.price}</p>
              </div>

              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Please bring this token when you visit the lab.
              </p>

              <button
                onClick={() => {
                  setShowLabTestModal(false);
                  setActiveView('labTests');
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#14b8a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                View My Lab Tests
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Bed Booking Modal Component
  const BedBookingModal = () => {
    if (!showBedBookingModal) return null;

    const filteredBeds = availableBeds.filter(bed => {
      const matchWard = !bedFilter.ward || bed.wardName === bedFilter.ward;
      const matchType = !bedFilter.type || bed.bedType === bedFilter.type;
      const matchFloor = !bedFilter.floor || (bed.floorNumber && bed.floorNumber.toString() === bedFilter.floor);
      return matchWard && matchType && matchFloor;
    });

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
        zIndex: 1000
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ margin: 0, color: '#1f2937' }}>🛏️ Book Hospital Bed</h2>
            <button
              onClick={() => setShowBedBookingModal(false)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#6b7280'
              }}
            >
              ×
            </button>
          </div>

          {/* Filters */}
          <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <select
              value={bedFilter.ward}
              onChange={(e) => setBedFilter({...bedFilter, ward: e.target.value})}
              style={{
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="">All Wards</option>
              {[...new Set(availableBeds.map(b => b.wardName))].map(ward => (
                <option key={ward} value={ward}>{ward}</option>
              ))}
            </select>
            <select
              value={bedFilter.type}
              onChange={(e) => setBedFilter({...bedFilter, type: e.target.value})}
              style={{
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="">All Types</option>
              {[...new Set(availableBeds.map(b => b.bedType))].map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <select
              value={bedFilter.floor}
              onChange={(e) => setBedFilter({...bedFilter, floor: e.target.value})}
              style={{
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="">All Floors</option>
              {[...new Set(availableBeds.map(b => b.floorNumber).filter(f => f))].sort((a,b) => a-b).map(floor => (
                <option key={floor} value={floor}>Floor {floor}</option>
              ))}
            </select>
          </div>

          {/* Bed List */}
          <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
            {filteredBeds.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>No available beds found</p>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {filteredBeds.map(bed => (
                  <div
                    key={bed.id}
                    onClick={() => setSelectedBed(bed)}
                    style={{
                      padding: '1rem',
                      border: `2px solid ${selectedBed?.id === bed.id ? '#f59e0b' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: selectedBed?.id === bed.id ? '#fffbeb' : 'white',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#1f2937', fontSize: '1.1rem' }}>
                          Bed {bed.bedNumber}
                        </h3>
                        <p style={{ margin: '0.25rem 0', color: '#6b7280', fontSize: '14px' }}>
                          <strong>Ward:</strong> {bed.wardName}
                        </p>
                        <p style={{ margin: '0.25rem 0', color: '#6b7280', fontSize: '14px' }}>
                          <strong>Type:</strong> {bed.bedType}
                        </p>
                        {bed.floorNumber && (
                          <p style={{ margin: '0.25rem 0', color: '#6b7280', fontSize: '14px' }}>
                            <strong>Floor:</strong> {bed.floorNumber}
                          </p>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#f59e0b' }}>
                          ₹{bed.pricePerDay}
                        </p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>per day</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '1rem', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowBedBookingModal(false)}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                background: 'white',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmBedBooking}
              disabled={!selectedBed || bookingBed}
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '8px',
                background: selectedBed && !bookingBed ? '#f59e0b' : '#d1d5db',
                color: 'white',
                cursor: selectedBed && !bookingBed ? 'pointer' : 'not-allowed',
                fontWeight: '600'
              }}
            >
              {bookingBed ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="patient-dashboard-new">
      <Modal 
        show={showModal} 
        onClose={() => setShowModal(false)}
        type={modalMessage.type}
        title={modalMessage.title}
        message={modalMessage.message}
      />
      <PrescriptionModal
        show={showPrescriptionModal}
        onClose={() => setShowPrescriptionModal(false)}
        prescription={prescriptionData}
        loading={loadingPrescription}
      />
      <LabTestBookingModal />
      <BedBookingModal />
      {/* Header */}
      <header className="dashboard-header">
        <div className="logo" onClick={() => navigate('/')}>
          <span className="logo-icon">🏥</span>
          <span className="logo-text">DOCAPPOINTER</span>
        </div>
        
        <div className="profile-dropdown">
          <div className="profile-icon" onClick={() => setShowProfileMenu(!showProfileMenu)}>
            <span className="user-avatar">
              <UserAvatar gender={profileData.gender} size={40} />
            </span>
            <span className="user-name-header">{user?.name}</span>
            <span className="dropdown-arrow">▼</span>
          </div>
          
          {showProfileMenu && (
            <div className="profile-menu">
              <div className="profile-menu-item" onClick={() => { setActiveView('profile'); setShowProfileMenu(false); }}>
                <span>👤</span> View Profile
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
              className={`sidebar-item ${activeView === 'labTests' ? 'active' : ''}`}
              onClick={() => setActiveView('labTests')}
            >
              <span className="sidebar-icon">🧪</span>
              <span>My Lab Tests</span>
            </div>
            <div 
              className={`sidebar-item ${activeView === 'bedBookings' ? 'active' : ''}`}
              onClick={() => {
                setActiveView('bedBookings');
                fetchMyBedBookings();
              }}
            >
              <span className="sidebar-icon">🛏️</span>
              <span>My Bed Bookings</span>
            </div>
            <div 
              className={`sidebar-item ${activeView === 'book' ? 'active' : ''}`}
              onClick={() => navigate('/all-doctors')}
            >
              <span className="sidebar-icon book-icon">➕</span>
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
              
              {/* Today's Appointment Banner */}
              {todayAppointments.length > 0 && (
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  marginBottom: '2rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  animation: 'pulse 2s infinite'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontSize: '2.5rem' }}>📅</div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
                        You have {todayAppointments.length} appointment{todayAppointments.length > 1 ? 's' : ''} today!
                      </h3>
                      <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>
                        {todayAppointments[0].startTime || todayAppointments[0].slot} with Dr. {todayAppointments[0].doctorName}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Filter Tabs */}
              <div style={{ 
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
                ].map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => setAppointmentFilter(filter.key)}
                    style={{
                      padding: '0.75rem 1.25rem',
                      border: appointmentFilter === filter.key ? `2px solid ${filter.color}` : '2px solid transparent',
                      background: appointmentFilter === filter.key ? `${filter.color}15` : 'white',
                      color: appointmentFilter === filter.key ? filter.color : '#6b7280',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: appointmentFilter === filter.key ? '600' : '500',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                    onMouseOver={(e) => {
                      if (appointmentFilter !== filter.key) {
                        e.target.style.background = '#f3f4f6';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (appointmentFilter !== filter.key) {
                        e.target.style.background = 'white';
                      }
                    }}
                  >
                    <span>{filter.icon}</span>
                    <span>{filter.label}</span>
                    <span style={{
                      background: appointmentFilter === filter.key ? filter.color : '#e5e7eb',
                      color: appointmentFilter === filter.key ? 'white' : '#6b7280',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {appointmentCounts[filter.key]}
                    </span>
                  </button>
                ))}
              </div>
              
              {loading ? (
                <div className="loading">Loading appointments...</div>
              ) : filteredAppointments.length === 0 ? (
                <div className="no-data">
                  <p>No {appointmentFilter !== 'all' ? appointmentFilter : ''} appointments found</p>
                  {appointmentFilter === 'all' && (
                    <button className="btn-book-new" onClick={() => navigate('/all-doctors')}>
                      Book Your First Appointment
                    </button>
                  )}
                </div>
              ) : (
                <div className="appointments-list" style={{ display: 'grid', gap: '1rem' }}>
                  {filteredAppointments.map((apt) => {
                    const isToday = new Date(apt.appointmentDate).toDateString() === new Date().toDateString();
                    const statusColors = {
                      'BOOKED': { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' },
                      'COMPLETED': { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
                      'CANCELLED': { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' }
                    };
                    const colors = statusColors[apt.status] || statusColors['BOOKED'];
                    
                    return (
                      <div key={apt.appointmentId} style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        border: `2px solid ${isToday ? '#fbbf24' : '#e5e7eb'}`,
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        {isToday && (
                          <div style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            background: '#fbbf24',
                            color: 'white',
                            padding: '0.25rem 0.75rem',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            borderBottomLeftRadius: '8px'
                          }}>
                            TODAY
                          </div>
                        )}
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1f2937' }}>
                              Dr. {apt.doctorName}
                            </h3>
                            <p style={{ margin: '0.25rem 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
                              {apt.doctorEmail}
                            </p>
                          </div>
                          <span style={{
                            background: colors.bg,
                            color: colors.text,
                            padding: '0.5rem 1rem',
                            borderRadius: '20px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            border: `1px solid ${colors.border}`
                          }}>
                            {apt.status}
                          </span>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                          <div>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Date</p>
                            <p style={{ margin: '0.25rem 0 0 0', fontWeight: '600', color: '#1f2937' }}>
                              {new Date(apt.appointmentDate).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </p>
                          </div>
                          <div>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Time</p>
                            <p style={{ margin: '0.25rem 0 0 0', fontWeight: '600', color: '#1f2937' }}>
                              {apt.startTime && apt.endTime ? `${apt.startTime} - ${apt.endTime}` : apt.slot}
                            </p>
                          </div>
                        </div>
                        
                        {apt.status === 'BOOKED' && (
                          <button
                            onClick={() => handleCancelAppointment(apt.appointmentId)}
                            disabled={loading}
                            style={{
                              width: '100%',
                              background: '#fee2e2',
                              color: '#991b1b',
                              border: '1px solid #fecaca',
                              padding: '0.75rem',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.background = '#fecaca'}
                            onMouseOut={(e) => e.target.style.background = '#fee2e2'}
                          >
                            Cancel Appointment
                          </button>
                        )}
                        
                        {apt.hasPrescription && (
                          <button
                            onClick={() => handleViewPrescription(apt.prescriptionId)}
                            style={{
                              width: '100%',
                              background: '#dbeafe',
                              color: '#1e40af',
                              border: '1px solid #3b82f6',
                              padding: '0.75rem',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              transition: 'all 0.2s',
                              marginTop: apt.status === 'BOOKED' ? '0.5rem' : '0'
                            }}
                            onMouseOver={(e) => e.target.style.background = '#bfdbfe'}
                            onMouseOut={(e) => e.target.style.background = '#dbeafe'}
                          >
                            📄 View Prescription
                          </button>
                        )}
                        
                        {apt.status !== 'CANCELLED' && (<div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '1fr 1fr', 
                          gap: '0.5rem', 
                          marginTop: '0.5rem' 
                        }}>
                          <button
                            onClick={() => handleBookLabTest(apt.appointmentId)}
                            style={{
                              background: '#ccfbf1',
                              color: '#115e59',
                              border: '1px solid #14b8a6',
                              padding: '0.75rem',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.background = '#99f6e4'}
                            onMouseOut={(e) => e.target.style.background = '#ccfbf1'}
                          >
                            🧪 Book Lab Test
                          </button>

                          <button
                            onClick={() => handleBookBed(apt.appointmentId)}
                            style={{
                              background: '#fef3c7',
                              color: '#92400e',
                              border: '1px solid #f59e0b',
                              padding: '0.75rem',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.background = '#fde68a'}
                            onMouseOut={(e) => e.target.style.background = '#fef3c7'}
                          >
                            🛏️ Book Bed
                          </button>
                        </div>)}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* My Bed Bookings View */}
          {activeView === 'bedBookings' && (
            <div className="bed-bookings-view">
              <h1>My Bed Bookings</h1>
              
              {myBedBookings.length === 0 ? (
                <div className="no-data">
                  <p>No bed bookings yet</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {myBedBookings.map((booking) => (
                    <div key={booking.id} style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      border: '2px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1f2937' }}>
                            🛏️ Bed {booking.bedNumber}
                          </h3>
                          <p style={{ margin: '0.25rem 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
                            📍 {booking.wardName}
                          </p>
                        </div>
                        <span style={{
                          background: booking.status === 'BOOKED' ? '#dbeafe' : '#d1fae5',
                          color: booking.status === 'BOOKED' ? '#1e40af' : '#065f46',
                          padding: '0.5rem 1rem',
                          borderRadius: '20px',
                          fontSize: '0.875rem',
                          fontWeight: '600'
                        }}>
                          {booking.status}
                        </span>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Bed Type</p>
                          <p style={{ margin: '0.25rem 0 0 0', fontWeight: '600', color: '#1f2937' }}>
                            {booking.bedType}
                          </p>
                        </div>
                        {booking.floorNumber && (
                          <div>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Floor</p>
                            <p style={{ margin: '0.25rem 0 0 0', fontWeight: '600', color: '#1f2937' }}>
                              Floor {booking.floorNumber}
                            </p>
                          </div>
                        )}
                        <div>
                          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Price Per Day</p>
                          <p style={{ margin: '0.25rem 0 0 0', fontWeight: '600', color: '#f59e0b', fontSize: '1.1rem' }}>
                            ₹{booking.pricePerDay}
                          </p>
                        </div>
                        <div>
                          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Appointment Date</p>
                          <p style={{ margin: '0.25rem 0 0 0', fontWeight: '600', color: '#1f2937' }}>
                            {new Date(booking.appointmentDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
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
                  <div className="profile-avatar-large">
                    <UserAvatar gender={profileData.gender} size={120} />
                  </div>
                  <div className="profile-info">
                    <div className="info-row">
                      <label>Name:</label>
                      <span>{profileData.name || user?.name || 'Not provided'}</span>
                    </div>
                    <div className="info-row">
                      <label>Email:</label>
                      <span>{profileData.email || user?.email || 'Not provided'}</span>
                    </div>
                    <div className="info-row">
                      <label>Phone:</label>
                      <span>{profileData.phone || user?.phone || 'Not provided'}</span>
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

          {/* My Lab Tests View */}
          {activeView === 'labTests' && (
            <div className="lab-tests-view">
              <h1>My Lab Tests</h1>
              
              {myLabTests.length === 0 ? (
                <div className="no-data">
                  <p>No lab tests booked yet</p>
                  <button className="btn-book-new" onClick={handleBookLabTest}>
                    Book Your First Lab Test
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {myLabTests.map((test) => (
                    <div key={test.id} style={{
                      background: 'white',
                      borderRadius: '12px',
                      padding: '1.5rem',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      border: '2px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#1f2937' }}>
                            🧪 {test.testName}
                          </h3>
                          {test.department && (
                            <p style={{ margin: '0.25rem 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
                              📍 {test.department}
                            </p>
                          )}
                        </div>
                        <span style={{
                          background: '#fef3c7',
                          color: '#92400e',
                          padding: '0.5rem 1rem',
                          borderRadius: '20px',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          border: '1px solid #fbbf24'
                        }}>
                          {test.status || 'PENDING'}
                        </span>
                      </div>
                      
                      <div style={{ 
                        background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        color: 'white'
                      }}>
                        <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', opacity: 0.9 }}>Token Number</p>
                        <div
                          onClick={() => copyToClipboard(test.token)}
                          style={{
                            fontSize: '1.5rem',
                            fontWeight: '700',
                            letterSpacing: '1px',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            background: 'rgba(255,255,255,0.2)',
                            borderRadius: '6px'
                          }}
                        >
                          {test.token}
                        </div>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', opacity: 0.8 }}>Click to copy</p>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                        {test.technicianName && (
                          <div>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Technician</p>
                            <p style={{ margin: '0.25rem 0 0 0', fontWeight: '600', color: '#1f2937' }}>
                              {test.technicianName}
                            </p>
                          </div>
                        )}
                        <div>
                          <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>Price</p>
                          <p style={{ margin: '0.25rem 0 0 0', fontWeight: '600', color: '#14b8a6', fontSize: '1.125rem' }}>
                            ৳{test.price}
                          </p>
                        </div>
                      </div>
                      
                      {test.status === 'COMPLETED' && test.testFileUrl && (
                        <div style={{
                          marginTop: '1rem',
                          padding: '1rem',
                          background: '#d1fae5',
                          borderRadius: '8px',
                          border: '1px solid #10b981'
                        }}>
                          <p style={{ margin: '0 0 0.5rem 0', color: '#065f46', fontWeight: '600', fontSize: '0.875rem' }}>
                            ✅ Test Result Available
                          </p>
                          <a
                            href={test.testFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-block',
                              padding: '0.5rem 1rem',
                              background: '#10b981',
                              color: 'white',
                              borderRadius: '6px',
                              textDecoration: 'none',
                              fontSize: '0.875rem',
                              fontWeight: '600'
                            }}
                          >
                            📄 View Test Result
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
