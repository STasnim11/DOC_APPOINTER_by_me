import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Management.css';

export default function MedicineManagement() {
  const navigate = useNavigate();
  const [view, setView] = useState('list'); // 'list', 'add', 'edit'
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    manufacturer: '',
    price: '',
    stockQuantity: '',
    expiryDate: '',
    category: ''
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = user.role ? user.role.toUpperCase() : '';
    
    if (userRole !== 'ADMIN') {
      navigate('/login');
      return;
    }
    fetchMedicines();
  }, [navigate]);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/admin/medicines');
      const data = await response.json();
      if (data.success) {
        setMedicines(data.medicines);
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
      alert('❌ Unable to load medicines. Please check your connection.');
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
      const url = editingMedicine 
        ? `http://localhost:3000/api/admin/medicines/${editingMedicine.id}`
        : 'http://localhost:3000/api/admin/medicines';
      
      const response = await fetch(url, {
        method: editingMedicine ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        alert('✅ ' + data.message);
        resetForm();
        setView('list');
        fetchMedicines();
      } else {
        alert('❌ ' + (data.message || 'Operation failed'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Unable to save medicine. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (medicine) => {
    setEditingMedicine(medicine);
    setFormData({
      name: medicine.name,
      description: medicine.description || '',
      manufacturer: medicine.manufacturer || '',
      price: medicine.price,
      stockQuantity: medicine.stockQuantity,
      expiryDate: medicine.expiryDate || '',
      category: medicine.category || ''
    });
    setView('edit');
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this medicine?')) return;

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/admin/medicines/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        alert('✅ ' + data.message);
        fetchMedicines();
      } else {
        alert('❌ ' + (data.message || 'Delete failed'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Unable to delete medicine. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      manufacturer: '',
      price: '',
      stockQuantity: '',
      expiryDate: '',
      category: ''
    });
    setEditingMedicine(null);
  };

  return (
    <div className="management-container">
      <header className="management-header">
        <button onClick={() => navigate('/admin/dashboard')} className="back-btn">← Back</button>
        <h1>Medicine Management</h1>
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
            Add Medicine
          </button>
        </div>
      </header>

      {view === 'list' && (
        <div className="list-view">
          {loading ? (
            <p>Loading...</p>
          ) : medicines.length === 0 ? (
            <p className="empty-message">No medicines found. Add your first medicine!</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Manufacturer</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Expiry Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map(medicine => (
                    <tr key={medicine.id}>
                      <td>{medicine.name}</td>
                      <td>{medicine.manufacturer || 'N/A'}</td>
                      <td>{medicine.category || 'N/A'}</td>
                      <td>${medicine.price}</td>
                      <td>{medicine.stockQuantity}</td>
                      <td>{medicine.expiryDate || 'N/A'}</td>
                      <td className="action-buttons">
                        <button onClick={() => handleEdit(medicine)} className="edit-btn">Edit</button>
                        <button onClick={() => handleDelete(medicine.id)} className="delete-btn">Delete</button>
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
          <h2>{editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}</h2>
          <form onSubmit={handleSubmit} className="management-form">
            <div className="form-group">
              <label>Medicine Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Manufacturer</label>
                <input
                  type="text"
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="e.g., Antibiotic, Painkiller"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Price *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label>Stock Quantity</label>
                <input
                  type="number"
                  name="stockQuantity"
                  value={formData.stockQuantity}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Expiry Date</label>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Saving...' : editingMedicine ? 'Update Medicine' : 'Add Medicine'}
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
