// pages/Customer/quotation.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import TermsModal from '../../assets/termsandconditions';
import '../../styles/Customer/quotation.css';

const Quotation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast, showToast, hideToast } = useToast();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('projects');
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [acceptingItem, setAcceptingItem] = useState(null);
  const [acceptingLoading, setAcceptingLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [detailsItem, setDetailsItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentReference, setPaymentReference] = useState('');
  
  // Add state for Terms Modal
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsModalMode, setTermsModalMode] = useState('registration'); // 'simple' or 'registration'
  const [pendingAction, setPendingAction] = useState(null); // Store pending action when terms need to be accepted

  // Solar Installation Request Form
  const [solarRequest, setSolarRequest] = useState({
    systemSize: '',
    propertyType: 'residential',
    systemType: 'grid-tie',
    notes: ''
  });
  const [requestErrors, setRequestErrors] = useState({});

  // State for actual data from API
  const [freeQuotes, setFreeQuotes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [preAssessments, setPreAssessments] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    fetchUserData();
    fetchData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/clients/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUser(response.data.client);
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  const getFullName = () => {
    if (!user) return '';
    return [user.contactFirstName, user.contactMiddleName, user.contactLastName]
      .filter(n => n)
      .join(' ');
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');

      const freeQuotesRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/free-quotes/my-quotes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFreeQuotes(freeQuotesRes.data.quotes || []);

      const projectsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects/my-projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(projectsRes.data.projects || []);

      const preAssessmentsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const transformedBills = preAssessmentsRes.data.assessments
        ?.filter(assessment =>
          assessment.invoiceNumber &&
          assessment.assessmentStatus !== 'pending_review' &&
          ['pending', 'for_verification', 'paid'].includes(assessment.paymentStatus)
        )
        .map(assessment => ({
          id: assessment.invoiceNumber,
          date: new Date(assessment.bookedAt).toLocaleDateString(),
          dueDate: new Date(assessment.preferredDate).toLocaleDateString(),
          amount: assessment.assessmentFee,
          status: assessment.paymentStatus === 'paid' ? 'paid' :
            assessment.paymentStatus === 'for_verification' ? 'for_verification' : 'pending',
          description: 'Pre Assessment Fee',
          bookingReference: assessment.bookingReference,
          paymentStatus: assessment.paymentStatus,
          propertyType: assessment.propertyType,
          desiredCapacity: assessment.desiredCapacity,
          roofType: assessment.roofType,
          preferredDate: assessment.preferredDate,
          address: assessment.address,
          bookedAt: assessment.bookedAt,
          invoiceNumber: assessment.invoiceNumber,
          assessmentId: assessment._id,
          assessmentStatus: assessment.assessmentStatus,
          quotation: assessment.quotation,
          quotationUrl: assessment.quotation?.quotationUrl || assessment.finalQuotation,
          systemSize: assessment.quotation?.systemDetails?.systemSize,
          systemType: assessment.quotation?.systemDetails?.systemType,
          totalCost: assessment.quotation?.systemDetails?.totalCost,
          panelsNeeded: assessment.quotation?.systemDetails?.panelsNeeded,
          inverterType: assessment.quotation?.systemDetails?.inverterType,
          batteryType: assessment.quotation?.systemDetails?.batteryType
        })) || [];

      console.log('Filtered pre-assessments:', transformedBills);
      setPreAssessments(transformedBills);

      const paymentsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(paymentsRes.data.payments || []);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      showToast('Failed to load data', 'error');
      setLoading(false);
    }
  };

  const validateRequestForm = () => {
    const errors = {};
    if (!solarRequest.systemSize) {
      errors.systemSize = 'Please select or enter system size';
    }
    if (!solarRequest.propertyType) {
      errors.propertyType = 'Please select property type';
    }
    setRequestErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Modified to show terms modal first
  const handleRequestSolarClick = () => {
    // Check if user has already accepted terms (you can store this in localStorage or user state)
    const hasAcceptedTerms = localStorage.getItem('termsAccepted') === 'true';
    
    if (!hasAcceptedTerms) {
      setPendingAction('requestSolar');
      setTermsModalMode('registration');
      setShowTermsModal(true);
    } else {
      // Proceed directly with request
      handleRequestSolar();
    }
  };

  const handleRequestSolar = async () => {
    if (!validateRequestForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/projects/request`,
        {
          systemSize: solarRequest.systemSize,
          propertyType: solarRequest.propertyType,
          systemType: solarRequest.systemType,
          notes: solarRequest.notes
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast('Solar installation request submitted successfully!', 'success');
      setShowRequestModal(false);
      setSolarRequest({ systemSize: '', propertyType: 'residential', systemType: 'grid-tie', notes: '' });

      fetchData();

    } catch (err) {
      console.error('Error submitting solar request:', err);
      showToast(err.response?.data?.message || 'Failed to submit request. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modified to show terms modal before payment
  const handlePayNowClick = (preAssessment) => {
    const hasAcceptedTerms = localStorage.getItem('termsAccepted') === 'true';
    
    if (!hasAcceptedTerms) {
      setPendingAction({ type: 'payment', data: preAssessment });
      setTermsModalMode('registration');
      setShowTermsModal(true);
    } else {
      handlePayNow(preAssessment);
    }
  };

  const handlePayNow = (preAssessment) => {
    setSelectedItem({
      ...preAssessment,
      bookingReference: preAssessment.bookingReference
    });
    setPaymentMethod(null);
    setPaymentProof(null);
    setPaymentReference('');
    setShowPaymentModal(true);
  };

  // Modified to show terms modal before accepting quotation
  const handleAcceptQuotationClick = (assessment) => {
    const hasAcceptedTerms = localStorage.getItem('termsAccepted') === 'true';
    
    if (!hasAcceptedTerms) {
      setPendingAction({ type: 'acceptQuotation', data: assessment });
      setTermsModalMode('registration');
      setShowTermsModal(true);
    } else {
      handleAcceptQuotation(assessment);
    }
  };

  const handleAcceptQuotation = (assessment) => {
    setAcceptingItem(assessment);
    setShowAcceptModal(true);
  };

  // Terms acceptance handler
  const handleTermsAccept = () => {
    // Store that user has accepted terms
    localStorage.setItem('termsAccepted', 'true');
    
    // Execute the pending action
    if (pendingAction) {
      if (pendingAction === 'requestSolar') {
        handleRequestSolar();
      } else if (pendingAction.type === 'payment') {
        handlePayNow(pendingAction.data);
      } else if (pendingAction.type === 'acceptQuotation') {
        handleAcceptQuotation(pendingAction.data);
      }
      setPendingAction(null);
    }
  };

  const handleViewDetails = (item, type) => {
    setDetailsItem(item);
    setShowDetailsModal(true);
  };

  const handleViewQuotation = async (assessment) => {
    if (!assessment.quotationUrl) {
      showToast('No quotation PDF available for this assessment', 'warning');
      return;
    }

    const pdfUrl = assessment.quotationUrl;
    window.open(pdfUrl, '_blank');
  };

  const handleDownloadQuotation = async (assessment) => {
    if (!assessment.quotationUrl) {
      showToast('No quotation PDF available for this assessment', 'warning');
      return;
    }

    setPdfLoading(true);
    try {
      const response = await axios.get(assessment.quotationUrl, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Quotation_${assessment.bookingReference || assessment.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast('Quotation downloaded successfully!', 'success');
    } catch (err) {
      console.error('Error downloading PDF:', err);
      showToast('Failed to download quotation', 'error');
    } finally {
      setPdfLoading(false);
    }
  };

  const confirmAcceptQuotation = async () => {
    if (!acceptingItem) return;

    setAcceptingLoading(true);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/projects/accept`,
        {
          sourceType: 'pre-assessment',
          sourceId: acceptingItem.assessmentId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast('Quotation accepted successfully!', 'success');
      setShowAcceptModal(false);
      setAcceptingItem(null);
      fetchData();
      setActiveTab('projects');

    } catch (err) {
      console.error('Error accepting quotation:', err);
      showToast(err.response?.data?.message || 'Failed to accept quotation. Please try again.', 'error');
    } finally {
      setAcceptingLoading(false);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!paymentMethod) {
      showToast('Please select a payment method', 'warning');
      return;
    }

    if (paymentMethod === 'gcash') {
      if (!paymentProof) {
        showToast('Please upload payment proof', 'warning');
        return;
      }
      if (!paymentReference) {
        showToast('Please enter GCash reference number', 'warning');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');

      if (paymentMethod === 'gcash') {
        const formData = new FormData();
        formData.append('invoiceNumber', selectedItem.invoiceNumber || selectedItem.id);
        formData.append('paymentMethod', 'gcash');
        formData.append('paymentReference', paymentReference);
        formData.append('paymentProof', paymentProof);

        await axios.post(`${import.meta.env.VITE_API_URL}/api/pre-assessments/submit-payment`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        showToast('Payment submitted successfully!', 'success');

      } else if (paymentMethod === 'cash') {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/pre-assessments/cash-payment`, {
          bookingReference: selectedItem.bookingReference
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        showToast('Cash payment selected. Please visit our office to complete payment.', 'success');
      }

      closeModal();
      fetchData();

    } catch (err) {
      console.error('Payment error:', err);
      showToast(err.response?.data?.message || 'Failed to process payment. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowPaymentModal(false);
    setSelectedItem(null);
    setPaymentProof(null);
    setPaymentReference('');
    setPaymentMethod(null);
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': <span className="status-badge-quotation pending-quotation">Pending</span>,
      'pending_payment': <span className="status-badge-quotation pending-quotation">Pending</span>,
      'paid': <span className="status-badge-quotation paid-quotation">Paid</span>,
      'for_verification': <span className="status-badge-quotation for-verification-quotation">For Verification</span>,
      'processing': <span className="status-badge-quotation processing-quotation">Processing</span>,
      'quoted': <span className="status-badge-quotation quoted-quotation">Quoted</span>,
      'approved': <span className="status-badge-quotation approved-quotation">Approved</span>,
      'initial_paid': <span className="status-badge-quotation initial-paid-quotation">Initial Paid</span>,
      'in_progress': <span className="status-badge-quotation in-progress-quotation">In Progress</span>,
      'completed': <span className="status-badge-quotation completed-quotation">Completed</span>,
      'cancelled': <span className="status-badge-quotation cancelled-quotation">Cancelled</span>
    };
    return badges[status] || <span className="status-badge-quotation">{status}</span>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getProjectProgress = (project) => {
    if (project.totalCost === 0) return 0;
    return Math.round((project.amountPaid / project.totalCost) * 100);
  };

  // Skeleton Loader Components (keep as is)
  const ProjectsSkeleton = () => (
    <div className="projects-list-quotation">
      {[1, 2, 3].map((item) => (
        <div key={item} className="project-card-quotation skeleton-card-quotation">
          <div className="project-header-quotation">
            <div>
              <div className="skeleton-line-quotation medium-quotation"></div>
              <div className="skeleton-line-quotation small-quotation"></div>
              <div className="skeleton-line-quotation tiny-quotation"></div>
            </div>
            <div className="skeleton-badge-quotation"></div>
          </div>
          <div className="project-progress-quotation">
            <div className="skeleton-progress-quotation"></div>
            <div className="skeleton-line-quotation small-quotation"></div>
          </div>
          <div className="payment-schedule-quotation">
            <div className="skeleton-line-quotation small-quotation"></div>
            <div className="skeleton-schedule-item-quotation"></div>
            <div className="skeleton-schedule-item-quotation"></div>
          </div>
          <div className="project-actions-quotation">
            <div className="skeleton-button-quotation"></div>
            <div className="skeleton-button-quotation"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const QuotesSkeleton = () => (
    <div className="free-quotes-list-quotation">
      {[1, 2, 3].map((item) => (
        <div key={item} className="quote-card-quotation skeleton-card-quotation">
          <div className="card-header-quotation">
            <div>
              <div className="skeleton-line-quotation medium-quotation"></div>
              <div className="skeleton-line-quotation small-quotation"></div>
              <div className="skeleton-line-quotation tiny-quotation"></div>
            </div>
            <div className="skeleton-badge-quotation"></div>
          </div>
          <div className="card-actions-quotation">
            <div className="skeleton-button-quotation"></div>
            <div className="skeleton-button-quotation"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const PreAssessmentsSkeleton = () => (
    <div className="pre-assessments-list-quotation">
      {[1, 2, 3].map((item) => (
        <div key={item} className="bill-card-quotation skeleton-card-quotation">
          <div className="card-header-quotation">
            <div>
              <div className="skeleton-line-quotation medium-quotation"></div>
              <div className="skeleton-line-quotation small-quotation"></div>
              <div className="skeleton-line-quotation tiny-quotation"></div>
            </div>
            <div className="skeleton-badge-quotation"></div>
          </div>
          <div className="card-amount-quotation">
            <div className="skeleton-line-quotation small-quotation"></div>
            <div className="skeleton-line-quotation medium-quotation"></div>
          </div>
          <div className="card-actions-quotation">
            <div className="skeleton-button-quotation"></div>
            <div className="skeleton-button-quotation"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const PaymentsSkeleton = () => (
    <div className="payments-list-quotation">
      <div className="payments-table-quotation">
        <div className="skeleton-table-quotation">
          <div className="skeleton-table-header-quotation">
            <div className="skeleton-line-quotation small-quotation"></div>
            <div className="skeleton-line-quotation small-quotation"></div>
            <div className="skeleton-line-quotation small-quotation"></div>
            <div className="skeleton-line-quotation small-quotation"></div>
            <div className="skeleton-line-quotation small-quotation"></div>
          </div>
          {[1, 2, 3].map((item) => (
            <div key={item} className="skeleton-table-row-quotation">
              <div className="skeleton-line-quotation tiny-quotation"></div>
              <div className="skeleton-line-quotation tiny-quotation"></div>
              <div className="skeleton-line-quotation tiny-quotation"></div>
              <div className="skeleton-line-quotation tiny-quotation"></div>
              <div className="skeleton-badge-quotation"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const MainSkeleton = () => (
    <div className="billing-container-quotation">
      <div className="billing-header-quotation">
        <div>
          <div className="skeleton-line-quotation large-quotation"></div>
          <div className="skeleton-line-quotation medium-quotation"></div>
        </div>
        <div className="skeleton-button-quotation large-quotation"></div>
      </div>

      <div className="billing-tabs-quotation">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="skeleton-tab-quotation"></div>
        ))}
      </div>

      {activeTab === 'projects' && <ProjectsSkeleton />}
      {activeTab === 'free-quotes' && <QuotesSkeleton />}
      {activeTab === 'pre-assessments' && <PreAssessmentsSkeleton />}
      {activeTab === 'payments' && <PaymentsSkeleton />}
    </div>
  );

  if (loading) {
    return (
      <>
        <Helmet>
          <title>My Projects & Bills | Salfer Engineering</title>
        </Helmet>
        <MainSkeleton />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Projects & Bills | Salfer Engineering</title>
      </Helmet>

      <div className="billing-container-quotation">
        <div className="billing-header-quotation">
          <div>
            <h1>My Solar Journey</h1>
            <p>Track your projects, view quotes, and manage payments</p>
          </div>
          <button
            className="request-solar-btn-quotation"
            onClick={handleRequestSolarClick} // Updated to use terms check
          >
            Request Installation
          </button>
        </div>

        {/* Tabs */}
        <div className="billing-tabs-quotation">
          <button
            className={`tab-btn-quotation ${activeTab === 'projects' ? 'active-quotation' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            My Projects
          </button>
          <button
            className={`tab-btn-quotation ${activeTab === 'free-quotes' ? 'active-quotation' : ''}`}
            onClick={() => setActiveTab('free-quotes')}
          >
            Free Quotes
          </button>
          <button
            className={`tab-btn-quotation ${activeTab === 'pre-assessments' ? 'active-quotation' : ''}`}
            onClick={() => setActiveTab('pre-assessments')}
          >
            Pre-Assessment
          </button>
          <button
            className={`tab-btn-quotation ${activeTab === 'payments' ? 'active-quotation' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            Payment History
          </button>
        </div>

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="projects-list-quotation">
            {projects.length === 0 ? (
              <div className="empty-state-quotation">
                <h3>No projects yet</h3>
                <p>Once you accept a quotation, your project will appear here.</p>
                <button className="btn-primary-quotation" onClick={() => setActiveTab('pre-assessments')}>
                  View Your Quotations
                </button>
              </div>
            ) : (
              projects.map(project => (
                <div key={project._id} className="project-card-quotation">
                  <div className="project-header-quotation">
                    <div>
                      <h3>{project.projectName || project.projectReference}</h3>
                      <p className="project-reference-quotation">{project.projectReference}</p>
                      <p className="project-system-quotation">{project.systemSize}kW Solar System | {project.systemType}</p>
                    </div>
                    {getStatusBadge(project.status)}
                  </div>

                  <div className="project-progress-quotation">
                    <div className="progress-bar-quotation">
                      <div className="progress-fill-quotation" style={{ width: `${getProjectProgress(project)}%` }}></div>
                    </div>
                    <div className="progress-info-quotation">
                      <span>Paid: {formatCurrency(project.amountPaid)}</span>
                      <span>Total: {formatCurrency(project.totalCost)}</span>
                      <span>{getProjectProgress(project)}% Complete</span>
                    </div>
                  </div>

                  <div className="payment-schedule-quotation">
                    <h4>Payment Schedule</h4>
                    <div className="schedule-items-quotation">
                      {project.paymentSchedule?.map((payment, idx) => (
                        <div key={idx} className={`schedule-item-quotation ${payment.status}`}>
                          <span className="schedule-type-quotation">{payment.type}</span>
                          <span className="schedule-amount-quotation">{formatCurrency(payment.amount)}</span>
                          <span className="schedule-status-quotation">
                            {payment.status === 'paid' ? 'Paid' : payment.status === 'overdue' ? 'Overdue' : 'Pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="project-actions-quotation">
                    <button className="action-btn-quotation" onClick={() => handleViewDetails(project, 'project')}>
                      View Details
                    </button>
                    <button className="action-btn-quotation">
                      Contract
                    </button>
                    {(project.status === 'approved' || project.status === 'initial_paid') && (
                      <button className="action-btn-quotation pay-quotation">
                        Make Payment
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Free Quotes Tab */}
        {activeTab === 'free-quotes' && (
          <div className="free-quotes-list-quotation">
            {freeQuotes.length === 0 ? (
              <div className="empty-state-quotation">
                <h3>No free quotes yet</h3>
                <p>Use our solar estimator to get a free quote</p>
                <button className="btn-primary-quotation" onClick={() => navigate('/app/customer/book-assessment')}>
                  Get Free Quote
                </button>
              </div>
            ) : (
              freeQuotes.map(quote => (
                <div key={quote._id} className="quote-card-quotation">
                  <div className="card-header-quotation">
                    <div>
                      <h3>{quote.quotationReference}</h3>
                      <p>Requested: {new Date(quote.requestedAt).toLocaleDateString()}</p>
                      <p>{quote.propertyType} property | {quote.desiredCapacity || 'Custom'} system</p>
                    </div>
                    {getStatusBadge(quote.status)}
                  </div>
                  <div className="card-actions-quotation">
                    <button className="action-btn-quotation" onClick={() => handleViewDetails(quote, 'quote')}>
                      View Details
                    </button>
                    {quote.quotationFile && (
                      <button className="action-btn-quotation" onClick={() => window.open(quote.quotationFile, '_blank')}>
                        View PDF
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Pre-Assessments Tab - Updated with terms check on buttons */}
        {activeTab === 'pre-assessments' && (
          <div className="pre-assessments-list-quotation">
            {preAssessments.length === 0 ? (
              <div className="empty-state-quotation">
                <h3>No pre-assessments yet</h3>
                <p>Once your booking is approved and payment is completed, you'll see the quotation here.</p>
                <button className="btn-primary-quotation" onClick={() => navigate('/app/customer/book-assessment')}>
                  Book Assessment
                </button>
              </div>
            ) : (
              preAssessments.map(assessment => {
                const hasQuotation = assessment.quotationUrl;
                const projectExists = projects.some(project => {
                  if (project.preAssessmentId) {
                    const projectPreAssessmentId = typeof project.preAssessmentId === 'object'
                      ? project.preAssessmentId._id?.toString()
                      : project.preAssessmentId?.toString();
                    const assessmentId = assessment.assessmentId?.toString();
                    return projectPreAssessmentId === assessmentId;
                  }
                  return false;
                });
                const alreadyProjectCreated = assessment.assessmentStatus === 'quotation_accepted' || projectExists;

                return (
                  <div key={assessment.id} className="bill-card-quotation">
                    <div className="card-header-quotation">
                      <div>
                        <h3>{assessment.id}</h3>
                        <p>{assessment.description}</p>
                        <p>Due: {assessment.dueDate}</p>
                      </div>
                      {getStatusBadge(assessment.status)}
                    </div>
                    <div className="card-amount-quotation">
                      <span>Amount Due</span>
                      <strong>{formatCurrency(assessment.amount)}</strong>
                    </div>
                    <div className="card-actions-quotation">
                      {(assessment.status === 'pending' && assessment.paymentStatus !== 'for_verification' && assessment.paymentStatus !== 'paid') && (
                        <button className="action-btn-quotation pay-quotation" onClick={() => handlePayNowClick(assessment)}>
                          Make Payment
                        </button>
                      )}

                      {assessment.paymentStatus === 'for_verification' && (
                        <span className="payment-status-quotation">
                          For Verification
                        </span>
                      )}

                      {assessment.paymentStatus === 'paid' && (
                        <>
                          {hasQuotation && !alreadyProjectCreated && (
                            <>
                              <button
                                className="action-btn-quotation"
                                onClick={() => handleViewQuotation(assessment)}
                                style={{ backgroundColor: '#f97316', color: 'white' }}
                              >
                                View Quotation
                              </button>
                              <button
                                className="action-btn-quotation"
                                onClick={() => handleDownloadQuotation(assessment)}
                                disabled={pdfLoading}
                              >
                                {pdfLoading ? 'Downloading...' : 'Download PDF'}
                              </button>
                              <button
                                className="action-btn-quotation"
                                onClick={() => handleAcceptQuotationClick(assessment)}
                                style={{ backgroundColor: '#27ae60', color: 'white' }}
                              >
                                Accept Quotation
                              </button>
                            </>
                          )}

                          {alreadyProjectCreated && (
                            <button
                              className="action-btn-quotation"
                              onClick={() => setActiveTab('projects')}
                              style={{ backgroundColor: '#3498db', color: 'white' }}
                            >
                              View Project
                            </button>
                          )}
                        </>
                      )}

                      <button className="action-btn-quotation" onClick={() => handleViewDetails(assessment, 'assessment')}>
                        View Details
                      </button>
                    </div>

                    {(assessment.status === 'pending' && assessment.paymentStatus !== 'for_verification' && assessment.paymentStatus !== 'paid') && (
                      <div className="walkin-note-quotation">
                        <small>For walk-in payment, please visit our office at Purok 2, Masaya, San Jose, Camarines Sur</small>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="payments-list-quotation">
            {payments.length === 0 ? (
              <div className="empty-state-quotation">
                <h3>No payment history</h3>
                <p>Your payments will appear here</p>
              </div>
            ) : (
              <div className="payments-table-quotation">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Invoice</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(payment => (
                      <tr key={payment.id}>
                        <td>{new Date(payment.date).toLocaleDateString()}</td>
                        <td>{payment.invoiceId}</td>
                        <td className="amount-quotation">{formatCurrency(payment.amount)}</td>
                        <td>{payment.method}</td>
                        <td>{getStatusBadge(payment.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Terms Modal */}
        <TermsModal
          isOpen={showTermsModal}
          onClose={() => {
            setShowTermsModal(false);
            setPendingAction(null);
          }}
          onAccept={handleTermsAccept}
          mode={termsModalMode}
          title="Terms and Conditions"
        />

        {/* Accept Quotation Confirmation Modal */}
        {showAcceptModal && acceptingItem && (
          <div className="modal-overlay-quotation" onClick={() => setShowAcceptModal(false)}>
            <div className="modal-content-quotation" onClick={e => e.stopPropagation()}>
              <button className="modal-close-quotation" onClick={() => setShowAcceptModal(false)}>×</button>
              <h3>Accept Quotation</h3>
              <p>Are you sure you want to accept this quotation?</p>

              <div className="quotation-summary-quotation">
                <h4>Quotation Summary</h4>
                <div className="summary-row">
                  <span>System Size:</span>
                  <strong>{acceptingItem.systemSize || 'To be determined'} kWp</strong>
                </div>
                <div className="summary-row">
                  <span>System Type:</span>
                  <strong>{acceptingItem.systemType || 'Grid-Tie'}</strong>
                </div>
                <div className="summary-row">
                  <span>Total Cost:</span>
                  <strong>{formatCurrency(acceptingItem.totalCost || acceptingItem.amount)}</strong>
                </div>
              </div>

              <div className="modal-actions-quotation">
                <button className="cancel-btn-quotation" onClick={() => setShowAcceptModal(false)}>
                  Cancel
                </button>
                <button
                  className="submit-btn-quotation"
                  onClick={confirmAcceptQuotation}
                  disabled={acceptingLoading}
                >
                  {acceptingLoading ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedItem && (
          <div className="modal-overlay-quotation" onClick={closeModal}>
            <div className="modal-content-quotation" onClick={e => e.stopPropagation()}>
              <button className="modal-close-quotation" onClick={closeModal}>×</button>
              <h3>Make Payment</h3>
              <div className="modal-body-quotation">
                <div className="invoice-summary-quotation">
                  <p><strong>Invoice:</strong> {selectedItem.invoiceNumber || selectedItem.id}</p>
                  <p><strong>Amount:</strong> {formatCurrency(selectedItem.amount)}</p>
                  <p><strong>Due Date:</strong> {selectedItem.dueDate}</p>
                </div>

                {/* Payment Method Selection */}
                <div className="payment-method-section-quotation">
                  <h4>Select Payment Method</h4>
                  <div className="payment-methods-quotation">
                    <div
                      className={`payment-method-option-quotation ${paymentMethod === 'gcash' ? 'selected-quotation' : ''}`}
                      onClick={() => setPaymentMethod('gcash')}
                    >
                      <input type="radio" name="paymentMethod" checked={paymentMethod === 'gcash'} onChange={() => {}} />
                      <div className="payment-method-info-quotation">
                        <strong>GCash</strong>
                        <small>Pay via GCash mobile wallet</small>
                      </div>
                    </div>

                    <div
                      className={`payment-method-option-quotation ${paymentMethod === 'cash' ? 'selected-quotation' : ''}`}
                      onClick={() => setPaymentMethod('cash')}
                    >
                      <input type="radio" name="paymentMethod" checked={paymentMethod === 'cash'} onChange={() => {}} />
                      <div className="payment-method-info-quotation">
                        <strong>Cash</strong>
                        <small>Pay in cash at our office</small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* GCash Payment Details */}
                {paymentMethod === 'gcash' && (
                  <>
                    <div className="gcash-details-quotation">
                      <h4>GCash Details</h4>
                      <p>Number: <strong>0917XXXXXXX</strong></p>
                      <p>Name: <strong>SALFER ENGINEERING CORP</strong></p>
                      <p>Amount: <strong>{formatCurrency(selectedItem.amount)}</strong></p>
                    </div>

                    <div className="upload-section-quotation">
                      <label>Reference Number *</label>
                      <input
                        type="text"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        placeholder="Enter GCash reference number"
                      />
                    </div>

                    <div className="upload-section-quotation">
                      <label>Upload Payment Screenshot *</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPaymentProof(e.target.files[0])}
                      />
                      {paymentProof && <small>Selected: {paymentProof.name}</small>}
                    </div>
                  </>
                )}

                {/* Cash Payment Details */}
                {paymentMethod === 'cash' && (
                  <div className="cash-details-quotation">
                    <div className="info-box-quotation">
                      <div>
                        <strong>Office Address</strong>
                        <p>Purok 2, Masaya, San Jose, Camarines Sur</p>
                        <p>Business Hours: Monday-Friday, 8:00 AM - 5:00 PM</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-actions-quotation">
                <button className="cancel-btn-quotation" onClick={closeModal}>Cancel</button>
                <button
                  className="submit-btn-quotation"
                  onClick={handlePaymentSubmit}
                  disabled={isSubmitting || !paymentMethod}
                >
                  {isSubmitting ? 'Processing...' : `Pay with ${paymentMethod === 'gcash' ? 'GCash' : 'Cash'}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && detailsItem && (
          <div className="modal-overlay-quotation" onClick={() => setShowDetailsModal(false)}>
            <div className="modal-content-quotation" onClick={e => e.stopPropagation()}>
              <button className="modal-close-quotation" onClick={() => setShowDetailsModal(false)}>×</button>
              <h3>Details Information</h3>

              <div className="details-content-quotation">
                {detailsItem.quotationReference ? (
                  <>
                    <div className="details-section-quotation">
                      <h4>Quote Information</h4>
                      <p><strong>Reference Number:</strong> {detailsItem.quotationReference}</p>
                      <p><strong>Request Date:</strong> {new Date(detailsItem.requestedAt).toLocaleDateString()}</p>
                      <p><strong>Status:</strong> {detailsItem.status}</p>
                    </div>
                    <div className="details-section-quotation">
                      <h4>Details</h4>
                      <p><strong>Property Type:</strong> {detailsItem.propertyType}</p>
                      <p><strong>Monthly Bill:</strong> {formatCurrency(detailsItem.monthlyBill)}</p>
                      <p><strong>Desired Capacity:</strong> {detailsItem.desiredCapacity || 'Not specified'}</p>
                    </div>
                    <div className="details-section-quotation">
                      <h4>Address</h4>
                      <p>{detailsItem.address?.houseOrBuilding} {detailsItem.address?.street}</p>
                      <p>{detailsItem.address?.barangay}, {detailsItem.address?.cityMunicipality}</p>
                      <p>{detailsItem.address?.province} {detailsItem.address?.zipCode}</p>
                    </div>
                  </>
                ) : detailsItem.bookingReference ? (
                  <>
                    <div className="details-section-quotation">
                      <h4>Booking Information</h4>
                      <p><strong>Invoice Number:</strong> {detailsItem.id}</p>
                      <p><strong>Booking Reference:</strong> {detailsItem.bookingReference}</p>
                      <p><strong>Booked Date:</strong> {new Date(detailsItem.bookedAt).toLocaleDateString()}</p>
                      <p><strong>Status:</strong> {
                        detailsItem.paymentStatus === 'paid' ? 'Paid' :
                          detailsItem.paymentStatus === 'for_verification' ? 'For Verification' :
                            'Pending'
                      }</p>
                    </div>
                    <div className="details-section-quotation">
                      <h4>Assessment Details</h4>
                      <p><strong>Property Type:</strong> {detailsItem.propertyType}</p>
                      <p><strong>Desired Capacity:</strong> {detailsItem.desiredCapacity || 'Not specified'}</p>
                      <p><strong>Roof Type:</strong> {detailsItem.roofType || 'Not specified'}</p>
                      <p><strong>Preferred Date:</strong> {new Date(detailsItem.preferredDate).toLocaleDateString()}</p>
                      <p><strong>Amount:</strong> {formatCurrency(detailsItem.amount)}</p>
                    </div>
                    <div className="details-section-quotation">
                      <h4>Address</h4>
                      <p>{detailsItem.address}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="details-section-quotation">
                      <h4>Project Information</h4>
                      <p><strong>Project Name:</strong> {detailsItem.projectName || detailsItem.projectReference}</p>
                      <p><strong>Project Reference:</strong> {detailsItem.projectReference}</p>
                      <p><strong>Status:</strong> {detailsItem.status}</p>
                    </div>
                    <div className="details-section-quotation">
                      <h4>System Details</h4>
                      <p><strong>System Size:</strong> {detailsItem.systemSize}kW</p>
                      <p><strong>System Type:</strong> {detailsItem.systemType}</p>
                      <p><strong>Property Type:</strong> {detailsItem.propertyType}</p>
                    </div>
                    <div className="details-section-quotation">
                      <h4>Financial</h4>
                      <p><strong>Total Cost:</strong> {formatCurrency(detailsItem.totalCost)}</p>
                      <p><strong>Amount Paid:</strong> {formatCurrency(detailsItem.amountPaid)}</p>
                      <p><strong>Balance:</strong> {formatCurrency(detailsItem.totalCost - detailsItem.amountPaid)}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="modal-actions-quotation">
                <button className="cancel-btn-quotation" onClick={() => setShowDetailsModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Request Installation Modal */}
        {showRequestModal && (
          <div className="modal-overlay-quotation" onClick={() => setShowRequestModal(false)}>
            <div className="modal-content-quotation" onClick={e => e.stopPropagation()}>
              <button className="modal-close-quotation" onClick={() => setShowRequestModal(false)}>×</button>
              <h3>Request Solar Installation</h3>
              <p className="modal-subtitle-quotation">Get a detailed quote for your solar panel system installation</p>

              <div className="modal-body-quotation">
                <div className="form-group-quotation">
                  <label>Desired System Size *</label>
                  <select value={solarRequest.systemSize} onChange={(e) => setSolarRequest({ ...solarRequest, systemSize: e.target.value })}>
                    <option value="">Select system size</option>
                    <option value="3kW">3kW (Good for small homes)</option>
                    <option value="5kW">5kW (Recommended for average homes)</option>
                    <option value="7kW">7kW (For larger homes)</option>
                    <option value="10kW">10kW (For large homes / small business)</option>
                    <option value="Custom">Custom (I'll specify in notes)</option>
                  </select>
                  {requestErrors.systemSize && <span className="error-text-quotation">{requestErrors.systemSize}</span>}
                </div>

                <div className="form-group-quotation">
                  <label>System Type</label>
                  <select value={solarRequest.systemType} onChange={(e) => setSolarRequest({ ...solarRequest, systemType: e.target.value })}>
                    <option value="grid-tie">Grid-tie (No battery)</option>
                    <option value="hybrid">Hybrid (With battery backup)</option>
                    <option value="off-grid">Off-grid (Complete independence)</option>
                  </select>
                </div>

                <div className="form-group-quotation">
                  <label>Property Type *</label>
                  <select value={solarRequest.propertyType} onChange={(e) => setSolarRequest({ ...solarRequest, propertyType: e.target.value })}>
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="industrial">Industrial</option>
                  </select>
                  {requestErrors.propertyType && <span className="error-text-quotation">{requestErrors.propertyType}</span>}
                </div>

                <div className="form-group-quotation">
                  <label>Additional Notes (Optional)</label>
                  <textarea rows="4" value={solarRequest.notes} onChange={(e) => setSolarRequest({ ...solarRequest, notes: e.target.value })} placeholder="Tell us about your specific needs, roof type, or any questions..." />
                </div>

                <div className="info-box-quotation">
                  <div><strong>What happens next?</strong><p>Our solar specialists will review your request and provide a detailed quotation within 2-3 business days.</p></div>
                </div>
              </div>

              <div className="modal-actions-quotation">
                <button className="cancel-btn-quotation" onClick={() => setShowRequestModal(false)}>Cancel</button>
                <button className="submit-btn-quotation" onClick={handleRequestSolar} disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        <ToastNotification
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      </div>
    </>
  );
};

export default Quotation;