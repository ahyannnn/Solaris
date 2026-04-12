// pages/Customer/Quotation.cuspro.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import '../../styles/Customer/quotation.css';
import { 
  FaCalendarAlt, FaProjectDiagram, FaClock, FaCheckCircle,
  FaEye, FaDownload, FaMoneyBillWave, FaCreditCard, FaSpinner,
  FaTimes, FaFileInvoice
} from 'react-icons/fa';

const Quotation = () => {
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('pre-assessments');
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successDetails, setSuccessDetails] = useState(null);
  const [showFullPaymentModal, setShowFullPaymentModal] = useState(false);
  const [acceptingItem, setAcceptingItem] = useState(null);
  const [acceptingLoading, setAcceptingLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [detailsItem, setDetailsItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [selectedPaymentPreference, setSelectedPaymentPreference] = useState('installment');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [freeQuotes, setFreeQuotes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [preAssessments, setPreAssessments] = useState([]);
  const [solarInvoices, setSolarInvoices] = useState([]);
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
    return [user.contactFirstName, user.contactMiddleName, user.contactLastName].filter(n => n).join(' ');
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

      const invoicesRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/solar-invoices/my-invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const invoices = invoicesRes.data.invoices || [];
      setSolarInvoices(invoices);

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
          type: 'pre-assessment',
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

      const projectBills = invoices.map(invoice => ({
        id: invoice.invoiceNumber,
        date: new Date(invoice.issueDate).toLocaleDateString(),
        dueDate: new Date(invoice.dueDate).toLocaleDateString(),
        amount: invoice.totalAmount,
        status: invoice.paymentStatus === 'paid' ? 'paid' :
          invoice.paymentStatus === 'partial' ? 'partial' :
            invoice.paymentStatus === 'overdue' ? 'overdue' : 'pending',
        description: invoice.description,
        type: 'project',
        projectId: invoice.projectId?._id,
        projectName: invoice.projectId?.projectName,
        projectReference: invoice.projectId?.projectReference,
        invoiceType: invoice.invoiceType,
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        paymentStatus: invoice.paymentStatus,
        totalAmount: invoice.totalAmount,
        amountPaid: invoice.amountPaid,
        balance: invoice.balance,
        payments: invoice.payments
      }));

      setPreAssessments(transformedBills);
      setPayments([...transformedBills, ...projectBills]);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      showToast('Failed to load data', 'error');
      setLoading(false);
    }
  };

  const handlePayMongoCardPayment = async () => {
    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const cardNumber = document.getElementById('card-number')?.value.replace(/\s/g, '');
      const cardExpiry = document.getElementById('card-expiry')?.value;
      const cardCvc = document.getElementById('card-cvc')?.value;

      if (!cardNumber || !cardExpiry || !cardCvc) {
        showToast('Please fill in all card details', 'warning');
        setIsSubmitting(false);
        return;
      }

      const [expMonth, expYear] = cardExpiry.split('/');

      const intentResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/payments/pre-assessment/${selectedItem.assessmentId}/create-intent`,
        { paymentMethod: 'card' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!intentResponse.data.success) throw new Error('Failed to create payment intent');

      const paymentIntentId = intentResponse.data.paymentIntentId;
      sessionStorage.setItem('pendingPaymentIntentId', paymentIntentId);

      const paymentResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/payments/process-card-payment`,
        {
          paymentIntentId: paymentIntentId,
          cardDetails: { cardNumber, expMonth: parseInt(expMonth), expYear: parseInt(expYear), cvc: cardCvc }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (paymentResponse.data.success) {
        setSuccessMessage('Payment Successful!');
        setSuccessDetails({
          title: 'Payment Completed',
          message: 'Your payment has been successfully processed.',
          reference: selectedItem.bookingReference
        });
        setShowSuccessModal(true);
        closeModal();
        fetchData();
      } else {
        showToast(paymentResponse.data.message || 'Payment failed', 'error');
      }
    } catch (err) {
      console.error('Card payment error:', err);
      showToast(err.response?.data?.message || 'Failed to process card payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProjectInvoicePayment = async (invoice) => {
    setSelectedItem({
      ...invoice,
      _id: invoice.projectId,
      projectId: invoice.projectId,
      projectName: invoice.projectName,
      totalCost: invoice.totalAmount,
      invoiceId: invoice.invoiceId
    });
    setShowFullPaymentModal(true);
  };

  const handleProjectPayMongoCardPayment = async () => {
    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const cardNumber = document.getElementById('full-card-number')?.value.replace(/\s/g, '');
      const cardExpiry = document.getElementById('full-card-expiry')?.value;
      const cardCvc = document.getElementById('full-card-cvc')?.value;

      if (!cardNumber || !cardExpiry || !cardCvc) {
        showToast('Please fill in all card details', 'warning');
        setIsSubmitting(false);
        return;
      }

      const [expMonth, expYear] = cardExpiry.split('/');

      const intentResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/payments/invoice/${selectedItem.invoiceId}/create-intent`,
        { paymentMethod: 'card' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!intentResponse.data.success) throw new Error('Failed to create payment intent');

      const paymentIntentId = intentResponse.data.paymentIntentId;

      const paymentResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/payments/process-card-payment`,
        {
          paymentIntentId: paymentIntentId,
          cardDetails: { cardNumber, expMonth: parseInt(expMonth), expYear: parseInt(expYear), cvc: cardCvc }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (paymentResponse.data.success) {
        setSuccessMessage('Payment Successful!');
        setSuccessDetails({
          title: 'Payment Completed',
          message: 'Your payment has been successfully processed.',
          reference: selectedItem.invoiceNumber
        });
        setShowSuccessModal(true);
        closeFullPaymentModal();
        fetchData();
      } else {
        showToast(paymentResponse.data.message || 'Payment failed', 'error');
      }
    } catch (err) {
      console.error('Project card payment error:', err);
      showToast(err.response?.data?.message || 'Failed to process card payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayNowClick = (item) => {
    if (item.type === 'project') {
      handleProjectInvoicePayment(item);
    } else {
      setSelectedItem(item);
      setPaymentMethod(null);
      setPaymentProof(null);
      setPaymentReference('');
      setShowPaymentModal(true);
    }
  };

  const handleAcceptQuotationClick = (assessment) => {
    setAcceptingItem(assessment);
    setSelectedPaymentPreference('installment');
    setShowAcceptModal(true);
  };

  const handleViewDetails = (item) => {
    setDetailsItem(item);
    setShowDetailsModal(true);
  };

  const handleViewQuotation = async (assessment) => {
    if (!assessment.quotationUrl) {
      showToast('No quotation PDF available for this assessment', 'warning');
      return;
    }
    window.open(assessment.quotationUrl, '_blank');
  };

  const handleDownloadQuotation = async (assessment) => {
    if (!assessment.quotationUrl) {
      showToast('No quotation PDF available for this assessment', 'warning');
      return;
    }
    setPdfLoading(true);
    try {
      const response = await axios.get(assessment.quotationUrl, { responseType: 'blob' });
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
          sourceId: acceptingItem.assessmentId,
          paymentPreference: selectedPaymentPreference
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMessage('Quotation Accepted!');
      setSuccessDetails({
        title: 'Quotation Accepted Successfully',
        message: `Your quotation has been accepted. ${selectedPaymentPreference === 'full' ? 'You can now proceed with full payment.' : 'Invoices will be generated for each payment milestone.'}`,
        reference: response.data.project?.projectReference
      });
      setShowSuccessModal(true);
      setShowAcceptModal(false);
      setAcceptingItem(null);
      fetchData();
    } catch (err) {
      console.error('Error accepting quotation:', err);
      showToast(err.response?.data?.message || 'Failed to accept quotation. Please try again.', 'error');
    } finally {
      setAcceptingLoading(false);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!paymentMethod) { showToast('Please select a payment method', 'warning'); return; }
    if (paymentMethod === 'gcash') {
      if (!paymentProof) { showToast('Please upload payment proof', 'warning'); return; }
      if (!paymentReference) { showToast('Please enter GCash reference number', 'warning'); return; }
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
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        setSuccessMessage('Payment Submitted!');
        setSuccessDetails({ title: 'Payment Submitted for Verification', message: 'Your payment has been submitted and is now pending verification.', reference: selectedItem.bookingReference });
        setShowSuccessModal(true);
        closeModal();
        fetchData();
      } else if (paymentMethod === 'cash') {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/pre-assessments/cash-payment`, {
          bookingReference: selectedItem.bookingReference
        }, { headers: { Authorization: `Bearer ${token}` } });
        setSuccessMessage('Cash Payment Selected!');
        setSuccessDetails({ title: 'Cash Payment Option', message: 'Please visit our office to complete your payment.', reference: selectedItem.bookingReference });
        setShowSuccessModal(true);
        closeModal();
        fetchData();
      }
    } catch (err) {
      console.error('Payment error:', err);
      showToast(err.response?.data?.message || 'Failed to process payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCashPaymentSubmit = async () => {
    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/pre-assessments/cash-payment`, {
        bookingReference: selectedItem.bookingReference
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccessMessage('Cash Payment Selected!');
      setSuccessDetails({ title: 'Cash Payment Option', message: 'Please visit our office to complete your payment.', reference: selectedItem.bookingReference });
      setShowSuccessModal(true);
      closeModal();
      fetchData();
    } catch (err) {
      console.error('Cash payment error:', err);
      showToast(err.response?.data?.message || 'Failed to process cash payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFullPaymentSubmit = async () => {
    if (!paymentMethod) { showToast('Please select a payment method', 'warning'); return; }
    if (paymentMethod === 'gcash') {
      if (!paymentProof) { showToast('Please upload payment proof', 'warning'); return; }
      if (!paymentReference) { showToast('Please enter GCash reference number', 'warning'); return; }
    }
    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const fullAmount = parseFloat(selectedItem.totalAmount);
      if (paymentMethod === 'gcash') {
        const formData = new FormData();
        formData.append('amount', fullAmount.toString());
        formData.append('paymentMethod', 'gcash');
        formData.append('paymentReference', paymentReference);
        formData.append('paymentType', 'full');
        formData.append('invoiceId', selectedItem.invoiceId);
        if (paymentProof) formData.append('paymentProof', paymentProof);
        await axios.post(`${import.meta.env.VITE_API_URL}/api/solar-invoices/${selectedItem.invoiceId}/pay`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        setSuccessMessage('Payment Submitted!');
        setSuccessDetails({ title: 'Payment Submitted for Verification', message: 'Your payment has been submitted and is now pending verification.', reference: selectedItem.invoiceNumber });
        setShowSuccessModal(true);
        closeFullPaymentModal();
        fetchData();
      } else if (paymentMethod === 'cash') {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/solar-invoices/${selectedItem.invoiceId}/pay-cash`, {
          amount: fullAmount
        }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
        setSuccessMessage('Cash Payment Selected!');
        setSuccessDetails({ title: 'Cash Payment Option', message: 'Please visit our office to complete your payment.', reference: selectedItem.invoiceNumber });
        setShowSuccessModal(true);
        closeFullPaymentModal();
        fetchData();
      }
    } catch (err) {
      console.error('Payment error:', err);
      showToast(err.response?.data?.message || 'Failed to process payment', 'error');
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

  const closeFullPaymentModal = () => {
    setShowFullPaymentModal(false);
    setSelectedItem(null);
    setPaymentProof(null);
    setPaymentReference('');
    setPaymentMethod(null);
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setSuccessMessage('');
    setSuccessDetails(null);
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': <span className="status-badge-cuspro pending-cuspro">Pending</span>,
      'pending_payment': <span className="status-badge-cuspro pending-cuspro">Pending</span>,
      'paid': <span className="status-badge-cuspro paid-cuspro">Paid</span>,
      'for_verification': <span className="status-badge-cuspro for-verification-cuspro">Verifying</span>,
      'processing': <span className="status-badge-cuspro processing-cuspro">Processing</span>,
      'quoted': <span className="status-badge-cuspro quoted-cuspro">Quoted</span>,
      'completed': <span className="status-badge-cuspro completed-cuspro">Completed</span>,
      'cancelled': <span className="status-badge-cuspro cancelled-cuspro">Cancelled</span>,
      'overdue': <span className="status-badge-cuspro overdue-cuspro">Overdue</span>,
      'partial': <span className="status-badge-cuspro partial-cuspro">Partial</span>
    };
    return badges[status] || <span className="status-badge-cuspro">{status}</span>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency', currency: 'PHP', minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getFilteredPayments = () => {
    let filtered = payments;
    if (paymentFilter !== 'all') filtered = filtered.filter(p => p.status === paymentFilter);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.id?.toLowerCase().includes(term) ||
        p.bookingReference?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term) ||
        p.projectName?.toLowerCase().includes(term)
      );
    }
    return filtered;
  };

  const SkeletonLoader = () => (
    <div className="cuspro-quotation-container">
      <div className="cuspro-header-card skeleton-card">
        <div className="skeleton-line large"></div>
        <div className="skeleton-line medium"></div>
      </div>
      <div className="cuspro-tabs">
        <div className="skeleton-tab"></div>
        <div className="skeleton-tab"></div>
        <div className="skeleton-tab"></div>
      </div>
      <div className="skeleton-bill-card"></div>
    </div>
  );

  if (loading) {
    return (
      <>
        <Helmet><title>My Solar Journey | Salfer Engineering</title></Helmet>
        <SkeletonLoader />
      </>
    );
  }

  return (
    <>
      <Helmet><title>My Solar Journey | Salfer Engineering</title></Helmet>

      <div className="cuspro-quotation-container">
        <div className="cuspro-header-card">
          <div className="cuspro-header-content">
            <h1>My Solar Journey</h1>
            <p>Track your projects, view quotes, and manage payments</p>
          </div>
        </div>

        <div className="cuspro-tabs">
          <button className={`cuspro-tab ${activeTab === 'pre-assessments' ? 'active' : ''}`} onClick={() => setActiveTab('pre-assessments')}>Pre-Assessments</button>
          <button className={`cuspro-tab ${activeTab === 'my-bills' ? 'active' : ''}`} onClick={() => setActiveTab('my-bills')}>My Bills</button>
          <button className={`cuspro-tab ${activeTab === 'payment-history' ? 'active' : ''}`} onClick={() => setActiveTab('payment-history')}>Payment History</button>
        </div>

        {/* PRE-ASSESSMENTS TAB */}
        {activeTab === 'pre-assessments' && (
          <div className="cuspro-assessments-section">
            {preAssessments.length === 0 ? (
              <div className="cuspro-empty-state">
                <FaCalendarAlt className="cuspro-empty-icon" />
                <h3>No pre-assessments yet</h3>
                <p>Once your booking is approved and payment is completed, you'll see the quotation here.</p>
                <button className="cuspro-primary-btn" onClick={() => navigate('/app/customer/book-assessment')}>Book Assessment</button>
              </div>
            ) : (
              preAssessments.map(assessment => {
                const hasQuotation = assessment.quotationUrl;
                const projectExists = projects.some(project => {
                  if (project.preAssessmentId) {
                    const projectPreAssessmentId = typeof project.preAssessmentId === 'object' ? project.preAssessmentId._id?.toString() : project.preAssessmentId?.toString();
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
                        <button className="cuspro-pay-btn" onClick={() => handlePayNowClick(assessment)}><FaMoneyBillWave /> Make Payment</button>
                      )}
                      {assessment.paymentStatus === 'for_verification' && (
                        <span className="cuspro-verification-badge"><FaClock /> For Verification</span>
                      )}
                      {assessment.paymentStatus === 'paid' && (
                        <>
                          {hasQuotation && !alreadyProjectCreated && (
                            <>
                              <button className="cuspro-secondary-btn" onClick={() => handleViewQuotation(assessment)}><FaEye /> View</button>
                              <button className="cuspro-secondary-btn" onClick={() => handleDownloadQuotation(assessment)} disabled={pdfLoading}><FaDownload /> {pdfLoading ? '...' : 'PDF'}</button>
                              <button className="cuspro-accept-btn" onClick={() => handleAcceptQuotationClick(assessment)}><FaCheckCircle /> Accept</button>
                            </>
                          )}
                          {alreadyProjectCreated && (
                            <button className="cuspro-view-project-btn" onClick={() => navigate('/app/customer/my-project')}><FaProjectDiagram /> View Project</button>
                          )}
                        </>
                      )}
                      <button className="cuspro-secondary-btn" onClick={() => handleViewDetails(assessment)}><FaEye /> Details</button>
                    </div>
                    {(assessment.status === 'pending' && assessment.paymentStatus !== 'for_verification' && assessment.paymentStatus !== 'paid') && (
                      <div className="cuspro-walkin-note"><small>For walk-in payment, please visit our office at Purok 2, Masaya, San Jose, Camarines Sur</small></div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* MY BILLS TAB */}
        {activeTab === 'my-bills' && (
          <div className="cuspro-bills-section">
            <div className="cuspro-filter-search-section">
              <div className="cuspro-filter-group">
                <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="cuspro-filter-select">
                  <option value="all">All Bills</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="for_verification">For Verification</option>
                </select>
              </div>
              <div className="cuspro-search-group">
                <input type="text" placeholder="Search by reference..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="cuspro-search-input" />
              </div>
            </div>

            <div className="cuspro-bills-list">
              {getFilteredPayments().length === 0 ? (
                <div className="cuspro-empty-state"><h3>No bills found</h3><p>Try adjusting your search or filter criteria.</p></div>
              ) : (
                getFilteredPayments().map((bill, index) => (
                  <div key={index} className="cuspro-bill-card">
                    <div className="cuspro-bill-header">
                      <div className="cuspro-bill-info">
                        <h3>{bill.description}</h3>
                        <p className="cuspro-bill-ref">Invoice: {bill.id}</p>
                        {bill.projectName && <p className="cuspro-bill-project">{bill.projectName}</p>}
                        {bill.invoiceType && (
                          <span className={`invoice-type-label ${bill.invoiceType}`}>
                            {bill.invoiceType === 'initial' && 'Initial (30%)'}
                            {bill.invoiceType === 'progress' && 'Progress (40%)'}
                            {bill.invoiceType === 'final' && 'Final (30%)'}
                            {bill.invoiceType === 'full' && 'Full Payment'}
                          </span>
                        )}
                      </div>
                      {getStatusBadge(bill.status)}
                    </div>
                    <div className="cuspro-bill-details">
                      <div className="cuspro-bill-detail-item"><span>Due:</span><strong>{bill.dueDate}</strong></div>
                      <div className="cuspro-bill-detail-item amount"><span>Amount:</span><strong>{formatCurrency(bill.amount)}</strong></div>
                      {bill.paymentStatus === 'partial' && (
                        <>
                          <div className="cuspro-bill-detail-item"><span>Paid:</span><strong>{formatCurrency(bill.amountPaid)}</strong></div>
                          <div className="cuspro-bill-detail-item"><span>Balance:</span><strong>{formatCurrency(bill.balance)}</strong></div>
                        </>
                      )}
                    </div>
                    <div className="cuspro-bill-actions">
                      {(bill.status === 'pending' || bill.status === 'partial') && (
                        <button className="cuspro-pay-btn" onClick={() => handlePayNowClick(bill)}>Pay Now</button>
                      )}
                      {bill.status === 'for_verification' && <span className="cuspro-verification-badge">Under Review</span>}
                      {bill.status === 'paid' && <span className="cuspro-paid-badge">Completed</span>}
                      <button className="cuspro-secondary-btn" onClick={() => handleViewDetails(bill)}>Details</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* PAYMENT HISTORY TAB */}
        {activeTab === 'payment-history' && (
          <div className="cuspro-table-section">
            <div className="cuspro-filter-search-section">
              <div className="cuspro-filter-group">
                <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="cuspro-filter-select">
                  <option value="all">All</option>
                  <option value="paid">Completed</option>
                  <option value="for_verification">For Verification</option>
                </select>
              </div>
              <div className="cuspro-search-group">
                <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="cuspro-search-input" />
              </div>
            </div>

            {getFilteredPayments().filter(p => p.status === 'paid' || p.status === 'for_verification').length === 0 ? (
              <div className="cuspro-empty-state"><h3>No payment history</h3><p>Your completed payments will appear here.</p></div>
            ) : (
              <div className="cuspro-table-wrapper">
                <table className="cuspro-data-table">
                  <thead>
                    <tr><th>Date</th><th>Reference</th><th>Description</th><th>Amount</th><th>Status</th><th></th></tr>
                  </thead>
                  <tbody>
                    {getFilteredPayments().filter(p => p.status === 'paid' || p.status === 'for_verification').map((payment, idx) => (
                      <tr key={idx}>
                        <td>{payment.date || payment.dueDate}</td>
                        <td className="cuspro-reference-cell">{payment.id}</td>
                        <td>{payment.description}</td>
                        <td className="cuspro-amount-cell">{formatCurrency(payment.amount)}</td>
                        <td>{getStatusBadge(payment.status)}</td>
                        <td><button className="cuspro-action-view" onClick={() => handleViewDetails(payment)}>View</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ACCEPT QUOTATION MODAL */}
        {showAcceptModal && acceptingItem && (
          <div className="cuspro-modal-overlay" onClick={() => setShowAcceptModal(false)}>
            <div className="cuspro-modal cuspro-accept-modal" onClick={e => e.stopPropagation()}>
              <button className="cuspro-modal-close" onClick={() => setShowAcceptModal(false)}><FaTimes /></button>
              <h3>Accept Quotation</h3>
              <p>Please select your payment preference</p>
              <div className="cuspro-quotation-summary">
                <h4>Summary</h4>
                <div className="cuspro-summary-row"><span>System Size:</span><strong>{acceptingItem.systemSize || 'TBD'} kWp</strong></div>
                <div className="cuspro-summary-row"><span>Total Cost:</span><strong>{formatCurrency(acceptingItem.totalCost || acceptingItem.amount)}</strong></div>
              </div>
              <div className="cuspro-payment-preference-section">
                <h4>Payment Option</h4>
                <div className={`cuspro-preference-option ${selectedPaymentPreference === 'installment' ? 'selected' : ''}`} onClick={() => setSelectedPaymentPreference('installment')}>
                  <input type="radio" checked={selectedPaymentPreference === 'installment'} readOnly />
                  <div className="cuspro-preference-content">
                    <strong>Installment (30% - 40% - 30%)</strong>
                    <div className="cuspre-preference-details">
                      <span>Initial: {formatCurrency((acceptingItem.totalCost || acceptingItem.amount) * 0.3)}</span>
                      <span>Progress: {formatCurrency((acceptingItem.totalCost || acceptingItem.amount) * 0.4)}</span>
                      <span>Final: {formatCurrency((acceptingItem.totalCost || acceptingItem.amount) * 0.3)}</span>
                    </div>
                  </div>
                </div>
                <div className={`cuspro-preference-option ${selectedPaymentPreference === 'full' ? 'selected' : ''}`} onClick={() => setSelectedPaymentPreference('full')}>
                  <input type="radio" checked={selectedPaymentPreference === 'full'} readOnly />
                  <div className="cuspro-preference-content">
                    <strong>Full Payment</strong>
                    <div className="cuspre-preference-details full-payment-details">
                      <span>Amount: {formatCurrency(acceptingItem.totalCost || acceptingItem.amount)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="cuspro-modal-actions">
                <button className="cuspro-cancel-btn" onClick={() => setShowAcceptModal(false)}>Cancel</button>
                <button className="cuspro-confirm-btn" onClick={confirmAcceptQuotation} disabled={acceptingLoading}>
                  {acceptingLoading ? <FaSpinner className="spinning" /> : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FULL PAYMENT MODAL */}
        {showFullPaymentModal && selectedItem && (
          <div className="cuspro-modal-overlay" onClick={closeFullPaymentModal}>
            <div className="cuspro-modal" onClick={e => e.stopPropagation()}>
              <button className="cuspro-modal-close" onClick={closeFullPaymentModal}><FaTimes /></button>
              <h3>Pay Invoice</h3>
              <div className="cuspro-payment-summary">
                <p><strong>Invoice:</strong> {selectedItem.invoiceNumber}</p>
                <p><strong>Project:</strong> {selectedItem.projectName}</p>
                <p><strong>Amount Due:</strong> {formatCurrency(selectedItem.balance || selectedItem.totalAmount)}</p>
              </div>
              <div className="cuspro-payment-methods">
                <h4>Payment Method</h4>
                <div className="cuspro-method-options">
                  <div className={`cuspro-method-option ${paymentMethod === 'gcash' ? 'selected' : ''}`} onClick={() => setPaymentMethod('gcash')}>
                    <input type="radio" checked={paymentMethod === 'gcash'} readOnly /><div><strong>GCash</strong><small>Upload receipt</small></div>
                  </div>
                  <div className={`cuspro-method-option ${paymentMethod === 'paymongo_card' ? 'selected' : ''}`} onClick={() => setPaymentMethod('paymongo_card')}>
                    <input type="radio" checked={paymentMethod === 'paymongo_card'} readOnly /><div><strong>Credit/Debit Card</strong><small>Instant payment</small></div>
                  </div>
                  <div className={`cuspro-method-option ${paymentMethod === 'cash' ? 'selected' : ''}`} onClick={() => setPaymentMethod('cash')}>
                    <input type="radio" checked={paymentMethod === 'cash'} readOnly /><div><strong>Cash</strong><small>Pay at office</small></div>
                  </div>
                </div>
              </div>
              {paymentMethod === 'gcash' && (
                <>
                  <div className="cuspro-gcash-details"><h4>GCash Details</h4><p>Number: <strong>0917XXXXXXX</strong></p><p>Name: <strong>SALFER ENGINEERING CORP</strong></p></div>
                  <div className="cuspro-form-group"><label>Reference Number</label><input type="text" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="Enter reference" /></div>
                  <div className="cuspro-form-group"><label>Upload Screenshot</label><input type="file" accept="image/*" onChange={(e) => setPaymentProof(e.target.files[0])} /></div>
                  <button className="cuspro-confirm-btn" onClick={handleFullPaymentSubmit} disabled={isSubmitting}>{isSubmitting ? 'Processing...' : 'Submit'}</button>
                </>
              )}
              {paymentMethod === 'paymongo_card' && (
                <div className="cuspro-paymongo-section">
                  <div className="cuspro-card-form">
                    <div className="cuspro-form-group"><label>Card Number</label><input type="text" id="full-card-number" placeholder="1234 5678 9012 3456" /></div>
                    <div className="cuspro-form-row">
                      <div className="cuspro-form-group"><label>Expiry</label><input type="text" id="full-card-expiry" placeholder="MM/YY" /></div>
                      <div className="cuspro-form-group"><label>CVC</label><input type="text" id="full-card-cvc" placeholder="123" /></div>
                    </div>
                    <button className="cuspro-paymongo-btn" onClick={handleProjectPayMongoCardPayment} disabled={isSubmitting}>{isSubmitting ? 'Processing...' : `Pay ${formatCurrency(selectedItem.balance || selectedItem.totalAmount)}`}</button>
                  </div>
                </div>
              )}
              {paymentMethod === 'cash' && (
                <div className="cuspro-cash-details">
                  <div className="cuspro-info-box"><strong>Office Address</strong><p>Purok 2, Masaya, San Jose, Camarines Sur</p><p>Mon-Fri, 8AM-5PM</p></div>
                  <button className="cuspro-confirm-btn" onClick={handleFullPaymentSubmit} disabled={isSubmitting}>Confirm Cash Payment</button>
                </div>
              )}
              <div className="cuspro-modal-actions"><button className="cuspro-cancel-btn" onClick={closeFullPaymentModal}>Cancel</button></div>
            </div>
          </div>
        )}

        {/* PAYMENT MODAL */}
        {showPaymentModal && selectedItem && (
          <div className="cuspro-modal-overlay" onClick={closeModal}>
            <div className="cuspro-modal" onClick={e => e.stopPropagation()}>
              <button className="cuspro-modal-close" onClick={closeModal}><FaTimes /></button>
              <h3>Make Payment</h3>
              <div className="cuspro-payment-summary">
                <p><strong>Invoice:</strong> {selectedItem.invoiceNumber || selectedItem.id}</p>
                <p><strong>Amount:</strong> {formatCurrency(selectedItem.amount)}</p>
              </div>
              <div className="cuspro-payment-methods">
                <h4>Payment Method</h4>
                <div className="cuspro-method-options">
                  <div className={`cuspro-method-option ${paymentMethod === 'gcash' ? 'selected' : ''}`} onClick={() => setPaymentMethod('gcash')}>
                    <input type="radio" checked={paymentMethod === 'gcash'} readOnly /><div><strong>GCash</strong><small>Upload receipt</small></div>
                  </div>
                  <div className={`cuspro-method-option ${paymentMethod === 'paymongo_card' ? 'selected' : ''}`} onClick={() => setPaymentMethod('paymongo_card')}>
                    <input type="radio" checked={paymentMethod === 'paymongo_card'} readOnly /><div><strong>Card</strong><small>Instant</small></div>
                  </div>
                  <div className={`cuspro-method-option ${paymentMethod === 'cash' ? 'selected' : ''}`} onClick={() => setPaymentMethod('cash')}>
                    <input type="radio" checked={paymentMethod === 'cash'} readOnly /><div><strong>Cash</strong><small>Office</small></div>
                  </div>
                </div>
              </div>
              {paymentMethod === 'gcash' && (
                <>
                  <div className="cuspro-gcash-details"><h4>GCash Details</h4><p>Number: <strong>0917XXXXXXX</strong></p><p>Name: <strong>SALFER ENGINEERING CORP</strong></p></div>
                  <div className="cuspro-form-group"><label>Reference</label><input type="text" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} /></div>
                  <div className="cuspro-form-group"><label>Screenshot</label><input type="file" accept="image/*" onChange={(e) => setPaymentProof(e.target.files[0])} /></div>
                  <button className="cuspro-confirm-btn" onClick={handlePaymentSubmit} disabled={isSubmitting}>{isSubmitting ? 'Processing...' : 'Submit'}</button>
                </>
              )}
              {paymentMethod === 'paymongo_card' && (
                <div className="cuspro-paymongo-section">
                  <div className="cuspro-card-form">
                    <div className="cuspro-form-group"><label>Card Number</label><input type="text" id="card-number" placeholder="1234 5678 9012 3456" /></div>
                    <div className="cuspro-form-row">
                      <div className="cuspro-form-group"><label>Expiry</label><input type="text" id="card-expiry" placeholder="MM/YY" /></div>
                      <div className="cuspro-form-group"><label>CVC</label><input type="text" id="card-cvc" placeholder="123" /></div>
                    </div>
                    <button className="cuspro-paymongo-btn" onClick={handlePayMongoCardPayment} disabled={isSubmitting}>{isSubmitting ? 'Processing...' : `Pay ${formatCurrency(selectedItem.amount)}`}</button>
                  </div>
                </div>
              )}
              {paymentMethod === 'cash' && (
                <div className="cuspro-cash-details">
                  <div className="cuspro-info-box"><strong>Office Address</strong><p>Purok 2, Masaya, San Jose, Camarines Sur</p></div>
                  <button className="cuspro-confirm-btn" onClick={handleCashPaymentSubmit} disabled={isSubmitting}>Confirm</button>
                </div>
              )}
              <div className="cuspro-modal-actions"><button className="cuspro-cancel-btn" onClick={closeModal}>Cancel</button></div>
            </div>
          </div>
        )}

        {/* DETAILS MODAL */}
        {showDetailsModal && detailsItem && (
          <div className="cuspro-modal-overlay" onClick={() => setShowDetailsModal(false)}>
            <div className="cuspro-modal cuspro-details-modal" onClick={e => e.stopPropagation()}>
              <button className="cuspro-modal-close" onClick={() => setShowDetailsModal(false)}><FaTimes /></button>
              <h3>Details</h3>
              <div className="cuspro-details-content">
                {detailsItem.bookingReference ? (
                  <>
                    <div className="cuspro-details-section"><h4>Booking</h4><p><strong>Reference:</strong> {detailsItem.bookingReference}</p><p><strong>Status:</strong> {detailsItem.paymentStatus}</p><p><strong>Amount:</strong> {formatCurrency(detailsItem.amount)}</p></div>
                    <div className="cuspro-details-section"><h4>Assessment</h4><p><strong>Property:</strong> {detailsItem.propertyType}</p><p><strong>Preferred Date:</strong> {new Date(detailsItem.preferredDate).toLocaleDateString()}</p></div>
                  </>
                ) : (
                  <>
                    <div className="cuspro-details-section"><h4>Bill</h4><p><strong>Invoice:</strong> {detailsItem.id}</p><p><strong>Project:</strong> {detailsItem.projectName}</p><p><strong>Status:</strong> {detailsItem.status}</p></div>
                    <div className="cuspro-details-section"><h4>Amount</h4><p><strong>Total:</strong> {formatCurrency(detailsItem.totalAmount || detailsItem.amount)}</p>{detailsItem.amountPaid > 0 && <p><strong>Paid:</strong> {formatCurrency(detailsItem.amountPaid)}</p>}</div>
                  </>
                )}
              </div>
              <div className="cuspro-modal-actions"><button className="cuspro-cancel-btn" onClick={() => setShowDetailsModal(false)}>Close</button></div>
            </div>
          </div>
        )}

        {/* SUCCESS MODAL */}
        {showSuccessModal && (
          <div className="cuspro-modal-overlay" onClick={closeSuccessModal}>
            <div className="cuspro-modal cuspro-success-modal" onClick={e => e.stopPropagation()}>
              <div className="cuspro-success-icon"><FaCheckCircle /></div>
              <h3>{successMessage}</h3>
              <div className="cuspro-success-content">
                <p><strong>{successDetails?.title}</strong></p>
                <p>{successDetails?.message}</p>
                {successDetails?.reference && <p className="cuspro-success-ref">Reference: {successDetails.reference}</p>}
              </div>
              <button className="cuspro-success-btn" onClick={closeSuccessModal}>Close</button>
            </div>
          </div>
        )}

        <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      </div>
    </>
  );
};

export default Quotation;