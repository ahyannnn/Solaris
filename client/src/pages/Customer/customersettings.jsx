// pages/Customer/CustomerSettings.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import {
  FaUser,
  FaMapMarkerAlt,
  FaHome,
  FaRoad,
  FaCity,
  FaGlobe,
  FaMailBulk,
  FaHashtag,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaExclamationTriangle,
  FaStar,
  FaRegStar,
  FaArrowLeft,
  FaSave,
  FaSpinner,
  FaAddressBook,
  FaPhone,
  FaEnvelope,
  FaBuilding,
  FaBell,
  FaLock,
  FaShieldAlt,
  FaLanguage,
  FaPalette,
  FaMoon,
  FaSun,
  FaGlobe as FaGlobeAsia,
  FaUserCog,
  FaKey,
  FaCreditCard,
  FaHistory,
  FaFileInvoice,
  FaCalendarAlt,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';
import '../../styles/Customer/customersettings.css';

const CustomerSettings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get tab from URL query parameter
  const getInitialTab = () => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    return ['profile', 'addresses', 'notifications', 'security', 'preferences', 'billing'].includes(tab) ? tab : 'profile';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Address modal state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // User profile data
  const [profileData, setProfileData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    companyName: '',
    client_type: 'Individual',
    birthday: ''
  });

  // Addresses state
  const [addresses, setAddresses] = useState([]);

  // Notification preferences
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailNotifications: true,
    smsNotifications: true,
    bookingUpdates: true,
    paymentConfirmations: true,
    promotionalEmails: false,
    assessmentReminders: true,
    systemAlerts: true
  });

  // Security settings
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  // Preferences
  const [preferences, setPreferences] = useState({
    language: 'en',
    theme: 'light',
    timezone: 'Asia/Manila',
    dateFormat: 'MM/DD/YYYY',
    currency: 'PHP'
  });

  // Billing history
  const [billingHistory, setBillingHistory] = useState([]);

  // Address form
  const [addressForm, setAddressForm] = useState({
    houseOrBuilding: '',
    street: '',
    barangay: '',
    cityMunicipality: '',
    province: '',
    zipCode: '',
    label: 'Home',
    isPrimary: false
  });

  const [formErrors, setFormErrors] = useState({});

  // Password strength helper functions
  const getPasswordStrength = (password) => {
    if (!password) return 'weak';
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    if (strength <= 1) return 'weak';
    if (strength === 2) return 'medium';
    if (strength === 3) return 'strong';
    return 'very-strong';
  };

  const getPasswordStrengthPercent = (password) => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    return strength;
  };

  const getPasswordStrengthLabel = (password) => {
    const strength = getPasswordStrength(password);
    const labels = {
      'weak': 'Weak - Add uppercase, numbers, or symbols',
      'medium': 'Medium - Could be stronger',
      'strong': 'Strong - Good password',
      'very-strong': 'Very Strong - Excellent!'
    };
    return labels[strength];
  };

  // Fetch data on mount
  useEffect(() => {
    fetchUserData();
    fetchAddresses();
    fetchPreferences();
    fetchBillingHistory();
  }, []);

  // Listen for URL tab changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabFromUrl = params.get('tab');
    if (tabFromUrl && ['profile', 'addresses', 'notifications', 'security', 'preferences', 'billing'].includes(tabFromUrl)) {
      if (tabFromUrl !== activeTab) {
        setActiveTab(tabFromUrl);
      }
    }
  }, [location.search, activeTab]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/clients/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const client = response.data.client;
      setProfileData({
        firstName: client.contactFirstName || '',
        middleName: client.contactMiddleName || '',
        lastName: client.contactLastName || '',
        email: client.email || '',
        contactNumber: client.contactNumber || '',
        companyName: client.companyName || '',
        client_type: client.client_type || 'Individual',
        birthday: client.birthday || ''
      });
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/clients/me/addresses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAddresses(response.data.addresses || []);
    } catch (err) {
      console.error('Error fetching addresses:', err);
    }
  };

  const fetchPreferences = async () => {
    const savedPrefs = localStorage.getItem('userPreferences');
    if (savedPrefs) {
      setPreferences(JSON.parse(savedPrefs));
    }
  };

  const fetchBillingHistory = async () => {
    setBillingHistory([
      { id: 'INV-2024-001', date: '2024-01-15', amount: 1500, status: 'paid', description: 'Assessment Fee' },
      { id: 'INV-2024-002', date: '2024-02-10', amount: 25000, status: 'paid', description: 'Initial Payment - Solar Installation' },
      { id: 'INV-2024-003', date: '2024-03-05', amount: 50000, status: 'pending', description: 'Final Payment' }
    ]);
  };

  // Profile handlers
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(`${import.meta.env.VITE_API_URL}/api/clients/update`,
        {
          contactFirstName: profileData.firstName,
          contactMiddleName: profileData.middleName,
          contactLastName: profileData.lastName,
          contactNumber: profileData.contactNumber,
          companyName: profileData.companyName,
          birthday: profileData.birthday
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update profile');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Address handlers
  const handleAddAddress = () => {
    setEditingAddress(null);
    setAddressForm({
      houseOrBuilding: '',
      street: '',
      barangay: '',
      cityMunicipality: '',
      province: '',
      zipCode: '',
      label: 'Home',
      isPrimary: addresses.length === 0
    });
    setFormErrors({});
    setShowAddressModal(true);
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setAddressForm({
      houseOrBuilding: address.houseOrBuilding || '',
      street: address.street || '',
      barangay: address.barangay || '',
      cityMunicipality: address.cityMunicipality || '',
      province: address.province || '',
      zipCode: address.zipCode || '',
      label: address.label || 'Home',
      isPrimary: address.isPrimary || false
    });
    setFormErrors({});
    setShowAddressModal(true);
  };

  const handleAddressFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateAddressForm = () => {
    const errors = {};
    if (!addressForm.houseOrBuilding.trim()) errors.houseOrBuilding = 'House/Building number is required';
    if (!addressForm.street.trim()) errors.street = 'Street is required';
    if (!addressForm.barangay.trim()) errors.barangay = 'Barangay is required';
    if (!addressForm.cityMunicipality.trim()) errors.cityMunicipality = 'City/Municipality is required';
    if (!addressForm.province.trim()) errors.province = 'Province is required';
    if (!addressForm.zipCode.trim()) errors.zipCode = 'Zip code is required';
    if (addressForm.zipCode && !/^\d{4}$/.test(addressForm.zipCode)) {
      errors.zipCode = 'ZIP code must be 4 digits';
    }
    return errors;
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateAddressForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSaving(true);
    try {
      const token = sessionStorage.getItem('token');
      
      if (editingAddress) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/clients/me/addresses/${editingAddress._id}`,
          addressForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSuccess('Address updated successfully');
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/clients/me/addresses`,
          addressForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSuccess('Address added successfully');
      }

      setTimeout(() => setSuccess(null), 3000);
      fetchAddresses();
      setShowAddressModal(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save address');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const setAsPrimary = async (addressId) => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/clients/me/addresses/${addressId}/primary`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Primary address updated');
      setTimeout(() => setSuccess(null), 3000);
      fetchAddresses();
    } catch (err) {
      setError('Failed to update primary address');
      setTimeout(() => setError(null), 3000);
    }
  };

  const deleteAddress = async (addressId) => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/clients/me/addresses/${addressId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Address deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
      fetchAddresses();
      setDeleteConfirm(null);
    } catch (err) {
      setError('Failed to delete address');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Password handlers
  const validatePassword = () => {
    const errors = {};
    if (!passwordData.currentPassword) errors.currentPassword = 'Current password is required';
    if (!passwordData.newPassword) errors.newPassword = 'New password is required';
    if (passwordData.newPassword.length < 8) errors.newPassword = 'Password must be at least 8 characters';
    
    const hasUpperCase = /[A-Z]/.test(passwordData.newPassword);
    const hasNumber = /[0-9]/.test(passwordData.newPassword);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(passwordData.newPassword);
    
    if (passwordData.newPassword && !(hasUpperCase || hasNumber || hasSpecialChar)) {
      errors.newPassword = 'Password should contain at least one uppercase letter, number, or special character';
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    return errors;
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const errors = validatePassword();
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setSaving(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/change-password`,
        passwordData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Password changed successfully');
      setTimeout(() => setSuccess(null), 3000);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Notification handlers
  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotificationPrefs(prev => ({ ...prev, [name]: checked }));
  };

  const saveNotificationPrefs = () => {
    localStorage.setItem('notificationPrefs', JSON.stringify(notificationPrefs));
    setSuccess('Notification preferences saved');
    setTimeout(() => setSuccess(null), 3000);
  };

  // Preference handlers
  const handlePreferenceChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'radio') {
      setPreferences(prev => ({ ...prev, [name]: value }));
    } else {
      setPreferences(prev => ({ ...prev, [name]: value }));
    }
  };

  const savePreferences = () => {
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    if (preferences.theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    setSuccess('Preferences saved');
    setTimeout(() => setSuccess(null), 3000);
  };

  const getFullAddress = (addr) => {
    const parts = [
      addr.houseOrBuilding,
      addr.street,
      addr.barangay,
      addr.cityMunicipality,
      addr.province,
      addr.zipCode
    ].filter(part => part && part.trim() !== '');
    return parts.join(', ');
  };

  // Render different content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="profile-section">
            <h2>Personal Information</h2>
            
            <div className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label><FaUser /> First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleProfileChange}
                    placeholder="First name"
                  />
                </div>

                <div className="form-group">
                  <label><FaUser /> Middle Name</label>
                  <input
                    type="text"
                    name="middleName"
                    value={profileData.middleName}
                    onChange={handleProfileChange}
                    placeholder="Middle name (optional)"
                  />
                </div>

                <div className="form-group">
                  <label><FaUser /> Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleProfileChange}
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label><FaEnvelope /> Email Address</label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="readonly"
                  />
                  <small>Email cannot be changed</small>
                </div>

                <div className="form-group">
                  <label><FaPhone /> Contact Number</label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={profileData.contactNumber}
                    onChange={handleProfileChange}
                    placeholder="09XXXXXXXXX"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label><FaBuilding /> Company Name</label>
                  <input
                    type="text"
                    name="companyName"
                    value={profileData.companyName}
                    onChange={handleProfileChange}
                    placeholder="Company name (if applicable)"
                    disabled={profileData.client_type === 'Individual'}
                  />
                </div>

                <div className="form-group">
                  <label><FaCalendarAlt /> Birthday</label>
                  <input
                    type="date"
                    name="birthday"
                    value={profileData.birthday}
                    onChange={handleProfileChange}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  className="save-btn"
                  onClick={saveProfile}
                  disabled={saving}
                >
                  {saving ? <><FaSpinner className="spinner" /> Saving...</> : <><FaSave /> Save Changes</>}
                </button>
              </div>
            </div>
          </div>
        );

      case 'addresses':
        return (
          <div className="addresses-section">
            <div className="section-header">
              <h2>My Addresses</h2>
              <button className="add-btn" onClick={handleAddAddress}>
                <FaPlus /> Add New Address
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="empty-state">
                <FaMapMarkerAlt className="empty-icon" />
                <h3>No addresses yet</h3>
                <p>Add your first address to get started</p>
                <button className="add-first-btn" onClick={handleAddAddress}>
                  <FaPlus /> Add Address
                </button>
              </div>
            ) : (
              <div className="addresses-grid">
                {addresses.map(address => (
                  <div key={address._id} className={`address-card ${address.isPrimary ? 'primary' : ''}`}>
                    {address.isPrimary && (
                      <div className="primary-badge">
                        <FaStar /> Primary
                      </div>
                    )}
                    
                    <div className="address-label">
                      <span className="label-badge">{address.label}</span>
                    </div>

                    <div className="address-details">
                      <p><FaHashtag /> {address.houseOrBuilding}</p>
                      <p><FaRoad /> {address.street}</p>
                      <p><FaCity /> {address.barangay}</p>
                      <p><FaCity /> {address.cityMunicipality}</p>
                      <p><FaGlobe /> {address.province}</p>
                      <p><FaMailBulk /> {address.zipCode}</p>
                    </div>

                    <div className="address-actions">
                      {!address.isPrimary && (
                        <button
                          className="action-btn primary"
                          onClick={() => setAsPrimary(address._id)}
                        >
                          <FaRegStar /> Set Primary
                        </button>
                      )}
                      <button
                        className="action-btn edit"
                        onClick={() => handleEditAddress(address)}
                      >
                        <FaEdit /> Edit
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => setDeleteConfirm(address)}
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'notifications':
        return (
          <div className="notifications-section">
            <h2>Notification Preferences</h2>
            
            <div className="preferences-group">
              <h3>Communication Channels</h3>
              <div className="checkbox-list">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="emailNotifications"
                    checked={notificationPrefs.emailNotifications}
                    onChange={handleNotificationChange}
                  />
                  <span>Email Notifications</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="smsNotifications"
                    checked={notificationPrefs.smsNotifications}
                    onChange={handleNotificationChange}
                  />
                  <span>SMS Notifications</span>
                </label>
              </div>
            </div>

            <div className="preferences-group">
              <h3>Notification Types</h3>
              <div className="checkbox-list">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="bookingUpdates"
                    checked={notificationPrefs.bookingUpdates}
                    onChange={handleNotificationChange}
                  />
                  <span>Booking Updates</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="paymentConfirmations"
                    checked={notificationPrefs.paymentConfirmations}
                    onChange={handleNotificationChange}
                  />
                  <span>Payment Confirmations</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="assessmentReminders"
                    checked={notificationPrefs.assessmentReminders}
                    onChange={handleNotificationChange}
                  />
                  <span>Assessment Reminders</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="systemAlerts"
                    checked={notificationPrefs.systemAlerts}
                    onChange={handleNotificationChange}
                  />
                  <span>System Alerts</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="promotionalEmails"
                    checked={notificationPrefs.promotionalEmails}
                    onChange={handleNotificationChange}
                  />
                  <span>Promotional Emails</span>
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button className="save-btn" onClick={saveNotificationPrefs}>
                <FaSave /> Save Preferences
              </button>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="security-section">
            <h2>Security Settings</h2>

            <div className="security-group">
              <div className="group-header">
                <h3><FaKey /> Password</h3>
                {!showPasswordForm && (
                  <button
                    className="change-btn"
                    onClick={() => setShowPasswordForm(true)}
                  >
                    Change Password
                  </button>
                )}
              </div>

              {showPasswordForm && (
                <form onSubmit={handlePasswordChange} className="password-form">
                  <div className="form-group">
                    <label>Current Password</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className={passwordErrors.currentPassword ? 'error' : ''}
                        placeholder="Enter your current password"
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {passwordErrors.currentPassword && (
                      <small className="error-text">{passwordErrors.currentPassword}</small>
                    )}
                  </div>

                  <div className="form-group">
                    <label>New Password</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className={passwordErrors.newPassword ? 'error' : ''}
                        placeholder="Enter new password (min. 8 characters)"
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {passwordErrors.newPassword && (
                      <small className="error-text">{passwordErrors.newPassword}</small>
                    )}
                    <small className="password-hint">
                      Password must be at least 8 characters long
                    </small>
                  </div>

                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className={passwordErrors.confirmPassword ? 'error' : ''}
                        placeholder="Confirm your new password"
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {passwordErrors.confirmPassword && (
                      <small className="error-text">{passwordErrors.confirmPassword}</small>
                    )}
                  </div>

                  {passwordData.newPassword && (
                    <div className="password-strength">
                      <div className="strength-meter">
                        <div 
                          className={`strength-bar ${getPasswordStrength(passwordData.newPassword)}`} 
                          style={{ width: `${getPasswordStrengthPercent(passwordData.newPassword)}%` }}
                        ></div>
                      </div>
                      <small className="strength-text">
                        Password strength: {getPasswordStrengthLabel(passwordData.newPassword)}
                      </small>
                    </div>
                  )}

                  <div className="form-actions">
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        setPasswordErrors({});
                        setShowCurrentPassword(false);
                        setShowNewPassword(false);
                        setShowConfirmPassword(false);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="save-btn"
                      disabled={saving}
                    >
                      {saving ? <><FaSpinner className="spinner" /> Updating...</> : 'Update Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="security-group">
              <h3><FaShieldAlt /> Session Settings</h3>
              <div className="info-message">
                <p>Your session will automatically timeout after 30 minutes of inactivity.</p>
                <small>Contact support if you need to adjust these settings.</small>
              </div>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="preferences-section">
            <h2>Account Preferences</h2>

            <div className="preferences-grid">
              <div className="preference-group">
                <label><FaLanguage /> Language</label>
                <select
                  name="language"
                  value={preferences.language}
                  onChange={handlePreferenceChange}
                >
                  <option value="en">English</option>
                  <option value="fil">Filipino</option>
                  <option value="ceb">Cebuano</option>
                </select>
              </div>

              <div className="preference-group">
                <label><FaPalette /> Theme</label>
                <div className="theme-selector">
                  <label className={`theme-option ${preferences.theme === 'light' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="theme"
                      value="light"
                      checked={preferences.theme === 'light'}
                      onChange={handlePreferenceChange}
                    />
                    <FaSun /> Light
                  </label>
                  <label className={`theme-option ${preferences.theme === 'dark' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="theme"
                      value="dark"
                      checked={preferences.theme === 'dark'}
                      onChange={handlePreferenceChange}
                    />
                    <FaMoon /> Dark
                  </label>
                </div>
              </div>

              <div className="preference-group">
                <label><FaGlobeAsia /> Timezone</label>
                <select
                  name="timezone"
                  value={preferences.timezone}
                  onChange={handlePreferenceChange}
                >
                  <option value="Asia/Manila">Asia/Manila (GMT+8)</option>
                  <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
                </select>
              </div>

              <div className="preference-group">
                <label>Date Format</label>
                <select
                  name="dateFormat"
                  value={preferences.dateFormat}
                  onChange={handlePreferenceChange}
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <div className="preference-group">
                <label>Currency</label>
                <select
                  name="currency"
                  value={preferences.currency}
                  onChange={handlePreferenceChange}
                >
                  <option value="PHP">PHP (₱)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button className="save-btn" onClick={savePreferences}>
                <FaSave /> Save Preferences
              </button>
            </div>
          </div>
        );

      case 'billing':
        return (
          <div className="billing-section">
            <h2>Billing History</h2>
            
            {billingHistory.length === 0 ? (
              <div className="empty-state">
                <FaFileInvoice className="empty-icon" />
                <h3>No billing history</h3>
                <p>Your transactions will appear here</p>
              </div>
            ) : (
              <div className="billing-table">
                 <table>
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billingHistory.map(invoice => (
                      <tr key={invoice.id}>
                        <td>{invoice.id}</td>
                        <td>{invoice.date}</td>
                        <td>{invoice.description}</td>
                        <td>₱{invoice.amount.toLocaleString()}</td>
                        <td>
                          <span className={`status-badge ${invoice.status}`}>
                            {invoice.status === 'paid' ? 'Paid' : invoice.status === 'pending' ? 'Pending' : 'Failed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="settings-loading">
        <FaSpinner className="spinner" />
        <p>Loading your settings...</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Settings | Salfer Engineering</title>
        <meta name="description" content="Manage your account information, update personal details, configure address book, notification preferences, and security settings." />
      </Helmet>

      <div className="customer-settings">
        {/* Header */}
        <div className="settings-header">
          <h1>
            <FaUserCog /> Account Settings
          </h1>
        </div>

        {/* Messages */}
        {success && (
          <div className="settings-success">
            <FaCheckCircle />
            <span>{success}</span>
          </div>
        )}
        
        {error && (
          <div className="settings-error">
            <FaExclamationTriangle />
            <span>{error}</span>
          </div>
        )}

        {/* NO TABS - Direct content only */}
        <div className="tab-content">
          {renderTabContent()}
        </div>

        {/* Address Modal */}
        {showAddressModal && (
          <div className="modal-overlay" onClick={() => setShowAddressModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
              
              <form onSubmit={handleAddressSubmit}>
                <div className="modal-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Label</label>
                      <select
                        name="label"
                        value={addressForm.label}
                        onChange={handleAddressFormChange}
                      >
                        <option value="Home">Home</option>
                        <option value="Office">Office</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="form-group checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="isPrimary"
                          checked={addressForm.isPrimary}
                          onChange={handleAddressFormChange}
                        />
                        <span>Set as primary address</span>
                      </label>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>House/Building No. *</label>
                      <input
                        type="text"
                        name="houseOrBuilding"
                        value={addressForm.houseOrBuilding}
                        onChange={handleAddressFormChange}
                        className={formErrors.houseOrBuilding ? 'error' : ''}
                      />
                      {formErrors.houseOrBuilding && <small className="error-text">{formErrors.houseOrBuilding}</small>}
                    </div>

                    <div className="form-group">
                      <label>Street *</label>
                      <input
                        type="text"
                        name="street"
                        value={addressForm.street}
                        onChange={handleAddressFormChange}
                        className={formErrors.street ? 'error' : ''}
                      />
                      {formErrors.street && <small className="error-text">{formErrors.street}</small>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Barangay *</label>
                      <input
                        type="text"
                        name="barangay"
                        value={addressForm.barangay}
                        onChange={handleAddressFormChange}
                        className={formErrors.barangay ? 'error' : ''}
                      />
                      {formErrors.barangay && <small className="error-text">{formErrors.barangay}</small>}
                    </div>

                    <div className="form-group">
                      <label>City/Municipality *</label>
                      <input
                        type="text"
                        name="cityMunicipality"
                        value={addressForm.cityMunicipality}
                        onChange={handleAddressFormChange}
                        className={formErrors.cityMunicipality ? 'error' : ''}
                      />
                      {formErrors.cityMunicipality && <small className="error-text">{formErrors.cityMunicipality}</small>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Province *</label>
                      <input
                        type="text"
                        name="province"
                        value={addressForm.province}
                        onChange={handleAddressFormChange}
                        className={formErrors.province ? 'error' : ''}
                      />
                      {formErrors.province && <small className="error-text">{formErrors.province}</small>}
                    </div>

                    <div className="form-group">
                      <label>ZIP Code *</label>
                      <input
                        type="text"
                        name="zipCode"
                        value={addressForm.zipCode}
                        onChange={handleAddressFormChange}
                        className={formErrors.zipCode ? 'error' : ''}
                        maxLength="4"
                      />
                      {formErrors.zipCode && <small className="error-text">{formErrors.zipCode}</small>}
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowAddressModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="save-btn" disabled={saving}>
                    {saving ? <><FaSpinner className="spinner" /> Saving...</> : <><FaSave /> Save Address</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
            <div className="modal-content confirm-modal" onClick={e => e.stopPropagation()}>
              <FaExclamationTriangle className="confirm-icon" />
              <h3>Delete Address</h3>
              <p>Are you sure you want to delete this address?</p>
              <div className="address-preview">
                {getFullAddress(deleteConfirm)}
              </div>
              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setDeleteConfirm(null)}>
                  Cancel
                </button>
                <button className="delete-btn" onClick={() => deleteAddress(deleteConfirm._id)}>
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CustomerSettings;