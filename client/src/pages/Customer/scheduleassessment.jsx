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
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [requestFilter, setRequestFilter] = useState('all');

  const SYSTEM_TYPES = [
    { value: 'grid-tie', label: 'Grid-Tie System', description: 'Connected to utility grid, no batteries' },
    { value: 'hybrid', label: 'Hybrid System', description: 'Grid-tie with battery backup' },
    { value: 'off-grid', label: 'Off-Grid System', description: 'Standalone with batteries, not connected to grid' }
  ];

  const [freeQuoteData, setFreeQuoteData] = useState({
    monthlyBill: '',
    propertyType: 'residential',
    desiredCapacity: '',
    systemType: '',
    roofLength: '',
    roofWidth: ''
  });
  const [showFreeQuoteConfirm, setShowFreeQuoteConfirm] = useState(false);

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
      axios.get(`${import.meta.env.VITE_API_URL}/api/free-quotes/my-quotes`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments/my-bookings`, { headers: { Authorization: `Bearer ${token}` } })
    ]);

    const assessments = preAssessmentsRes.data.assessments || [];

    

    // For each assessment, extract engineer info
    const assessmentsWithEngineer = await Promise.all(assessments.map(async (assessment) => {
      let engineerName = 'Not assigned yet';

      // Get engineer ID - handle both object and string cases
      let engineerId = null;
      if (assessment.assignedEngineerId) {
        if (typeof assessment.assignedEngineerId === 'object') {
          engineerId = assessment.assignedEngineerId._id || assessment.assignedEngineerId.id;
        } else if (typeof assessment.assignedEngineerId === 'string') {
          engineerId = assessment.assignedEngineerId;
        }
      }
      
      
      
      // Fetch engineer name if ID exists
      if (engineerId) {
        try {
          console.log(`  - Fetching engineer details for ID: ${engineerId}`);
          const engineerRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users/${engineerId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const engineer = engineerRes.data.user;

          if (engineer) {
            engineerName = engineer.fullName ||
              (engineer.firstName && engineer.lastName ? `${engineer.firstName} ${engineer.lastName}` : null) ||
              engineer.name ||
              engineer.email ||
              'Engineer assigned';
            console.log(`  - Engineer name found: ${engineerName}`);
          }
        } catch (err) {
          console.error(`  - Error fetching engineer:`, err);
          engineerName = 'Engineer assigned';
        }
      } 

      return { ...assessment, engineerName };
    }));

    setFreeQuotes(freeQuotesRes.data.quotes || []);
    setPreAssessments(assessmentsWithEngineer);
  } catch (err) {
    console.error('Error fetching requests:', err);
  }
};

  const handleAddressClick = () => navigate('/app/customer/settings?tab=addresses');
  const handleProfileClick = () => navigate('/app/customer/settings?tab=profile');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (currentStep === 'service-selection') {
      setFreeQuoteData(prev => ({ ...prev, [name]: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      if (validationErrors[name]) setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const getFullName = () => [formData.firstName, formData.middleName, formData.lastName].filter(p => p).join(' ');

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

  const getRequestAddress = (request) => {
    let address = null;
    if (request.address && typeof request.address === 'object') address = request.address;
    else if (request.addressId && typeof request.addressId === 'object') address = request.addressId;
    else if (request.address && typeof request.address === 'string') return request.address;
    if (address) {
      const parts = [address.houseOrBuilding, address.street, address.barangay, address.cityMunicipality, address.province, address.zipCode].filter(part => part && part.trim());
      return parts.length > 0 ? parts.join(', ') : 'Address not available';
    }
    return 'Address not available';
  };

  const sendQuoteConfirmationEmail = async (quoteReference, monthlyBill, propertyType, desiredCapacity, systemType, roofLength, roofWidth, address) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/email/send-free-quote-confirmation`, {
        email: user.email, name: getFullName(), quoteReference, monthlyBill, propertyType, desiredCapacity, systemType, roofLength, roofWidth, address
      });
    } catch (emailError) {
      console.error('Failed to send quote confirmation email:', emailError);
    }
  };

  const sendPreAssessmentConfirmationEmail = async (invoiceNumber, amount, propertyType, desiredCapacity, systemType, roofType, roofLength, roofWidth, preferredDate, address, paymentMethod) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/email/send-pre-assessment-confirmation`, {
        email: user.email, name: getFullName(), invoiceNumber, amount, propertyType, desiredCapacity, systemType, roofType, roofLength, roofWidth, preferredDate, address, paymentMethod
      });
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
        clientId: user?._id, addressId: selectedAddress?._id || null,
        monthlyBill: freeQuoteData.monthlyBill, propertyType: freeQuoteData.propertyType,
        desiredCapacity: freeQuoteData.desiredCapacity, systemType: freeQuoteData.systemType,
        roofLength: freeQuoteData.roofLength, roofWidth: freeQuoteData.roofWidth
      };
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/free-quotes`, quotePayload, { headers: { Authorization: `Bearer ${token}` } });
      await sendQuoteConfirmationEmail(response.data.quote.quotationReference, freeQuoteData.monthlyBill, freeQuoteData.propertyType, freeQuoteData.desiredCapacity, freeQuoteData.systemType, freeQuoteData.roofLength, freeQuoteData.roofWidth, getFullAddress());
      setShowFreeQuoteConfirm(false);
      setSubmittedData({ reference: response.data.quote.quotationReference, type: 'free-quote' });
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
        clientId: user?._id, addressId: selectedAddress?._id || null,
        propertyType: formData.propertyType, desiredCapacity: formData.desiredCapacity,
        systemType: formData.systemType, roofType: formData.roofType,
        roofLength: formData.roofLength, roofWidth: formData.roofWidth,
        preferredDate: formData.preferredDate,
      };
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/pre-assessments`, bookingPayload, { headers: { Authorization: `Bearer ${token}` } });
      await sendPreAssessmentConfirmationEmail(response.data.booking.invoiceNumber, response.data.booking.assessmentFee, formData.propertyType, formData.desiredCapacity, formData.systemType, formData.roofType, formData.roofLength, formData.roofWidth, formData.preferredDate, getFullAddress(), formData.paymentMethod);
      setShowConfirmDialog(false);
      setTermsAccepted(false);
      showToast('Pre-assessment booked successfully!', 'success');
      fetchMyRequests();
      setTimeout(() => {
        navigate('/app/customer/billing', { state: { newInvoice: { id: response.data.booking.invoiceNumber, amount: response.data.booking.assessmentFee, description: 'Pre Assessment Fee' } } });
      }, 1500);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit pre-assessment. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value || 0);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
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
      'site_visit_ongoing': <span className="status-badge-schedule site-visit">Site Visit</span>,
      'device_deployed': <span className="status-badge-schedule device-deployed">Device Deployed</span>,
      'data_collecting': <span className="status-badge-schedule data-collecting">Collecting</span>,
      'data_analyzing': <span className="status-badge-schedule data-analyzing">Analyzing</span>,
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

  const viewQuotation = (quotationUrl) => {
    if (quotationUrl) window.open(quotationUrl, '_blank');
    else showToast('No quotation PDF available yet.', 'info');
  };

  const addressDisplay = getAddressDisplay();

  const getFilteredRequests = () => {
    if (requestFilter === 'free-quotes') return { freeQuotes, preAssessments: [] };
    if (requestFilter === 'pre-assessments') return { freeQuotes: [], preAssessments };
    return { freeQuotes, preAssessments };
  };

  const { freeQuotes: filteredFreeQuotes, preAssessments: filteredPreAssessments } = getFilteredRequests();
  const hasRequests = freeQuotes.length > 0 || preAssessments.length > 0;
  const totalRequests = freeQuotes.length + preAssessments.length;

  const SkeletonLoader = () => (
    <div className="schedule-container-cusset">
      <div className="schedule-header-card-cusset skeleton-card">
        <div className="skeleton-line large"></div>
        <div className="skeleton-line small"></div>
      </div>
      <div className="service-selection-grid-cusset">
        <div className="skeleton-service-card"></div>
        <div className="skeleton-service-card"></div>
      </div>
    </div>
  );

  if (loading) return <><Helmet><title>Get Solar Service | Salfer Engineering</title></Helmet><SkeletonLoader /></>;

  if (error) return (
    <div className="schedule-error-container-cusset">
      <h2>Something went wrong</h2>
      <p>{error}</p>
      <div className="schedule-error-actions-cusset">
        <button onClick={fetchClientData} className="schedule-btn-primary-cusset">Try Again</button>
        <button onClick={() => window.location.href = '/login'} className="schedule-btn-secondary-cusset">Go to Login</button>
      </div>
    </div>
  );

  if (submitted) return (
    <div className="schedule-container-cusset">
      <div className="schedule-confirmation-card-cusset">
        <div className="confirmation-icon">✓</div>
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
              <ul><li>Our team will review your request</li><li>You'll receive a detailed quotation via email</li><li>Our engineer may contact you for additional information</li></ul>
            </div>
          </>
        )}
        <div className="quote-actions-cusset">
          <button onClick={() => { setSubmitted(false); setCurrentStep('service-selection'); setFreeQuoteData({ monthlyBill: '', propertyType: 'residential', desiredCapacity: '', systemType: '', roofLength: '', roofWidth: '' }); setSubmittedData(null); }} className="schedule-btn-secondary-cusset">Request Another</button>
          <button onClick={() => navigate('/app/customer')} className="schedule-btn-primary-cusset">Go to Dashboard</button>
        </div>
      </div>
      <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
    </div>
  );

  if (currentStep === 'service-selection') {
    return (
      <>
        <Helmet><title>Get Solar Service | Salfer Engineering</title></Helmet>
        <div className="schedule-container-cusset">
          <div className="schedule-header-card-cusset">
            <div className="schedule-header-content-cusset">
              <h1 className="schedule-title-cusset">Get Your Solar Solution</h1>
              <p className="schedule-subtitle-cusset">Choose how you want to proceed with your solar journey</p>
            </div>
            <div className="schedule-header-action-cusset">
              <button className="view-requests-btn-cusset" onClick={() => setShowRequestsModal(true)}>
                View My Requests {totalRequests > 0 && <span className="request-count">{totalRequests}</span>}
              </button>
            </div>
          </div>

          <div className="service-selection-grid-cusset">
            {/* Free Quote Card */}
            <div className="service-card-cusset">
              <div className="service-card-header-cusset">
                <h2>Free Quotation</h2>
                <span className="service-badge-cusset free-cusset">Free</span>
              </div>
              <p className="service-description-cusset">Request a free quotation for your solar system. Our team will review and provide a detailed estimate.</p>
              <div className="quote-form-cusset">
                <div className="schedule-form-group-cusset">
                  <label>Monthly Electricity Bill (₱)</label>
                  <input type="number" name="monthlyBill" value={freeQuoteData.monthlyBill} onChange={handleInputChange} placeholder="e.g., 5000" className="schedule-form-input-cusset" />
                </div>
                <div className="schedule-form-group-cusset">
                  <label>Property Type</label>
                  <select name="propertyType" value={freeQuoteData.propertyType} onChange={handleInputChange} className="schedule-form-select-cusset">
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="industrial">Industrial</option>
                  </select>
                </div>
                <div className="schedule-form-group-cusset">
                  <label>Desired Capacity (kW)</label>
                  <input type="text" name="desiredCapacity" value={freeQuoteData.desiredCapacity} onChange={handleInputChange} placeholder="e.g., 5kW (optional)" className="schedule-form-input-cusset" />
                </div>
                <div className="schedule-form-group-cusset">
                  <label>Preferred System Type</label>
                  <select name="systemType" value={freeQuoteData.systemType} onChange={handleInputChange} className="schedule-form-select-cusset">
                    <option value="">Select (optional)</option>
                    {SYSTEM_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                </div>
                <div className="schedule-form-group-cusset">
                  <label>Roof Dimensions (Optional)</label>
                  <div className="dimension-row-cusset">
                    <input type="number" step="0.1" name="roofLength" value={freeQuoteData.roofLength} onChange={handleInputChange} placeholder="Length (m)" className="schedule-form-input-cusset" />
                    <input type="number" step="0.1" name="roofWidth" value={freeQuoteData.roofWidth} onChange={handleInputChange} placeholder="Width (m)" className="schedule-form-input-cusset" />
                  </div>
                </div>
              </div>
              <div className="card-button-container-cusset">
                <button className="btn-get-quote-cusset" onClick={handleFreeQuoteSubmit} disabled={!freeQuoteData.monthlyBill}>Request Quotation</button>
              </div>
            </div>

            {/* Pre Assessment Card */}
            <div className="service-card-cusset paid-cusset">
              <div className="service-card-header-cusset">
                <h2>Pre Assessment</h2>
                <span className="service-badge-cusset paid-cusset">₱1,500</span>
              </div>
              <p className="service-description-cusset">Professional on-site assessment with 7-day IoT monitoring for accurate data and detailed report.</p>
              <ul className="service-features-cusset">
                <li>On-site visit with monitoring device</li>
                <li>7-day environmental data collection</li>
                <li>Accurate system size recommendation</li>
                <li>Detailed assessment report</li>
                <li>Professional engineer consultation</li>
              </ul>
              <div className="card-button-container-cusset">
                <button className="btn-paid-assessment-cusset" onClick={() => setCurrentStep('form')}>Book Pre Assessment</button>
              </div>
            </div>
          </div>

          {/* My Requests Modal */}
          {showRequestsModal && (
            <div className="schedule-modal-overlay-cusset" onClick={() => setShowRequestsModal(false)}>
              <div className="requests-modal-cusset" onClick={e => e.stopPropagation()}>
                <div className="requests-modal-header-cusset">
                  <h2>My Requests</h2>
                  <button className="modal-close-cusset" onClick={() => setShowRequestsModal(false)}>×</button>
                </div>
                <div className="request-filter-tabs-cusset">
                  <button className={`filter-tab-cusset ${requestFilter === 'all' ? 'active' : ''}`} onClick={() => setRequestFilter('all')}>All</button>
                  <button className={`filter-tab-cusset ${requestFilter === 'free-quotes' ? 'active' : ''}`} onClick={() => setRequestFilter('free-quotes')}>Free Quotes</button>
                  <button className={`filter-tab-cusset ${requestFilter === 'pre-assessments' ? 'active' : ''}`} onClick={() => setRequestFilter('pre-assessments')}>Pre Assessments</button>
                </div>
                <div className="requests-modal-body-cusset">
                  {!hasRequests ? (
                    <div className="empty-requests-cusset"><p>No requests yet. Select a service above to get started.</p></div>
                  ) : (
                    <table className="requests-table-cusset">
                      <thead>
                        <tr><th>Date</th><th>Reference</th><th>Type</th><th>Details</th><th>Status</th><th></th></tr>
                      </thead>
                      <tbody>
                        {filteredFreeQuotes.map(quote => (
                          <tr key={quote._id}>
                            <td>{formatDate(quote.requestedAt)}</td>
                            <td className="reference-cell">{quote.quotationReference}</td>
                            <td><span className="type-badge free-quote">Free Quote</span></td>
                            <td className="details-cell"><div><strong>Monthly:</strong> {formatCurrency(quote.monthlyBill)}</div><div><strong>Property:</strong> {quote.propertyType}</div></td>
                            <td>{getFreeQuoteStatusBadge(quote.status)}</td>
                            <td><button className="view-details-btn" onClick={() => { setSelectedRequest(quote); setShowDetailsModal(true); }}>View</button></td>
                          </tr>
                        ))}
                        {filteredPreAssessments.map(assessment => (
                          <tr key={assessment._id}>
                            <td>{formatDate(assessment.bookedAt)}</td>
                            <td className="reference-cell">{assessment.bookingReference}</td>
                            <td><span className="type-badge pre-assessment">Pre Assessment</span></td>
                            <td className="details-cell"><div><strong>Property:</strong> {assessment.propertyType}</div><div><strong>Date:</strong> {formatDate(assessment.preferredDate)}</div></td>
                            <td>{getAssessmentStatusBadge(assessment.assessmentStatus || assessment.paymentStatus)}</td>
                            <td><button className="view-details-btn" onClick={() => { setSelectedRequest(assessment); setShowDetailsModal(true); }}>View</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Free Quote Confirm Modal */}
          {showFreeQuoteConfirm && (
            <div className="schedule-modal-overlay-cusset" onClick={() => setShowFreeQuoteConfirm(false)}>
              <div className="schedule-modal-cusset" onClick={e => e.stopPropagation()}>
                <button className="modal-close-cusset" onClick={() => setShowFreeQuoteConfirm(false)}>×</button>
                <h2>Confirm Quotation Request</h2>
                <div className="quote-summary-cusset">
                  <div className="quote-item-cusset"><span>Monthly Bill:</span><strong>{formatCurrency(freeQuoteData.monthlyBill)}</strong></div>
                  <div className="quote-item-cusset"><span>Property Type:</span><strong>{freeQuoteData.propertyType}</strong></div>
                  {freeQuoteData.desiredCapacity && <div className="quote-item-cusset"><span>Capacity:</span><strong>{freeQuoteData.desiredCapacity}</strong></div>}
                  <div className="quote-item-cusset"><span>Address:</span><strong>{getFullAddress()}</strong></div>
                </div>
                <div className="schedule-modal-actions-cusset">
                  <button onClick={() => setShowFreeQuoteConfirm(false)} className="schedule-btn-secondary-cusset">Cancel</button>
                  <button onClick={confirmFreeQuote} disabled={isSubmitting} className="schedule-btn-success-cusset">{isSubmitting ? 'Submitting...' : 'Submit Request'}</button>
                </div>
              </div>
            </div>
          )}

          {/* Details Modal */}
          {showDetailsModal && selectedRequest && (
            <div className="schedule-modal-overlay-cusset" onClick={() => setShowDetailsModal(false)}>
              <div className="schedule-modal-cusset status-modal-cusset" onClick={e => e.stopPropagation()}>
                <button className="modal-close-cusset" onClick={() => setShowDetailsModal(false)}>×</button>
                <h2>Request Details</h2>
                {selectedRequest.quotationReference ? (
                  <>
                    <div className="status-detail-section">
                      <h3>Quote Information</h3>
                      <div className="detail-row"><span>Reference:</span><strong>{selectedRequest.quotationReference}</strong></div>
                      <div className="detail-row"><span>Date:</span><strong>{formatDate(selectedRequest.requestedAt)}</strong></div>
                      <div className="detail-row"><span>Status:</span>{getFreeQuoteStatusBadge(selectedRequest.status)}</div>
                    </div>
                    <div className="status-detail-section">
                      <h3>Details</h3>
                      <div className="detail-row"><span>Monthly Bill:</span><strong>{formatCurrency(selectedRequest.monthlyBill)}</strong></div>
                      <div className="detail-row"><span>Property:</span><strong>{selectedRequest.propertyType}</strong></div>
                    </div>
                    <div className="status-detail-section"><h3>Address</h3><p>{getRequestAddress(selectedRequest)}</p></div>
                    {selectedRequest.status === 'completed' && selectedRequest.quotationFile && (
                      <button className="view-quotation-btn-cusset" onClick={() => viewQuotation(selectedRequest.quotationFile)}>View Quotation PDF</button>
                    )}
                  </>
                ) : (
                  <>
                    <div className="status-detail-section">
                      <h3>Booking Information</h3>
                      <div className="detail-row"><span>Reference:</span><strong>{selectedRequest.bookingReference}</strong></div>
                      <div className="detail-row"><span>Booked:</span><strong>{formatDate(selectedRequest.bookedAt)}</strong></div>
                      <div className="detail-row"><span>Payment:</span>{getAssessmentStatusBadge(selectedRequest.paymentStatus)}</div>
                      <div className="detail-row"><span>Assessment:</span>{getAssessmentStatusBadge(selectedRequest.assessmentStatus)}</div>
                      <div className="detail-row"><span>Assigned Engineer:</span><strong>{selectedRequest.engineerName || 'Not assigned yet'}</strong></div>
                    </div>
                    <div className="status-detail-section">
                      <h3>Details</h3>
                      <div className="detail-row"><span>Property:</span><strong>{selectedRequest.propertyType}</strong></div>
                      <div className="detail-row"><span>Preferred Date:</span><strong>{formatDate(selectedRequest.preferredDate)}</strong></div>
                      <div className="detail-row"><span>Fee:</span><strong>{formatCurrency(selectedRequest.assessmentFee)}</strong></div>
                    </div>
                    <div className="status-detail-section"><h3>Address</h3><p>{getRequestAddress(selectedRequest)}</p></div>
                    {selectedRequest.assessmentStatus === 'completed' && selectedRequest.finalQuotation && (
                      <button className="view-quotation-btn-cusset" onClick={() => viewQuotation(selectedRequest.finalQuotation)}>View Assessment Report</button>
                    )}
                  </>
                )}
                <div className="modal-actions-cusset"><button className="close-btn-cusset" onClick={() => setShowDetailsModal(false)}>Close</button></div>
              </div>
            </div>
          )}

          <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
        </div>
      </>
    );
  }

  if (currentStep === 'form') {
    return (
      <>
        <Helmet><title>Book Pre Assessment | Salfer Engineering</title></Helmet>
        <div className="schedule-container-cusset">
          <div className="back-button-container-cusset">
            <button onClick={() => setCurrentStep('service-selection')} className="back-to-services-cusset">← Back to Services</button>
          </div>
          <h1 className="schedule-title-cusset">Book Pre Assessment</h1>
          <p className="schedule-subtitle-cusset">Complete the form below to schedule your professional pre-assessment (₱1,500)</p>
          <div className="pre-assessment-form-wrapper-cusset">
            <div className="schedule-info-section-cusset">
              <h3 className="schedule-section-title-cusset">Contact & Address Information</h3>
              <div className="combined-info-card-cusset" onClick={() => setShowInfoModal(true)}>
                <div className="combined-info-header-cusset">
                  <div className="combined-info-content-cusset">
                    <div className="combined-info-name-cusset">{getFullName() || 'Not provided'}</div>
                    <div className="combined-info-contact-cusset">{formData.contactNumber || 'Not provided'}</div>
                    <div className="combined-info-address-cusset">{getFullAddress() || 'No address selected'}</div>
                  </div>
                </div>
                <div className="combined-info-hint-cusset">Click to view full details and manage settings</div>
              </div>
            </div>
            <div className="schedule-assessment-details-section-cusset">
              <h3 className="schedule-section-title-cusset">Assessment Details</h3>
              <div className="schedule-assessment-form-cusset">
                <div className="schedule-form-grid-cusset">
                  <div className="schedule-form-group-cusset">
                    <label>Property Type *</label>
                    <select name="propertyType" value={formData.propertyType} onChange={handleInputChange} className="schedule-form-select-cusset">
                      <option value="residential">Residential</option><option value="commercial">Commercial</option><option value="industrial">Industrial</option>
                    </select>
                  </div>
                  <div className="schedule-form-group-cusset">
                    <label>Desired Capacity (kW)</label>
                    <input type="text" name="desiredCapacity" value={formData.desiredCapacity} onChange={handleInputChange} className="schedule-form-input-cusset" placeholder="e.g., 5kW (optional)" />
                  </div>
                  <div className="schedule-form-group-cusset">
                    <label>Preferred System Type</label>
                    <select name="systemType" value={formData.systemType} onChange={handleInputChange} className="schedule-form-select-cusset">
                      <option value="">Select (optional)</option>
                      {SYSTEM_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                    </select>
                  </div>
                  <div className="schedule-form-group-cusset">
                    <label>Roof Type</label>
                    <select name="roofType" value={formData.roofType} onChange={handleInputChange} className="schedule-form-select-cusset">
                      <option value="">Select</option><option value="concrete">Concrete</option><option value="metal">Metal</option><option value="tile">Tile</option><option value="other">Other</option>
                    </select>
                  </div>
                  <div className="schedule-form-group-cusset">
                    <label>Roof Dimensions</label>
                    <div className="dimension-row-cusset">
                      <input type="number" step="0.1" name="roofLength" value={formData.roofLength} onChange={handleInputChange} placeholder="Length (m)" className="schedule-form-input-cusset" />
                      <input type="number" step="0.1" name="roofWidth" value={formData.roofWidth} onChange={handleInputChange} placeholder="Width (m)" className="schedule-form-input-cusset" />
                    </div>
                  </div>
                  <div className="schedule-form-group-cusset">
                    <label>Preferred Start Date *</label>
                    <input type="date" name="preferredDate" value={formData.preferredDate} onChange={handleInputChange} className="schedule-form-input-cusset" min={new Date().toISOString().split('T')[0]} />
                  </div>
                </div>
                <div className="schedule-fee-card-cusset">
                  <strong>Pre Assessment Fee: ₱1,500.00</strong>
                  <p>You will be redirected to the billing page to upload your payment proof after booking.</p>
                </div>
                <div className="form-actions-cusset">
                  <button onClick={handleSubmitClick} className="schedule-btn-submit-cusset">Continue to Confirmation</button>
                </div>
              </div>
            </div>
          </div>

          {showInfoModal && (
            <div className="schedule-modal-overlay-cusset" onClick={() => setShowInfoModal(false)}>
              <div className="schedule-modal-cusset info-modal-cusset" onClick={e => e.stopPropagation()}>
                <div className="info-modal-header-cusset"><h3>Contact & Address Details</h3><button className="modal-close-cusset" onClick={() => setShowInfoModal(false)}>×</button></div>
                <div className="info-modal-body-cusset">
                  <div className="info-section-cusset">
                    <h4>Personal Information</h4>
                    <div className="info-details-cusset">
                      <div className="info-row-cusset"><span>Full Name:</span><span>{getFullName() || 'Not provided'}</span></div>
                      <div className="info-row-cusset"><span>Contact:</span><span>{formData.contactNumber || 'Not provided'}</span></div>
                      {user?.email && <div className="info-row-cusset"><span>Email:</span><span>{user.email}</span></div>}
                    </div>
                    <button className="info-action-btn-cusset" onClick={handleProfileClick}>Edit Profile</button>
                  </div>
                  <div className="info-section-cusset">
                    <h4>Address Information</h4>
                    {addressDisplay ? (
                      <div className="info-details-cusset">
                        <div className="info-row-cusset"><span>House/Building:</span><span>{addressDisplay.houseOrBuilding}</span></div>
                        <div className="info-row-cusset"><span>Street:</span><span>{addressDisplay.street}</span></div>
                        <div className="info-row-cusset"><span>Barangay:</span><span>{addressDisplay.barangay}</span></div>
                        <div className="info-row-cusset"><span>City:</span><span>{addressDisplay.cityMunicipality}</span></div>
                        <div className="info-row-cusset"><span>Province:</span><span>{addressDisplay.province}</span></div>
                      </div>
                    ) : <p>No address selected</p>}
                    <button className="info-action-btn-cusset" onClick={handleAddressClick}>Change Address</button>
                  </div>
                </div>
                <div className="info-modal-footer-cusset"><button className="info-close-btn-cusset" onClick={() => setShowInfoModal(false)}>Close</button></div>
              </div>
            </div>
          )}

          {showConfirmDialog && (
            <div className="schedule-modal-overlay-cusset" onClick={() => setShowConfirmDialog(false)}>
              <div className="schedule-modal-cusset" onClick={e => e.stopPropagation()}>
                <button className="modal-close-cusset" onClick={() => setShowConfirmDialog(false)}>×</button>
                <h2>Confirm Pre Assessment</h2>
                <div className="schedule-modal-summary-cusset">
                  <div className="schedule-summary-section-cusset"><h4>Contact</h4><p><strong>Name:</strong> {getFullName()}</p><p><strong>Contact:</strong> {formData.contactNumber}</p></div>
                  <div className="schedule-summary-section-cusset"><h4>Address</h4><p>{getFullAddress()}</p></div>
                  <div className="schedule-summary-section-cusset"><h4>Details</h4><p><strong>Property:</strong> {formData.propertyType}</p><p><strong>Date:</strong> {formData.preferredDate}</p><p><strong>Fee:</strong> ₱1,500.00</p></div>
                </div>
                <div className="schedule-modal-checkbox-cusset"><label><input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} /><span>I agree to the Terms and Conditions</span></label></div>
                <div className="schedule-modal-actions-cusset">
                  <button onClick={() => setShowConfirmDialog(false)} className="schedule-btn-secondary-cusset">Cancel</button>
                  <button onClick={handleConfirmBooking} disabled={!termsAccepted || isSubmitting} className="schedule-btn-success-cusset">{isSubmitting ? 'Processing...' : 'Confirm Booking'}</button>
                </div>
              </div>
            </div>
          )}

          <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
        </div>
      </>
    );
  }

  return null;
};

export default ScheduleAssessment;