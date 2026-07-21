// pages/Admin/Settings.jsx
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  FaUser, 
  FaBuilding, 
  FaEnvelope, 
  FaPhone, 
  FaLock, 
  FaEye, 
  FaEyeSlash,
  FaSave,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaBell,
  FaGlobe,
  FaDatabase,
  FaServer,
  FaKey,
  FaShieldAlt,
  FaUserCog,
  FaClock,
  FaFileInvoice,
  FaChartLine,
  FaUsers,
  FaMicrochip,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaDownload,
  FaUpload
} from 'react-icons/fa';
import '../../styles/Admin/settings.css';

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile Settings
  const [profileData, setProfileData] = useState({
    fullName: 'Admin User',
    email: 'admin@salfer.com',
    phone: '09171234567',
    position: 'System Administrator'
  });
  
  // Security Settings
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
  // Company Settings
  const [companyData, setCompanyData] = useState({
    companyName: 'Salfer Engineering and Solar Technology Enterprise',
    registrationNumber: 'DTI-12345678',
    tin: '123-456-789-000',
    address: 'Purok 2, Masaya, San Jose, Camarines Sur',
    email: 'info@salfer.com',
    phone: '09171234567',
    website: 'www.salfer.com'
  });
  
  // Assessment Fee Settings
  const [feeSettings, setFeeSettings] = useState({
    preAssessmentFee: 1500,
    siteAssessmentFee: 3000,
    rushFee: 1000,
    cancellationFee: 500,
    refundPercentage72hrs: 80,
    refundPercentage48hrs: 50,
    refundPercentage24hrs: 0
  });
  
  // IoT Device Settings
  const [deviceSettings, setDeviceSettings] = useState({
    collectionInterval: 15,
    transmissionInterval: 2,
    deviceStartTime: '06:00',
    deviceEndTime: '18:00',
    batteryThreshold: 20,
    dataRetentionDays: 30
  });
  
  // System Settings
  const [systemSettings, setSystemSettings] = useState({
    sessionTimeout: 30,
    maxUploadSize: 10,
    allowRegistration: true,
    requireEmailVerification: true,
    backupFrequency: 'daily',
    backupTime: '02:00',
    dataRetentionYears: 5
  });
  
  // Notification Settings
  const [notificationPrefs, setNotificationPrefs] = useState({
    newBookingAlerts: true,
    paymentVerificationAlerts: true,
    newUserRegistrationAlerts: true,
    deviceOfflineAlerts: true,
    systemErrorAlerts: true,
    dailySummaryEmail: true,
    weeklyReportEmail: true
  });

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleCompanyChange = (e) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({ ...prev, [name]: value }));
  };

  const handleFeeChange = (e) => {
    const { name, value } = e.target;
    setFeeSettings(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
  };

  const handleDeviceChange = (e) => {
    const { name, value } = e.target;
    setDeviceSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSystemChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setSystemSettings(prev => ({ ...prev, [name]: checked }));
    } else {
      setSystemSettings(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotificationPrefs(prev => ({ ...prev, [name]: checked }));
  };

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

  const handlePasswordChange = (e) => {
    e.preventDefault();
    const errors = validatePassword();
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setSaving(true);
    setTimeout(() => {
      setSuccess('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
      setPasswordErrors({});
      setSaving(false);
      setTimeout(() => setSuccess(null), 3000);
    }, 1000);
  };

  const handleSaveProfile = () => {
    setSaving(true);
    setTimeout(() => {
      setSuccess('Profile updated successfully');
      setSaving(false);
      setTimeout(() => setSuccess(null), 3000);
    }, 1000);
  };

  const handleSaveCompany = () => {
    setSaving(true);
    setTimeout(() => {
      setSuccess('Company information saved');
      setSaving(false);
      setTimeout(() => setSuccess(null), 3000);
    }, 1000);
  };

  const handleSaveFees = () => {
    setSaving(true);
    setTimeout(() => {
      setSuccess('Assessment fees updated');
      setSaving(false);
      setTimeout(() => setSuccess(null), 3000);
    }, 1000);
  };

  const handleSaveDevice = () => {
    setSaving(true);
    setTimeout(() => {
      setSuccess('IoT device settings saved');
      setSaving(false);
      setTimeout(() => setSuccess(null), 3000);
    }, 1000);
  };

  const handleSaveSystem = () => {
    setSaving(true);
    setTimeout(() => {
      setSuccess('System settings saved');
      setSaving(false);
      setTimeout(() => setSuccess(null), 3000);
    }, 1000);
  };

  const handleSaveNotifications = () => {
    setSaving(true);
    setTimeout(() => {
      setSuccess('Notification preferences saved');
      setSaving(false);
      setTimeout(() => setSuccess(null), 3000);
    }, 1000);
  };

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
      'weak': 'Weak',
      'medium': 'Medium',
      'strong': 'Strong',
      'very-strong': 'Very Strong'
    };
    return labels[strength];
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Skeleton Loader
  const SkeletonLoader = () => (
    <div className="admin-settings">
      <div className="settings-header">
        <div className="skeleton-line large"></div>
        <div className="skeleton-line medium"></div>
      </div>
      <div className="settings-tabs">
        {[1, 2, 3, 4, 5, 6, 7].map(i => (
          <div key={i} className="skeleton-tab"></div>
        ))}
      </div>
      <div className="settings-content">
        <div className="skeleton-form">
          <div className="skeleton-line medium"></div>
          <div className="skeleton-input"></div>
          <div className="skeleton-line medium"></div>
          <div className="skeleton-input"></div>
          <div className="skeleton-button"></div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <>
      <Helmet>
        <title>System Settings | Admin | Salfer Engineering</title>
      </Helmet>

      <div className="admin-settings">
        {/* Header */}
        <div className="settings-header">
          
          <p>Manage company information, assessment fees, and system configuration</p>
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

        {/* Tabs */}
        <div className="settings-tabs">
          <button 
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button 
            className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            Security
          </button>
          <button 
            className={`tab-btn ${activeTab === 'company' ? 'active' : ''}`}
            onClick={() => setActiveTab('company')}
          >
            Company
          </button>
          <button 
            className={`tab-btn ${activeTab === 'fees' ? 'active' : ''}`}
            onClick={() => setActiveTab('fees')}
          >
            Assessment Fees
          </button>
          <button 
            className={`tab-btn ${activeTab === 'device' ? 'active' : ''}`}
            onClick={() => setActiveTab('device')}
          >
            IoT Device
          </button>
          <button 
            className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            System
          </button>
          <button 
            className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            Notifications
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="settings-content">
            <div className="settings-card">
              <h2>Admin Profile</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={profileData.fullName}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="form-group">
                  <label>Position</label>
                  <input
                    type="text"
                    name="position"
                    value={profileData.position}
                    onChange={handleProfileChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button 
                  className="save-btn" 
                  onClick={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? <><FaSpinner className="spinner" /> Saving...</> : <><FaSave /> Save Profile</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="settings-content">
            <div className="settings-card">
              <h2>Password</h2>
              
              {!showPasswordForm ? (
                <div className="password-section">
                  <p>Change your password to keep your account secure.</p>
                  <button 
                    className="change-password-btn"
                    onClick={() => setShowPasswordForm(true)}
                  >
                    <FaKey /> Change Password
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePasswordChange} className="password-form">
                  <div className="form-group">
                    <label>Current Password</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className={passwordErrors.currentPassword ? 'error' : ''}
                        placeholder="Enter current password"
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
                        placeholder="Enter new password"
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
                    <small>Password must be at least 8 characters</small>
                  </div>

                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className={passwordErrors.confirmPassword ? 'error' : ''}
                        placeholder="Confirm new password"
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
                        Strength: {getPasswordStrengthLabel(passwordData.newPassword)}
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

            <div className="settings-card">
              <h2>Session Security</h2>
              <div className="info-message">
                <p>Session timeout is set to <strong>{systemSettings.sessionTimeout} minutes</strong> of inactivity.</p>
                <p>Two-factor authentication is recommended for admin accounts.</p>
                <small>Session settings can be configured in System tab.</small>
              </div>
            </div>
          </div>
        )}

        {/* Company Tab */}
        {activeTab === 'company' && (
          <div className="settings-content">
            <div className="settings-card">
              <h2>Company Information</h2>
              
              <div className="form-group">
                <label>Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={companyData.companyName}
                  onChange={handleCompanyChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>DTI Registration Number</label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={companyData.registrationNumber}
                    onChange={handleCompanyChange}
                  />
                </div>
                <div className="form-group">
                  <label>TIN</label>
                  <input
                    type="text"
                    name="tin"
                    value={companyData.tin}
                    onChange={handleCompanyChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Address</label>
                <textarea
                  name="address"
                  rows="3"
                  value={companyData.address}
                  onChange={handleCompanyChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={companyData.email}
                    onChange={handleCompanyChange}
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={companyData.phone}
                    onChange={handleCompanyChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Website</label>
                <input
                  type="text"
                  name="website"
                  value={companyData.website}
                  onChange={handleCompanyChange}
                />
              </div>

              <div className="form-actions">
                <button 
                  className="save-btn" 
                  onClick={handleSaveCompany}
                  disabled={saving}
                >
                  {saving ? <><FaSpinner className="spinner" /> Saving...</> : <><FaSave /> Save Company Info</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assessment Fees Tab */}
        {activeTab === 'fees' && (
          <div className="settings-content">
            <div className="settings-card">
              <h2>Assessment Fees</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Pre-Assessment Fee</label>
                  <input
                    type="number"
                    name="preAssessmentFee"
                    value={feeSettings.preAssessmentFee}
                    onChange={handleFeeChange}
                  />
                  <small>7-day IoT monitoring + assessment report</small>
                </div>
                <div className="form-group">
                  <label>Site Assessment Fee</label>
                  <input
                    type="number"
                    name="siteAssessmentFee"
                    value={feeSettings.siteAssessmentFee}
                    onChange={handleFeeChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Rush Fee</label>
                  <input
                    type="number"
                    name="rushFee"
                    value={feeSettings.rushFee}
                    onChange={handleFeeChange}
                  />
                </div>
                <div className="form-group">
                  <label>Cancellation Fee</label>
                  <input
                    type="number"
                    name="cancellationFee"
                    value={feeSettings.cancellationFee}
                    onChange={handleFeeChange}
                  />
                </div>
              </div>

              <h3>Refund Policy</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>72+ hours before</label>
                  <input
                    type="number"
                    name="refundPercentage72hrs"
                    value={feeSettings.refundPercentage72hrs}
                    onChange={handleFeeChange}
                  />
                  <small>% refund</small>
                </div>
                <div className="form-group">
                  <label>48-72 hours before</label>
                  <input
                    type="number"
                    name="refundPercentage48hrs"
                    value={feeSettings.refundPercentage48hrs}
                    onChange={handleFeeChange}
                  />
                  <small>% refund</small>
                </div>
                <div className="form-group">
                  <label>Less than 48 hours</label>
                  <input
                    type="number"
                    name="refundPercentage24hrs"
                    value={feeSettings.refundPercentage24hrs}
                    onChange={handleFeeChange}
                  />
                  <small>% refund</small>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  className="save-btn" 
                  onClick={handleSaveFees}
                  disabled={saving}
                >
                  {saving ? <><FaSpinner className="spinner" /> Saving...</> : <><FaSave /> Save Fees</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* IoT Device Tab */}
        {activeTab === 'device' && (
          <div className="settings-content">
            <div className="settings-card">
              <h2>IoT Device Configuration</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Data Collection Interval</label>
                  <select
                    name="collectionInterval"
                    value={deviceSettings.collectionInterval}
                    onChange={handleDeviceChange}
                  >
                    <option value="5">5 minutes</option>
                    <option value="10">10 minutes</option>
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">60 minutes</option>
                  </select>
                  <small>How often device records data</small>
                </div>
                <div className="form-group">
                  <label>Data Transmission Interval</label>
                  <select
                    name="transmissionInterval"
                    value={deviceSettings.transmissionInterval}
                    onChange={handleDeviceChange}
                  >
                    <option value="1">1 hour</option>
                    <option value="2">2 hours</option>
                    <option value="3">3 hours</option>
                    <option value="6">6 hours</option>
                  </select>
                  <small>How often data is uploaded to server</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Device Start Time</label>
                  <input
                    type="time"
                    name="deviceStartTime"
                    value={deviceSettings.deviceStartTime}
                    onChange={handleDeviceChange}
                  />
                </div>
                <div className="form-group">
                  <label>Device End Time</label>
                  <input
                    type="time"
                    name="deviceEndTime"
                    value={deviceSettings.deviceEndTime}
                    onChange={handleDeviceChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Battery Low Threshold</label>
                  <input
                    type="number"
                    name="batteryThreshold"
                    value={deviceSettings.batteryThreshold}
                    onChange={handleDeviceChange}
                  />
                  <small>% - Alert when battery drops below this level</small>
                </div>
                <div className="form-group">
                  <label>Data Retention (Days)</label>
                  <input
                    type="number"
                    name="dataRetentionDays"
                    value={deviceSettings.dataRetentionDays}
                    onChange={handleDeviceChange}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button 
                  className="save-btn" 
                  onClick={handleSaveDevice}
                  disabled={saving}
                >
                  {saving ? <><FaSpinner className="spinner" /> Saving...</> : <><FaSave /> Save Device Settings</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <div className="settings-content">
            <div className="settings-card">
              <h2>System Configuration</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Session Timeout (minutes)</label>
                  <input
                    type="number"
                    name="sessionTimeout"
                    value={systemSettings.sessionTimeout}
                    onChange={handleSystemChange}
                  />
                </div>
                <div className="form-group">
                  <label>Max Upload Size (MB)</label>
                  <input
                    type="number"
                    name="maxUploadSize"
                    value={systemSettings.maxUploadSize}
                    onChange={handleSystemChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Backup Frequency</label>
                  <select
                    name="backupFrequency"
                    value={systemSettings.backupFrequency}
                    onChange={handleSystemChange}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Backup Time</label>
                  <input
                    type="time"
                    name="backupTime"
                    value={systemSettings.backupTime}
                    onChange={handleSystemChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Data Retention (Years)</label>
                  <input
                    type="number"
                    name="dataRetentionYears"
                    value={systemSettings.dataRetentionYears}
                    onChange={handleSystemChange}
                  />
                </div>
              </div>

              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="allowRegistration"
                    checked={systemSettings.allowRegistration}
                    onChange={handleSystemChange}
                  />
                  <span>Allow New User Registration</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="requireEmailVerification"
                    checked={systemSettings.requireEmailVerification}
                    onChange={handleSystemChange}
                  />
                  <span>Require Email Verification</span>
                </label>
              </div>

              <div className="form-actions">
                <button 
                  className="save-btn" 
                  onClick={handleSaveSystem}
                  disabled={saving}
                >
                  {saving ? <><FaSpinner className="spinner" /> Saving...</> : <><FaSave /> Save System Settings</>}
                </button>
              </div>
            </div>

            <div className="settings-card">
              <h2>Backup & Restore</h2>
              <div className="backup-actions">
                <button className="backup-btn">
                  <FaDownload /> Download Backup
                </button>
                <button className="restore-btn">
                  <FaUpload /> Restore from Backup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="settings-content">
            <div className="settings-card">
              <h2>Admin Alert Preferences</h2>
              
              <div className="checkbox-list">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="newBookingAlerts"
                    checked={notificationPrefs.newBookingAlerts}
                    onChange={handleNotificationChange}
                  />
                  <span>New Booking Alerts</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="paymentVerificationAlerts"
                    checked={notificationPrefs.paymentVerificationAlerts}
                    onChange={handleNotificationChange}
                  />
                  <span>Payment Verification Alerts</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="newUserRegistrationAlerts"
                    checked={notificationPrefs.newUserRegistrationAlerts}
                    onChange={handleNotificationChange}
                  />
                  <span>New User Registration Alerts</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="deviceOfflineAlerts"
                    checked={notificationPrefs.deviceOfflineAlerts}
                    onChange={handleNotificationChange}
                  />
                  <span>IoT Device Offline Alerts</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="systemErrorAlerts"
                    checked={notificationPrefs.systemErrorAlerts}
                    onChange={handleNotificationChange}
                  />
                  <span>System Error Alerts</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="dailySummaryEmail"
                    checked={notificationPrefs.dailySummaryEmail}
                    onChange={handleNotificationChange}
                  />
                  <span>Daily Summary Email</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="weeklyReportEmail"
                    checked={notificationPrefs.weeklyReportEmail}
                    onChange={handleNotificationChange}
                  />
                  <span>Weekly Report Email</span>
                </label>
              </div>

              <div className="form-actions">
                <button 
                  className="save-btn" 
                  onClick={handleSaveNotifications}
                  disabled={saving}
                >
                  {saving ? <><FaSpinner className="spinner" /> Saving...</> : <><FaSave /> Save Preferences</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Settings;