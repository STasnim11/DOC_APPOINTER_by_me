import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ClearStorage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear everything
    localStorage.clear();
    
    // Show message
    alert('Storage cleared! You can now login again.');
    
    // Redirect to login
    navigate('/login');
  }, [navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '20px'
    }}>
      Clearing storage and redirecting to login...
    </div>
  );
}
