// pages/Customer/CustomerSettings.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import '../../styles/Customer/customersettings.css';

const CustomerSettings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast, showToast, hideToast } = useToast();
  
  const getInitialTab = () => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    return ['profile', 'addresses', 'notifications', 'security', 'preferences', 'billing'].includes(tab) ? tab : 'profile';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [profileData, setProfileData] = useState({
    firstName: '', middleName: '', lastName: '', email: '', contactNumber: '', companyName: '', client_type: 'Individual', birthday: ''
  });

  const [addresses, setAddresses] = useState([]);

  const [notificationPrefs, setNotificationPrefs] = useState({
    emailNotifications: true, smsNotifications: true, bookingUpdates: true, paymentConfirmations: true, promotionalEmails: false, assessmentReminders: true, systemAlerts: true
  });

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordErrors, setPasswordErrors] = useState({});

  const [preferences, setPreferences] = useState({
    language: 'en', theme: 'light', timezone: 'Asia/Manila', dateFormat: 'MM/DD/YYYY', currency: 'PHP'
  });

  const [billingHistory, setBillingHistory] = useState([]);

  const [addressForm, setAddressForm] = useState({
    houseOrBuilding: '', street: '', barangay: '', cityMunicipality: '', province: '', zipCode: '', label: 'Home', isPrimary: false
  });

  const [formErrors, setFormErrors] = useState({});

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
    const labels = { 'weak': 'Weak', 'medium': 'Medium', 'strong': 'Strong', 'very-strong': 'Very Strong' };
    return labels[strength];
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabFromUrl = params.get('tab');
    if (tabFromUrl && ['profile', 'addresses', 'notifications', 'security', 'preferences', 'billing'].includes(tabFromUrl)) {
      if (tabFromUrl !== activeTab) {
        handleTabChange(tabFromUrl);
      }
    }
  }, [location.search]);

  const handleTabChange = (newTab) => {
    setTabLoading(true);
    setActiveTab(newTab);
    setTimeout(() => setTabLoading(false), 300);
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchUserData(), fetchAddresses(), fetchPreferences(), fetchBillingHistory()]);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/clients/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const client = response.data.client;
      setProfileData({
        firstName: client.contactFirstName || '', middleName: client.contactMiddleName || '', lastName: client.contactLastName || '',
        email: client.email || '', contactNumber: client.contactNumber || '', companyName: client.companyName || '',
        client_type: client.client_type || 'Individual', birthday: client.birthday || ''
      });
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load profile data');
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
    if (savedPrefs) setPreferences(JSON.parse(savedPrefs));
  };

  const fetchBillingHistory = async () => {
    setBillingHistory([
      { id: 'INV-2024-001', date: '2024-01-15', amount: 1500, status: 'paid', description: 'Assessment Fee' },
      { id: 'INV-2024-002', date: '2024-02-10', amount: 25000, status: 'paid', description: 'Initial Payment - Solar Installation' },
      { id: 'INV-2024-003', date: '2024-03-05', amount: 50000, status: 'pending', description: 'Final Payment' }
    ]);
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(`${import.meta.env.VITE_API_URL}/api/clients/update`,
        { contactFirstName: profileData.firstName, contactMiddleName: profileData.middleName, contactLastName: profileData.lastName, contactNumber: profileData.contactNumber, companyName: profileData.companyName, birthday: profileData.birthday },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast('Profile updated successfully', 'success');
    } catch (err) {
      showToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setAddressForm({ houseOrBuilding: '', street: '', barangay: '', cityMunicipality: '', province: '', zipCode: '', label: 'Home', isPrimary: addresses.length === 0 });
    setFormErrors({});
    setShowAddressModal(true);
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setAddressForm({
      houseOrBuilding: address.houseOrBuilding || '', street: address.street || '', barangay: address.barangay || '',
      cityMunicipality: address.cityMunicipality || '', province: address.province || '', zipCode: address.zipCode || '',
      label: address.label || 'Home', isPrimary: address.isPrimary || false
    });
    setFormErrors({});
    setShowAddressModal(true);
  };

  const handleAddressFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateAddressForm = () => {
    const errors = {};
    if (!addressForm.houseOrBuilding.trim()) errors.houseOrBuilding = 'Required';
    if (!addressForm.street.trim()) errors.street = 'Required';
    if (!addressForm.barangay.trim()) errors.barangay = 'Required';
    if (!addressForm.cityMunicipality.trim()) errors.cityMunicipality = 'Required';
    if (!addressForm.province.trim()) errors.province = 'Required';
    if (!addressForm.zipCode.trim()) errors.zipCode = 'Required';
    if (addressForm.zipCode && !/^\d{4}$/.test(addressForm.zipCode)) errors.zipCode = 'Must be 4 digits';
    return errors;
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    const errors = validateAddressForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast('Please fill in all required fields', 'warning');
      return;
    }
    setSaving(true);
    try {
      const token = sessionStorage.getItem('token');
      if (editingAddress) {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/clients/me/addresses/${editingAddress._id}`, addressForm, { headers: { Authorization: `Bearer ${token}` } });
        showToast('Address updated', 'success');
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/clients/me/addresses`, addressForm, { headers: { Authorization: `Bearer ${token}` } });
        showToast('Address added', 'success');
      }
      fetchAddresses();
      setShowAddressModal(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save address', 'error');
    } finally {
      setSaving(false);
    }
  };

  const setAsPrimary = async (addressId) => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/clients/me/addresses/${addressId}/primary`, {}, { headers: { Authorization: `Bearer ${token}` } });
      showToast('Primary address updated', 'success');
      fetchAddresses();
    } catch (err) {
      showToast('Failed to update primary address', 'error');
    }
  };

  const deleteAddress = async (addressId) => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/clients/me/addresses/${addressId}`, { headers: { Authorization: `Bearer ${token}` } });
      showToast('Address deleted', 'success');
      fetchAddresses();
      setDeleteConfirm(null);
    } catch (err) {
      showToast('Failed to delete address', 'error');
    }
  };

  const validatePassword = () => {
    const errors = {};
    if (!passwordData.currentPassword) errors.currentPassword = 'Required';
    if (!passwordData.newPassword) errors.newPassword = 'Required';
    if (passwordData.newPassword.length < 8) errors.newPassword = 'Minimum 8 characters';
    if (passwordData.newPassword !== passwordData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    return errors;
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const errors = validatePassword();
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      showToast('Please fix the errors', 'warning');
      return;
    }
    setSaving(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/change-password`, passwordData, { headers: { Authorization: `Bearer ${token}` } });
      showToast('Password changed', 'success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
      setShowCurrentPassword(false); setShowNewPassword(false); setShowConfirmPassword(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to change password', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotificationPrefs(prev => ({ ...prev, [name]: checked }));
  };

  const saveNotificationPrefs = () => {
    localStorage.setItem('notificationPrefs', JSON.stringify(notificationPrefs));
    showToast('Preferences saved', 'success');
  };

  const handlePreferenceChange = (e) => {
    const { name, value } = e.target;
    setPreferences(prev => ({ ...prev, [name]: value }));
  };

  const savePreferences = () => {
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    if (preferences.theme === 'dark') {
      document.body.classList.add('dark-mode-cusset');
    } else {
      document.body.classList.remove('dark-mode-cusset');
    }
    showToast('Preferences saved', 'success');
  };

  const getFullAddress = (addr) => {
    const parts = [addr.houseOrBuilding, addr.street, addr.barangay, addr.cityMunicipality, addr.province, addr.zipCode].filter(part => part && part.trim() !== '');
    return parts.join(', ');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(amount);
  };

  // Skeleton Components
  const ProfileSkeleton = () => (
    <div className="profile-section-cusset">
      <div className="skeleton-line large"></div>
      <div className="profile-form-cusset">
        <div className="form-row-cusset"><div className="skeleton-input"></div><div className="skeleton-input"></div><div className="skeleton-input"></div></div>
        <div className="form-row-cusset"><div className="skeleton-input"></div><div className="skeleton-input"></div></div>
        <div className="form-row-cusset"><div className="skeleton-input"></div><div className="skeleton-input"></div></div>
        <div className="skeleton-button"></div>
      </div>
    </div>
  );

  const AddressesSkeleton = () => (
    <div className="addresses-section-cusset">
      <div className="section-header-cusset"><div className="skeleton-line medium"></div><div className="skeleton-button small"></div></div>
      <div className="addresses-grid-cusset">
        {[1, 2].map(i => <div key={i} className="address-card-cusset skeleton-card"><div className="skeleton-badge"></div><div className="skeleton-line small"></div><div className="skeleton-line tiny"></div><div className="skeleton-line tiny"></div></div>)}
      </div>
    </div>
  );

  const renderTabContent = () => {
    if (tabLoading) {
      switch (activeTab) {
        case 'profile': return <ProfileSkeleton />;
        case 'addresses': return <AddressesSkeleton />;
        default: return <ProfileSkeleton />;
      }
    }

    switch (activeTab) {
      case 'profile':
        return (
          <div className="profile-section-cusset">
            <h2>Personal Information</h2>
            <div className="profile-form-cusset">
              <div className="form-row-cusset">
                <div className="form-group-cusset"><label>First Name</label><input type="text" name="firstName" value={profileData.firstName} onChange={handleProfileChange} /></div>
                <div className="form-group-cusset"><label>Middle Name</label><input type="text" name="middleName" value={profileData.middleName} onChange={handleProfileChange} /></div>
                <div className="form-group-cusset"><label>Last Name</label><input type="text" name="lastName" value={profileData.lastName} onChange={handleProfileChange} /></div>
              </div>
              <div className="form-row-cusset">
                <div className="form-group-cusset"><label>Email</label><input type="email" value={profileData.email} disabled className="readonly-cusset" /><small>Email cannot be changed</small></div>
                <div className="form-group-cusset"><label>Contact Number</label><input type="tel" name="contactNumber" value={profileData.contactNumber} onChange={handleProfileChange} /></div>
              </div>
              <div className="form-row-cusset">
                <div className="form-group-cusset"><label>Company</label><input type="text" name="companyName" value={profileData.companyName} onChange={handleProfileChange} disabled={profileData.client_type === 'Individual'} /></div>
                <div className="form-group-cusset"><label>Birthday</label><input type="date" name="birthday" value={profileData.birthday} onChange={handleProfileChange} /></div>
              </div>
              <div className="form-actions-cusset"><button className="save-btn-cusset" onClick={saveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button></div>
            </div>
          </div>
        );

      case 'addresses':
        return (
          <div className="addresses-section-cusset">
            <div className="section-header-cusset"><h2>My Addresses</h2><button className="add-btn-cusset" onClick={handleAddAddress}>+ Add Address</button></div>
            {addresses.length === 0 ? (
              <div className="empty-state-cusset"><h3>No addresses yet</h3><p>Add your first address</p><button className="add-first-btn-cusset" onClick={handleAddAddress}>Add Address</button></div>
            ) : (
              <div className="addresses-grid-cusset">
                {addresses.map(address => (
                  <div key={address._id} className={`address-card-cusset ${address.isPrimary ? 'primary-cusset' : ''}`}>
                    {address.isPrimary && <div className="primary-badge-cusset">Primary</div>}
                    <div className="address-label-cusset"><span className="label-badge-cusset">{address.label}</span></div>
                    <div className="address-details-cusset"><p>{address.houseOrBuilding}</p><p>{address.street}</p><p>{address.barangay}</p><p>{address.cityMunicipality}</p><p>{address.province}</p><p>{address.zipCode}</p></div>
                    <div className="address-actions-cusset">
                      {!address.isPrimary && <button className="action-btn-cusset primary-cusset" onClick={() => setAsPrimary(address._id)}>Set Primary</button>}
                      <button className="action-btn-cusset edit-cusset" onClick={() => handleEditAddress(address)}>Edit</button>
                      <button className="action-btn-cusset delete-cusset" onClick={() => setDeleteConfirm(address)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'notifications':
        return (
          <div className="notifications-section-cusset">
            <h2>Notification Preferences</h2>
            <div className="preferences-group-cusset">
              <h3>Channels</h3>
              <div className="checkbox-list-cusset">
                <label className="checkbox-label-cusset"><input type="checkbox" name="emailNotifications" checked={notificationPrefs.emailNotifications} onChange={handleNotificationChange} /><span>Email</span></label>
                <label className="checkbox-label-cusset"><input type="checkbox" name="smsNotifications" checked={notificationPrefs.smsNotifications} onChange={handleNotificationChange} /><span>SMS</span></label>
              </div>
            </div>
            <div className="preferences-group-cusset">
              <h3>Types</h3>
              <div className="checkbox-list-cusset">
                <label className="checkbox-label-cusset"><input type="checkbox" name="bookingUpdates" checked={notificationPrefs.bookingUpdates} onChange={handleNotificationChange} /><span>Booking Updates</span></label>
                <label className="checkbox-label-cusset"><input type="checkbox" name="paymentConfirmations" checked={notificationPrefs.paymentConfirmations} onChange={handleNotificationChange} /><span>Payment Confirmations</span></label>
                <label className="checkbox-label-cusset"><input type="checkbox" name="assessmentReminders" checked={notificationPrefs.assessmentReminders} onChange={handleNotificationChange} /><span>Assessment Reminders</span></label>
                <label className="checkbox-label-cusset"><input type="checkbox" name="systemAlerts" checked={notificationPrefs.systemAlerts} onChange={handleNotificationChange} /><span>System Alerts</span></label>
                <label className="checkbox-label-cusset"><input type="checkbox" name="promotionalEmails" checked={notificationPrefs.promotionalEmails} onChange={handleNotificationChange} /><span>Promotional</span></label>
              </div>
            </div>
            <div className="form-actions-cusset"><button className="save-btn-cusset" onClick={saveNotificationPrefs}>Save</button></div>
          </div>
        );

      case 'security':
        return (
          <div className="security-section-cusset">
            <h2>Security</h2>
            <div className="security-group-cusset">
              <div className="group-header-cusset"><h3>Password</h3>{!showPasswordForm && <button className="change-btn-cusset" onClick={() => setShowPasswordForm(true)}>Change</button>}</div>
              {showPasswordForm && (
                <form onSubmit={handlePasswordChange} className="password-form-cusset">
                  <div className="form-group-cusset"><label>Current Password</label><div className="password-input-wrapper-cusset"><input type={showCurrentPassword ? 'text' : 'password'} value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} /><button type="button" className="password-toggle-btn-cusset" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>{showCurrentPassword ? 'Hide' : 'Show'}</button></div>{passwordErrors.currentPassword && <small className="error-text-cusset">{passwordErrors.currentPassword}</small>}</div>
                  <div className="form-group-cusset"><label>New Password</label><div className="password-input-wrapper-cusset"><input type={showNewPassword ? 'text' : 'password'} value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} /><button type="button" className="password-toggle-btn-cusset" onClick={() => setShowNewPassword(!showNewPassword)}>{showNewPassword ? 'Hide' : 'Show'}</button></div>{passwordErrors.newPassword && <small className="error-text-cusset">{passwordErrors.newPassword}</small>}</div>
                  <div className="form-group-cusset"><label>Confirm Password</label><div className="password-input-wrapper-cusset"><input type={showConfirmPassword ? 'text' : 'password'} value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} /><button type="button" className="password-toggle-btn-cusset" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>{showConfirmPassword ? 'Hide' : 'Show'}</button></div>{passwordErrors.confirmPassword && <small className="error-text-cusset">{passwordErrors.confirmPassword}</small>}</div>
                  {passwordData.newPassword && (
                    <div className="password-strength-cusset">
                      <div className="strength-meter-cusset"><div className={`strength-bar-cusset ${getPasswordStrength(passwordData.newPassword)}-cusset`} style={{ width: `${getPasswordStrengthPercent(passwordData.newPassword)}%` }}></div></div>
                      <small>Strength: {getPasswordStrengthLabel(passwordData.newPassword)}</small>
                    </div>
                  )}
                  <div className="form-actions-cusset"><button type="button" className="cancel-btn-cusset" onClick={() => { setShowPasswordForm(false); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}>Cancel</button><button type="submit" className="save-btn-cusset" disabled={saving}>{saving ? 'Updating...' : 'Update'}</button></div>
                </form>
              )}
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="preferences-section-cusset">
            <h2>Preferences</h2>
            <div className="preferences-grid-cusset">
              <div className="preference-group-cusset"><label>Language</label><select name="language" value={preferences.language} onChange={handlePreferenceChange}><option value="en">English</option><option value="fil">Filipino</option></select></div>
              <div className="preference-group-cusset"><label>Theme</label><div className="theme-selector-cusset"><label className={`theme-option-cusset ${preferences.theme === 'light' ? 'active-cusset' : ''}`}><input type="radio" name="theme" value="light" checked={preferences.theme === 'light'} onChange={handlePreferenceChange} /> Light</label><label className={`theme-option-cusset ${preferences.theme === 'dark' ? 'active-cusset' : ''}`}><input type="radio" name="theme" value="dark" checked={preferences.theme === 'dark'} onChange={handlePreferenceChange} /> Dark</label></div></div>
              <div className="preference-group-cusset"><label>Timezone</label><select name="timezone" value={preferences.timezone} onChange={handlePreferenceChange}><option value="Asia/Manila">Asia/Manila</option></select></div>
              <div className="preference-group-cusset"><label>Date Format</label><select name="dateFormat" value={preferences.dateFormat} onChange={handlePreferenceChange}><option value="MM/DD/YYYY">MM/DD/YYYY</option><option value="DD/MM/YYYY">DD/MM/YYYY</option></select></div>
            </div>
            <div className="form-actions-cusset"><button className="save-btn-cusset" onClick={savePreferences}>Save</button></div>
          </div>
        );

      case 'billing':
        return (
          <div className="billing-section-cusset">
            <h2>Billing History</h2>
            {billingHistory.length === 0 ? (
              <div className="empty-state-cusset"><h3>No billing history</h3><p>Your transactions will appear here</p></div>
            ) : (
              <div className="billing-table-wrapper-cusset">
                <table className="billing-table-cusset">
                  <thead><tr><th>Invoice</th><th>Date</th><th>Description</th><th>Amount</th><th>Status</th></tr></thead>
                  <tbody>
                    {billingHistory.map(invoice => (
                      <tr key={invoice.id}><td className="invoice-cell">{invoice.id}</td><td>{invoice.date}</td><td>{invoice.description}</td><td className="amount-cell">{formatCurrency(invoice.amount)}</td><td><span className={`status-badge-cusset ${invoice.status}-cusset`}>{invoice.status}</span></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      default: return null;
    }
  };

  if (loading) {
    return (
      <>
        <Helmet><title>Settings | Salfer Engineering</title></Helmet>
        <div className="customer-settings-cusset"><div className="settings-header-cusset"><div className="skeleton-line large"></div></div><div className="settings-sidebar-cusset"><div className="skeleton-tab"></div><div className="skeleton-tab"></div><div className="skeleton-tab"></div></div><div className="tab-content-cusset"><ProfileSkeleton /></div></div>
      </>
    );
  }

  return (
    <>
      <Helmet><title>Settings | Salfer Engineering</title></Helmet>
      <div className="customer-settings-cusset">
        <div className="settings-header-cusset"><h1>Account Settings</h1></div>

        <div className="settings-sidebar-cusset">
          <button className={`settings-tab-cusset ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => handleTabChange('profile')}>Profile</button>
          <button className={`settings-tab-cusset ${activeTab === 'addresses' ? 'active' : ''}`} onClick={() => handleTabChange('addresses')}>Addresses</button>
          {/* <button className={`settings-tab-cusset ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => handleTabChange('notifications')}>Notifications</button>
          <button className={`settings-tab-cusset ${activeTab === 'security' ? 'active' : ''}`} onClick={() => handleTabChange('security')}>Security</button>
          <button className={`settings-tab-cusset ${activeTab === 'preferences' ? 'active' : ''}`} onClick={() => handleTabChange('preferences')}>Preferences</button>
          <button className={`settings-tab-cusset ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => handleTabChange('billing')}>Billing</button> */}
        </div>

        <div className="tab-content-cusset">{renderTabContent()}</div>

        {/* Address Modal */}
        {showAddressModal && (
          <div className="modal-overlay-cusset" onClick={() => setShowAddressModal(false)}>
            <div className="modal-content-cusset" onClick={e => e.stopPropagation()}>
              <div className="modal-header-cusset"><h3>{editingAddress ? 'Edit Address' : 'Add Address'}</h3><button className="modal-close-cusset" onClick={() => setShowAddressModal(false)}>×</button></div>
              <form onSubmit={handleAddressSubmit}>
                <div className="modal-form-cusset">
                  <div className="form-row-cusset">
                    <div className="form-group-cusset"><label>Label</label><select name="label" value={addressForm.label} onChange={handleAddressFormChange}><option value="Home">Home</option><option value="Office">Office</option></select></div>
                    <div className="form-group-cusset checkbox-group-cusset"><label className="checkbox-label-cusset"><input type="checkbox" name="isPrimary" checked={addressForm.isPrimary} onChange={handleAddressFormChange} /><span>Set as primary</span></label></div>
                  </div>
                  <div className="form-group-cusset"><label>House/Building</label><input type="text" name="houseOrBuilding" value={addressForm.houseOrBuilding} onChange={handleAddressFormChange} className={formErrors.houseOrBuilding ? 'error-cusset' : ''} />{formErrors.houseOrBuilding && <small className="error-text-cusset">{formErrors.houseOrBuilding}</small>}</div>
                  <div className="form-group-cusset"><label>Street</label><input type="text" name="street" value={addressForm.street} onChange={handleAddressFormChange} className={formErrors.street ? 'error-cusset' : ''} />{formErrors.street && <small className="error-text-cusset">{formErrors.street}</small>}</div>
                  <div className="form-row-cusset">
                    <div className="form-group-cusset"><label>Barangay</label><input type="text" name="barangay" value={addressForm.barangay} onChange={handleAddressFormChange} className={formErrors.barangay ? 'error-cusset' : ''} />{formErrors.barangay && <small className="error-text-cusset">{formErrors.barangay}</small>}</div>
                    <div className="form-group-cusset"><label>City</label><input type="text" name="cityMunicipality" value={addressForm.cityMunicipality} onChange={handleAddressFormChange} className={formErrors.cityMunicipality ? 'error-cusset' : ''} />{formErrors.cityMunicipality && <small className="error-text-cusset">{formErrors.cityMunicipality}</small>}</div>
                  </div>
                  <div className="form-row-cusset">
                    <div className="form-group-cusset"><label>Province</label><input type="text" name="province" value={addressForm.province} onChange={handleAddressFormChange} className={formErrors.province ? 'error-cusset' : ''} />{formErrors.province && <small className="error-text-cusset">{formErrors.province}</small>}</div>
                    <div className="form-group-cusset"><label>ZIP Code</label><input type="text" name="zipCode" value={addressForm.zipCode} onChange={handleAddressFormChange} maxLength="4" className={formErrors.zipCode ? 'error-cusset' : ''} />{formErrors.zipCode && <small className="error-text-cusset">{formErrors.zipCode}</small>}</div>
                  </div>
                </div>
                <div className="modal-actions-cusset"><button type="button" className="cancel-btn-cusset" onClick={() => setShowAddressModal(false)}>Cancel</button><button type="submit" className="save-btn-cusset" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button></div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {deleteConfirm && (
          <div className="modal-overlay-cusset" onClick={() => setDeleteConfirm(null)}>
            <div className="modal-content-cusset confirm-modal-cusset" onClick={e => e.stopPropagation()}>
              <div className="modal-header-cusset"><h3>Delete Address</h3><button className="modal-close-cusset" onClick={() => setDeleteConfirm(null)}>×</button></div>
              <p>Are you sure you want to delete this address?</p>
              <div className="address-preview-cusset">{getFullAddress(deleteConfirm)}</div>
              <div className="modal-actions-cusset"><button className="cancel-btn-cusset" onClick={() => setDeleteConfirm(null)}>Cancel</button><button className="delete-btn-cusset" onClick={() => deleteAddress(deleteConfirm._id)}>Delete</button></div>
            </div>
          </div>
        )}

        <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      </div>
    </>
  );
};

export default CustomerSettings;