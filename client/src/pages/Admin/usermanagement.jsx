// pages/Admin/UserManagement.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import {
  FaUsers,
  FaSearch,
  FaEdit,
  FaTrash,
  FaUserPlus,
  FaUserCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
  FaEye,
  FaEnvelope,
  FaBan,
  FaCheck,
  FaExclamationTriangle,
  FaKey,
  FaSave,
  FaDatabase,
  FaUserGraduate,
  FaCloudUploadAlt,
  FaCheckDouble,
  FaChevronDown
} from 'react-icons/fa';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import '../../styles/Admin/usermanagement.css';

const UserManagement = () => {
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    newThisMonth: 0,
    usersWithSetup: 0,
    byRole: { admin: 0, engineer: 0, user: 0 }
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [statusAction, setStatusAction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMode, setModalMode] = useState('view');
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  const [showImportModal, setShowImportModal] = useState(false);
  const [hiredApplicants, setHiredApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [selectedApplicants, setSelectedApplicants] = useState([]);
  const [importStats, setImportStats] = useState(null);
  const [applicantSearchTerm, setApplicantSearchTerm] = useState('');
  const [bulkImportMode, setBulkImportMode] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  useEffect(() => {
    fetchUsers();
    fetchStats();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterRole, currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          role: filterRole === 'all' ? undefined : filterRole,
          page: currentPage,
          limit: 10
        }
      });
      setUsers(response.data.users || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchHiredApplicants = async () => {
    try {
      setLoadingApplicants(true);
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/job-portal/hired-applicants`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setHiredApplicants(response.data.applicants);
        setImportStats({
          total: response.data.count,
          notImported: response.data.applicants.filter(a => !a.imported).length,
          alreadyImported: response.data.applicants.filter(a => a.imported).length
        });
      }
    } catch (error) {
      console.error('Error fetching hired applicants:', error);
      showToast('Failed to fetch hired applicants from job portal', 'error');
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleOpenImportModal = () => {
    setShowImportModal(true);
    fetchHiredApplicants();
    setSelectedApplicants([]);
    setBulkImportMode(false);
  };

  const handleImportEngineer = async (applicantId) => {
    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/job-portal/import-engineer/${applicantId}`,
        { role: 'engineer' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showToast(`Successfully imported ${response.data.user.fullName} as engineer`, 'success');
        fetchUsers();
        fetchStats();
        fetchHiredApplicants();
        setSelectedApplicants([]);
      }
    } catch (error) {
      console.error('Error importing engineer:', error);
      showToast(error.response?.data?.message || 'Failed to import engineer', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkImport = async () => {
    if (selectedApplicants.length === 0) {
      showToast('Please select at least one applicant to import', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/job-portal/bulk-import`,
        { applicantIds: selectedApplicants, role: 'engineer' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showToast(response.data.message, 'success');
        fetchUsers();
        fetchStats();
        fetchHiredApplicants();
        setSelectedApplicants([]);
        setBulkImportMode(false);
      }
    } catch (error) {
      console.error('Error in bulk import:', error);
      showToast(error.response?.data?.message || 'Failed to perform bulk import', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleApplicantSelection = (applicantId) => {
    setSelectedApplicants(prev =>
      prev.includes(applicantId) ? prev.filter(id => id !== applicantId) : [...prev, applicantId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedApplicants.length === filteredApplicants.length) {
      setSelectedApplicants([]);
    } else {
      setSelectedApplicants(filteredApplicants.map(a => a.id));
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return user.fullName?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.clientInfo?.contactNumber?.includes(searchTerm);
  });

  const filteredApplicants = hiredApplicants.filter(applicant => {
    if (!applicantSearchTerm) return true;
    const searchLower = applicantSearchTerm.toLowerCase();
    return applicant.fullName?.toLowerCase().includes(searchLower) ||
      applicant.email?.toLowerCase().includes(searchLower) ||
      applicant.position?.toLowerCase().includes(searchLower);
  });

  // Function to combine name fields into fullName
  const combineFullName = (firstName, lastName) => {
    let fullName = firstName;
    if (lastName) {
      fullName += ` ${lastName}`;
    }
    return fullName;
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      contactNumber: '',
      password: '',
      confirmPassword: ''
    });
    setFormErrors({});
    setShowUserModal(true);
  };

  const handleOpenEditModal = (user) => {
    setModalMode('edit');
    setSelectedUser(user);
    
    // Get first name and last name from clientInfo or parse from fullName
    let firstName = '';
    let lastName = '';
    
    if (user.clientInfo?.firstName && user.clientInfo?.lastName) {
      // Use stored clientInfo if available
      firstName = user.clientInfo.firstName;
      lastName = user.clientInfo.lastName;
    } else if (user.fullName) {
      // Parse fullName - everything except the last word is first name
      const nameParts = user.fullName.trim().split(' ');
      if (nameParts.length === 1) {
        firstName = nameParts[0];
        lastName = '';
      } else {
        lastName = nameParts.pop(); // Last word is last name
        firstName = nameParts.join(' '); // Everything else is first name
      }
    }

    setFormData({
      firstName: firstName,
      lastName: lastName,
      email: user.email || '',
      contactNumber: user.clientInfo?.contactNumber || '',
      password: '',
      confirmPassword: ''
    });
    setFormErrors({});
    setShowUserModal(true);
    setOpenDropdownId(null);
  };

  const handleOpenViewModal = (user) => {
    setModalMode('view');
    setSelectedUser(user);
    setShowUserModal(true);
    setOpenDropdownId(null);
  };

  const handleOpenPasswordModal = (user) => {
    setSelectedUser(user);
    setFormData({ ...formData, password: '', confirmPassword: '' });
    setPasswordErrors({});
    setShowPasswordModal(true);
    setOpenDropdownId(null);
  };

  const handleOpenStatusModal = (user, action) => {
    setSelectedUser(user);
    setStatusAction(action);
    setShowStatusConfirm(true);
    setOpenDropdownId(null);
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setShowDeleteConfirm(true);
    setOpenDropdownId(null);
  };

  const validateForm = () => {
    const errors = {};
    if (modalMode === 'create') {
      if (!formData.email) errors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email is invalid';
      if (!formData.password) errors.password = 'Password is required';
      if (formData.password && formData.password.length < 6) errors.password = 'Password must be at least 6 characters';
      if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.firstName) errors.firstName = 'First name is required';
    if (!formData.lastName) errors.lastName = 'Last name is required';
    return errors;
  };

  const validatePasswordForm = () => {
    const errors = {};
    if (!formData.password) errors.password = 'New password is required';
    if (formData.password && formData.password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    return errors;
  };

  const handleResetPassword = async () => {
    const errors = validatePasswordForm();
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/admin/users/${selectedUser._id}/reset-password`,
        { password: formData.password },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showToast('Password reset successfully!', 'success');
        setShowPasswordModal(false);
        setFormData({ ...formData, password: '', confirmPassword: '' });
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      showToast(error.response?.data?.message || 'Failed to reset password', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveUser = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      const fullName = combineFullName(formData.firstName, formData.lastName);
      let response;

      if (modalMode === 'create') {
        response = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/users`,
          {
            email: formData.email,
            password: formData.password,
            role: 'engineer',
            fullName: fullName,
            firstName: formData.firstName,
            lastName: formData.lastName,
            contactNumber: formData.contactNumber
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        response = await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/users/${selectedUser._id}`,
          {
            fullName: fullName,
            firstName: formData.firstName,
            lastName: formData.lastName,
            contactNumber: formData.contactNumber
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      if (response.data.success) {
        fetchUsers();
        fetchStats();
        setShowUserModal(false);
        showToast(modalMode === 'create' ? 'User created successfully!' : 'User updated successfully!', 'success');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      showToast(error.response?.data?.message || 'Failed to save user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/admin/users/${selectedUser._id}/toggle-status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        fetchUsers();
        fetchStats();
        setShowStatusConfirm(false);
        setSelectedUser(null);
        setStatusAction(null);
        showToast(response.data.message, 'success');
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      showToast('Failed to update user status', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/admin/users/${selectedUser._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        fetchUsers();
        fetchStats();
        setShowDeleteConfirm(false);
        setSelectedUser(null);
        showToast('User deleted successfully!', 'success');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast(error.response?.data?.message || 'Failed to delete user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: <span className="role-badge-usermgmtad admin-usermgmtad">Admin</span>,
      engineer: <span className="role-badge-usermgmtad engineer-usermgmtad">Engineer</span>,
      user: <span className="role-badge-usermgmtad user-usermgmtad">Customer</span>
    };
    return badges[role] || <span className="role-badge-usermgmtad">{role}</span>;
  };

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return <span className="status-badge-usermgmtad active-usermgmtad"><FaCheckCircle /> Active</span>;
    }
    return <span className="status-badge-usermgmtad inactive-usermgmtad"><FaTimesCircle /> Inactive</span>;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getAvailableActions = (user) => {
    const actions = [
      { label: 'View Details', icon: <FaEye />, action: () => handleOpenViewModal(user), color: 'primary' },
      { label: 'Edit User', icon: <FaEdit />, action: () => handleOpenEditModal(user), color: 'primary' },
      { label: 'Reset Password', icon: <FaKey />, action: () => handleOpenPasswordModal(user), color: 'warning' },
      { label: user.isActive ? 'Deactivate' : 'Activate', icon: user.isActive ? <FaBan /> : <FaCheck />, action: () => handleOpenStatusModal(user, user.isActive ? 'deactivate' : 'activate'), color: user.isActive ? 'warning' : 'success' },
      { label: 'Delete User', icon: <FaTrash />, action: () => handleDeleteClick(user), color: 'danger' }
    ];
    return actions;
  };

  const SkeletonLoader = () => (
    <div className="user-management-usermgmtad">
      <div className="user-management-header-usermgmtad">
        <div className="skeleton-line-usermgmtad large-usermgmtad"></div>
        <div className="skeleton-button-usermgmtad"></div>
      </div>
      <div className="user-stats-cards-usermgmtad">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="stat-card-usermgmtad skeleton-card-usermgmtad">
            <div className="skeleton-line-usermgmtad small-usermgmtad"></div>
            <div className="skeleton-line-usermgmtad large-usermgmtad"></div>
          </div>
        ))}
      </div>
      <div className="user-filters-section-usermgmtad">
        <div className="skeleton-tabs-usermgmtad"></div>
        <div className="skeleton-search-usermgmtad"></div>
      </div>
      <div className="users-table-container-usermgmtad">
        <div className="skeleton-table-usermgmtad"></div>
      </div>
    </div>
  );

  if (loading && users.length === 0) {
    return <SkeletonLoader />;
  }

  return (
    <>
      <Helmet>
        <title>User Management | Admin | Salfer Engineering</title>
      </Helmet>

      <div className="user-management-usermgmtad">
        <div className="user-management-header-usermgmtad">
          
          <div>
            <h1>User Management</h1>
            <p>Manage system users, roles, and permissions</p>
          </div>
          {/* 
          <button className="create-user-btn-usermgmtad" onClick={handleOpenImportModal} style={{ backgroundColor: '#6c757d' }}>
            <FaDatabase /> Import from Job Portal
          </button>
          */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="create-user-btn-usermgmtad" onClick={handleOpenCreateModal}>
              <FaUserPlus /> Add User
            </button>
          </div>
        </div>

        <div className="user-stats-cards-usermgmtad">
          <div className="stat-card-usermgmtad total-usermgmtad">
            <div className="stat-info-usermgmtad">
              <span className="stat-value-usermgmtad">{stats.total}</span>
              <span className="stat-label-usermgmtad">Total Users</span>
            </div>
          </div>
          <div className="stat-card-usermgmtad active-usermgmtad">
            <div className="stat-info-usermgmtad">
              <span className="stat-value-usermgmtad">{stats.activeUsers}</span>
              <span className="stat-label-usermgmtad">Active Users</span>
            </div>
          </div>
          <div className="stat-card-usermgmtad inactive-usermgmtad">
            <div className="stat-info-usermgmtad">
              <span className="stat-value-usermgmtad">{stats.inactiveUsers}</span>
              <span className="stat-label-usermgmtad">Inactive Users</span>
            </div>
          </div>
          <div className="stat-card-usermgmtad new-usermgmtad">
            <div className="stat-info-usermgmtad">
              <span className="stat-value-usermgmtad">{stats.newThisMonth}</span>
              <span className="stat-label-usermgmtad">New This Month</span>
            </div>
          </div>
        </div>

        <div className="user-filters-section-usermgmtad">
          <div className="filter-tabs-usermgmtad">
            <button className={`filter-tab-usermgmtad ${filterRole === 'all' ? 'active-usermgmtad' : ''}`} onClick={() => setFilterRole('all')}>All Users</button>
            <button className={`filter-tab-usermgmtad ${filterRole === 'admin' ? 'active-usermgmtad' : ''}`} onClick={() => setFilterRole('admin')}>Admins</button>
            <button className={`filter-tab-usermgmtad ${filterRole === 'engineer' ? 'active-usermgmtad' : ''}`} onClick={() => setFilterRole('engineer')}>Engineers</button>
            <button className={`filter-tab-usermgmtad ${filterRole === 'user' ? 'active-usermgmtad' : ''}`} onClick={() => setFilterRole('user')}>Customers</button>
          </div>

          <div className="search-box-usermgmtad">
            <FaSearch className="search-icon-usermgmtad" />
            <input type="text" placeholder="Search by name, email, or contact number..." value={searchTerm} onChange={handleSearch} />
          </div>
        </div>

        <div className="users-table-container-usermgmtad">
          <table className="users-table-usermgmtad">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Last Login</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan="8" className="empty-state-usermgmtad"><p>No users found</p></td></tr>
              ) : (
                filteredUsers.map(user => {
                  const actions = getAvailableActions(user);
                  const isOpen = openDropdownId === user._id;

                  return (
                    <tr key={user._id}>
                      <td className="user-cell-usermgmtad">
                        <div className="user-avatar-usermgmtad">
                          {user.clientInfo?.firstName ? (
                            <div className="avatar-initials-usermgmtad">{user.clientInfo.firstName[0]}{user.clientInfo.lastName?.[0]}</div>
                          ) : <FaUserCircle />}
                        </div>
                        <div className="user-info-usermgmtad">
                          <div className="user-name-usermgmtad">{user.fullName}</div>
                          {user.clientInfo?.firstName && (
                            <div className="user-detail-usermgmtad">{user.clientInfo.firstName} {user.clientInfo.lastName}</div>
                          )}
                          {user.metadata?.importedFrom === 'job-portal' && (
                            <div className="import-badge-usermgmtad"><FaCloudUploadAlt /> Imported</div>
                          )}
                        </div>
                      </td>
                      <td className="email-cell-usermgmtad"><FaEnvelope className="email-icon-usermgmtad" />{user.email}</td>
                      <td className="contact-cell-usermgmtad">{user.clientInfo?.contactNumber || '—'}</td>
                      <td>{getRoleBadge(user.role)}</td>
                      <td>{getStatusBadge(user.isActive)}</td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>{formatDate(user.lastLogin)}</td>
                      <td style={{ textAlign: 'center', position: 'relative' }}>
                        <div className="action-dropdown-container" ref={isOpen ? dropdownRef : null}>
                          <button className="action-dropdown-toggle" onClick={() => setOpenDropdownId(isOpen ? null : user._id)}>
                            Action <FaChevronDown className={`dropdown-arrow ${isOpen ? 'open' : ''}`} />
                          </button>
                          {isOpen && (
                            <div className="action-dropdown-menu">
                              {actions.map((action, idx) => (
                                <button key={idx} className={`dropdown-item ${action.color || ''}`} onClick={action.action}>
                                  {action.icon} <span>{action.label}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination-usermgmtad">
            <button className="page-btn-usermgmtad" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><FaChevronLeft /> Previous</button>
            <span className="page-info-usermgmtad">Page {currentPage} of {totalPages}</span>
            <button className="page-btn-usermgmtad" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next <FaChevronRight /></button>
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && (
          <div className="modal-overlay-usermgmtad" onClick={() => setShowImportModal(false)}>
            <div className="modal-content-usermgmtad import-modal-usermgmtad" onClick={e => e.stopPropagation()}>
              <div className="modal-header-usermgmtad">
                <h3><FaDatabase /> Import Engineers from Job Portal</h3>
                <button className="modal-close-usermgmtad" onClick={() => setShowImportModal(false)}>×</button>
              </div>
              <div className="modal-body-usermgmtad">
                {importStats && (
                  <div className="import-stats-usermgmtad">
                    <div className="stat-badge-usermgmtad">
                      <span>Total Hired: {importStats.total}</span>
                      <span>Not Imported: {importStats.notImported}</span>
                      <span>Already Imported: {importStats.alreadyImported}</span>
                    </div>
                  </div>
                )}
                <div className="import-controls-usermgmtad">
                  <div className="search-box-usermgmtad">
                    <FaSearch className="search-icon-usermgmtad" />
                    <input type="text" placeholder="Search applicants..." value={applicantSearchTerm} onChange={(e) => setApplicantSearchTerm(e.target.value)} />
                  </div>
                  {filteredApplicants.length > 0 && (
                    <div className="bulk-actions-usermgmtad">
                      <button className="bulk-import-btn-usermgmtad" onClick={() => setBulkImportMode(!bulkImportMode)}>
                        {bulkImportMode ? 'Cancel Bulk Mode' : 'Bulk Import Mode'}
                      </button>
                      {bulkImportMode && selectedApplicants.length > 0 && (
                        <button className="import-selected-btn-usermgmtad" onClick={handleBulkImport} disabled={isSubmitting}>
                          {isSubmitting ? 'Importing...' : `Import Selected (${selectedApplicants.length})`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="applicants-table-container-usermgmtad">
                  {loadingApplicants ? (
                    <div className="loading-spinner-usermgmtad"><FaSpinner className="spinner-usermgmtad" /><p>Loading...</p></div>
                  ) : (
                    <table className="applicants-table-usermgmtad">
                      <thead>
                        <tr>
                          {bulkImportMode && <th><input type="checkbox" checked={selectedApplicants.length === filteredApplicants.length && filteredApplicants.length > 0} onChange={toggleSelectAll} /></th>}
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Position</th>
                          <th>Submitted</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredApplicants.length === 0 ? (
                          <tr><td colSpan={bulkImportMode ? 8 : 7} className="empty-state-usermgmtad"><p>No hired applicants found</p></td></tr>
                        ) : (
                          filteredApplicants.map(applicant => (
                            <tr key={applicant.id} className={applicant.imported ? 'imported-row-usermgmtad' : ''}>
                              {bulkImportMode && (
                                <td><input type="checkbox" checked={selectedApplicants.includes(applicant.id)} onChange={() => toggleApplicantSelection(applicant.id)} disabled={applicant.imported} /></td>
                              )}
                              <td className="applicant-name-usermgmtad"><FaUserGraduate />{applicant.fullName}</td>
                              <td>{applicant.email}</td>
                              <td>{applicant.phone || '—'}</td>
                              <td><span className="position-badge-usermgmtad">{applicant.position}</span></td>
                              <td>{formatDate(applicant.submittedAt)}</td>
                              <td>
                                {applicant.imported ? (
                                  <span className="imported-badge-usermgmtad"><FaCheckDouble /> Imported</span>
                                ) : (
                                  <span className="pending-badge-usermgmtad">Pending Import</span>
                                )}
                              </td>
                              <td>
                                {!applicant.imported && (
                                  <button className="import-btn-usermgmtad" onClick={() => handleImportEngineer(applicant.id)} disabled={isSubmitting}>
                                    <FaCloudUploadAlt /> Import
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
              <div className="modal-actions-usermgmtad">
                <button className="cancel-btn-usermgmtad" onClick={() => setShowImportModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* User Modal (Create/Edit/View) */}
        {showUserModal && (
          <div className="modal-overlay-usermgmtad" onClick={() => setShowUserModal(false)}>
            <div className={`modal-content-usermgmtad user-modal-usermgmtad ${modalMode}`} onClick={e => e.stopPropagation()}>
              <div className="modal-header-usermgmtad">
                <h3>{modalMode === 'view' ? 'User Details' : modalMode === 'edit' ? 'Edit User' : 'Create New User'}</h3>
                <button className="modal-close-usermgmtad" onClick={() => setShowUserModal(false)}>×</button>
              </div>
              <div className="modal-body-usermgmtad">
                {modalMode === 'view' && selectedUser && (
                  <div className="user-details-view-usermgmtad">
                    <div className="detail-section-usermgmtad">
                      <h4>Account Information</h4>
                      <div className="detail-row-usermgmtad"><span>Full Name:</span><strong>{selectedUser.fullName || '—'}</strong></div>
                      <div className="detail-row-usermgmtad"><span>Email:</span><strong>{selectedUser.email}</strong></div>
                      <div className="detail-row-usermgmtad"><span>Role:</span><strong>{getRoleBadge(selectedUser.role)}</strong></div>
                      <div className="detail-row-usermgmtad"><span>Status:</span><strong>{getStatusBadge(selectedUser.isActive)}</strong></div>
                      <div className="detail-row-usermgmtad"><span>Created:</span><strong>{formatDate(selectedUser.createdAt)}</strong></div>
                      <div className="detail-row-usermgmtad"><span>Last Login:</span><strong>{formatDate(selectedUser.lastLogin)}</strong></div>
                    </div>
                    {selectedUser.clientInfo && (
                      <div className="detail-section-usermgmtad">
                        <h4>Client Information</h4>
                        <div className="detail-row-usermgmtad"><span>First Name:</span><strong>{selectedUser.clientInfo.firstName || '—'}</strong></div>
                        <div className="detail-row-usermgmtad"><span>Last Name:</span><strong>{selectedUser.clientInfo.lastName || '—'}</strong></div>
                        <div className="detail-row-usermgmtad"><span>Contact Number:</span><strong>{selectedUser.clientInfo.contactNumber || '—'}</strong></div>
                      </div>
                    )}
                  </div>
                )}
                {(modalMode === 'edit' || modalMode === 'create') && (
                  <form className="user-form-usermgmtad">
                    <div className="form-row-usermgmtad">
                      <div className="form-group-usermgmtad">
                        <label>First Name *</label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className={formErrors.firstName ? 'error-usermgmtad' : ''}
                        />
                        {formErrors.firstName && <span className="error-text-usermgmtad">{formErrors.firstName}</span>}
                      </div>
                      
                      <div className="form-group-usermgmtad">
                        <label>Last Name *</label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className={formErrors.lastName ? 'error-usermgmtad' : ''}
                        />
                        {formErrors.lastName && <span className="error-text-usermgmtad">{formErrors.lastName}</span>}
                      </div>
                    </div>
                    <div className="form-row-usermgmtad">
                      <div className="form-group-usermgmtad">
                        <label>Email Address *</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          disabled={modalMode === 'edit'}
                          className={formErrors.email ? 'error-usermgmtad' : ''}
                        />
                        {formErrors.email && <span className="error-text-usermgmtad">{formErrors.email}</span>}
                        {modalMode === 'edit' && <small>Email cannot be changed</small>}
                      </div>
                      <div className="form-group-usermgmtad">
                        <label>Contact Number</label>
                        <input
                          type="tel"
                          value={formData.contactNumber}
                          onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="form-row-usermgmtad">
                      
                    </div>
                    {modalMode === 'create' && (
                      <div className="form-row-usermgmtad">
                        <div className="form-group-usermgmtad">
                          <label>Password *</label>
                          <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className={formErrors.password ? 'error-usermgmtad' : ''}
                          />
                          {formErrors.password && <span className="error-text-usermgmtad">{formErrors.password}</span>}
                          <small>Password must be at least 6 characters</small>
                        </div>
                        <div className="form-group-usermgmtad">
                          <label>Confirm Password *</label>
                          <input
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className={formErrors.confirmPassword ? 'error-usermgmtad' : ''}
                          />
                          {formErrors.confirmPassword && <span className="error-text-usermgmtad">{formErrors.confirmPassword}</span>}
                        </div>
                      </div>
                    )}
                  </form>
                )}
              </div>
              <div className="modal-actions-usermgmtad">
                <button className="cancel-btn-usermgmtad" onClick={() => setShowUserModal(false)}>Cancel</button>
                {(modalMode === 'edit' || modalMode === 'create') && (
                  <button className="save-btn-usermgmtad" onClick={handleSaveUser} disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save User'}</button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Password Reset Modal */}
        {showPasswordModal && selectedUser && (
          <div className="modal-overlay-usermgmtad" onClick={() => setShowPasswordModal(false)}>
            <div className="modal-content-usermgmtad password-modal-usermgmtad" onClick={e => e.stopPropagation()}>
              <div className="modal-header-usermgmtad"><h3>Reset Password</h3><button className="modal-close-usermgmtad" onClick={() => setShowPasswordModal(false)}>×</button></div>
              <div className="modal-body-usermgmtad">
                <div className="user-info-summary-usermgmtad"><p><strong>User:</strong> {selectedUser.fullName || selectedUser.email}</p><p><strong>Role:</strong> {getRoleBadge(selectedUser.role)}</p></div>
                <div className="form-row-usermgmtad">
                  <div className="form-group-usermgmtad"><label>New Password *</label><input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className={passwordErrors.password ? 'error-usermgmtad' : ''} />{passwordErrors.password && <span className="error-text-usermgmtad">{passwordErrors.password}</span>}<small>Password must be at least 6 characters</small></div>
                </div>
                <div className="form-row-usermgmtad">
                  <div className="form-group-usermgmtad"><label>Confirm Password *</label><input type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className={passwordErrors.confirmPassword ? 'error-usermgmtad' : ''} />{passwordErrors.confirmPassword && <span className="error-text-usermgmtad">{passwordErrors.confirmPassword}</span>}</div>
                </div>
              </div>
              <div className="modal-actions-usermgmtad">
                <button className="cancel-btn-usermgmtad" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                <button className="save-btn-usermgmtad" onClick={handleResetPassword} disabled={isSubmitting}>{isSubmitting ? 'Resetting...' : 'Reset Password'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && selectedUser && (
          <div className="modal-overlay-usermgmtad" onClick={() => setShowDeleteConfirm(false)}>
            <div className="modal-content-usermgmtad confirm-modal-usermgmtad" onClick={e => e.stopPropagation()}>
              <div className="confirm-icon-usermgmtad"><FaExclamationTriangle /></div>
              <h3>Delete User</h3>
              <p>Are you sure you want to delete <strong>{selectedUser.fullName || selectedUser.email}</strong>?</p>
              <p className="warning-text-usermgmtad">This action cannot be undone.</p>
              <div className="modal-actions-usermgmtad">
                <button className="cancel-btn-usermgmtad" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                <button className="delete-btn-usermgmtad" onClick={handleDeleteUser} disabled={isSubmitting}>{isSubmitting ? 'Deleting...' : 'Delete User'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Status Toggle Modal */}
        {showStatusConfirm && selectedUser && (
          <div className="modal-overlay-usermgmtad" onClick={() => setShowStatusConfirm(false)}>
            <div className="modal-content-usermgmtad confirm-modal-usermgmtad" onClick={e => e.stopPropagation()}>
              <div className="confirm-icon-usermgmtad">{statusAction === 'deactivate' ? <FaBan /> : <FaCheck />}</div>
              <h3>{statusAction === 'deactivate' ? 'Deactivate User' : 'Activate User'}</h3>
              <p>Are you sure you want to <strong>{statusAction}</strong> <strong>{selectedUser.fullName || selectedUser.email}</strong>?</p>
              <div className="modal-actions-usermgmtad">
                <button className="cancel-btn-usermgmtad" onClick={() => setShowStatusConfirm(false)}>Cancel</button>
                <button className="delete-btn-usermgmtad" onClick={handleToggleStatus} disabled={isSubmitting}>{isSubmitting ? 'Processing...' : statusAction}</button>
              </div>
            </div>
          </div>
        )}

        <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      </div>
    </>
  );
};

export default UserManagement;