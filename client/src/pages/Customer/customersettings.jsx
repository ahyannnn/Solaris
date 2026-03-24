// pages/Customer/CustomerSettings.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
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
  const [tabLoading, setTabLoading] = useState(false);
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
      'weak': 'Weak',
      'medium': 'Medium',
      'strong': 'Strong',
      'very-strong': 'Very Strong'
    };
    return labels[strength];
  };

  // Fetch data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Listen for URL tab changes
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
    // Simulate loading for tab switch
    setTimeout(() => {
      setTabLoading(false);
    }, 500);
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchUserData(),
        fetchAddresses(),
        fetchPreferences(),
        fetchBillingHistory()
      ]);
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
    if (!addressForm.houseOrBuilding.trim()) errors.houseOrBuilding = 'Required';
    if (!addressForm.street.trim()) errors.street = 'Required';
    if (!addressForm.barangay.trim()) errors.barangay = 'Required';
    if (!addressForm.cityMunicipality.trim()) errors.cityMunicipality = 'Required';
    if (!addressForm.province.trim()) errors.province = 'Required';
    if (!addressForm.zipCode.trim()) errors.zipCode = 'Required';
    if (addressForm.zipCode && !/^\d{4}$/.test(addressForm.zipCode)) {
      errors.zipCode = 'Must be 4 digits';
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
        setSuccess('Address updated');
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/clients/me/addresses`,
          addressForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSuccess('Address added');
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
      setSuccess('Address deleted');
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
    if (!passwordData.currentPassword) errors.currentPassword = 'Required';
    if (!passwordData.newPassword) errors.newPassword = 'Required';
    if (passwordData.newPassword.length < 8) errors.newPassword = 'Minimum 8 characters';
    
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
      setSuccess('Password changed');
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
    setSuccess('Preferences saved');
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
      document.body.classList.add('dark-mode-cusset');
    } else {
      document.body.classList.remove('dark-mode-cusset');
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

  // Skeleton Components
  const ProfileSkeleton = () => (
    <div className="profile-section-cusset">
      <div className="skeleton-line-cusset large-cusset"></div>
      <div className="profile-form-cusset">
        <div className="form-row-cusset">
          <div className="form-group-cusset"><div className="skeleton-input-cusset"></div></div>
          <div className="form-group-cusset"><div className="skeleton-input-cusset"></div></div>
          <div className="form-group-cusset"><div className="skeleton-input-cusset"></div></div>
        </div>
        <div className="form-row-cusset">
          <div className="form-group-cusset"><div className="skeleton-input-cusset"></div></div>
          <div className="form-group-cusset"><div className="skeleton-input-cusset"></div></div>
        </div>
        <div className="form-row-cusset">
          <div className="form-group-cusset"><div className="skeleton-input-cusset"></div></div>
          <div className="form-group-cusset"><div className="skeleton-input-cusset"></div></div>
        </div>
        <div className="skeleton-button-cusset"></div>
      </div>
    </div>
  );

  const AddressesSkeleton = () => (
    <div className="addresses-section-cusset">
      <div className="section-header-cusset">
        <div className="skeleton-line-cusset medium-cusset"></div>
        <div className="skeleton-button-cusset small-cusset"></div>
      </div>
      <div className="addresses-grid-cusset">
        {[1, 2, 3].map((item) => (
          <div key={item} className="address-card-cusset skeleton-card-cusset">
            <div className="skeleton-badge-cusset"></div>
            <div className="skeleton-line-cusset small-cusset"></div>
            <div className="skeleton-line-cusset tiny-cusset"></div>
            <div className="skeleton-line-cusset tiny-cusset"></div>
            <div className="skeleton-line-cusset tiny-cusset"></div>
            <div className="address-actions-cusset">
              <div className="skeleton-button-cusset tiny-cusset"></div>
              <div className="skeleton-button-cusset tiny-cusset"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const NotificationsSkeleton = () => (
    <div className="notifications-section-cusset">
      <div className="skeleton-line-cusset large-cusset"></div>
      <div className="preferences-group-cusset">
        <div className="skeleton-line-cusset medium-cusset"></div>
        <div className="checkbox-list-cusset">
          <div className="skeleton-checkbox-cusset"></div>
          <div className="skeleton-checkbox-cusset"></div>
        </div>
      </div>
      <div className="preferences-group-cusset">
        <div className="skeleton-line-cusset medium-cusset"></div>
        <div className="checkbox-list-cusset">
          <div className="skeleton-checkbox-cusset"></div>
          <div className="skeleton-checkbox-cusset"></div>
          <div className="skeleton-checkbox-cusset"></div>
          <div className="skeleton-checkbox-cusset"></div>
          <div className="skeleton-checkbox-cusset"></div>
        </div>
      </div>
      <div className="skeleton-button-cusset"></div>
    </div>
  );

  const SecuritySkeleton = () => (
    <div className="security-section-cusset">
      <div className="skeleton-line-cusset large-cusset"></div>
      <div className="security-group-cusset">
        <div className="group-header-cusset">
          <div className="skeleton-line-cusset medium-cusset"></div>
          <div className="skeleton-button-cusset small-cusset"></div>
        </div>
      </div>
      <div className="security-group-cusset">
        <div className="skeleton-line-cusset medium-cusset"></div>
        <div className="skeleton-line-cusset small-cusset"></div>
      </div>
    </div>
  );

  const PreferencesSkeleton = () => (
    <div className="preferences-section-cusset">
      <div className="skeleton-line-cusset large-cusset"></div>
      <div className="preferences-grid-cusset">
        {[1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="preference-group-cusset">
            <div className="skeleton-line-cusset small-cusset"></div>
            <div className="skeleton-input-cusset"></div>
          </div>
        ))}
      </div>
      <div className="skeleton-button-cusset"></div>
    </div>
  );

  const BillingSkeleton = () => (
    <div className="billing-section-cusset">
      <div className="skeleton-line-cusset large-cusset"></div>
      <div className="billing-table-cusset">
        <div className="skeleton-table-cusset">
          <div className="skeleton-table-header-cusset">
            <div className="skeleton-line-cusset small-cusset"></div>
            <div className="skeleton-line-cusset small-cusset"></div>
            <div className="skeleton-line-cusset small-cusset"></div>
            <div className="skeleton-line-cusset small-cusset"></div>
            <div className="skeleton-line-cusset small-cusset"></div>
          </div>
          {[1, 2, 3].map((item) => (
            <div key={item} className="skeleton-table-row-cusset">
              <div className="skeleton-line-cusset tiny-cusset"></div>
              <div className="skeleton-line-cusset tiny-cusset"></div>
              <div className="skeleton-line-cusset tiny-cusset"></div>
              <div className="skeleton-line-cusset tiny-cusset"></div>
              <div className="skeleton-badge-cusset small-cusset"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    if (tabLoading) {
      switch (activeTab) {
        case 'profile':
          return <ProfileSkeleton />;
        case 'addresses':
          return <AddressesSkeleton />;
        case 'notifications':
          return <NotificationsSkeleton />;
        case 'security':
          return <SecuritySkeleton />;
        case 'preferences':
          return <PreferencesSkeleton />;
        case 'billing':
          return <BillingSkeleton />;
        default:
          return <ProfileSkeleton />;
      }
    }

    switch (activeTab) {
      case 'profile':
        return (
          <div className="profile-section-cusset">
            <h2>Personal Information</h2>
            
            <div className="profile-form-cusset">
              <div className="form-row-cusset">
                <div className="form-group-cusset">
                  <label>First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleProfileChange}
                    placeholder="First name"
                  />
                </div>

                <div className="form-group-cusset">
                  <label>Middle Name</label>
                  <input
                    type="text"
                    name="middleName"
                    value={profileData.middleName}
                    onChange={handleProfileChange}
                    placeholder="Middle name"
                  />
                </div>

                <div className="form-group-cusset">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleProfileChange}
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="form-row-cusset">
                <div className="form-group-cusset">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="readonly-cusset"
                  />
                  <small>Email cannot be changed</small>
                </div>

                <div className="form-group-cusset">
                  <label>Contact Number</label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={profileData.contactNumber}
                    onChange={handleProfileChange}
                    placeholder="09XXXXXXXXX"
                  />
                </div>
              </div>

              <div className="form-row-cusset">
                <div className="form-group-cusset">
                  <label>Company Name</label>
                  <input
                    type="text"
                    name="companyName"
                    value={profileData.companyName}
                    onChange={handleProfileChange}
                    placeholder="Company name"
                    disabled={profileData.client_type === 'Individual'}
                  />
                </div>

                <div className="form-group-cusset">
                  <label>Birthday</label>
                  <input
                    type="date"
                    name="birthday"
                    value={profileData.birthday}
                    onChange={handleProfileChange}
                  />
                </div>
              </div>

              <div className="form-actions-cusset">
                <button
                  className="save-btn-cusset"
                  onClick={saveProfile}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        );

      case 'addresses':
        return (
          <div className="addresses-section-cusset">
            <div className="section-header-cusset">
              <h2>My Addresses</h2>
              <button className="add-btn-cusset" onClick={handleAddAddress}>
                Add New Address
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="empty-state-cusset">
                <h3>No addresses yet</h3>
                <p>Add your first address to get started</p>
                <button className="add-first-btn-cusset" onClick={handleAddAddress}>
                  Add Address
                </button>
              </div>
            ) : (
              <div className="addresses-grid-cusset">
                {addresses.map(address => (
                  <div key={address._id} className={`address-card-cusset ${address.isPrimary ? 'primary-cusset' : ''}`}>
                    {address.isPrimary && (
                      <div className="primary-badge-cusset">
                        Primary
                      </div>
                    )}
                    
                    <div className="address-label-cusset">
                      <span className="label-badge-cusset">{address.label}</span>
                    </div>

                    <div className="address-details-cusset">
                      <p>{address.houseOrBuilding}</p>
                      <p>{address.street}</p>
                      <p>{address.barangay}</p>
                      <p>{address.cityMunicipality}</p>
                      <p>{address.province}</p>
                      <p>{address.zipCode}</p>
                    </div>

                    <div className="address-actions-cusset">
                      {!address.isPrimary && (
                        <button
                          className="action-btn-cusset primary-cusset"
                          onClick={() => setAsPrimary(address._id)}
                        >
                          Set Primary
                        </button>
                      )}
                      <button
                        className="action-btn-cusset edit-cusset"
                        onClick={() => handleEditAddress(address)}
                      >
                        Edit
                      </button>
                      <button
                        className="action-btn-cusset delete-cusset"
                        onClick={() => setDeleteConfirm(address)}
                      >
                        Delete
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
          <div className="notifications-section-cusset">
            <h2>Notification Preferences</h2>
            
            <div className="preferences-group-cusset">
              <h3>Communication Channels</h3>
              <div className="checkbox-list-cusset">
                <label className="checkbox-label-cusset">
                  <input
                    type="checkbox"
                    name="emailNotifications"
                    checked={notificationPrefs.emailNotifications}
                    onChange={handleNotificationChange}
                  />
                  <span>Email Notifications</span>
                </label>
                <label className="checkbox-label-cusset">
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

            <div className="preferences-group-cusset">
              <h3>Notification Types</h3>
              <div className="checkbox-list-cusset">
                <label className="checkbox-label-cusset">
                  <input
                    type="checkbox"
                    name="bookingUpdates"
                    checked={notificationPrefs.bookingUpdates}
                    onChange={handleNotificationChange}
                  />
                  <span>Booking Updates</span>
                </label>
                <label className="checkbox-label-cusset">
                  <input
                    type="checkbox"
                    name="paymentConfirmations"
                    checked={notificationPrefs.paymentConfirmations}
                    onChange={handleNotificationChange}
                  />
                  <span>Payment Confirmations</span>
                </label>
                <label className="checkbox-label-cusset">
                  <input
                    type="checkbox"
                    name="assessmentReminders"
                    checked={notificationPrefs.assessmentReminders}
                    onChange={handleNotificationChange}
                  />
                  <span>Assessment Reminders</span>
                </label>
                <label className="checkbox-label-cusset">
                  <input
                    type="checkbox"
                    name="systemAlerts"
                    checked={notificationPrefs.systemAlerts}
                    onChange={handleNotificationChange}
                  />
                  <span>System Alerts</span>
                </label>
                <label className="checkbox-label-cusset">
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

            <div className="form-actions-cusset">
              <button className="save-btn-cusset" onClick={saveNotificationPrefs}>
                Save Preferences
              </button>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="security-section-cusset">
            <h2>Security Settings</h2>

            <div className="security-group-cusset">
              <div className="group-header-cusset">
                <h3>Password</h3>
                {!showPasswordForm && (
                  <button
                    className="change-btn-cusset"
                    onClick={() => setShowPasswordForm(true)}
                  >
                    Change Password
                  </button>
                )}
              </div>

              {showPasswordForm && (
                <form onSubmit={handlePasswordChange} className="password-form-cusset">
                  <div className="form-group-cusset">
                    <label>Current Password</label>
                    <div className="password-input-wrapper-cusset">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className={passwordErrors.currentPassword ? 'error-cusset' : ''}
                        placeholder="Current password"
                      />
                      <button
                        type="button"
                        className="password-toggle-btn-cusset"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    {passwordErrors.currentPassword && (
                      <small className="error-text-cusset">{passwordErrors.currentPassword}</small>
                    )}
                  </div>

                  <div className="form-group-cusset">
                    <label>New Password</label>
                    <div className="password-input-wrapper-cusset">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className={passwordErrors.newPassword ? 'error-cusset' : ''}
                        placeholder="New password"
                      />
                      <button
                        type="button"
                        className="password-toggle-btn-cusset"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    {passwordErrors.newPassword && (
                      <small className="error-text-cusset">{passwordErrors.newPassword}</small>
                    )}
                  </div>

                  <div className="form-group-cusset">
                    <label>Confirm New Password</label>
                    <div className="password-input-wrapper-cusset">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className={passwordErrors.confirmPassword ? 'error-cusset' : ''}
                        placeholder="Confirm password"
                      />
                      <button
                        type="button"
                        className="password-toggle-btn-cusset"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    {passwordErrors.confirmPassword && (
                      <small className="error-text-cusset">{passwordErrors.confirmPassword}</small>
                    )}
                  </div>

                  {passwordData.newPassword && (
                    <div className="password-strength-cusset">
                      <div className="strength-meter-cusset">
                        <div 
                          className={`strength-bar-cusset ${getPasswordStrength(passwordData.newPassword)}-cusset`} 
                          style={{ width: `${getPasswordStrengthPercent(passwordData.newPassword)}%` }}
                        ></div>
                      </div>
                      <small className="strength-text-cusset">
                        Strength: {getPasswordStrengthLabel(passwordData.newPassword)}
                      </small>
                    </div>
                  )}

                  <div className="form-actions-cusset">
                    <button
                      type="button"
                      className="cancel-btn-cusset"
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
                      className="save-btn-cusset"
                      disabled={saving}
                    >
                      {saving ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="security-group-cusset">
              <h3>Session Settings</h3>
              <div className="info-message-cusset">
                <p>Your session will timeout after 30 minutes of inactivity.</p>
              </div>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="preferences-section-cusset">
            <h2>Account Preferences</h2>

            <div className="preferences-grid-cusset">
              <div className="preference-group-cusset">
                <label>Language</label>
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

              <div className="preference-group-cusset">
                <label>Theme</label>
                <div className="theme-selector-cusset">
                  <label className={`theme-option-cusset ${preferences.theme === 'light' ? 'active-cusset' : ''}`}>
                    <input
                      type="radio"
                      name="theme"
                      value="light"
                      checked={preferences.theme === 'light'}
                      onChange={handlePreferenceChange}
                    />
                    Light
                  </label>
                  <label className={`theme-option-cusset ${preferences.theme === 'dark' ? 'active-cusset' : ''}`}>
                    <input
                      type="radio"
                      name="theme"
                      value="dark"
                      checked={preferences.theme === 'dark'}
                      onChange={handlePreferenceChange}
                    />
                    Dark
                  </label>
                </div>
              </div>

              <div className="preference-group-cusset">
                <label>Timezone</label>
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

              <div className="preference-group-cusset">
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

              <div className="preference-group-cusset">
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

            <div className="form-actions-cusset">
              <button className="save-btn-cusset" onClick={savePreferences}>
                Save Preferences
              </button>
            </div>
          </div>
        );

      case 'billing':
        return (
          <div className="billing-section-cusset">
            <h2>Billing History</h2>
            
            {billingHistory.length === 0 ? (
              <div className="empty-state-cusset">
                <h3>No billing history</h3>
                <p>Your transactions will appear here</p>
              </div>
            ) : (
              <div className="billing-table-cusset">
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
                          <span className={`status-badge-cusset ${invoice.status}-cusset`}>
                            {invoice.status === 'paid' ? 'Paid' : 'Pending'}
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

  // Initial Loading Skeleton
  const InitialLoadingSkeleton = () => (
    <div className="customer-settings-cusset">
      <div className="settings-header-cusset">
        <div className="skeleton-line-cusset large-cusset"></div>
      </div>
      <div className="tab-content-cusset">
        <ProfileSkeleton />
      </div>
    </div>
  );

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Settings | Salfer Engineering</title>
        </Helmet>
        <InitialLoadingSkeleton />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Settings | Salfer Engineering</title>
      </Helmet>

      <div className="customer-settings-cusset">
        {/* Header */}
        <div className="settings-header-cusset">
          <h1>Account Settings</h1>
        </div>

        {/* Messages */}
        {success && (
          <div className="settings-success-cusset">
            <span>{success}</span>
          </div>
        )}
        
        {error && (
          <div className="settings-error-cusset">
            <span>{error}</span>
          </div>
        )}

        {/* Tab Content - No tab bar */}
        <div className="tab-content-cusset">
          {renderTabContent()}
        </div>

        {/* Address Modal */}
        {showAddressModal && (
          <div className="modal-overlay-cusset" onClick={() => setShowAddressModal(false)}>
            <div className="modal-content-cusset" onClick={e => e.stopPropagation()}>
              <h3>{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
              
              <form onSubmit={handleAddressSubmit}>
                <div className="modal-form-cusset">
                  <div className="form-row-cusset">
                    <div className="form-group-cusset">
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

                    <div className="form-group-cusset checkbox-group-cusset">
                      <label className="checkbox-label-cusset">
                        <input
                          type="checkbox"
                          name="isPrimary"
                          checked={addressForm.isPrimary}
                          onChange={handleAddressFormChange}
                        />
                        <span>Set as primary</span>
                      </label>
                    </div>
                  </div>

                  <div className="form-row-cusset">
                    <div className="form-group-cusset">
                      <label>House/Building No.</label>
                      <input
                        type="text"
                        name="houseOrBuilding"
                        value={addressForm.houseOrBuilding}
                        onChange={handleAddressFormChange}
                        className={formErrors.houseOrBuilding ? 'error-cusset' : ''}
                      />
                      {formErrors.houseOrBuilding && <small className="error-text-cusset">{formErrors.houseOrBuilding}</small>}
                    </div>

                    <div className="form-group-cusset">
                      <label>Street</label>
                      <input
                        type="text"
                        name="street"
                        value={addressForm.street}
                        onChange={handleAddressFormChange}
                        className={formErrors.street ? 'error-cusset' : ''}
                      />
                      {formErrors.street && <small className="error-text-cusset">{formErrors.street}</small>}
                    </div>
                  </div>

                  <div className="form-row-cusset">
                    <div className="form-group-cusset">
                      <label>Barangay</label>
                      <input
                        type="text"
                        name="barangay"
                        value={addressForm.barangay}
                        onChange={handleAddressFormChange}
                        className={formErrors.barangay ? 'error-cusset' : ''}
                      />
                      {formErrors.barangay && <small className="error-text-cusset">{formErrors.barangay}</small>}
                    </div>

                    <div className="form-group-cusset">
                      <label>City/Municipality</label>
                      <input
                        type="text"
                        name="cityMunicipality"
                        value={addressForm.cityMunicipality}
                        onChange={handleAddressFormChange}
                        className={formErrors.cityMunicipality ? 'error-cusset' : ''}
                      />
                      {formErrors.cityMunicipality && <small className="error-text-cusset">{formErrors.cityMunicipality}</small>}
                    </div>
                  </div>

                  <div className="form-row-cusset">
                    <div className="form-group-cusset">
                      <label>Province</label>
                      <input
                        type="text"
                        name="province"
                        value={addressForm.province}
                        onChange={handleAddressFormChange}
                        className={formErrors.province ? 'error-cusset' : ''}
                      />
                      {formErrors.province && <small className="error-text-cusset">{formErrors.province}</small>}
                    </div>

                    <div className="form-group-cusset">
                      <label>ZIP Code</label>
                      <input
                        type="text"
                        name="zipCode"
                        value={addressForm.zipCode}
                        onChange={handleAddressFormChange}
                        className={formErrors.zipCode ? 'error-cusset' : ''}
                        maxLength="4"
                      />
                      {formErrors.zipCode && <small className="error-text-cusset">{formErrors.zipCode}</small>}
                    </div>
                  </div>
                </div>

                <div className="modal-actions-cusset">
                  <button type="button" className="cancel-btn-cusset" onClick={() => setShowAddressModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="save-btn-cusset" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Address'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="modal-overlay-cusset" onClick={() => setDeleteConfirm(null)}>
            <div className="modal-content-cusset confirm-modal-cusset" onClick={e => e.stopPropagation()}>
              <h3>Delete Address</h3>
              <p>Are you sure you want to delete this address?</p>
              <div className="address-preview-cusset">
                {getFullAddress(deleteConfirm)}
              </div>
              <div className="modal-actions-cusset">
                <button className="cancel-btn-cusset" onClick={() => setDeleteConfirm(null)}>
                  Cancel
                </button>
                <button className="delete-btn-cusset" onClick={() => deleteAddress(deleteConfirm._id)}>
                  Delete
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