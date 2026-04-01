import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Management.css';

export default function LabTestManagement() {
  const navigate = useNavigate();
  const [view, setView] = useState('list');
  const [labTests, setLabTests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [formData, setFormData] = useState({
    testName: '',
    description: '',
    price: '',
    department: '',
    preparationRequired: '',
    durationMinutes: ''
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = user.role ? user.role.toUpperCase() : '';
    
    if (userRole !== 'ADMIN') {
      navigate('/login');
      return;
    }
    fetchLabTests();
  }, [navigate]);

  const fetchLabTests = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/admin/lab-tests');
      const data = await response.json();
      if (data.success) {
        setLabTests(data.labTests);
      }
    } catch (error) {
      console.error('Error fetching lab tests:', error);
      alert('❌ Unable to load lab tests. Please check your connection.');
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
      const url = editingTest 
        ? `http://localhost:3000/api/admin/lab-tests/${editingTest.id}`
        : 'http://localhost:3000/api/admin/lab-tests';
      
      const response = await fetch(url, {
        method: editingTest ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        alert('✅ ' + data.message);
        resetForm();
        setView('list');
        fetchLabTests();
      } else {
        alert('❌ ' + (data.message || 'Operation failed'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Unable to save lab test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (test) => {
    setEditingTest(test);
    setFormData({
      testName: test.testName,
      description: test.description || '',
      price: test.price,
      department: test.department || '',
      preparationRequired: test.preparationRequired || '',
      durationMinutes: test.durationMinutes || ''
    });
    setView('edit');
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this lab test?')) return;

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/admin/lab-tests/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        alert('✅ ' + data.message);
        fetchLabTests();
      } else {
        alert('❌ ' + (data.message || 'Delete failed'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Unable to delete lab test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      testName: '',
      description: '',
      price: '',
      department: '',
      preparationRequired: '',
      durationMinutes: ''
    });
    setEditingTest(null);
  };

  return (
    <div className="management-container">
      <header className="management-header">
        <button onClick={() => navigate('/admin/dashboard')} className="back-btn">← Back</button>
        <h1>Lab Test Management</h1>
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
            Add Lab Test
          </button>
        </div>
      </header>

      {view === 'list' && (
        <div className="list-view">
          {loading ? (
            <p>Loading...</p>
          ) : labTests.length === 0 ? (
            <p className="empty-message">No lab tests found. Add your first lab test!</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Test Name</th>
                    <th>Department</th>
                    <th>Price</th>
                    <th>Duration (min)</th>
                    <th>Preparation</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {labTests.map(test => (
                    <tr key={test.id}>
                      <td>{test.testName}</td>
                      <td>{test.department || 'N/A'}</td>
                      <td>${test.price}</td>
                      <td>{test.durationMinutes || 'N/A'}</td>
                      <td>{test.preparationRequired || 'None'}</td>
                      <td className="action-buttons">
                        <button onClick={() => handleEdit(test)} className="edit-btn">Edit</button>
                        <button onClick={() => handleDelete(test.id)} className="delete-btn">Delete</button>
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
          <h2>{editingTest ? 'Edit Lab Test' : 'Add New Lab Test'}</h2>
          <form onSubmit={handleSubmit} className="management-form">
            <div className="form-group">
              <label>Test Name *</label>
              <input
                type="text"
                name="testName"
                value={formData.testName}
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
                <label>Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  placeholder="e.g., Pathology, Radiology"
                />
              </div>

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
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Duration (minutes)</label>
                <input
                  type="number"
                  name="durationMinutes"
                  value={formData.durationMinutes}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Preparation Required</label>
                <input
                  type="text"
                  name="preparationRequired"
                  value={formData.preparationRequired}
                  onChange={handleInputChange}
                  placeholder="e.g., Fasting required"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Saving...' : editingTest ? 'Update Lab Test' : 'Add Lab Test'}
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
