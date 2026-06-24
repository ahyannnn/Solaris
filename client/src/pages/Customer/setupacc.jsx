// pages/Customer/setupacc.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
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
  FaIndustry,
  FaUserFriends,
  FaUsers
} from 'react-icons/fa';
import logo from '../../assets/Salfare_Logo.png';
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

  // Form Data
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
      const birthday = formData.birthYear && formData.birthMonth && formData.birthDay
        ? `${formData.birthYear}-${String(formData.birthMonth).padStart(2, '0')}-${String(formData.birthDay).padStart(2, '0')}`
        : null;

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
      return <FaBuilding className="new-setup-input-icon" />;
    } else if (formData.accountType === 'industrial') {
      return <FaIndustry className="new-setup-input-icon" />;
    }
    return null;
  };

  // Get account type icon
  const getAccountTypeIcon = () => {
    if (formData.accountType === 'residential') {
      return <FaUser className="new-setup-select-icon" />;
    } else if (formData.accountType === 'company') {
      return <FaBuilding className="new-setup-select-icon" />;
    } else if (formData.accountType === 'industrial') {
      return <FaIndustry className="new-setup-select-icon" />;
    }
    return <FaUser className="new-setup-select-icon" />;
  };

  // Get branding content based on step
  const getBrandingContent = (step) => {
    switch(step) {
      case 1:
        return {
          title: 'Complete Your Profile',
          subtitle: 'Tell us about yourself',
          description: 'We need a few details to personalize your solar experience. This helps us provide better service.',
          features: ['Personalized Solar Solutions', 'Accurate Assessment', 'Better Service']
        };
      case 2:
        return {
          title: 'Address Information',
          subtitle: 'Where are you located?',
          description: 'Your address helps us determine solar potential and provide accurate installation estimates.',
          features: ['Site Assessment', 'Solar Potential Analysis', 'Installation Planning']
        };
      case 3:
        return {
          title: 'Setup Complete!',
          subtitle: 'You\'re all set',
          description: 'Your account is now fully configured. You can start exploring solar solutions and book assessments.',
          features: ['Ready to Go', 'Explore Solutions', 'Book Assessments']
        };
      default:
        return {
          title: 'Complete Your Profile',
          subtitle: 'Tell us about yourself',
          description: 'We need a few details to personalize your solar experience.',
          features: ['Personalized Solar Solutions', 'Accurate Assessment', 'Better Service']
        };
    }
  };

  // Form starts on LEFT for step 1 & 3, RIGHT for step 2
  const isFormLeft = currentStep === 1 || currentStep === 3;

  return (
    <>
      <Helmet>
        <title>Complete Your Account Setup | Salfer Engineering</title>
        <meta name="description" content="Finish setting up your Salfer Engineering account by providing your personal information and address details to access your solar project dashboard." />
      </Helmet>

      <div className="new-setup-page">
        {/* FORM SECTION - Step 1: Left, Step 2: Right, Step 3: Left */}
        <div className={`new-setup-form-container ${isFormLeft ? 'form-left' : 'form-right'}`}>
          <div className="new-setup-form-wrapper">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <>
                <div className="new-setup-form-header">
                  <h2 className="new-setup-form-title">Complete Your Profile</h2>
                  <p className="new-setup-form-subtitle">Tell us more about yourself</p>
                </div>

                {clientData && (
                  <div className="new-setup-info-box">
                    <p className="new-setup-info-text">
                      Welcome, <strong className="new-setup-welcome-name">{clientData.contactFirstName} {clientData.contactLastName}</strong>!
                    </p>
                    <p className="new-setup-info-subtext">
                      Your name is already saved. Please complete the rest of your profile.
                    </p>
                  </div>
                )}

                <form className="new-setup-form">
                  {/* ACCOUNT TYPE - WITH ICON */}
                  <div className="new-setup-form-group">
                    <label className="new-setup-form-label">Account Type <span className="new-setup-required">*</span></label>
                    <div className="new-setup-select-wrapper">
                      {getAccountTypeIcon()}
                      <select
                        name="accountType"
                        value={formData.accountType}
                        onChange={handleChange}
                        className={`new-setup-select ${errors.accountType ? 'error' : ''}`}
                      >
                        <option value="residential">Residential</option>
                        <option value="company">Company</option>
                        <option value="industrial">Industrial</option>
                      </select>
                    </div>
                    {errors.accountType && <span className="new-setup-error-message">{errors.accountType}</span>}
                  </div>

                  {/* BUSINESS/COMPANY NAME */}
                  {(formData.accountType === 'company' || formData.accountType === 'industrial') && (
                    <div className="new-setup-form-group">
                      <label className="new-setup-form-label">{getBusinessLabel()} <span className="new-setup-required">*</span></label>
                      <div className="new-setup-input-wrapper">
                        {getBusinessIcon()}
                        <input
                          type="text"
                          name="companyName"
                          value={formData.companyName}
                          onChange={handleChange}
                          className={`new-setup-form-input ${errors.companyName ? 'error' : ''}`}
                          placeholder={getBusinessPlaceholder()}
                        />
                      </div>
                      {errors.companyName && <span className="new-setup-error-message">{errors.companyName}</span>}
                    </div>
                  )}

                  {/* PHONE NUMBER */}
                  <div className="new-setup-form-group">
                    <label className="new-setup-form-label">Phone Number <span className="new-setup-required">*</span></label>
                    <div className="new-setup-input-wrapper">
                      <FaPhone className="new-setup-input-icon" />
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        className={`new-setup-form-input ${errors.phoneNumber ? 'error' : ''}`}
                        placeholder="09XXXXXXXXX"
                      />
                    </div>
                    {errors.phoneNumber && <span className="new-setup-error-message">{errors.phoneNumber}</span>}
                  </div>

                  {/* BIRTHDAY */}
                  <div className="new-setup-form-group">
                    <label className="new-setup-form-label">Birthday <span className="new-setup-required">*</span></label>
                    <div className="new-setup-birthday-row">
                      <div className="new-setup-select-wrapper">
                        <FaCalendarAlt className="new-setup-select-icon" />
                        <select
                          name="birthMonth"
                          value={formData.birthMonth}
                          onChange={handleChange}
                          className={`new-setup-select ${errors.birthMonth ? 'error' : ''}`}
                        >
                          <option value="">Month</option>
                          {months.map((month, index) => (
                            <option key={index} value={index + 1}>{month}</option>
                          ))}
                        </select>
                      </div>

                      <div className="new-setup-select-wrapper">
                        <select
                          name="birthDay"
                          value={formData.birthDay}
                          onChange={handleChange}
                          className={`new-setup-select ${errors.birthDay ? 'error' : ''}`}
                        >
                          <option value="">Day</option>
                          {days.map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                      </div>

                      <div className="new-setup-select-wrapper">
                        <select
                          name="birthYear"
                          value={formData.birthYear}
                          onChange={handleChange}
                          className={`new-setup-select ${errors.birthYear ? 'error' : ''}`}
                        >
                          <option value="">Year</option>
                          {years.map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {(errors.birthMonth || errors.birthDay || errors.birthYear) && (
                      <span className="new-setup-error-message">Complete birthday is required</span>
                    )}
                  </div>

                  <div className="new-setup-form-actions">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="new-setup-btn-next"
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
                <div className="new-setup-form-header">
                  <h2 className="new-setup-form-title">Address Information</h2>
                  <p className="new-setup-form-subtitle">Where are you located?</p>
                </div>

                {apiError && (
                  <div className="new-setup-api-error">
                    <span className="new-setup-error-message">{apiError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="new-setup-form">
                  {/* HOUSE/BUILDING NUMBER */}
                  <div className="new-setup-form-group">
                    <label className="new-setup-form-label">House/Building No. <span className="new-setup-required">*</span></label>
                    <div className="new-setup-input-wrapper">
                      <FaHome className="new-setup-input-icon" />
                      <input
                        type="text"
                        name="houseOrBuilding"
                        value={formData.houseOrBuilding}
                        onChange={handleChange}
                        className={`new-setup-form-input ${errors.houseOrBuilding ? 'error' : ''}`}
                        placeholder="Enter house/building number"
                      />
                    </div>
                    {errors.houseOrBuilding && <span className="new-setup-error-message">{errors.houseOrBuilding}</span>}
                  </div>

                  {/* STREET */}
                  <div className="new-setup-form-group">
                    <label className="new-setup-form-label">Street <span className="new-setup-required">*</span></label>
                    <div className="new-setup-input-wrapper">
                      <FaRoad className="new-setup-input-icon" />
                      <input
                        type="text"
                        name="street"
                        value={formData.street}
                        onChange={handleChange}
                        className={`new-setup-form-input ${errors.street ? 'error' : ''}`}
                        placeholder="Enter street name"
                      />
                    </div>
                    {errors.street && <span className="new-setup-error-message">{errors.street}</span>}
                  </div>

                  {/* BARANGAY */}
                  <div className="new-setup-form-group">
                    <label className="new-setup-form-label">Barangay <span className="new-setup-required">*</span></label>
                    <div className="new-setup-input-wrapper">
                      <FaCity className="new-setup-input-icon" />
                      <input
                        type="text"
                        name="barangay"
                        value={formData.barangay}
                        onChange={handleChange}
                        className={`new-setup-form-input ${errors.barangay ? 'error' : ''}`}
                        placeholder="Enter barangay"
                      />
                    </div>
                    {errors.barangay && <span className="new-setup-error-message">{errors.barangay}</span>}
                  </div>

                  {/* CITY/MUNICIPALITY */}
                  <div className="new-setup-form-group">
                    <label className="new-setup-form-label">City/Municipality <span className="new-setup-required">*</span></label>
                    <div className="new-setup-input-wrapper">
                      <FaCity className="new-setup-input-icon" />
                      <input
                        type="text"
                        name="cityMunicipality"
                        value={formData.cityMunicipality}
                        onChange={handleChange}
                        className={`new-setup-form-input ${errors.cityMunicipality ? 'error' : ''}`}
                        placeholder="Enter city/municipality"
                      />
                    </div>
                    {errors.cityMunicipality && <span className="new-setup-error-message">{errors.cityMunicipality}</span>}
                  </div>

                  {/* PROVINCE */}
                  <div className="new-setup-form-group">
                    <label className="new-setup-form-label">Province <span className="new-setup-required">*</span></label>
                    <div className="new-setup-input-wrapper">
                      <FaGlobe className="new-setup-input-icon" />
                      <input
                        type="text"
                        name="province"
                        value={formData.province}
                        onChange={handleChange}
                        className={`new-setup-form-input ${errors.province ? 'error' : ''}`}
                        placeholder="Enter province"
                      />
                    </div>
                    {errors.province && <span className="new-setup-error-message">{errors.province}</span>}
                  </div>

                  {/* ZIP CODE */}
                  <div className="new-setup-form-group">
                    <label className="new-setup-form-label">ZIP Code <span className="new-setup-required">*</span></label>
                    <div className="new-setup-input-wrapper">
                      <FaMailBulk className="new-setup-input-icon" />
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        className={`new-setup-form-input ${errors.zipCode ? 'error' : ''}`}
                        placeholder="Enter ZIP code"
                        maxLength="4"
                      />
                    </div>
                    {errors.zipCode && <span className="new-setup-error-message">{errors.zipCode}</span>}
                  </div>

                  <div className="new-setup-form-actions">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="new-setup-btn-back"
                    >
                      <FaArrowLeft /> Back
                    </button>
                    <button
                      type="submit"
                      className="new-setup-btn-submit"
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
              <div className="new-setup-success-container">
                <div className="new-setup-success-icon">
                  <FaCheckCircle />
                </div>
                <h2 className="new-setup-success-title">✓ All Set!</h2>
                <p className="new-setup-success-message">
                  Your account setup is complete. You can now access your dashboard and start booking assessments.
                </p>
                <button
                  onClick={handleContinueToDashboard}
                  className="new-setup-btn-dashboard"
                >
                  Continue to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>

        {/* BRANDING SECTION - Opposite of form */}
        <div className={`new-setup-branding ${!isFormLeft ? 'branding-left' : 'branding-right'}`}>
          <div className="new-setup-branding-content">
            <div className="new-setup-brand-header">
              <img src={logo} alt="Salfer Engineering" className="new-setup-brand-logo" />
              <h1 className="new-setup-brand-name">Salfer Engineering</h1>
            </div>
            <h2 className="new-setup-brand-tagline">
              {getBrandingContent(currentStep).title}
            </h2>
            <p className="new-setup-brand-description">
              {getBrandingContent(currentStep).description}
            </p>
            <div className="new-setup-brand-features">
              {getBrandingContent(currentStep).features.map((feature, index) => (
                <div className="new-setup-brand-feature" key={index}>
                  <span className="new-setup-feature-dot"></span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SetupAccount;