import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Management.css';

export default function BedManagement() {
  const navigate = useNavigate();
  const [view, setView] = useState('list');
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingBed, setEditingBed] = useState(null);
  const [formData, setFormData] = useState({
    bedNumber: '',
    wardName: '',
    bedType: '',
    pricePerDay: '',
    status: 'available',
    floorNumber: ''
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = user.role ? user.role.toUpperCase() : '';
    
    if (userRole !== 'ADMIN') {
      navigate('/login');
      return;
    }
    fetchBeds();
  }, [navigate]);

  const fetchBeds = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/admin/beds');
      const data = await response.json();
      if (data.success) {
        setBeds(data.beds);
      }
    } catch (error) {
      console.error('Error fetching beds:', error);
      alert('❌ Unable to load beds. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingBed 
        ? `http://localhost:3000/api/admin/beds/${editingBed.id}`
        : 'http://localhost:3000/api/admin/beds';
      
      const response = await fetch(url, {
        method: editingBed ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        alert('✅ ' + data.message);
        resetForm();
        setView('list');
        fetchBeds();
      } else {
        alert('❌ ' + (data.message || 'Operation failed'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Unable to save bed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (bed) => {
    setEditingBed(bed);
    setFormData({
      bedNumber: bed.bedNumber,
      wardName: bed.wardName,
      bedType: bed.bedType,
      pricePerDay: bed.pricePerDay,
      status: bed.status,
      floorNumber: bed.floorNumber || ''
    });
    setView('edit');
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this bed?')) return;

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/admin/beds/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        alert('✅ ' + data.message);
        fetchBeds();
      } else {
        alert('❌ ' + (data.message || 'Delete failed'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Unable to delete bed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      bedNumber: '',
      wardName: '',
      bedType: '',
      pricePerDay: '',
      status: 'available',
      floorNumber: ''
    });
    setEditingBed(null);
  };

  const getStatusBadge = (status) => {
    const colors = {
      available: '#4CAF50',
      occupied: '#f44336',
      maintenance: '#FF9800'
    };
    return (
      <span style={{ 
        background: colors[status], 
        color: 'white', 
        padding: '4px 12px', 
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="management-container">
      <header className="management-header">
        <button onClick={() => navigate('/admin/dashboard')} className="back-btn">← Back</button>
        <h1>Bed Management</h1>
        <div className="header-actions">
          <button 
            onClick={() => { setView('list'); resetForm(); }} 
            className={view === 'list' ? 'active' : ''}
          >
            View All
          </button>
          <button 
            onClick={() => { setView('add'); resetForm(); }} 
            className={view === 'add' ? 'active' : ''}
          >
            Add Bed
          </button>
        </div>
      </header>

      {view === 'list' && (
        <div className="list-view">
          {loading ? (
            <p>Loading...</p>
          ) : beds.length === 0 ? (
            <p className="empty-message">No beds found. Add your first bed!</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Bed Number</th>
                    <th>Ward</th>
                    <th>Type</th>
                    <th>Floor</th>
                    <th>Price/Day</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {beds.map(bed => (
                    <tr key={bed.id}>
                      <td>{bed.bedNumber}</td>
                      <td>{bed.wardName}</td>
                      <td>{bed.bedType}</td>
                      <td>{bed.floorNumber || 'N/A'}</td>
                      <td>${bed.pricePerDay}</td>
                      <td>{getStatusBadge(bed.status)}</td>
                      <td className="action-buttons">
                        <button onClick={() => handleEdit(bed)} className="edit-btn">Edit</button>
                        <button onClick={() => handleDelete(bed.id)} className="delete-btn">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {(view === 'add' || view === 'edit') && (
        <div className="form-view">
          <h2>{editingBed ? 'Edit Bed' : 'Add New Bed'}</h2>
          <form onSubmit={handleSubmit} className="management-form">
            <div className="form-row">
              <div className="form-group">
                <label>Bed Number *</label>
                <input
                  type="text"
                  name="bedNumber"
                  value={formData.bedNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., B-101"
                  required
                />
              </div>

              <div className="form-group">
                <label>Ward Name *</label>
                <input
                  type="text"
                  name="wardName"
                  value={formData.wardName}
                  onChange={handleInputChange}
                  placeholder="e.g., ICU, General Ward"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Bed Type *</label>
                <select
                  name="bedType"
                  value={formData.bedType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="General">General</option>
                  <option value="ICU">ICU</option>
                  <option value="Private">Private</option>
                  <option value="Semi-Private">Semi-Private</option>
                  <option value="Deluxe">Deluxe</option>
                </select>
              </div>

              <div className="form-group">
                <label>Floor Number</label>
                <input
                  type="number"
                  name="floorNumber"
                  value={formData.floorNumber}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Price Per Day *</label>
                <input
                  type="number"
                  name="pricePerDay"
                  value={formData.pricePerDay}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label>Status *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Saving...' : editingBed ? 'Update Bed' : 'Add Bed'}
              </button>
              <button 
                type="button" 
                onClick={() => { setView('list'); resetForm(); }} 
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
