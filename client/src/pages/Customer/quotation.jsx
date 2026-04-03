// pages/Customer/Quotation.cuspro.jsx
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
  
  // Terms Modal state
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsModalMode, setTermsModalMode] = useState('registration');
  const [pendingAction, setPendingAction] = useState(null);

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

  const handleRequestSolarClick = () => {
    const hasAcceptedTerms = localStorage.getItem('termsAccepted') === 'true';
    
    if (!hasAcceptedTerms) {
      setPendingAction('requestSolar');
      setTermsModalMode('registration');
      setShowTermsModal(true);
    } else {
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

  const handleTermsAccept = () => {
    localStorage.setItem('termsAccepted', 'true');
    
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
      'pending': <span className="status-badge-cuspro pending-cuspro">Pending</span>,
      'pending_payment': <span className="status-badge-cuspro pending-cuspro">Pending</span>,
      'paid': <span className="status-badge-cuspro paid-cuspro">Paid</span>,
      'for_verification': <span className="status-badge-cuspro for-verification-cuspro">For Verification</span>,
      'processing': <span className="status-badge-cuspro processing-cuspro">Processing</span>,
      'quoted': <span className="status-badge-cuspro quoted-cuspro">Quoted</span>,
      'approved': <span className="status-badge-cuspro approved-cuspro">Approved</span>,
      'initial_paid': <span className="status-badge-cuspro initial-paid-cuspro">Initial Paid</span>,
      'in_progress': <span className="status-badge-cuspro in-progress-cuspro">In Progress</span>,
      'completed': <span className="status-badge-cuspro completed-cuspro">Completed</span>,
      'cancelled': <span className="status-badge-cuspro cancelled-cuspro">Cancelled</span>
    };
    return badges[status] || <span className="status-badge-cuspro">{status}</span>;
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

  if (loading) {
    return (
      <div className="cuspro-quotation-container">
        <div className="cuspro-loading-state">
          <div className="cuspro-spinner"></div>
          <p>Loading your solar journey...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Solar Journey | Salfer Engineering</title>
      </Helmet>

      <div className="cuspro-quotation-container">
        {/* Header Card */}
        <div className="cuspro-header-card">
          <div className="cuspro-header-content">
            <h1>My Solar Journey</h1>
            <p>Track your projects, view quotes, and manage payments</p>
          </div>
          <button className="cuspro-request-btn" onClick={handleRequestSolarClick}>
            Request Installation
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="cuspro-tabs">
          <button
            className={`cuspro-tab ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            My Projects
          </button>
          <button
            className={`cuspro-tab ${activeTab === 'free-quotes' ? 'active' : ''}`}
            onClick={() => setActiveTab('free-quotes')}
          >
            Free Quotes
          </button>
          <button
            className={`cuspro-tab ${activeTab === 'pre-assessments' ? 'active' : ''}`}
            onClick={() => setActiveTab('pre-assessments')}
          >
            Pre-Assessment
          </button>
          <button
            className={`cuspro-tab ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            Payment History
          </button>
        </div>

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="cuspro-projects-section">
            {projects.length === 0 ? (
              <div className="cuspro-empty-state">
                <div className="cuspro-empty-icon">📋</div>
                <h3>No projects yet</h3>
                <p>Once you accept a quotation, your project will appear here.</p>
                <button className="cuspro-primary-btn" onClick={() => setActiveTab('pre-assessments')}>
                  View Your Quotations
                </button>
              </div>
            ) : (
              projects.map(project => (
                <div key={project._id} className="cuspro-project-card">
                  <div className="cuspro-project-header">
                    <div className="cuspro-project-info">
                      <h3>{project.projectName || project.projectReference}</h3>
                      <p className="cuspro-project-ref">{project.projectReference}</p>
                      <p className="cuspro-project-system">{project.systemSize}kW • {project.systemType === 'grid-tie' ? 'Grid-Tie' : project.systemType === 'hybrid' ? 'Hybrid' : 'Off-Grid'}</p>
                    </div>
                    {getStatusBadge(project.status)}
                  </div>

                  {/* Progress Bar */}
                  <div className="cuspro-progress-section">
                    <div className="cuspro-progress-header">
                      <span>Project Progress</span>
                      <span className="cuspro-progress-percent">{getProjectProgress(project)}%</span>
                    </div>
                    <div className="cuspro-progress-bar">
                      <div className="cuspro-progress-fill" style={{ width: `${getProjectProgress(project)}%` }}></div>
                    </div>
                    <div className="cuspro-progress-stats">
                      <span>Paid: {formatCurrency(project.amountPaid)}</span>
                      <span>Total: {formatCurrency(project.totalCost)}</span>
                    </div>
                  </div>

                  {/* Payment Schedule Table */}
                  <div className="cuspro-payment-table-wrapper">
                    <h4>Payment Schedule</h4>
                    <table className="cuspro-payment-table">
                      <thead>
                        <tr>
                          <th>Payment Type</th>
                          <th>Amount</th>
                          <th>Due Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {project.paymentSchedule?.map((payment, idx) => (
                          <tr key={idx}>
                            <td className="cuspro-payment-type-cell">
                              {payment.type === 'initial' ? 'Initial Deposit (30%)' :
                               payment.type === 'progress' ? 'Progress Payment (40%)' :
                               'Final Payment (30%)'}
                            </td>
                            <td>{formatCurrency(payment.amount)}</td>
                            <td>{payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : 'TBD'}</td>
                            <td>
                              <span className={`cuspro-payment-status ${payment.status}`}>
                                {payment.status === 'paid' ? '✓ Paid' :
                                 payment.status === 'overdue' ? 'Overdue' : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="cuspro-project-actions">
                    <button className="cuspro-secondary-btn" onClick={() => handleViewDetails(project, 'project')}>
                      View Details
                    </button>
                    <button className="cuspro-secondary-btn">Contract</button>
                    {(project.status === 'approved' || project.status === 'initial_paid') && (
                      <button className="cuspro-primary-btn-small">Make Payment</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Free Quotes Tab */}
        {activeTab === 'free-quotes' && (
          <div className="cuspro-quotes-section">
            {freeQuotes.length === 0 ? (
              <div className="cuspro-empty-state">
                <div className="cuspro-empty-icon">📄</div>
                <h3>No free quotes yet</h3>
                <p>Use our solar estimator to get a free quote</p>
                <button className="cuspro-primary-btn" onClick={() => navigate('/app/customer/book-assessment')}>
                  Get Free Quote
                </button>
              </div>
            ) : (
              freeQuotes.map(quote => (
                <div key={quote._id} className="cuspro-quote-card">
                  <div className="cuspro-quote-header">
                    <div>
                      <h3>{quote.quotationReference}</h3>
                      <p>Requested: {new Date(quote.requestedAt).toLocaleDateString()}</p>
                      <p>{quote.propertyType} • {quote.desiredCapacity || 'Custom'} system</p>
                    </div>
                    {getStatusBadge(quote.status)}
                  </div>
                  <div className="cuspro-quote-actions">
                    <button className="cuspro-secondary-btn" onClick={() => handleViewDetails(quote, 'quote')}>
                      View Details
                    </button>
                    {quote.quotationFile && (
                      <button className="cuspro-secondary-btn" onClick={() => window.open(quote.quotationFile, '_blank')}>
                        View PDF
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Pre-Assessments Tab */}
        {activeTab === 'pre-assessments' && (
          <div className="cuspro-assessments-section">
            {preAssessments.length === 0 ? (
              <div className="cuspro-empty-state">
                <div className="cuspro-empty-icon">🔍</div>
                <h3>No pre-assessments yet</h3>
                <p>Once your booking is approved and payment is completed, you'll see the quotation here.</p>
                <button className="cuspro-primary-btn" onClick={() => navigate('/app/customer/book-assessment')}>
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
                  <div key={assessment.id} className="cuspro-assessment-card">
                    <div className="cuspro-assessment-header">
                      <div>
                        <h3>{assessment.id}</h3>
                        <p>{assessment.description}</p>
                        <p>Due: {assessment.dueDate}</p>
                      </div>
                      {getStatusBadge(assessment.status)}
                    </div>
                    <div className="cuspro-assessment-amount">
                      <span>Amount Due</span>
                      <strong>{formatCurrency(assessment.amount)}</strong>
                    </div>
                    <div className="cuspro-assessment-actions">
                      {(assessment.status === 'pending' && assessment.paymentStatus !== 'for_verification' && assessment.paymentStatus !== 'paid') && (
                        <button className="cuspro-pay-btn" onClick={() => handlePayNowClick(assessment)}>
                          Make Payment
                        </button>
                      )}

                      {assessment.paymentStatus === 'for_verification' && (
                        <span className="cuspro-verification-badge">For Verification</span>
                      )}

                      {assessment.paymentStatus === 'paid' && (
                        <>
                          {hasQuotation && !alreadyProjectCreated && (
                            <>
                              <button className="cuspro-secondary-btn" onClick={() => handleViewQuotation(assessment)}>
                                View Quotation
                              </button>
                              <button className="cuspro-secondary-btn" onClick={() => handleDownloadQuotation(assessment)} disabled={pdfLoading}>
                                {pdfLoading ? 'Downloading...' : 'Download PDF'}
                              </button>
                              <button className="cuspro-accept-btn" onClick={() => handleAcceptQuotationClick(assessment)}>
                                Accept Quotation
                              </button>
                            </>
                          )}

                          {alreadyProjectCreated && (
                            <button className="cuspro-view-project-btn" onClick={() => setActiveTab('projects')}>
                              View Project
                            </button>
                          )}
                        </>
                      )}

                      <button className="cuspro-secondary-btn" onClick={() => handleViewDetails(assessment, 'assessment')}>
                        View Details
                      </button>
                    </div>

                    {(assessment.status === 'pending' && assessment.paymentStatus !== 'for_verification' && assessment.paymentStatus !== 'paid') && (
                      <div className="cuspro-walkin-note">
                        <small>For walk-in payment, please visit our office at Purok 2, Masaya, San Jose, Camarines Sur</small>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Payments Tab - Table Format */}
        {activeTab === 'payments' && (
          <div className="cuspro-payments-section">
            {payments.length === 0 ? (
              <div className="cuspro-empty-state">
                <div className="cuspro-empty-icon">💰</div>
                <h3>No payment history</h3>
                <p>Your payments will appear here</p>
              </div>
            ) : (
              <div className="cuspro-payments-table-wrapper">
                <table className="cuspro-payments-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Invoice Number</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Payment Method</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(payment => (
                      <tr key={payment.id}>
                        <td>{new Date(payment.date).toLocaleDateString()}</td>
                        <td className="cuspro-invoice-cell">{payment.invoiceId}</td>
                        <td>{payment.description || 'Pre Assessment Fee'}</td>
                        <td className="cuspro-amount-cell">{formatCurrency(payment.amount)}</td>
                        <td className="cuspro-method-cell">
                          <span className={`cuspro-method-badge ${payment.method}`}>
                            {payment.method === 'gcash' ? 'GCash' : payment.method === 'cash' ? 'Cash' : payment.method}
                          </span>
                        </td>
                        <td>{getStatusBadge(payment.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modals remain the same structure but with updated class names */}
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

        {/* Accept Quotation Modal */}
        {showAcceptModal && acceptingItem && (
          <div className="cuspro-modal-overlay" onClick={() => setShowAcceptModal(false)}>
            <div className="cuspro-modal" onClick={e => e.stopPropagation()}>
              <button className="cuspro-modal-close" onClick={() => setShowAcceptModal(false)}>×</button>
              <h3>Accept Quotation</h3>
              <p>Are you sure you want to accept this quotation?</p>

              <div className="cuspro-quotation-summary">
                <h4>Quotation Summary</h4>
                <div className="cuspro-summary-row">
                  <span>System Size:</span>
                  <strong>{acceptingItem.systemSize || 'To be determined'} kWp</strong>
                </div>
                <div className="cuspro-summary-row">
                  <span>System Type:</span>
                  <strong>{acceptingItem.systemType || 'Grid-Tie'}</strong>
                </div>
                <div className="cuspro-summary-row">
                  <span>Total Cost:</span>
                  <strong>{formatCurrency(acceptingItem.totalCost || acceptingItem.amount)}</strong>
                </div>
              </div>

              <div className="cuspro-modal-actions">
                <button className="cuspro-cancel-btn" onClick={() => setShowAcceptModal(false)}>Cancel</button>
                <button className="cuspro-confirm-btn" onClick={confirmAcceptQuotation} disabled={acceptingLoading}>
                  {acceptingLoading ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedItem && (
          <div className="cuspro-modal-overlay" onClick={closeModal}>
            <div className="cuspro-modal" onClick={e => e.stopPropagation()}>
              <button className="cuspro-modal-close" onClick={closeModal}>×</button>
              <h3>Make Payment</h3>
              <div className="cuspro-payment-summary">
                <p><strong>Invoice:</strong> {selectedItem.invoiceNumber || selectedItem.id}</p>
                <p><strong>Amount:</strong> {formatCurrency(selectedItem.amount)}</p>
                <p><strong>Due Date:</strong> {selectedItem.dueDate}</p>
              </div>

              <div className="cuspro-payment-methods">
                <h4>Select Payment Method</h4>
                <div className="cuspro-method-options">
                  <div className={`cuspro-method-option ${paymentMethod === 'gcash' ? 'selected' : ''}`} onClick={() => setPaymentMethod('gcash')}>
                    <input type="radio" checked={paymentMethod === 'gcash'} onChange={() => {}} />
                    <div>
                      <strong>GCash</strong>
                      <small>Pay via GCash mobile wallet</small>
                    </div>
                  </div>
                  <div className={`cuspro-method-option ${paymentMethod === 'cash' ? 'selected' : ''}`} onClick={() => setPaymentMethod('cash')}>
                    <input type="radio" checked={paymentMethod === 'cash'} onChange={() => {}} />
                    <div>
                      <strong>Cash</strong>
                      <small>Pay in cash at our office</small>
                    </div>
                  </div>
                </div>
              </div>

              {paymentMethod === 'gcash' && (
                <>
                  <div className="cuspro-gcash-details">
                    <h4>GCash Details</h4>
                    <p>Number: <strong>0917XXXXXXX</strong></p>
                    <p>Name: <strong>SALFER ENGINEERING CORP</strong></p>
                    <p>Amount: <strong>{formatCurrency(selectedItem.amount)}</strong></p>
                  </div>
                  <div className="cuspro-form-group">
                    <label>Reference Number *</label>
                    <input type="text" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="Enter GCash reference number" />
                  </div>
                  <div className="cuspro-form-group">
                    <label>Upload Payment Screenshot *</label>
                    <input type="file" accept="image/*" onChange={(e) => setPaymentProof(e.target.files[0])} />
                    {paymentProof && <small>Selected: {paymentProof.name}</small>}
                  </div>
                </>
              )}

              {paymentMethod === 'cash' && (
                <div className="cuspro-cash-details">
                  <div className="cuspro-info-box">
                    <strong>Office Address</strong>
                    <p>Purok 2, Masaya, San Jose, Camarines Sur</p>
                    <p>Business Hours: Monday-Friday, 8:00 AM - 5:00 PM</p>
                  </div>
                </div>
              )}

              <div className="cuspro-modal-actions">
                <button className="cuspro-cancel-btn" onClick={closeModal}>Cancel</button>
                <button className="cuspro-confirm-btn" onClick={handlePaymentSubmit} disabled={isSubmitting || !paymentMethod}>
                  {isSubmitting ? 'Processing...' : `Pay with ${paymentMethod === 'gcash' ? 'GCash' : 'Cash'}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && detailsItem && (
          <div className="cuspro-modal-overlay" onClick={() => setShowDetailsModal(false)}>
            <div className="cuspro-modal cuspro-details-modal" onClick={e => e.stopPropagation()}>
              <button className="cuspro-modal-close" onClick={() => setShowDetailsModal(false)}>×</button>
              <h3>Details Information</h3>

              <div className="cuspro-details-content">
                {detailsItem.quotationReference ? (
                  <>
                    <div className="cuspro-details-section">
                      <h4>Quote Information</h4>
                      <p><strong>Reference Number:</strong> {detailsItem.quotationReference}</p>
                      <p><strong>Request Date:</strong> {new Date(detailsItem.requestedAt).toLocaleDateString()}</p>
                      <p><strong>Status:</strong> {detailsItem.status}</p>
                    </div>
                    <div className="cuspro-details-section">
                      <h4>Details</h4>
                      <p><strong>Property Type:</strong> {detailsItem.propertyType}</p>
                      <p><strong>Monthly Bill:</strong> {formatCurrency(detailsItem.monthlyBill)}</p>
                      <p><strong>Desired Capacity:</strong> {detailsItem.desiredCapacity || 'Not specified'}</p>
                    </div>
                  </>
                ) : detailsItem.bookingReference ? (
                  <>
                    <div className="cuspro-details-section">
                      <h4>Booking Information</h4>
                      <p><strong>Invoice Number:</strong> {detailsItem.id}</p>
                      <p><strong>Booking Reference:</strong> {detailsItem.bookingReference}</p>
                      <p><strong>Booked Date:</strong> {new Date(detailsItem.bookedAt).toLocaleDateString()}</p>
                      <p><strong>Status:</strong> {detailsItem.paymentStatus === 'paid' ? 'Paid' : detailsItem.paymentStatus === 'for_verification' ? 'For Verification' : 'Pending'}</p>
                    </div>
                    <div className="cuspro-details-section">
                      <h4>Assessment Details</h4>
                      <p><strong>Property Type:</strong> {detailsItem.propertyType}</p>
                      <p><strong>Desired Capacity:</strong> {detailsItem.desiredCapacity || 'Not specified'}</p>
                      <p><strong>Roof Type:</strong> {detailsItem.roofType || 'Not specified'}</p>
                      <p><strong>Preferred Date:</strong> {new Date(detailsItem.preferredDate).toLocaleDateString()}</p>
                      <p><strong>Amount:</strong> {formatCurrency(detailsItem.amount)}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="cuspro-details-section">
                      <h4>Project Information</h4>
                      <p><strong>Project Name:</strong> {detailsItem.projectName || detailsItem.projectReference}</p>
                      <p><strong>Project Reference:</strong> {detailsItem.projectReference}</p>
                      <p><strong>Status:</strong> {detailsItem.status}</p>
                    </div>
                    <div className="cuspro-details-section">
                      <h4>System Details</h4>
                      <p><strong>System Size:</strong> {detailsItem.systemSize}kW</p>
                      <p><strong>System Type:</strong> {detailsItem.systemType}</p>
                      <p><strong>Property Type:</strong> {detailsItem.propertyType}</p>
                    </div>
                    <div className="cuspro-details-section">
                      <h4>Financial</h4>
                      <p><strong>Total Cost:</strong> {formatCurrency(detailsItem.totalCost)}</p>
                      <p><strong>Amount Paid:</strong> {formatCurrency(detailsItem.amountPaid)}</p>
                      <p><strong>Balance:</strong> {formatCurrency(detailsItem.totalCost - detailsItem.amountPaid)}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="cuspro-modal-actions">
                <button className="cuspro-cancel-btn" onClick={() => setShowDetailsModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Request Installation Modal */}
        {showRequestModal && (
          <div className="cuspro-modal-overlay" onClick={() => setShowRequestModal(false)}>
            <div className="cuspro-modal" onClick={e => e.stopPropagation()}>
              <button className="cuspro-modal-close" onClick={() => setShowRequestModal(false)}>×</button>
              <h3>Request Solar Installation</h3>
              <p className="cuspro-modal-subtitle">Get a detailed quote for your solar panel system installation</p>

              <div className="cuspro-request-form">
                <div className="cuspro-form-group">
                  <label>Desired System Size *</label>
                  <select value={solarRequest.systemSize} onChange={(e) => setSolarRequest({ ...solarRequest, systemSize: e.target.value })}>
                    <option value="">Select system size</option>
                    <option value="3kW">3kW (Good for small homes)</option>
                    <option value="5kW">5kW (Recommended for average homes)</option>
                    <option value="7kW">7kW (For larger homes)</option>
                    <option value="10kW">10kW (For large homes / small business)</option>
                    <option value="Custom">Custom (I'll specify in notes)</option>
                  </select>
                  {requestErrors.systemSize && <span className="cuspro-error-text">{requestErrors.systemSize}</span>}
                </div>

                <div className="cuspro-form-group">
                  <label>System Type</label>
                  <select value={solarRequest.systemType} onChange={(e) => setSolarRequest({ ...solarRequest, systemType: e.target.value })}>
                    <option value="grid-tie">Grid-tie (No battery)</option>
                    <option value="hybrid">Hybrid (With battery backup)</option>
                    <option value="off-grid">Off-grid (Complete independence)</option>
                  </select>
                </div>

                <div className="cuspro-form-group">
                  <label>Property Type *</label>
                  <select value={solarRequest.propertyType} onChange={(e) => setSolarRequest({ ...solarRequest, propertyType: e.target.value })}>
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="industrial">Industrial</option>
                  </select>
                  {requestErrors.propertyType && <span className="cuspro-error-text">{requestErrors.propertyType}</span>}
                </div>

                <div className="cuspro-form-group">
                  <label>Additional Notes (Optional)</label>
                  <textarea rows="4" value={solarRequest.notes} onChange={(e) => setSolarRequest({ ...solarRequest, notes: e.target.value })} placeholder="Tell us about your specific needs, roof type, or any questions..." />
                </div>

                <div className="cuspro-info-box">
                  <strong>What happens next?</strong>
                  <p>Our solar specialists will review your request and provide a detailed quotation within 2-3 business days.</p>
                </div>
              </div>

              <div className="cuspro-modal-actions">
                <button className="cuspro-cancel-btn" onClick={() => setShowRequestModal(false)}>Cancel</button>
                <button className="cuspro-confirm-btn" onClick={handleRequestSolar} disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        )}

        <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      </div>
    </>
  );
};

export default Quotation;