// pages/Customer/scheduleassessment.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import { 
  FaUser, 
  FaMapMarkerAlt, 
  FaHome, 
  FaCalendarAlt, 
  FaMoneyBillWave,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaSolarPanel,
  FaPhone,
  FaEnvelope,
  FaArrowRight,
  FaArrowLeft
} from 'react-icons/fa';
import '../../styles/Customer/scheduleassessment.css';

const ScheduleAssessment = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [currentStep, setCurrentStep] = useState('form');
  const [activeCard, setActiveCard] = useState(1); // 1=Personal, 2=Address, 3=Property

  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    contactNumber: '',
    houseOrBuilding: '',
    street: '',
    barangay: '',
    cityMunicipality: '',
    province: '',
    zipCode: '',
    propertyType: 'residential',
    desiredCapacity: '',
    roofType: '',
    preferredDate: ''
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [cardErrors, setCardErrors] = useState({});

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
      
      if (clientData) {
        setUser(clientData);
        setFormData(prev => ({
          ...prev,
          firstName: clientData?.contactFirstName || '',
          middleName: clientData?.contactMiddleName || '',
          lastName: clientData?.contactLastName || '',
          email: clientData?.email || '',
          contactNumber: clientData?.contactNumber || ''
        }));
      }
    } catch (err) {
      setError('Failed to load client information');
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

      if (fetchedAddresses.length > 0) {
        const primaryAddress = fetchedAddresses.find(addr => addr.isPrimary) || fetchedAddresses[0];
        setSelectedAddressId(primaryAddress._id);
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
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
    // Clear card errors when user types
    if (cardErrors[activeCard]) {
      setCardErrors(prev => ({ ...prev, [activeCard]: '' }));
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
    if (cardErrors[2]) {
      setCardErrors(prev => ({ ...prev, [2]: '' }));
    }
  };

  const validateCard1 = () => {
    const errors = {};
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email is invalid';
    if (!formData.contactNumber.trim()) errors.contactNumber = 'Contact number is required';
    return errors;
  };

  const validateCard2 = () => {
    const errors = {};
    if (!formData.houseOrBuilding.trim()) errors.houseOrBuilding = 'House/Building number is required';
    if (!formData.street.trim()) errors.street = 'Street is required';
    if (!formData.barangay.trim()) errors.barangay = 'Barangay is required';
    if (!formData.cityMunicipality.trim()) errors.cityMunicipality = 'City/Municipality is required';
    if (!formData.province.trim()) errors.province = 'Province is required';
    if (!formData.zipCode.trim()) errors.zipCode = 'Zip code is required';
    return errors;
  };

  const validateCard3 = () => {
    const errors = {};
    if (!formData.propertyType) errors.propertyType = 'Property type is required';
    if (!formData.preferredDate) errors.preferredDate = 'Preferred date is required';
    return errors;
  };

  const handleNext = () => {
    let isValid = false;
    
    if (activeCard === 1) {
      const errors = validateCard1();
      if (Object.keys(errors).length === 0) {
        isValid = true;
      } else {
        setValidationErrors(errors);
        setCardErrors(prev => ({ ...prev, [1]: 'Please complete all required fields' }));
      }
    } else if (activeCard === 2) {
      const errors = validateCard2();
      if (Object.keys(errors).length === 0) {
        isValid = true;
      } else {
        setValidationErrors(errors);
        setCardErrors(prev => ({ ...prev, [2]: 'Please complete all required fields' }));
      }
    } else if (activeCard === 3) {
      const errors = validateCard3();
      if (Object.keys(errors).length === 0) {
        isValid = true;
      } else {
        setValidationErrors(errors);
        setCardErrors(prev => ({ ...prev, [3]: 'Please complete all required fields' }));
      }
    }
    
    if (isValid && activeCard < 3) {
      setActiveCard(activeCard + 1);
      setValidationErrors({});
    }
  };

  const handlePrevious = () => {
    if (activeCard > 1) {
      setActiveCard(activeCard - 1);
      setValidationErrors({});
    }
  };

  const getFullName = () => {
    return [formData.firstName, formData.middleName, formData.lastName].filter(p => p).join(' ');
  };

  const getFullAddress = () => {
    return [
      formData.houseOrBuilding, formData.street, formData.barangay,
      formData.cityMunicipality, formData.province, formData.zipCode
    ].filter(p => p).join(', ');
  };

  const handleSubmitClick = () => {
    // Final validation before showing modal
    const errors1 = validateCard1();
    const errors2 = validateCard2();
    const errors3 = validateCard3();
    
    if (Object.keys(errors1).length === 0 && 
        Object.keys(errors2).length === 0 && 
        Object.keys(errors3).length === 0) {
      setShowConfirmDialog(true);
    } else {
      alert('Please complete all sections before submitting');
    }
  };

  const handleConfirmBooking = async () => {
    if (!termsAccepted) {
      alert('Please accept the terms and conditions to proceed');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = sessionStorage.getItem('token');
      const fullName = getFullName();
      const fullAddress = getFullAddress();

      const bookingPayload = {
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        email: formData.email,
        contactNumber: formData.contactNumber,
        houseOrBuilding: formData.houseOrBuilding,
        street: formData.street,
        barangay: formData.barangay,
        cityMunicipality: formData.cityMunicipality,
        province: formData.province,
        zipCode: formData.zipCode,
        propertyType: formData.propertyType,
        desiredCapacity: formData.desiredCapacity,
        roofType: formData.roofType,
        preferredDate: formData.preferredDate,
        fullName,
        fullAddress,
        userId: user?.userId || user?._id,
        clientId: user?._id,
        addressId: selectedAddressId || null
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

  if (currentStep === 'form') {
    return (
      <>
        <Helmet>
          <title>Schedule Site Assessment | Salfer Engineering</title>
        </Helmet>

        <div className="schedule-container">
          <h1 className="schedule-title">Book Your Site Assessment</h1>
          <p className="schedule-subtitle">Complete the steps below to schedule your professional site assessment</p>

          <div className="schedule-layout">
            {/* Left Side - Cards */}
            <div className="schedule-cards-wrapper">
              {/* Card 1: Personal Information */}
              <div className={`schedule-card ${activeCard === 1 ? 'active' : activeCard > 1 ? 'completed' : 'disabled'}`}>
                <div className="card-header">
                  <div className="card-number">
                    {activeCard > 1 ? <FaCheckCircle /> : '1'}
                  </div>
                  <h3>Personal Information</h3>
                  {activeCard > 1 && <span className="card-status">Completed</span>}
                  {activeCard === 1 && cardErrors[1] && <span className="card-error">{cardErrors[1]}</span>}
                </div>
                
                <div className="card-content">
                  <div className="schedule-form-grid">
                    <div className="schedule-form-group">
                      <label>First Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`schedule-input ${validationErrors.firstName ? 'error' : ''}`}
                        disabled={activeCard !== 1}
                      />
                      {validationErrors.firstName && <small>{validationErrors.firstName}</small>}
                    </div>

                    <div className="schedule-form-group">
                      <label>Middle Name</label>
                      <input
                        type="text"
                        name="middleName"
                        value={formData.middleName}
                        onChange={handleInputChange}
                        className="schedule-input"
                        disabled={activeCard !== 1}
                      />
                    </div>

                    <div className="schedule-form-group">
                      <label>Last Name *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`schedule-input ${validationErrors.lastName ? 'error' : ''}`}
                        disabled={activeCard !== 1}
                      />
                      {validationErrors.lastName && <small>{validationErrors.lastName}</small>}
                    </div>

                    <div className="schedule-form-group">
                      <label>Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`schedule-input ${validationErrors.email ? 'error' : ''}`}
                        disabled={activeCard !== 1}
                      />
                      {validationErrors.email && <small>{validationErrors.email}</small>}
                    </div>

                    <div className="schedule-form-group">
                      <label>Contact Number *</label>
                      <input
                        type="tel"
                        name="contactNumber"
                        value={formData.contactNumber}
                        onChange={handleInputChange}
                        className={`schedule-input ${validationErrors.contactNumber ? 'error' : ''}`}
                        placeholder="0917xxxxxxx"
                        disabled={activeCard !== 1}
                      />
                      {validationErrors.contactNumber && <small>{validationErrors.contactNumber}</small>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Address Details */}
              <div className={`schedule-card ${activeCard === 2 ? 'active' : activeCard > 2 ? 'completed' : 'disabled'}`}>
                <div className="card-header">
                  <div className="card-number">
                    {activeCard > 2 ? <FaCheckCircle /> : '2'}
                  </div>
                  <h3>Address Details</h3>
                  {activeCard > 2 && <span className="card-status">Completed</span>}
                  {activeCard === 2 && cardErrors[2] && <span className="card-error">{cardErrors[2]}</span>}
                </div>
                
                <div className="card-content">
                  {addresses.length > 0 && (
                    <div className="schedule-form-group schedule-full-width">
                      <label>Select Saved Address</label>
                      <select
                        value={selectedAddressId}
                        onChange={handleAddressChange}
                        className="schedule-select"
                        disabled={activeCard !== 2}
                      >
                        <option value="">-- Select an address --</option>
                        {addresses.map(addr => (
                          <option key={addr._id} value={addr._id}>
                            {addr.houseOrBuilding} {addr.street}, {addr.barangay}, {addr.cityMunicipality}
                          </option>
                        ))}
                      </select>
                      <small>Select a saved address or fill in the fields below</small>
                    </div>
                  )}

                  <div className="schedule-form-grid">
                    <div className="schedule-form-group">
                      <label>House/Bldg. No. *</label>
                      <input
                        type="text"
                        name="houseOrBuilding"
                        value={formData.houseOrBuilding}
                        onChange={handleInputChange}
                        className={`schedule-input ${validationErrors.houseOrBuilding ? 'error' : ''}`}
                        disabled={activeCard !== 2}
                      />
                      {validationErrors.houseOrBuilding && <small>{validationErrors.houseOrBuilding}</small>}
                    </div>

                    <div className="schedule-form-group">
                      <label>Street *</label>
                      <input
                        type="text"
                        name="street"
                        value={formData.street}
                        onChange={handleInputChange}
                        className={`schedule-input ${validationErrors.street ? 'error' : ''}`}
                        disabled={activeCard !== 2}
                      />
                      {validationErrors.street && <small>{validationErrors.street}</small>}
                    </div>

                    <div className="schedule-form-group">
                      <label>Barangay *</label>
                      <input
                        type="text"
                        name="barangay"
                        value={formData.barangay}
                        onChange={handleInputChange}
                        className={`schedule-input ${validationErrors.barangay ? 'error' : ''}`}
                        disabled={activeCard !== 2}
                      />
                      {validationErrors.barangay && <small>{validationErrors.barangay}</small>}
                    </div>

                    <div className="schedule-form-group">
                      <label>City/Municipality *</label>
                      <input
                        type="text"
                        name="cityMunicipality"
                        value={formData.cityMunicipality}
                        onChange={handleInputChange}
                        className={`schedule-input ${validationErrors.cityMunicipality ? 'error' : ''}`}
                        disabled={activeCard !== 2}
                      />
                      {validationErrors.cityMunicipality && <small>{validationErrors.cityMunicipality}</small>}
                    </div>

                    <div className="schedule-form-group">
                      <label>Province *</label>
                      <input
                        type="text"
                        name="province"
                        value={formData.province}
                        onChange={handleInputChange}
                        className={`schedule-input ${validationErrors.province ? 'error' : ''}`}
                        disabled={activeCard !== 2}
                      />
                      {validationErrors.province && <small>{validationErrors.province}</small>}
                    </div>

                    <div className="schedule-form-group">
                      <label>Zip Code *</label>
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        className={`schedule-input ${validationErrors.zipCode ? 'error' : ''}`}
                        maxLength="4"
                        disabled={activeCard !== 2}
                      />
                      {validationErrors.zipCode && <small>{validationErrors.zipCode}</small>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Property Details */}
              <div className={`schedule-card ${activeCard === 3 ? 'active' : activeCard > 3 ? 'completed' : 'disabled'}`}>
                <div className="card-header">
                  <div className="card-number">
                    {activeCard > 3 ? <FaCheckCircle /> : '3'}
                  </div>
                  <h3>Property Details</h3>
                  {activeCard > 3 && <span className="card-status">Completed</span>}
                  {activeCard === 3 && cardErrors[3] && <span className="card-error">{cardErrors[3]}</span>}
                </div>
                
                <div className="card-content">
                  <div className="schedule-form-grid">
                    <div className="schedule-form-group">
                      <label>Property Type *</label>
                      <select
                        name="propertyType"
                        value={formData.propertyType}
                        onChange={handleInputChange}
                        className={`schedule-select ${validationErrors.propertyType ? 'error' : ''}`}
                        disabled={activeCard !== 3}
                      >
                        <option value="residential">Residential</option>
                        <option value="commercial">Commercial</option>
                      </select>
                      {validationErrors.propertyType && <small>{validationErrors.propertyType}</small>}
                    </div>

                    <div className="schedule-form-group">
                      <label>Desired Capacity (kW)</label>
                      <input
                        type="text"
                        name="desiredCapacity"
                        value={formData.desiredCapacity}
                        onChange={handleInputChange}
                        className="schedule-input"
                        placeholder="e.g., 5kW"
                        disabled={activeCard !== 3}
                      />
                    </div>

                    <div className="schedule-form-group">
                      <label>Roof Type</label>
                      <select
                        name="roofType"
                        value={formData.roofType}
                        onChange={handleInputChange}
                        className="schedule-select"
                        disabled={activeCard !== 3}
                      >
                        <option value="">Select roof type</option>
                        <option value="concrete">Concrete</option>
                        <option value="metal">Metal</option>
                        <option value="tile">Tile</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="schedule-form-group">
                      <label>Preferred Start Date *</label>
                      <input
                        type="date"
                        name="preferredDate"
                        value={formData.preferredDate}
                        onChange={handleInputChange}
                        className={`schedule-input ${validationErrors.preferredDate ? 'error' : ''}`}
                        min={new Date().toISOString().split('T')[0]}
                        disabled={activeCard !== 3}
                      />
                      {validationErrors.preferredDate && <small>{validationErrors.preferredDate}</small>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Preview Card with Next/Submit */}
            <div className="schedule-preview">
              <div className="schedule-preview-card">
                <h3>Booking Preview</h3>
                
                <div className="preview-section">
                  <h4><FaUser /> Personal Info</h4>
                  <p><strong>Name:</strong> {getFullName() || '—'}</p>
                  <p><strong>Email:</strong> {formData.email || '—'}</p>
                  <p><strong>Contact:</strong> {formData.contactNumber || '—'}</p>
                </div>

                <div className="preview-section">
                  <h4><FaMapMarkerAlt /> Address</h4>
                  <p>{getFullAddress() || '—'}</p>
                </div>

                <div className="preview-section">
                  <h4><FaHome /> Property</h4>
                  <p><strong>Type:</strong> {formData.propertyType === 'residential' ? 'Residential' : 'Commercial'}</p>
                  <p><strong>Capacity:</strong> {formData.desiredCapacity || '—'}</p>
                  <p><strong>Roof:</strong> {formData.roofType || '—'}</p>
                  <p><strong>Preferred Date:</strong> {formData.preferredDate || '—'}</p>
                </div>

                <div className="preview-fee">
                  <FaMoneyBillWave />
                  <div>
                    <strong>Assessment Fee</strong>
                    <p>₱1,500.00</p>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="preview-actions">
                  {activeCard < 3 && (
                    <button onClick={handleNext} className="schedule-btn-next">
                      Next <FaArrowRight />
                    </button>
                  )}
                  
                  {activeCard > 1 && (
                    <button onClick={handlePrevious} className="schedule-btn-prev">
                      <FaArrowLeft /> Back
                    </button>
                  )}
                  
                  {activeCard === 3 && (
                    <button onClick={handleSubmitClick} className="schedule-btn-submit">
                      Review & Confirm
                    </button>
                  )}
                </div>
                
                <p className="preview-note">
                  {activeCard === 1 && "Step 1 of 3: Fill in your personal information"}
                  {activeCard === 2 && "Step 2 of 3: Fill in your address details"}
                  {activeCard === 3 && "Step 3 of 3: Fill in your property details"}
                </p>
              </div>
            </div>
          </div>

          {/* Confirmation Modal */}
          {showConfirmDialog && (
            <div className="schedule-modal-overlay">
              <div className="schedule-modal">
                <h2>Confirm Booking</h2>
                <ul>
                  <li><strong>Name:</strong> {getFullName()}</li>
                  <li><strong>Email:</strong> {formData.email}</li>
                  <li><strong>Contact:</strong> {formData.contactNumber}</li>
                  <li><strong>Address:</strong> {getFullAddress()}</li>
                  <li><strong>Property Type:</strong> {formData.propertyType}</li>
                  <li><strong>Preferred Date:</strong> {formData.preferredDate}</li>
                  <li><strong>Assessment Fee:</strong> ₱1,500.00</li>
                </ul>

                <div className="schedule-modal-checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                    />
                    <span>I agree to the Terms and Conditions</span>
                  </label>
                </div>

                <div className="schedule-modal-actions">
                  <button onClick={() => setShowConfirmDialog(false)} className="schedule-btn-secondary">
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmBooking}
                    disabled={!termsAccepted || isSubmitting}
                    className="schedule-btn-success"
                  >
                    {isSubmitting ? 'Processing...' : 'Confirm Booking'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  if (currentStep === 'payment') {
    return (
      <div className="schedule-container">
        <h1 className="schedule-title">Complete Your Payment</h1>

        <div className="schedule-summary-card">
          <h3>Booking Summary</h3>
          <p><strong>Booking ID:</strong> {bookingData?.bookingId}</p>
          <p><strong>Invoice:</strong> {bookingData?.invoiceNumber}</p>
          <p><strong>Amount Due:</strong> ₱{bookingData?.assessmentFee}.00</p>
        </div>

        <h3>Select Payment Method</h3>

        <div className="schedule-payment-options">
          <div className={`schedule-payment-card ${paymentMethod === 'gcash' ? 'selected' : ''}`}>
            <label>
              <input
                type="radio"
                name="paymentMethod"
                value="gcash"
                checked={paymentMethod === 'gcash'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span>GCash</span>
            </label>

            {paymentMethod === 'gcash' && (
              <div className="schedule-payment-details">
                <p><strong>GCash Number:</strong> 0917XXXXXXX</p>
                <p><strong>Name:</strong> SALFER ENGINEERING CORP</p>
                <p><strong>Amount:</strong> ₱{bookingData?.assessmentFee}.00</p>
                
                <div className="schedule-upload-group">
                  <label>Upload Payment Screenshot *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                  {paymentProof && <small>Selected: {paymentProof.name}</small>}
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

          <div className={`schedule-payment-card ${paymentMethod === 'cash' ? 'selected' : ''}`}>
            <label>
              <input
                type="radio"
                name="paymentMethod"
                value="cash"
                checked={paymentMethod === 'cash'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <span>Cash (Walk-in Payment)</span>
            </label>

            {paymentMethod === 'cash' && (
              <div className="schedule-payment-details">
                <p><strong>Office Address:</strong> Unit 123, Building, City</p>
                <p><strong>Office Hours:</strong> Mon-Fri, 9AM-6PM</p>
                <p><strong>Amount:</strong> ₱{bookingData?.assessmentFee}.00</p>
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

  if (currentStep === 'confirmation') {
    return (
      <div className="schedule-container">
        <div className="schedule-confirmation-card">
          <FaCheckCircle className="schedule-confirmation-icon" />
          
          <h1>Booking {paymentStatus === 'paid' ? 'Confirmed!' : 'Received!'}</h1>

          <div className="schedule-booking-details">
            <p><strong>Booking ID:</strong> {bookingData?.bookingId}</p>
            <p><strong>Invoice:</strong> {bookingData?.invoiceNumber}</p>

            {paymentMethod === 'gcash' && (
              <div className="schedule-status-info">
                <FaClock />
                <div>
                  <p><strong>Payment Status:</strong> For Verification</p>
                  <p>Your proof of payment is being verified.</p>
                </div>
              </div>
            )}

            {paymentMethod === 'cash' && (
              <div className="schedule-status-info">
                <FaExclamationTriangle />
                <div>
                  <p><strong>Payment Status:</strong> Pending Cash Payment</p>
                  <p>Please visit our office to complete your payment.</p>
                </div>
              </div>
            )}
          </div>

          <div className="schedule-next-steps">
            <h3>Next Steps:</h3>
            <ul>
              <li>An engineer will be assigned to your site</li>
              <li>IoT device will be deployed for 7-day monitoring</li>
              <li>You'll receive updates via email/SMS</li>
            </ul>
          </div>

          <button onClick={() => window.location.href = '/dashboard/customerdashboard'} className="schedule-btn-secondary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default ScheduleAssessment;