// pages/Customer/Quotation.cuspro.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import '../../styles/Customer/quotation.css';

const Quotation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast, showToast, hideToast } = useToast();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('my-bills');
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

      const projectBills = [];
      projectsRes.data.projects?.forEach(project => {
        if (project.paymentSchedule && project.paymentSchedule.length > 0) {
          project.paymentSchedule.forEach(payment => {
            projectBills.push({
              id: `${project.projectReference}_${payment.type}`,
              date: new Date(payment.dueDate).toLocaleDateString(),
              dueDate: new Date(payment.dueDate).toLocaleDateString(),
              amount: payment.amount,
              status: payment.status === 'paid' ? 'paid' : 
                      payment.status === 'overdue' ? 'overdue' : 'pending',
              description: `${project.projectName} - ${payment.type === 'initial' ? 'Initial Deposit (30%)' : 
                          payment.type === 'progress' ? 'Progress Payment (40%)' : 
                          payment.type === 'final' ? 'Final Payment (30%)' : 'Full Payment'}`,
              type: 'project',
              projectId: project._id,
              projectName: project.projectName,
              projectReference: project.projectReference,
              paymentType: payment.type,
              paymentPreference: project.paymentPreference
            });
          });
        }
      });

      setPreAssessments(transformedBills);
      setPayments([...transformedBills, ...projectBills]);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      showToast('Failed to load data', 'error');
      setLoading(false);
    }
  };

  // PayMongo Card Payment Handler for Pre-assessment
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

      if (!intentResponse.data.success) {
        throw new Error('Failed to create payment intent');
      }

      const paymentIntentId = intentResponse.data.paymentIntentId;
      
      sessionStorage.setItem('pendingPaymentIntentId', paymentIntentId);

      const paymentResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/payments/process-card-payment`,
        {
          paymentIntentId: paymentIntentId,
          cardDetails: {
            cardNumber: cardNumber,
            expMonth: parseInt(expMonth),
            expYear: parseInt(expYear),
            cvc: cardCvc
          }
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

  // Project PayMongo Card Payment
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
        `${import.meta.env.VITE_API_URL}/api/payments/project/${selectedItem._id}/payment/full/create-intent`,
        { paymentMethod: 'card' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!intentResponse.data.success) {
        throw new Error('Failed to create payment intent');
      }

      const paymentIntentId = intentResponse.data.paymentIntentId;

      const paymentResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/payments/process-card-payment`,
        {
          paymentIntentId: paymentIntentId,
          cardDetails: {
            cardNumber: cardNumber,
            expMonth: parseInt(expMonth),
            expYear: parseInt(expYear),
            cvc: cardCvc
          }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (paymentResponse.data.success) {
        setSuccessMessage('Payment Successful!');
        setSuccessDetails({
          title: 'Full Payment Completed',
          message: 'Your full payment has been successfully processed.',
          reference: selectedItem.projectReference
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
      const project = projects.find(p => p._id === item.projectId);
      if (project) {
        setSelectedItem(project);
        setShowFullPaymentModal(true);
      }
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

  const handleViewDetails = (item, type) => {
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
          sourceId: acceptingItem.assessmentId,
          paymentPreference: selectedPaymentPreference
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccessMessage('Quotation Accepted!');
      setSuccessDetails({
        title: 'Quotation Accepted Successfully',
        message: `Your quotation has been accepted. ${selectedPaymentPreference === 'full' ? 'You can now proceed with full payment.' : 'You can now proceed with installment payments.'}`,
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

        setSuccessMessage('Payment Submitted!');
        setSuccessDetails({
          title: 'Payment Submitted for Verification',
          message: 'Your payment has been submitted and is now pending verification.',
          reference: selectedItem.bookingReference
        });
        setShowSuccessModal(true);
        closeModal();
        fetchData();
      } else if (paymentMethod === 'cash') {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/pre-assessments/cash-payment`, {
          bookingReference: selectedItem.bookingReference
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setSuccessMessage('Cash Payment Selected!');
        setSuccessDetails({
          title: 'Cash Payment Option',
          message: 'Please visit our office to complete your payment.',
          reference: selectedItem.bookingReference
        });
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
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccessMessage('Cash Payment Selected!');
      setSuccessDetails({
        title: 'Cash Payment Option',
        message: 'Please visit our office to complete your payment.',
        reference: selectedItem.bookingReference
      });
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
      const fullAmount = parseFloat(selectedItem.totalCost);

      if (paymentMethod === 'gcash') {
        const formData = new FormData();
        formData.append('amount', fullAmount.toString());
        formData.append('paymentMethod', 'gcash');
        formData.append('paymentReference', paymentReference);
        formData.append('paymentType', 'full');
        if (paymentProof) {
          formData.append('paymentProof', paymentProof);
        }

        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/projects/${selectedItem._id}/full-payment`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        setSuccessMessage('Full Payment Submitted!');
        setSuccessDetails({
          title: 'Full Payment Submitted for Verification',
          message: 'Your full payment has been submitted and is now pending verification.',
          reference: selectedItem.projectReference
        });
        setShowSuccessModal(true);
        closeFullPaymentModal();
        fetchData();
      } else if (paymentMethod === 'cash') {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/projects/${selectedItem._id}/full-payment`,
          {
            amount: fullAmount,
            paymentMethod: 'cash',
            paymentType: 'full'
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        setSuccessMessage('Cash Payment Selected!');
        setSuccessDetails({
          title: 'Cash Payment Option',
          message: 'Please visit our office to complete your full payment.',
          reference: selectedItem.projectReference
        });
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
      'for_verification': <span className="status-badge-cuspro for-verification-cuspro">For Verification</span>,
      'processing': <span className="status-badge-cuspro processing-cuspro">Processing</span>,
      'quoted': <span className="status-badge-cuspro quoted-cuspro">Quoted</span>,
      'approved': <span className="status-badge-cuspro approved-cuspro">Approved</span>,
      'initial_paid': <span className="status-badge-cuspro initial-paid-cuspro">Initial Paid</span>,
      'in_progress': <span className="status-badge-cuspro in-progress-cuspro">In Progress</span>,
      'completed': <span className="status-badge-cuspro completed-cuspro">Completed</span>,
      'cancelled': <span className="status-badge-cuspro cancelled-cuspro">Cancelled</span>,
      'overdue': <span className="status-badge-cuspro overdue-cuspro">Overdue</span>
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

  // Filter payments based on selected filter and search term
  const getFilteredPayments = () => {
    let filtered = payments;
    
    // Apply status filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === paymentFilter);
    }
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(payment => 
        payment.id?.toLowerCase().includes(term) ||
        payment.bookingReference?.toLowerCase().includes(term) ||
        payment.description?.toLowerCase().includes(term) ||
        payment.projectName?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  };

  const SkeletonLoader = () => (
    <div className="cuspro-quotation-container">
      <div className="cuspro-header-card skeleton-card">
        <div className="cuspro-header-content">
          <div className="skeleton-line large"></div>
          <div className="skeleton-line medium"></div>
        </div>
      </div>

      <div className="cuspro-tabs skeleton-tabs">
        <div className="skeleton-tab"></div>
        <div className="skeleton-tab"></div>
      </div>

      <div className="cuspro-bills-section">
        <div className="cuspro-bill-card skeleton-card">
          <div className="skeleton-line medium"></div>
          <div className="skeleton-line small"></div>
          <div className="skeleton-line"></div>
          <div className="skeleton-button small"></div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <>
        <Helmet>
          <title>My Bills | Salfer Engineering</title>
        </Helmet>
        <SkeletonLoader />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Bills | Salfer Engineering</title>
      </Helmet>

      <div className="cuspro-quotation-container">
        {/* Header Card */}
        <div className="cuspro-header-card">
          <div className="cuspro-header-content">
            <h1>My Bills</h1>
            <p>Track and manage your payments</p>
          </div>
        </div>

        {/* Tab Navigation - 2 tabs only */}
        <div className="cuspro-tabs">
          <button
            className={`cuspro-tab ${activeTab === 'my-bills' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-bills')}
          >
            My Bills
          </button>
          <button
            className={`cuspro-tab ${activeTab === 'payment-history' ? 'active' : ''}`}
            onClick={() => setActiveTab('payment-history')}
          >
            Payment History
          </button>
        </div>

        {/* My Bills Tab */}
        {activeTab === 'my-bills' && (
          <div className="cuspro-bills-section">
            {/* Filter and Search */}
            <div className="cuspro-filter-search-section">
              <div className="cuspro-filter-group">
                <select 
                  value={paymentFilter} 
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="cuspro-filter-select"
                >
                  <option value="all">All Bills</option>
                  <option value="pending">Pending Payment</option>
                  <option value="paid">Paid</option>
                  <option value="for_verification">For Verification</option>
                </select>
              </div>
              <div className="cuspro-search-group">
                <input 
                  type="text" 
                  placeholder="Search by reference or description..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="cuspro-search-input"
                />
              </div>
            </div>

            {/* Bills List */}
            <div className="cuspro-bills-list">
              {getFilteredPayments().length === 0 ? (
                <div className="cuspro-empty-state">
                  <h3>No bills found</h3>
                  <p>Try adjusting your search or filter criteria.</p>
                </div>
              ) : (
                getFilteredPayments().map((bill, index) => (
                  <div key={index} className="cuspro-bill-card">
                    <div className="cuspro-bill-header">
                      <div className="cuspro-bill-info">
                        <h3>{bill.description}</h3>
                        <p className="cuspro-bill-ref">Ref: {bill.id || bill.bookingReference}</p>
                        {bill.projectName && <p className="cuspro-bill-project">{bill.projectName}</p>}
                      </div>
                      {getStatusBadge(bill.status)}
                    </div>
                    
                    <div className="cuspro-bill-details">
                      <div className="cuspro-bill-detail-item">
                        <span>Due Date:</span>
                        <strong>{bill.dueDate}</strong>
                      </div>
                      <div className="cuspro-bill-detail-item amount">
                        <span>Amount:</span>
                        <strong>{formatCurrency(bill.amount)}</strong>
                      </div>
                    </div>
                    
                    <div className="cuspro-bill-actions">
                      {bill.status === 'pending' && (
                        <button 
                          className="cuspro-pay-btn" 
                          onClick={() => handlePayNowClick(bill)}
                        >
                          Pay Now
                        </button>
                      )}
                      {bill.status === 'for_verification' && (
                        <span className="cuspro-verification-badge">
                          Payment Under Review
                        </span>
                      )}
                      {bill.status === 'paid' && (
                        <span className="cuspro-paid-badge">
                          Payment Completed
                        </span>
                      )}
                      <button 
                        className="cuspro-secondary-btn" 
                        onClick={() => handleViewDetails(bill, 'bill')}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Payment History Tab - Table View */}
        {activeTab === 'payment-history' && (
          <div className="cuspro-payments-section">
            <div className="cuspro-payments-header">
              <h3>Payment History</h3>
            </div>
            
            {/* Filter and Search for Payment History */}
            <div className="cuspro-filter-search-section">
              <div className="cuspro-filter-group">
                <select 
                  value={paymentFilter} 
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="cuspro-filter-select"
                >
                  <option value="all">All Payments</option>
                  <option value="paid">Completed</option>
                  <option value="for_verification">For Verification</option>
                </select>
              </div>
              <div className="cuspro-search-group">
                <input 
                  type="text" 
                  placeholder="Search by reference or description..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="cuspro-search-input"
                />
              </div>
            </div>

            {/* Payment History Table */}
            {getFilteredPayments().filter(p => p.status === 'paid' || p.status === 'for_verification').length === 0 ? (
              <div className="cuspro-empty-state">
                <h3>No payment history</h3>
                <p>Your completed payments will appear here.</p>
              </div>
            ) : (
              <div className="cuspro-payments-table-wrapper">
                <table className="cuspro-payments-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Invoice / Reference</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredPayments()
                      .filter(p => p.status === 'paid' || p.status === 'for_verification')
                      .map((payment, idx) => (
                        <tr key={idx}>
                          <td>{payment.date || payment.dueDate}</td>
                          <td className="cuspro-invoice-cell">{payment.id || payment.bookingReference}</td>
                          <td>{payment.description}</td>
                          <td className="cuspro-amount-cell">{formatCurrency(payment.amount)}</td>
                          <td>{getStatusBadge(payment.status)}</td>
                          <td>
                            <button 
                              className="cuspro-table-action-btn"
                              onClick={() => handleViewDetails(payment, 'payment')}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="cuspro-modal-overlay" onClick={closeSuccessModal}>
            <div className="cuspro-modal cuspro-success-modal" onClick={e => e.stopPropagation()}>
              <h3>{successMessage}</h3>
              <div className="cuspro-success-content">
                <p><strong>{successDetails?.title}</strong></p>
                <p>{successDetails?.message}</p>
                {successDetails?.reference && (
                  <p className="cuspro-success-ref">Reference: {successDetails.reference}</p>
                )}
              </div>
              <button className="cuspro-success-btn" onClick={closeSuccessModal}>
                Close
              </button>
            </div>
          </div>
        )}

        {/* Accept Quotation Modal */}
        {showAcceptModal && acceptingItem && (
          <div className="cuspro-modal-overlay" onClick={() => setShowAcceptModal(false)}>
            <div className="cuspro-modal cuspro-accept-modal" onClick={e => e.stopPropagation()}>
              <button className="cuspro-modal-close" onClick={() => setShowAcceptModal(false)}>×</button>
              <h3>Accept Quotation</h3>
              <p>Please select your payment preference</p>

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

              <div className="cuspro-payment-preference-section">
                <h4>Choose Payment Option</h4>

                <div
                  className={`cuspro-preference-option ${selectedPaymentPreference === 'installment' ? 'selected' : ''}`}
                  onClick={() => setSelectedPaymentPreference('installment')}
                >
                  <input type="radio" checked={selectedPaymentPreference === 'installment'} onChange={() => {}} />
                  <div className="cuspro-preference-content">
                    <strong>Installment Payment</strong>
                    <small>Pay in 3 installments (30% - 40% - 30%)</small>
                    <div className="cuspre-preference-details">
                      <span>Initial: {formatCurrency((acceptingItem.totalCost || acceptingItem.amount) * 0.3)}</span>
                      <span>Progress: {formatCurrency((acceptingItem.totalCost || acceptingItem.amount) * 0.4)}</span>
                      <span>Final: {formatCurrency((acceptingItem.totalCost || acceptingItem.amount) * 0.3)}</span>
                    </div>
                  </div>
                </div>

                <div
                  className={`cuspro-preference-option ${selectedPaymentPreference === 'full' ? 'selected' : ''}`}
                  onClick={() => setSelectedPaymentPreference('full')}
                >
                  <input type="radio" checked={selectedPaymentPreference === 'full'} onChange={() => {}} />
                  <div className="cuspro-preference-content">
                    <strong>Full Payment</strong>
                    <small>Pay the full amount upfront</small>
                    <div className="cuspre-preference-details full-payment-details">
                      <span className="full-amount">
                        Amount: {formatCurrency(acceptingItem.totalCost || acceptingItem.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="cuspro-modal-actions">
                <button className="cuspro-cancel-btn" onClick={() => setShowAcceptModal(false)}>Cancel</button>
                <button className="cuspro-confirm-btn" onClick={confirmAcceptQuotation} disabled={acceptingLoading}>
                  {acceptingLoading ? 'Processing...' : 'Confirm Selection'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Full Payment Modal for Projects */}
        {showFullPaymentModal && selectedItem && (
          <div className="cuspro-modal-overlay" onClick={closeFullPaymentModal}>
            <div className="cuspro-modal" onClick={e => e.stopPropagation()}>
              <button className="cuspro-modal-close" onClick={closeFullPaymentModal}>×</button>
              <h3>Make Full Payment</h3>

              <div className="cuspro-payment-summary">
                <p><strong>Project:</strong> {selectedItem.projectName}</p>
                <p><strong>Reference:</strong> {selectedItem.projectReference}</p>
                <div className="cuspro-payment-breakdown">
                  <p className="cuspro-total-amount">
                    <strong>Total Amount to Pay:</strong> {formatCurrency(selectedItem.totalCost)}
                  </p>
                </div>
              </div>

              <div className="cuspro-payment-methods">
                <h4>Select Payment Method</h4>
                <div className="cuspro-method-options">
                  <div className={`cuspro-method-option ${paymentMethod === 'paymongo_card' ? 'selected' : ''}`} onClick={() => setPaymentMethod('paymongo_card')}>
                    <input type="radio" checked={paymentMethod === 'paymongo_card'} onChange={() => {}} />
                    <div>
                      <strong>Credit/Debit Card</strong>
                      <small>Instant payment - No receipt needed</small>
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

              {/* PayMongo Card Section */}
              {paymentMethod === 'paymongo_card' && (
                <div className="cuspro-paymongo-section">
                  <div className="cuspro-card-form">
                    <div className="cuspro-form-group">
                      <label>Card Number</label>
                      <input type="text" id="full-card-number" placeholder="1234 5678 9012 3456" />
                    </div>
                    <div className="cuspro-form-row">
                      <div className="cuspro-form-group">
                        <label>Expiry</label>
                        <input type="text" id="full-card-expiry" placeholder="MM/YY" />
                      </div>
                      <div className="cuspro-form-group">
                        <label>CVC</label>
                        <input type="text" id="full-card-cvc" placeholder="123" />
                      </div>
                    </div>
                    <button
                      className="cuspro-paymongo-btn card-btn"
                      onClick={handleProjectPayMongoCardPayment}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Processing...' : `Pay ${formatCurrency(selectedItem.totalCost)}`}
                    </button>
                  </div>
                </div>
              )}

              {/* Cash Section */}
              {paymentMethod === 'cash' && (
                <div className="cuspro-cash-details">
                  <div className="cuspro-info-box">
                    <strong>Office Address</strong>
                    <p>Purok 2, Masaya, San Jose, Camarines Sur</p>
                    <p>Business Hours: Monday-Friday, 8:00 AM - 5:00 PM</p>
                  </div>
                  <button className="cuspro-confirm-btn" onClick={handleFullPaymentSubmit} disabled={isSubmitting}>
                    {isSubmitting ? 'Processing...' : 'Confirm Cash Payment'}
                  </button>
                </div>
              )}

              <div className="cuspro-modal-actions">
                <button className="cuspro-cancel-btn" onClick={closeFullPaymentModal}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal for Pre-assessment */}
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
                      <small>Pay via GCash - Upload receipt for verification</small>
                    </div>
                  </div>
                  <div className={`cuspro-method-option ${paymentMethod === 'paymongo_card' ? 'selected' : ''}`} onClick={() => setPaymentMethod('paymongo_card')}>
                    <input type="radio" checked={paymentMethod === 'paymongo_card'} onChange={() => {}} />
                    <div>
                      <strong>Credit/Debit Card</strong>
                      <small>Instant payment - No receipt needed</small>
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

              {/* Manual GCash Section */}
              {paymentMethod === 'gcash' && (
                <>
                  <div className="cuspro-gcash-details">
                    <h4>GCash Details</h4>
                    <p>Number: <strong>0917XXXXXXX</strong></p>
                    <p>Name: <strong>SALFER ENGINEERING CORP</strong></p>
                    <p>Amount: <strong>{formatCurrency(selectedItem.amount)}</strong></p>
                  </div>
                  <div className="cuspro-form-group">
                    <label>Reference Number</label>
                    <input type="text" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="Enter GCash reference number" />
                  </div>
                  <div className="cuspro-form-group">
                    <label>Upload Payment Screenshot</label>
                    <input type="file" accept="image/*" onChange={(e) => setPaymentProof(e.target.files[0])} />
                    {paymentProof && <small>Selected: {paymentProof.name}</small>}
                  </div>
                  <button className="cuspro-confirm-btn" onClick={handlePaymentSubmit} disabled={isSubmitting}>
                    {isSubmitting ? 'Processing...' : 'Submit Payment'}
                  </button>
                </>
              )}

              {/* PayMongo Card Payment Section */}
              {paymentMethod === 'paymongo_card' && (
                <div className="cuspro-paymongo-section">
                  <div className="cuspro-card-form">
                    <div className="cuspro-form-group">
                      <label>Card Number</label>
                      <input type="text" id="card-number" placeholder="1234 5678 9012 3456" />
                    </div>
                    <div className="cuspro-form-row">
                      <div className="cuspro-form-group">
                        <label>Expiry Date</label>
                        <input type="text" id="card-expiry" placeholder="MM/YY" />
                      </div>
                      <div className="cuspro-form-group">
                        <label>CVC</label>
                        <input type="text" id="card-cvc" placeholder="123" />
                      </div>
                    </div>
                    <button
                      className="cuspro-paymongo-btn card-btn"
                      onClick={handlePayMongoCardPayment}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Processing...' : `Pay ${formatCurrency(selectedItem.amount)}`}
                    </button>
                  </div>
                </div>
              )}

              {/* Cash Payment Section */}
              {paymentMethod === 'cash' && (
                <div className="cuspro-cash-details">
                  <div className="cuspro-info-box">
                    <strong>Office Address</strong>
                    <p>Purok 2, Masaya, San Jose, Camarines Sur</p>
                    <p>Business Hours: Monday-Friday, 8:00 AM - 5:00 PM</p>
                  </div>
                  <button
                    className="cuspro-confirm-btn"
                    onClick={handleCashPaymentSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Processing...' : 'Confirm Cash Payment'}
                  </button>
                </div>
              )}

              <div className="cuspro-modal-actions">
                <button className="cuspro-cancel-btn" onClick={closeModal}>Cancel</button>
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
                      <h4>Bill Information</h4>
                      <p><strong>Description:</strong> {detailsItem.description}</p>
                      <p><strong>Reference:</strong> {detailsItem.id || detailsItem.bookingReference}</p>
                      <p><strong>Due Date:</strong> {detailsItem.dueDate}</p>
                      <p><strong>Status:</strong> {detailsItem.status}</p>
                    </div>
                    <div className="cuspro-details-section">
                      <h4>Amount Details</h4>
                      <p><strong>Amount Due:</strong> {formatCurrency(detailsItem.amount)}</p>
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

        <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      </div>
    </>
  );
};

export default Quotation;