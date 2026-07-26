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
  FaChevronDown,
  FaHistory,
  FaClipboardList,
  FaUser,
  FaCog,
  FaCalendarAlt
} from 'react-icons/fa';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import '../../styles/Admin/usermanagement.css';

const UserManagement = () => {
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
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
  const [auditCurrentPage, setAuditCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [auditTotalItems, setAuditTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const [auditItemsPerPage] = useState(10);
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
    if (activeTab === 'users') {
      fetchUsers();
      fetchStats();
    } else if (activeTab === 'audit') {
      fetchAuditLogs();
    }

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
  }, [filterRole, currentPage, activeTab, auditCurrentPage]);

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

  const fetchAuditLogs = async () => {
    try {
      setAuditLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/audit`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: auditCurrentPage,
          limit: auditItemsPerPage
        }
      });
      setAuditLogs(response.data.data || []);
      setAuditTotalItems(response.data.total || 0);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      showToast('Failed to load audit logs', 'error');
    } finally {
      setAuditLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    if (activeTab === 'users') {
      setCurrentPage(1);
    } else {
      setAuditCurrentPage(1);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return user.fullName?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.clientInfo?.contactNumber?.includes(searchTerm);
  });

  const filteredAuditLogs = auditLogs.filter(log => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      log.user?.fullName?.toLowerCase().includes(searchLower) ||
      log.user?.email?.toLowerCase().includes(searchLower) ||
      log.module?.toLowerCase().includes(searchLower) ||
      log.action?.toLowerCase().includes(searchLower) ||
      log.role?.toLowerCase().includes(searchLower)
    );
  });

  const auditFilteredTotal = filteredAuditLogs.length;
  const auditTotalPages = Math.ceil(auditFilteredTotal / auditItemsPerPage);
  const auditStartItem = (auditCurrentPage - 1) * auditItemsPerPage + 1;
  const auditEndItem = Math.min(auditCurrentPage * auditItemsPerPage, auditFilteredTotal);
  const paginatedAuditLogs = filteredAuditLogs.slice(
    (auditCurrentPage - 1) * auditItemsPerPage,
    auditCurrentPage * auditItemsPerPage
  );

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
        if (activeTab === 'audit') fetchAuditLogs();
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
        if (activeTab === 'audit') fetchAuditLogs();
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
        if (activeTab === 'audit') fetchAuditLogs();
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
        if (activeTab === 'audit') fetchAuditLogs();
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
      admin: <span className="role-badge-usermanagement admin">Admin</span>,
      engineer: <span className="role-badge-usermanagement engineer">Engineer</span>,
      user: <span className="role-badge-usermanagement user">Customer</span>
    };
    return badges[role] || <span className="role-badge-usermanagement">{role}</span>;
  };

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return <span className="status-badge-usermanagement active"><FaCheckCircle /> Active</span>;
    }
    return <span className="status-badge-usermanagement inactive"><FaTimesCircle /> Inactive</span>;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getModuleIcon = (module) => {
    const icons = {
      'User': <FaUser />,
      'Admin': <FaCog />,
      'System': <FaClipboardList />
    };
    return icons[module] || <FaClipboardList />;
  };

  const getActionBadge = (action) => {
    const badges = {
      'Create': <span className="action-badge-usermanagement">Create</span>,
      'Update': <span className="action-badge-usermanagement">Update</span>,
      'Delete': <span className="action-badge-usermanagement">Delete</span>,
      'Login': <span className="action-badge-usermanagement">Login</span>,
      'Logout': <span className="action-badge-usermanagement">Logout</span>,
      'Status Change': <span className="action-badge-usermanagement">Status Change</span>,
      'Password Reset': <span className="action-badge-usermanagement">Password Reset</span>
    };
    return badges[action] || <span className="action-badge-usermanagement">{action}</span>;
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

  // Calculate pagination for users
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = (total, current, maxVisible = 5) => {
    const pages = [];
    let startPage = Math.max(1, current - Math.floor(maxVisible / 2));
    let endPage = Math.min(total, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  // Get audit page numbers
  const auditPageNumbers = getPageNumbers(auditTotalPages, auditCurrentPage);

  const SkeletonLoader = () => (
    <div className="user-management-usermanagement">
      <div className="user-management-header-usermanagement">
        <div className="skeleton-line-large-usermanagement"></div>
        <div className="skeleton-button-usermanagement"></div>
      </div>
      <div className="user-tabs-usermanagement">
        <div className="skeleton-tab-usermanagement"></div>
        <div className="skeleton-tab-usermanagement"></div>
        <div className="skeleton-tab-usermanagement"></div>
        <div className="skeleton-tab-usermanagement"></div>
      </div>
      <div className="user-filters-section-usermanagement">
        <div className="skeleton-search-usermanagement"></div>
      </div>
      <div className="users-table-container-usermanagement">
        <div className="skeleton-table-usermanagement"></div>
      </div>
    </div>
  );

  if (loading && users.length === 0 && activeTab === 'users') {
    return <SkeletonLoader />;
  }

  if (auditLoading && activeTab === 'audit') {
    return <SkeletonLoader />;
  }

  return (
    <>
      <Helmet>
        <title>User Management | Admin | Salfer Engineering</title>
      </Helmet>

      <div className="user-management-usermanagement">
        {/* --- Minimalist Header --- */}
        <div className="user-management-header-usermanagement">
          <div></div>
        </div>

        {/* --- Tabs + Buttons Wrapper --- */}
        <div className="user-tabs-wrapper-usermanagement">
          <div className="user-tabs-usermanagement">
            <button
              className={`tab-btn-usermanagement ${activeTab === 'users' ? 'active-usermanagement' : ''}`}
              onClick={() => { setActiveTab('users'); setSearchTerm(''); setCurrentPage(1); setAuditCurrentPage(1); }}
            >
              <FaUsers /> Users
              <span className="tab-badge-usermanagement">{stats.total}</span>
            </button>
            <button
              className={`tab-btn-usermanagement ${activeTab === 'audit' ? 'active-usermanagement' : ''}`}
              onClick={() => { setActiveTab('audit'); setSearchTerm(''); setCurrentPage(1); setAuditCurrentPage(1); }}
            >
              <FaHistory /> Audit Logs
            </button>
          </div>

          <div className="user-tab-actions-usermanagement">
            {activeTab === 'users' && (
              <button className="create-user-btn-usermanagement" onClick={handleOpenCreateModal}>
                <FaUserPlus /> Add User
              </button>
            )}
            {activeTab === 'audit' && (
              <button className="refresh-btn-usermanagement" onClick={fetchAuditLogs}>
                <FaHistory /> Refresh Logs
              </button>
            )}
          </div>
        </div>

        {/* --- Filters --- */}
        <div className="user-filters-section-usermanagement">
          <div className="search-box-usermanagement">
            <FaSearch className="search-icon-usermanagement" />
            <input
              type="text"
              placeholder={activeTab === 'users' ? "Search by name, email, or contact number..." : "Search logs by user, module, action, or role..."}
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          {activeTab === 'users' && (
            <div className="filter-role-usermanagement">
              <select value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setCurrentPage(1); }}>
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="engineer">Engineer</option>
                <option value="user">Customer</option>
              </select>
            </div>
          )}
        </div>

        {/* Users Table */}
        {activeTab === 'users' && (
          <div className="users-table-container-usermanagement">
            <table className="users-table-usermanagement">
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
                    <td colSpan="7" className="empty-state-usermanagement">
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
                          <div className="user-cell-content-usermanagement">
                            <div className="user-avatar-usermanagement">
                              {user.clientInfo?.firstName ? (
                                <div className="avatar-initials-usermanagement">{user.clientInfo.firstName[0]}{user.clientInfo.lastName?.[0]}</div>
                              ) : (
                                <FaUserCircle className="avatar-icon-usermanagement" />
                              )}
                            </div>
                            <div className="user-name-usermanagement">{user.fullName || '—'}</div>
                          </div>
                        </td>
                        <td className="email-cell-usermanagement">
                          <FaEnvelope className="email-icon-usermanagement" />
                          <span className="email-text-usermanagement">{user.email}</span>
                        </td>
                        <td className="contact-cell-usermanagement">
                          {user.clientInfo?.contactNumber || '—'}
                        </td>
                        <td>{getRoleBadge(user.role)}</td>
                        <td>{getStatusBadge(user.isActive)}</td>
                        <td>{formatDate(user.createdAt)}</td>
                        <td style={{ textAlign: 'center', position: 'relative' }}>
                          <div className="action-dropdown-container-usermanagement">
                            <button
                              className="action-dropdown-toggle-usermanagement"
                              ref={el => buttonRefs.current[user._id] = el}
                              onClick={(e) => handleDropdownClick(e, user._id)}
                            >
                              Action <FaChevronDown className={`dropdown-arrow-usermanagement ${isOpen ? 'open-usermanagement' : ''}`} />
                            </button>
                            {isOpen && (
                              <div
                                className="action-dropdown-menu-usermanagement"
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
                                    className={`dropdown-item-usermanagement ${action.color || ''}`}
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
        )}

        {/* Audit Logs Table */}
        {activeTab === 'audit' && (
          <div className="users-table-container-usermanagement audit-logs-table-usermanagement">
            <table className="users-table-usermanagement">
              <thead>
                <tr>
                  <th style={{ width: '18%' }}>User</th>
                  <th style={{ width: '12%' }}>Role</th>
                  <th style={{ width: '15%' }}>Module</th>
                  <th style={{ width: '18%' }}>Action</th>
                  <th style={{ width: '22%' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-state-usermanagement">
                      <p>No audit logs found</p>
                    </td>
                  </tr>
                ) : (
                  paginatedAuditLogs.map(log => {
                    let userDisplayName = 'Unknown User';
                    let userInitials = '?';

                    if (log.user) {
                      if (log.user.fullName) {
                        userDisplayName = log.user.fullName;
                        const nameParts = log.user.fullName.trim().split(' ');
                        if (nameParts.length >= 2) {
                          userInitials = nameParts[0][0] + nameParts[nameParts.length - 1][0];
                        } else if (nameParts.length === 1) {
                          userInitials = nameParts[0][0];
                        }
                      } else if (log.user.email) {
                        userDisplayName = log.user.email;
                        userInitials = log.user.email[0].toUpperCase();
                      }
                    }

                    return (
                      <tr key={log._id}>
                        <td>
                          <div className="user-cell-content-usermanagement">
                            <div className="user-avatar-usermanagement small-avatar-usermanagement">
                              <div className="avatar-initials-usermanagement">{userInitials}</div>
                            </div>
                            <div className="user-name-usermanagement">{userDisplayName}</div>
                          </div>
                        </td>
                        <td>{getRoleBadge(log.role)}</td>
                        <td>
                          <span className="module-badge-usermanagement">
                            {getModuleIcon(log.module)} {log.module}
                          </span>
                        </td>
                        <td>{getActionBadge(log.action)}</td>
                        <td>
                          <div className="timestamp-cell-usermanagement">
                            <FaCalendarAlt className="timestamp-icon-usermanagement" />
                            <span>{formatDateTime(log.createdAt)}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination - Users */}
        {activeTab === 'users' && totalPages > 1 && (
          <div className="pagination-usermanagement">
            <div className="pagination-info-usermanagement">
              Showing {startItem} to {endItem} of {totalItems} entries
            </div>
            <div className="pagination-controls-usermanagement">
              <button
                className="page-btn-usermanagement"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <FaChevronLeft /> Previous
              </button>

              {getPageNumbers(totalPages, currentPage).map(page => (
                <button
                  key={page}
                  className={`page-number-usermanagement ${currentPage === page ? 'active-usermanagement' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

              <button
                className="page-btn-usermanagement"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next <FaChevronRight />
              </button>
            </div>
          </div>
        )}

        {/* Pagination - Audit Logs */}
        {activeTab === 'audit' && auditTotalPages > 1 && (
          <div className="pagination-usermanagement">
            <div className="pagination-info-usermanagement">
              Showing {auditStartItem} to {auditEndItem} of {auditFilteredTotal} entries
            </div>
            <div className="pagination-controls-usermanagement">
              <button
                className="page-btn-usermanagement"
                onClick={() => setAuditCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={auditCurrentPage === 1}
              >
                <FaChevronLeft /> Previous
              </button>

              {auditPageNumbers.map(page => (
                <button
                  key={page}
                  className={`page-number-usermanagement ${auditCurrentPage === page ? 'active-usermanagement' : ''}`}
                  onClick={() => setAuditCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

              <button
                className="page-btn-usermanagement"
                onClick={() => setAuditCurrentPage(prev => Math.min(auditTotalPages, prev + 1))}
                disabled={auditCurrentPage === auditTotalPages}
              >
                Next <FaChevronRight />
              </button>
            </div>
          </div>
        )}

        {/* User Modal */}
        {showUserModal && (
          <div className="modal-overlay-usermanagement" onClick={() => setShowUserModal(false)}>
            <div className={`modal-content-usermanagement user-modal-usermanagement ${modalMode}`} onClick={e => e.stopPropagation()}>
              <div className="modal-header-usermanagement">
                <h3>{modalMode === 'view' ? 'User Details' : modalMode === 'edit' ? 'Edit User' : 'Create New User'}</h3>
                <button className="modal-close-usermanagement" onClick={() => setShowUserModal(false)}>×</button>
              </div>
              <div className="modal-body-usermanagement">
                {modalMode === 'view' && selectedUser && (
                  <div className="user-details-view-usermanagement">
                    <div className="detail-section-usermanagement">
                      <h4>Account Information</h4>
                      <div className="detail-row-usermanagement"><span>Full Name:</span><strong>{selectedUser.fullName || '—'}</strong></div>
                      <div className="detail-row-usermanagement"><span>Email:</span><strong>{selectedUser.email}</strong></div>
                      <div className="detail-row-usermanagement"><span>Role:</span><strong>{getRoleBadge(selectedUser.role)}</strong></div>
                      <div className="detail-row-usermanagement"><span>Status:</span><strong>{getStatusBadge(selectedUser.isActive)}</strong></div>
                      <div className="detail-row-usermanagement"><span>Created:</span><strong>{formatDate(selectedUser.createdAt)}</strong></div>
                      <div className="detail-row-usermanagement"><span>Last Login:</span><strong>{formatDate(selectedUser.lastLogin)}</strong></div>
                    </div>
                    {selectedUser.clientInfo && (
                      <div className="detail-section-usermanagement">
                        <h4>Client Information</h4>
                        <div className="detail-row-usermanagement"><span>First Name:</span><strong>{selectedUser.clientInfo.firstName || '—'}</strong></div>
                        <div className="detail-row-usermanagement"><span>Last Name:</span><strong>{selectedUser.clientInfo.lastName || '—'}</strong></div>
                        <div className="detail-row-usermanagement"><span>Contact Number:</span><strong>{selectedUser.clientInfo.contactNumber || '—'}</strong></div>
                      </div>
                    )}
                  </div>
                )}
                {(modalMode === 'edit' || modalMode === 'create') && (
                  <form className="user-form-usermanagement">
                    <div className="form-row-usermanagement">
                      <div className="form-group-usermanagement">
                        <label>First Name *</label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className={formErrors.firstName ? 'error' : ''}
                        />
                        {formErrors.firstName && <span className="error-text-usermanagement">{formErrors.firstName}</span>}
                      </div>
                      <div className="form-group-usermanagement">
                        <label>Last Name *</label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className={formErrors.lastName ? 'error' : ''}
                        />
                        {formErrors.lastName && <span className="error-text-usermanagement">{formErrors.lastName}</span>}
                      </div>
                    </div>
                    <div className="form-row-usermanagement">
                      <div className="form-group-usermanagement">
                        <label>Email Address *</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          disabled={modalMode === 'edit'}
                          className={formErrors.email ? 'error' : ''}
                        />
                        {formErrors.email && <span className="error-text-usermanagement">{formErrors.email}</span>}
                        {modalMode === 'edit' && <small>Email cannot be changed</small>}
                      </div>
                      <div className="form-group-usermanagement">
                        <label>Contact Number</label>
                        <input
                          type="tel"
                          value={formData.contactNumber}
                          onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                        />
                      </div>
                    </div>
                    {modalMode === 'create' && (
                      <div className="form-row-usermanagement">
                        <div className="form-group-usermanagement">
                          <label>Password *</label>
                          <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className={formErrors.password ? 'error' : ''}
                          />
                          {formErrors.password && <span className="error-text-usermanagement">{formErrors.password}</span>}
                          <small>Password must be at least 6 characters</small>
                        </div>
                        <div className="form-group-usermanagement">
                          <label>Confirm Password *</label>
                          <input
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className={formErrors.confirmPassword ? 'error' : ''}
                          />
                          {formErrors.confirmPassword && <span className="error-text-usermanagement">{formErrors.confirmPassword}</span>}
                        </div>
                      </div>
                    )}
                  </form>
                )}
              </div>
              <div className="modal-actions-usermanagement">
                <button className="cancel-btn-usermanagement" onClick={() => setShowUserModal(false)}>Cancel</button>
                {(modalMode === 'edit' || modalMode === 'create') && (
                  <button className="save-btn-usermanagement" onClick={handleSaveUser} disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save User'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Password Reset Modal */}
        {showPasswordModal && selectedUser && (
          <div className="modal-overlay-usermanagement" onClick={() => setShowPasswordModal(false)}>
            <div className="modal-content-usermanagement password-modal-usermanagement" onClick={e => e.stopPropagation()}>
              <div className="modal-header-usermanagement">
                <h3>Reset Password</h3>
                <button className="modal-close-usermanagement" onClick={() => setShowPasswordModal(false)}>×</button>
              </div>
              <div className="modal-body-usermanagement">
                <div className="user-info-summary-usermanagement">
                  <p><strong>User:</strong> {selectedUser.fullName || selectedUser.email}</p>
                  <p><strong>Role:</strong> {getRoleBadge(selectedUser.role)}</p>
                </div>
                <div className="form-row-usermanagement">
                  <div className="form-group-usermanagement">
                    <label>New Password *</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={passwordErrors.password ? 'error' : ''}
                    />
                    {passwordErrors.password && <span className="error-text-usermanagement">{passwordErrors.password}</span>}
                    <small>Password must be at least 6 characters</small>
                  </div>
                </div>
                <div className="form-row-usermanagement">
                  <div className="form-group-usermanagement">
                    <label>Confirm Password *</label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className={passwordErrors.confirmPassword ? 'error' : ''}
                    />
                    {passwordErrors.confirmPassword && <span className="error-text-usermanagement">{passwordErrors.confirmPassword}</span>}
                  </div>
                </div>
              </div>
              <div className="modal-actions-usermanagement">
                <button className="cancel-btn-usermanagement" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                <button className="save-btn-usermanagement" onClick={handleResetPassword} disabled={isSubmitting}>
                  {isSubmitting ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && selectedUser && (
          <div className="modal-overlay-usermanagement" onClick={() => setShowDeleteConfirm(false)}>
            <div className="modal-content-usermanagement confirm-modal-usermanagement" onClick={e => e.stopPropagation()}>
              <div className="confirm-icon-usermanagement"><FaExclamationTriangle /></div>
              <h3>Delete User</h3>
              <p>Are you sure you want to delete <strong>{selectedUser.fullName || selectedUser.email}</strong>?</p>
              <p className="warning-text-usermanagement">This action cannot be undone.</p>
              <div className="modal-actions-usermanagement">
                <button className="cancel-btn-usermanagement" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                <button className="delete-btn-usermanagement" onClick={handleDeleteUser} disabled={isSubmitting}>
                  {isSubmitting ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Toggle Modal */}
        {showStatusConfirm && selectedUser && (
          <div className="modal-overlay-usermanagement" onClick={() => setShowStatusConfirm(false)}>
            <div className="modal-content-usermanagement confirm-modal-usermanagement" onClick={e => e.stopPropagation()}>
              <div className="confirm-icon-usermanagement">{statusAction === 'deactivate' ? <FaBan /> : <FaCheck />}</div>
              <h3>{statusAction === 'deactivate' ? 'Deactivate User' : 'Activate User'}</h3>
              <p>Are you sure you want to <strong>{statusAction}</strong> <strong>{selectedUser.fullName || selectedUser.email}</strong>?</p>
              <div className="modal-actions-usermanagement">
                <button className="cancel-btn-usermanagement" onClick={() => setShowStatusConfirm(false)}>Cancel</button>
                <button className="delete-btn-usermanagement" onClick={handleToggleStatus} disabled={isSubmitting}>
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