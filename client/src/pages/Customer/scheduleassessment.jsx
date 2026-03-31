// pages/Customer/scheduleassessment.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import { 
  FaTimes,
  FaCheck,
  FaEdit,
  FaPlus
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
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState('service-selection');
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

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setShowAddressSelector(false);
    if (validationErrors.address) {
      setValidationErrors(prev => ({ ...prev, address: '' }));
    }
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

  const getSelectedAddressDisplay = () => {
    if (!selectedAddress) return null;

    const name = `${formData.firstName} ${formData.lastName}`;
    const contact = formData.contactNumber;
    const address = `${selectedAddress.houseOrBuilding} ${selectedAddress.street}, ${selectedAddress.barangay}, ${selectedAddress.cityMunicipality}, ${selectedAddress.province} ${selectedAddress.zipCode}`;

    return { name, contact, address };
  };

  const sendQuoteConfirmationEmail = async (quoteReference, monthlyBill, propertyType, desiredCapacity, address) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/email/send-free-quote-confirmation`, {
        email: user.email,
        name: getFullName(),
        quoteReference: quoteReference,
        monthlyBill: monthlyBill,
        propertyType: propertyType,
        desiredCapacity: desiredCapacity,
        address: address
      });
      console.log('Quote confirmation email sent successfully');
    } catch (emailError) {
      console.error('Failed to send quote confirmation email:', emailError);
    }
  };

  const sendPreAssessmentConfirmationEmail = async (invoiceNumber, amount, propertyType, desiredCapacity, roofType, preferredDate, address) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/email/send-pre-assessment-confirmation`, {
        email: user.email,
        name: getFullName(),
        invoiceNumber: invoiceNumber,
        amount: amount,
        propertyType: propertyType,
        desiredCapacity: desiredCapacity,
        roofType: roofType,
        preferredDate: preferredDate,
        address: address
      });
      console.log('Pre-assessment confirmation email sent successfully');
    } catch (emailError) {
      console.error('Failed to send pre-assessment confirmation email:', emailError);
    }
  };

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
        desiredCapacity: freeQuoteData.desiredCapacity
      };

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/free-quotes`, quotePayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await sendQuoteConfirmationEmail(
        response.data.quote.quotationReference,
        freeQuoteData.monthlyBill,
        freeQuoteData.propertyType,
        freeQuoteData.desiredCapacity,
        getFullAddress()
      );

      setShowFreeQuoteConfirm(false);
      setSubmittedData({
        reference: response.data.quote.quotationReference,
        type: 'free-quote'
      });
      
      setCurrentStep('service-selection');
      setSubmitted(true);
      
      showToast('Quote request submitted successfully!', 'success');
      
      setIsSubmitting(false);
      
    } catch (err) {
      console.error('Error submitting quote:', err);
      showToast(err.response?.data?.message || 'Failed to submit quote request. Please try again.', 'error');
      setIsSubmitting(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.propertyType) errors.propertyType = 'Property type is required';
    if (!formData.preferredDate) errors.preferredDate = 'Preferred date is required';
    if (!selectedAddress) errors.address = 'Please select an address';
    return errors;
  };

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
        roofType: formData.roofType,
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
        formData.roofType,
        formData.preferredDate,
        getFullAddress()
      );

      setShowConfirmDialog(false);
      setTermsAccepted(false);
      
      showToast('Pre-assessment booked successfully!', 'success');
      
      setTimeout(() => {
        navigate('/app/customer/billing', { 
          state: { 
            newInvoice: {
              id: response.data.booking.invoiceNumber,
              amount: response.data.booking.assessmentFee,
              description: 'Pre Assessment Fee'
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

  const selectedAddressDisplay = getSelectedAddressDisplay();

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
            </>
          )}

          <div className="quote-actions-cusset">
            <button
              onClick={() => {
                setSubmitted(false);
                setCurrentStep('service-selection');
                setFreeQuoteData({ monthlyBill: '', propertyType: 'residential', desiredCapacity: '' });
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
                  onClick={() => setCurrentStep('form')}
                >
                  Book Pre Assessment
                </button>
              </div>
            </div>
          </div>

          {showFreeQuoteConfirm && (
            <div className="schedule-modal-overlay-cusset">
              <div className="schedule-modal-cusset">
                <button className="modal-close-btn-cusset" onClick={() => setShowFreeQuoteConfirm(false)}>
                  <FaTimes />
                </button>
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
                  <div className="quote-item-cusset">
                    <span>Address:</span>
                    <strong>{getFullAddress()}</strong>
                  </div>
                </div>

                <p className="quote-note-cusset">Our team will review your request and send a detailed quotation via email within 2-3 business days.</p>

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

  if (currentStep === 'form') {
    return (
      <>
        <Helmet>
          <title>Book Pre Assessment | Salfer Engineering</title>
        </Helmet>

        <div className="schedule-container-cusset">
          <div className="back-button-container-cusset">
            <button onClick={() => setCurrentStep('service-selection')} className="back-to-services-cusset">
              ← Back to Services
            </button>
          </div>

          <h1 className="schedule-title-cusset">Book Pre Assessment</h1>
          <p className="schedule-subtitle-cusset">Complete the form below to schedule your professional pre-assessment (₱1,500)</p>

          <div className="pre-assessment-form-wrapper-cusset">
            <div className="schedule-info-section-cusset">
              <h3 className="schedule-section-title-cusset">Contact & Address Information</h3>

              <div className="schedule-info-card-cusset">
                <div className="schedule-info-card-header-cusset">
                  <h4>Personal Information</h4>
                </div>
                <div className="schedule-info-card-content-cusset">
                  <div className="schedule-info-row-cusset">
                    <div className="schedule-info-field-cusset">
                      <label>Name</label>
                      <p>{getFullName() || 'Not provided'}</p>
                    </div>
                    <div className="schedule-info-field-cusset">
                      <label>Contact Number</label>
                      <p>{formData.contactNumber || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="schedule-info-note-cusset">
                    <small>Personal information is managed in your <button className="schedule-text-link-cusset" onClick={() => navigate('/app/customer/settings?tab=profile')}>Account Settings</button></small>
                  </div>
                </div>
              </div>

              <div className="schedule-info-card-cusset">
                <div className="schedule-info-card-header-cusset">
                  <h4>Address</h4>
                </div>
                <div className="schedule-info-card-content-cusset">
                  {selectedAddressDisplay ? (
                    <>
                      <div className="schedule-address-display-cusset">
                        <div className="schedule-address-name-cusset">{selectedAddressDisplay.name}</div>
                        <div className="schedule-address-contact-cusset">{selectedAddressDisplay.contact}</div>
                        <div className="schedule-address-detail-cusset">{selectedAddressDisplay.address}</div>
                      </div>
                      <div className="address-actions-cusset">
                        <button className="schedule-change-address-btn-cusset" onClick={() => setShowAddressSelector(true)}>
                          <FaEdit /> Change Address
                        </button>
                        <button className="schedule-add-address-btn-cusset" onClick={handleAddressClick}>
                          <FaPlus /> Add New
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="schedule-no-address-warning-cusset">
                      <p>No address found. Please add an address in settings first.</p>
                      <button onClick={handleAddressClick} className="schedule-add-address-btn-cusset">
                        Add Address
                      </button>
                    </div>
                  )}
                  {validationErrors.address && <small className="schedule-error-text-cusset">{validationErrors.address}</small>}
                </div>
              </div>
            </div>

            {/* Address Selector Modal */}
            {showAddressSelector && addresses.length > 0 && (
              <div className="schedule-modal-overlay-cusset" onClick={() => setShowAddressSelector(false)}>
                <div className="schedule-modal-cusset address-selector-modal-cusset" onClick={e => e.stopPropagation()}>
                  <button className="modal-close-btn-cusset" onClick={() => setShowAddressSelector(false)}>
                    <FaTimes />
                  </button>
                  <h2>Select Address</h2>
                  <div className="address-list-cusset">
                    {addresses.map(address => (
                      <div 
                        key={address._id} 
                        className={`address-item-cusset ${selectedAddress?._id === address._id ? 'selected-cusset' : ''}`}
                        onClick={() => handleAddressSelect(address)}
                      >
                        <div className="address-item-content-cusset">
                          <div className="address-item-label-cusset">{address.label}</div>
                          <div className="address-item-detail-cusset">
                            {address.houseOrBuilding} {address.street}, {address.barangay}
                          </div>
                          <div className="address-item-detail-cusset">
                            {address.cityMunicipality}, {address.province} {address.zipCode}
                          </div>
                          {address.isPrimary && <span className="address-primary-badge-cusset">Primary</span>}
                        </div>
                        {selectedAddress?._id === address._id && (
                          <div className="address-check-cusset">
                            <FaCheck />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="schedule-modal-actions-cusset">
                    <button onClick={() => setShowAddressSelector(false)} className="schedule-btn-secondary-cusset">
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                      <p>You will be redirected to the billing page to complete payment after booking.</p>
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

          {showConfirmDialog && (
            <div className="schedule-modal-overlay-cusset">
              <div className="schedule-modal-cusset">
                <button className="modal-close-btn-cusset" onClick={() => setShowConfirmDialog(false)}>
                  <FaTimes />
                </button>
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
                    <p><strong>Roof Type:</strong> {formData.roofType || 'Not specified'}</p>
                    <p><strong>Preferred Date:</strong> {formData.preferredDate}</p>
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