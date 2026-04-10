// pages/Customer/scheduleassessment.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import { useToast, ToastNotification } from '../../assets/toastnotification';
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
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestFilter, setRequestFilter] = useState('all');

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

  // My Requests data
  const [freeQuotes, setFreeQuotes] = useState([]);
  const [preAssessments, setPreAssessments] = useState([]);

  useEffect(() => {
    fetchClientData();
    fetchClientAddresses();
    fetchMyRequests();
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

  const fetchMyRequests = async () => {
    try {
      const token = sessionStorage.getItem('token');
      
      const [freeQuotesRes, preAssessmentsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/free-quotes/my-quotes`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments/my-bookings`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setFreeQuotes(freeQuotesRes.data.quotes || []);
      setPreAssessments(preAssessmentsRes.data.assessments || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
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

  // Helper to get formatted address from request
  const getRequestAddress = (request) => {
    let address = null;
    
    if (request.address && typeof request.address === 'object') {
      address = request.address;
    } else if (request.addressId && typeof request.addressId === 'object') {
      address = request.addressId;
    } else if (request.address && typeof request.address === 'string') {
      return request.address;
    }
    
    if (address) {
      const parts = [
        address.houseOrBuilding,
        address.street,
        address.barangay,
        address.cityMunicipality,
        address.province,
        address.zipCode
      ].filter(part => part && part.trim());
      
      return parts.length > 0 ? parts.join(', ') : 'Address not available';
    }
    
    return 'Address not available';
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

      showToast('Quote request submitted successfully!', 'success');
      fetchMyRequests();

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

      showToast('Pre-assessment booked successfully!', 'success');
      fetchMyRequests();

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

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSystemTypeLabel = (value) => {
    const type = SYSTEM_TYPES.find(t => t.value === value);
    return type ? type.label : 'Not specified';
  };

  const getAssessmentStatusBadge = (status) => {
    const badges = {
      'pending_review': <span className="status-badge-schedule pending-review">Pending Review</span>,
      'pending_payment': <span className="status-badge-schedule pending-payment">Pending Payment</span>,
      'for_verification': <span className="status-badge-schedule for-verification">For Verification</span>,
      'paid': <span className="status-badge-schedule paid">Paid</span>,
      'scheduled': <span className="status-badge-schedule scheduled">Scheduled</span>,
      'site_visit_ongoing': <span className="status-badge-schedule site-visit">Site Visit Ongoing</span>,
      'device_deployed': <span className="status-badge-schedule device-deployed">Device Deployed</span>,
      'data_collecting': <span className="status-badge-schedule data-collecting">Data Collecting</span>,
      'data_analyzing': <span className="status-badge-schedule data-analyzing">Analyzing Data</span>,
      'report_draft': <span className="status-badge-schedule report-draft">Report Draft</span>,
      'completed': <span className="status-badge-schedule completed">Completed</span>,
      'cancelled': <span className="status-badge-schedule cancelled">Cancelled</span>
    };
    return badges[status] || <span className="status-badge-schedule">{status}</span>;
  };

  const getFreeQuoteStatusBadge = (status) => {
    const badges = {
      'pending': <span className="status-badge-schedule pending">Pending</span>,
      'assigned': <span className="status-badge-schedule assigned">Assigned</span>,
      'processing': <span className="status-badge-schedule processing">Processing</span>,
      'completed': <span className="status-badge-schedule completed">Completed</span>,
      'cancelled': <span className="status-badge-schedule cancelled">Cancelled</span>
    };
    return badges[status] || <span className="status-badge-schedule">{status}</span>;
  };

  // View Quotation function
  const viewQuotation = (quotationUrl) => {
    if (quotationUrl) {
      window.open(quotationUrl, '_blank');
    } else {
      showToast('No quotation PDF available yet. Please wait for the engineer to generate it.', 'info');
    }
  };

  const addressDisplay = getAddressDisplay();

  // Get filtered requests
  const getFilteredRequests = () => {
    if (requestFilter === 'free-quotes') {
      return { freeQuotes, preAssessments: [] };
    } else if (requestFilter === 'pre-assessments') {
      return { freeQuotes: [], preAssessments };
    }
    return { freeQuotes, preAssessments };
  };

  const { freeQuotes: filteredFreeQuotes, preAssessments: filteredPreAssessments } = getFilteredRequests();
  const hasRequests = filteredFreeQuotes.length > 0 || filteredPreAssessments.length > 0;

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
                  <li>Our team will review your request</li>
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
          <div className="schedule-header-card-cusset">
            <div className="schedule-header-content-cusset">
              <h1 className="schedule-title-cusset">Get Your Solar Solution</h1>
              <p className="schedule-subtitle-cusset">Choose how you want to proceed with your solar journey</p>
            </div>
          </div>

          {/* 2 Cards */}
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
                  <label>Preferred System Type (Optional)</label>
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
                    Roof Dimensions (Optional)
                  </label>
                  <div className="dimension-row-cusset">
                    <div className="dimension-input-cusset">
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

          {/* My Requests Section - Below the 2 cards */}
          <div className="my-requests-section-cusset">
            <div className="my-requests-header-cusset">
              <h2 className="section-title-cusset">My Requests</h2>
              
              {/* Filter Tabs */}
              <div className="request-filter-tabs-cusset">
                <button
                  className={`filter-tab-cusset ${requestFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setRequestFilter('all')}
                >
                  All
                </button>
                <button
                  className={`filter-tab-cusset ${requestFilter === 'free-quotes' ? 'active' : ''}`}
                  onClick={() => setRequestFilter('free-quotes')}
                >
                  Free Quotes
                </button>
                <button
                  className={`filter-tab-cusset ${requestFilter === 'pre-assessments' ? 'active' : ''}`}
                  onClick={() => setRequestFilter('pre-assessments')}
                >
                  Pre Assessments
                </button>
              </div>
            </div>

            {!hasRequests ? (
              <div className="empty-requests-cusset">
                <p>No requests yet. Select a service above to get started.</p>
              </div>
            ) : (
              <div className="requests-table-wrapper-cusset">
                <table className="requests-table-cusset">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Reference</th>
                      <th>Type</th>
                      <th>Details</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Free Quotes */}
                    {filteredFreeQuotes.map(quote => (
                      <tr key={quote._id}>
                        <td className="date-cell">{formatDate(quote.requestedAt)}</td>
                        <td className="reference-cell">{quote.quotationReference}</td>
                        <td><span className="type-badge free-quote">Free Quote</span></td>
                        <td className="details-cell">
                          <div><strong>Monthly Bill:</strong> {formatCurrency(quote.monthlyBill)}</div>
                          <div><strong>Property:</strong> {quote.propertyType}</div>
                          {quote.desiredCapacity && <div><strong>Capacity:</strong> {quote.desiredCapacity}</div>}
                        </td>
                        <td>{getFreeQuoteStatusBadge(quote.status)}</td>
                        <td>
                          <button className="view-details-btn" onClick={() => {
                            setSelectedRequest(quote);
                            setShowDetailsModal(true);
                          }}>
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                    
                    {/* Pre Assessments */}
                    {filteredPreAssessments.map(assessment => (
                      <tr key={assessment._id}>
                        <td className="date-cell">{formatDate(assessment.bookedAt)}</td>
                        <td className="reference-cell">{assessment.bookingReference}</td>
                        <td><span className="type-badge pre-assessment">Pre Assessment</span></td>
                        <td className="details-cell">
                          <div><strong>Property:</strong> {assessment.propertyType}</div>
                          <div><strong>Preferred Date:</strong> {formatDate(assessment.preferredDate)}</div>
                          <div><strong>Amount:</strong> {formatCurrency(assessment.assessmentFee)}</div>
                        </td>
                        <td>{getAssessmentStatusBadge(assessment.assessmentStatus || assessment.paymentStatus)}</td>
                        <td>
                          <button className="view-details-btn" onClick={() => {
                            setSelectedRequest(assessment);
                            setShowDetailsModal(true);
                          }}>
                            View Status
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Free Quote Confirmation Modal */}
          {showFreeQuoteConfirm && (
            <div className="schedule-modal-overlay-cusset">
              <div className="schedule-modal-cusset">
                <button className="modal-close-cusset" onClick={() => setShowFreeQuoteConfirm(false)}>×</button>
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

          {/* Details Modal - COMPLETE FIXED VERSION */}
          {showDetailsModal && selectedRequest && (
            <div className="schedule-modal-overlay-cusset" onClick={() => setShowDetailsModal(false)}>
              <div className="schedule-modal-cusset status-modal-cusset" onClick={e => e.stopPropagation()}>
                <button className="modal-close-cusset" onClick={() => setShowDetailsModal(false)}>×</button>
                <h2>Request Details</h2>
                
                {selectedRequest.quotationReference ? (
                  // Free Quote Details
                  <>
                    <div className="status-detail-section">
                      <h3>Quote Information</h3>
                      <div className="detail-row">
                        <span>Reference:</span>
                        <strong>{selectedRequest.quotationReference}</strong>
                      </div>
                      <div className="detail-row">
                        <span>Requested Date:</span>
                        <strong>{formatDate(selectedRequest.requestedAt)}</strong>
                      </div>
                      <div className="detail-row">
                        <span>Status:</span>
                        <strong>{getFreeQuoteStatusBadge(selectedRequest.status)}</strong>
                      </div>
                    </div>

                    <div className="status-detail-section">
                      <h3>Details</h3>
                      <div className="detail-row">
                        <span>Monthly Bill:</span>
                        <strong>{formatCurrency(selectedRequest.monthlyBill)}</strong>
                      </div>
                      <div className="detail-row">
                        <span>Property Type:</span>
                        <strong>{selectedRequest.propertyType}</strong>
                      </div>
                      {selectedRequest.desiredCapacity && (
                        <div className="detail-row">
                          <span>Desired Capacity:</span>
                          <strong>{selectedRequest.desiredCapacity}</strong>
                        </div>
                      )}
                      {selectedRequest.systemType && (
                        <div className="detail-row">
                          <span>System Type:</span>
                          <strong>{getSystemTypeLabel(selectedRequest.systemType)}</strong>
                        </div>
                      )}
                    </div>

                    <div className="status-detail-section">
                      <h3>Address</h3>
                      <p>{getRequestAddress(selectedRequest)}</p>
                    </div>

                    {/* View Quotation Button for Free Quote */}
                    {(() => {
                      const quotationUrl = selectedRequest.quotationFile;
                      const isCompleted = selectedRequest.status === 'completed';
                      
                      if (isCompleted && quotationUrl) {
                        return (
                          <div className="status-detail-section">
                            <button 
                              className="view-quotation-btn-cusset"
                              onClick={() => viewQuotation(quotationUrl)}
                            >
                              <span>📄</span> View Quotation PDF
                            </button>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    
                    {selectedRequest.status === 'completed' && !selectedRequest.quotationFile && (
                      <div className="status-info">
                        <p>Your quotation is being prepared. Please check back later.</p>
                      </div>
                    )}
                  </>
                ) : (
                  // Pre Assessment Details
                  <>
                    <div className="status-detail-section">
                      <h3>Booking Information</h3>
                      <div className="detail-row">
                        <span>Reference:</span>
                        <strong>{selectedRequest.bookingReference}</strong>
                      </div>
                      <div className="detail-row">
                        <span>Booked Date:</span>
                        <strong>{formatDate(selectedRequest.bookedAt)}</strong>
                      </div>
                      <div className="detail-row">
                        <span>Payment Status:</span>
                        <strong>{getAssessmentStatusBadge(selectedRequest.paymentStatus)}</strong>
                      </div>
                      <div className="detail-row">
                        <span>Assessment Status:</span>
                        <strong>{getAssessmentStatusBadge(selectedRequest.assessmentStatus)}</strong>
                      </div>
                    </div>

                    <div className="status-detail-section">
                      <h3>Assessment Details</h3>
                      <div className="detail-row">
                        <span>Property Type:</span>
                        <strong>{selectedRequest.propertyType}</strong>
                      </div>
                      <div className="detail-row">
                        <span>Preferred Date:</span>
                        <strong>{formatDate(selectedRequest.preferredDate)}</strong>
                      </div>
                      <div className="detail-row">
                        <span>Assessment Fee:</span>
                        <strong>{formatCurrency(selectedRequest.assessmentFee)}</strong>
                      </div>
                      {selectedRequest.desiredCapacity && (
                        <div className="detail-row">
                          <span>Desired Capacity:</span>
                          <strong>{selectedRequest.desiredCapacity}</strong>
                        </div>
                      )}
                      {selectedRequest.systemType && (
                        <div className="detail-row">
                          <span>System Type:</span>
                          <strong>{getSystemTypeLabel(selectedRequest.systemType)}</strong>
                        </div>
                      )}
                      {selectedRequest.roofType && (
                        <div className="detail-row">
                          <span>Roof Type:</span>
                          <strong>{selectedRequest.roofType}</strong>
                        </div>
                      )}
                    </div>

                    <div className="status-detail-section">
                      <h3>Address</h3>
                      <p>{getRequestAddress(selectedRequest)}</p>
                    </div>

                    {/* View Assessment Report Button for Pre Assessment - FIXED */}
                    {(() => {
                      // Check for quotation URL in multiple possible locations
                      const quotationUrl = 
                        selectedRequest.quotation?.quotationUrl || 
                        selectedRequest.quotation?.url || 
                        selectedRequest.finalQuotation ||
                        selectedRequest.quotationFile;
                      
                      const isCompleted = selectedRequest.assessmentStatus === 'completed' || 
                                          selectedRequest.status === 'completed';
                      
                      if (isCompleted && quotationUrl) {
                        return (
                          <div className="status-detail-section">
                            <button 
                              className="view-quotation-btn-cusset"
                              onClick={() => viewQuotation(quotationUrl)}
                            >
                              <span>📄</span> View Assessment Report
                            </button>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {selectedRequest.paymentStatus === 'for_verification' && (
                      <div className="status-warning">
                        <p>Your payment is currently under review. Please wait for verification.</p>
                      </div>
                    )}

                    {selectedRequest.paymentStatus === 'paid' && selectedRequest.assessmentStatus === 'scheduled' && (
                      <div className="status-success">
                        <p>Payment confirmed! Your site assessment has been scheduled.</p>
                      </div>
                    )}

                    {selectedRequest.assessmentStatus === 'completed' && 
                     !selectedRequest.quotation?.quotationUrl && 
                     !selectedRequest.finalQuotation && 
                     !selectedRequest.quotationFile && (
                      <div className="status-info">
                        <p>Assessment completed! The report is being prepared. Please check back later.</p>
                      </div>
                    )}
                  </>
                )}

                <div className="modal-actions-cusset">
                  <button className="close-btn-cusset" onClick={() => setShowDetailsModal(false)}>Close</button>
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

              <div
                className="combined-info-card-cusset"
                onClick={() => setShowInfoModal(true)}
              >
                <div className="combined-info-header-cusset">
                  <div className="combined-info-content-cusset">
                    <div className="combined-info-name-cusset">
                      {getFullName() || 'Not provided'}
                    </div>
                    <div className="combined-info-contact-cusset">
                      <span>{formData.contactNumber || 'Not provided'}</span>
                    </div>
                    <div className="combined-info-address-cusset">
                      <span className="truncate">{getFullAddress() || 'No address selected'}</span>
                    </div>
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
                    <label>Preferred System Type (Optional)</label>
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
                      Roof Dimensions
                    </label>
                    <div className="dimension-row-cusset">
                      <div className="dimension-input-cusset">
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
                        You will be redirected to the billing page to upload your payment proof after booking.
                      </p>
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
                  <button className="modal-close-cusset" onClick={() => setShowInfoModal(false)}>×</button>
                </div>

                <div className="info-modal-body-cusset">
                  <div className="info-section-cusset">
                    <div className="info-section-title-cusset">
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
                    <button className="info-action-btn-cusset" onClick={handleProfileClick}>Edit Profile</button>
                  </div>

                  <div className="info-section-cusset">
                    <div className="info-section-title-cusset">
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
                    <button className="info-action-btn-cusset" onClick={handleAddressClick}>Change Address</button>
                  </div>
                </div>

                <div className="info-modal-footer-cusset">
                  <button className="info-close-btn-cusset" onClick={() => setShowInfoModal(false)}>Close</button>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Modal */}
          {showConfirmDialog && (
            <div className="schedule-modal-overlay-cusset" onClick={() => setShowConfirmDialog(false)}>
              <div className="schedule-modal-cusset" onClick={e => e.stopPropagation()}>
                <button className="modal-close-cusset" onClick={() => setShowConfirmDialog(false)}>×</button>
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