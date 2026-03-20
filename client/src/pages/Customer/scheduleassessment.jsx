import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaSun, 
  FaBolt, 
  FaLeaf, 
  FaHome, 
  FaCalendarAlt, 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt,
  FaBuilding,
  FaRuler,
  FaMoneyBillWave,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaArrowRight,
  FaArrowLeft,
  FaFileInvoice,
  FaQrcode,
  FaSpinner,
  FaSearch,
  FaChartLine,
  FaBatteryFull,
  FaPlug,
  FaSolarPanel,
  FaRoad,
  FaCity,
  FaGlobe,
  FaMailBulk,
  FaHashtag,
  FaHome as FaHouse
} from 'react-icons/fa';
import '../../styles/Customer/scheduleassessment.css';

const ScheduleAssessment = () => {
  // Step tracking: 'form' | 'payment' | 'confirmation'
  const [currentStep, setCurrentStep] = useState('form');

  // User authentication state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');

  // Estimator state
  const [estimatorData, setEstimatorData] = useState({
    monthlyBill: '',
    electricityRate: '11.50',
    averageSunHours: '5',
    systemType: 'grid-tie',
    usagePattern: 'daytime'
  });

  const [estimationResult, setEstimationResult] = useState(null);

  // Booking form state - DISSECTED FIELDS
  const [formData, setFormData] = useState({
    // Name fields
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    
    // Address fields - Updated to match Address table
    houseOrBuilding: '',
    street: '',
    barangay: '',
    cityMunicipality: '',
    province: '',
    zipCode: '',
    
    // Property fields
    propertyType: 'residential',
    desiredCapacity: '',
    roofType: '',
    preferredDate: ''
  });

  // Terms and confirmation state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');

  // Invoice/Booking data from system
  const [bookingData, setBookingData] = useState({
    bookingId: null,
    assessmentFee: 1500,
    invoiceNumber: null
  });

  // Validation errors
  const [validationErrors, setValidationErrors] = useState({});

  // Fetch client data on component mount
  useEffect(() => {
    fetchClientData();
    fetchClientAddresses();
  }, []);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      
      if (!token) {
        setError('Please log in to book an assessment');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/clients/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const clientData = response.data?.client;

      if (!clientData) {
        console.error('No client data in response:', response.data);
        setError('Client profile not found. Please complete your profile first.');
        setLoading(false);
        return;
      }
      
      setUser(clientData);

      // Extract name fields
      const firstName = clientData?.contactFirstName || '';
      const middleName = clientData?.contactMiddleName || '';
      const lastName = clientData?.contactLastName || '';
      const email = clientData?.email || '';
      const contactNumber = clientData?.contactNumber || '';

      // Pre-fill form with client data (name fields only, address will come from addresses)
      setFormData(prev => ({
        ...prev,
        firstName: firstName || prev.firstName,
        middleName: middleName || prev.middleName,
        lastName: lastName || prev.lastName,
        email: email || prev.email,
        contactNumber: contactNumber || prev.contactNumber
      }));

    } catch (err) {
      console.error('Error fetching client data:', err);
      
      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else if (err.response?.status === 404) {
        setError('Client profile not found. Please complete your profile first.');
      } else {
        setError(err.response?.data?.message || 'Failed to load client information. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchClientAddresses = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/clients/me/addresses`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const fetchedAddresses = response.data?.addresses || [];
      setAddresses(fetchedAddresses);

      // If there's a primary address, select it and populate form
      if (fetchedAddresses.length > 0) {
        const primaryAddress = fetchedAddresses.find(addr => addr.isPrimary) || fetchedAddresses[0];
        setSelectedAddressId(primaryAddress._id);
        
        // Populate address fields in form
        setFormData(prev => ({
          ...prev,
          houseOrBuilding: primaryAddress.houseOrBuilding || '',
          street: primaryAddress.street || '',
          barangay: primaryAddress.barangay || '',
          cityMunicipality: primaryAddress.cityMunicipality || '',
          province: primaryAddress.province || '',
          zipCode: primaryAddress.zipCode || ''
        }));
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
      // Don't show error for addresses, just log it
    }
  };

  const handleAddressChange = (e) => {
    const addressId = e.target.value;
    setSelectedAddressId(addressId);
    
    const selectedAddress = addresses.find(addr => addr._id === addressId);
    if (selectedAddress) {
      setFormData(prev => ({
        ...prev,
        houseOrBuilding: selectedAddress.houseOrBuilding || '',
        street: selectedAddress.street || '',
        barangay: selectedAddress.barangay || '',
        cityMunicipality: selectedAddress.cityMunicipality || '',
        province: selectedAddress.province || '',
        zipCode: selectedAddress.zipCode || ''
      }));
    }
  };

  const handleEstimatorChange = (e) => {
    const { name, value } = e.target;
    setEstimatorData(prev => ({ ...prev, [name]: value }));
  };

  const calculateSavings = () => {
    const monthlyBill = parseFloat(estimatorData.monthlyBill) || 0;
    const rate = parseFloat(estimatorData.electricityRate) || 11.50;
    const sunHours = parseFloat(estimatorData.averageSunHours) || 5;
    const systemType = estimatorData.systemType;
    const usagePattern = estimatorData.usagePattern;

    const monthlyConsumption = monthlyBill / rate;
    const dailyConsumption = monthlyConsumption / 30;

    let recommendedSize = dailyConsumption / sunHours;
    recommendedSize = Math.ceil(recommendedSize * 2) / 2;

    let selfConsumptionRatio = usagePattern === 'daytime' ? 0.8 : 0.4;
    let exportRatio = usagePattern === 'daytime' ? 0.2 : 0.6;

    let systemCostPerKw = 0;
    let batteryCost = 0;
    let systemEfficiency = 0;
    let systemDescription = '';

    switch (systemType) {
      case 'grid-tie':
        systemCostPerKw = 70000;
        batteryCost = 0;
        systemEfficiency = 0.85;
        systemDescription = 'Grid-tied (No battery)';
        break;
      case 'hybrid':
        systemCostPerKw = 75000;
        batteryCost = 120000;
        systemEfficiency = 0.9;
        systemDescription = 'Hybrid (With battery)';
        break;
      case 'off-grid':
        systemCostPerKw = 80000;
        batteryCost = 200000;
        systemEfficiency = 0.8;
        systemDescription = 'Off-grid (Independent)';
        break;
      default:
        systemCostPerKw = 70000;
        batteryCost = 0;
        systemEfficiency = 0.85;
    }

    const systemCost = recommendedSize * systemCostPerKw;
    const totalSystemCost = systemCost + batteryCost;

    const dailyProduction = recommendedSize * sunHours * systemEfficiency;
    const monthlyProduction = dailyProduction * 30;

    const selfConsumedEnergy = monthlyProduction * selfConsumptionRatio;
    const selfConsumptionSavings = selfConsumedEnergy * rate;

    const exportRate = systemType === 'grid-tie' ? rate * 0.7 : 0;
    const exportedEnergy = monthlyProduction * exportRatio;
    const exportSavings = exportedEnergy * exportRate;

    const estimatedMonthlySavings = selfConsumptionSavings + exportSavings;
    const gridDependency = Math.max(0, ((monthlyConsumption - monthlyProduction) / monthlyConsumption * 100)).toFixed(1);

    const annualSavings = estimatedMonthlySavings * 12;
    const paybackPeriod = totalSystemCost / annualSavings;

    const co2PerKwh = 0.7;
    const annualProduction = monthlyProduction * 12;
    const co2OffsetPerYear = Math.round(annualProduction * co2PerKwh);

    let cumulativeSavings = 0;
    for (let year = 1; year <= 25; year++) {
      cumulativeSavings += annualSavings * Math.pow(1.03, year - 1);
    }
    const total25YearSavingsWithInflation = Math.round(cumulativeSavings);

    const panelsNeeded = Math.ceil(recommendedSize * 1000 / 400);
    const roofSpaceNeeded = panelsNeeded * 2;

    setEstimationResult({
      recommendedSize,
      panelsNeeded,
      roofSpaceNeeded,
      estimatedMonthlySavings: Math.round(estimatedMonthlySavings),
      monthlyProduction: Math.round(monthlyProduction),
      monthlyConsumption: Math.round(monthlyConsumption),
      selfConsumptionRatio: selfConsumptionRatio * 100,
      exportRatio: exportRatio * 100,
      gridDependency,
      systemCost: Math.round(totalSystemCost),
      paybackPeriod: Math.round(paybackPeriod * 10) / 10,
      co2OffsetPerYear,
      total25YearSavings: total25YearSavingsWithInflation,
      systemDescription,
      systemType,
      dailyProduction: Math.round(dailyProduction * 10) / 10,
      annualSavings: Math.round(annualSavings)
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Validate name fields
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email is invalid';
    
    if (!formData.contactNumber.trim()) errors.contactNumber = 'Contact number is required';
    
    // Validate address fields
    if (!formData.houseOrBuilding.trim()) errors.houseOrBuilding = 'House/Building number is required';
    if (!formData.street.trim()) errors.street = 'Street is required';
    if (!formData.barangay.trim()) errors.barangay = 'Barangay is required';
    if (!formData.cityMunicipality.trim()) errors.cityMunicipality = 'City/Municipality is required';
    if (!formData.province.trim()) errors.province = 'Province is required';
    if (!formData.zipCode.trim()) errors.zipCode = 'Zip code is required';
    
    // Validate property fields
    if (!formData.propertyType) errors.propertyType = 'Property type is required';
    if (!formData.preferredDate) errors.preferredDate = 'Preferred date is required';
    
    return errors;
  };

  const handleSubmitClick = (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
      return;
    }
    
    setShowConfirmDialog(true);
  };

  const getFullName = () => {
    return [formData.firstName, formData.middleName, formData.lastName]
      .filter(part => part && part.trim() !== '')
      .join(' ');
  };

  const getFullAddress = () => {
    const parts = [
      formData.houseOrBuilding,
      formData.street,
      formData.barangay,
      formData.cityMunicipality,
      formData.province,
      formData.zipCode
    ].filter(part => part && part.trim() !== '');
    
    return parts.join(', ');
  };

  const handleConfirmBooking = async () => {
    if (!termsAccepted) {
      alert('Please accept the terms and conditions to proceed');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = sessionStorage.getItem('token');

      // Construct full name and address for backward compatibility
      const fullName = getFullName();
      const fullAddress = getFullAddress();

      const bookingPayload = {
        // Individual fields
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        email: formData.email,
        contactNumber: formData.contactNumber,
        
        // Address fields - using updated names
        houseOrBuilding: formData.houseOrBuilding,
        street: formData.street,
        barangay: formData.barangay,
        cityMunicipality: formData.cityMunicipality,
        province: formData.province,
        zipCode: formData.zipCode,
        
        // Property fields
        propertyType: formData.propertyType,
        desiredCapacity: formData.desiredCapacity,
        roofType: formData.roofType,
        preferredDate: formData.preferredDate,
        
        // For backward compatibility
        fullName,
        fullAddress,
        
        // Estimator data
        estimatorData,
        estimationResult,
        
        userId: user?.userId || user?._id,
        clientId: user?._id,
        addressId: selectedAddressId || null // Include selected address ID if any
      };

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/bookings`, bookingPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setBookingData({
        bookingId: response.data.booking?.bookingReference || response.data.bookingId || 'BK-2024-001',
        assessmentFee: 1500,
        invoiceNumber: response.data.booking?.invoiceNumber || response.data.invoiceNumber || 'INV-2024-001'
      });

      setShowConfirmDialog(false);
      setTermsAccepted(false);
      setCurrentStep('payment');
    } catch (err) {
      console.error('Error submitting booking:', err);
      alert(err.response?.data?.message || 'Failed to submit booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirmDialog(false);
    setTermsAccepted(false);
  };

  const handleFileUpload = (e) => {
    setPaymentProof(e.target.files[0]);
  };

  const handlePaymentSubmit = () => {
    setPaymentStatus('forVerification');
    setCurrentStep('confirmation');
  };

  const handleCashPayment = () => {
    setCurrentStep('confirmation');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-PH').format(value);
  };

  if (loading) {
    return (
      <div className="schedule-loading-container">
        <FaSpinner className="schedule-spinner" />
        <p>Loading your information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="schedule-error-container">
        <FaExclamationTriangle className="schedule-error-icon" />
        <h2>Oops! Something went wrong</h2>
        <p>{error}</p>
        <div className="schedule-error-actions">
          <button onClick={fetchClientData} className="schedule-btn-primary">
            Try Again
          </button>
          <button onClick={() => window.location.href = '/login'} className="schedule-btn-secondary">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Step 1: Booking Form
  if (currentStep === 'form') {
    return (
      <div className="schedule-container">
        <h1 className="schedule-title">Book Your Free Assessment</h1>

        {/* Confirmation Dialog Modal */}
        {showConfirmDialog && (
          <div className="schedule-modal-overlay">
            <div className="schedule-modal">
              <h2 className="schedule-modal-title">Confirm Booking</h2>

              <div className="schedule-modal-content">
                <p><strong>Are you sure you want to proceed with this booking?</strong></p>
                <p>Please review your details:</p>
                <ul className="schedule-details-list">
                  <li><FaUser /> <strong>Name:</strong> {getFullName() || 'Not provided'}</li>
                  <li><FaEnvelope /> <strong>Email:</strong> {formData.email || 'Not provided'}</li>
                  <li><FaPhone /> <strong>Contact:</strong> {formData.contactNumber || 'Not provided'}</li>
                  <li><FaMapMarkerAlt /> <strong>Address:</strong> {getFullAddress() || 'Not provided'}</li>
                  <li><FaHome /> <strong>Property Type:</strong> {formData.propertyType || 'Not provided'}</li>
                  <li><FaCalendarAlt /> <strong>Preferred Date:</strong> {formData.preferredDate || 'Not provided'}</li>
                  <li><FaMoneyBillWave /> <strong>Assessment Fee:</strong> ₱1,500.00</li>
                </ul>
              </div>

              <div className="schedule-modal-checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                  />
                  <span>
                    I have read and agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms and Conditions</a> and
                    <a href="/privacy" target="_blank" rel="noopener noreferrer"> Privacy Policy</a>
                  </span>
                </label>
              </div>

              <div className="schedule-modal-actions">
                <button onClick={handleCancelConfirm} className="schedule-btn-secondary">
                  Cancel
                </button>
                <button
                  onClick={handleConfirmBooking}
                  disabled={!termsAccepted || isSubmitting}
                  className="schedule-btn-success"
                >
                  {isSubmitting ? <><FaSpinner className="schedule-spinner-small" /> Processing...</> : 'Confirm Booking'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Savings Estimator */}
        <div className="schedule-estimator-card">
          <h3><FaChartLine /> Solar Savings Estimator</h3>
          <p className="schedule-estimator-subtitle">Enter your details below for a personalized estimate</p>

          <div className="schedule-estimator-grid">
            <div className="schedule-form-group">
              <label><FaMoneyBillWave /> Monthly Electricity Bill (₱)</label>
              <input
                type="number"
                name="monthlyBill"
                value={estimatorData.monthlyBill}
                onChange={handleEstimatorChange}
                placeholder="e.g., 5000"
                className="schedule-input"
              />
            </div>

            <div className="schedule-form-group">
              <label><FaBolt /> Electricity Rate (₱/kWh)</label>
              <input
                type="number"
                name="electricityRate"
                value={estimatorData.electricityRate}
                onChange={handleEstimatorChange}
                placeholder="e.g., 11.50"
                step="0.1"
                className="schedule-input"
              />
              <small>Meralco avg: ₱11.50/kWh</small>
            </div>

            <div className="schedule-form-group">
              <label><FaSun /> Average Sun Hours</label>
              <input
                type="number"
                name="averageSunHours"
                value={estimatorData.averageSunHours}
                onChange={handleEstimatorChange}
                placeholder="e.g., 5"
                step="0.5"
                className="schedule-input"
              />
              <small>PH average: 5-6 hours</small>
            </div>

            <div className="schedule-form-group">
              <label><FaSolarPanel /> System Type</label>
              <select
                name="systemType"
                value={estimatorData.systemType}
                onChange={handleEstimatorChange}
                className="schedule-select"
              >
                <option value="grid-tie">Grid-tie (No battery)</option>
                <option value="hybrid">Hybrid (With battery backup)</option>
                <option value="off-grid">Off-grid (Complete independence)</option>
              </select>
            </div>

            <div className="schedule-form-group">
              <label><FaClock /> Usage Pattern</label>
              <select
                name="usagePattern"
                value={estimatorData.usagePattern}
                onChange={handleEstimatorChange}
                className="schedule-select"
              >
                <option value="daytime">Mostly Daytime</option>
                <option value="nighttime">Mostly Nighttime</option>
                <option value="mixed">Mixed (balanced usage)</option>
              </select>
            </div>

            <div className="schedule-form-group schedule-button-group">
              <button
                onClick={calculateSavings}
                disabled={!estimatorData.monthlyBill}
                className="schedule-btn-calculate"
              >
                <FaSearch /> Calculate Savings
              </button>
            </div>
          </div>

          {/* Estimation Results */}
          {estimationResult && (
            <div className="schedule-results-card">
              <h4><FaChartLine /> Your Personalized Solar Estimate</h4>

              <div className="schedule-results-grid">
                <div className="schedule-result-item">
                  <FaSolarPanel className="schedule-result-icon" />
                  <span className="schedule-result-label">Recommended System</span>
                  <span className="schedule-result-value">{estimationResult.recommendedSize} kW</span>
                  <small>{estimationResult.systemDescription}</small>
                </div>

                <div className="schedule-result-item">
                  <FaMoneyBillWave className="schedule-result-icon" />
                  <span className="schedule-result-label">Monthly Savings</span>
                  <span className="schedule-result-value highlight">
                    {formatCurrency(estimationResult.estimatedMonthlySavings)}
                  </span>
                </div>

                <div className="schedule-result-item">
                  <FaBolt className="schedule-result-icon" />
                  <span className="schedule-result-label">System Cost</span>
                  <span className="schedule-result-value">{formatCurrency(estimationResult.systemCost)}</span>
                  <small>{estimationResult.panelsNeeded} panels • {estimationResult.roofSpaceNeeded} sqm</small>
                </div>

                <div className="schedule-result-item">
                  <FaPlug className="schedule-result-icon" />
                  <span className="schedule-result-label">Grid Dependency</span>
                  <span className="schedule-result-value">{estimationResult.gridDependency}%</span>
                </div>

                <div className="schedule-result-item">
                  <FaClock className="schedule-result-icon" />
                  <span className="schedule-result-label">Payback Period</span>
                  <span className="schedule-result-value">{estimationResult.paybackPeriod} years</span>
                </div>

                <div className="schedule-result-item">
                  <FaLeaf className="schedule-result-icon" />
                  <span className="schedule-result-label">CO₂ Offset/Year</span>
                  <span className="schedule-result-value">{formatNumber(estimationResult.co2OffsetPerYear)} kg</span>
                </div>
              </div>

              <p className="schedule-disclaimer">
                *This is a preliminary estimate. Actual savings may vary based on site conditions.
              </p>
            </div>
          )}
        </div>

        <h2 className="schedule-subtitle">Book Your Site Assessment</h2>
        
        <form onSubmit={handleSubmitClick} className="schedule-form">
          <h3 className="schedule-section-title"><FaUser /> Personal Information</h3>
          <div className="schedule-form-grid">
            <div className="schedule-form-group">
              <label htmlFor="firstName"><FaUser /> First Name *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className={`schedule-input ${validationErrors.firstName ? 'error' : ''}`}
              />
              {validationErrors.firstName && <small className="schedule-error-text">{validationErrors.firstName}</small>}
            </div>

            <div className="schedule-form-group">
              <label htmlFor="middleName"><FaUser /> Middle Name</label>
              <input
                type="text"
                id="middleName"
                name="middleName"
                value={formData.middleName}
                onChange={handleInputChange}
                className="schedule-input"
              />
            </div>

            <div className="schedule-form-group">
              <label htmlFor="lastName"><FaUser /> Last Name *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className={`schedule-input ${validationErrors.lastName ? 'error' : ''}`}
              />
              {validationErrors.lastName && <small className="schedule-error-text">{validationErrors.lastName}</small>}
            </div>

            <div className="schedule-form-group">
              <label htmlFor="email"><FaEnvelope /> Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`schedule-input ${validationErrors.email ? 'error' : ''}`}
              />
              {validationErrors.email && <small className="schedule-error-text">{validationErrors.email}</small>}
            </div>

            <div className="schedule-form-group">
              <label htmlFor="contactNumber"><FaPhone /> Contact Number *</label>
              <input
                type="tel"
                id="contactNumber"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={handleInputChange}
                className={`schedule-input ${validationErrors.contactNumber ? 'error' : ''}`}
                placeholder="0917xxxxxxx"
              />
              {validationErrors.contactNumber && <small className="schedule-error-text">{validationErrors.contactNumber}</small>}
            </div>
          </div>

          <h3 className="schedule-section-title"><FaMapMarkerAlt /> Address Details</h3>
          
          {/* Address Selection Dropdown */}
          {addresses.length > 0 && (
            <div className="schedule-form-group schedule-full-width">
              <label htmlFor="addressSelect"><FaHome /> Select Saved Address</label>
              <select
                id="addressSelect"
                value={selectedAddressId}
                onChange={handleAddressChange}
                className="schedule-select"
              >
                <option value="">-- Select an address --</option>
                {addresses.map(addr => (
                  <option key={addr._id} value={addr._id}>
                    {addr.houseOrBuilding} {addr.street}, {addr.barangay}, {addr.cityMunicipality} {addr.isPrimary ? '(Primary)' : ''}
                  </option>
                ))}
              </select>
              <small>Select a saved address or fill in the fields below</small>
            </div>
          )}

          <div className="schedule-form-grid">
            <div className="schedule-form-group">
              <label htmlFor="houseOrBuilding"><FaHashtag /> House/Bldg. No. *</label>
              <input
                type="text"
                id="houseOrBuilding"
                name="houseOrBuilding"
                value={formData.houseOrBuilding}
                onChange={handleInputChange}
                className={`schedule-input ${validationErrors.houseOrBuilding ? 'error' : ''}`}
                placeholder="123"
              />
              {validationErrors.houseOrBuilding && <small className="schedule-error-text">{validationErrors.houseOrBuilding}</small>}
            </div>

            <div className="schedule-form-group">
              <label htmlFor="street"><FaRoad /> Street *</label>
              <input
                type="text"
                id="street"
                name="street"
                value={formData.street}
                onChange={handleInputChange}
                className={`schedule-input ${validationErrors.street ? 'error' : ''}`}
                placeholder="Rizal Street"
              />
              {validationErrors.street && <small className="schedule-error-text">{validationErrors.street}</small>}
            </div>

            <div className="schedule-form-group">
              <label htmlFor="barangay"><FaBuilding /> Barangay *</label>
              <input
                type="text"
                id="barangay"
                name="barangay"
                value={formData.barangay}
                onChange={handleInputChange}
                className={`schedule-input ${validationErrors.barangay ? 'error' : ''}`}
                placeholder="Barangay San Jose"
              />
              {validationErrors.barangay && <small className="schedule-error-text">{validationErrors.barangay}</small>}
            </div>

            <div className="schedule-form-group">
              <label htmlFor="cityMunicipality"><FaCity /> City/Municipality *</label>
              <input
                type="text"
                id="cityMunicipality"
                name="cityMunicipality"
                value={formData.cityMunicipality}
                onChange={handleInputChange}
                className={`schedule-input ${validationErrors.cityMunicipality ? 'error' : ''}`}
                placeholder="Manila"
              />
              {validationErrors.cityMunicipality && <small className="schedule-error-text">{validationErrors.cityMunicipality}</small>}
            </div>

            <div className="schedule-form-group">
              <label htmlFor="province"><FaGlobe /> Province *</label>
              <input
                type="text"
                id="province"
                name="province"
                value={formData.province}
                onChange={handleInputChange}
                className={`schedule-input ${validationErrors.province ? 'error' : ''}`}
                placeholder="Metro Manila"
              />
              {validationErrors.province && <small className="schedule-error-text">{validationErrors.province}</small>}
            </div>

            <div className="schedule-form-group">
              <label htmlFor="zipCode"><FaMailBulk /> Zip Code *</label>
              <input
                type="text"
                id="zipCode"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleInputChange}
                className={`schedule-input ${validationErrors.zipCode ? 'error' : ''}`}
                placeholder="1000"
                maxLength="4"
              />
              {validationErrors.zipCode && <small className="schedule-error-text">{validationErrors.zipCode}</small>}
            </div>
          </div>

          <h3 className="schedule-section-title"><FaHome /> Property Details</h3>
          <div className="schedule-form-grid">
            <div className="schedule-form-group">
              <label htmlFor="propertyType"><FaHome /> Property Type *</label>
              <select
                id="propertyType"
                name="propertyType"
                value={formData.propertyType}
                onChange={handleInputChange}
                className={`schedule-select ${validationErrors.propertyType ? 'error' : ''}`}
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
              </select>
              {validationErrors.propertyType && <small className="schedule-error-text">{validationErrors.propertyType}</small>}
            </div>

            <div className="schedule-form-group">
              <label htmlFor="desiredCapacity"><FaRuler /> Desired Capacity (kW)</label>
              <input
                type="text"
                id="desiredCapacity"
                name="desiredCapacity"
                value={formData.desiredCapacity}
                onChange={handleInputChange}
                className="schedule-input"
                placeholder="e.g., 5kW"
              />
            </div>

            <div className="schedule-form-group">
              <label htmlFor="roofType"><FaBuilding /> Roof Type</label>
              <select
                id="roofType"
                name="roofType"
                value={formData.roofType}
                onChange={handleInputChange}
                className="schedule-select"
              >
                <option value="">Select roof type</option>
                <option value="concrete">Concrete</option>
                <option value="metal">Metal</option>
                <option value="tile">Tile</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="schedule-form-group">
              <label htmlFor="preferredDate"><FaCalendarAlt /> Preferred Start Date *</label>
              <input
                type="date"
                id="preferredDate"
                name="preferredDate"
                value={formData.preferredDate}
                onChange={handleInputChange}
                className={`schedule-input ${validationErrors.preferredDate ? 'error' : ''}`}
                min={new Date().toISOString().split('T')[0]}
              />
              {validationErrors.preferredDate && <small className="schedule-error-text">{validationErrors.preferredDate}</small>}
            </div>
          </div>

          <div className="schedule-fee-card">
            <div className="schedule-fee-info">
              <FaMoneyBillWave className="schedule-fee-icon" />
              <div>
                <strong>Assessment Fee: ₱1,500.00</strong>
                <p>Non-refundable fee for 7-day monitoring</p>
              </div>
            </div>
          </div>

          <button type="submit" className="schedule-btn-submit">
            <FaCalendarAlt /> Submit Booking Request
          </button>
        </form>
      </div>
    );
  }

  // Step 2: Payment Processing
  if (currentStep === 'payment') {
    return (
      <div className="schedule-container">
        <h1 className="schedule-title">Complete Your Payment</h1>

        <div className="schedule-summary-card">
          <h3><FaFileInvoice /> Booking Summary</h3>
          <div className="schedule-summary-details">
            <p><strong>Booking ID:</strong> {bookingData.bookingId}</p>
            <p><strong>Invoice:</strong> {bookingData.invoiceNumber}</p>
            <p><strong>Amount Due:</strong> <span className="schedule-amount">₱{bookingData.assessmentFee}.00</span></p>
            <p><strong>Status:</strong> <span className="schedule-status-pending">Pending Payment</span></p>
          </div>
        </div>

        <h3 className="schedule-payment-title">Select Payment Method</h3>

        <div className="schedule-payment-options">
          {/* GCash Option */}
          <div className={`schedule-payment-card ${paymentMethod === 'gcash' ? 'selected' : ''}`}>
            <label className="schedule-radio-label">
              <input
                type="radio"
                name="paymentMethod"
                value="gcash"
                checked={paymentMethod === 'gcash'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <div className="schedule-payment-header">
                <FaQrcode className="schedule-payment-icon" />
                <span>GCash</span>
              </div>
            </label>

            {paymentMethod === 'gcash' && (
              <div className="schedule-gcash-details">
                <div className="schedule-payment-info">
                  <p><strong>GCash Payment Details:</strong></p>
                  <p>Number: 0917XXXXXXX</p>
                  <p>Name: SOLARIS CORP</p>
                  <p>Amount: <span className="schedule-amount">₱{bookingData.assessmentFee}.00</span></p>
                </div>

                <div className="schedule-upload-group">
                  <label htmlFor="proof">Upload Payment Screenshot/Reference *</label>
                  <input
                    type="file"
                    id="proof"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="schedule-file-input"
                  />
                  {paymentProof && <p className="schedule-file-name">Selected: {paymentProof.name}</p>}
                </div>

                <button
                  onClick={handlePaymentSubmit}
                  disabled={!paymentProof}
                  className="schedule-btn-payment"
                >
                  Submit Proof of Payment
                </button>
              </div>
            )}
          </div>

          {/* Cash Option */}
          <div className={`schedule-payment-card ${paymentMethod === 'cash' ? 'selected' : ''}`}>
            <label className="schedule-radio-label">
              <input
                type="radio"
                name="paymentMethod"
                value="cash"
                checked={paymentMethod === 'cash'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <div className="schedule-payment-header">
                <FaMoneyBillWave className="schedule-payment-icon" />
                <span>Cash (Walk-in Payment)</span>
              </div>
            </label>

            {paymentMethod === 'cash' && (
              <div className="schedule-cash-details">
                <p>Please visit our office to pay the assessment fee:</p>
                <div className="schedule-office-info">
                  <p><strong>Address:</strong> SOLARIS Office, Unit 123, Building Name, City</p>
                  <p><strong>Office Hours:</strong> Mon-Fri, 9AM-6PM</p>
                  <p><strong>Amount to Pay:</strong> <span className="schedule-amount">₱{bookingData.assessmentFee}.00</span></p>
                </div>
                <p className="schedule-note">Your booking will be confirmed once payment is received.</p>

                <button onClick={handleCashPayment} className="schedule-btn-payment">
                  I Understand, Proceed
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Confirmation
  if (currentStep === 'confirmation') {
    return (
      <div className="schedule-container">
        <div className="schedule-confirmation-card">
          <FaCheckCircle className="schedule-confirmation-icon" />
          
          <h1 className="schedule-title">
            Booking {paymentStatus === 'paid' ? 'Confirmed!' : 'Received!'}
          </h1>

          <div className="schedule-booking-details">
            <p><strong>Booking ID:</strong> {bookingData.bookingId}</p>
            <p><strong>Invoice:</strong> {bookingData.invoiceNumber}</p>

            {paymentMethod === 'gcash' && paymentStatus === 'forVerification' && (
              <div className="schedule-status-info">
                <FaClock className="schedule-status-icon" />
                <div>
                  <p><strong>Payment Status:</strong> <span className="schedule-status-pending">For Verification</span></p>
                  <p>Your proof of payment is being verified. You'll receive a confirmation email once verified.</p>
                </div>
              </div>
            )}

            {paymentMethod === 'cash' && (
              <div className="schedule-status-info">
                <FaExclamationTriangle className="schedule-status-icon warning" />
                <div>
                  <p><strong>Payment Status:</strong> <span className="schedule-status-pending">Pending Cash Payment</span></p>
                  <p>Please visit our office to complete your payment.</p>
                </div>
              </div>
            )}

            {paymentStatus === 'paid' && (
              <div className="schedule-status-info">
                <FaCheckCircle className="schedule-status-icon success" />
                <div>
                  <p><strong>Payment Status:</strong> <span className="schedule-status-paid">Paid</span></p>
                  <p><strong>Booking Status:</strong> <span className="schedule-status-confirmed">Confirmed</span></p>
                  <p>Your 7-day assessment is scheduled to start on {formData.preferredDate}.</p>
                </div>
              </div>
            )}
          </div>

          <div className="schedule-next-steps">
            <h3>Next Steps:</h3>
            <ul>
              <li><FaUser /> An engineer will be assigned to your site</li>
              <li><FaSolarPanel /> IoT device will be deployed for 7-day monitoring</li>
              <li><FaEnvelope /> You'll receive updates via email/SMS</li>
            </ul>
          </div>

          <button onClick={() => setCurrentStep('form')} className="schedule-btn-secondary">
            <FaCalendarAlt /> Book Another Assessment
          </button>
        </div>
      </div>
    );
  }
};

export default ScheduleAssessment;