import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css";

export default function DoctorLicenseVerification() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userData.token || userData.role?.toUpperCase() !== 'DOCTOR') {
      navigate('/login');
      return;
    }
    setUser(userData);
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    // Get fresh user data from localStorage
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!userData.email || !userData.token) {
      setMessage('Session expired. Please login again.');
      setLoading(false);
      navigate('/login');
      return;
    }

    const trimmedLicense = licenseNumber.trim().toUpperCase();

    // Validate format
    if (trimmedLicense.length < 5 || trimmedLicense.length > 20) {
      setMessage('License must be 5-20 characters long');
      setLoading(false);
      return;
    }

    if (!/^[A-Z0-9]+$/.test(trimmedLicense)) {
      setMessage('License can only contain letters and numbers (no spaces or special characters)');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/api/doctor/license', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData.token}`
        },
        body: JSON.stringify({
          email: userData.email,
          licenseNumber: trimmedLicense
        })
      });

      const result = await res.json();

      if (res.ok) {
        setMessage(result.message);
        setTimeout(() => {
          navigate('/doctor/dashboard');
        }, 1500);
      } else {
        setMessage(result.error || 'Failed to verify license');
      }
    } catch (err) {
      console.error('Error submitting license:', err);
      setMessage('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-left">
          <div className="auth-logo">
            <span className="auth-logo-icon">🏥</span>
            <span>DOCAPPOINTER</span>
          </div>
          <h1 className="auth-title">License Verification</h1>
          <p className="auth-subtitle">
            To ensure the safety and quality of care, we need to verify your medical license before you can access the dashboard.
          </p>
          <div className="auth-features">
            <div className="auth-feature">
              <div className="auth-feature-icon">🔒</div>
              <span>Secure verification process</span>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">⚡</div>
              <span>Quick validation</span>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">✅</div>
              <span>Required for dashboard access</span>
            </div>
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-card">
            <div className="auth-card-header">
              <h2 className="auth-card-title">Medical License Required</h2>
              <p className="auth-card-subtitle">Please provide your medical license number to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="auth-input-group">
                <label className="auth-input-label">Medical License Number</label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value.toUpperCase())}
                  placeholder="Enter your license number (e.g., MD12345)"
                  maxLength="20"
                  required
                  autoFocus
                  className="auth-input"
                  style={{ fontFamily: 'Courier New, monospace', letterSpacing: '1px' }}
                />
                <small style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem', display: 'block' }}>
                  5-20 alphanumeric characters (letters and numbers only)
                </small>
              </div>

              <button 
                type="submit" 
                className="auth-submit-btn"
                disabled={loading || !licenseNumber}
              >
                {loading ? 'Verifying...' : 'Verify License'}
              </button>

              {message && (
                <div className={`auth-message ${message.includes('successfully') || message.includes('updated') ? 'success' : 'error'}`}>
                  {message}
                </div>
              )}
            </form>

            <div className="auth-footer">
              <button 
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '0.95rem'
                }}
              >
                Logout
              </button>
            </div>

            <div style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              padding: '1rem',
              marginTop: '1.5rem'
            }}>
              <p style={{ margin: '0.5rem 0', color: '#1e40af', fontSize: '0.875rem', fontWeight: '600' }}>
                📋 Valid License Examples:
              </p>
              <p style={{ margin: '0.5rem 0 0.5rem 1rem', color: '#1e40af', fontSize: '0.875rem', fontFamily: 'Courier New, monospace' }}>
                • MD12345 &nbsp;&nbsp; • DOC987654 &nbsp;&nbsp; • MBBS123456
              </p>
              <p style={{ margin: '0.5rem 0 0.5rem 1rem', color: '#1e40af', fontSize: '0.875rem', fontFamily: 'Courier New, monospace' }}>
                • LICENSE2024 &nbsp;&nbsp; • PHYSICIAN001
              </p>
              <p style={{ margin: '1rem 0 0.5rem 0', color: '#1e40af', fontSize: '0.875rem' }}>
                ⚠️ Your license number will be validated
              </p>
              <p style={{ margin: '0.5rem 0 0 0', color: '#1e40af', fontSize: '0.875rem' }}>
                🔒 Must be unique - no two doctors can have the same license
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
