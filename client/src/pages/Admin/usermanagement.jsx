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
  FaChevronLeft,
  FaChevronRight,
  FaEye,
  FaEnvelope,
  FaBan,
  FaCheck,
  FaExclamationTriangle,
  FaKey,
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
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(5);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [statusAction, setStatusAction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMode, setModalMode] = useState('view');
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 20 });
  const dropdownRef = useRef(null);
  const buttonRefs = useRef({});

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
    
    const handleScroll = () => {
      setOpenDropdownId(null);
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [filterRole, currentPage]);

  const handleDropdownClick = (event, userId) => {
    event.stopPropagation();
    const buttonRect = event.currentTarget.getBoundingClientRect();
    setDropdownPosition({
      top: buttonRect.bottom + 5,
      right: window.innerWidth - buttonRect.right - 10,
    });
    setOpenDropdownId(openDropdownId === userId ? null : userId);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          role: filterRole === 'all' ? undefined : filterRole,
          page: currentPage,
          limit: itemsPerPage
        }
      });
      setUsers(response.data.users || []);
      setTotalItems(response.data.total || 0);
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
    
    let firstName = '';
    let lastName = '';
    
    if (user.clientInfo?.firstName && user.clientInfo?.lastName) {
      firstName = user.clientInfo.firstName;
      lastName = user.clientInfo.lastName;
    } else if (user.fullName) {
      const nameParts = user.fullName.trim().split(' ');
      if (nameParts.length === 1) {
        firstName = nameParts[0];
        lastName = '';
      } else {
        lastName = nameParts.pop();
        firstName = nameParts.join(' ');
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
      const normalizedEmail = formData.email.toLowerCase();
      
      let response;

      if (modalMode === 'create') {
        response = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/users`,
          {
            email: normalizedEmail,
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
      admin: <span className="role-badge admin">Admin</span>,
      engineer: <span className="role-badge engineer">Engineer</span>,
      user: <span className="role-badge user">Customer</span>
    };
    return badges[role] || <span className="role-badge">{role}</span>;
  };

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return <span className="status-badge active"><FaCheckCircle /> Active</span>;
    }
    return <span className="status-badge inactive"><FaTimesCircle /> Inactive</span>;
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

  // Calculate pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const SkeletonLoader = () => (
    <div className="user-management">
      <div className="user-management-header">
        <div className="skeleton-line large"></div>
        <div className="skeleton-button"></div>
      </div>
      <div className="user-tabs">
        <div className="skeleton-tab"></div>
        <div className="skeleton-tab"></div>
        <div className="skeleton-tab"></div>
        <div className="skeleton-tab"></div>
      </div>
      <div className="user-filters-section">
        <div className="skeleton-search"></div>
      </div>
      <div className="users-table-container">
        <div className="skeleton-table"></div>
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

      <div className="user-management">
        <div className="user-management-header">
          <div>
            <h1>User Management</h1>
            <p>Manage system users, roles, and permissions</p>
          </div>
          
          <button className="create-user-btn" onClick={handleOpenCreateModal}>
            <FaUserPlus /> Add User
          </button>
        </div>

        {/* Tabs */}
        <div className="user-tabs">
          <button 
            className={`tab-btn ${filterRole === 'all' ? 'active' : ''}`} 
            onClick={() => { setFilterRole('all'); setCurrentPage(1); }}
          >
            All Users
            <span className="tab-badge">{stats.total}</span>
          </button>
          <button 
            className={`tab-btn ${filterRole === 'admin' ? 'active' : ''}`} 
            onClick={() => { setFilterRole('admin'); setCurrentPage(1); }}
          >
            Admins
            <span className="tab-badge">{stats.byRole?.admin || 0}</span>
          </button>
          <button 
            className={`tab-btn ${filterRole === 'engineer' ? 'active' : ''}`} 
            onClick={() => { setFilterRole('engineer'); setCurrentPage(1); }}
          >
            Engineers
            <span className="tab-badge">{stats.byRole?.engineer || 0}</span>
          </button>
          <button 
            className={`tab-btn ${filterRole === 'user' ? 'active' : ''}`} 
            onClick={() => { setFilterRole('user'); setCurrentPage(1); }}
          >
            Customers
            <span className="tab-badge">{stats.byRole?.user || 0}</span>
          </button>
        </div>

        {/* Filters */}
        <div className="user-filters-section">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by name, email, or contact number..." 
              value={searchTerm} 
              onChange={handleSearch} 
            />
          </div>
        </div>

        {/* Table */}
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th style={{ width: '25%' }}>User</th>
                <th style={{ width: '25%' }}>Email</th>
                <th style={{ width: '12%' }}>Contact</th>
                <th style={{ width: '10%' }}>Role</th>
                <th style={{ width: '10%' }}>Status</th>
                <th style={{ width: '10%' }}>Created</th>
                <th style={{ width: '8%', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-state">
                    <p>No users found</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const actions = getAvailableActions(user);
                  const isOpen = openDropdownId === user._id;

                  return (
                    <tr key={user._id}>
                      <td>
                        <div className="user-cell-content">
                          <div className="user-avatar">
                            {user.clientInfo?.firstName ? (
                              <div className="avatar-initials">{user.clientInfo.firstName[0]}{user.clientInfo.lastName?.[0]}</div>
                            ) : (
                              <FaUserCircle className="avatar-icon" />
                            )}
                          </div>
                          <div className="user-name">{user.fullName || '—'}</div>
                        </div>
                      </td>
                      <td className="email-cell">
                        <FaEnvelope className="email-icon" />
                        <span className="email-text">{user.email}</span>
                      </td>
                      <td className="contact-cell">
                        {user.clientInfo?.contactNumber || '—'}
                      </td>
                      <td>{getRoleBadge(user.role)}</td>
                      <td>{getStatusBadge(user.isActive)}</td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td style={{ textAlign: 'center', position: 'relative' }}>
                        <div className="action-dropdown-container">
                          <button 
                            className="action-dropdown-toggle"
                            ref={el => buttonRefs.current[user._id] = el}
                            onClick={(e) => handleDropdownClick(e, user._id)}
                          >
                            Action <FaChevronDown className={`dropdown-arrow ${isOpen ? 'open' : ''}`} />
                          </button>
                          {isOpen && (
                            <div 
                              className="action-dropdown-menu"
                              ref={dropdownRef}
                              style={{
                                position: 'fixed',
                                top: dropdownPosition.top,
                                right: dropdownPosition.right,
                                zIndex: 9999,
                              }}
                            >
                              {actions.map((action, idx) => (
                                <button 
                                  key={idx} 
                                  className={`dropdown-item ${action.color || ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    action.action();
                                  }}
                                >
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <div className="pagination-info">
              Showing {startItem} to {endItem} of {totalItems} entries
            </div>
            <div className="pagination-controls">
              <button 
                className="page-btn" 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                disabled={currentPage === 1}
              >
                <FaChevronLeft /> Previous
              </button>
              
              {getPageNumbers().map(page => (
                <button
                  key={page}
                  className={`page-number ${currentPage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              
              <button 
                className="page-btn" 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                disabled={currentPage === totalPages}
              >
                Next <FaChevronRight />
              </button>
            </div>
          </div>
        )}

        {/* User Modal (Create/Edit/View) */}
        {showUserModal && (
          <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
            <div className={`modal-content user-modal ${modalMode}`} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{modalMode === 'view' ? 'User Details' : modalMode === 'edit' ? 'Edit User' : 'Create New User'}</h3>
                <button className="modal-close" onClick={() => setShowUserModal(false)}>×</button>
              </div>
              <div className="modal-body">
                {modalMode === 'view' && selectedUser && (
                  <div className="user-details-view">
                    <div className="detail-section">
                      <h4>Account Information</h4>
                      <div className="detail-row"><span>Full Name:</span><strong>{selectedUser.fullName || '—'}</strong></div>
                      <div className="detail-row"><span>Email:</span><strong>{selectedUser.email}</strong></div>
                      <div className="detail-row"><span>Role:</span><strong>{getRoleBadge(selectedUser.role)}</strong></div>
                      <div className="detail-row"><span>Status:</span><strong>{getStatusBadge(selectedUser.isActive)}</strong></div>
                      <div className="detail-row"><span>Created:</span><strong>{formatDate(selectedUser.createdAt)}</strong></div>
                      <div className="detail-row"><span>Last Login:</span><strong>{formatDate(selectedUser.lastLogin)}</strong></div>
                    </div>
                    {selectedUser.clientInfo && (
                      <div className="detail-section">
                        <h4>Client Information</h4>
                        <div className="detail-row"><span>First Name:</span><strong>{selectedUser.clientInfo.firstName || '—'}</strong></div>
                        <div className="detail-row"><span>Last Name:</span><strong>{selectedUser.clientInfo.lastName || '—'}</strong></div>
                        <div className="detail-row"><span>Contact Number:</span><strong>{selectedUser.clientInfo.contactNumber || '—'}</strong></div>
                      </div>
                    )}
                  </div>
                )}
                {(modalMode === 'edit' || modalMode === 'create') && (
                  <form className="user-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label>First Name *</label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className={formErrors.firstName ? 'error' : ''}
                        />
                        {formErrors.firstName && <span className="error-text">{formErrors.firstName}</span>}
                      </div>
                      <div className="form-group">
                        <label>Last Name *</label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className={formErrors.lastName ? 'error' : ''}
                        />
                        {formErrors.lastName && <span className="error-text">{formErrors.lastName}</span>}
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Email Address *</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          disabled={modalMode === 'edit'}
                          className={formErrors.email ? 'error' : ''}
                        />
                        {formErrors.email && <span className="error-text">{formErrors.email}</span>}
                        {modalMode === 'edit' && <small>Email cannot be changed</small>}
                      </div>
                      <div className="form-group">
                        <label>Contact Number</label>
                        <input
                          type="tel"
                          value={formData.contactNumber}
                          onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                        />
                      </div>
                    </div>
                    {modalMode === 'create' && (
                      <div className="form-row">
                        <div className="form-group">
                          <label>Password *</label>
                          <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className={formErrors.password ? 'error' : ''}
                          />
                          {formErrors.password && <span className="error-text">{formErrors.password}</span>}
                          <small>Password must be at least 6 characters</small>
                        </div>
                        <div className="form-group">
                          <label>Confirm Password *</label>
                          <input
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className={formErrors.confirmPassword ? 'error' : ''}
                          />
                          {formErrors.confirmPassword && <span className="error-text">{formErrors.confirmPassword}</span>}
                        </div>
                      </div>
                    )}
                  </form>
                )}
              </div>
              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowUserModal(false)}>Cancel</button>
                {(modalMode === 'edit' || modalMode === 'create') && (
                  <button className="save-btn" onClick={handleSaveUser} disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save User'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Password Reset Modal */}
        {showPasswordModal && selectedUser && (
          <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
            <div className="modal-content password-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Reset Password</h3>
                <button className="modal-close" onClick={() => setShowPasswordModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="user-info-summary">
                  <p><strong>User:</strong> {selectedUser.fullName || selectedUser.email}</p>
                  <p><strong>Role:</strong> {getRoleBadge(selectedUser.role)}</p>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>New Password *</label>
                    <input 
                      type="password" 
                      value={formData.password} 
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                      className={passwordErrors.password ? 'error' : ''} 
                    />
                    {passwordErrors.password && <span className="error-text">{passwordErrors.password}</span>}
                    <small>Password must be at least 6 characters</small>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Confirm Password *</label>
                    <input 
                      type="password" 
                      value={formData.confirmPassword} 
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} 
                      className={passwordErrors.confirmPassword ? 'error' : ''} 
                    />
                    {passwordErrors.confirmPassword && <span className="error-text">{passwordErrors.confirmPassword}</span>}
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                <button className="save-btn" onClick={handleResetPassword} disabled={isSubmitting}>
                  {isSubmitting ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && selectedUser && (
          <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="modal-content confirm-modal" onClick={e => e.stopPropagation()}>
              <div className="confirm-icon"><FaExclamationTriangle /></div>
              <h3>Delete User</h3>
              <p>Are you sure you want to delete <strong>{selectedUser.fullName || selectedUser.email}</strong>?</p>
              <p className="warning-text">This action cannot be undone.</p>
              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                <button className="delete-btn" onClick={handleDeleteUser} disabled={isSubmitting}>
                  {isSubmitting ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Toggle Modal */}
        {showStatusConfirm && selectedUser && (
          <div className="modal-overlay" onClick={() => setShowStatusConfirm(false)}>
            <div className="modal-content confirm-modal" onClick={e => e.stopPropagation()}>
              <div className="confirm-icon">{statusAction === 'deactivate' ? <FaBan /> : <FaCheck />}</div>
              <h3>{statusAction === 'deactivate' ? 'Deactivate User' : 'Activate User'}</h3>
              <p>Are you sure you want to <strong>{statusAction}</strong> <strong>{selectedUser.fullName || selectedUser.email}</strong>?</p>
              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowStatusConfirm(false)}>Cancel</button>
                <button className="delete-btn" onClick={handleToggleStatus} disabled={isSubmitting}>
                  {isSubmitting ? 'Processing...' : statusAction}
                </button>
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