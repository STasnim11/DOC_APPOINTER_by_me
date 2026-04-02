import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import '../styles/AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [selectedModule, setSelectedModule] = useState(null);
  const [activeView, setActiveView] = useState('view');
  const [showSubSidebar, setShowSubSidebar] = useState(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = user.role ? user.role.toUpperCase() : '';
    
    console.log('User from localStorage:', user);
    console.log('Has token:', !!user.token);
    
    if (userRole !== 'ADMIN') {
      console.log('Not admin, redirecting to login');
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const modules = [
    { id: 'branch-contacts', name: 'Branch Contacts', icon: '📞', path: '/admin/branch-contacts' },
    { id: 'hospital-branches', name: 'Hospital Branches', icon: '🏢', path: '/admin/hospital-branches' },
    { id: 'medical-technician', name: 'Medical Technician', icon: '👨‍🔬', path: '/admin/medical-technician' },
    { id: 'beds', name: 'Beds', icon: '🛏️', path: '/admin/beds' },
    { id: 'tests', name: 'Lab Tests', icon: '🔬', path: '/admin/lab-tests' },
    { id: 'doctors', name: 'Doctors', icon: '👨‍⚕️', path: '/admin/doctors' },
    { id: 'medicines', name: 'Medicines', icon: '💊', path: '/admin/medicines' },
    { id: 'appointments', name: 'Appointments', icon: '📅', path: '/admin/appointments' },
    { id: 'departments', name: 'Departments', icon: '🏥', path: '/admin/departments' }
  ];

  const handleModuleClick = (module) => {
    setSelectedModule(module);
    setShowSubSidebar(true);
    setActiveView('view');
    setMessage('');
    fetchData(module.id);
  };

  const handleSubAction = (action) => {
    setActiveView(action);
    setMessage('');
    if (action === 'add') {
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({});
    setEditingId(null);
  };

  const handleCancel = () => {
    setActiveView('view');
    resetForm();
    setMessage('');
  };

  const handleEdit = (item) => {
    setFormData(item);
    setEditingId(item.id);
    setActiveView('add');
    setMessage('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = user.token;

      const endpoints = {
        'branch-contacts': '/api/admin/branch-contacts',
        'hospital-branches': '/api/admin/hospital-branches',
        'medical-technician': '/api/admin/medical-technicians',
        'departments': '/api/admin/departments',
        'beds': '/api/admin/beds',
        'tests': '/api/admin/lab-tests',
        'medicines': '/api/admin/medicines'
      };

      const endpoint = endpoints[selectedModule.id];
      const res = await fetch(`http://localhost:3000${endpoint}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setMessage('✅ Deleted successfully!');
        fetchData(selectedModule.id);
        setTimeout(() => setMessage(''), 2000);
      } else {
        const result = await res.json();
        setMessage('❌ ' + (result.error || 'Failed to delete'));
      }
    } catch (err) {
      console.error('Error deleting:', err);
      setMessage('❌ Server error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const fetchData = async (moduleId) => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = user.token;
      
      console.log('Fetching data for:', moduleId);
      console.log('Token exists:', !!token);
      
      if (!token) {
        setMessage('❌ Please login again - no token found');
        setData([]);
        setLoading(false);
        return;
      }

      const endpoints = {
        'branch-contacts': '/api/admin/branch-contacts',
        'hospital-branches': '/api/admin/hospital-branches',
        'medical-technician': '/api/admin/medical-technicians',
        'departments': '/api/admin/departments',
        'beds': '/api/admin/beds',
        'tests': '/api/admin/lab-tests',
        'medicines': '/api/admin/medicines'
      };

      const endpoint = endpoints[moduleId];
      if (!endpoint) {
        setData([]);
        setLoading(false);
        return;
      }

      console.log('Calling endpoint:', endpoint);

      const res = await fetch(`http://localhost:3000${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('Response status:', res.status);

      if (res.ok) {
        const result = await res.json();
        console.log('Response data:', result);
        
        // Handle different response formats
        if (result.beds) setData(result.beds);
        else if (result.labTests) setData(result.labTests);
        else if (result.medicines) setData(result.medicines);
        else if (result.contacts) setData(result.contacts);
        else if (result.branches) setData(result.branches);
        else if (result.technicians) setData(result.technicians);
        else if (result.departments) setData(result.departments);
        else setData([]);
      } else {
        const error = await res.json();
        console.error('Error response:', error);
        setMessage('❌ Failed to fetch data: ' + (error.error || error.message || 'Unknown error'));
        setData([]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setMessage('❌ Error loading data: ' + err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = user.token;
      
      if (!token) {
        setMessage('Please login again');
        setLoading(false);
        return;
      }

      const endpoints = {
        'branch-contacts': '/api/admin/branch-contacts',
        'hospital-branches': '/api/admin/hospital-branches',
        'medical-technician': '/api/admin/medical-technicians',
        'departments': '/api/admin/departments',
        'beds': '/api/admin/beds',
        'tests': '/api/admin/lab-tests',
        'medicines': '/api/admin/medicines'
      };

      const endpoint = endpoints[selectedModule.id];
      if (!endpoint) {
        setMessage('This module is not yet implemented');
        setLoading(false);
        return;
      }

      const url = editingId 
        ? `http://localhost:3000${endpoint}/${editingId}`
        : `http://localhost:3000${endpoint}`;
      
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const result = await res.json();

      if (res.ok) {
        setMessage(editingId ? '✅ Updated successfully!' : '✅ Added successfully!');
        resetForm();
        fetchData(selectedModule.id);
        setTimeout(() => {
          setActiveView('view');
          setMessage('');
        }, 2000);
      } else {
        setMessage('❌ ' + (result.error || result.message || 'Failed to save'));
      }
    } catch (err) {
      console.error('Error submitting:', err);
      setMessage('❌ Server error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    switch (selectedModule?.id) {
      case 'departments':
        return (
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-group">
              <label>Department Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleInputChange}
                required
                placeholder="Enter department name"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                rows="4"
                placeholder="Enter department description"
              />
            </div>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? 'Saving...' : 'Save Department'}
            </button>
          </form>
        );

      case 'hospital-branches':
        return (
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-group">
              <label>Branch Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleInputChange}
                required
                placeholder="Enter branch name"
              />
            </div>
            <div className="form-group">
              <label>Address</label>
              <textarea
                name="address"
                value={formData.address || ''}
                onChange={handleInputChange}
                rows="3"
                placeholder="Enter branch address"
              />
            </div>
            <div className="form-group">
              <label>Established Date</label>
              <input
                type="date"
                name="establishedDate"
                value={formData.establishedDate || ''}
                onChange={handleInputChange}
              />
            </div>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? 'Saving...' : 'Save Branch'}
            </button>
          </form>
        );

      case 'branch-contacts':
        return (
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-group">
              <label>Branch ID *</label>
              <input
                type="number"
                name="branchId"
                value={formData.branchId || ''}
                onChange={handleInputChange}
                required
                placeholder="Enter branch ID"
              />
            </div>
            <div className="form-group">
              <label>Contact Number *</label>
              <input
                type="text"
                name="contactNo"
                value={formData.contactNo || ''}
                onChange={handleInputChange}
                required
                placeholder="Enter contact number"
              />
            </div>
            <div className="form-group">
              <label>Contact Type *</label>
              <select
                name="type"
                value={formData.type || ''}
                onChange={handleInputChange}
                required
              >
                <option value="">Select type</option>
                <option value="phone">Phone</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? 'Saving...' : 'Save Contact'}
            </button>
          </form>
        );

      case 'medical-technician':
        return (
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleInputChange}
                required
                placeholder="Enter technician name"
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleInputChange}
                required
                placeholder="Enter email address"
              />
            </div>
            <div className="form-group">
              <label>Phone *</label>
              <input
                type="text"
                name="phone"
                value={formData.phone || ''}
                onChange={handleInputChange}
                required
                placeholder="Enter phone number (11 digits)"
                maxLength="11"
              />
            </div>
            <div className="form-group">
              <label>Degrees</label>
              <input
                type="text"
                name="degrees"
                value={formData.degrees || ''}
                onChange={handleInputChange}
                placeholder="e.g., BSc Medical Technology"
              />
            </div>
            <div className="form-group">
              <label>Experience Years</label>
              <input
                type="number"
                name="experienceYears"
                value={formData.experienceYears || ''}
                onChange={handleInputChange}
                placeholder="Enter years of experience"
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Department ID</label>
              <input
                type="number"
                name="deptId"
                value={formData.deptId || ''}
                onChange={handleInputChange}
                placeholder="Enter department ID (optional)"
              />
            </div>
            <div className="form-group">
              <label>Branch ID</label>
              <input
                type="number"
                name="branchId"
                value={formData.branchId || ''}
                onChange={handleInputChange}
                placeholder="Enter branch ID (optional)"
              />
            </div>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? 'Saving...' : 'Save Technician'}
            </button>
          </form>
        );

      case 'beds':
        return (
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-group">
              <label>Bed Number *</label>
              <input
                type="text"
                name="bedNumber"
                value={formData.bedNumber || ''}
                onChange={handleInputChange}
                required
                placeholder="e.g., B-101"
              />
            </div>
            <div className="form-group">
              <label>Ward Name *</label>
              <input
                type="text"
                name="wardName"
                value={formData.wardName || ''}
                onChange={handleInputChange}
                required
                placeholder="e.g., ICU, General Ward"
              />
            </div>
            <div className="form-group">
              <label>Bed Type *</label>
              <select
                name="bedType"
                value={formData.bedType || ''}
                onChange={handleInputChange}
                required
              >
                <option value="">Select type</option>
                <option value="General">General</option>
                <option value="ICU">ICU</option>
                <option value="Private">Private</option>
                <option value="Semi-Private">Semi-Private</option>
              </select>
            </div>
            <div className="form-group">
              <label>Price Per Day *</label>
              <input
                type="number"
                name="pricePerDay"
                value={formData.pricePerDay || ''}
                onChange={handleInputChange}
                required
                placeholder="e.g., 1000"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                name="status"
                value={formData.status || 'available'}
                onChange={handleInputChange}
              >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div className="form-group">
              <label>Floor Number</label>
              <input
                type="number"
                name="floorNumber"
                value={formData.floorNumber || ''}
                onChange={handleInputChange}
                placeholder="e.g., 1, 2, 3"
              />
            </div>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? 'Saving...' : 'Save Bed'}
            </button>
          </form>
        );

      case 'medicines':
        return (
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-group">
              <label>Medicine Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleInputChange}
                required
                placeholder="Enter medicine name"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                rows="3"
                placeholder="Enter description"
              />
            </div>
            <div className="form-group">
              <label>Manufacturer</label>
              <input
                type="text"
                name="manufacturer"
                value={formData.manufacturer || ''}
                onChange={handleInputChange}
                placeholder="Enter manufacturer name"
              />
            </div>
            <div className="form-group">
              <label>Price *</label>
              <input
                type="number"
                name="price"
                value={formData.price || ''}
                onChange={handleInputChange}
                required
                placeholder="e.g., 50.00"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label>Stock Quantity</label>
              <input
                type="number"
                name="stockQuantity"
                value={formData.stockQuantity || ''}
                onChange={handleInputChange}
                placeholder="e.g., 100"
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <input
                type="text"
                name="category"
                value={formData.category || ''}
                onChange={handleInputChange}
                placeholder="e.g., Antibiotic, Painkiller"
              />
            </div>
            <div className="form-group">
              <label>Expiry Date</label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate || ''}
                onChange={handleInputChange}
              />
            </div>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? 'Saving...' : 'Save Medicine'}
            </button>
          </form>
        );

      case 'tests':
        return (
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-group">
              <label>Test Name *</label>
              <input
                type="text"
                name="testName"
                value={formData.testName || ''}
                onChange={handleInputChange}
                required
                placeholder="Enter test name"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                rows="3"
                placeholder="Enter test description"
              />
            </div>
            <div className="form-group">
              <label>Price *</label>
              <input
                type="number"
                name="price"
                value={formData.price || ''}
                onChange={handleInputChange}
                required
                placeholder="e.g., 500"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label>Department</label>
              <input
                type="text"
                name="department"
                value={formData.department || ''}
                onChange={handleInputChange}
                placeholder="e.g., Radiology, Pathology"
              />
            </div>
            <div className="form-group">
              <label>Preparation Required</label>
              <textarea
                name="preparationRequired"
                value={formData.preparationRequired || ''}
                onChange={handleInputChange}
                rows="2"
                placeholder="e.g., Fasting required"
              />
            </div>
            <div className="form-group">
              <label>Duration (minutes)</label>
              <input
                type="number"
                name="durationMinutes"
                value={formData.durationMinutes || ''}
                onChange={handleInputChange}
                placeholder="e.g., 30"
              />
            </div>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? 'Saving...' : 'Save Lab Test'}
            </button>
          </form>
        );

      case 'doctors':
      case 'appointments':
        return (
          <div className="placeholder-form">
            <p>📝 {selectedModule?.name} management</p>
            <p>This module uses a dedicated management page.</p>
            <p style={{ marginTop: '20px', color: '#3498db' }}>
              Navigate to the specific management page for full functionality.
            </p>
          </div>
        );

      default:
        return (
          <div className="placeholder-form">
            <p>Form for {selectedModule?.name} will be implemented here.</p>
          </div>
        );
    }
  };

  const renderTable = () => {
    if (loading) {
      return <div className="loading">Loading...</div>;
    }

    if (data.length === 0) {
      return <div className="no-data">No records found</div>;
    }

    switch (selectedModule?.id) {
      case 'departments':
        return (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.description || 'N/A'}</td>
                  <td>
                    <button className="btn-edit" onClick={() => handleEdit(item)}>Edit</button>
                    <button className="btn-delete" onClick={() => handleDelete(item.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'hospital-branches':
        return (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Address</th>
                <th>Established Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.address || 'N/A'}</td>
                  <td>{item.establishedDate ? new Date(item.establishedDate).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <button className="btn-edit" onClick={() => handleEdit(item)}>Edit</button>
                    <button className="btn-delete" onClick={() => handleDelete(item.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'branch-contacts':
        return (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Branch Name</th>
                <th>Contact Number</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.branchName || 'N/A'}</td>
                  <td>{item.contactNo}</td>
                  <td>{item.type}</td>
                  <td>
                    <button className="btn-edit" onClick={() => handleEdit(item)}>Edit</button>
                    <button className="btn-delete" onClick={() => handleDelete(item.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'medical-technician':
        return (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Department</th>
                <th>Branch</th>
                <th>Experience</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name || 'N/A'}</td>
                  <td>{item.email || 'N/A'}</td>
                  <td>{item.phone || 'N/A'}</td>
                  <td>{item.deptName || 'N/A'}</td>
                  <td>{item.branchName || 'N/A'}</td>
                  <td>{item.experienceYears || 0} years</td>
                  <td>
                    <button className="btn-edit" onClick={() => handleEdit(item)}>Edit</button>
                    <button className="btn-delete" onClick={() => handleDelete(item.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'beds':
        return (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Bed Number</th>
                <th>Ward Name</th>
                <th>Bed Type</th>
                <th>Price/Day</th>
                <th>Status</th>
                <th>Floor</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.bedNumber}</td>
                  <td>{item.wardName}</td>
                  <td>{item.bedType}</td>
                  <td>${item.pricePerDay}</td>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      background: item.status === 'available' ? '#d4edda' : 
                                 item.status === 'occupied' ? '#f8d7da' : '#fff3cd',
                      color: item.status === 'available' ? '#155724' : 
                             item.status === 'occupied' ? '#721c24' : '#856404'
                    }}>
                      {item.status}
                    </span>
                  </td>
                  <td>{item.floorNumber || 'N/A'}</td>
                  <td>
                    <button className="btn-edit" onClick={() => handleEdit(item)}>Edit</button>
                    <button className="btn-delete" onClick={() => handleDelete(item.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'medicines':
        return (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Manufacturer</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Expiry Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.category || 'N/A'}</td>
                  <td>{item.manufacturer || 'N/A'}</td>
                  <td>${item.price}</td>
                  <td>
                    <span style={{
                      color: item.stockQuantity < 10 ? '#e74c3c' : 
                             item.stockQuantity < 50 ? '#f39c12' : '#27ae60',
                      fontWeight: 'bold'
                    }}>
                      {item.stockQuantity || 0}
                    </span>
                  </td>
                  <td>{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <button className="btn-edit" onClick={() => handleEdit(item)}>Edit</button>
                    <button className="btn-delete" onClick={() => handleDelete(item.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'tests':
        return (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Test Name</th>
                <th>Department</th>
                <th>Price</th>
                <th>Duration</th>
                <th>Preparation</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.testName}</td>
                  <td>{item.department || 'N/A'}</td>
                  <td>${item.price}</td>
                  <td>{item.durationMinutes ? `${item.durationMinutes} min` : 'N/A'}</td>
                  <td>{item.preparationRequired || 'None'}</td>
                  <td>
                    <button className="btn-edit" onClick={() => handleEdit(item)}>Edit</button>
                    <button className="btn-delete" onClick={() => handleDelete(item.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      default:
        return <div className="no-data">Select a module to view data</div>;
    }
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </header>

      <div className="admin-content">
        {/* Main Sidebar */}
        <aside className="main-sidebar">
          <nav>
            {modules.map((module) => (
              <div
                key={module.id}
                className={`sidebar-item ${selectedModule?.id === module.id ? 'active' : ''}`}
                onClick={() => handleModuleClick(module)}
              >
                <span className="sidebar-icon">{module.icon}</span>
                <span className="sidebar-label">{module.name}</span>
              </div>
            ))}
          </nav>
        </aside>

        {/* Sub Sidebar */}
        {showSubSidebar && selectedModule && (
          <aside className="sub-sidebar">
            <div className="sub-sidebar-header">
              <h3>{selectedModule.name}</h3>
            </div>
            <div
              className={`sub-sidebar-item ${activeView === 'view' ? 'active' : ''}`}
              onClick={() => handleSubAction('view')}
            >
              <span className="sub-icon">👁️</span>
              <span>View</span>
            </div>
            <div
              className={`sub-sidebar-item ${activeView === 'add' ? 'active' : ''}`}
              onClick={() => handleSubAction('add')}
            >
              <span className="sub-icon">➕</span>
              <span>Add</span>
            </div>
          </aside>
        )}

        {/* Main Content Area */}
        <main className="main-content">
          {!selectedModule ? (
            <div className="welcome-screen">
              <h2>Welcome to Admin Dashboard</h2>
              <p>Select a module from the sidebar to get started</p>
            </div>
          ) : (
            <div className="content-area">
              <div className="content-header">
                <h2>{selectedModule.name} - {activeView === 'view' ? 'View' : 'Add New'}</h2>
                {activeView === 'add' && (
                  <div className="action-buttons">
                    <button className="btn-cancel" onClick={handleCancel}>Cancel</button>
                    <button className="btn-save">Save</button>
                  </div>
                )}
              </div>
              
              <div className="content-body">
                {activeView === 'view' ? (
                  <div className="view-content">
                    {renderTable()}
                  </div>
                ) : (
                  <div className="add-content">
                    {message && <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>{message}</div>}
                    {renderForm()}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
