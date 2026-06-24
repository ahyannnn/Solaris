// pages/Customer/setupacc.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  FaSolarPanel,
  FaUser,
  FaPhone,
  FaHome,
  FaCity,
  FaGlobe,
  FaMailBulk,
  FaCheckCircle,
  FaArrowLeft,
  FaArrowRight,
  FaCalendarAlt,
  FaBuilding,
  FaRoad,
  FaIndustry
} from 'react-icons/fa';
import '../../styles/Customer/setupacc.css';

const SetupAccount = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [clientData, setClientData] = useState(null);

  const token = sessionStorage.getItem('token');

  // Generate years (last 100 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  // Form Data - Removed firstName, middleName, lastName (already in clients table)
  const [formData, setFormData] = useState({
    accountType: 'residential',
    companyName: '',
    phoneNumber: '',
    birthMonth: '',
    birthDay: '',
    birthYear: '',
    // Address fields
    houseOrBuilding: '',
    street: '',
    barangay: '',
    cityMunicipality: '',
    province: '',
    zipCode: ''
  });

  const [errors, setErrors] = useState({});

  // Fetch existing client data on mount
  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/clients/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setClientData(data.client);
          
          // Pre-fill form with existing data if available
          if (data.client) {
            setFormData(prev => ({
              ...prev,
              accountType: data.client.client_type ? 
                data.client.client_type.toLowerCase() : 'residential',
              companyName: data.client.companyName || '',
              phoneNumber: data.client.contactNumber || '',
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching client data:', error);
      }
    };

    if (token) {
      fetchClientData();
    }
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
    if (apiError) setApiError('');
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.accountType) newErrors.accountType = 'Account type is required';
    if ((formData.accountType === 'company' || formData.accountType === 'industrial') && !formData.companyName) {
      newErrors.companyName = `${formData.accountType === 'company' ? 'Company' : 'Business/Organization'} name is required`;
    }
    if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
    if (!formData.birthMonth) newErrors.birthMonth = 'Month is required';
    if (!formData.birthDay) newErrors.birthDay = 'Day is required';
    if (!formData.birthYear) newErrors.birthYear = 'Year is required';

    // Validate phone number
    if (formData.phoneNumber) {
      const phoneRegex = /^(09|\+639)\d{9}$/;
      if (!phoneRegex.test(formData.phoneNumber.replace(/\s/g, ''))) {
        newErrors.phoneNumber = 'Enter a valid Philippine mobile number (09XXXXXXXXX or +639XXXXXXXXX)';
      }
    }
    return newErrors;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.houseOrBuilding) newErrors.houseOrBuilding = 'House/Building number is required';
    if (!formData.street) newErrors.street = 'Street is required';
    if (!formData.barangay) newErrors.barangay = 'Barangay is required';
    if (!formData.cityMunicipality) newErrors.cityMunicipality = 'City/Municipality is required';
    if (!formData.province) newErrors.province = 'Province is required';
    if (!formData.zipCode) newErrors.zipCode = 'ZIP code is required';
    if (formData.zipCode && !/^\d{4}$/.test(formData.zipCode)) {
      newErrors.zipCode = 'ZIP code must be 4 digits';
    }
    return newErrors;
  };

  const handleNext = () => {
    const stepErrors = validateStep1();
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setCurrentStep(2);
  };

  const handleBack = () => setCurrentStep(1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const stepErrors = validateStep2();
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setIsLoading(true);
    setApiError('');

    try {
      // Format birthday as proper date
      const birthday = formData.birthYear && formData.birthMonth && formData.birthDay
        ? `${formData.birthYear}-${String(formData.birthMonth).padStart(2, '0')}-${String(formData.birthDay).padStart(2, '0')}`
        : null;

      // STEP 1: Update Client Info (Only missing fields - NOT name fields)
      const clientUpdate = {
        contactNumber: formData.phoneNumber,
        client_type: formData.accountType === 'residential' ? 'Residential' :
                     formData.accountType === 'company' ? 'Company' : 'Industrial',
        companyName: (formData.accountType === 'company' || formData.accountType === 'industrial') ? formData.companyName : '',
        birthday: birthday,
        account_setup: true
      };

      const clientRes = await fetch(`${import.meta.env.VITE_API_URL}/api/clients/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(clientUpdate)
      });

      const clientData = await clientRes.json();

      if (!clientRes.ok) {
        throw new Error(clientData.message || 'Failed to update client information');
      }

      // STEP 2: Add Address to Address Table
      const addressData = {
        houseOrBuilding: formData.houseOrBuilding,
        street: formData.street,
        barangay: formData.barangay,
        cityMunicipality: formData.cityMunicipality,
        province: formData.province,
        zipCode: formData.zipCode,
        label: 'Primary',
        isPrimary: true
      };

      const addressRes = await fetch(`${import.meta.env.VITE_API_URL}/api/clients/me/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(addressData)
      });

      const addressResult = await addressRes.json();

      if (!addressRes.ok) {
        throw new Error(addressResult.message || 'Failed to save address');
      }

      // Mark setup as complete in session
      sessionStorage.setItem('hasCompletedSetup', 'true');
      sessionStorage.setItem('clientData', JSON.stringify({
        ...clientData.client,
        primaryAddress: addressResult.address
      }));

      setCurrentStep(3);
    } catch (error) {
      console.error('Setup error:', error);
      setApiError(error.message || 'Failed to complete setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueToDashboard = () => {
    // Update sessionStorage to mark setup as complete
    sessionStorage.setItem('hasCompletedSetup', 'true');
    navigate('/app/customer');
  };

  const getBusinessLabel = () => {
    if (formData.accountType === 'company') {
      return 'Company Name';
    } else if (formData.accountType === 'industrial') {
      return 'Business/Organization Name';
    }
    return '';
  };

  const getBusinessPlaceholder = () => {
    if (formData.accountType === 'company') {
      return 'Enter company name';
    } else if (formData.accountType === 'industrial') {
      return 'Enter business/organization name';
    }
    return '';
  };

  const getBusinessIcon = () => {
    if (formData.accountType === 'company') {
      return <FaBuilding className="setup-input-icon" />;
    } else if (formData.accountType === 'industrial') {
      return <FaIndustry className="setup-input-icon" />;
    }
    return null;
  };

  return (
    <>
      <Helmet>
        <title>Complete Your Account Setup | Salfer Engineering</title>
        <meta name="description" content="Finish setting up your Salfer Engineering account by providing your personal information and address details to access your solar project dashboard." />
      </Helmet>

      <div className="setup-page">
        <div className="setup-card">
          {/* Left Side - Progress */}
          <div className="setup-progress">
            <div className="setup-progress-header">
              <div className="setup-logo-container">
                <div className="setup-logo-icon">
                  <FaSolarPanel />
                </div>
                <h1 className="setup-logo-text">SOLARIS</h1>
              </div>
              <p className="setup-progress-subtitle">Complete your account setup</p>
            </div>

            <div className="setup-steps-container">
              <div className={`setup-step-item ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
                <div className="setup-step-indicator">
                  {currentStep > 1 ? '✓' : '1'}
                </div>
                <div className="setup-step-info">
                  <span className="setup-step-label">Step 1</span>
                  <span className="setup-step-title">Personal Info</span>
                </div>
              </div>

              <div className={`setup-step-line ${currentStep >= 2 ? 'active' : ''}`}></div>

              <div className={`setup-step-item ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                <div className="setup-step-indicator">
                  {currentStep > 2 ? '✓' : '2'}
                </div>
                <div className="setup-step-info">
                  <span className="setup-step-label">Step 2</span>
                  <span className="setup-step-title">Address</span>
                </div>
              </div>

              <div className={`setup-step-line ${currentStep >= 3 ? 'active' : ''}`}></div>

              <div className={`setup-step-item ${currentStep >= 3 ? 'active' : ''}`}>
                <div className="setup-step-indicator">3</div>
                <div className="setup-step-info">
                  <span className="setup-step-label">Step 3</span>
                  <span className="setup-step-title">Complete</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="setup-form-container">
            <div className="setup-form-wrapper">
              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <>
                  <div className="setup-form-header">
                    <h2 className="setup-form-title">Complete Your Profile</h2>
                    <p className="setup-form-subtitle">Tell us more about yourself</p>
                  </div>

                  {clientData && (
                    <div className="setup-info-box">
                      <p className="setup-info-text">
                        <strong>Welcome, {clientData.contactFirstName} {clientData.contactLastName}!</strong>
                      </p>
                      <p className="setup-info-subtext">
                        Your name is already saved. Please complete the rest of your profile.
                      </p>
                    </div>
                  )}

                  <form className="setup-form">
                    {/* ACCOUNT TYPE */}
                    <div className="setup-form-group">
                      <label className="setup-form-label">Account Type <span className="setup-required">*</span></label>
                      <select
                        name="accountType"
                        value={formData.accountType}
                        onChange={handleChange}
                        className={`setup-select ${errors.accountType ? 'error' : ''}`}
                      >
                        <option value="residential">Residential</option>
                        <option value="company">Company</option>
                        <option value="industrial">Industrial</option>
                      </select>
                      {errors.accountType && <span className="setup-error-message">{errors.accountType}</span>}
                    </div>

                    {/* BUSINESS/COMPANY NAME - shown for company and industrial accounts */}
                    {(formData.accountType === 'company' || formData.accountType === 'industrial') && (
                      <div className="setup-form-group">
                        <label className="setup-form-label">{getBusinessLabel()} <span className="setup-required">*</span></label>
                        <div className="setup-input-wrapper">
                          {getBusinessIcon()}
                          <input
                            type="text"
                            name="companyName"
                            value={formData.companyName}
                            onChange={handleChange}
                            className={`setup-form-input ${errors.companyName ? 'error' : ''}`}
                            placeholder={getBusinessPlaceholder()}
                          />
                        </div>
                        {errors.companyName && <span className="setup-error-message">{errors.companyName}</span>}
                      </div>
                    )}

                    {/* PHONE NUMBER */}
                    <div className="setup-form-group">
                      <label className="setup-form-label">Phone Number <span className="setup-required">*</span></label>
                      <div className="setup-input-wrapper">
                        <FaPhone className="setup-input-icon" />
                        <input
                          type="tel"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleChange}
                          className={`setup-form-input ${errors.phoneNumber ? 'error' : ''}`}
                          placeholder="09XXXXXXXXX"
                        />
                      </div>
                      {errors.phoneNumber && <span className="setup-error-message">{errors.phoneNumber}</span>}
                    </div>

                    {/* BIRTHDAY - 3 DROPDOWNS */}
                    <div className="setup-form-group">
                      <label className="setup-form-label">Birthday <span className="setup-required">*</span></label>
                      <div className="setup-birthday-row">
                        <div className="setup-select-wrapper">
                          <FaCalendarAlt className="setup-select-icon" />
                          <select
                            name="birthMonth"
                            value={formData.birthMonth}
                            onChange={handleChange}
                            className={`setup-select ${errors.birthMonth ? 'error' : ''}`}
                          >
                            <option value="">Month</option>
                            {months.map((month, index) => (
                              <option key={index} value={index + 1}>{month}</option>
                            ))}
                          </select>
                        </div>

                        <div className="setup-select-wrapper">
                          <select
                            name="birthDay"
                            value={formData.birthDay}
                            onChange={handleChange}
                            className={`setup-select ${errors.birthDay ? 'error' : ''}`}
                          >
                            <option value="">Day</option>
                            {days.map(day => (
                              <option key={day} value={day}>{day}</option>
                            ))}
                          </select>
                        </div>

                        <div className="setup-select-wrapper">
                          <select
                            name="birthYear"
                            value={formData.birthYear}
                            onChange={handleChange}
                            className={`setup-select ${errors.birthYear ? 'error' : ''}`}
                          >
                            <option value="">Year</option>
                            {years.map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      {(errors.birthMonth || errors.birthDay || errors.birthYear) && (
                        <span className="setup-error-message">Complete birthday is required</span>
                      )}
                    </div>

                    <div className="setup-form-actions">
                      <button
                        type="button"
                        onClick={handleNext}
                        className="setup-btn-next"
                      >
                        Next Step <FaArrowRight />
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* Step 2: Address Information */}
              {currentStep === 2 && (
                <>
                  <div className="setup-form-header">
                    <h2 className="setup-form-title">Address Information</h2>
                    <p className="setup-form-subtitle">Where are you located?</p>
                  </div>

                  {apiError && (
                    <div className="setup-api-error">
                      <span className="setup-error-message">{apiError}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="setup-form">
                    {/* HOUSE/BUILDING NUMBER */}
                    <div className="setup-form-group">
                      <label className="setup-form-label">House/Building No. <span className="setup-required">*</span></label>
                      <div className="setup-input-wrapper">
                        <FaHome className="setup-input-icon" />
                        <input
                          type="text"
                          name="houseOrBuilding"
                          value={formData.houseOrBuilding}
                          onChange={handleChange}
                          className={`setup-form-input ${errors.houseOrBuilding ? 'error' : ''}`}
                          placeholder="Enter house/building number"
                        />
                      </div>
                      {errors.houseOrBuilding && <span className="setup-error-message">{errors.houseOrBuilding}</span>}
                    </div>

                    {/* STREET */}
                    <div className="setup-form-group">
                      <label className="setup-form-label">Street <span className="setup-required">*</span></label>
                      <div className="setup-input-wrapper">
                        <FaRoad className="setup-input-icon" />
                        <input
                          type="text"
                          name="street"
                          value={formData.street}
                          onChange={handleChange}
                          className={`setup-form-input ${errors.street ? 'error' : ''}`}
                          placeholder="Enter street name"
                        />
                      </div>
                      {errors.street && <span className="setup-error-message">{errors.street}</span>}
                    </div>

                    {/* BARANGAY */}
                    <div className="setup-form-group">
                      <label className="setup-form-label">Barangay <span className="setup-required">*</span></label>
                      <div className="setup-input-wrapper">
                        <FaCity className="setup-input-icon" />
                        <input
                          type="text"
                          name="barangay"
                          value={formData.barangay}
                          onChange={handleChange}
                          className={`setup-form-input ${errors.barangay ? 'error' : ''}`}
                          placeholder="Enter barangay"
                        />
                      </div>
                      {errors.barangay && <span className="setup-error-message">{errors.barangay}</span>}
                    </div>

                    {/* CITY/MUNICIPALITY */}
                    <div className="setup-form-group">
                      <label className="setup-form-label">City/Municipality <span className="setup-required">*</span></label>
                      <div className="setup-input-wrapper">
                        <FaCity className="setup-input-icon" />
                        <input
                          type="text"
                          name="cityMunicipality"
                          value={formData.cityMunicipality}
                          onChange={handleChange}
                          className={`setup-form-input ${errors.cityMunicipality ? 'error' : ''}`}
                          placeholder="Enter city/municipality"
                        />
                      </div>
                      {errors.cityMunicipality && <span className="setup-error-message">{errors.cityMunicipality}</span>}
                    </div>

                    {/* PROVINCE */}
                    <div className="setup-form-group">
                      <label className="setup-form-label">Province <span className="setup-required">*</span></label>
                      <div className="setup-input-wrapper">
                        <FaGlobe className="setup-input-icon" />
                        <input
                          type="text"
                          name="province"
                          value={formData.province}
                          onChange={handleChange}
                          className={`setup-form-input ${errors.province ? 'error' : ''}`}
                          placeholder="Enter province"
                        />
                      </div>
                      {errors.province && <span className="setup-error-message">{errors.province}</span>}
                    </div>

                    {/* ZIP CODE */}
                    <div className="setup-form-group">
                      <label className="setup-form-label">ZIP Code <span className="setup-required">*</span></label>
                      <div className="setup-input-wrapper">
                        <FaMailBulk className="setup-input-icon" />
                        <input
                          type="text"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleChange}
                          className={`setup-form-input ${errors.zipCode ? 'error' : ''}`}
                          placeholder="Enter ZIP code"
                          maxLength="4"
                        />
                      </div>
                      {errors.zipCode && <span className="setup-error-message">{errors.zipCode}</span>}
                    </div>

                    <div className="setup-form-actions">
                      <button
                        type="button"
                        onClick={handleBack}
                        className="setup-btn-back"
                      >
                        <FaArrowLeft /> Back
                      </button>
                      <button
                        type="submit"
                        className="setup-btn-submit"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Saving...' : 'Complete Setup'}
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* Step 3: Success */}
              {currentStep === 3 && (
                <div className="setup-success-container">
                  <div className="setup-success-icon">
                    <FaCheckCircle />
                  </div>
                  <h2 className="setup-success-title">✓ All Set-Up</h2>
                  <p className="setup-success-message">
                    Your account setup is complete. You can now access your dashboard and start booking assessments.
                  </p>
                  <button
                    onClick={handleContinueToDashboard}
                    className="setup-btn-dashboard"
                  >
                    Continue to Dashboard
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SetupAccount;