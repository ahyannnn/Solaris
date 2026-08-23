// pages/Customer/CustomerSettings.jsx - Redesigned with PSGC Cloud API

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
  FaCog,
  FaGlobe,
  FaCity,
  FaRoad,
  FaUserEdit,
  FaAddressCard,
  FaInfoCircle
} from 'react-icons/fa';
import '../../styles/Customer/customersettings.css';

const CustomerSettings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast, showToast, hideToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const currentTab = new URLSearchParams(location.search).get('tab') || 'profile';

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // PSGC Cloud API States
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [citiesMunicipalities, setCitiesMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingBarangays, setLoadingBarangays] = useState(false);

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

  const [originalProfileData, setOriginalProfileData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    contactNumber: ''
  });

  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState({
    houseOrBuilding: '',
    street: '',
    region: '',
    province: '',
    cityMunicipality: '',
    barangay: '',
    zipCode: '',
    label: 'Home',
    isPrimary: false
  });

  const [formErrors, setFormErrors] = useState({});
  const [profileErrors, setProfileErrors] = useState({});
  const [memberSince, setMemberSince] = useState(null);
  const [isVerified, setIsVerified] = useState(false);

  // ========== PSGC CLOUD API FUNCTIONS ==========

  const PSGC_API_BASE = 'https://psgc.gitlab.io/api/';

  useEffect(() => {
    const fetchRegions = async () => {
      setLoadingRegions(true);
      try {
        const response = await fetch(`${PSGC_API_BASE}/regions`, {
          headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) throw new Error('Failed to fetch regions');
        const data = await response.json();
        setRegions(data || []);
      } catch (error) {
        console.error('Error fetching regions:', error);
        showToast('Failed to load regions. Please refresh the page.', 'error');
      } finally {
        setLoadingRegions(false);
      }
    };
    fetchRegions();
  }, []);

  useEffect(() => {
    const fetchProvinces = async () => {
      if (!addressForm.region) {
        setProvinces([]);
        setCitiesMunicipalities([]);
        setBarangays([]);
        setAddressForm(prev => ({ ...prev, province: '', cityMunicipality: '', barangay: '' }));
        return;
      }
      const selectedRegion = regions.find(r => r.name === addressForm.region);
      if (!selectedRegion) { setProvinces([]); return; }
      setLoadingProvinces(true);
      try {
        const response = await fetch(`${PSGC_API_BASE}/regions/${selectedRegion.code}/provinces`, {
          headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) throw new Error('Failed to fetch provinces');
        const data = await response.json();
        setProvinces(data || []);
        setCitiesMunicipalities([]);
        setBarangays([]);
        setAddressForm(prev => ({ ...prev, province: '', cityMunicipality: '', barangay: '' }));
      } catch (error) {
        console.error('Error fetching provinces:', error);
        showToast('Failed to load provinces. Please try again.', 'error');
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, [addressForm.region, regions]);

  useEffect(() => {
    const fetchCitiesMunicipalities = async () => {
      if (!addressForm.province) {
        setCitiesMunicipalities([]);
        setBarangays([]);
        setAddressForm(prev => ({ ...prev, cityMunicipality: '', barangay: '' }));
        return;
      }
      const selectedProvince = provinces.find(p => p.name === addressForm.province);
      if (!selectedProvince) { setCitiesMunicipalities([]); return; }
      setLoadingCities(true);
      try {
        const response = await fetch(`${PSGC_API_BASE}/provinces/${selectedProvince.code}/cities-municipalities`, {
          headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) throw new Error('Failed to fetch cities/municipalities');
        const data = await response.json();
        setCitiesMunicipalities(data || []);
        setBarangays([]);
        setAddressForm(prev => ({ ...prev, cityMunicipality: '', barangay: '' }));
      } catch (error) {
        console.error('Error fetching cities/municipalities:', error);
        showToast('Failed to load cities/municipalities. Please try again.', 'error');
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCitiesMunicipalities();
  }, [addressForm.province, provinces]);

  useEffect(() => {
    const fetchBarangays = async () => {
      if (!addressForm.cityMunicipality) {
        setBarangays([]);
        setAddressForm(prev => ({ ...prev, barangay: '' }));
        return;
      }
      const selectedCity = citiesMunicipalities.find(c => c.name === addressForm.cityMunicipality);
      if (!selectedCity) { setBarangays([]); return; }
      setLoadingBarangays(true);
      try {
        const response = await fetch(`${PSGC_API_BASE}/cities-municipalities/${selectedCity.code}/barangays`, {
          headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) throw new Error('Failed to fetch barangays');
        const data = await response.json();
        setBarangays(data || []);
        setAddressForm(prev => ({ ...prev, barangay: '' }));
      } catch (error) {
        console.error('Error fetching barangays:', error);
        showToast('Failed to load barangays. Please try again.', 'error');
      } finally {
        setLoadingBarangays(false);
      }
    };
    fetchBarangays();
  }, [addressForm.cityMunicipality, citiesMunicipalities]);

  // ========== END OF PSGC CLOUD API FUNCTIONS ==========

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
      const data = {
        firstName: client.contactFirstName || '',
        middleName: client.contactMiddleName || '',
        lastName: client.contactLastName || '',
        email: client.email || '',
        contactNumber: client.contactNumber || '',
        companyName: client.companyName || '',
        client_type: client.client_type || 'Individual',
        birthday: client.birthday || ''
      };
      setProfileData(data);
      setOriginalProfileData({
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        contactNumber: data.contactNumber
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

  // Profile validation
  const validateName = (name, fieldName) => {
    if (!name || name.trim() === '') return `${fieldName} is required`;
    if (!/^[a-zA-Z\s.]+$/.test(name)) return `${fieldName} must contain only letters, spaces, and periods`;
    if (name.trim().length < 2) return `${fieldName} must be at least 2 characters`;
    return '';
  };

  const validateContactNumber = (number) => {
    if (!number || number.trim() === '') return 'Contact number is required';
    const cleanNumber = number.replace(/\s/g, '');
    if (!/^09\d{9}$/.test(cleanNumber)) return 'Contact number must start with 09 and be exactly 11 digits';
    return '';
  };

  const validateProfileForm = () => {
    const errors = {};
    const firstNameError = validateName(profileData.firstName, 'First name');
    if (firstNameError) errors.firstName = firstNameError;
    const lastNameError = validateName(profileData.lastName, 'Last name');
    if (lastNameError) errors.lastName = lastNameError;
    if (profileData.middleName && profileData.middleName.trim() !== '') {
      const middleNameError = validateName(profileData.middleName, 'Middle name');
      if (middleNameError) errors.middleName = middleNameError;
    }
    const contactError = validateContactNumber(profileData.contactNumber);
    if (contactError) errors.contactNumber = contactError;
    return errors;
  };

  const hasProfileChanges = () => {
    return (
      profileData.firstName !== originalProfileData.firstName ||
      profileData.middleName !== originalProfileData.middleName ||
      profileData.lastName !== originalProfileData.lastName ||
      profileData.contactNumber !== originalProfileData.contactNumber
    );
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
    if (profileErrors[name]) setProfileErrors(prev => ({ ...prev, [name]: '' }));
  };

  const saveProfile = async () => {
    const errors = validateProfileForm();
    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      const firstError = Object.values(errors)[0];
      showToast(firstError, 'warning');
      return;
    }
    if (!hasProfileChanges()) {
      showToast('No changes to save', 'info');
      return;
    }
    setSaving(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(`${import.meta.env.VITE_API_URL}/api/clients/update`,
        {
          contactFirstName: profileData.firstName.trim(),
          contactMiddleName: profileData.middleName.trim(),
          contactLastName: profileData.lastName.trim(),
          contactNumber: profileData.contactNumber.replace(/\s/g, '')
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOriginalProfileData({
        firstName: profileData.firstName.trim(),
        middleName: profileData.middleName.trim(),
        lastName: profileData.lastName.trim(),
        contactNumber: profileData.contactNumber.replace(/\s/g, '')
      });
      showToast('Profile updated successfully', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setAddressForm({
      houseOrBuilding: '',
      street: '',
      region: '',
      province: '',
      cityMunicipality: '',
      barangay: '',
      zipCode: '',
      label: 'Home',
      isPrimary: addresses.length === 0
    });
    setFormErrors({});
    setProvinces([]);
    setCitiesMunicipalities([]);
    setBarangays([]);
    setShowAddressModal(true);
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setAddressForm({
      houseOrBuilding: address.houseOrBuilding || '',
      street: address.street || '',
      region: address.region || '',
      province: address.province || '',
      cityMunicipality: address.cityMunicipality || '',
      barangay: address.barangay || '',
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
    if (name === 'region') {
      setProvinces([]);
      setCitiesMunicipalities([]);
      setBarangays([]);
      setAddressForm(prev => ({ ...prev, province: '', cityMunicipality: '', barangay: '' }));
    }
    if (name === 'province') {
      setCitiesMunicipalities([]);
      setBarangays([]);
      setAddressForm(prev => ({ ...prev, cityMunicipality: '', barangay: '' }));
    }
    if (name === 'cityMunicipality') {
      setBarangays([]);
      setAddressForm(prev => ({ ...prev, barangay: '' }));
    }
  };

  const validateAddressForm = () => {
    const errors = {};
    if (!addressForm.houseOrBuilding.trim()) errors.houseOrBuilding = 'House/Building is required';
    if (!addressForm.street.trim()) errors.street = 'Street is required';
    if (!addressForm.region) errors.region = 'Region is required';
    if (!addressForm.province) errors.province = 'Province is required';
    if (!addressForm.cityMunicipality) errors.cityMunicipality = 'City/Municipality is required';
    if (!addressForm.barangay) errors.barangay = 'Barangay is required';
    if (!addressForm.zipCode.trim()) {
      errors.zipCode = 'ZIP code is required';
    } else if (!/^\d{4}$/.test(addressForm.zipCode)) {
      errors.zipCode = 'ZIP code must be exactly 4 digits (0-9)';
    }
    return errors;
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    const errors = validateAddressForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      const firstError = Object.values(errors)[0];
      showToast(firstError, 'warning');
      return;
    }
    setSaving(true);
    try {
      const token = sessionStorage.getItem('token');
      const addressData = {
        houseOrBuilding: addressForm.houseOrBuilding.trim(),
        street: addressForm.street.trim(),
        region: addressForm.region,
        province: addressForm.province,
        cityMunicipality: addressForm.cityMunicipality,
        barangay: addressForm.barangay,
        zipCode: addressForm.zipCode.trim(),
        label: addressForm.label,
        isPrimary: addressForm.isPrimary
      };

      if (editingAddress) {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/clients/me/addresses/${editingAddress._id}`, addressData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showToast('Address updated successfully', 'success');
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/clients/me/addresses`, addressData, {
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
      showToast('Primary address updated successfully', 'success');
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
      showToast('Address deleted successfully', 'success');
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

  // ========== PROFILE TAB ==========
  const ProfileTab = () => (
    <div className="cuset-profile-tab">
      {/* Profile Card */}
      <div className="cuset-profile-card">
        <div className="cuset-profile-avatar">
          <FaUserCircle />
        </div>
        <div className="cuset-profile-details">
          <h2>{getFullName() || 'No Name Set'}</h2>
          <p className="cuset-profile-email">{profileData.email}</p>
          <div className="cuset-profile-badges">
            <span className="cuset-badge cuset-badge-client-type">
              <FaBriefcase /> {profileData.client_type || 'Individual'}
            </span>
            {memberSince && (
              <span className="cuset-badge cuset-badge-member-since">
                <FaCalendarAlt /> Member since {formatDate(memberSince)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="cuset-form-container">
        <div className="cuset-form-header">
          <h3><FaUser /> Personal Information</h3>
          <button
            className="cuset-btn-save"
            onClick={saveProfile}
            disabled={saving || !hasProfileChanges()}
          >
            <FaSave /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="cuset-form">
          <div className="cuset-form-grid-3">
            <div className="cuset-form-field">
              <label>First Name <span className="cuset-required">*</span></label>
              <input
                type="text"
                name="firstName"
                value={profileData.firstName}
                onChange={handleProfileChange}
                placeholder="Enter first name"
                className={profileErrors.firstName ? 'error' : ''}
              />
              {profileErrors.firstName && <span className="cuset-error-text">{profileErrors.firstName}</span>}
            </div>
            <div className="cuset-form-field">
              <label>Middle Name</label>
              <input
                type="text"
                name="middleName"
                value={profileData.middleName}
                onChange={handleProfileChange}
                placeholder="Enter middle name"
                className={profileErrors.middleName ? 'error' : ''}
              />
              {profileErrors.middleName && <span className="cuset-error-text">{profileErrors.middleName}</span>}
            </div>
            <div className="cuset-form-field">
              <label>Last Name <span className="cuset-required">*</span></label>
              <input
                type="text"
                name="lastName"
                value={profileData.lastName}
                onChange={handleProfileChange}
                placeholder="Enter last name"
                className={profileErrors.lastName ? 'error' : ''}
              />
              {profileErrors.lastName && <span className="cuset-error-text">{profileErrors.lastName}</span>}
            </div>
          </div>

          <div className="cuset-form-grid-2">
            <div className="cuset-form-field">
              <label><FaPhone /> Contact Number <span className="cuset-required">*</span></label>
              <input
                type="tel"
                name="contactNumber"
                value={profileData.contactNumber}
                onChange={handleProfileChange}
                placeholder="09XXXXXXXXX"
                className={profileErrors.contactNumber ? 'error' : ''}
              />
              {profileErrors.contactNumber && <span className="cuset-error-text">{profileErrors.contactNumber}</span>}
            </div>
            <div className="cuset-form-field">
              <label><FaEnvelope /> Email</label>
              <input
                type="email"
                value={profileData.email}
                disabled
                className="cuset-disabled"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ========== ADDRESSES TAB ==========
  const AddressesTab = () => (
    <div className="cuset-addresses-tab">
      <div className="cuset-addresses-header">
        <h3><FaMapMarkerAlt /> My Addresses</h3>
        <button className="cuset-btn-add-address" onClick={handleAddAddress}>
          <FaPlus /> Add Address
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="cuset-empty-addresses">
          <FaMapMarkerAlt className="cuset-empty-icon" />
          <h4>No addresses saved</h4>
          <p>Add your first address to make checkout faster</p>
          <button className="cuset-btn-add-first" onClick={handleAddAddress}>
            <FaPlus /> Add Address
          </button>
        </div>
      ) : (
        <div className="cuset-addresses-grid">
          {addresses.map(address => (
            <div
              key={address._id}
              className={`cuset-address-card ${address.isPrimary ? 'cuset-primary' : ''}`}
            >
              {address.isPrimary && (
                <div className="cuset-primary-tag">
                  <FaStar /> Primary
                </div>
              )}
              <div className="cuset-address-label-tag">{address.label}</div>
              <div className="cuset-address-text">
                <p>{address.houseOrBuilding}</p>
                <p>{address.street}</p>
                <p>{address.barangay}</p>
                <p>{address.cityMunicipality}</p>
                <p>{address.province}</p>
                <p className="cuset-zip">{address.zipCode}</p>
              </div>
              <div className="cuset-address-actions">
                {!address.isPrimary && (
                  <button
                    className="cuset-action-btn cuset-primary-action"
                    onClick={() => setAsPrimary(address._id)}
                  >
                    Set Primary
                  </button>
                )}
                <button
                  className="cuset-action-btn cuset-edit-action"
                  onClick={() => handleEditAddress(address)}
                >
                  <FaEdit /> Edit
                </button>
                <button
                  className="cuset-action-btn cuset-delete-action"
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

  // ========== SKELETON LOADER ==========
  const SkeletonLoader = () => (
    <div className="cuset-page">
      <div className="cuset-header">
        <div className="cuset-skeleton-line cuset-skeleton-large"></div>
        <div className="cuset-skeleton-line cuset-skeleton-medium"></div>
      </div>
      <div className="cuset-layout">
        <div className="cuset-content">
          <div className="cuset-skeleton-card">
            <div className="cuset-skeleton-line cuset-skeleton-large"></div>
            <div className="cuset-skeleton-input"></div>
            <div className="cuset-skeleton-input"></div>
            <div className="cuset-skeleton-input"></div>
          </div>
        </div>
      </div>
    </div>
  );

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
              {currentTab === 'addresses' && 'Manage your saved addresses for faster checkout'}
            </p>
          </div>
        </div>

        {/* Content without sidebar */}
        <div className="cuset-layout">
          <div className="cuset-content">
            {currentTab === 'profile' && <ProfileTab />}
            {currentTab === 'addresses' && <AddressesTab />}
          </div>
        </div>

        {/* ========== ADDRESS MODAL - NO SCROLL ========== */}
        {showAddressModal && (
          <div className="cuset-modal-overlay" onClick={() => setShowAddressModal(false)}>
            <div className="cuset-modal-content cuset-no-scroll" onClick={e => e.stopPropagation()}>
              <div className="cuset-modal-header">
                <h3>{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
                <button className="cuset-modal-close" onClick={() => setShowAddressModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <form onSubmit={handleAddressSubmit}>
                <div className="cuset-modal-body cuset-no-scroll-body">
                  <div className="cuset-modal-form-grid">
                    {/* Label & Primary */}
                    <div className="cuset-modal-row">
                      <div className="cuset-modal-field">
                        <label>Address Label</label>
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
                      <div className="cuset-modal-field cuset-checkbox-field">
                        <label className="cuset-checkbox-label">
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

                    {/* Region */}
                    <div className="cuset-modal-field">
                      <label>Region <span className="cuset-required">*</span></label>
                      <select
                        name="region"
                        value={addressForm.region}
                        onChange={handleAddressFormChange}
                        className={formErrors.region ? 'error' : ''}
                        disabled={loadingRegions}
                      >
                        <option value="">Select Region</option>
                        {regions.map((region) => (
                          <option key={region.code} value={region.name}>
                            {region.regionName}
                          </option>
                        ))}
                      </select>
                      {loadingRegions && <span className="cuset-hint">Loading regions...</span>}
                      {formErrors.region && <span className="cuset-error-text">{formErrors.region}</span>}
                    </div>

                    {/* Province */}
                    <div className="cuset-modal-field">
                      <label>Province <span className="cuset-required">*</span></label>
                      <select
                        name="province"
                        value={addressForm.province}
                        onChange={handleAddressFormChange}
                        className={formErrors.province ? 'error' : ''}
                        disabled={!addressForm.region || loadingProvinces}
                      >
                        <option value="">Select Province</option>
                        {provinces.map((province) => (
                          <option key={province.code} value={province.name}>
                            {province.name}
                          </option>
                        ))}
                      </select>
                      {loadingProvinces && <span className="cuset-hint">Loading provinces...</span>}
                      {!addressForm.region && <span className="cuset-hint">Please select a region first</span>}
                      {formErrors.province && <span className="cuset-error-text">{formErrors.province}</span>}
                    </div>

                    {/* City/Municipality */}
                    <div className="cuset-modal-field">
                      <label>City / Municipality <span className="cuset-required">*</span></label>
                      <select
                        name="cityMunicipality"
                        value={addressForm.cityMunicipality}
                        onChange={handleAddressFormChange}
                        className={formErrors.cityMunicipality ? 'error' : ''}
                        disabled={!addressForm.province || loadingCities}
                      >
                        <option value="">Select City/Municipality</option>
                        {citiesMunicipalities.map((city) => (
                          <option key={city.code} value={city.name}>
                            {city.name}
                          </option>
                        ))}
                      </select>
                      {loadingCities && <span className="cuset-hint">Loading cities...</span>}
                      {!addressForm.province && <span className="cuset-hint">Please select a province first</span>}
                      {formErrors.cityMunicipality && <span className="cuset-error-text">{formErrors.cityMunicipality}</span>}
                    </div>

                    {/* Barangay */}
                    <div className="cuset-modal-field">
                      <label>Barangay <span className="cuset-required">*</span></label>
                      <select
                        name="barangay"
                        value={addressForm.barangay}
                        onChange={handleAddressFormChange}
                        className={formErrors.barangay ? 'error' : ''}
                        disabled={!addressForm.cityMunicipality || loadingBarangays}
                      >
                        <option value="">Select Barangay</option>
                        {barangays.map((barangay) => (
                          <option key={barangay.code} value={barangay.name}>
                            {barangay.name}
                          </option>
                        ))}
                      </select>
                      {loadingBarangays && <span className="cuset-hint">Loading barangays...</span>}
                      {!addressForm.cityMunicipality && <span className="cuset-hint">Please select a city first</span>}
                      {formErrors.barangay && <span className="cuset-error-text">{formErrors.barangay}</span>}
                    </div>

                    {/* Street */}
                    <div className="cuset-modal-field">
                      <label>Street <span className="cuset-required">*</span></label>
                      <input
                        type="text"
                        name="street"
                        value={addressForm.street}
                        onChange={handleAddressFormChange}
                        className={formErrors.street ? 'error' : ''}
                        placeholder="Enter street name"
                      />
                      {formErrors.street && <span className="cuset-error-text">{formErrors.street}</span>}
                    </div>

                    {/* House/Building */}
                    <div className="cuset-modal-field">
                      <label>House / Building <span className="cuset-required">*</span></label>
                      <input
                        type="text"
                        name="houseOrBuilding"
                        value={addressForm.houseOrBuilding}
                        onChange={handleAddressFormChange}
                        className={formErrors.houseOrBuilding ? 'error' : ''}
                        placeholder="Enter house number or building name"
                      />
                      {formErrors.houseOrBuilding && <span className="cuset-error-text">{formErrors.houseOrBuilding}</span>}
                    </div>

                    {/* ZIP Code */}
                    <div className="cuset-modal-field">
                      <label>ZIP Code <span className="cuset-required">*</span></label>
                      <input
                        type="text"
                        name="zipCode"
                        value={addressForm.zipCode}
                        onChange={handleAddressFormChange}
                        maxLength="4"
                        className={formErrors.zipCode ? 'error' : ''}
                        placeholder="Enter ZIP code"
                      />
                      {formErrors.zipCode && <span className="cuset-error-text">{formErrors.zipCode}</span>}
                      <span className="cuset-hint">4 digits (e.g., 1234)</span>
                    </div>
                  </div>
                </div>

                <div className="cuset-modal-footer">
                  <button
                    type="button"
                    className="cuset-btn-cancel"
                    onClick={() => setShowAddressModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="cuset-btn-submit"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Address'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========== DELETE CONFIRM MODAL ========== */}
        {deleteConfirm && (
          <div className="cuset-modal-overlay" onClick={() => setDeleteConfirm(null)}>
            <div className="cuset-modal-content cuset-confirm-modal cuset-no-scroll" onClick={e => e.stopPropagation()}>
              <div className="cuset-modal-header">
                <h3>Delete Address</h3>
                <button className="cuset-modal-close" onClick={() => setDeleteConfirm(null)}>
                  <FaTimes />
                </button>
              </div>
              <div className="cuset-modal-body cuset-confirm-body">
                <div className="cuset-confirm-icon">
                  <FaInfoCircle />
                </div>
                <p>Are you sure you want to delete this address?</p>
                <div className="cuset-address-preview-box">
                  {getFullAddress(deleteConfirm)}
                </div>
                <div className="cuset-confirm-actions">
                  <button
                    className="cuset-btn-cancel"
                    onClick={() => setDeleteConfirm(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="cuset-btn-delete"
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