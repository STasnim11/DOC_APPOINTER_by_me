import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PatientSetup() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    dateOfBirth: '',
    gender: '',
    occupation: '',
    bloodType: '',
    maritalStatus: '',
    address: ''
  });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userData.email || userData.role?.toUpperCase() !== 'PATIENT') {
      navigate('/login');
      return;
    }
    setUser(userData);
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Get fresh user data from localStorage
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!userData.email || !userData.token) {
        setMessage('Session expired. Please login again.');
        setLoading(false);
        navigate('/login');
        return;
      }

      console.log('Fetching user profile for:', userData.email);
      const userResult = await fetch(`http://localhost:3000/api/profile/${userData.email}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData.token}`
        }
      });
      
      if (!userResult.ok) {
        setMessage('Failed to get user ID');
        setLoading(false);
        return;
      }

      const userProfile = await userResult.json();
      console.log('User data received:', userProfile);
      
      const userId = userProfile.id;
      console.log('User ID:', userId);

      if (!userId) {
        setMessage('User ID not found');
        setLoading(false);
        return;
      }

      const payload = {
        userId,
        ...formData
      };
      console.log('Sending payload:', payload);

      const res = await fetch('http://localhost:3000/api/patient-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData.token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      console.log('Response:', result);

      if (res.ok) {
        setMessage('Profile setup complete!');
        setTimeout(() => {
          navigate('/patient/dashboard');
        }, 1000);
      } else {
        setMessage((result.error || 'Failed to setup profile'));
      }
    } catch (err) {
      console.error('Error setting up profile:', err);
      setMessage('Server error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/patient/dashboard');
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        background: 'white',
        padding: '2.5rem',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        maxWidth: '600px',
        width: '100%'
      }}>
        <h2 style={{ 
          textAlign: 'center', 
          marginBottom: '0.5rem',
          color: '#1f2937',
          fontSize: '1.75rem'
        }}>
          Complete Your Profile
        </h2>
        <p style={{ 
          textAlign: 'center', 
          color: '#6b7280',
          marginBottom: '2rem'
        }}>
          Welcome {user?.name}! Fill in your information to get started.
        </p>

        {message && (
          <div style={{
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            background: message.includes('complete') || message.includes('successfully') ? '#d1fae5' : '#fee2e2',
            color: message.includes('complete') || message.includes('successfully') ? '#065f46' : '#991b1b',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
              Date of Birth
            </label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
              Gender
            </label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
              Blood Type
            </label>
            <select
              value={formData.bloodType}
              onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
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

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
              Occupation
            </label>
            <input
              type="text"
              value={formData.occupation}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              placeholder="e.g., Software Engineer"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
              Marital Status
            </label>
            <select
              value={formData.maritalStatus}
              onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            >
              <option value="">Select Status</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed">Widowed</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter your address"
              rows="3"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              onClick={handleSkip}
              style={{
                flex: 1,
                padding: '0.875rem',
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = '#e5e7eb'}
              onMouseOut={(e) => e.target.style.background = '#f3f4f6'}
            >
              Skip for Now
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.875rem',
                background: loading ? '#9ca3af' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => !loading && (e.target.style.background = '#1d4ed8')}
              onMouseOut={(e) => !loading && (e.target.style.background = '#2563eb')}
            >
              {loading ? 'Saving...' : 'Complete Setup'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}