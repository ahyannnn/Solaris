// pages/Customer/scheduleassessment.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import { 
  FaMoneyBillWave,
  FaRulerCombined,
  FaArrowsAltH,
  FaArrowsAltV,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaBuilding,
  FaEdit,
  FaEye,
  FaTimes,
  FaSolarPanel,
  FaBolt
} from 'react-icons/fa';
import '../../styles/Customer/scheduleassessment.css';

const ScheduleAssessment = () => {
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState('service-selection');
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // System Types
  const SYSTEM_TYPES = [
    { value: 'grid-tie', label: 'Grid-Tie System', description: 'Connected to utility grid, no batteries' },
    { value: 'hybrid', label: 'Hybrid System', description: 'Grid-tie with battery backup' },
    { value: 'off-grid', label: 'Off-Grid System', description: 'Standalone with batteries, not connected to grid' }
  ];

  // Free quotation state with dimensions
  const [freeQuoteData, setFreeQuoteData] = useState({
    monthlyBill: '',
    propertyType: 'residential',
    desiredCapacity: '',
    systemType: '',
    roofLength: '',
    roofWidth: ''
  });
  const [showFreeQuoteConfirm, setShowFreeQuoteConfirm] = useState(false);

  // Pre Assessment state with dimensions
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    contactNumber: '',
    propertyType: 'residential',
    desiredCapacity: '',
    systemType: '',
    roofType: '',
    roofLength: '',
    roofWidth: '',
    preferredDate: '',
    paymentMethod: 'gcash'
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchClientData();
    fetchClientAddresses();
  }, []);

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
    navigate('/app/customer/settings?tab=addresses');
  };

  const handleProfileClick = () => {
    navigate('/app/customer/settings?tab=profile');
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

  const getAddressDisplay = () => {
    if (!selectedAddress) return null;
    return {
      fullAddress: getFullAddress(),
      houseOrBuilding: selectedAddress.houseOrBuilding,
      street: selectedAddress.street,
      barangay: selectedAddress.barangay,
      cityMunicipality: selectedAddress.cityMunicipality,
      province: selectedAddress.province,
      zipCode: selectedAddress.zipCode
    };
  };

  // Send email function
  const sendQuoteConfirmationEmail = async (quoteReference, monthlyBill, propertyType, desiredCapacity, systemType, roofLength, roofWidth, address) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/email/send-free-quote-confirmation`, {
        email: user.email,
        name: getFullName(),
        quoteReference: quoteReference,
        monthlyBill: monthlyBill,
        propertyType: propertyType,
        desiredCapacity: desiredCapacity,
        systemType: systemType,
        roofLength: roofLength,
        roofWidth: roofWidth,
        address: address
      });
      console.log('Quote confirmation email sent successfully');
    } catch (emailError) {
      console.error('Failed to send quote confirmation email:', emailError);
    }
  };

  const sendPreAssessmentConfirmationEmail = async (invoiceNumber, amount, propertyType, desiredCapacity, systemType, roofType, roofLength, roofWidth, preferredDate, address, paymentMethod) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/email/send-pre-assessment-confirmation`, {
        email: user.email,
        name: getFullName(),
        invoiceNumber: invoiceNumber,
        amount: amount,
        propertyType: propertyType,
        desiredCapacity: desiredCapacity,
        systemType: systemType,
        roofType: roofType,
        roofLength: roofLength,
        roofWidth: roofWidth,
        preferredDate: preferredDate,
        address: address,
        paymentMethod: paymentMethod
      });
      console.log('Pre-assessment confirmation email sent successfully');
    } catch (emailError) {
      console.error('Failed to send pre-assessment confirmation email:', emailError);
    }
  };

  // FREE QUOTE SUBMISSION
  const handleFreeQuoteSubmit = () => {
    if (!freeQuoteData.monthlyBill) {
      showToast('Please enter your monthly electricity bill', 'warning');
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
        desiredCapacity: freeQuoteData.desiredCapacity,
        systemType: freeQuoteData.systemType,
        roofLength: freeQuoteData.roofLength,
        roofWidth: freeQuoteData.roofWidth
      };

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/free-quotes`, quotePayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await sendQuoteConfirmationEmail(
        response.data.quote.quotationReference,
        freeQuoteData.monthlyBill,
        freeQuoteData.propertyType,
        freeQuoteData.desiredCapacity,
        freeQuoteData.systemType,
        freeQuoteData.roofLength,
        freeQuoteData.roofWidth,
        getFullAddress()
      );

      setShowFreeQuoteConfirm(false);
      setSubmittedData({
        reference: response.data.quote.quotationReference,
        type: 'free-quote'
      });
      
      setCurrentStep('service-selection');
      setSubmitted(true);
      
      showToast('Quote request submitted successfully! A confirmation email has been sent to your email address.', 'success');
      
      setIsSubmitting(false);
      
    } catch (err) {
      console.error('Error submitting quote:', err);
      showToast(err.response?.data?.message || 'Failed to submit quote request. Please try again.', 'error');
      setIsSubmitting(false);
    }
  };

  // PRE ASSESSMENT VALIDATION
  const validateForm = () => {
    const errors = {};
    if (!formData.propertyType) errors.propertyType = 'Property type is required';
    if (!formData.preferredDate) errors.preferredDate = 'Preferred date is required';
    if (!selectedAddress) errors.address = 'Please select an address';
    if (!formData.paymentMethod) errors.paymentMethod = 'Please select a payment method';
    return errors;
  };

  // PRE ASSESSMENT SUBMISSION
  const handleSubmitClick = () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast('Please complete all required fields', 'warning');
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmBooking = async () => {
    if (!termsAccepted) {
      showToast('Please accept the terms and conditions to proceed', 'warning');
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
        systemType: formData.systemType,
        roofType: formData.roofType,
        roofLength: formData.roofLength,
        roofWidth: formData.roofWidth,
        preferredDate: formData.preferredDate,
      };

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/pre-assessments`, bookingPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await sendPreAssessmentConfirmationEmail(
        response.data.booking.invoiceNumber,
        response.data.booking.assessmentFee,
        formData.propertyType,
        formData.desiredCapacity,
        formData.systemType,
        formData.roofType,
        formData.roofLength,
        formData.roofWidth,
        formData.preferredDate,
        getFullAddress(),
        formData.paymentMethod
      );

      setShowConfirmDialog(false);
      setTermsAccepted(false);
      
      showToast('Pre-assessment booked successfully! A confirmation email has been sent.', 'success');
      
      setTimeout(() => {
        navigate('/app/customer/billing', { 
          state: { 
            newInvoice: {
              id: response.data.booking.invoiceNumber,
              amount: response.data.booking.assessmentFee,
              description: 'Pre Assessment Fee',
              paymentMethod: formData.paymentMethod
            }
          }
        });
      }, 1500);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit pre-assessment. Please try again.', 'error');
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

  const getSystemTypeLabel = (value) => {
    const type = SYSTEM_TYPES.find(t => t.value === value);
    return type ? type.label : 'Not specified';
  };

  const addressDisplay = getAddressDisplay();

  // Skeleton Loader Component
  const SkeletonLoader = () => (
    <div className="schedule-container-cusset">
      <div className="schedule-header-skeleton-cusset">
        <div className="skeleton-line-cusset large-cusset"></div>
        <div className="skeleton-line-cusset small-cusset"></div>
      </div>

      <div className="service-selection-grid-cusset">
        {[1, 2].map((item) => (
          <div key={item} className="skeleton-service-card-cusset">
            <div className="skeleton-icon-cusset"></div>
            <div className="skeleton-line-cusset medium-cusset"></div>
            <div className="skeleton-line-cusset small-cusset"></div>
            <div className="skeleton-form-group-cusset">
              <div className="skeleton-line-cusset"></div>
              <div className="skeleton-input-cusset"></div>
            </div>
            <div className="skeleton-form-group-cusset">
              <div className="skeleton-line-cusset"></div>
              <div className="skeleton-input-cusset"></div>
            </div>
            <div className="skeleton-button-cusset"></div>
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
      <div className="schedule-error-container-cusset">
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <div className="schedule-error-actions-cusset">
          <button onClick={fetchClientData} className="schedule-btn-primary-cusset">
            Try Again
          </button>
          <button onClick={() => window.location.href = '/login'} className="schedule-btn-secondary-cusset">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // ==================== SUCCESS SCREEN ====================
  if (submitted) {
    return (
      <div className="schedule-container-cusset">
        <div className="schedule-confirmation-card-cusset">
          <h1>Request Submitted!</h1>

          {submittedData?.type === 'free-quote' && (
            <>
              <p>Your quotation request has been received.</p>
              <div className="schedule-booking-details-cusset">
                <p><strong>Reference Number:</strong> {submittedData.reference}</p>
                <p><strong>Status:</strong> Pending Review</p>
              </div>
              <div className="schedule-next-steps-cusset">
                <h3>What's Next?</h3>
                <ul>
                  <li>Our team will review your request within 2-3 business days</li>
                  <li>You'll receive a detailed quotation via email</li>
                  <li>Our engineer may contact you for additional information</li>
                </ul>
              </div>
              <div className="schedule-email-notice-cusset">
                <p><small>✓ A confirmation email has been sent to your registered email address.</small></p>
              </div>
            </>
          )}

          <div className="quote-actions-cusset">
            <button
              onClick={() => {
                setSubmitted(false);
                setCurrentStep('service-selection');
                setFreeQuoteData({ monthlyBill: '', propertyType: 'residential', desiredCapacity: '', systemType: '', roofLength: '', roofWidth: '' });
                setSubmittedData(null);
              }}
              className="schedule-btn-secondary-cusset"
            >
              Request Another
            </button>
            <button
              onClick={() => navigate('/app/customer')}
              className="schedule-btn-primary-cusset"
            >
              Go to Dashboard
            </button>
          </div>
        </div>

        <ToastNotification
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
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

        <div className="schedule-container-cusset">
          <h1 className="schedule-title-cusset">Get Your Solar Solution</h1>
          <p className="schedule-subtitle-cusset">Choose how you want to proceed with your solar journey</p>

          <div className="service-selection-grid-cusset">
            {/* Free Quote Request Card */}
            <div className="service-card-cusset">
              <div className="service-card-header-cusset">
                <h2>Free Quotation Request</h2>
                <span className="service-badge-cusset free-cusset">Free</span>
              </div>
              <p className="service-description-cusset">
                Request a quotation for your solar system. Our team will review your request and provide a detailed quotation.
              </p>

              <div className="quote-form-cusset">
                <div className="schedule-form-group-cusset">
                  <label>Monthly Electricity Bill (₱)</label>
                  <input
                    type="number"
                    name="monthlyBill"
                    value={freeQuoteData.monthlyBill}
                    onChange={handleInputChange}
                    placeholder="e.g., 5000"
                    className="schedule-form-input-cusset"
                  />
                </div>

                <div className="schedule-form-group-cusset">
                  <label>Property Type</label>
                  <select
                    name="propertyType"
                    value={freeQuoteData.propertyType}
                    onChange={handleInputChange}
                    className="schedule-form-select-cusset"
                  >
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="industrial">Industrial</option>
                  </select>
                </div>

                <div className="schedule-form-group-cusset">
                  <label>Desired Capacity (kW)</label>
                  <input
                    type="text"
                    name="desiredCapacity"
                    value={freeQuoteData.desiredCapacity}
                    onChange={handleInputChange}
                    placeholder="e.g., 5kW (optional)"
                    className="schedule-form-input-cusset"
                  />
                </div>

                <div className="schedule-form-group-cusset">
                  <label>
                    <FaSolarPanel className="inline-icon" /> Preferred System Type (Optional)
                  </label>
                  <select
                    name="systemType"
                    value={freeQuoteData.systemType}
                    onChange={handleInputChange}
                    className="schedule-form-select-cusset"
                  >
                    <option value="">Select system type</option>
                    {SYSTEM_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  {freeQuoteData.systemType && (
                    <small className="system-type-hint">
                      {SYSTEM_TYPES.find(t => t.value === freeQuoteData.systemType)?.description}
                    </small>
                  )}
                </div>

                {/* Roof Dimensions for Free Quote */}
                <div className="schedule-form-group-cusset">
                  <label className="dimension-label-cusset">
                    <FaRulerCombined className="dimension-icon-cusset" />
                    Roof Dimensions (Optional)
                  </label>
                  <div className="dimension-row-cusset">
                    <div className="dimension-input-cusset">
                      <FaArrowsAltH className="dimension-icon-small-cusset" />
                      <input
                        type="number"
                        step="0.1"
                        name="roofLength"
                        value={freeQuoteData.roofLength}
                        onChange={handleInputChange}
                        placeholder="Length (m)"
                        className="schedule-form-input-cusset"
                      />
                    </div>
                    <div className="dimension-input-cusset">
                      <FaArrowsAltV className="dimension-icon-small-cusset" />
                      <input
                        type="number"
                        step="0.1"
                        name="roofWidth"
                        value={freeQuoteData.roofWidth}
                        onChange={handleInputChange}
                        placeholder="Width (m)"
                        className="schedule-form-input-cusset"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-button-container-cusset">
                <button
                  className="btn-get-quote-cusset"
                  onClick={handleFreeQuoteSubmit}
                  disabled={!freeQuoteData.monthlyBill}
                >
                  Request Quotation
                </button>
              </div>
            </div>

            {/* Pre Assessment Card */}
            <div className="service-card-cusset paid-cusset">
              <div className="service-card-header-cusset">
                <h2>Pre Assessment</h2>
                <span className="service-badge-cusset paid-cusset">₱1,500</span>
              </div>
              <p className="service-description-cusset">
                Book a professional on-site pre-assessment with 7-day IoT device monitoring for accurate data collection and detailed report.
              </p>
              <ul className="service-features-cusset">
                <li>On-site visit with monitoring device</li>
                <li>7-day actual environmental data collection</li>
                <li>Accurate system size recommendation</li>
                <li>Detailed assessment report</li>
                <li>Professional engineer consultation</li>
              </ul>

              <div className="card-button-container-cusset">
                <button
                  className="btn-paid-assessment-cusset"
                  onClick={() => {
                    setCurrentStep('form');
                  }}
                >
                  Book Pre Assessment
                </button>
              </div>
            </div>
          </div>

          {/* Free Quote Confirmation Modal */}
          {showFreeQuoteConfirm && (
            <div className="schedule-modal-overlay-cusset">
              <div className="schedule-modal-cusset">
                <h2>Request Quotation</h2>
                <p>Please review your request details:</p>

                <div className="quote-summary-cusset">
                  <div className="quote-item-cusset">
                    <span>Monthly Bill:</span>
                    <strong>{formatCurrency(freeQuoteData.monthlyBill)}</strong>
                  </div>
                  <div className="quote-item-cusset">
                    <span>Property Type:</span>
                    <strong>{freeQuoteData.propertyType}</strong>
                  </div>
                  {freeQuoteData.desiredCapacity && (
                    <div className="quote-item-cusset">
                      <span>Desired Capacity:</span>
                      <strong>{freeQuoteData.desiredCapacity}</strong>
                    </div>
                  )}
                  {freeQuoteData.systemType && (
                    <div className="quote-item-cusset">
                      <span>Preferred System Type:</span>
                      <strong>{getSystemTypeLabel(freeQuoteData.systemType)}</strong>
                    </div>
                  )}
                  {(freeQuoteData.roofLength || freeQuoteData.roofWidth) && (
                    <div className="quote-item-cusset">
                      <span>Roof Dimensions:</span>
                      <strong>{freeQuoteData.roofLength || '?'}m x {freeQuoteData.roofWidth || '?'}m</strong>
                    </div>
                  )}
                  <div className="quote-item-cusset">
                    <span>Address:</span>
                    <strong>{getFullAddress()}</strong>
                  </div>
                </div>

                <p className="quote-note-cusset">Our team will review your request and send a detailed quotation via email within 2-3 business days.</p>
                <p className="quote-note-cusset" style={{ color: '#2ecc71' }}>✓ A confirmation email will be sent to your registered email address.</p>

                <div className="schedule-modal-actions-cusset">
                  <button
                    onClick={() => setShowFreeQuoteConfirm(false)}
                    className="schedule-btn-secondary-cusset"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmFreeQuote}
                    disabled={isSubmitting}
                    className="schedule-btn-success-cusset"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <ToastNotification
            show={toast.show}
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
          />
        </div>
      </>
    );
  }

  // ==================== PRE ASSESSMENT FORM ====================
  if (currentStep === 'form') {
    return (
      <>
        <Helmet>
          <title>Book Pre Assessment | Salfer Engineering</title>
        </Helmet>

        <div className="schedule-container-cusset">
          <div className="back-button-container-cusset">
            <button onClick={() => setCurrentStep('service-selection')} className="back-to-services-cusset">
              Back to Services
            </button>
          </div>

          <h1 className="schedule-title-cusset">Book Pre Assessment</h1>
          <p className="schedule-subtitle-cusset">Complete the form below to schedule your professional pre-assessment (₱1,500)</p>

          <div className="pre-assessment-form-wrapper-cusset">
            {/* Combined Contact & Address Info Card */}
            <div className="schedule-info-section-cusset">
              <h3 className="schedule-section-title-cusset">Contact & Address Information</h3>

              {/* Combined Info Card */}
              <div 
                className="combined-info-card-cusset"
                onClick={() => setShowInfoModal(true)}
              >
                <div className="combined-info-header-cusset">
                  <div className="combined-info-icon-cusset">
                    <FaUser />
                  </div>
                  <div className="combined-info-content-cusset">
                    <div className="combined-info-name-cusset">
                      {getFullName() || 'Not provided'}
                    </div>
                    <div className="combined-info-contact-cusset">
                      <FaPhone className="icon-small-cusset" />
                      <span>{formData.contactNumber || 'Not provided'}</span>
                    </div>
                    <div className="combined-info-address-cusset">
                      <FaMapMarkerAlt className="icon-small-cusset" />
                      <span className="truncate">{getFullAddress() || 'No address selected'}</span>
                    </div>
                  </div>
                  <div className="combined-info-arrow-cusset">
                    <FaEye />
                  </div>
                </div>
                <div className="combined-info-hint-cusset">
                  Click to view full details and manage settings
                </div>
              </div>
              {validationErrors.address && <small className="schedule-error-text-cusset">{validationErrors.address}</small>}
            </div>

            {/* Assessment Details Section */}
            <div className="schedule-assessment-details-section-cusset">
              <h3 className="schedule-section-title-cusset">Assessment Details</h3>

              <div className="schedule-assessment-form-cusset">
                <div className="schedule-form-grid-cusset">
                  <div className="schedule-form-group-cusset">
                    <label>Property Type *</label>
                    <select
                      name="propertyType"
                      value={formData.propertyType}
                      onChange={handleInputChange}
                      className={`schedule-form-select-cusset ${validationErrors.propertyType ? 'error-cusset' : ''}`}
                    >
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                      <option value="industrial">Industrial</option>
                    </select>
                    {validationErrors.propertyType && <small className="schedule-error-text-cusset">{validationErrors.propertyType}</small>}
                  </div>

                  <div className="schedule-form-group-cusset">
                    <label>Desired Capacity (kW)</label>
                    <input
                      type="text"
                      name="desiredCapacity"
                      value={formData.desiredCapacity}
                      onChange={handleInputChange}
                      className="schedule-form-input-cusset"
                      placeholder="e.g., 5kW (optional)"
                    />
                  </div>

                  <div className="schedule-form-group-cusset">
                    <label>
                      <FaSolarPanel className="inline-icon" /> Preferred System Type (Optional)
                    </label>
                    <select
                      name="systemType"
                      value={formData.systemType}
                      onChange={handleInputChange}
                      className="schedule-form-select-cusset"
                    >
                      <option value="">Select system type</option>
                      {SYSTEM_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    {formData.systemType && (
                      <small className="system-type-hint">
                        {SYSTEM_TYPES.find(t => t.value === formData.systemType)?.description}
                      </small>
                    )}
                  </div>

                  <div className="schedule-form-group-cusset">
                    <label>Roof Type</label>
                    <select
                      name="roofType"
                      value={formData.roofType}
                      onChange={handleInputChange}
                      className="schedule-form-select-cusset"
                    >
                      <option value="">Select roof type</option>
                      <option value="concrete">Concrete</option>
                      <option value="metal">Metal</option>
                      <option value="tile">Tile</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  {/* Roof Dimensions */}
                  <div className="schedule-form-group-cusset">
                    <label className="dimension-label-cusset">
                      <FaRulerCombined className="dimension-icon-cusset" />
                      Roof Dimensions
                    </label>
                    <div className="dimension-row-cusset">
                      <div className="dimension-input-cusset">
                        <FaArrowsAltH className="dimension-icon-small-cusset" />
                        <input
                          type="number"
                          step="0.1"
                          name="roofLength"
                          value={formData.roofLength}
                          onChange={handleInputChange}
                          placeholder="Length (meters)"
                          className="schedule-form-input-cusset"
                        />
                      </div>
                      <div className="dimension-input-cusset">
                        <FaArrowsAltV className="dimension-icon-small-cusset" />
                        <input
                          type="number"
                          step="0.1"
                          name="roofWidth"
                          value={formData.roofWidth}
                          onChange={handleInputChange}
                          placeholder="Width (meters)"
                          className="schedule-form-input-cusset"
                      />
                      </div>
                    </div>
                    <small className="dimension-hint-cusset">Optional, but helps provide more accurate recommendations</small>
                  </div>

                  <div className="schedule-form-group-cusset">
                    <label>Preferred Start Date *</label>
                    <input
                      type="date"
                      name="preferredDate"
                      value={formData.preferredDate}
                      onChange={handleInputChange}
                      className={`schedule-form-input-cusset ${validationErrors.preferredDate ? 'error-cusset' : ''}`}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    {validationErrors.preferredDate && <small className="schedule-error-text-cusset">{validationErrors.preferredDate}</small>}
                  </div>
                </div>

                <div className="schedule-fee-card-cusset">
                  <div className="schedule-fee-info-cusset">
                    <div>
                      <strong>Pre Assessment Fee: ₱1,500.00</strong>
                      <p>
                        {formData.paymentMethod === 'gcash' 
                          ? 'You will be redirected to the billing page to upload your GCash payment proof after booking.'
                          : 'Please visit our office to complete payment. The assessment will be scheduled upon payment confirmation.'
                        }
                      </p>
                      <p style={{ color: '#2ecc71', fontSize: '12px', marginTop: '8px' }}>✓ A confirmation email will be sent to your registered email address.</p>
                    </div>
                  </div>
                </div>

                <div className="form-actions-cusset">
                  <button onClick={handleSubmitClick} className="schedule-btn-submit-cusset">
                    Continue to Confirmation
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Info Modal */}
          {showInfoModal && (
            <div className="schedule-modal-overlay-cusset" onClick={() => setShowInfoModal(false)}>
              <div className="schedule-modal-cusset info-modal-cusset" onClick={e => e.stopPropagation()}>
                <div className="info-modal-header-cusset">
                  <h3>Contact & Address Details</h3>
                  <button className="modal-close-cusset" onClick={() => setShowInfoModal(false)}>
                    <FaTimes />
                  </button>
                </div>
                
                <div className="info-modal-body-cusset">
                  {/* Personal Information Section */}
                  <div className="info-section-cusset">
                    <div className="info-section-title-cusset">
                      <FaUser />
                      <h4>Personal Information</h4>
                    </div>
                    <div className="info-details-cusset">
                      <div className="info-row-cusset">
                        <span className="info-label-cusset">Full Name:</span>
                        <span className="info-value-cusset">{getFullName() || 'Not provided'}</span>
                      </div>
                      <div className="info-row-cusset">
                        <span className="info-label-cusset">Contact Number:</span>
                        <span className="info-value-cusset">{formData.contactNumber || 'Not provided'}</span>
                      </div>
                      {user?.email && (
                        <div className="info-row-cusset">
                          <span className="info-label-cusset">Email:</span>
                          <span className="info-value-cusset">{user.email}</span>
                        </div>
                      )}
                    </div>
                    <button 
                      className="info-action-btn-cusset"
                      onClick={handleProfileClick}
                    >
                      <FaEdit /> Edit Profile
                    </button>
                  </div>

                  {/* Address Information Section */}
                  <div className="info-section-cusset">
                    <div className="info-section-title-cusset">
                      <FaMapMarkerAlt />
                      <h4>Address Information</h4>
                    </div>
                    {addressDisplay ? (
                      <div className="info-details-cusset">
                        <div className="info-row-cusset">
                          <span className="info-label-cusset">House/Building:</span>
                          <span className="info-value-cusset">{addressDisplay.houseOrBuilding || 'Not provided'}</span>
                        </div>
                        <div className="info-row-cusset">
                          <span className="info-label-cusset">Street:</span>
                          <span className="info-value-cusset">{addressDisplay.street || 'Not provided'}</span>
                        </div>
                        <div className="info-row-cusset">
                          <span className="info-label-cusset">Barangay:</span>
                          <span className="info-value-cusset">{addressDisplay.barangay || 'Not provided'}</span>
                        </div>
                        <div className="info-row-cusset">
                          <span className="info-label-cusset">City/Municipality:</span>
                          <span className="info-value-cusset">{addressDisplay.cityMunicipality || 'Not provided'}</span>
                        </div>
                        <div className="info-row-cusset">
                          <span className="info-label-cusset">Province:</span>
                          <span className="info-value-cusset">{addressDisplay.province || 'Not provided'}</span>
                        </div>
                        <div className="info-row-cusset">
                          <span className="info-label-cusset">Zip Code:</span>
                          <span className="info-value-cusset">{addressDisplay.zipCode || 'Not provided'}</span>
                        </div>
                        <div className="info-row-cusset">
                          <span className="info-label-cusset">Full Address:</span>
                          <span className="info-value-cusset">{addressDisplay.fullAddress}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="info-empty-cusset">
                        <p>No address selected</p>
                      </div>
                    )}
                    <button 
                      className="info-action-btn-cusset"
                      onClick={handleAddressClick}
                    >
                      <FaEdit /> Change Address
                    </button>
                  </div>
                </div>

                <div className="info-modal-footer-cusset">
                  <button 
                    className="info-close-btn-cusset"
                    onClick={() => setShowInfoModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Modal */}
          {showConfirmDialog && (
            <div className="schedule-modal-overlay-cusset" onClick={() => setShowConfirmDialog(false)}>
              <div className="schedule-modal-cusset" onClick={e => e.stopPropagation()}>
                <h2>Confirm Pre Assessment</h2>
                <div className="schedule-modal-summary-cusset">
                  <div className="schedule-summary-section-cusset">
                    <h4>Contact Information</h4>
                    <p><strong>Name:</strong> {getFullName()}</p>
                    <p><strong>Contact:</strong> {formData.contactNumber}</p>
                  </div>
                  <div className="schedule-summary-section-cusset">
                    <h4>Address</h4>
                    <p>{getFullAddress()}</p>
                  </div>
                  <div className="schedule-summary-section-cusset">
                    <h4>Assessment Details</h4>
                    <p><strong>Property Type:</strong> {formData.propertyType}</p>
                    <p><strong>Desired Capacity:</strong> {formData.desiredCapacity || 'Not specified'}</p>
                    {formData.systemType && (
                      <p><strong>Preferred System Type:</strong> {getSystemTypeLabel(formData.systemType)}</p>
                    )}
                    <p><strong>Roof Type:</strong> {formData.roofType || 'Not specified'}</p>
                    {(formData.roofLength || formData.roofWidth) && (
                      <p><strong>Roof Dimensions:</strong> {formData.roofLength || '?'}m x {formData.roofWidth || '?'}m</p>
                    )}
                    <p><strong>Preferred Date:</strong> {formData.preferredDate}</p>
                    <p><strong>Payment Method:</strong> {formData.paymentMethod === 'gcash' ? 'GCash' : 'Cash'}</p>
                    <p><strong>Pre Assessment Fee:</strong> ₱1,500.00</p>
                  </div>
                </div>

                <div className="schedule-modal-checkbox-cusset">
                  <label>
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                    />
                    <span>I agree to the Terms and Conditions</span>
                  </label>
                </div>

                <div className="schedule-modal-actions-cusset">
                  <button onClick={() => setShowConfirmDialog(false)} className="schedule-btn-secondary-cusset">
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmBooking}
                    disabled={!termsAccepted || isSubmitting}
                    className="schedule-btn-success-cusset"
                  >
                    {isSubmitting ? 'Processing...' : 'Confirm Booking'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <ToastNotification
            show={toast.show}
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
          />
        </div>
      </>
    );
  }

  return null;
};

export default ScheduleAssessment;