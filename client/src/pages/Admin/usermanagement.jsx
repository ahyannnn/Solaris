// pages/Admin/UserManagement.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
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
  FaEyeSlash,
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
  FaCalendarAlt,
  FaUserShield,
  FaUserTie,
  FaUserFriends,
  FaCamera
} from 'react-icons/fa';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import '../../styles/Admin/usermanagement.css';

// --- Stable (module-level) chart pieces ------------------------------------
// Defined OUTSIDE UserManagement so their component identity never changes.
// Previously CustomerCharts was declared inside the page component, so every
// parent setState (search, pagination, dropdown, page click) created a new
// component type → React unmounted/remounted the whole chart → it looked
// like the charts "refresh" on every click. React.memo + stable props means
// this now re-renders ONLY when the chart data actually changes.
const SignupTooltip = React.memo(({ active, payload }) => {
  if (active && payload && payload.length) {
    const fullLabel = payload[0]?.payload?.fullLabel || payload[0]?.payload?.label || '';
    return (
      <div className="chart-tooltip-usermanagement">
        <p className="tooltip-label-usermanagement">{fullLabel}</p>
        <p className="tooltip-item-usermanagement">
          New customers: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
});

const CustomerSignupChart = React.memo(({ signupData, totalCustomers, newThisMonth, hasCustomers }) => (
  <div className="user-charts-grid-usermanagement single">
    <div className="user-chart-card-usermanagement">
      <div className="user-chart-header-usermanagement">
        <div>
          <h3>Customer Signups</h3>
          <span className="user-chart-period-usermanagement">New customers · last 12 months</span>
        </div>
        <div className="user-chart-kpi-usermanagement">
          <span><strong>{totalCustomers}</strong> total</span>
          <span><strong>{newThisMonth}</strong> new this month</span>
        </div>
      </div>
      <div className="user-chart-wrapper-usermanagement">
        {hasCustomers ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={signupData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color, #EEF0ED)" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-secondary, #667085)', fontSize: 11, fontWeight: 500 }}
                dy={10}
                interval={0}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-secondary, #667085)', fontSize: 12, fontWeight: 500 }}
                width={38}
                allowDecimals={false}
              />
              <Tooltip content={<SignupTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
              <Bar dataKey="value" fill="#10B981" radius={[6, 6, 0, 0]} barSize={22} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="user-chart-empty-usermanagement">No customer data yet</div>
        )}
      </div>
    </div>
  </div>
));

const UserManagement = () => {
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  // Customer-only dataset for the charts (independent of table role filter/search).
  const [chartCustomers, setChartCustomers] = useState([]);
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

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewConfirmPassword, setShowNewConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    password: '',
    confirmPassword: '',
    role: 'engineer'
  });
  const [formErrors, setFormErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  // Staff photo picker (edit mode only — uploads on Update, never before)
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoBroken, setPhotoBroken] = useState(false);
  const [brokenPhotos, setBrokenPhotos] = useState(() => new Set());
  const photoInputRef = useRef(null);

  useEffect(() => {
    if (photoFile) {
      const url = URL.createObjectURL(photoFile);
      setPhotoPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPhotoPreview(null);
  }, [photoFile]);

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
      showToast('Only image files (JPEG, PNG, WEBP, GIF) are allowed', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('Photo must be 2MB or smaller', 'error');
      return;
    }
    setPhotoFile(file);
    setPhotoBroken(false);
  };

  // ============================================
  // VALIDATION FUNCTIONS
  // ============================================

  const validateName = (name, fieldName) => {
    if (!name || name.trim() === '') {
      return `${fieldName} is required`;
    }
    if (!/^[a-zA-Z\s]+$/.test(name)) {
      return `${fieldName} must contain only letters and spaces`;
    }
    if (name.length < 2) {
      return `${fieldName} must be at least 2 characters`;
    }
    if (name.length > 50) {
      return `${fieldName} must not exceed 50 characters`;
    }
    return null;
  };

  const validateEmail = (email) => {
    if (!email || email.trim() === '') {
      return 'Email is required';
    }
    if (!email.endsWith('@gmail.com')) {
      return 'Email must be a valid Gmail address (@gmail.com)';
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid Gmail address';
    }
    return null;
  };

  const validateContactNumber = (contact) => {
    if (!contact || contact.trim() === '') {
      return null;
    }
    if (!/^09\d{9}$/.test(contact)) {
      return 'Contact number must start with 09 and be exactly 11 digits';
    }
    return null;
  };

  const validatePassword = (password) => {
    if (!password || password === '') {
      return 'Password is required';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (password.length > 16) {
      return 'Password must not exceed 16 characters';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return 'Password must contain at least one special character';
    }
    return null;
  };

  const validatePasswordMatch = (password, confirmPassword) => {
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  };

  // ============================================
  // FORM VALIDATION
  // ============================================

  const validateForm = () => {
    const errors = {};

    const firstNameError = validateName(formData.firstName, 'First name');
    if (firstNameError) errors.firstName = firstNameError;

    const lastNameError = validateName(formData.lastName, 'Last name');
    if (lastNameError) errors.lastName = lastNameError;

    // TEMP-EMAIL-EDIT: validate email on edit too — revert to `if (modalMode === 'create')` to re-lock
    {
      const emailError = validateEmail(formData.email);
      if (emailError) errors.email = emailError;
    }

    const contactError = validateContactNumber(formData.contactNumber);
    if (contactError) errors.contactNumber = contactError;

    if (modalMode === 'create') {
      const passwordError = validatePassword(formData.password);
      if (passwordError) errors.password = passwordError;

      const confirmError = validatePasswordMatch(formData.password, formData.confirmPassword);
      if (confirmError) errors.confirmPassword = confirmError;
    }

    if (modalMode === 'create') {
      if (!formData.role) {
        errors.role = 'Role is required';
      } else if (!['admin', 'engineer'].includes(formData.role)) {
        errors.role = 'Role must be Admin or Engineer';
      }
    }

    return errors;
  };

  const validatePasswordForm = () => {
    const errors = {};

    const passwordError = validatePassword(formData.password);
    if (passwordError) errors.password = passwordError;

    const confirmError = validatePasswordMatch(formData.password, formData.confirmPassword);
    if (confirmError) errors.confirmPassword = confirmError;

    return errors;
  };

  // ============================================
  // DATA FETCHING
  // ============================================

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          role: filterRole === 'all' ? undefined : filterRole,
          // Fetch the whole role list: search + pagination run client-side
          // so search spans ALL pages, not just the visible one.
          limit: 1000
        }
      });
      setUsers(response.data.users || []);
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

  // Customer-only fetch for charts — always role=user so table filters never blank the charts.
  const fetchChartCustomers = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { role: 'user', limit: 1000 }
      });
      const list = response.data.users || [];
      setChartCustomers(list.filter((u) => u.role === 'user'));
    } catch (error) {
      console.error('Error fetching chart customers:', error);
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

  // ============================================
  // REAL-TIME TABLE UPDATES (no page refresh)
  // Reuses existing Socket.IO backend via useRealtimeTable.
  // Refetch-only: the table renders the complete server response,
  // so rows never flash partial (N/A) data from the raw payload.
  // Listener is cleaned up automatically on unmount.
  // ============================================
  useRealtimeTable('users', () => {
    if (activeTab === 'users') {
      fetchUsers();
      fetchStats();
      fetchChartCustomers();
    } else if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  });

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
      fetchStats();
      fetchChartCustomers();
    } else if (activeTab === 'audit') {
      fetchAuditLogs();
    }

    const handleClickOutside = (event) => {
      // Ignore taps on toggles/menus — their onClick owns open/close.
      // Otherwise mousedown pre-closes and the following click re-opens.
      if (event.target.closest?.('[data-action-menu],[data-action-toggle]')) return;
      setOpenDropdownId(null);
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
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [filterRole]);

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [auditCurrentPage]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleDropdownClick = (event, userId, forceFlip = false) => {
    event.stopPropagation();
    const buttonRect = event.currentTarget.getBoundingClientRect();
    const user = users.find(u => u._id === userId);
    const actionCount = user ? getAvailableActions(user).length : 5;
    const estimatedHeight = Math.min(300, actionCount * 44 + 12);
    const spaceBelow = window.innerHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;
    // Bottom cards always flip upward; others auto-flip only when cut off.
    const shouldFlip = forceFlip || (spaceBelow < estimatedHeight + 10 && spaceAbove > spaceBelow);
    setDropdownPosition({
      top: shouldFlip ? Math.max(10, buttonRect.top - estimatedHeight - 5) : buttonRect.bottom + 5,
      right: window.innerWidth - buttonRect.right - 10,
      maxHeight: shouldFlip ? Math.max(120, Math.min(300, spaceAbove - 16)) : Math.min(300, Math.max(120, spaceBelow - 10)),
    });
    setOpenDropdownId((prev) => (prev === userId ? null : userId));
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    if (activeTab === 'users') {
      setCurrentPage(1);
    } else {
      setAuditCurrentPage(1);
    }
  };

  const getContactNumber = (user) => user?.contactNumber || user?.clientInfo?.contactNumber || '';

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return user.fullName?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      getContactNumber(user)?.includes(searchTerm);
  });

  // Client-side pagination over the full filtered list (search already
  // spans every page since the whole role list is fetched above).
  const totalFilteredUsers = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredUsers / itemsPerPage));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedUsers = filteredUsers.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage
  );

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

  const auditTotalPages = Math.max(1, Math.ceil(auditTotalItems / auditItemsPerPage));
  const auditStartItem = (auditCurrentPage - 1) * auditItemsPerPage + 1;
  const auditEndItem = Math.min(auditCurrentPage * auditItemsPerPage, auditTotalItems);

  const combineFullName = (firstName, lastName) => {
    let fullName = firstName;
    if (lastName) {
      fullName += ` ${lastName}`;
    }
    return fullName;
  };

  const getEmptyUserForm = () => ({
    firstName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    password: '',
    confirmPassword: '',
    role: 'engineer'
  });

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedUser(null);
    setFormData(getEmptyUserForm());
    setFormErrors({});
    setPasswordErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoBroken(false);
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
      contactNumber: user.contactNumber || user.clientInfo?.contactNumber || '',
      password: '',
      confirmPassword: '',
      role: user.role || 'engineer'
    });
    setFormErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    setPhotoFile(null);
    setPhotoBroken(false);
    setShowUserModal(true);
    setOpenDropdownId(null);
  };

  const handleOpenViewModal = (user) => {
    setModalMode('view');
    setSelectedUser(user);
    setPhotoBroken(false);
    setShowUserModal(true);
    setOpenDropdownId(null);
  };

  const handleOpenPasswordModal = (user) => {
    setSelectedUser(user);
    setFormData({ ...formData, password: '', confirmPassword: '' });
    setPasswordErrors({});
    setShowNewPassword(false);
    setShowNewConfirmPassword(false);
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
            role: formData.role,
            fullName: fullName,
            firstName: formData.firstName,
            lastName: formData.lastName,
            contactNumber: formData.contactNumber
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Photo uploads on Update (never before picking Save)
        if (photoFile) {
          const photoData = new FormData();
          photoData.append('photo', photoFile);
          await axios.post(
            `${import.meta.env.VITE_API_URL}/api/admin/users/${selectedUser._id}/photo`,
            photoData,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setPhotoFile(null);
        }
        response = await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/users/${selectedUser._id}`,
          {
            fullName: fullName,
            firstName: formData.firstName,
            lastName: formData.lastName,
            contactNumber: formData.contactNumber,
            email: normalizedEmail // TEMP-EMAIL-EDIT: remove to re-lock email editing
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
        setShowNewPassword(false);
        setShowNewConfirmPassword(false);
        if (activeTab === 'audit') fetchAuditLogs();
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      showToast(error.response?.data?.message || 'Failed to reset password', 'error');
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
        await fetchUsers();
        await fetchStats();
        if (activeTab === 'audit') await fetchAuditLogs();
        setShowStatusConfirm(false);
        setSelectedUser(null);
        setStatusAction(null);
        showToast(response.data.message || 'User status updated successfully', 'success');
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      showToast(error.response?.data?.message || 'Failed to update user status', 'error');
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

  // ============================================
  // RENDER HELPERS
  // ============================================

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
      { label: 'View Details', action: () => handleOpenViewModal(user), color: 'primary' },
      { label: 'Edit User', action: () => handleOpenEditModal(user), color: 'primary' },
      { label: 'Reset Password', action: () => handleOpenPasswordModal(user), color: 'primary' },
      { label: user.isActive ? 'Deactivate' : 'Activate', action: () => handleOpenStatusModal(user, user.isActive ? 'deactivate' : 'activate'), color: 'primary' },
      { label: 'Delete User', action: () => handleDeleteClick(user), color: 'primary' }
    ];
    return actions;
  };

  const startItem = totalFilteredUsers === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(safeCurrentPage * itemsPerPage, totalFilteredUsers);

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

  const pageNumbers = getPageNumbers(totalPages, safeCurrentPage);
  const auditPageNumbers = getPageNumbers(auditTotalPages, auditCurrentPage);

  // --- Customer-only chart data (memoized at parent level so typing/search never remounts charts) ---
  const chartCustomerList = useMemo(
    () => (chartCustomers || []).filter((u) => u.role === 'user'),
    [chartCustomers]
  );

  // Last 12 months (inclusive of current month), zero-filled.
  const signupData = useMemo(() => {
    const now = new Date();
    const buckets = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      buckets.push({
        key,
        label: d.toLocaleString('en-PH', { month: 'short' }),
        fullLabel: d.toLocaleString('en-PH', { month: 'short', year: 'numeric' }),
        value: 0,
      });
    }
    const byKey = Object.fromEntries(buckets.map((b) => [b.key, b]));
    chartCustomerList.forEach((u) => {
      if (!u.createdAt) return;
      const d = new Date(u.createdAt);
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (byKey[key]) byKey[key].value += 1;
    });
    return buckets;
  }, [chartCustomerList]);

  const totalChartCustomers = chartCustomerList.length;
  const newChartCustomersThisMonth = signupData.length ? signupData[signupData.length - 1].value : 0;
  const hasChartCustomers = totalChartCustomers > 0;

  const SkeletonLoader = () => (
    <div className="user-management-usermanagement">
      <div className="user-management-header-usermanagement">
        <div className="skeleton-line-large-usermanagement"></div>
        <div className="skeleton-button-usermanagement"></div>
      </div>
      <div className="user-charts-grid-usermanagement single">
        <div className="skeleton-chart-usermanagement"></div>
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
      

        {/* --- Customer Chart (customer-only, stable — never remounts on clicks) --- */}
        <CustomerSignupChart
          signupData={signupData}
          totalCustomers={totalChartCustomers}
          newThisMonth={newChartCustomersThisMonth}
          hasCustomers={hasChartCustomers}
        />

        {/* --- Tabs + Buttons Wrapper --- */}
        <div className="user-tabs-wrapper-usermanagement">
          <div className="user-tabs-usermanagement">
            <button
              className={`tab-btn-usermanagement ${activeTab === 'users' ? 'active-usermanagement' : ''}`}
              onClick={() => { 
                setActiveTab('users'); 
                setSearchTerm(''); 
                setCurrentPage(1); 
                setAuditCurrentPage(1); 
              }}
            >
              <FaUsers /> Users
              <span className="tab-badge-usermanagement">{stats.total}</span>
            </button>
            <button
              className={`tab-btn-usermanagement ${activeTab === 'audit' ? 'active-usermanagement' : ''}`}
              onClick={() => { 
                setActiveTab('audit'); 
                setSearchTerm(''); 
                setCurrentPage(1); 
                setAuditCurrentPage(1); 
              }}
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
              <FaChevronDown className="select-arrow-usermanagement" />
            </div>
          )}
        </div>

        {/* Users Table */}
        {activeTab === 'users' && (
          <div className="users-table-container-usermanagement">
            <table className="users-table-usermanagement">
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>User</th>
                  <th style={{ width: '22%' }}>Email</th>
                  <th style={{ width: '14%' }}>Contact Number</th>
                  <th style={{ width: '9%' }}>Role</th>
                  <th style={{ width: '10%' }}>Status</th>
                  <th style={{ width: '13%' }}>Created</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" data-label="" className="empty-state-usermanagement">
                      <p>No users found</p>
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user, idx) => {
                    const actions = getAvailableActions(user);
                    const isOpen = openDropdownId === user._id;

                    return (
                      <tr key={user._id}>
                        <td data-label="User">
                          <div className="user-cell-content-usermanagement">
                            <div className="user-avatar-usermanagement">
                              {user.photoURL && !brokenPhotos.has(user._id) ? (
                                <img
                                  src={user.photoURL}
                                  alt=""
                                  className="avatar-photo-usermanagement"
                                  onError={() => setBrokenPhotos((prev) => new Set(prev).add(user._id))}
                                />
                              ) : user.clientInfo?.firstName ? (
                                <div className="avatar-initials-usermanagement">{user.clientInfo.firstName[0]}{user.clientInfo.lastName?.[0]}</div>
                              ) : (
                                <FaUserCircle className="avatar-icon-usermanagement" />
                              )}
                            </div>
                            <div className="user-name-usermanagement">{user.fullName || '—'}</div>
                          </div>
                        </td>
                        <td data-label="Email" className="email-cell-usermanagement">
                          <FaEnvelope className="email-icon-usermanagement" />
                          <span className="email-text-usermanagement">{user.email}</span>
                        </td>
                        <td data-label="Contact Number">
                          <span className="email-text-usermanagement">{getContactNumber(user) || '—'}</span>
                        </td>
                        <td data-label="Role">{getRoleBadge(user.role)}</td>
                        <td data-label="Status">{getStatusBadge(user.isActive)}</td>
                        <td data-label="Created">{formatDate(user.createdAt)}</td>
                        <td data-label="Actions" style={{ textAlign: 'center', position: 'relative' }}>
                          <div className="action-dropdown-container-usermanagement">
                            <button
                              className="action-dropdown-toggle-usermanagement"
                              data-action-toggle
                              ref={el => buttonRefs.current[user._id] = el}
                              onClick={(e) => handleDropdownClick(e, user._id, idx >= paginatedUsers.length - 2)}
                            >
                              Action <FaChevronDown className={`dropdown-arrow-usermanagement ${isOpen ? 'open-usermanagement' : ''}`} />
                            </button>
                            {isOpen && (
                              <div
                                className="action-dropdown-menu-usermanagement"
                                data-action-menu
                                ref={dropdownRef}
                                style={{
                                  position: 'fixed',
                                  top: dropdownPosition.top,
                                  right: dropdownPosition.right,
                                  zIndex: 9999,
                                  maxHeight: dropdownPosition.maxHeight,
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
                                    <span>{action.label}</span>
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

        {/* Users Pagination */}
        {activeTab === 'users' && totalFilteredUsers > itemsPerPage && (
          <div className="pagination-usermanagement">
            <div className="pagination-info-usermanagement">
              Showing {startItem} to {endItem} of {totalFilteredUsers} entries
            </div>
            <div className="pagination-controls-usermanagement">
              <button
                className="page-btn-usermanagement"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={safeCurrentPage === 1}
              >
                <FaChevronLeft /> Previous
              </button>

              {pageNumbers.map(page => (
                <button
                  key={page}
                  className={`page-number-usermanagement ${safeCurrentPage === page ? 'active-usermanagement' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

              <button
                className="page-btn-usermanagement"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage === totalPages}
              >
                Next <FaChevronRight />
              </button>
            </div>
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
                {filteredAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" data-label="" className="empty-state-usermanagement">
                      <p>No audit logs found</p>
                    </td>
                  </tr>
                ) : (
                  filteredAuditLogs.map(log => {
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
                        <td data-label="User">
                          <div className="user-cell-content-usermanagement">
                            <div className="user-avatar-usermanagement small-avatar-usermanagement">
                              <div className="avatar-initials-usermanagement">{userInitials}</div>
                            </div>
                            <div className="user-name-usermanagement">{userDisplayName}</div>
                          </div>
                        </td>
                        <td data-label="Role">{getRoleBadge(log.role)}</td>
                        <td data-label="Module">
                          <span className="module-badge-usermanagement">
                            {getModuleIcon(log.module)} {log.module}
                          </span>
                        </td>
                        <td data-label="Action">{getActionBadge(log.action)}</td>
                        <td data-label="Timestamp">
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

        {/* Audit Logs Pagination */}
        {activeTab === 'audit' && auditTotalItems > auditItemsPerPage && (
          <div className="pagination-usermanagement">
            <div className="pagination-info-usermanagement">
              Showing {auditStartItem} to {auditEndItem} of {auditTotalItems} entries
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

        {/* User Modal — closes ONLY via × / Cancel (overlay click disabled) */}
        {showUserModal && (
          <div className="modal-overlay-usermanagement">
            <div className={`modal-content-usermanagement user-modal-usermanagement ${modalMode}`}>
              <div className="modal-header-usermanagement">
                <h3>{modalMode === 'view' ? 'User Details' : modalMode === 'edit' ? 'Edit User' : 'Create New User'}</h3>
                <button className="modal-close-usermanagement" onClick={() => setShowUserModal(false)}>×</button>
              </div>
              <div className="modal-body-usermanagement">
                {modalMode === 'view' && selectedUser && (
                  <div className="user-details-view-usermanagement">
                    {selectedUser.photoURL && !photoBroken && (
                      <div className="user-details-photo-usermanagement">
                        <img
                          src={selectedUser.photoURL}
                          alt=""
                          onError={() => setPhotoBroken(true)}
                        />
                      </div>
                    )}
                    <div className="detail-section-usermanagement">
                      <h4>Account Information</h4>
                      <div className="detail-row-usermanagement"><span>Full Name:</span><strong>{selectedUser.fullName || '—'}</strong></div>
                      <div className="detail-row-usermanagement"><span>Email:</span><strong>{selectedUser.email}</strong></div>
                      <div className="detail-row-usermanagement"><span>Contact Number:</span><strong>{getContactNumber(selectedUser) || '—'}</strong></div>
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
                    {/* Photo picker (edit mode — uploads on Update) */}
                    {modalMode === 'edit' && (
                      <div className="photo-picker-usermanagement">
                        <div
                          className="photo-avatar-usermanagement"
                          onClick={() => photoInputRef.current?.click()}
                          title="Change profile photo"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === 'Enter') photoInputRef.current?.click(); }}
                        >
                          {(photoPreview || (!photoBroken && selectedUser?.photoURL)) ? (
                            <img
                              src={photoPreview || selectedUser.photoURL}
                              alt=""
                              className="photo-img-usermanagement"
                              onError={() => setPhotoBroken(true)}
                            />
                          ) : (
                            <FaUserCircle className="photo-icon-usermanagement" />
                          )}
                          <span className="photo-camera-usermanagement"><FaCamera /></span>
                          <input
                            ref={photoInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            hidden
                            onChange={handlePhotoSelect}
                          />
                        </div>
                        <div className="photo-meta-usermanagement">
                          <strong>{selectedUser?.fullName}</strong>
                          <span>Click the avatar to change the photo. Uploads on Update.</span>
                        </div>
                      </div>
                    )}
                    <div className="form-row-usermanagement">
                      <div className="form-group-usermanagement">
                        <label>First Name *</label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className={formErrors.firstName ? 'error' : ''}
                          placeholder="Enter first name (letters only)"
                        />
                        {formErrors.firstName && <span className="error-text-usermanagement">{formErrors.firstName}</span>}
                        <small>Letters and spaces only, 2-50 characters</small>
                      </div>
                      <div className="form-group-usermanagement">
                        <label>Last Name *</label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className={formErrors.lastName ? 'error' : ''}
                          placeholder="Enter last name (letters only)"
                        />
                        {formErrors.lastName && <span className="error-text-usermanagement">{formErrors.lastName}</span>}
                        <small>Letters and spaces only, 2-50 characters</small>
                      </div>
                    </div>
                    <div className="form-row-usermanagement">
                      <div className="form-group-usermanagement">
                        <label>Email Address *</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          /* TEMP-EMAIL-EDIT: re-add disabled={modalMode === 'edit'} to re-lock */
                          className={formErrors.email ? 'error' : ''}
                          placeholder="name@gmail.com"
                        />
                        {formErrors.email && <span className="error-text-usermanagement">{formErrors.email}</span>}
                        {/* TEMP-EMAIL-EDIT: restore {modalMode === 'edit' && <small>Email cannot be changed</small>} to re-lock */}
                        <small>Must be a valid Gmail address (@gmail.com)</small>
                      </div>
                      <div className="form-group-usermanagement">
                        <label>Contact Number</label>
                        <input
                          type="tel"
                          value={formData.contactNumber}
                          onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                          className={formErrors.contactNumber ? 'error' : ''}
                          placeholder="09XXXXXXXXX"
                          maxLength="11"
                        />
                        {formErrors.contactNumber && <span className="error-text-usermanagement">{formErrors.contactNumber}</span>}
                        <small>Must start with 09 and be exactly 11 digits</small>
                      </div>
                    </div>

                    {modalMode === 'create' && (
                      <div className="form-row-usermanagement">
                        <div className="form-group-usermanagement">
                          <label>Role *</label>
                          <div className="select-chevron-wrap-usermanagement">
                            <select
                              value={formData.role}
                              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                              className={formErrors.role ? 'error' : ''}
                            >
                              <option value="admin">Admin</option>
                              <option value="engineer">Engineer</option>
                            </select>
                          </div>
                          {formErrors.role && <span className="error-text-usermanagement">{formErrors.role}</span>}
                          <small>Select the user's role and permissions</small>
                        </div>
                        <div className="form-group-usermanagement">
                        </div>
                      </div>
                    )}

                    {modalMode === 'create' && (
                      <div className="form-row-usermanagement">
                        <div className="form-group-usermanagement">
                          <label>Password *</label>
                          <div className="password-input-wrapper-usermanagement">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={formData.password}
                              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                              className={formErrors.password ? 'error' : ''}
                              placeholder="Enter password"
                            />
                            <button
                              type="button"
                              className="password-toggle-btn-usermanagement"
                              onClick={() => setShowPassword(!showPassword)}
                              tabIndex="-1"
                            >
                              {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                          </div>
                          {formErrors.password && <span className="error-text-usermanagement">{formErrors.password}</span>}
                          <small>8-16 characters, 1 uppercase, 1 special character</small>
                        </div>
                        <div className="form-group-usermanagement">
                          <label>Confirm Password *</label>
                          <div className="password-input-wrapper-usermanagement">
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              value={formData.confirmPassword}
                              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                              className={formErrors.confirmPassword ? 'error' : ''}
                              placeholder="Confirm password"
                            />
                            <button
                              type="button"
                              className="password-toggle-btn-usermanagement"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              tabIndex="-1"
                            >
                              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                          </div>
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

        {/* Password Reset Modal — closes ONLY via × / Cancel (overlay click disabled) */}
        {showPasswordModal && selectedUser && (
          <div className="modal-overlay-usermanagement">
            <div className="modal-content-usermanagement password-modal-usermanagement">
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
                    <div className="password-input-wrapper-usermanagement">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className={passwordErrors.password ? 'error' : ''}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        className="password-toggle-btn-usermanagement"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        tabIndex="-1"
                      >
                        {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {passwordErrors.password && <span className="error-text-usermanagement">{passwordErrors.password}</span>}
                    <small>8-16 characters, 1 uppercase, 1 special character</small>
                  </div>
                </div>
                <div className="form-row-usermanagement">
                  <div className="form-group-usermanagement">
                    <label>Confirm Password *</label>
                    <div className="password-input-wrapper-usermanagement">
                      <input
                        type={showNewConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className={passwordErrors.confirmPassword ? 'error' : ''}
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        className="password-toggle-btn-usermanagement"
                        onClick={() => setShowNewConfirmPassword(!showNewConfirmPassword)}
                        tabIndex="-1"
                      >
                        {showNewConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
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

        {/* Delete Confirmation Modal — closes ONLY via Cancel (overlay click disabled) */}
        {showDeleteConfirm && selectedUser && (
          <div className="modal-overlay-usermanagement">
            <div className="modal-content-usermanagement confirm-modal-usermanagement">
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

        {/* Status Toggle Modal — closes ONLY via Cancel (overlay click disabled) */}
        {showStatusConfirm && selectedUser && (
          <div className="modal-overlay-usermanagement">
            <div className="modal-content-usermanagement confirm-modal-usermanagement">
              <div className="confirm-icon-usermanagement">{statusAction === 'deactivate' ? <FaBan /> : <FaCheck />}</div>
              <h3>{statusAction === 'deactivate' ? 'Deactivate User' : 'Activate User'}</h3>
              <p>Are you sure you want to <strong>{statusAction}</strong> <strong>{selectedUser.fullName || selectedUser.email}</strong>?</p>
              <div className="modal-actions-usermanagement">
                <button className="cancel-btn-usermanagement" onClick={() => setShowStatusConfirm(false)}>Cancel</button>
                <button
                  className={statusAction === 'deactivate' ? 'delete-btn-usermanagement' : 'save-btn-usermanagement'}
                  onClick={handleToggleStatus}
                  disabled={isSubmitting}
                  style={{ textTransform: 'capitalize' }}
                >
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