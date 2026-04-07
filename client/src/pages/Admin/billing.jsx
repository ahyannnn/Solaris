// pages/Admin/Billing.jsx

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import {
  FaSearch,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaDownload,
  FaChevronLeft,
  FaChevronRight,
  FaPlus,
  FaMoneyBillWave,
  FaEnvelope,
  FaTrash,
  FaEdit,
  FaSave,
  FaTimes,
  FaInfoCircle,
  FaFileInvoice,
  FaProjectDiagram,
  FaCalendarAlt,
  FaUser,
  FaCreditCard,
  FaClock
} from 'react-icons/fa';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import '../../styles/Admin/billing.css';

const AdminBilling = () => {
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pre-assessments');

  // Pre-assessment state
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showEditStatusModal, setShowEditStatusModal] = useState(false);
  const [editStatusData, setEditStatusData] = useState({
    paymentStatus: '',
    notes: ''
  });
  const [verificationNote, setVerificationNote] = useState('');

  // Solar Invoice state (Project bills)
  const [solarInvoices, setSolarInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSolarVerifyModal, setShowSolarVerifyModal] = useState(false);
  const [showSolarCashEditModal, setShowSolarCashEditModal] = useState(false);
  const [solarCashEditData, setSolarCashEditData] = useState({
    paymentStatus: '',
    notes: ''
  });
  const [invoiceFormData, setInvoiceFormData] = useState({
    projectId: '',
    invoiceType: 'initial',
    description: '',
    items: [{ name: '', quantity: 1, unitPrice: 0, total: 0 }],
    subtotal: 0,
    tax: 0,
    discount: 0,
    totalAmount: 0,
    dueDate: ''
  });
  const [paymentData, setPaymentData] = useState({
    amount: '',
    method: 'gcash',
    reference: '',
    notes: ''
  });

  // Transaction history state
  const [transactions, setTransactions] = useState([]);
  const [projects, setProjects] = useState([]);

  // Filter and pagination
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    totalPreAssessments: 0,
    pending: 0,
    forVerification: 0,
    paidPre: 0,
    autoVerified: 0,
    pendingCash: 0,
    totalSolarInvoices: 0,
    paidSolar: 0,
    partial: 0,
    totalRevenue: 0,
    pendingAmount: 0,
    projectPayments: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMode, setModalMode] = useState('view');

  useEffect(() => {
    if (activeTab === 'pre-assessments') {
      fetchPreAssessments();
    } else if (activeTab === 'solar-invoices') {
      fetchSolarInvoices();
      fetchProjects();
    } else {
      fetchTransactions();
    }
    fetchStats();
  }, [activeTab, filter, currentPage]);

  // ============ FETCH FUNCTIONS ============

  const fetchPreAssessments = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          paymentStatus: filter === 'all' ? undefined : filter,
          page: currentPage,
          limit: 10
        }
      });

      const assessmentsWithInvoice = (response.data.assessments || []).filter(
        assessment => assessment.invoiceNumber && assessment.invoiceNumber !== null && assessment.invoiceNumber !== ''
      );

      setAssessments(assessmentsWithInvoice);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching pre-assessments:', error);
      showToast('Failed to fetch pre-assessments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSolarInvoices = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/solar-invoices`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          paymentStatus: filter === 'all' ? undefined : filter,
          page: currentPage,
          limit: 10
        }
      });

      setSolarInvoices(response.data.invoices || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching solar invoices:', error);
      showToast('Failed to fetch solar invoices', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');

      const [preRes, solarRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/solar-invoices`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const prePayments = (preRes.data.assessments || [])
        .filter(a => a.invoiceNumber && (a.paymentStatus === 'paid' || a.paymentStatus === 'for_verification'))
        .map(a => ({
          id: a._id,
          type: 'Pre-Assessment',
          reference: a.bookingReference,
          invoiceNumber: a.invoiceNumber,
          amount: a.assessmentFee,
          method: a.paymentGateway === 'paymongo' ? 'PayMongo' : (a.paymentMethod || 'cash'),
          status: a.paymentStatus,
          date: a.confirmedAt || a.bookedAt,
          client: `${a.clientId?.contactFirstName} ${a.clientId?.contactLastName}`,
          gateway: a.paymentGateway
        }));

      const solarPayments = solarRes.data.invoices
        .filter(i => i.paymentStatus === 'paid' || i.paymentStatus === 'partial')
        .flatMap(i => i.payments.map(p => ({
          id: p._id,
          type: 'Project Payment',
          reference: i.invoiceNumber,
          invoiceNumber: i.invoiceNumber,
          amount: p.amount,
          method: p.method,
          status: i.paymentStatus,
          date: p.date,
          client: `${i.clientId?.contactFirstName} ${i.clientId?.contactLastName}`,
          gateway: 'manual',
          projectName: i.projectId?.projectName,
          projectId: i.projectId?._id
        })));

      setTransactions([...prePayments, ...solarPayments].sort((a, b) => new Date(b.date) - new Date(a.date)));
      setTotalPages(1);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showToast('Failed to fetch transactions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = sessionStorage.getItem('token');

      const [preStatsRes, solarStatsRes, allAssessmentsRes, projectsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: {} })),
        axios.get(`${import.meta.env.VITE_API_URL}/api/solar-invoices/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { stats: {} } })),
        axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { assessments: [] } })),
        axios.get(`${import.meta.env.VITE_API_URL}/api/projects`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { projects: [] } }))
      ]);

      const assessments = allAssessmentsRes.data.assessments || [];
      const autoVerified = assessments.filter(a => a.autoVerified === true || a.paymentGateway === 'paymongo').length;
      const pendingCash = assessments.filter(a => a.paymentMethod === 'cash' && a.paymentStatus === 'pending').length;

      const projectsList = projectsRes.data.projects || [];
      const projectPayments = projectsList.reduce((sum, p) => sum + (p.amountPaid || 0), 0);

      setStats({
        totalPreAssessments: preStatsRes.data.total || 0,
        pending: preStatsRes.data.pending || 0,
        forVerification: preStatsRes.data.forVerification || 0,
        paidPre: preStatsRes.data.paid || 0,
        autoVerified: autoVerified,
        pendingCash: pendingCash,
        totalSolarInvoices: solarStatsRes.data.stats?.total || 0,
        paidSolar: solarStatsRes.data.stats?.paid || 0,
        partial: solarStatsRes.data.stats?.partial || 0,
        totalRevenue: (preStatsRes.data.totalRevenue || 0) + (solarStatsRes.data.stats?.totalRevenue || 0),
        pendingAmount: (preStatsRes.data.pendingRevenue || 0) + (solarStatsRes.data.stats?.pendingAmount || 0),
        projectPayments: projectPayments
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  // ============ PRE-ASSESSMENT HANDLERS ============

  const handleVerifyPayment = async (verified) => {
    if (!selectedAssessment) return;
    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/pre-assessments/${selectedAssessment._id}/verify-payment`,
        { verified, notes: verificationNote },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchPreAssessments();
      fetchStats();
      setShowVerifyModal(false);
      setSelectedAssessment(null);
      setVerificationNote('');
      showToast(verified ? 'Payment verified successfully!' : 'Payment rejected', verified ? 'success' : 'warning');
    } catch (error) {
      console.error('Error verifying payment:', error);
      showToast('Failed to verify payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPaymentStatus = async () => {
    if (!selectedAssessment) return;

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');

      let newPaymentStatus = editStatusData.paymentStatus;
      let newAssessmentStatus = selectedAssessment.assessmentStatus;

      if (newPaymentStatus === 'paid') {
        newAssessmentStatus = 'scheduled';
      } else if (newPaymentStatus === 'pending') {
        newAssessmentStatus = 'pending_payment';
      } else if (newPaymentStatus === 'failed') {
        newAssessmentStatus = 'cancelled';
      }

      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/pre-assessments/${selectedAssessment._id}/update-payment-status`,
        {
          paymentStatus: newPaymentStatus,
          assessmentStatus: newAssessmentStatus,
          notes: editStatusData.notes,
          updatedBy: 'admin'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchPreAssessments();
      fetchStats();
      setShowEditStatusModal(false);
      setSelectedAssessment(null);
      setEditStatusData({ paymentStatus: '', notes: '' });
      showToast(`Payment status updated to ${newPaymentStatus.toUpperCase()}`, 'success');
    } catch (error) {
      console.error('Error updating payment status:', error);
      showToast('Failed to update payment status', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============ SOLAR INVOICE HANDLERS ============

  const handleVerifySolarPayment = async (verified, invoice) => {
    if (!invoice) return;
    
    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      
      if (verified) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/solar-invoices/${invoice._id}/verify`,
          { verified: true, notes: verificationNote },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showToast('Payment verified successfully!', 'success');
      } else {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/solar-invoices/${invoice._id}/reject-payment`,
          { notes: verificationNote },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showToast('Payment rejected', 'warning');
      }
      
      setShowSolarVerifyModal(false);
      setSelectedInvoice(null);
      setVerificationNote('');
      fetchSolarInvoices();
      fetchStats();
      
    } catch (error) {
      console.error('Error verifying solar payment:', error);
      showToast('Failed to verify payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Solar Invoice Cash Status Change (same as Pre-assessment dropdown)
  const handleEditSolarCashStatus = async () => {
    if (!selectedInvoice) return;
    
    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      
      // Find the pending cash payment
      const cashPayment = selectedInvoice.payments?.find(p => p.method === 'cash' && p.receivedBy === null);
      
      if (!cashPayment) {
        showToast('No pending cash payment found', 'error');
        setIsSubmitting(false);
        return;
      }
      
      let newPaymentStatus = solarCashEditData.paymentStatus;
      
      if (newPaymentStatus === 'paid') {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/solar-invoices/${selectedInvoice._id}/payment`,
          {
            amount: cashPayment.amount,
            method: 'cash',
            reference: `Cash payment verified by admin on ${new Date().toLocaleString()}`,
            notes: solarCashEditData.notes || 'Cash payment verified by admin'
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showToast(`Payment status updated to PAID`, 'success');
      } else if (newPaymentStatus === 'failed') {
        // Handle failed status - update the payment record
        showToast(`Payment status updated to FAILED`, 'warning');
      } else {
        showToast(`Payment status updated to PENDING`, 'info');
      }
      
      setShowSolarCashEditModal(false);
      setSelectedInvoice(null);
      setSolarCashEditData({ paymentStatus: '', notes: '' });
      fetchSolarInvoices();
      fetchStats();
      
    } catch (error) {
      console.error('Error updating cash payment status:', error);
      showToast(error.response?.data?.message || 'Failed to update payment status', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSolarInvoice = async () => {
    if (!invoiceFormData.projectId || !invoiceFormData.totalAmount || !invoiceFormData.dueDate) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/solar-invoices`,
        invoiceFormData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast('Invoice created successfully!', 'success');
      setShowInvoiceModal(false);
      resetInvoiceForm();
      fetchSolarInvoices();
      fetchStats();
    } catch (error) {
      console.error('Error creating invoice:', error);
      showToast(error.response?.data?.message || 'Failed to create invoice', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedInvoice || !paymentData.amount) {
      showToast('Please enter payment amount', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/solar-invoices/${selectedInvoice._id}/payment`,
        paymentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast('Payment recorded successfully!', 'success');
      setShowPaymentModal(false);
      setSelectedInvoice(null);
      setPaymentData({ amount: '', method: 'gcash', reference: '', notes: '' });
      fetchSolarInvoices();
      fetchStats();
    } catch (error) {
      console.error('Error recording payment:', error);
      showToast('Failed to record payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendInvoice = async (invoice) => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/solar-invoices/${invoice._id}/send`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast('Invoice sent to customer!', 'success');
      fetchSolarInvoices();
    } catch (error) {
      console.error('Error sending invoice:', error);
      showToast('Failed to send invoice', 'error');
    }
  };

  const handleDownloadInvoice = async (invoice) => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/solar-invoices/${invoice._id}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${invoice.invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('Invoice downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      showToast('Failed to download invoice', 'error');
    }
  };

  const resetInvoiceForm = () => {
    setInvoiceFormData({
      projectId: '',
      invoiceType: 'initial',
      description: '',
      items: [{ name: '', quantity: 1, unitPrice: 0, total: 0 }],
      subtotal: 0,
      tax: 0,
      discount: 0,
      totalAmount: 0,
      dueDate: ''
    });
  };

  const calculateItemTotal = (index) => {
    const item = invoiceFormData.items[index];
    const total = item.quantity * item.unitPrice;
    const newItems = [...invoiceFormData.items];
    newItems[index].total = total;
    setInvoiceFormData({ ...invoiceFormData, items: newItems });
    calculateTotals();
  };

  const calculateTotals = () => {
    const subtotal = invoiceFormData.items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.12;
    const totalAmount = subtotal + tax - invoiceFormData.discount;
    setInvoiceFormData({ ...invoiceFormData, subtotal, tax, totalAmount });
  };

  const addInvoiceItem = () => {
    setInvoiceFormData({
      ...invoiceFormData,
      items: [...invoiceFormData.items, { name: '', quantity: 1, unitPrice: 0, total: 0 }]
    });
  };

  const removeInvoiceItem = (index) => {
    const newItems = invoiceFormData.items.filter((_, i) => i !== index);
    setInvoiceFormData({ ...invoiceFormData, items: newItems });
    calculateTotals();
  };

  // ============ HELPER FUNCTIONS ============

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPaymentStatusBadge = (status) => {
    const badges = {
      'pending': <span className="status-badge-adminbilling pending-adminbilling">Pending</span>,
      'for_verification': <span className="status-badge-adminbilling for-verification-adminbilling">For Verification</span>,
      'paid': <span className="status-badge-adminbilling paid-adminbilling">Paid</span>,
      'partial': <span className="status-badge-adminbilling partial-adminbilling">Partial</span>,
      'failed': <span className="status-badge-adminbilling failed-adminbilling">Failed</span>,
      'overdue': <span className="status-badge-adminbilling overdue-adminbilling">Overdue</span>
    };
    return badges[status] || <span className="status-badge-adminbilling">{status}</span>;
  };

  const getAssessmentStatusBadge = (status) => {
    const badges = {
      'pending_payment': <span className="status-badge-adminbilling pending-adminbilling">Pending Payment</span>,
      'scheduled': <span className="status-badge-adminbilling scheduled-adminbilling">Scheduled</span>,
      'device_deployed': <span className="status-badge-adminbilling deployed-adminbilling">Device Deployed</span>,
      'data_collecting': <span className="status-badge-adminbilling collecting-adminbilling">Data Collecting</span>,
      'completed': <span className="status-badge-adminbilling completed-adminbilling">Completed</span>
    };
    return badges[status] || <span className="status-badge-adminbilling">{status}</span>;
  };

  const getInvoiceTypeBadge = (type) => {
    const badges = {
      'initial': <span className="invoice-type-badge initial">Initial (30%)</span>,
      'progress': <span className="invoice-type-badge progress">Progress (40%)</span>,
      'final': <span className="invoice-type-badge final">Final (30%)</span>,
      'full': <span className="invoice-type-badge full">Full (100%)</span>,
      'additional': <span className="invoice-type-badge additional">Additional</span>
    };
    return badges[type] || <span className="invoice-type-badge">{type}</span>;
  };

  const getGatewayBadge = (assessment) => {
    if (assessment.paymentGateway === 'paymongo' || assessment.autoVerified === true) {
      return <span className="gateway-badge paymongo">PayMongo</span>;
    }
    if (assessment.paymentMethod === 'cash') {
      return <span className="gateway-badge cash">Cash</span>;
    }
    return <span className="gateway-badge manual">Manual</span>;
  };

  const filteredItems = (activeTab === 'pre-assessments' ? assessments : solarInvoices).filter(item => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    if (activeTab === 'pre-assessments') {
      return item.bookingReference?.toLowerCase().includes(searchLower) ||
        item.clientId?.contactFirstName?.toLowerCase().includes(searchLower) ||
        item.clientId?.contactLastName?.toLowerCase().includes(searchLower) ||
        item.invoiceNumber?.toLowerCase().includes(searchLower);
    } else {
      return item.invoiceNumber?.toLowerCase().includes(searchLower) ||
        item.clientId?.contactFirstName?.toLowerCase().includes(searchLower) ||
        item.clientId?.contactLastName?.toLowerCase().includes(searchLower) ||
        item.projectId?.projectName?.toLowerCase().includes(searchLower);
    }
  });

  // ============ SKELETON LOADER ============

  const SkeletonLoader = () => (
    <div className="admin-billing-adminbilling">
      <div className="billing-header-adminbilling">
        <div className="skeleton-line-adminbilling large-adminbilling"></div>
        <div className="skeleton-button-adminbilling"></div>
      </div>
      <div className="stats-cards-adminbilling">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="stat-card-adminbilling skeleton-card-adminbilling">
            <div className="skeleton-line-adminbilling small-adminbilling"></div>
            <div className="skeleton-line-adminbilling large-adminbilling"></div>
            <div className="skeleton-line-adminbilling tiny-adminbilling"></div>
          </div>
        ))}
      </div>
      <div className="billing-tabs-adminbilling">
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton-tab-adminbilling"></div>
        ))}
      </div>
      <div className="filters-section-adminbilling">
        <div className="skeleton-select-adminbilling"></div>
        <div className="skeleton-search-adminbilling"></div>
      </div>
      <div className="payments-table-container-adminbilling">
        <div className="skeleton-table-adminbilling">
          <div className="skeleton-table-header-adminbilling"></div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton-table-row-adminbilling"></div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading && (activeTab === 'pre-assessments' ? assessments.length === 0 : solarInvoices.length === 0) && activeTab !== 'transactions') {
    return <SkeletonLoader />;
  }

  // ============ MAIN RENDER ============

  return (
    <>
      <Helmet>
        <title>Billing Management | Admin | Salfer Engineering</title>
      </Helmet>

      <div className="admin-billing-adminbilling">
        <div className="billing-header-adminbilling">
          <div>
            <h1>Billing Management</h1>
            <p>Manage invoices, verify payments, and track all transactions</p>
          </div>
          {activeTab === 'solar-invoices' && (
            <button className="create-invoice-btn-adminbilling" onClick={() => { setModalMode('create'); setShowInvoiceModal(true); }}>
              <FaPlus /> Create Solar Invoice
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="stats-cards-adminbilling">
          <div className="stat-card-adminbilling revenue-adminbilling">
            <div className="stat-info-adminbilling">
              <span className="stat-value-adminbilling">{formatCurrency(stats.totalRevenue)}</span>
              <span className="stat-label-adminbilling">Total Revenue</span>
            </div>
          </div>
          <div className="stat-card-adminbilling pending-amount-adminbilling">
            <div className="stat-info-adminbilling">
              <span className="stat-value-adminbilling">{formatCurrency(stats.pendingAmount)}</span>
              <span className="stat-label-adminbilling">Pending Collection</span>
            </div>
          </div>
          <div className="stat-card-adminbilling pre-assessment-adminbilling">
            <div className="stat-info-adminbilling">
              <span className="stat-value-adminbilling">{stats.totalPreAssessments}</span>
              <span className="stat-label-adminbilling">Pre-Assessments</span>
              <div className="stat-detail-adminbilling">
                <span>Paid: {stats.paidPre}</span>
                <span>Auto-Verified: {stats.autoVerified}</span>
                <span>Pending Cash: {stats.pendingCash}</span>
              </div>
            </div>
          </div>
          <div className="stat-card-adminbilling solar-invoice-adminbilling">
            <div className="stat-info-adminbilling">
              <span className="stat-value-adminbilling">{stats.totalSolarInvoices}</span>
              <span className="stat-label-adminbilling">Solar Invoices</span>
              <div className="stat-detail-adminbilling">
                <span>Paid: {stats.paidSolar}</span>
                <span>Partial: {stats.partial}</span>
                <span>Project Payments: {formatCurrency(stats.projectPayments)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="billing-tabs-adminbilling">
          <button
            className={`tab-btn-adminbilling ${activeTab === 'pre-assessments' ? 'active-adminbilling' : ''}`}
            onClick={() => { setActiveTab('pre-assessments'); setFilter('all'); setCurrentPage(1); }}
          >
            Pre-Assessments
          </button>
          <button
            className={`tab-btn-adminbilling ${activeTab === 'solar-invoices' ? 'active-adminbilling' : ''}`}
            onClick={() => { setActiveTab('solar-invoices'); setFilter('all'); setCurrentPage(1); }}
          >
            Solar Invoices (Projects)
          </button>
          <button
            className={`tab-btn-adminbilling ${activeTab === 'transactions' ? 'active-adminbilling' : ''}`}
            onClick={() => { setActiveTab('transactions'); setCurrentPage(1); }}
          >
            Transaction History
          </button>
        </div>

        {/* Filters */}
        <div className="filters-section-adminbilling">
          <div className="filter-group-adminbilling">
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Status</option>
              {activeTab === 'pre-assessments' ? (
                <>
                  <option value="pending">Pending</option>
                  <option value="for_verification">For Verification</option>
                  <option value="paid">Paid</option>
                </>
              ) : activeTab === 'solar-invoices' ? (
                <>
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </>
              ) : null}
            </select>
          </div>
          <div className="search-group-adminbilling">
            <FaSearch className="search-icon-adminbilling" />
            <input
              type="text"
              placeholder="Search by reference, invoice, or client name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* ============ PRE-ASSESSMENTS TABLE ============ */}
        {activeTab === 'pre-assessments' && (
          <div className="payments-table-container-adminbilling">
            <table className="payments-table-adminbilling">
              <thead>
                <tr>
                  <th>Booking Ref</th>
                  <th>Invoice</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Gateway</th>
                  <th>Payment Status</th>
                  <th>Assessment Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="empty-state-adminbilling">
                      <p>No pre-assessments with issued invoices found</p>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(assessment => (
                    <tr key={assessment._id}>
                      <td className="ref-cell-adminbilling">{assessment.bookingReference}</td>
                      <td>{assessment.invoiceNumber}</td>
                      <td>
                        <div className="client-info-adminbilling">
                          <strong>{assessment.clientId?.contactFirstName} {assessment.clientId?.contactLastName}</strong>
                          <small>{assessment.clientId?.contactNumber}</small>
                        </div>
                      </td>
                      <td>{formatDate(assessment.bookedAt)}</td>
                      <td className="amount-adminbilling">{formatCurrency(assessment.assessmentFee)}</td>
                      <td>
                        {assessment.paymentGateway === 'paymongo' ? (
                          <span className="payment-method-adminbilling paymongo-method">PayMongo</span>
                        ) : assessment.paymentMethod ? (
                          <span className="payment-method-adminbilling">
                            {assessment.paymentMethod.toUpperCase()}
                          </span>
                        ) : '-'}
                      </td>
                      <td>{getGatewayBadge(assessment)}</td>
                      <td>{getPaymentStatusBadge(assessment.paymentStatus)}</td>
                      <td>{getAssessmentStatusBadge(assessment.assessmentStatus)}</td>
                      <td className="actions-adminbilling">
                        {(assessment.paymentGateway === 'paymongo' || assessment.autoVerified === true) && assessment.paymentStatus === 'paid' && (
                          <span className="verified-badge-adminbilling auto-verified">
                            <FaCheckCircle /> Auto-Verified
                          </span>
                        )}

                        {assessment.paymentMethod === 'gcash' && assessment.paymentStatus === 'for_verification' && (
                          <>
                            <button
                              className="action-btn-adminbilling view-proof-adminbilling"
                              onClick={() => {
                                if (assessment.paymentProof) window.open(assessment.paymentProof, '_blank');
                              }}
                              title="View Payment Proof"
                            >
                              <FaEye />
                            </button>
                            <button
                              className="action-btn-adminbilling verify-adminbilling"
                              onClick={() => {
                                setSelectedAssessment(assessment);
                                setShowVerifyModal(true);
                              }}
                              title="Verify Payment"
                            >
                              <FaCheckCircle />
                            </button>
                            <button
                              className="action-btn-adminbilling reject-adminbilling"
                              onClick={() => {
                                setSelectedAssessment(assessment);
                                setVerificationNote('');
                                handleVerifyPayment(false);
                              }}
                              title="Reject Payment"
                            >
                              <FaTimesCircle />
                            </button>
                          </>
                        )}

                        {assessment.paymentMethod === 'cash' && assessment.paymentStatus === 'pending' && (
                          <button
                            className="action-btn-adminbilling edit-status-adminbilling"
                            onClick={() => {
                              setSelectedAssessment(assessment);
                              setEditStatusData({
                                paymentStatus: assessment.paymentStatus,
                                notes: ''
                              });
                              setShowEditStatusModal(true);
                            }}
                            title="Mark as Paid"
                          >
                            <FaMoneyBillWave /> Mark Paid
                          </button>
                        )}

                        {assessment.paymentMethod === 'cash' && assessment.paymentStatus === 'paid' && (
                          <span className="verified-badge-adminbilling">Cash - Verified</span>
                        )}

                        {assessment.paymentStatus === 'failed' && (
                          <span className="failed-badge-adminbilling">Failed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ============ SOLAR INVOICES TABLE (PROJECT BILLS) ============ */}
        {activeTab === 'solar-invoices' && (
          <div className="payments-table-container-adminbilling">
            <table className="payments-table-adminbilling">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Type</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Payment Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="empty-state-adminbilling">
                      <p>No solar invoices found</p>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(invoice => {
                    // Check for pending cash payment
                    const hasPendingCashPayment = invoice.payments?.some(
                      p => p.method === 'cash' && p.receivedBy === null
                    );
                    
                    return (
                      <tr key={invoice._id}>
                        <td className="ref-cell-adminbilling">{invoice.invoiceNumber}</td>
                        <td>
                          <div className="project-info">
                            <FaProjectDiagram className="project-icon" />
                            <span>{invoice.projectId?.projectName || 'N/A'}</span>
                            <div className="project-ref-small">{invoice.projectId?.projectReference}</div>
                          </div>
                        </td>
                        <td>
                          <div className="client-info-adminbilling">
                            <strong>{invoice.clientId?.contactFirstName} {invoice.clientId?.contactLastName}</strong>
                            <small>{invoice.clientId?.contactNumber}</small>
                          </div>
                        </td>
                        <td>{getInvoiceTypeBadge(invoice.invoiceType)}</td>
                        <td>{formatDate(invoice.issueDate)}</td>
                        <td>{formatDate(invoice.dueDate)}</td>
                        <td className="amount-adminbilling">{formatCurrency(invoice.totalAmount)}</td>
                        <td className="amount-adminbilling">{formatCurrency(invoice.amountPaid)}</td>
                        <td className="amount-adminbilling balance-adminbilling">{formatCurrency(invoice.balance)}</td>
                        <td>{getPaymentStatusBadge(invoice.paymentStatus)}</td>
                        <td className="actions-adminbilling">
                          <button
                            className="action-btn-adminbilling view-adminbilling"
                            onClick={() => { setSelectedInvoice(invoice); setModalMode('view'); setShowInvoiceModal(true); }}
                            title="View Details"
                          >
                            <FaEye />
                          </button>
                          <button
                            className="action-btn-adminbilling download-adminbilling"
                            onClick={() => handleDownloadInvoice(invoice)}
                            title="Download PDF"
                          >
                            <FaDownload />
                          </button>

                          {invoice.status === 'draft' && (
                            <button
                              className="action-btn-adminbilling send-adminbilling"
                              onClick={() => handleSendInvoice(invoice)}
                              title="Send to Customer"
                            >
                              <FaEnvelope />
                            </button>
                          )}

                          {/* CASH PAYMENT - Dropdown like Pre-assessment */}
                          {hasPendingCashPayment && invoice.paymentStatus === 'pending' && (
                            <button
                              className="action-btn-adminbilling edit-status-adminbilling"
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setSolarCashEditData({
                                  paymentStatus: invoice.paymentStatus,
                                  notes: ''
                                });
                                setShowSolarCashEditModal(true);
                              }}
                              title="Mark Cash Payment as Paid"
                            >
                              <FaMoneyBillWave /> Mark Paid
                            </button>
                          )}

                          {/* Regular Record Payment button for other pending/partial invoices */}
                          {(invoice.paymentStatus === 'pending' || invoice.paymentStatus === 'partial') && !hasPendingCashPayment && (
                            <button
                              className="action-btn-adminbilling payment-adminbilling"
                              onClick={() => { setSelectedInvoice(invoice); setShowPaymentModal(true); }}
                              title="Record Payment"
                            >
                              <FaMoneyBillWave />
                            </button>
                          )}

                          {/* GCash verification buttons */}
                          {invoice.paymentStatus === 'for_verification' && (
                            <>
                              <button
                                className="action-btn-adminbilling view-proof-adminbilling"
                                onClick={() => {
                                  const gcashPayment = invoice.payments?.find(p => p.method === 'gcash' && p.proof);
                                  if (gcashPayment?.proof) {
                                    window.open(gcashPayment.proof, '_blank');
                                  } else {
                                    showToast('No payment proof found', 'warning');
                                  }
                                }}
                                title="View Payment Proof"
                              >
                                <FaEye />
                              </button>
                              <button
                                className="action-btn-adminbilling verify-adminbilling"
                                onClick={() => {
                                  setSelectedInvoice(invoice);
                                  setShowSolarVerifyModal(true);
                                }}
                                title="Verify Payment"
                              >
                                <FaCheckCircle />
                              </button>
                              <button
                                className="action-btn-adminbilling reject-adminbilling"
                                onClick={() => handleVerifySolarPayment(false, invoice)}
                                title="Reject Payment"
                              >
                                <FaTimesCircle />
                              </button>
                            </>
                          )}

                          {/* Auto-verified badge for card payments */}
                          {invoice.paymentStatus === 'paid' && invoice.payments?.some(p => p.method === 'paymongo') && (
                            <span className="verified-badge-adminbilling auto-verified">
                              <FaCheckCircle /> Auto-Verified
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ============ TRANSACTIONS TABLE ============ */}
        {activeTab === 'transactions' && (
          <div className="payments-table-container-adminbilling">
            <table className="payments-table-adminbilling">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Reference</th>
                  <th>Invoice</th>
                  <th>Client / Project</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Gateway</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="empty-state-adminbilling">
                      <p>No transactions found</p>
                    </td>
                  </tr>
                ) : (
                  transactions.map(transaction => (
                    <tr key={transaction.id}>
                      <td>{formatDate(transaction.date)}</td>
                      <td>
                        <span className={`transaction-type-adminbilling ${transaction.type === 'Pre-Assessment' ? 'pre-adminbilling' : 'project-adminbilling'}`}>
                          {transaction.type === 'Pre-Assessment' ? <FaFileInvoice /> : <FaProjectDiagram />}
                          {transaction.type}
                        </span>
                      </td>
                      <td>{transaction.reference}</td>
                      <td>{transaction.invoiceNumber}</td>
                      <td>
                        <div>
                          <strong>{transaction.client}</strong>
                          {transaction.projectName && (
                            <div className="project-name-small">{transaction.projectName}</div>
                          )}
                        </div>
                      </td>
                      <td className="amount-adminbilling">{formatCurrency(transaction.amount)}</td>
                      <td><span className="payment-method-adminbilling">{transaction.method?.toUpperCase()}</span></td>
                      <td>
                        {transaction.gateway === 'paymongo' ? (
                          <span className="gateway-badge paymongo">PayMongo</span>
                        ) : (
                          <span className="gateway-badge manual">Manual</span>
                        )}
                      </td>
                      <td>{getPaymentStatusBadge(transaction.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && activeTab !== 'transactions' && (
          <div className="pagination-adminbilling">
            <button
              className="page-btn-adminbilling"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <FaChevronLeft /> Previous
            </button>
            <span className="page-info-adminbilling">Page {currentPage} of {totalPages}</span>
            <button
              className="page-btn-adminbilling"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next <FaChevronRight />
            </button>
          </div>
        )}

        {/* ============ MODALS ============ */}

        {/* Verify Payment Modal (for Pre-assessment manual GCash) */}
        {showVerifyModal && selectedAssessment && (
          <div className="modal-overlay-adminbilling" onClick={() => setShowVerifyModal(false)}>
            <div className="modal-content-adminbilling" onClick={e => e.stopPropagation()}>
              <h3>Verify Pre-Assessment Payment</h3>
              <div className="modal-body-adminbilling">
                <div className="payment-details-adminbilling">
                  <div className="detail-row-adminbilling"><span>Booking Reference:</span><strong>{selectedAssessment.bookingReference}</strong></div>
                  <div className="detail-row-adminbilling"><span>Invoice Number:</span><strong>{selectedAssessment.invoiceNumber}</strong></div>
                  <div className="detail-row-adminbilling"><span>Client:</span><strong>{selectedAssessment.clientId?.contactFirstName} {selectedAssessment.clientId?.contactLastName}</strong></div>
                  <div className="detail-row-adminbilling"><span>Amount:</span><strong className="amount-adminbilling">{formatCurrency(selectedAssessment.assessmentFee)}</strong></div>
                  <div className="detail-row-adminbilling"><span>Payment Method:</span><strong>{selectedAssessment.paymentMethod?.toUpperCase()}</strong></div>
                  {selectedAssessment.paymentReference && (
                    <div className="detail-row-adminbilling"><span>Reference Number:</span><strong>{selectedAssessment.paymentReference}</strong></div>
                  )}
                </div>
                {selectedAssessment.paymentProof && (
                  <div className="payment-proof-adminbilling">
                    <label>Payment Proof:</label>
                    <button className="view-proof-btn-adminbilling" onClick={() => window.open(selectedAssessment.paymentProof, '_blank')}>
                      <FaEye /> View Screenshot
                    </button>
                  </div>
                )}
                <div className="verification-notes-adminbilling">
                  <label>Verification Notes (Optional):</label>
                  <textarea rows="3" value={verificationNote} onChange={(e) => setVerificationNote(e.target.value)} placeholder="Add any notes about this verification..." />
                </div>
              </div>
              <div className="modal-actions-adminbilling">
                <button className="btn-cancel-adminbilling" onClick={() => setShowVerifyModal(false)}>Cancel</button>
                <button className="btn-reject-adminbilling" onClick={() => handleVerifyPayment(false)}><FaTimesCircle /> Reject Payment</button>
                <button className="btn-verify-adminbilling" onClick={() => handleVerifyPayment(true)}><FaCheckCircle /> Verify & Confirm</button>
              </div>
            </div>
          </div>
        )}

        {/* Verify Solar Invoice Payment Modal (for GCash) */}
        {showSolarVerifyModal && selectedInvoice && (
          <div className="modal-overlay-adminbilling" onClick={() => setShowSolarVerifyModal(false)}>
            <div className="modal-content-adminbilling" onClick={e => e.stopPropagation()}>
              <h3>Verify Solar Invoice Payment</h3>
              
              <div className="modal-body-adminbilling">
                <div className="payment-details-adminbilling">
                  <div className="detail-row-adminbilling"><span>Invoice Number:</span><strong>{selectedInvoice.invoiceNumber}</strong></div>
                  <div className="detail-row-adminbilling"><span>Project:</span><strong>{selectedInvoice.projectId?.projectName}</strong></div>
                  <div className="detail-row-adminbilling"><span>Client:</span><strong>{selectedInvoice.clientId?.contactFirstName} {selectedInvoice.clientId?.contactLastName}</strong></div>
                  <div className="detail-row-adminbilling"><span>Amount:</span><strong className="amount-adminbilling">{formatCurrency(selectedInvoice.totalAmount)}</strong></div>
                  <div className="detail-row-adminbilling"><span>Amount Paid:</span><strong>{formatCurrency(selectedInvoice.amountPaid)}</strong></div>
                  <div className="detail-row-adminbilling"><span>Balance:</span><strong>{formatCurrency(selectedInvoice.balance)}</strong></div>
                  
                  {selectedInvoice.payments?.map((payment, idx) => (
                    payment.method === 'gcash' && payment.proof && (
                      <div key={idx} className="payment-proof-adminbilling">
                        <label>Payment Proof #{idx + 1}:</label>
                        <button 
                          className="view-proof-btn-adminbilling" 
                          onClick={() => window.open(payment.proof, '_blank')}
                        >
                          <FaEye /> View Screenshot
                        </button>
                        {payment.reference && (
                          <p><strong>Reference:</strong> {payment.reference}</p>
                        )}
                        {payment.amount && (
                          <p><strong>Amount:</strong> {formatCurrency(payment.amount)}</p>
                        )}
                      </div>
                    )
                  ))}
                </div>

                <div className="verification-notes-adminbilling">
                  <label>Verification Notes (Optional):</label>
                  <textarea 
                    rows="3" 
                    value={verificationNote} 
                    onChange={(e) => setVerificationNote(e.target.value)} 
                    placeholder="Add any notes about this verification..."
                  />
                </div>
              </div>

              <div className="modal-actions-adminbilling">
                <button className="btn-cancel-adminbilling" onClick={() => setShowSolarVerifyModal(false)}>Cancel</button>
                <button className="btn-reject-adminbilling" onClick={() => handleVerifySolarPayment(false, selectedInvoice)}>
                  <FaTimesCircle /> Reject Payment
                </button>
                <button className="btn-verify-adminbilling" onClick={() => handleVerifySolarPayment(true, selectedInvoice)}>
                  <FaCheckCircle /> Verify & Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SOLAR INVOICE CASH PAYMENT DROPDOWN MODAL - Same as Pre-assessment */}
        {showSolarCashEditModal && selectedInvoice && (
          <div className="modal-overlay-adminbilling" onClick={() => setShowSolarCashEditModal(false)}>
            <div className="modal-content-adminbilling" onClick={e => e.stopPropagation()}>
              <h3>Edit Payment Status</h3>
              <div className="modal-body-adminbilling">
                <div className="payment-details-adminbilling">
                  <div className="detail-row-adminbilling">
                    <span>Invoice Number:</span>
                    <strong>{selectedInvoice.invoiceNumber}</strong>
                  </div>
                  <div className="detail-row-adminbilling">
                    <span>Project:</span>
                    <strong>{selectedInvoice.projectId?.projectName}</strong>
                  </div>
                  <div className="detail-row-adminbilling">
                    <span>Client:</span>
                    <strong>{selectedInvoice.clientId?.contactFirstName} {selectedInvoice.clientId?.contactLastName}</strong>
                  </div>
                  <div className="detail-row-adminbilling">
                    <span>Amount:</span>
                    <strong className="amount-adminbilling">
                      {formatCurrency(selectedInvoice.payments?.find(p => p.method === 'cash')?.amount || selectedInvoice.balance)}
                    </strong>
                  </div>
                  <div className="detail-row-adminbilling">
                    <span>Current Status:</span>
                    <strong>{getPaymentStatusBadge(selectedInvoice.paymentStatus)}</strong>
                  </div>
                </div>
                
                <div className="form-group-adminbilling">
                  <label>New Payment Status</label>
                  <select 
                    value={solarCashEditData.paymentStatus} 
                    onChange={(e) => setSolarCashEditData({ ...solarCashEditData, paymentStatus: e.target.value })}
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                  </select>
                  <small className="help-text-adminbilling">Changing status to "Paid" will mark the invoice as paid.</small>
                </div>
                
                <div className="verification-notes-adminbilling">
                  <label>Notes (Optional):</label>
                  <textarea 
                    rows="3" 
                    value={solarCashEditData.notes} 
                    onChange={(e) => setSolarCashEditData({ ...solarCashEditData, notes: e.target.value })} 
                    placeholder="Add notes about this status change..."
                  />
                </div>
              </div>
              
              <div className="modal-actions-adminbilling">
                <button className="btn-cancel-adminbilling" onClick={() => setShowSolarCashEditModal(false)}>
                  <FaTimes /> Cancel
                </button>
                <button 
                  className="btn-save-adminbilling" 
                  onClick={handleEditSolarCashStatus} 
                  disabled={!solarCashEditData.paymentStatus || isSubmitting}
                >
                  {isSubmitting ? <FaSpinner className="spinning" /> : <FaSave />} Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Payment Status Modal (for Pre-assessment Cash payments) */}
        {showEditStatusModal && selectedAssessment && (
          <div className="modal-overlay-adminbilling" onClick={() => setShowEditStatusModal(false)}>
            <div className="modal-content-adminbilling" onClick={e => e.stopPropagation()}>
              <h3>Edit Payment Status</h3>
              <div className="modal-body-adminbilling">
                <div className="payment-details-adminbilling">
                  <div className="detail-row-adminbilling"><span>Booking Reference:</span><strong>{selectedAssessment.bookingReference}</strong></div>
                  <div className="detail-row-adminbilling"><span>Client:</span><strong>{selectedAssessment.clientId?.contactFirstName} {selectedAssessment.clientId?.contactLastName}</strong></div>
                  <div className="detail-row-adminbilling"><span>Amount:</span><strong className="amount-adminbilling">{formatCurrency(selectedAssessment.assessmentFee)}</strong></div>
                  <div className="detail-row-adminbilling"><span>Current Status:</span>
                    <strong>{getPaymentStatusBadge(selectedAssessment.paymentStatus)}</strong>
                  </div>
                </div>
                <div className="form-group-adminbilling">
                  <label>New Payment Status</label>
                  <select value={editStatusData.paymentStatus} onChange={(e) => setEditStatusData({ ...editStatusData, paymentStatus: e.target.value })}>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                  </select>
                  <small className="help-text-adminbilling">Changing status to "Paid" will mark the assessment as scheduled.</small>
                </div>
                <div className="verification-notes-adminbilling">
                  <label>Notes (Optional):</label>
                  <textarea rows="3" value={editStatusData.notes} onChange={(e) => setEditStatusData({ ...editStatusData, notes: e.target.value })} placeholder="Add notes about this status change..." />
                </div>
              </div>
              <div className="modal-actions-adminbilling">
                <button className="btn-cancel-adminbilling" onClick={() => setShowEditStatusModal(false)}><FaTimes /> Cancel</button>
                <button className="btn-save-adminbilling" onClick={handleEditPaymentStatus} disabled={!editStatusData.paymentStatus || isSubmitting}>
                  {isSubmitting ? <FaSpinner className="spinning" /> : <FaSave />} Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create/View Solar Invoice Modal */}
        {showInvoiceModal && (
          <div className="modal-overlay-adminbilling" onClick={() => setShowInvoiceModal(false)}>
            <div className="modal-content-adminbilling invoice-modal-adminbilling" onClick={e => e.stopPropagation()}>
              <h3>{modalMode === 'create' ? 'Create Solar Invoice' : 'Invoice Details'}</h3>
              {modalMode === 'create' ? (
                <div className="invoice-form-adminbilling">
                  <div className="form-group-adminbilling">
                    <label>Select Project *</label>
                    <select value={invoiceFormData.projectId} onChange={(e) => setInvoiceFormData({ ...invoiceFormData, projectId: e.target.value })}>
                      <option value="">Select a project...</option>
                      {projects.map(project => (
                        <option key={project._id} value={project._id}>
                          {project.projectName} - {project.projectReference}
                          {project.paymentPreference === 'full' ? ' (Full Payment)' : ' (Installment)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row-adminbilling">
                    <div className="form-group-adminbilling">
                      <label>Invoice Type</label>
                      <select value={invoiceFormData.invoiceType} onChange={(e) => setInvoiceFormData({ ...invoiceFormData, invoiceType: e.target.value })}>
                        <option value="initial">Initial Payment (30%)</option>
                        <option value="progress">Progress Payment (40%)</option>
                        <option value="final">Final Payment (30%)</option>
                        <option value="full">Full Payment (100%)</option>
                        <option value="additional">Additional Work</option>
                      </select>
                    </div>
                    <div className="form-group-adminbilling">
                      <label>Due Date *</label>
                      <input type="date" value={invoiceFormData.dueDate} onChange={(e) => setInvoiceFormData({ ...invoiceFormData, dueDate: e.target.value })} />
                    </div>
                  </div>

                  <div className="form-group-adminbilling">
                    <label>Description</label>
                    <input type="text" value={invoiceFormData.description} onChange={(e) => setInvoiceFormData({ ...invoiceFormData, description: e.target.value })} placeholder="Invoice description" />
                  </div>

                  <label>Invoice Items</label>
                  {invoiceFormData.items.map((item, index) => (
                    <div key={index} className="invoice-item-row-adminbilling">
                      <input type="text" placeholder="Item name" value={item.name} onChange={(e) => {
                        const newItems = [...invoiceFormData.items];
                        newItems[index].name = e.target.value;
                        setInvoiceFormData({ ...invoiceFormData, items: newItems });
                      }} />
                      <input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => {
                        const newItems = [...invoiceFormData.items];
                        newItems[index].quantity = parseInt(e.target.value);
                        setInvoiceFormData({ ...invoiceFormData, items: newItems });
                        calculateItemTotal(index);
                      }} />
                      <input type="number" placeholder="Unit Price" value={item.unitPrice} onChange={(e) => {
                        const newItems = [...invoiceFormData.items];
                        newItems[index].unitPrice = parseFloat(e.target.value);
                        setInvoiceFormData({ ...invoiceFormData, items: newItems });
                        calculateItemTotal(index);
                      }} />
                      <span className="item-total-adminbilling">{formatCurrency(item.total)}</span>
                      {invoiceFormData.items.length > 1 && (
                        <button type="button" className="remove-item-adminbilling" onClick={() => removeInvoiceItem(index)}><FaTrash /></button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="add-item-btn-adminbilling" onClick={addInvoiceItem}><FaPlus /> Add Item</button>

                  <div className="invoice-totals-adminbilling">
                    <div className="total-row-adminbilling"><span>Subtotal:</span><span>{formatCurrency(invoiceFormData.subtotal)}</span></div>
                    <div className="total-row-adminbilling"><span>Tax (12%):</span><span>{formatCurrency(invoiceFormData.tax)}</span></div>
                    <div className="total-row-adminbilling"><span>Discount:</span><input type="number" value={invoiceFormData.discount} onChange={(e) => {
                      setInvoiceFormData({ ...invoiceFormData, discount: parseFloat(e.target.value) });
                      calculateTotals();
                    }} /></div>
                    <div className="total-row-adminbilling grand-total-adminbilling"><strong>Total:</strong><strong>{formatCurrency(invoiceFormData.totalAmount)}</strong></div>
                  </div>

                  <div className="modal-actions-adminbilling">
                    <button className="cancel-btn-adminbilling" onClick={() => setShowInvoiceModal(false)}>Cancel</button>
                    <button className="create-btn-adminbilling" onClick={handleCreateSolarInvoice} disabled={isSubmitting}>
                      {isSubmitting ? 'Creating...' : 'Create Invoice'}
                    </button>
                  </div>
                </div>
              ) : (
                selectedInvoice && (
                  <div className="invoice-view-adminbilling">
                    <div className="detail-section-adminbilling"><h4>Invoice Information</h4>
                      <p><strong>Invoice #:</strong> {selectedInvoice.invoiceNumber}</p>
                      <p><strong>Project:</strong> {selectedInvoice.projectId?.projectName}</p>
                      <p><strong>Project Reference:</strong> {selectedInvoice.projectId?.projectReference}</p>
                      <p><strong>Type:</strong> {selectedInvoice.invoiceType}</p>
                      <p><strong>Status:</strong> {getPaymentStatusBadge(selectedInvoice.paymentStatus)}</p>
                      <p><strong>Issue Date:</strong> {formatDate(selectedInvoice.issueDate)}</p>
                      <p><strong>Due Date:</strong> {formatDate(selectedInvoice.dueDate)}</p>
                    </div>
                    <div className="detail-section-adminbilling"><h4>Client Information</h4>
                      <p><strong>Name:</strong> {selectedInvoice.clientId?.contactFirstName} {selectedInvoice.clientId?.contactLastName}</p>
                      <p><strong>Email:</strong> {selectedInvoice.clientId?.userId?.email}</p>
                      <p><strong>Contact:</strong> {selectedInvoice.clientId?.contactNumber}</p>
                    </div>
                    <div className="detail-section-adminbilling"><h4>Items</h4>
                      <table className="items-table-adminbilling">
                        <thead>
                          <tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th>  </tr>
                        </thead>
                        <tbody>
                          {selectedInvoice.items?.map((item, idx) => (
                            <tr key={idx}>
                              <td>{item.name}</td>
                              <td>{item.quantity}</td>
                              <td className="amount-adminbilling">{formatCurrency(item.unitPrice)}</td>
                              <td className="amount-adminbilling">{formatCurrency(item.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="totals-adminbilling">
                        <div>Subtotal: {formatCurrency(selectedInvoice.subtotal)}</div>
                        <div>Tax: {formatCurrency(selectedInvoice.tax)}</div>
                        <div>Discount: {formatCurrency(selectedInvoice.discount)}</div>
                        <div className="grand-adminbilling"><strong>Total: {formatCurrency(selectedInvoice.totalAmount)}</strong></div>
                      </div>
                    </div>
                    <div className="detail-section-adminbilling"><h4>Payment History</h4>
                      {selectedInvoice.payments?.length > 0 ? (
                        <table className="payment-history-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Amount</th>
                              <th>Method</th>
                              <th>Reference</th>
                              <th>Notes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedInvoice.payments.map((payment, idx) => (
                              <tr key={idx}>
                                <td>{formatDate(payment.date)}</td>
                                <td className="amount">{formatCurrency(payment.amount)}</td>
                                <td>{payment.method?.toUpperCase()}</td>
                                <td>{payment.reference || '-'}</td>
                                <td>{payment.notes || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="no-payments">No payments recorded yet.</p>
                      )}
                    </div>
                    <div className="modal-actions-adminbilling">
                      <button className="cancel-btn-adminbilling" onClick={() => setShowInvoiceModal(false)}>Close</button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Record Payment Modal (for Solar Invoices) */}
        {showPaymentModal && selectedInvoice && (
          <div className="modal-overlay-adminbilling" onClick={() => setShowPaymentModal(false)}>
            <div className="modal-content-adminbilling" onClick={e => e.stopPropagation()}>
              <h3>Record Payment</h3>
              <div className="payment-info-adminbilling">
                <p><strong>Invoice:</strong> {selectedInvoice.invoiceNumber}</p>
                <p><strong>Project:</strong> {selectedInvoice.projectId?.projectName}</p>
                <p><strong>Total Amount:</strong> {formatCurrency(selectedInvoice.totalAmount)}</p>
                <p><strong>Paid:</strong> {formatCurrency(selectedInvoice.amountPaid)}</p>
                <p><strong>Balance:</strong> {formatCurrency(selectedInvoice.balance)}</p>
              </div>
              <div className="form-group-adminbilling">
                <label>Payment Amount *</label>
                <input type="number" value={paymentData.amount} onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })} placeholder="Enter amount" />
                <small className="help-text">Maximum: {formatCurrency(selectedInvoice.balance)}</small>
              </div>
              <div className="form-group-adminbilling">
                <label>Payment Method</label>
                <select value={paymentData.method} onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}>
                  <option value="gcash">GCash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                </select>
              </div>
              <div className="form-group-adminbilling">
                <label>Reference Number</label>
                <input type="text" value={paymentData.reference} onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })} placeholder="Transaction reference" />
              </div>
              <div className="form-group-adminbilling">
                <label>Notes</label>
                <textarea rows="2" value={paymentData.notes} onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })} placeholder="Add notes..." />
              </div>
              <div className="modal-actions-adminbilling">
                <button className="cancel-btn-adminbilling" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button className="record-btn-adminbilling" onClick={handleRecordPayment} disabled={!paymentData.amount || isSubmitting}>
                  {isSubmitting ? 'Recording...' : 'Record Payment'}
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
          position="bottom-right"
        />
      </div>
    </>
  );
};

export default AdminBilling;