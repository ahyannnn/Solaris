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

  // Generate years (last 100 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  
  // Months
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Days (1-31)
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  // Form Data
  const [formData, setFormData] = useState({
    // Personal Info
    firstName: '',
    middleName: '',
    lastName: '',
    phoneNumber: '',
    birthMonth: '',
    birthDay: '',
    birthYear: '',
    
    // Address Info
    houseNumber: '',
    street: '',
    barangay: '',
    municipality: '',
    province: '',
    zipCode: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  // Validate Step 1 (Personal Info)
  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
    if (!formData.birthMonth) newErrors.birthMonth = 'Month is required';
    if (!formData.birthDay) newErrors.birthDay = 'Day is required';
    if (!formData.birthYear) newErrors.birthYear = 'Year is required';
    
    // Phone number validation (Philippines format)
    if (formData.phoneNumber && !/^(09|\+639)\d{9}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = 'Enter a valid Philippine mobile number (09XXXXXXXXX or +639XXXXXXXXX)';
    }
    
    return newErrors;
  };

  // Validate Step 2 (Address Info)
  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.houseNumber) newErrors.houseNumber = 'House number is required';
    if (!formData.street) newErrors.street = 'Street is required';
    if (!formData.barangay) newErrors.barangay = 'Barangay is required';
    if (!formData.municipality) newErrors.municipality = 'Municipality is required';
    if (!formData.province) newErrors.province = 'Province is required';
    if (!formData.zipCode) newErrors.zipCode = 'ZIP code is required';
    
    // ZIP code validation
    if (formData.zipCode && !/^\d{4}$/.test(formData.zipCode)) {
      newErrors.zipCode = 'ZIP code must be 4 digits';
    }
    
    return newErrors;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      const stepErrors = validateStep1();
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        return;
      }
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (currentStep === 2) {
      const stepErrors = validateStep2();
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        return;
      }
    }

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Save to localStorage or send to backend
      localStorage.setItem('userSetupComplete', 'true');
      
      // Go to success step
      setCurrentStep(3);
    } catch (error) {
      console.error('Setup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueToDashboard = () => {
    navigate('/dashboard');
  };

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
                    {errors.birthMonth && <span className="setup-error-message">{errors.birthMonth}</span>}
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

                <form onSubmit={handleSubmit} className="setup-form">
                  {/* HOUSE NUMBER */}
                  <div className="setup-form-group">
                    <label className="setup-form-label">House/Unit No. <span className="setup-required">*</span></label>
                    <div className="setup-input-wrapper">
                      <FaHome className="setup-input-icon" />
                      <input
                        type="text"
                        name="houseNumber"
                        value={formData.houseNumber}
                        onChange={handleChange}
                        className={`setup-form-input ${errors.houseNumber ? 'error' : ''}`}
                        placeholder="Enter house/unit number"
                      />
                    </div>
                    {errors.houseNumber && <span className="setup-error-message">{errors.houseNumber}</span>}
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

                  {/* MUNICIPALITY/CITY */}
                  <div className="setup-form-group">
                    <label className="setup-form-label">Municipality/City <span className="setup-required">*</span></label>
                    <div className="setup-input-wrapper">
                      <FaCity className="setup-input-icon" />
                      <input
                        type="text"
                        name="municipality"
                        value={formData.municipality}
                        onChange={handleChange}
                        className={`setup-form-input ${errors.municipality ? 'error' : ''}`}
                        placeholder="Enter municipality/city"
                      />
                    </div>
                    {errors.municipality && <span className="setup-error-message">{errors.municipality}</span>}
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