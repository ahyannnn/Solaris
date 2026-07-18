// pages/Engineer/Profile.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import {
  FaUserCircle,
  FaEnvelope,
  FaPhone,
  FaSave,
  FaUser,
  FaCalendarAlt,
  FaIdCard,
  FaBriefcase
} from 'react-icons/fa';
import '../../styles/Engineer/profile.css';

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    employeeId: '',
    position: '',
    department: ''
  });

  const [memberSince, setMemberSince] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  // ============================================
  // FETCH PROFILE - Using the same pattern as MyProject
  // ============================================
  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      
      if (!token) {
        showToast('Please login again', 'error');
        setLoading(false);
        return;
      }

      // Get engineer data from localStorage first (from login)
      const firstName = localStorage.getItem('firstName') || sessionStorage.getItem('firstName') || '';
      const lastName = localStorage.getItem('lastName') || sessionStorage.getItem('lastName') || '';
      const email = localStorage.getItem('email') || sessionStorage.getItem('email') || '';
      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId') || '';

      // Try to fetch from API using the same endpoint pattern as MyProject
      try {
        // Try /api/engineers/profile first
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/engineers/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const data = response.data.engineer || response.data;
        setProfileData({
          firstName: data.firstName || data.contactFirstName || firstName,
          middleName: data.middleName || data.contactMiddleName || '',
          lastName: data.lastName || data.contactLastName || lastName,
          email: data.email || email,
          contactNumber: data.contactNumber || data.phone || '',
          employeeId: data.employeeId || data.engineerId || userId,
          position: data.position || 'Engineer',
          department: data.department || 'Engineering'
        });
        setMemberSince(data.createdAt || data.joinDate || null);
        setLoading(false);
        return;
      } catch (err) {
        console.log('Engineer profile endpoint not found, using localStorage');
      }

      // If API fails, use localStorage data
      setProfileData({
        firstName: firstName,
        middleName: '',
        lastName: lastName,
        email: email,
        contactNumber: '',
        employeeId: userId,
        position: 'Engineer',
        department: 'Engineering'
      });
      setMemberSince(null);
      setLoading(false);

    } catch (err) {
      console.error('Error fetching profile:', err);
      // Use localStorage as final fallback
      const firstName = localStorage.getItem('firstName') || sessionStorage.getItem('firstName') || '';
      const lastName = localStorage.getItem('lastName') || sessionStorage.getItem('lastName') || '';
      const email = localStorage.getItem('email') || sessionStorage.getItem('email') || '';
      
      setProfileData({
        firstName: firstName,
        middleName: '',
        lastName: lastName,
        email: email,
        contactNumber: '',
        employeeId: '',
        position: 'Engineer',
        department: 'Engineering'
      });
      setLoading(false);
    }
  };

  // ============================================
  // HANDLE CHANGE - FIXED: This was missing!
  // ============================================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  // ============================================
  // SAVE PROFILE
  // ============================================
  const saveProfile = async () => {
    setSaving(true);
    try {
      const token = sessionStorage.getItem('token');
      
      if (!token) {
        showToast('Please login again', 'error');
        setSaving(false);
        return;
      }

      // Try to update using /api/engineers/update
      try {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/engineers/update`,
          {
            firstName: profileData.firstName,
            middleName: profileData.middleName,
            lastName: profileData.lastName,
            contactNumber: profileData.contactNumber,
            position: profileData.position,
            department: profileData.department
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showToast('Profile updated successfully!', 'success');
        fetchProfileData();
        setSaving(false);
        return;
      } catch (err) {
        if (err.response?.status === 404) {
          // Try /api/engineers/profile as fallback
          try {
            await axios.put(
              `${import.meta.env.VITE_API_URL}/api/engineers/profile`,
              {
                firstName: profileData.firstName,
                middleName: profileData.middleName,
                lastName: profileData.lastName,
                contactNumber: profileData.contactNumber,
                position: profileData.position,
                department: profileData.department
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            showToast('Profile updated successfully!', 'success');
            fetchProfileData();
            setSaving(false);
            return;
          } catch (fallbackErr) {
            // If both fail, just update localStorage
            localStorage.setItem('firstName', profileData.firstName);
            localStorage.setItem('lastName', profileData.lastName);
            showToast('Profile updated locally! (API not available)', 'warning');
            setSaving(false);
            return;
          }
        }
        throw err;
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      showToast('Failed to update profile. Please try again.', 'error');
      setSaving(false);
    }
  };

  const getFullName = () => {
    return [profileData.firstName, profileData.middleName, profileData.lastName]
      .filter(n => n && n.trim())
      .join(' ');
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const SkeletonLoader = () => (
    <div className="eng-profile-page">
      <div className="eng-profile-header">
        <div className="skeleton-line large"></div>
        <div className="skeleton-line medium"></div>
      </div>
      <div className="eng-profile-content">
        <div className="eng-profile-card skeleton-card">
          <div className="skeleton-line large"></div>
          <div className="skeleton-input"></div>
          <div className="skeleton-input"></div>
          <div className="skeleton-input"></div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <>
        <Helmet><title>Profile | Engineer | SOLARIS</title></Helmet>
        <SkeletonLoader />
      </>
    );
  }

  return (
    <>
      <Helmet><title>Profile | Engineer | SOLARIS</title></Helmet>

      <div className="eng-profile-page">
        {/* Header */}
        <div className="eng-profile-header">
          <div className="eng-profile-header-content">
            <h1>My Profile</h1>
            <p>Manage your personal information and engineering profile</p>
          </div>
        </div>

        {/* Profile Content */}
        <div className="eng-profile-content">
          {/* Profile Summary Card */}
          <div className="eng-profile-summary">
            <div className="eng-profile-avatar">
              <FaUserCircle />
            </div>
            <div className="eng-profile-info">
              <h2>{getFullName() || 'No Name Set'}</h2>
              <p className="eng-profile-email">{profileData.email}</p>
              <div className="eng-profile-meta">
                {profileData.employeeId && (
                  <span className="eng-meta-item">
                    <FaIdCard /> ID: {profileData.employeeId}
                  </span>
                )}
                <span className="eng-meta-item">
                  <FaBriefcase /> {profileData.position || 'Engineer'}
                </span>
                {memberSince && (
                  <span className="eng-meta-item">
                    <FaCalendarAlt /> Member since {formatDate(memberSince)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Edit Profile Form */}
          <div className="eng-profile-form-card">
            <div className="eng-card-header">
              <h3><FaUser /> Personal Information</h3>
              <button 
                className="eng-save-btn" 
                onClick={saveProfile} 
                disabled={saving}
              >
                <FaSave /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            <div className="eng-profile-form">
              <div className="eng-form-row">
                <div className="eng-form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleChange}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="eng-form-group">
                  <label>Middle Name</label>
                  <input
                    type="text"
                    name="middleName"
                    value={profileData.middleName}
                    onChange={handleChange}
                    placeholder="Enter middle name"
                  />
                </div>
                <div className="eng-form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleChange}
                    placeholder="Enter last name"
                  />
                </div>
              </div>

              <div className="eng-form-row">
                <div className="eng-form-group">
                  <label><FaEnvelope /> Email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="eng-readonly"
                  />
                  <small>Email cannot be changed</small>
                </div>
                <div className="eng-form-group">
                  <label><FaPhone /> Contact Number</label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={profileData.contactNumber}
                    onChange={handleChange}
                    placeholder="Enter contact number"
                  />
                </div>
              </div>

              <div className="eng-form-row">
                <div className="eng-form-group">
                  <label><FaBriefcase /> Position</label>
                  <input
                    type="text"
                    name="position"
                    value={profileData.position}
                    onChange={handleChange}
                    placeholder="Enter your position"
                  />
                </div>
                <div className="eng-form-group">
                  <label><FaIdCard /> Employee ID</label>
                  <input
                    type="text"
                    value={profileData.employeeId}
                    disabled
                    className="eng-readonly"
                  />
                  <small>Employee ID cannot be changed</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Toast Notification */}
        {toast.show && (
          <div className={`eng-toast ${toast.type}`}>
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    </>
  );
};

export default Profile;