import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import '../styles/AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [selectedModule, setSelectedModule] = useState(null);
  const [activeView, setActiveView] = useState('view');
  const [showSubSidebar, setShowSubSidebar] = useState(false);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [searchAdminId, setSearchAdminId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState({ type: '', title: '', message: '' });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [testFileUrl, setTestFileUrl] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({ doctors: [], branches: [], patients: [] });
  const [showBillModal, setShowBillModal] = useState(false);
  const [billForm, setBillForm] = useState({ appointmentId: '', consultationFee: '' });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = user.role ? user.role.toUpperCase() : '';
    
    setCurrentUser(user);
    
    if (userRole !== 'ADMIN') {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    // Filter data when search changes
    if (searchAdminId === '' && searchQuery === '') {
      setFilteredData(data);
    } else {
      const filtered = data.filter(item => {
        // Admin ID filter
        const matchesAdminId = searchAdminId === '' || 
          (item.adminId && item.adminId.toString().includes(searchAdminId));
        
        // Contextual search filter based on module
        let matchesSearch = true;
        if (searchQuery !== '') {
          const query = searchQuery.toLowerCase();
          switch (selectedModule?.id) {
            case 'departments':
              matchesSearch = (item.name || '').toLowerCase().includes(query);
              break;
            case 'tests':
              matchesSearch = (item.testName || '').toLowerCase().includes(query);
              break;
            case 'medical-technician':
              matchesSearch = (item.name || '').toLowerCase().includes(query) || 
                            (item.deptName || '').toLowerCase().includes(query);
              break;
            case 'beds':
              matchesSearch = (item.bedNumber || '').toLowerCase().includes(query) || 
                            (item.wardName || '').toLowerCase().includes(query);
              break;
            case 'medicines':
              matchesSearch = (item.name || '').toLowerCase().includes(query);
              break;
            case 'hospital-branches':
              matchesSearch = (item.name || '').toLowerCase().includes(query);
              break;
            case 'branch-contacts':
              matchesSearch = (item.contactNo || '').toString().includes(query) || 
                            (item.branchName || '').toLowerCase().includes(query);
              break;
            case 'lab-test-appointments':
              matchesSearch = (item.token || '').toString().toLowerCase().includes(query) || 
                            (item.patientName || '').toLowerCase().includes(query) ||
                            (item.testName || '').toLowerCase().includes(query);
              break;
            case 'bed-bookings':
              matchesSearch = (item.id || '').toString().includes(query) || 
                            (item.patientName || '').toLowerCase().includes(query) ||
                            (item.bedNumber || '').toLowerCase().includes(query);
              break;
            default:
              matchesSearch = true;
          }
        }
        
        return matchesAdminId && matchesSearch;
      });
      setFilteredData(filtered);
    }
  }, [searchAdminId, searchQuery, data, selectedModule]);

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
    { id: 'lab-test-appointments', name: 'Lab Test Appointments', icon: '🧪', path: '/admin/lab-test-appointments' },
    { id: 'medicines', name: 'Medicines', icon: '💊', path: '/admin/medicines' },
    { id: 'bed-bookings', name: 'Bed Bookings', icon: '🛏️', path: '/admin/bed-bookings' },
    { id: 'departments', name: 'Departments', icon: '🏥', path: '/admin/departments' },
    { id: 'analytics', name: 'Analytics & Reports', icon: '📊', path: '/admin/analytics' }
  ];

  const handleModuleClick = (module) => {
    setSelectedModule(module);
    setShowSubSidebar(true);
    setActiveView('view');
    setMessage('');
    setSearchAdminId('');
    setSearchQuery('');
    fetchData(module.id);
  };

  const getSearchPlaceholder = () => {
    switch (selectedModule?.id) {
      case 'departments':
        return 'Search by department name...';
      case 'tests':
        return 'Search by test name...';
      case 'medical-technician':
        return 'Search by name or department...';
      case 'beds':
        return 'Search by bed number or ward...';
      case 'medicines':
        return 'Search by medicine name...';
      case 'hospital-branches':
        return 'Search by branch name...';
      case 'branch-contacts':
        return 'Search by contact number or branch...';
      case 'lab-test-appointments':
        return 'Search by token, patient or test...';
      case 'bed-bookings':
        return 'Search by booking ID, patient or bed...';
      default:
        return 'Search...';
    }
  };

  const hasAdminIdField = () => {
    const modulesWithAdminId = ['departments', 'hospital-branches', 'branch-contacts', 'medical-technician'];
    return modulesWithAdminId.includes(selectedModule?.id);
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
        'medicines': '/api/admin/medicines',
        'lab-test-appointments': '/api/admin/lab-test-appointments',
        'bed-bookings': '/api/admin/bed-bookings'
      };

      const endpoint = endpoints[selectedModule.id];
      const res = await fetch(`http://localhost:3000${endpoint}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();

      if (res.ok) {
        setModalMessage({
          type: 'success',
          title: 'Deleted Successfully',
          message: `The ${selectedModule.name.toLowerCase()} has been removed from the system.`
        });
        setShowModal(true);
        fetchData(selectedModule.id);
      } else {
        // Check for foreign key constraint error
        if (data.error && (data.error.includes('constraint') || data.error.includes('integrity') || data.error.includes('referenced'))) {
          setModalMessage({
            type: 'error',
            title: 'Cannot Delete',
            message: `This ${selectedModule.name.toLowerCase()} cannot be deleted because it is being used by other records in the system. Please remove all dependencies first.`
          });
        } else {
          setModalMessage({
            type: 'error',
            title: 'Delete Failed',
            message: data.error || `Unable to delete ${selectedModule.name.toLowerCase()}. Please try again.`
          });
        }
        setShowModal(true);
      }
    } catch (err) {
      console.error('Error deleting:', err);
      setModalMessage({
        type: 'error',
        title: 'Error',
        message: 'Network error. Please check your connection and try again.'
      });
      setShowModal(true);
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setDeleteItemId(null);
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
      
      if (!token) {
        setMessage('❌ Please login again - no token found');
        setData([]);
        setLoading(false);
        return;
      }

      // Handle analytics separately
      if (moduleId === 'analytics') {
        const res = await fetch('http://localhost:3000/api/admin/db-features/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const result = await res.json();
          setAnalyticsData(result);
        } else {
          setMessage('❌ Failed to fetch analytics data');
        }
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
        'medicines': '/api/admin/medicines',
        'lab-test-appointments': '/api/admin/lab-test-appointments',
        'bed-bookings': '/api/admin/bed-bookings'
      };

      const endpoint = endpoints[moduleId];
      if (!endpoint) {
        setData([]);
        setLoading(false);
        return;
      }

      const res = await fetch(`http://localhost:3000${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const result = await res.json();
        
        // Handle different response formats
        if (result.beds) setData(result.beds);
        else if (result.labTests) setData(result.labTests);
        else if (result.medicines) setData(result.medicines);
        else if (result.contacts) setData(result.contacts);
        else if (result.branches) setData(result.branches);
        else if (result.technicians) setData(result.technicians);
        else if (result.departments) setData(result.departments);
        else if (result.appointments) setData(result.appointments);
        else if (result.bookings) setData(result.bookings);
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
        'medicines': '/api/admin/medicines',
        'lab-test-appointments': '/api/admin/lab-test-appointments',
        'bed-bookings': '/api/admin/bed-bookings'
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
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" className="btn-cancel" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="btn-save" disabled={loading}>
                {loading ? 'Saving...' : 'Save Department'}
              </button>
            </div>
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
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" className="btn-cancel" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="btn-save" disabled={loading}>
                {loading ? 'Saving...' : 'Save Branch'}
              </button>
            </div>
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
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" className="btn-cancel" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="btn-save" disabled={loading}>
                {loading ? 'Saving...' : 'Save Contact'}
              </button>
            </div>
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
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" className="btn-cancel" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="btn-save" disabled={loading}>
                {loading ? 'Saving...' : 'Save Technician'}
              </button>
            </div>
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
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" className="btn-cancel" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="btn-save" disabled={loading}>
                {loading ? 'Saving...' : 'Save Bed'}
              </button>
            </div>
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
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" className="btn-cancel" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="btn-save" disabled={loading}>
                {loading ? 'Saving...' : 'Save Medicine'}
              </button>
            </div>
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
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" className="btn-cancel" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="btn-save" disabled={loading}>
                {loading ? 'Saving...' : 'Save Lab Test'}
              </button>
            </div>
          </form>
        );

      case 'doctors':
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

    // Analytics view
    if (selectedModule?.id === 'analytics') {
      return (
        <div style={{ padding: '40px 32px 32px 32px' }}>
          <h2 style={{ marginBottom: '40px', color: '#1e293b', fontSize: '32px', fontWeight: '700', letterSpacing: '-0.5px' }}>📊 Analytics & Reports</h2>
          
          {/* Top Doctors by Appointment Count */}
          <div style={{ marginBottom: '48px' }}>
            <h3 style={{ color: '#7c3aed', marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>🏆 Top Doctors by Appointments</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Doctor ID</th>
                  <th>Doctor Name</th>
                  <th>Total Appointments</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.doctors.map((doctor) => (
                  <tr key={doctor.doctorId}>
                    <td>{doctor.doctorId}</td>
                    <td>{doctor.doctorName}</td>
                    <td><strong style={{ color: '#7c3aed' }}>{doctor.appointmentCount}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ward Bed Occupancy */}
          <div style={{ marginBottom: '48px' }}>
            <h3 style={{ color: '#059669', marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>🏥 Ward Bed Occupancy Rates</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ward Name</th>
                  <th>Occupancy Rate</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.wards.map((ward, index) => (
                  <tr key={index}>
                    <td>{ward.wardName}</td>
                    <td>
                      <span style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        fontSize: '13px',
                        background: ward.occupancyRate > 80 ? 'rgba(239, 68, 68, 0.1)' : 
                                   ward.occupancyRate > 50 ? 'rgba(251, 191, 36, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                        color: ward.occupancyRate > 80 ? '#dc2626' : 
                               ward.occupancyRate > 50 ? '#d97706' : '#16a34a'
                      }}>
                        {ward.occupancyRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Patient Expenses */}
          <div style={{ marginBottom: '48px' }}>
            <h3 style={{ color: '#dc2626', marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>💰 Top Patients by Total Expenses</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Patient Name</th>
                  <th>Total Expenses</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.patients.map((patient) => (
                  <tr key={patient.patientId}>
                    <td>{patient.patientId}</td>
                    <td>{patient.patientName}</td>
                    <td><strong style={{ color: '#dc2626' }}>৳{patient.totalExpenses}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (filteredData.length === 0) {
      return <div className="no-data">{searchAdminId ? 'No records found for this Admin ID' : 'No records found'}</div>;
    }

    switch (selectedModule?.id) {
      case 'departments':
        return (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Admin ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.adminId}</td>
                  <td>{item.name}</td>
                  <td>{item.description || 'N/A'}</td>
                  <td>
                    <button className="btn-edit" onClick={() => handleEdit(item)}>Edit</button>
                    <button className="btn-delete" onClick={() => { setDeleteItemId(item.id); setShowDeleteModal(true); }}>Delete</button>
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
                <th>Admin ID</th>
                <th>Name</th>
                <th>Address</th>
                <th>Established Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.adminId}</td>
                  <td>{item.name}</td>
                  <td>{item.address || 'N/A'}</td>
                  <td>{item.establishedDate ? new Date(item.establishedDate).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <button className="btn-edit" onClick={() => handleEdit(item)}>Edit</button>
                    <button className="btn-delete" onClick={() => { setDeleteItemId(item.id); setShowDeleteModal(true); }}>Delete</button>
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
                <th>Admin ID</th>
                <th>Branch Name</th>
                <th>Contact Number</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.adminId}</td>
                  <td>{item.branchName || 'N/A'}</td>
                  <td>{item.contactNo}</td>
                  <td>{item.type}</td>
                  <td>
                    <button className="btn-edit" onClick={() => handleEdit(item)}>Edit</button>
                    <button className="btn-delete" onClick={() => { setDeleteItemId(item.id); setShowDeleteModal(true); }}>Delete</button>
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
                <th>Admin ID</th>
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
              {filteredData.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.adminId}</td>
                  <td>{item.name || 'N/A'}</td>
                  <td>{item.email || 'N/A'}</td>
                  <td>{item.phone || 'N/A'}</td>
                  <td>{item.deptName || 'N/A'}</td>
                  <td>{item.branchName || 'N/A'}</td>
                  <td>{item.experienceYears || 0} years</td>
                  <td>
                    <button className="btn-edit" onClick={() => handleEdit(item)}>Edit</button>
                    <button className="btn-delete" onClick={() => { setDeleteItemId(item.id); setShowDeleteModal(true); }}>Delete</button>
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
              {filteredData.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.bedNumber}</td>
                  <td>{item.wardName}</td>
                  <td>{item.bedType}</td>
                  <td>₹{item.pricePerDay}</td>
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
                    <button className="btn-delete" onClick={() => { setDeleteItemId(item.id); setShowDeleteModal(true); }}>Delete</button>
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
              {filteredData.map((item) => (
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
                    <button className="btn-delete" onClick={() => { setDeleteItemId(item.id); setShowDeleteModal(true); }}>Delete</button>
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
              {filteredData.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.testName}</td>
                  <td>{item.department || 'N/A'}</td>
                  <td>${item.price}</td>
                  <td>{item.durationMinutes ? `${item.durationMinutes} min` : 'N/A'}</td>
                  <td>{item.preparationRequired || 'None'}</td>
                  <td>
                    <button className="btn-edit" onClick={() => handleEdit(item)}>Edit</button>
                    <button className="btn-delete" onClick={() => { setDeleteItemId(item.id); setShowDeleteModal(true); }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'lab-test-appointments':
        return (
          <table className="data-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Patient</th>
                <th>Test Name</th>
                <th>Department</th>
                <th>Technician</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 'bold', color: '#000000' }}>{item.token}</td>
                  <td>
                    <div>{item.patientName}</div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>{item.patientEmail}</div>
                  </td>
                  <td>{item.testName}</td>
                  <td>{item.department || 'N/A'}</td>
                  <td>{item.technicianName || 'Not Assigned'}</td>
                  <td>₹{item.price}</td>
                  <td>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      background: item.status === 'COMPLETED' ? '#d4edda' : '#fff3cd',
                      color: item.status === 'COMPLETED' ? '#155724' : '#856404'
                    }}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn-edit" 
                      onClick={() => {
                        setEditingAppointment(item);
                        setTestFileUrl(item.testFileUrl || '');
                        setShowEditModal(true);
                      }}
                    >
                      {item.status === 'COMPLETED' ? 'View' : 'Upload Result'}
                    </button>
                    <button className="btn-delete" onClick={() => { setDeleteItemId(item.id); setShowDeleteModal(true); }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );

      case 'bed-bookings':
        return (
          <table className="data-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th style={{ minWidth: '200px' }}>Bed Info</th>
                <th>Appointment Date</th>
                <th>Price/Day</th>
                <th>Status</th>
                <th>Booked At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 'bold', color: '#000000' }}>{item.id}</td>
                  <td>
                    <div>{item.patientName}</div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>{item.patientEmail}</div>
                  </td>
                  <td>{item.doctorName}</td>
                  <td style={{ minWidth: '200px' }}>
                    <div style={{ marginBottom: '4px' }}><strong>Bed {item.bedNumber}</strong></div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d', lineHeight: '1.4' }}>
                      {item.wardName} - {item.bedType}
                      {item.floorNumber && ` (Floor ${item.floorNumber})`}
                    </div>
                  </td>
                  <td>{new Date(item.appointmentDate).toLocaleDateString()}</td>
                  <td>৳{item.pricePerDay}</td>
                  <td>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      background: item.status === 'BOOKED' ? '#d4edda' : '#fff3cd',
                      color: item.status === 'BOOKED' ? '#155724' : '#856404'
                    }}>
                      {item.status}
                    </span>
                  </td>
                  <td>{new Date().toLocaleString()}</td>
                  <td>
                    <button className="btn-delete" onClick={() => { setDeleteItemId(item.id); setShowDeleteModal(true); }}>Delete</button>
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
        zIndex: 1000
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

  // Edit Lab Test Appointment Modal
  const EditLabTestModal = () => {
    if (!showEditModal || !editingAppointment) return null;

    const handleUpdateLabTest = async () => {
      if (!testFileUrl.trim()) {
        alert('Please enter a test file URL');
        return;
      }

      setLoading(true);
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const token = user.token;

        const res = await fetch(`http://localhost:3000/api/admin/lab-test-appointments/${editingAppointment.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ testFileUrl })
        });

        const data = await res.json();

        if (res.ok) {
          setModalMessage({
            type: 'success',
            title: 'Updated Successfully',
            message: 'Lab test result has been uploaded and status changed to COMPLETED.'
          });
          setShowModal(true);
          setShowEditModal(false);
          fetchData('lab-test-appointments');
        } else {
          alert('Failed to update: ' + (data.message || 'Unknown error'));
        }
      } catch (err) {
        console.error('Error updating lab test:', err);
        alert('Error: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>
            {editingAppointment.status === 'COMPLETED' ? 'View Test Result' : 'Upload Test Result'}
          </h3>
          
          <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
            <p style={{ margin: '0.25rem 0', fontSize: '14px' }}>
              <strong>Token:</strong> {editingAppointment.token}
            </p>
            <p style={{ margin: '0.25rem 0', fontSize: '14px' }}>
              <strong>Patient:</strong> {editingAppointment.patientName}
            </p>
            <p style={{ margin: '0.25rem 0', fontSize: '14px' }}>
              <strong>Test:</strong> {editingAppointment.testName}
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
              Test Result URL
            </label>
            <input
              key={editingAppointment.id}
              type="url"
              value={testFileUrl}
              onChange={(e) => setTestFileUrl(e.target.value)}
              placeholder="https://example.com/test-result.pdf"
              disabled={editingAppointment.status === 'COMPLETED'}
              autoFocus
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                setShowEditModal(false);
                setEditingAppointment(null);
                setTestFileUrl('');
              }}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Close
            </button>
            {editingAppointment.status !== 'COMPLETED' && (
              <button
                onClick={handleUpdateLabTest}
                disabled={loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#3b82f6',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {loading ? 'Uploading...' : 'Upload & Complete'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-dashboard">
      <Modal 
        show={showModal} 
        onClose={() => setShowModal(false)}
        type={modalMessage.type}
        title={modalMessage.title}
        message={modalMessage.message}
      />
      <EditLabTestModal />
      
      {/* Edit Profile Modal */}
      {editingProfile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
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
            width: '90%'
          }}>
            <h3 style={{ margin: '0 0 1.5rem 0' }}>Edit Profile</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Name</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Phone</label>
              <input
                type="text"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                maxLength="11"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditingProfile(false)}
                disabled={loading}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  background: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setLoading(true);
                  try {
                    const res = await fetch('http://localhost:3000/api/profile/update', {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${currentUser.token}`
                      },
                      body: JSON.stringify({
                        email: currentUser.email,
                        name: profileForm.name,
                        phone: profileForm.phone
                      })
                    });

                    const data = await res.json();

                    if (res.ok) {
                      const updatedUser = { ...currentUser, name: profileForm.name, phone: profileForm.phone };
                      setCurrentUser(updatedUser);
                      localStorage.setItem('user', JSON.stringify(updatedUser));
                      setEditingProfile(false);
                      setModalMessage({
                        type: 'success',
                        title: 'Profile Updated',
                        message: 'Your profile has been updated successfully.'
                      });
                      setShowModal(true);
                    } else {
                      setModalMessage({
                        type: 'error',
                        title: 'Update Failed',
                        message: data.error || 'Failed to update profile'
                      });
                      setShowModal(true);
                    }
                  } catch (err) {
                    console.error('Error updating profile:', err);
                    setModalMessage({
                      type: 'error',
                      title: 'Error',
                      message: 'Network error. Please try again.'
                    });
                    setShowModal(true);
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '6px',
                  background: loading ? '#d1d5db' : '#667eea',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '500'
                }}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <div style={{ position: 'relative' }}>
          <div 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              cursor: 'pointer',
              border: '2px solid white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            {currentUser?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          
          {showProfileMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '0.5rem',
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb',
              minWidth: '220px',
              zIndex: 1000
            }}>
              <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                  {currentUser?.name || 'Admin'}
                </div>
                
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                  Administrator
                </div>
                
                <div style={{ fontSize: '0.875rem', color: '#1f2937', marginBottom: '0.5rem' }}>
                  {currentUser?.email || 'admin@example.com'}
                </div>
                
                <div style={{ fontSize: '0.875rem', color: '#1f2937' }}>
                  {currentUser?.phone || 'N/A'}
                </div>
              </div>
              
              <div style={{ padding: '0.5rem' }}>
                <div
                  onClick={() => {
                    setEditingProfile(true);
                    setProfileForm({ name: currentUser?.name || '', phone: currentUser?.phone || '' });
                    setShowProfileMenu(false);
                  }}
                  style={{
                    padding: '0.5rem 0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#1f2937',
                    fontWeight: '500',
                    fontSize: '0.875rem',
                    borderRadius: '4px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span>✏️</span> Edit Profile
                </div>
                <div
                  onClick={handleLogout}
                  style={{
                    padding: '0.5rem 0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#ef4444',
                    fontWeight: '500',
                    fontSize: '0.875rem',
                    borderRadius: '4px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span>🚪</span> Logout
                </div>
              </div>
            </div>
          )}
        </div>
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

        {/* Sub Sidebar - REMOVED */}

        {/* Main Content Area */}
        <main className="main-content">
          {!selectedModule ? (
            <div className="welcome-screen">
              <h2>Welcome to Admin Dashboard</h2>
              <p>Select a module from the sidebar to get started</p>
            </div>
          ) : (
            <div className="content-area">
              {selectedModule.id !== 'analytics' && (
                <div className="content-header">
                  <h2>{selectedModule.name}</h2>
                  {selectedModule.id !== 'lab-test-appointments' && 
                   selectedModule.id !== 'bed-bookings' && (
                    <button 
                      className="admin-btn admin-btn-primary"
                      onClick={() => setActiveView(activeView === 'add' ? 'view' : 'add')}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      {activeView === 'add' ? (
                        <>
                          <span>👁️</span>
                          <span>View All</span>
                        </>
                      ) : (
                        <>
                          <span style={{ fontSize: '18px' }}>+</span>
                          <span>Add New</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
              
              {activeView === 'view' && selectedModule.id !== 'analytics' && (
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  marginBottom: '1rem',
                  padding: '1rem',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  flexWrap: 'wrap'
                }}>
                  {hasAdminIdField() && (
                    <div style={{ flex: '1', minWidth: '200px' }}>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '0.5rem', 
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151'
                      }}>
                        Filter by Admin ID
                      </label>
                      <input
                        type="text"
                        value={searchAdminId}
                        onChange={(e) => setSearchAdminId(e.target.value)}
                        placeholder="Enter Admin ID..."
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                  )}
                  <div style={{ flex: '2', minWidth: '250px' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem', 
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151'
                    }}>
                      Search
                    </label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={getSearchPlaceholder()}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              )}
              
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => {
            setShowDeleteModal(false);
            setDeleteItemId(null);
          }}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              width: '90%',
              maxWidth: '400px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              animation: 'scaleIn 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                fontSize: '24px'
              }}>
                ⚠️
              </div>
              <h2 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                marginBottom: '8px',
                color: '#111827'
              }}>
                Confirm Delete
              </h2>
              <p style={{ 
                color: '#6b7280', 
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                Are you sure you want to delete this {selectedModule?.name.toLowerCase()}? This action cannot be undone.
              </p>
            </div>
            <div style={{ 
              display: 'flex', 
              gap: '12px',
              marginTop: '24px'
            }}>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteItemId(null);
                }}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteItemId)}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: loading ? '#fca5a5' : '#ef4444',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#dc2626')}
                onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#ef4444')}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
