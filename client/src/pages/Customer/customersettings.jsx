// pages/Customer/CustomerSettings.jsx - Single page with sections, no internal tabs
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import {
  FaUserCircle,
  FaMapMarkerAlt,
  FaBuilding,
  FaPhone,
  FaEnvelope,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaEdit,
  FaPlus,
  FaTrash,
  FaHome,
  FaBriefcase,
  FaUser,
  FaSave,
  FaTimes,
  FaStar,
  FaArrowLeft,
  FaCog
} from 'react-icons/fa';
import '../../styles/Customer/customersettings.css';

const CustomerSettings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast, showToast, hideToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Get current tab from URL
  const currentTab = new URLSearchParams(location.search).get('tab') || 'profile';

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

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

  const [addresses, setAddresses] = useState([]);
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
  const [memberSince, setMemberSince] = useState(null);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchUserData(), fetchAddresses()]);
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
      setMemberSince(client.createdAt);
      setIsVerified(client.isVerified || false);
    } catch (err) {
      console.error('Error fetching user data:', err);
      showToast('Failed to load profile data', 'error');
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
      showToast('Profile updated successfully', 'success');
    } catch (err) {
      showToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setAddressForm({ 
      houseOrBuilding: '', street: '', barangay: '', 
      cityMunicipality: '', province: '', zipCode: '', 
      label: 'Home', isPrimary: addresses.length === 0 
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
        await axios.put(`${import.meta.env.VITE_API_URL}/api/clients/me/addresses/${editingAddress._id}`, addressForm, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        showToast('Address updated successfully', 'success');
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/clients/me/addresses`, addressForm, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        showToast('Address added successfully', 'success');
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
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/clients/me/addresses/${addressId}/primary`, {}, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      showToast('Primary address updated', 'success');
      fetchAddresses();
    } catch (err) {
      showToast('Failed to update primary address', 'error');
    }
  };

  const deleteAddress = async (addressId) => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/clients/me/addresses/${addressId}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      showToast('Address deleted', 'success');
      fetchAddresses();
      setDeleteConfirm(null);
    } catch (err) {
      showToast('Failed to delete address', 'error');
    }
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

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getFullName = () => {
    return [profileData.firstName, profileData.middleName, profileData.lastName]
      .filter(n => n && n.trim())
      .join(' ');
  };

  const SkeletonLoader = () => (
    <div className="cuset-page">
      <div className="cuset-header">
        <div className="skeleton-line large"></div>
        <div className="skeleton-line medium"></div>
      </div>
      <div className="cuset-single-col">
        <div className="cuset-card skeleton-card">
          <div className="skeleton-line large"></div>
          <div className="skeleton-input"></div>
          <div className="skeleton-input"></div>
          <div className="skeleton-input"></div>
        </div>
      </div>
    </div>
  );

  // Render based on current tab from URL
  const renderContent = () => {
    // Profile Tab
    if (currentTab === 'profile') {
      return (
        <div className="cuset-profile-page">
          {/* Profile Card - Summary */}
          <div className="cuset-profile-summary">
            <div className="profile-avatar-large">
              <FaUserCircle />
            </div>
            <div className="profile-info">
              <h2>{getFullName() || 'No Name Set'}</h2>
              <p className="profile-email-text">{profileData.email}</p>
              <div className="profile-meta">
                <span className="meta-item">
                  <FaBriefcase /> {profileData.client_type || 'Individual'}
                </span>
                {memberSince && (
                  <span className="meta-item">
                    <FaCalendarAlt /> Member since {formatDate(memberSince)}
                  </span>
                )}
              </div>
              <div className="profile-status">
                <span className={`status-badge ${isVerified ? 'verified' : 'pending'}`}>
                  {isVerified ? <FaCheckCircle /> : <FaClock />}
                  {isVerified ? 'Verified Account' : 'Pending Verification'}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="cuset-form-card">
            <div className="card-header">
              <h3><FaUser /> Personal Information</h3>
              <button className="save-btn" onClick={saveProfile} disabled={saving}>
                <FaSave /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
            
            <div className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input 
                    type="text" 
                    name="firstName" 
                    value={profileData.firstName} 
                    onChange={handleProfileChange} 
                    placeholder="Enter first name"
                  />
                </div>
                <div className="form-group">
                  <label>Middle Name</label>
                  <input 
                    type="text" 
                    name="middleName" 
                    value={profileData.middleName} 
                    onChange={handleProfileChange} 
                    placeholder="Enter middle name"
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input 
                    type="text" 
                    name="lastName" 
                    value={profileData.lastName} 
                    onChange={handleProfileChange} 
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label><FaEnvelope /> Email</label>
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
                    placeholder="Enter contact number"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label><FaBuilding /> Company (Optional)</label>
                  <input 
                    type="text" 
                    name="companyName" 
                    value={profileData.companyName} 
                    onChange={handleProfileChange} 
                    placeholder="Enter company name"
                    disabled={profileData.client_type === 'Individual'}
                  />
                  {profileData.client_type === 'Individual' && (
                    <small>Company field is disabled for Individual accounts</small>
                  )}
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
            </div>
          </div>
        </div>
      );
    }

    // Addresses Tab
    if (currentTab === 'addresses') {
      return (
        <div className="cuset-addresses-page">
          <div className="cuset-addresses-card">
            <div className="card-header">
              <h3><FaMapMarkerAlt /> My Addresses</h3>
              <button className="add-btn" onClick={handleAddAddress}>
                <FaPlus /> Add Address
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="empty-state">
                <FaMapMarkerAlt className="empty-icon" />
                <h4>No addresses yet</h4>
                <p>Add your first address to get started</p>
                <button className="add-first-btn" onClick={handleAddAddress}>
                  <FaPlus /> Add Address
                </button>
              </div>
            ) : (
              <div className="addresses-grid">
                {addresses.map(address => (
                  <div 
                    key={address._id} 
                    className={`address-card-item ${address.isPrimary ? 'primary' : ''}`}
                  >
                    {address.isPrimary && (
                      <div className="primary-badge">
                        <FaStar /> Primary
                      </div>
                    )}
                    <div className="address-label">
                      <span className="label-badge">{address.label}</span>
                    </div>
                    <div className="address-details">
                      <p>{address.houseOrBuilding}</p>
                      <p>{address.street}</p>
                      <p>{address.barangay}</p>
                      <p>{address.cityMunicipality}</p>
                      <p>{address.province}</p>
                      <p>{address.zipCode}</p>
                    </div>
                    <div className="address-actions">
                      {!address.isPrimary && (
                        <button 
                          className="action-btn primary-btn" 
                          onClick={() => setAsPrimary(address._id)}
                        >
                          Set Primary
                        </button>
                      )}
                      <button 
                        className="action-btn edit-btn" 
                        onClick={() => handleEditAddress(address)}
                      >
                        <FaEdit /> Edit
                      </button>
                      <button 
                        className="action-btn delete-btn" 
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
        </div>
      );
    }

    // Default fallback
    return (
      <div className="cuset-empty">
        <FaCog className="empty-icon" />
        <h3>Section not found</h3>
        <p>Please select a valid settings option from the sidebar.</p>
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <Helmet><title>Settings | Salfer Engineering</title></Helmet>
        <SkeletonLoader />
      </>
    );
  }

  return (
    <>
      <Helmet><title>Settings | Salfer Engineering</title></Helmet>
      
      <div className="cuset-page">
        {/* Header */}
        <div className="cuset-header">
          <div className="cuset-header-content">
            <h1>Account Settings</h1>
            <p>
              {currentTab === 'profile' && 'Manage your personal information and profile details'}
              {currentTab === 'addresses' && 'Manage your saved addresses'}
            </p>
          </div>
        </div>

        {/* Content based on tab */}
        {renderContent()}

        {/* Address Modal */}
        {showAddressModal && (
          <div className="modal-overlay" onClick={() => setShowAddressModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingAddress ? 'Edit Address' : 'Add Address'}</h3>
                <button className="modal-close" onClick={() => setShowAddressModal(false)}>
                  <FaTimes />
                </button>
              </div>
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
                        <span>Set as primary</span>
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>House / Building</label>
                    <input 
                      type="text" 
                      name="houseOrBuilding" 
                      value={addressForm.houseOrBuilding} 
                      onChange={handleAddressFormChange} 
                      className={formErrors.houseOrBuilding ? 'error' : ''} 
                      placeholder="Enter house number or building name"
                    />
                    {formErrors.houseOrBuilding && (
                      <small className="error-text">{formErrors.houseOrBuilding}</small>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Street</label>
                    <input 
                      type="text" 
                      name="street" 
                      value={addressForm.street} 
                      onChange={handleAddressFormChange} 
                      className={formErrors.street ? 'error' : ''} 
                      placeholder="Enter street name"
                    />
                    {formErrors.street && (
                      <small className="error-text">{formErrors.street}</small>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Barangay</label>
                      <input 
                        type="text" 
                        name="barangay" 
                        value={addressForm.barangay} 
                        onChange={handleAddressFormChange} 
                        className={formErrors.barangay ? 'error' : ''} 
                        placeholder="Enter barangay"
                      />
                      {formErrors.barangay && (
                        <small className="error-text">{formErrors.barangay}</small>
                      )}
                    </div>
                    <div className="form-group">
                      <label>City / Municipality</label>
                      <input 
                        type="text" 
                        name="cityMunicipality" 
                        value={addressForm.cityMunicipality} 
                        onChange={handleAddressFormChange} 
                        className={formErrors.cityMunicipality ? 'error' : ''} 
                        placeholder="Enter city"
                      />
                      {formErrors.cityMunicipality && (
                        <small className="error-text">{formErrors.cityMunicipality}</small>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Province</label>
                      <input 
                        type="text" 
                        name="province" 
                        value={addressForm.province} 
                        onChange={handleAddressFormChange} 
                        className={formErrors.province ? 'error' : ''} 
                        placeholder="Enter province"
                      />
                      {formErrors.province && (
                        <small className="error-text">{formErrors.province}</small>
                      )}
                    </div>
                    <div className="form-group">
                      <label>ZIP Code</label>
                      <input 
                        type="text" 
                        name="zipCode" 
                        value={addressForm.zipCode} 
                        onChange={handleAddressFormChange} 
                        maxLength="4" 
                        className={formErrors.zipCode ? 'error' : ''} 
                        placeholder="Enter ZIP code"
                      />
                      {formErrors.zipCode && (
                        <small className="error-text">{formErrors.zipCode}</small>
                      )}
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                  <button 
                    type="button" 
                    className="cancel-btn" 
                    onClick={() => setShowAddressModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="save-btn" 
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Address'}
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
              <div className="modal-header">
                <h3>Delete Address</h3>
                <button className="modal-close" onClick={() => setDeleteConfirm(null)}>
                  <FaTimes />
                </button>
              </div>
              <div className="confirm-body">
                <p>Are you sure you want to delete this address?</p>
                <div className="address-preview">
                  {getFullAddress(deleteConfirm)}
                </div>
                <div className="confirm-actions">
                  <button 
                    className="cancel-btn" 
                    onClick={() => setDeleteConfirm(null)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="delete-btn" 
                    onClick={() => deleteAddress(deleteConfirm._id)}
                  >
                    <FaTrash /> Delete Address
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      </div>
    </>
  );
};

export default CustomerSettings;