// pages/Customer/scheduleassessment.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FaChevronRight,
  FaEdit,
  FaFileInvoice,
  FaIndustry,
  FaBuilding,
  FaRegFileAlt,
  FaPaperPlane,
  FaClipboardList,
  FaQrcode,
  FaTimes,
  FaTrash,
  FaArrowLeft,
  FaArrowRight,
  FaBolt,
  FaPlug,
  FaLeaf
} from 'react-icons/fa';
import '../../styles/Customer/scheduleassessment.css';

const ScheduleAssessment = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState('service-selection');
  const [activeCard, setActiveCard] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  // Free quotation state
  const [freeQuoteData, setFreeQuoteData] = useState({
    monthlyBill: '',
    propertyType: 'residential',
    desiredCapacity: ''
  });
  const [showFreeQuoteConfirm, setShowFreeQuoteConfirm] = useState(false);

  // Pre Assessment state
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    contactNumber: '',
    propertyType: 'residential',
    desiredCapacity: '',
    roofType: '',
    preferredDate: ''
  });
  const [bookingData, setBookingData] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('pending');

  const [validationErrors, setValidationErrors] = useState({});
  const [cardErrors, setCardErrors] = useState({});

  const card1Ref = useRef(null);
  const card2Ref = useRef(null);
  const card3Ref = useRef(null);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      fetchClientData();
      fetchClientAddresses();
    }, 1000);
  }, []);

  useEffect(() => {
    if (activeCard === 1 && card1Ref.current) {
      card1Ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (activeCard === 2 && card2Ref.current) {
      card2Ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (activeCard === 3 && card3Ref.current) {
      card3Ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeCard]);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');

      if (!token) {
        setError('Please log in to continue');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/clients/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const clientData = response.data?.client;

      if (clientData) {
        setUser(clientData);
        let propertyType = 'residential';
        if (clientData.client_type === 'Company') propertyType = 'commercial';
        if (clientData.client_type === 'Industrial') propertyType = 'industrial';

        setFormData(prev => ({
          ...prev,
          firstName: clientData?.contactFirstName || '',
          middleName: clientData?.contactMiddleName || '',
          lastName: clientData?.contactLastName || '',
          contactNumber: clientData?.contactNumber || '',
          propertyType: propertyType
        }));
      }
    } catch (err) {
      setError('Failed to load your information');
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
        setSelectedAddress(primaryAddress);
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    }
  };

  const handleAddressClick = () => {
    navigate('/dashboard/customersettings?tab=addresses&returnTo=/dashboard/schedule');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (currentStep === 'service-selection') {
      setFreeQuoteData(prev => ({ ...prev, [name]: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      if (validationErrors[name]) {
        setValidationErrors(prev => ({ ...prev, [name]: '' }));
      }
      if (cardErrors[activeCard]) {
        setCardErrors(prev => ({ ...prev, [activeCard]: '' }));
      }
    }
  };

  const getFullName = () => {
    return [formData.firstName, formData.middleName, formData.lastName].filter(p => p).join(' ');
  };

  const getFullAddress = () => {
    if (selectedAddress) {
      return `${selectedAddress.houseOrBuilding} ${selectedAddress.street}, ${selectedAddress.barangay}, ${selectedAddress.cityMunicipality}, ${selectedAddress.province} ${selectedAddress.zipCode}`;
    }
    return '';
  };

  const getSelectedAddressDisplay = () => {
    if (!selectedAddress) return null;

    const name = `${formData.firstName} ${formData.lastName}`;
    const contact = formData.contactNumber;
    const address = `${selectedAddress.houseOrBuilding} ${selectedAddress.street}, ${selectedAddress.barangay}, ${selectedAddress.cityMunicipality}, ${selectedAddress.province} ${selectedAddress.zipCode}`;

    return { name, contact, address };
  };

  // FREE QUOTE SUBMISSION
  const handleFreeQuoteSubmit = () => {
    if (!freeQuoteData.monthlyBill) {
      alert('Please enter your monthly electricity bill');
      return;
    }
    setShowFreeQuoteConfirm(true);
  };

  const confirmFreeQuote = async () => {
    setIsSubmitting(true);

    try {
      const token = sessionStorage.getItem('token');

      const quotePayload = {
        clientId: user?._id,
        addressId: selectedAddress?._id || null,
        monthlyBill: freeQuoteData.monthlyBill,
        propertyType: freeQuoteData.propertyType,
        desiredCapacity: freeQuoteData.desiredCapacity
      };

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/free-quotes`, quotePayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSubmittedData({
        reference: response.data.quote.quotationReference,
        type: 'free-quote'
      });
      setSubmitted(true);
      setShowFreeQuoteConfirm(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit quote request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // PRE ASSESSMENT VALIDATION
  const validateCard1 = () => {
    const errors = {};
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.contactNumber.trim()) errors.contactNumber = 'Contact number is required';
    return errors;
  };

  const validateCard2 = () => {
    const errors = {};
    if (!selectedAddress) errors.address = 'Please select an address';
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
        setCardErrors(prev => ({ ...prev, [2]: 'Please select an address' }));
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

  // PRE ASSESSMENT SUBMISSION
  const handleSubmitClick = () => {
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

      const bookingPayload = {
        clientId: user?._id,
        addressId: selectedAddress?._id || null,
        propertyType: formData.propertyType,
        desiredCapacity: formData.desiredCapacity,
        roofType: formData.roofType,
        preferredDate: formData.preferredDate
      };

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/pre-assessments`, bookingPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setBookingData({
        bookingReference: response.data.booking.bookingReference,
        invoiceNumber: response.data.booking.invoiceNumber,
        assessmentFee: response.data.booking.assessmentFee
      });

      setShowConfirmDialog(false);
      setTermsAccepted(false);
      setCurrentStep('payment');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit pre-assessment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!paymentProof) {
      alert('Please upload payment proof');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      const formDataPayment = new FormData();
      formDataPayment.append('bookingReference', bookingData.bookingReference);
      formDataPayment.append('paymentMethod', paymentMethod);
      formDataPayment.append('paymentProof', paymentProof);
      if (paymentReference) formDataPayment.append('paymentReference', paymentReference);

      await axios.post(`${import.meta.env.VITE_API_URL}/api/pre-assessments/payment`, formDataPayment, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });

      setPaymentStatus('forVerification');
      setCurrentStep('confirmation');
    } catch (err) {
      alert('Failed to submit payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCashPayment = async () => {
    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/pre-assessments/cash-payment`, {
        bookingReference: bookingData.bookingReference
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCurrentStep('confirmation');
    } catch (err) {
      alert('Failed to process cash payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const selectedAddressDisplay = getSelectedAddressDisplay();

  // Skeleton Loader Component
  const SkeletonLoader = () => (
    <div className="schedule-container">
      <div className="schedule-header-skeleton">
        <div className="skeleton-line large"></div>
        <div className="skeleton-line small"></div>
      </div>

      <div className="service-selection-grid">
        {[1, 2].map((item) => (
          <div key={item} className="skeleton-service-card">
            <div className="skeleton-icon"></div>
            <div className="skeleton-line medium"></div>
            <div className="skeleton-line small"></div>
            <div className="skeleton-form-group">
              <div className="skeleton-line"></div>
              <div className="skeleton-input"></div>
            </div>
            <div className="skeleton-form-group">
              <div className="skeleton-line"></div>
              <div className="skeleton-input"></div>
            </div>
            <div className="skeleton-button"></div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Get Solar Service | Salfer Engineering</title>
        </Helmet>
        <SkeletonLoader />
      </>
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

  // ==================== SERVICE SELECTION SCREEN ====================
  if (currentStep === 'service-selection') {
    return (
      <>
        <Helmet>
          <title>Get Solar Service | Salfer Engineering</title>
        </Helmet>

        <div className="schedule-container">
          <h1 className="schedule-title">Get Your Solar Solution</h1>
          <p className="schedule-subtitle">Choose how you want to proceed with your solar journey</p>

          <div className="service-selection-grid">
            {/* Free Quote Request Card */}
            <div className="service-card">
              <div className="service-card-header">
                <FaRegFileAlt className="service-icon" />
                <h2>Free Quotation Request</h2>
                <span className="service-badge free">Free</span>
              </div>
              <p className="service-description">
                Request a quotation for your solar system. Our team will review your request and provide a detailed quotation.
              </p>

              <div className="quote-form">
                <div className="schedule-form-group">
                  <label>Monthly Electricity Bill (₱) *</label>
                  <input
                    type="number"
                    name="monthlyBill"
                    value={freeQuoteData.monthlyBill}
                    onChange={handleInputChange}
                    placeholder="e.g., 5000"
                    className="schedule-form-input"
                  />
                </div>

                <div className="schedule-form-group">
                  <label>Property Type *</label>
                  <select
                    name="propertyType"
                    value={freeQuoteData.propertyType}
                    onChange={handleInputChange}
                    className="schedule-form-select"
                  >
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="industrial">Industrial</option>
                  </select>
                </div>

                <div className="schedule-form-group">
                  <label>Desired Capacity (kW)</label>
                  <input
                    type="text"
                    name="desiredCapacity"
                    value={freeQuoteData.desiredCapacity}
                    onChange={handleInputChange}
                    placeholder="e.g., 5kW (optional)"
                    className="schedule-form-input"
                  />
                </div>

                <button
                  className="btn-get-quote"
                  onClick={handleFreeQuoteSubmit}
                  disabled={!freeQuoteData.monthlyBill}
                >
                  <FaPaperPlane /> Request Quotation
                </button>
              </div>
            </div>

            {/* Pre Assessment Card */}
            <div className="service-card paid">
              <div className="service-card-header">
                <FaClipboardList className="service-icon" />
                <h2>Pre Assessment</h2>
                <span className="service-badge paid">₱1,500</span>
              </div>
              <p className="service-description">
                Book a professional on-site pre-assessment with 7-day IoT device monitoring for accurate data collection and detailed report.
              </p>
              <ul className="service-features">
                <li><FaCheckCircle /> On-site visit with monitoring device</li>
                <li><FaCheckCircle /> 7-day actual environmental data collection</li>
                <li><FaCheckCircle /> Accurate system size recommendation</li>
                <li><FaCheckCircle /> Detailed assessment report</li>
                <li><FaCheckCircle /> Professional engineer consultation</li>
              </ul>
              <button
                className="btn-paid-assessment"
                onClick={() => {
                  setCurrentStep('form');
                  setActiveCard(1);
                }}
              >
                Book Pre Assessment
              </button>
            </div>
          </div>

          {/* Free Quote Confirmation Modal */}
          {showFreeQuoteConfirm && (
            <div className="schedule-modal-overlay">
              <div className="schedule-modal">
                <h2>Request Quotation</h2>
                <p>Please review your request details:</p>

                <div className="quote-summary">
                  <div className="quote-item">
                    <span>Monthly Bill:</span>
                    <strong>{formatCurrency(freeQuoteData.monthlyBill)}</strong>
                  </div>
                  <div className="quote-item">
                    <span>Property Type:</span>
                    <strong>{freeQuoteData.propertyType}</strong>
                  </div>
                  {freeQuoteData.desiredCapacity && (
                    <div className="quote-item">
                      <span>Desired Capacity:</span>
                      <strong>{freeQuoteData.desiredCapacity}</strong>
                    </div>
                  )}
                  <div className="quote-item">
                    <span>Address:</span>
                    <strong>{getFullAddress()}</strong>
                  </div>
                </div>

                <p className="quote-note">Our team will review your request and send a detailed quotation via email within 2-3 business days.</p>

                <div className="schedule-modal-actions">
                  <button
                    onClick={() => setShowFreeQuoteConfirm(false)}
                    className="schedule-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmFreeQuote}
                    disabled={isSubmitting}
                    className="schedule-btn-success"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  // ==================== SUCCESS SCREEN ====================
  if (submitted) {
    return (
      <div className="schedule-container">
        <div className="schedule-confirmation-card">
          <FaCheckCircle className="schedule-confirmation-icon" />

          <h1>Request Submitted!</h1>

          {submittedData.type === 'free-quote' && (
            <>
              <p>Your quotation request has been received.</p>
              <div className="schedule-booking-details">
                <p><strong>Reference Number:</strong> {submittedData.reference}</p>
                <p><strong>Status:</strong> Pending Review</p>
              </div>
              <div className="schedule-next-steps">
                <h3>What's Next?</h3>
                <ul>
                  <li>Our team will review your request within 2-3 business days</li>
                  <li>You'll receive a detailed quotation via email</li>
                  <li>Our engineer may contact you for additional information</li>
                </ul>
              </div>
            </>
          )}

          <div className="quote-actions">
            <button
              onClick={() => {
                setSubmitted(false);
                setCurrentStep('service-selection');
                setFreeQuoteData({ monthlyBill: '', propertyType: 'residential', desiredCapacity: '' });
              }}
              className="schedule-btn-secondary"
            >
              Request Another
            </button>
            <button
              onClick={() => navigate('/dashboard/customerdashboard')}
              className="schedule-btn-primary"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== PRE ASSESSMENT FORM ====================
  if (currentStep === 'form') {
    return (
      <>
        <Helmet>
          <title>Book Pre Assessment | Salfer Engineering</title>
        </Helmet>

        <div className="schedule-container">
          <h1 className="schedule-title">Book Pre Assessment</h1>
          <p className="schedule-subtitle">Complete the form below to schedule your professional pre-assessment (₱1,500)</p>

          <div className="pre-assessment-form-wrapper">
            {/* Personal & Address Info Section */}
            <div className="schedule-info-section">
              <h3 className="schedule-section-title">Contact & Address Information</h3>

              {/* Personal Info Card */}
              <div className="schedule-info-card">
                <div className="schedule-info-card-header">
                  <FaUser className="schedule-info-icon" />
                  <h4>Personal Information</h4>
                </div>
                <div className="schedule-info-card-content">
                  <div className="schedule-info-row">
                    <div className="schedule-info-field">
                      <label>Name</label>
                      <p>{getFullName() || 'Not provided'}</p>
                    </div>
                    <div className="schedule-info-field">
                      <label>Contact Number</label>
                      <p>{formData.contactNumber || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="schedule-info-note">
                    <FaEdit className="schedule-note-icon" />
                    <small>Personal information is managed in your <button className="schedule-text-link" onClick={() => navigate('/dashboard/customersettings')}>Account Settings</button></small>
                  </div>
                </div>
              </div>

              {/* Address Card */}
              <div className="schedule-info-card">
                <div className="schedule-info-card-header">
                  <FaMapMarkerAlt className="schedule-info-icon" />
                  <h4>Address</h4>
                </div>
                <div className="schedule-info-card-content">
                  {selectedAddressDisplay ? (
                    <>
                      <div className="schedule-address-display">
                        <div className="schedule-address-name">{selectedAddressDisplay.name}</div>
                        <div className="schedule-address-contact">{selectedAddressDisplay.contact}</div>
                        <div className="schedule-address-detail">{selectedAddressDisplay.address}</div>
                      </div>
                      <div className="address-actions">
                        <button className="schedule-change-address-btn" onClick={handleAddressClick}>
                          <FaEdit /> Change Address
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="schedule-no-address-warning">
                      <FaExclamationTriangle />
                      <p>No address found. Please add an address in settings first.</p>
                      <button onClick={handleAddressClick} className="schedule-add-address-btn">
                        Add Address
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Assessment Details Section */}
            <div className="schedule-assessment-details-section">
              <h3 className="schedule-section-title">Assessment Details</h3>

              <div className="schedule-assessment-form">
                <div className="schedule-form-grid">
                  <div className="schedule-form-group">
                    <label>Property Type *</label>
                    <select
                      name="propertyType"
                      value={formData.propertyType}
                      onChange={handleInputChange}
                      className={`schedule-form-select ${validationErrors.propertyType ? 'error' : ''}`}
                    >
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                      <option value="industrial">Industrial</option>
                    </select>
                    {validationErrors.propertyType && <small className="schedule-error-text">{validationErrors.propertyType}</small>}
                  </div>

                  <div className="schedule-form-group">
                    <label>Desired Capacity (kW)</label>
                    <input
                      type="text"
                      name="desiredCapacity"
                      value={formData.desiredCapacity}
                      onChange={handleInputChange}
                      className="schedule-form-input"
                      placeholder="e.g., 5kW (optional)"
                    />
                  </div>

                  <div className="schedule-form-group">
                    <label>Roof Type</label>
                    <select
                      name="roofType"
                      value={formData.roofType}
                      onChange={handleInputChange}
                      className="schedule-form-select"
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
                      className={`schedule-form-input ${validationErrors.preferredDate ? 'error' : ''}`}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    {validationErrors.preferredDate && <small className="schedule-error-text">{validationErrors.preferredDate}</small>}
                  </div>
                </div>

                <div className="schedule-fee-card">
                  <div className="schedule-fee-info">
                    <FaMoneyBillWave className="schedule-fee-icon" />
                    <div>
                      <strong>Pre Assessment Fee: ₱1,500.00</strong>
                      <p>Non-refundable fee for 7-day IoT device monitoring and detailed report</p>
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button onClick={handleSubmitClick} className="schedule-btn-submit">
                    Review & Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Confirmation Modal */}
          {showConfirmDialog && (
            <div className="schedule-modal-overlay">
              <div className="schedule-modal">
                <h2>Confirm Pre Assessment</h2>
                <div className="schedule-modal-summary">
                  <div className="schedule-summary-section">
                    <h4>Contact Information</h4>
                    <p><strong>Name:</strong> {getFullName()}</p>
                    <p><strong>Contact:</strong> {formData.contactNumber}</p>
                  </div>
                  <div className="schedule-summary-section">
                    <h4>Address</h4>
                    <p>{getFullAddress()}</p>
                  </div>
                  <div className="schedule-summary-section">
                    <h4>Assessment Details</h4>
                    <p><strong>Property Type:</strong> {formData.propertyType}</p>
                    <p><strong>Desired Capacity:</strong> {formData.desiredCapacity || 'Not specified'}</p>
                    <p><strong>Roof Type:</strong> {formData.roofType || 'Not specified'}</p>
                    <p><strong>Preferred Date:</strong> {formData.preferredDate}</p>
                    <p><strong>Pre Assessment Fee:</strong> ₱1,500.00</p>
                  </div>
                </div>

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

  // ==================== PAYMENT SCREEN ====================
  if (currentStep === 'payment') {
    return (
      <div className="schedule-container">
        <h1 className="schedule-title">Complete Your Payment</h1>

        <div className="schedule-summary-card">
          <h3>Booking Summary</h3>
          <p><strong>Booking Reference:</strong> {bookingData?.bookingReference}</p>
          <p><strong>Invoice Number:</strong> {bookingData?.invoiceNumber}</p>
          <p><strong>Amount Due:</strong> ₱{bookingData?.assessmentFee}.00</p>
        </div>

        <h3>Select Payment Method</h3>

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
                <FaQrcode />
                <span>GCash</span>
              </div>
            </label>

            {paymentMethod === 'gcash' && (
              <div className="schedule-payment-details">
                <div className="schedule-payment-info">
                  <p><strong>GCash Number:</strong> 0917XXXXXXX</p>
                  <p><strong>Name:</strong> SALFER ENGINEERING CORP</p>
                  <p><strong>Amount:</strong> ₱{bookingData?.assessmentFee}.00</p>
                </div>

                <div className="schedule-upload-group">
                  <label>Reference Number *</label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Enter GCash reference number"
                    className="schedule-form-input"
                  />
                </div>

                <div className="schedule-upload-group">
                  <label>Upload Payment Screenshot *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPaymentProof(e.target.files[0])}
                  />
                  {paymentProof && <small>Selected: {paymentProof.name}</small>}
                </div>

                <button
                  onClick={handlePaymentSubmit}
                  disabled={!paymentProof || !paymentReference}
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
                <span>Cash (Walk-in Payment)</span>
              </div>
            </label>

            {paymentMethod === 'cash' && (
              <div className="schedule-payment-details">
                <p>Please visit our office to pay the pre-assessment fee:</p>
                <div className="schedule-office-info">
                  <p><strong>Address:</strong> Purok 2, Masaya, San Jose, Camarines Sur</p>
                  <p><strong>Office Hours:</strong> Mon-Fri, 9AM-6PM</p>
                  <p><strong>Amount:</strong> ₱{bookingData?.assessmentFee}.00</p>
                </div>
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

  // ==================== CONFIRMATION SCREEN ====================
  if (currentStep === 'confirmation') {
    return (
      <div className="schedule-container">
        <div className="schedule-confirmation-card">
          <FaCheckCircle className="schedule-confirmation-icon" />

          <h1>Pre Assessment {paymentStatus === 'paid' ? 'Confirmed!' : 'Booked!'}</h1>

          <div className="schedule-booking-details">
            <p><strong>Booking Reference:</strong> {bookingData?.bookingReference}</p>
            <p><strong>Invoice Number:</strong> {bookingData?.invoiceNumber}</p>

            {paymentMethod === 'gcash' && paymentStatus === 'forVerification' && (
              <div className="schedule-status-info">
                <FaClock />
                <div>
                  <p><strong>Payment Status:</strong> For Verification</p>
                  <p>Your proof of payment is being verified. You'll receive a confirmation email once verified.</p>
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

            {paymentStatus === 'paid' && (
              <div className="schedule-status-info">
                <FaCheckCircle />
                <div>
                  <p><strong>Payment Status:</strong> Paid</p>
                  <p><strong>Assessment Status:</strong> Scheduled</p>
                  <p>Your pre-assessment is scheduled to start on {formData.preferredDate}.</p>
                </div>
              </div>
            )}
          </div>

          <div className="schedule-next-steps">
            <h3>What's Next?</h3>
            <ul>
              <li>An engineer will be assigned to your site</li>
              <li>IoT device will be deployed for 7-day monitoring</li>
              <li>You'll receive updates via email/SMS</li>
              <li>A detailed report will be provided after data collection</li>
            </ul>
          </div>

          <button onClick={() => navigate('/dashboard/customerdashboard')} className="schedule-btn-secondary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default ScheduleAssessment;