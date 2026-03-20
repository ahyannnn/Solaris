// pages/Customer/CustomerSettings.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FaKey
} from 'react-icons/fa';
import '../../styles/Customer/customersettings.css';

const CustomerSettings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile'); // profile, addresses, notifications, security, preferences
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
    birthday: '',
    profilePicture: null
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
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: '30',
    loginAlerts: true
  });

  // Preferences
  const [preferences, setPreferences] = useState({
    language: 'en',
    theme: 'light',
    timezone: 'Asia/Manila',
    dateFormat: 'MM/DD/YYYY',
    currency: 'PHP'
  });

  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

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
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Fetch user data and addresses on mount
  useEffect(() => {
    fetchUserData();
    fetchAddresses();
    fetchPreferences();
  }, []);

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
        birthday: client.birthday || '',
        profilePicture: client.profilePicture || null
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
    // Fetch user preferences from localStorage or API
    const savedPrefs = localStorage.getItem('userPreferences');
    if (savedPrefs) {
      setPreferences(JSON.parse(savedPrefs));
    }
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
    const { name, value } = e.target;
    setAddressForm(prev => ({ ...prev, [name]: value }));
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
    // Save to localStorage or API
    localStorage.setItem('notificationPrefs', JSON.stringify(notificationPrefs));
    setSuccess('Notification preferences saved');
    setTimeout(() => setSuccess(null), 3000);
  };

  // Preference handlers
  const handlePreferenceChange = (e) => {
    const { name, value } = e.target;
    setPreferences(prev => ({ ...prev, [name]: value }));
  };

  const savePreferences = () => {
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
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

  if (loading) {
    return (
      <div className="settings-loading">
        <FaSpinner className="spinner" />
        <p>Loading your settings...</p>
      </div>
    );
  }

  return (
    <div className="customer-settings">
      {/* Header */}
      <div className="settings-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back
        </button>
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

      {/* Navigation Tabs */}
      <div className="settings-tabs">
        <button
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <FaUser /> My Profile
        </button>
        <button
          className={`tab-btn ${activeTab === 'addresses' ? 'active' : ''}`}
          onClick={() => setActiveTab('addresses')}
        >
          <FaAddressBook /> My Addresses
        </button>
        <button
          className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <FaBell /> Notifications
        </button>
        <button
          className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <FaLock /> Security
        </button>
        <button
          className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          <FaPalette /> Preferences
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
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
        )}

        {/* ADDRESSES TAB */}
        {activeTab === 'addresses' && (
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
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
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
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <div className="security-section">
            <h2>Security Settings</h2>

            {/* Password Change */}
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
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className={passwordErrors.currentPassword ? 'error' : ''}
                    />
                    {passwordErrors.currentPassword && (
                      <small className="error-text">{passwordErrors.currentPassword}</small>
                    )}
                  </div>

                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className={passwordErrors.newPassword ? 'error' : ''}
                    />
                    {passwordErrors.newPassword && (
                      <small className="error-text">{passwordErrors.newPassword}</small>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className={passwordErrors.confirmPassword ? 'error' : ''}
                    />
                    {passwordErrors.confirmPassword && (
                      <small className="error-text">{passwordErrors.confirmPassword}</small>
                    )}
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        setPasswordErrors({});
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

            {/* Two-Factor Authentication */}
            <div className="security-group">
              <h3><FaShieldAlt /> Two-Factor Authentication</h3>
              <div className="toggle-setting">
                <div className="setting-info">
                  <p>Enhance your account security with 2FA</p>
                  <small>Get a verification code via SMS or authenticator app</small>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={securitySettings.twoFactorAuth}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, twoFactorAuth: e.target.checked })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            {/* Session Settings */}
            <div className="security-group">
              <h3>Session Settings</h3>
              <div className="form-group">
                <label>Session Timeout (minutes)</label>
                <select
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: e.target.value })}
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                </select>
              </div>

              <div className="toggle-setting">
                <div className="setting-info">
                  <p>Login Alerts</p>
                  <small>Get notified of new logins to your account</small>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={securitySettings.loginAlerts}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, loginAlerts: e.target.checked })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* PREFERENCES TAB */}
        {activeTab === 'preferences' && (
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
        )}
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
                        onChange={(e) => setAddressForm({ ...addressForm, isPrimary: e.target.checked })}
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
  );
};

export default CustomerSettings;