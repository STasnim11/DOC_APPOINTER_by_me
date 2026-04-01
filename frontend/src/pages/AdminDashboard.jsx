import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import '../styles/AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = user.role ? user.role.toUpperCase() : '';
    
    if (userRole !== 'ADMIN') {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const cards = [
    {
      title: 'Medicines',
      description: 'Manage hospital medicines inventory',
      icon: '💊',
      path: '/admin/medicines',
      color: '#4CAF50'
    },
    {
      title: 'Lab Tests',
      description: 'Manage laboratory tests and services',
      icon: '🔬',
      path: '/admin/lab-tests',
      color: '#2196F3'
    },
    {
      title: 'Beds',
      description: 'Manage hospital bed allocation',
      icon: '🛏️',
      path: '/admin/beds',
      color: '#FF9800'
    },
    {
      title: 'Doctors',
      description: 'View and manage doctor profiles',
      icon: '👨‍⚕️',
      path: '/admin/doctors',
      color: '#9C27B0'
    },
    {
      title: 'Patients',
      description: 'View and manage patient records',
      icon: '🏥',
      path: '/admin/patients',
      color: '#F44336'
    },
    {
      title: 'Appointments',
      description: 'View all hospital appointments',
      icon: '📅',
      path: '/admin/appointments',
      color: '#00BCD4'
    }
  ];

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </header>

      <div className="dashboard-grid">
        {cards.map((card, index) => (
          <div 
            key={index}
            className="dashboard-card"
            onClick={() => navigate(card.path)}
            style={{ borderTopColor: card.color }}
          >
            <div className="card-icon">{card.icon}</div>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
