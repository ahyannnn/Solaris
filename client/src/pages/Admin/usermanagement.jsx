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
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 20 });
  const dropdownRef = useRef(null);
  const buttonRefs = useRef({});

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

  // Fixed: Added missing dependencies
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
  }, [filterRole, currentPage]); // Keep these dependencies

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
        const applicantsWithNormalizedEmail = response.data.applicants.map(applicant => ({
          ...applicant,
          email: applicant.email ? applicant.email.toLowerCase() : applicant.email
        }));
        
        setHiredApplicants(applicantsWithNormalizedEmail);
        setImportStats({
          total: response.data.count,
          notImported: applicantsWithNormalizedEmail.filter(a => !a.imported).length,
          alreadyImported: applicantsWithNormalizedEmail.filter(a => a.imported).length
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
      applicant.email?.toLowerCase().includes(searchLower);
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
      admin: <span className="role-badge-usermgmtad admin-usermgmtad-finalday">Admin</span>,
      engineer: <span className="role-badge-usermgmtad engineer-usermgmtad-finalday">Engineer</span>,
      user: <span className="role-badge-usermgmtad user-usermgmtad-finalday">Customer</span>
    };
    return badges[role] || <span className="role-badge-usermgmtad-finalday">{role}</span>;
  };

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return <span className="status-badge-usermgmtad active-usermgmtad-finalday"><FaCheckCircle /> Active</span>;
    }
    return <span className="status-badge-usermgmtad inactive-usermgmtad-finalday"><FaTimesCircle /> Inactive</span>;
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
    <div className="user-management-usermgmtad-finalday">
      <div className="user-management-header-usermgmtad-finalday">
        <div className="skeleton-line-usermgmtad-finalday large-usermgmtad-finalday"></div>
        <div className="skeleton-button-usermgmtad-finalday"></div>
      </div>
      <div className="user-stats-cards-usermgmtad-finalday">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="stat-card-usermgmtad-finalday skeleton-card-usermgmtad-finalday">
            <div className="skeleton-line-usermgmtad-finalday small-usermgmtad-finalday"></div>
            <div className="skeleton-line-usermgmtad-finalday large-usermgmtad-finalday"></div>
          </div>
        ))}
      </div>
      <div className="user-filters-section-usermgmtad-finalday">
        <div className="skeleton-tabs-usermgmtad-finalday"></div>
        <div className="skeleton-search-usermgmtad-finalday"></div>
      </div>
      <div className="users-table-container-usermgmtad-finalday">
        <div className="skeleton-table-usermgmtad-finalday"></div>
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

      <div className="user-management-usermgmtad-finalday">
        <div className="user-management-header-usermgmtad-finalday">
          <div>
            <h1>User Management</h1>
            <p>Manage system users, roles, and permissions</p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="create-user-btn-usermgmtad-finalday" onClick={handleOpenImportModal} style={{ backgroundColor: '#6c757d' }}>
              <FaDatabase /> Import from Job Portal
            </button>
            <button className="create-user-btn-usermgmtad-finalday" onClick={handleOpenCreateModal}>
              <FaUserPlus /> Add User
            </button>
          </div>
        </div>

        <div className="user-stats-cards-usermgmtad-finalday">
          <div className="stat-card-usermgmtad-finalday total-usermgmtad-finalday">
            <div className="stat-info-usermgmtad-finalday">
              <span className="stat-value-usermgmtad-finalday">{stats.total}</span>
              <span className="stat-label-usermgmtad-finalday">Total Users</span>
            </div>
          </div>
          <div className="stat-card-usermgmtad-finalday active-usermgmtad-finalday">
            <div className="stat-info-usermgmtad-finalday">
              <span className="stat-value-usermgmtad-finalday">{stats.activeUsers}</span>
              <span className="stat-label-usermgmtad-finalday">Active Users</span>
            </div>
          </div>
          <div className="stat-card-usermgmtad-finalday inactive-usermgmtad-finalday">
            <div className="stat-info-usermgmtad-finalday">
              <span className="stat-value-usermgmtad-finalday">{stats.inactiveUsers}</span>
              <span className="stat-label-usermgmtad-finalday">Inactive Users</span>
            </div>
          </div>
          <div className="stat-card-usermgmtad-finalday new-usermgmtad-finalday">
            <div className="stat-info-usermgmtad-finalday">
              <span className="stat-value-usermgmtad-finalday">{stats.newThisMonth}</span>
              <span className="stat-label-usermgmtad-finalday">New This Month</span>
            </div>
          </div>
        </div>

        <div className="user-filters-section-usermgmtad-finalday">
          <div className="filter-tabs-usermgmtad-finalday">
            <button className={`filter-tab-usermgmtad-finalday ${filterRole === 'all' ? 'active-usermgmtad-finalday' : ''}`} onClick={() => setFilterRole('all')}>All Users</button>
            <button className={`filter-tab-usermgmtad-finalday ${filterRole === 'admin' ? 'active-usermgmtad-finalday' : ''}`} onClick={() => setFilterRole('admin')}>Admins</button>
            <button className={`filter-tab-usermgmtad-finalday ${filterRole === 'engineer' ? 'active-usermgmtad-finalday' : ''}`} onClick={() => setFilterRole('engineer')}>Engineers</button>
            <button className={`filter-tab-usermgmtad-finalday ${filterRole === 'user' ? 'active-usermgmtad-finalday' : ''}`} onClick={() => setFilterRole('user')}>Customers</button>
          </div>

          <div className="search-box-usermgmtad-finalday">
            <FaSearch className="search-icon-usermgmtad-finalday" />
            <input type="text" placeholder="Search by name, email, or contact number..." value={searchTerm} onChange={handleSearch} />
          </div>
        </div>

        <div className="users-table-container-usermgmtad-finalday">
          <table className="users-table-usermgmtad-finalday">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-state-usermgmtad-finalday">
                    <p>No users found</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const actions = getAvailableActions(user);
                  const isOpen = openDropdownId === user._id;

                  return (
                    <tr key={user._id}>
                      <td className="user-cell-usermgmtad-finalday">
                        <div className="user-avatar-usermgmtad-finalday">
                          {user.clientInfo?.firstName ? (
                            <div className="avatar-initials-usermgmtad-finalday">{user.clientInfo.firstName[0]}{user.clientInfo.lastName?.[0]}</div>
                          ) : <FaUserCircle />}
                        </div>
                        <div className="user-info-usermgmtad-finalday">
                          <div className="user-name-usermgmtad-finalday">{user.fullName}</div>
                          {user.clientInfo?.firstName && (
                            <div className="user-detail-usermgmtad-finalday">{user.clientInfo.firstName} {user.clientInfo.lastName}</div>
                          )}
                          {user.metadata?.importedFrom === 'job-portal' && (
                            <div className="import-badge-usermgmtad-finalday"><FaCloudUploadAlt /> Imported</div>
                          )}
                        </div>
                      </td>
                      <td className="email-cell-usermgmtad-finalday">
                        <FaEnvelope className="email-icon-usermgmtad-finalday" />
                        {user.email}
                      </td>
                      <td className="contact-cell-usermgmtad-finalday">
                        {user.clientInfo?.contactNumber || '—'}
                      </td>
                      <td>{getRoleBadge(user.role)}</td>
                      <td>{getStatusBadge(user.isActive)}</td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td style={{ textAlign: 'center', position: 'relative' }}>
                        <div className="action-dropdown-container-usermgmtad-finalday">
                          <button 
                            className="action-dropdown-toggle-usermgmtad-finalday"
                            ref={el => buttonRefs.current[user._id] = el}
                            onClick={(e) => handleDropdownClick(e, user._id)}
                          >
                            Action <FaChevronDown className={`dropdown-arrow-usermgmtad-finalday ${isOpen ? 'open-usermgmtad-finalday' : ''}`} />
                          </button>
                          {isOpen && (
                            <div 
                              className="action-dropdown-menu-usermgmtad-finalday"
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
                                  className={`dropdown-item-usermgmtad-finalday ${action.color || ''}`}
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

        {totalPages > 1 && (
          <div className="pagination-usermgmtad-finalday">
            <button className="page-btn-usermgmtad-finalday" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><FaChevronLeft /> Previous</button>
            <span className="page-info-usermgmtad-finalday">Page {currentPage} of {totalPages}</span>
            <button className="page-btn-usermgmtad-finalday" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next <FaChevronRight /></button>
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && (
          <div className="modal-overlay-usermgmtad-finalday" onClick={() => setShowImportModal(false)}>
            <div className="modal-content-usermgmtad-finalday import-modal-usermgmtad-finalday" onClick={e => e.stopPropagation()}>
              <div className="modal-header-usermgmtad-finalday">
                <h3><FaDatabase /> Import Engineers from Job Portal</h3>
                <button className="modal-close-usermgmtad-finalday" onClick={() => setShowImportModal(false)}>×</button>
              </div>
              <div className="modal-body-usermgmtad-finalday">
                {importStats && (
                  <div className="import-stats-usermgmtad-finalday">
                    <div className="stat-badge-usermgmtad-finalday">
                      <span>Total Hired: {importStats.total}</span>
                      <span>Not Imported: {importStats.notImported}</span>
                      <span>Already Imported: {importStats.alreadyImported}</span>
                    </div>
                  </div>
                )}
                <div className="import-controls-usermgmtad-finalday">
                  <div className="search-box-usermgmtad-finalday">
                    <FaSearch className="search-icon-usermgmtad-finalday" />
                    <input type="text" placeholder="Search applicants..." value={applicantSearchTerm} onChange={(e) => setApplicantSearchTerm(e.target.value)} />
                  </div>
                  {filteredApplicants.length > 0 && (
                    <div className="bulk-actions-usermgmtad-finalday">
                      <button className="bulk-import-btn-usermgmtad-finalday" onClick={() => setBulkImportMode(!bulkImportMode)}>
                        {bulkImportMode ? 'Cancel Bulk Mode' : 'Bulk Import Mode'}
                      </button>
                      {bulkImportMode && selectedApplicants.length > 0 && (
                        <button className="import-selected-btn-usermgmtad-finalday" onClick={handleBulkImport} disabled={isSubmitting}>
                          {isSubmitting ? 'Importing...' : `Import Selected (${selectedApplicants.length})`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="applicants-table-container-usermgmtad-finalday">
                  {loadingApplicants ? (
                    <div className="loading-spinner-usermgmtad-finalday"><FaSpinner className="spinner-usermgmtad-finalday" /><p>Loading...</p></div>
                  ) : (
                    <table className="applicants-table-usermgmtad-finalday">
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
                          <tr>
                            <td colSpan={bulkImportMode ? 8 : 7} className="empty-state-usermgmtad-finalday">
                              <p>No hired applicants found</p>
                            </td>
                          </tr>
                        ) : (
                          filteredApplicants.map(applicant => (
                            <tr key={applicant.id} className={applicant.imported ? 'imported-row-usermgmtad-finalday' : ''}>
                              {bulkImportMode && (
                                <td>
                                  <input 
                                    type="checkbox" 
                                    checked={selectedApplicants.includes(applicant.id)} 
                                    onChange={() => toggleApplicantSelection(applicant.id)} 
                                    disabled={applicant.imported} 
                                  />
                                </td>
                              )}
                              <td className="applicant-name-usermgmtad-finalday"><FaUserGraduate />{applicant.fullName}</td>
                              <td>{applicant.email}</td>
                              <td>{applicant.phone || '—'}</td>
                              <td><span className="position-badge-usermgmtad-finalday">{applicant.position}</span></td>
                              <td>{formatDate(applicant.submittedAt)}</td>
                              <td>
                                {applicant.imported ? (
                                  <span className="imported-badge-usermgmtad-finalday"><FaCheckDouble /> Imported</span>
                                ) : (
                                  <span className="pending-badge-usermgmtad-finalday">Pending Import</span>
                                )}
                              </td>
                              <td>
                                {!applicant.imported && (
                                  <button className="import-btn-usermgmtad-finalday" onClick={() => handleImportEngineer(applicant.id)} disabled={isSubmitting}>
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
              <div className="modal-actions-usermgmtad-finalday">
                <button className="cancel-btn-usermgmtad-finalday" onClick={() => setShowImportModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* User Modal (Create/Edit/View) */}
        {showUserModal && (
          <div className="modal-overlay-usermgmtad-finalday" onClick={() => setShowUserModal(false)}>
            <div className={`modal-content-usermgmtad-finalday user-modal-usermgmtad-finalday ${modalMode}`} onClick={e => e.stopPropagation()}>
              <div className="modal-header-usermgmtad-finalday">
                <h3>{modalMode === 'view' ? 'User Details' : modalMode === 'edit' ? 'Edit User' : 'Create New User'}</h3>
                <button className="modal-close-usermgmtad-finalday" onClick={() => setShowUserModal(false)}>×</button>
              </div>
              <div className="modal-body-usermgmtad-finalday">
                {modalMode === 'view' && selectedUser && (
                  <div className="user-details-view-usermgmtad-finalday">
                    <div className="detail-section-usermgmtad-finalday">
                      <h4>Account Information</h4>
                      <div className="detail-row-usermgmtad-finalday"><span>Full Name:</span><strong>{selectedUser.fullName || '—'}</strong></div>
                      <div className="detail-row-usermgmtad-finalday"><span>Email:</span><strong>{selectedUser.email}</strong></div>
                      <div className="detail-row-usermgmtad-finalday"><span>Role:</span><strong>{getRoleBadge(selectedUser.role)}</strong></div>
                      <div className="detail-row-usermgmtad-finalday"><span>Status:</span><strong>{getStatusBadge(selectedUser.isActive)}</strong></div>
                      <div className="detail-row-usermgmtad-finalday"><span>Created:</span><strong>{formatDate(selectedUser.createdAt)}</strong></div>
                      <div className="detail-row-usermgmtad-finalday"><span>Last Login:</span><strong>{formatDate(selectedUser.lastLogin)}</strong></div>
                    </div>
                    {selectedUser.clientInfo && (
                      <div className="detail-section-usermgmtad-finalday">
                        <h4>Client Information</h4>
                        <div className="detail-row-usermgmtad-finalday"><span>First Name:</span><strong>{selectedUser.clientInfo.firstName || '—'}</strong></div>
                        <div className="detail-row-usermgmtad-finalday"><span>Last Name:</span><strong>{selectedUser.clientInfo.lastName || '—'}</strong></div>
                        <div className="detail-row-usermgmtad-finalday"><span>Contact Number:</span><strong>{selectedUser.clientInfo.contactNumber || '—'}</strong></div>
                      </div>
                    )}
                  </div>
                )}
                {(modalMode === 'edit' || modalMode === 'create') && (
                  <form className="user-form-usermgmtad-finalday">
                    <div className="form-row-usermgmtad-finalday">
                      <div className="form-group-usermgmtad-finalday">
                        <label>First Name *</label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className={formErrors.firstName ? 'error-usermgmtad-finalday' : ''}
                        />
                        {formErrors.firstName && <span className="error-text-usermgmtad-finalday">{formErrors.firstName}</span>}
                      </div>
                      <div className="form-group-usermgmtad-finalday">
                        <label>Last Name *</label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className={formErrors.lastName ? 'error-usermgmtad-finalday' : ''}
                        />
                        {formErrors.lastName && <span className="error-text-usermgmtad-finalday">{formErrors.lastName}</span>}
                      </div>
                    </div>
                    <div className="form-row-usermgmtad-finalday">
                      <div className="form-group-usermgmtad-finalday">
                        <label>Email Address *</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          disabled={modalMode === 'edit'}
                          className={formErrors.email ? 'error-usermgmtad-finalday' : ''}
                        />
                        {formErrors.email && <span className="error-text-usermgmtad-finalday">{formErrors.email}</span>}
                        {modalMode === 'edit' && <small>Email cannot be changed</small>}
                      </div>
                      <div className="form-group-usermgmtad-finalday">
                        <label>Contact Number</label>
                        <input
                          type="tel"
                          value={formData.contactNumber}
                          onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                        />
                      </div>
                    </div>
                    {modalMode === 'create' && (
                      <div className="form-row-usermgmtad-finalday">
                        <div className="form-group-usermgmtad-finalday">
                          <label>Password *</label>
                          <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className={formErrors.password ? 'error-usermgmtad-finalday' : ''}
                          />
                          {formErrors.password && <span className="error-text-usermgmtad-finalday">{formErrors.password}</span>}
                          <small>Password must be at least 6 characters</small>
                        </div>
                        <div className="form-group-usermgmtad-finalday">
                          <label>Confirm Password *</label>
                          <input
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className={formErrors.confirmPassword ? 'error-usermgmtad-finalday' : ''}
                          />
                          {formErrors.confirmPassword && <span className="error-text-usermgmtad-finalday">{formErrors.confirmPassword}</span>}
                        </div>
                      </div>
                    )}
                  </form>
                )}
              </div>
              <div className="modal-actions-usermgmtad-finalday">
                <button className="cancel-btn-usermgmtad-finalday" onClick={() => setShowUserModal(false)}>Cancel</button>
                {(modalMode === 'edit' || modalMode === 'create') && (
                  <button className="save-btn-usermgmtad-finalday" onClick={handleSaveUser} disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save User'}</button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Password Reset Modal */}
        {showPasswordModal && selectedUser && (
          <div className="modal-overlay-usermgmtad-finalday" onClick={() => setShowPasswordModal(false)}>
            <div className="modal-content-usermgmtad-finalday password-modal-usermgmtad-finalday" onClick={e => e.stopPropagation()}>
              <div className="modal-header-usermgmtad-finalday"><h3>Reset Password</h3><button className="modal-close-usermgmtad-finalday" onClick={() => setShowPasswordModal(false)}>×</button></div>
              <div className="modal-body-usermgmtad-finalday">
                <div className="user-info-summary-usermgmtad-finalday"><p><strong>User:</strong> {selectedUser.fullName || selectedUser.email}</p><p><strong>Role:</strong> {getRoleBadge(selectedUser.role)}</p></div>
                <div className="form-row-usermgmtad-finalday">
                  <div className="form-group-usermgmtad-finalday"><label>New Password *</label><input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className={passwordErrors.password ? 'error-usermgmtad-finalday' : ''} />{passwordErrors.password && <span className="error-text-usermgmtad-finalday">{passwordErrors.password}</span>}<small>Password must be at least 6 characters</small></div>
                </div>
                <div className="form-row-usermgmtad-finalday">
                  <div className="form-group-usermgmtad-finalday"><label>Confirm Password *</label><input type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className={passwordErrors.confirmPassword ? 'error-usermgmtad-finalday' : ''} />{passwordErrors.confirmPassword && <span className="error-text-usermgmtad-finalday">{passwordErrors.confirmPassword}</span>}</div>
                </div>
              </div>
              <div className="modal-actions-usermgmtad-finalday">
                <button className="cancel-btn-usermgmtad-finalday" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                <button className="save-btn-usermgmtad-finalday" onClick={handleResetPassword} disabled={isSubmitting}>{isSubmitting ? 'Resetting...' : 'Reset Password'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && selectedUser && (
          <div className="modal-overlay-usermgmtad-finalday" onClick={() => setShowDeleteConfirm(false)}>
            <div className="modal-content-usermgmtad-finalday confirm-modal-usermgmtad-finalday" onClick={e => e.stopPropagation()}>
              <div className="confirm-icon-usermgmtad-finalday"><FaExclamationTriangle /></div>
              <h3>Delete User</h3>
              <p>Are you sure you want to delete <strong>{selectedUser.fullName || selectedUser.email}</strong>?</p>
              <p className="warning-text-usermgmtad-finalday">This action cannot be undone.</p>
              <div className="modal-actions-usermgmtad-finalday">
                <button className="cancel-btn-usermgmtad-finalday" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                <button className="delete-btn-usermgmtad-finalday" onClick={handleDeleteUser} disabled={isSubmitting}>{isSubmitting ? 'Deleting...' : 'Delete User'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Status Toggle Modal */}
        {showStatusConfirm && selectedUser && (
          <div className="modal-overlay-usermgmtad-finalday" onClick={() => setShowStatusConfirm(false)}>
            <div className="modal-content-usermgmtad-finalday confirm-modal-usermgmtad-finalday" onClick={e => e.stopPropagation()}>
              <div className="confirm-icon-usermgmtad-finalday">{statusAction === 'deactivate' ? <FaBan /> : <FaCheck />}</div>
              <h3>{statusAction === 'deactivate' ? 'Deactivate User' : 'Activate User'}</h3>
              <p>Are you sure you want to <strong>{statusAction}</strong> <strong>{selectedUser.fullName || selectedUser.email}</strong>?</p>
              <div className="modal-actions-usermgmtad-finalday">
                <button className="cancel-btn-usermgmtad-finalday" onClick={() => setShowStatusConfirm(false)}>Cancel</button>
                <button className="delete-btn-usermgmtad-finalday" onClick={handleToggleStatus} disabled={isSubmitting}>{isSubmitting ? 'Processing...' : statusAction}</button>
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