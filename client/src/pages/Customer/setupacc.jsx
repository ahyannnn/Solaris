import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaSolarPanel,
  FaUser,
  FaPhone,
  FaHome,
  FaMapMarkerAlt,
  FaCity,
  FaGlobe,
  FaMailBulk,
  FaCheckCircle,
  FaArrowLeft,
  FaArrowRight,
  FaCalendarAlt
} from 'react-icons/fa';
import '../../styles/Customer/setupacc.css';

const SetupAccount = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const token = sessionStorage.getItem('token');

  // Generate years (last 100 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  // Form Data - Updated field names to match database schema
  const [formData, setFormData] = useState({
    accountType: 'individual',
    companyName: '',
    firstName: '',
    middleName: '',
    lastName: '',
    phoneNumber: '',
    birthMonth: '',
    birthDay: '',
    birthYear: '',
    // Address fields - updated to match Address model
    houseOrBuilding: '',  // Changed from houseNumber
    street: '',
    barangay: '',
    cityMunicipality: '', // Changed from municipality
    province: '',
    zipCode: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
    if (apiError) setApiError('');
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.accountType) newErrors.accountType = 'Account type is required';
    if (formData.accountType === 'company' && !formData.companyName) {
      newErrors.companyName = 'Company name is required for company accounts';
    }
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
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

      // STEP 1: Update Client Info (Personal Information)
      const clientUpdate = {
        contactFirstName: formData.firstName,
        contactMiddleName: formData.middleName,
        contactLastName: formData.lastName,
        contactNumber: formData.phoneNumber,
        client_type: formData.accountType === 'individual' ? 'Individual' : 'Company',
        companyName: formData.accountType === 'company' ? formData.companyName : '',
        birthday: birthday,
        account_setup: true
      };

      console.log('Updating client with:', clientUpdate);

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

      console.log('Client updated successfully:', clientData);

      // STEP 2: Add Address to Address Table
      const addressData = {
        houseOrBuilding: formData.houseOrBuilding,
        street: formData.street,
        barangay: formData.barangay,
        cityMunicipality: formData.cityMunicipality,
        province: formData.province,
        zipCode: formData.zipCode,
        label: 'Primary',
        isPrimary: true // This will be the primary address
      };

      console.log('Adding address with:', addressData);

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

      console.log('Address added successfully:', addressResult);

      // Store combined data in sessionStorage
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

  const handleContinueToDashboard = () => navigate('/dashboard/customerdashboard');

  return (
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
                  <h2 className="setup-form-title">Personal Information</h2>
                  <p className="setup-form-subtitle">Tell us about yourself</p>
                </div>

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
                      <option value="individual">Individual</option>
                      <option value="company">Company</option>
                    </select>
                    {errors.accountType && <span className="setup-error-message">{errors.accountType}</span>}
                  </div>

                  {/* COMPANY NAME - only enabled if company is selected */}
                  <div className="setup-form-group">
                    <label className="setup-form-label">Company Name</label>
                    <div className="setup-input-wrapper">
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        className="setup-form-input"
                        placeholder="Enter company name"
                        disabled={formData.accountType !== 'company'}
                      />
                    </div>
                    {errors.companyName && <span className="setup-error-message">{errors.companyName}</span>}
                  </div>

                  {/* FIRST NAME */}
                  <div className="setup-form-group">
                    <label className="setup-form-label">First Name <span className="setup-required">*</span></label>
                    <div className="setup-input-wrapper">
                      <FaUser className="setup-input-icon" />
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className={`setup-form-input ${errors.firstName ? 'error' : ''}`}
                        placeholder="Enter first name"
                      />
                    </div>
                    {errors.firstName && <span className="setup-error-message">{errors.firstName}</span>}
                  </div>

                  {/* MIDDLE NAME */}
                  <div className="setup-form-group">
                    <label className="setup-form-label">Middle Name</label>
                    <div className="setup-input-wrapper">
                      <FaUser className="setup-input-icon" />
                      <input
                        type="text"
                        name="middleName"
                        value={formData.middleName}
                        onChange={handleChange}
                        className="setup-form-input"
                        placeholder="Enter middle name (optional)"
                      />
                    </div>
                  </div>

                  {/* LAST NAME */}
                  <div className="setup-form-group">
                    <label className="setup-form-label">Last Name <span className="setup-required">*</span></label>
                    <div className="setup-input-wrapper">
                      <FaUser className="setup-input-icon" />
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className={`setup-form-input ${errors.lastName ? 'error' : ''}`}
                        placeholder="Enter last name"
                      />
                    </div>
                    {errors.lastName && <span className="setup-error-message">{errors.lastName}</span>}
                  </div>

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
                    {(errors.birthMonth || errors.birthDay || errors.birthYear) && 
                      <span className="setup-error-message">Complete birthday is required</span>
                    }
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
                      <FaMapMarkerAlt className="setup-input-icon" />
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
                  Your account setup is complete.
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
  );
};

export default SetupAccount;