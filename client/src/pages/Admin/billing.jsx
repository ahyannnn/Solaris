// pages/Admin/Billing.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  FaSave,
  FaTimes,
  FaChevronDown,
  FaReceipt
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
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Solar Invoice state (Project bills)
  const [solarInvoices, setSolarInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSolarVerifyModal, setShowSolarVerifyModal] = useState(false);
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
  const [totalItems, setTotalItems] = useState(0);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);
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

  // Debounced search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, debouncedSearchTerm, activeTab]);

  useEffect(() => {
    if (activeTab === 'pre-assessments') {
      fetchPreAssessments();
    } else if (activeTab === 'solar-invoices') {
      fetchSolarInvoices();
    } else {
      fetchTransactions();
    }
    fetchStats();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeTab, filter, currentPage, debouncedSearchTerm]);

  const fetchProjects = useCallback(async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  }, []);

  const fetchPreAssessments = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');

      const params = {
        page: currentPage,
        limit: 10
      };

      if (filter !== 'all') {
        params.paymentStatus = filter;
      }

      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      const assessmentsWithInvoice = (response.data.assessments || []).filter(
        assessment => assessment.invoiceNumber && assessment.invoiceNumber !== null && assessment.invoiceNumber !== ''
      );

      setAssessments(assessmentsWithInvoice);
      setTotalPages(response.data.totalPages || 1);
      setTotalItems(response.data.total || assessmentsWithInvoice.length);
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

      const params = {
        page: currentPage,
        limit: 10
      };

      if (filter !== 'all') {
        params.paymentStatus = filter;
      }

      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/solar-invoices`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      setSolarInvoices(response.data.invoices || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalItems(response.data.total || 0);
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
          gateway: a.paymentGateway,
          receiptUrl: a.receiptUrl,
          receiptNumber: a.receiptNumber
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
          projectId: i.projectId?._id,
          receiptUrl: i.receiptUrl,
          receiptNumber: i.receiptNumber
        })));

      let allTransactions = [...prePayments, ...solarPayments].sort((a, b) => new Date(b.date) - new Date(a.date));

      if (filter !== 'all') {
        allTransactions = allTransactions.filter(t => t.status === filter);
      }

      if (debouncedSearchTerm) {
        const term = debouncedSearchTerm.toLowerCase();
        allTransactions = allTransactions.filter(t =>
          t.reference?.toLowerCase().includes(term) ||
          t.invoiceNumber?.toLowerCase().includes(term) ||
          t.client?.toLowerCase().includes(term) ||
          t.projectName?.toLowerCase().includes(term)
        );
      }

      setTransactions(allTransactions);
      setTotalItems(allTransactions.length);
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

  // ============ RECEIPT HANDLERS ============
  const handleViewReceipt = async (item, type) => {
    try {
      let receiptUrl = null;

      if (type === 'pre-assessment') {
        receiptUrl = item.receiptUrl;
      } else if (type === 'solar-invoice') {
        receiptUrl = item.receiptUrl;
      } else if (type === 'transaction') {
        receiptUrl = item.receiptUrl;
      }

      if (!receiptUrl) {
        showToast('No receipt available for this transaction', 'warning');
        return;
      }

      window.open(receiptUrl, '_blank');
      setOpenDropdownId(null);
    } catch (error) {
      console.error('Error viewing receipt:', error);
      showToast('Failed to load receipt', 'error');
    }
  };

  const handleDownloadReceipt = async (item, type) => {
    try {
      let receiptUrl = null;
      let receiptNumber = null;

      if (type === 'pre-assessment') {
        receiptUrl = item.receiptUrl;
        receiptNumber = item.receiptNumber;
      } else if (type === 'solar-invoice') {
        receiptUrl = item.receiptUrl;
        receiptNumber = item.receiptNumber;
      } else if (type === 'transaction') {
        receiptUrl = item.receiptUrl;
        receiptNumber = item.receiptNumber;
      }

      if (!receiptUrl) {
        showToast('No receipt available for this transaction', 'warning');
        return;
      }

      const response = await axios.get(receiptUrl, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Receipt-${receiptNumber || 'download'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToast('Receipt downloaded successfully!', 'success');
      setOpenDropdownId(null);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      showToast('Failed to download receipt', 'error');
    }
  };

  const handleVerifyPayment = async (verified) => {
    if (!selectedAssessment) return;
    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/pre-assessments/${selectedAssessment._id}/verify-payment`,
        { verified, notes: verificationNote },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (verified && response.data.receipt) {
        showToast(`Payment verified! Receipt: ${response.data.receipt.number}`, 'success');
      } else {
        showToast(verified ? 'Payment verified successfully!' : 'Payment rejected', verified ? 'success' : 'warning');
      }

      fetchPreAssessments();
      fetchStats();
      setShowVerifyModal(false);
      setSelectedAssessment(null);
      setVerificationNote('');
      setOpenDropdownId(null);
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
      setOpenDropdownId(null);
      showToast(`Payment status updated to ${newPaymentStatus.toUpperCase()}`, 'success');
    } catch (error) {
      console.error('Error updating payment status:', error);
      showToast('Failed to update payment status', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifySolarPayment = async (verified, invoice) => {
    if (!invoice) return;

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');

      if (verified) {
        const response = await axios.put(
          `${import.meta.env.VITE_API_URL}/api/solar-invoices/${invoice._id}/verify`,
          { verified: true, notes: verificationNote },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.receipt) {
          showToast(`Payment verified! Receipt: ${response.data.receipt.number}`, 'success');
        } else {
          showToast('Payment verified successfully!', 'success');
        }
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
      setOpenDropdownId(null);
      fetchSolarInvoices();
      fetchStats();

    } catch (error) {
      console.error('Error verifying solar payment:', error);
      showToast('Failed to verify payment', 'error');
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
      setOpenDropdownId(null);
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
      'pending': <span className="status-badge-admbil pending-admbil">Pending</span>,
      'for_verification': <span className="status-badge-admbil for-verification-admbil">Verifying</span>,
      'paid': <span className="status-badge-admbil paid-admbil">Paid</span>,
      'partial': <span className="status-badge-admbil partial-admbil">Partial</span>,
      'failed': <span className="status-badge-admbil failed-admbil">Failed</span>,
      'overdue': <span className="status-badge-admbil overdue-admbil">Overdue</span>
    };
    return badges[status] || <span className="status-badge-admbil">{status}</span>;
  };

  const getAssessmentStatusBadge = (status) => {
    const badges = {
      'pending_payment': <span className="status-badge-admbil pending-admbil">Pending</span>,
      'scheduled': <span className="status-badge-admbil scheduled-admbil">Scheduled</span>,
      'device_deployed': <span className="status-badge-admbil deployed-admbil">Deployed</span>,
      'data_collecting': <span className="status-badge-admbil collecting-admbil">Collecting</span>,
      'completed': <span className="status-badge-admbil completed-admbil">Completed</span>
    };
    return badges[status] || <span className="status-badge-admbil">{status}</span>;
  };

  const getInvoiceTypeBadge = (type) => {
    const badges = {
      'initial': <span className="invoice-type-badge-admbil initial-admbil">Initial (30%)</span>,
      'progress': <span className="invoice-type-badge-admbil progress-admbil">Progress (40%)</span>,
      'final': <span className="invoice-type-badge-admbil final-admbil">Final (30%)</span>,
      'full': <span className="invoice-type-badge-admbil full-admbil">Full (100%)</span>,
      'additional': <span className="invoice-type-badge-admbil additional-admbil">Additional</span>
    };
    return badges[type] || <span className="invoice-type-badge-admbil">{type}</span>;
  };

  const getGatewayBadge = (assessment) => {
    if (assessment.paymentGateway === 'paymongo' || assessment.autoVerified === true) {
      return <span className="gateway-badge-admbil paymongo-admbil">PayMongo</span>;
    }
    if (assessment.paymentMethod === 'cash') {
      return <span className="gateway-badge-admbil cash-admbil">Cash</span>;
    }
    return <span className="gateway-badge-admbil manual-admbil">Manual</span>;
  };

  const getPreAssessmentActions = (assessment) => {
    const actions = [
      {
        label: 'View Details',
        action: () => { setSelectedAssessment(assessment); setShowDetailModal(true); setOpenDropdownId(null); }
      }
    ];

    if (assessment.receiptUrl) {
      actions.push(
        {
          label: 'View Receipt',
          action: () => handleViewReceipt(assessment, 'pre-assessment'),
          color: 'info'
        },
        {
          label: 'Download Receipt',
          action: () => handleDownloadReceipt(assessment, 'pre-assessment'),
          color: 'success'
        }
      );
    }

    if (assessment.paymentMethod === 'gcash' && assessment.paymentStatus === 'for_verification') {
      actions.push(
        { label: 'View Proof', action: () => { if (assessment.paymentProof) window.open(assessment.paymentProof, '_blank'); setOpenDropdownId(null); } },
        { label: 'Verify Payment', action: () => { setSelectedAssessment(assessment); setShowVerifyModal(true); setOpenDropdownId(null); }, color: 'success' },
        { label: 'Reject Payment', action: () => { setSelectedAssessment(assessment); setVerificationNote(''); handleVerifyPayment(false); }, color: 'danger' }
      );
    }

    if (assessment.paymentMethod === 'cash' && assessment.paymentStatus === 'pending') {
      actions.push(
        { label: 'Mark as Paid', action: () => { setSelectedAssessment(assessment); setEditStatusData({ paymentStatus: assessment.paymentStatus, notes: '' }); setShowEditStatusModal(true); setOpenDropdownId(null); }, color: 'warning' }
      );
    }

    return actions;
  };

  const getSolarInvoiceActions = (invoice) => {
    const actions = [
      {
        label: 'View Details',
        action: () => { setSelectedInvoice(invoice); setModalMode('view'); setShowInvoiceModal(true); setOpenDropdownId(null); }
      },
      {
        label: 'Download PDF',
        action: () => { handleDownloadInvoice(invoice); setOpenDropdownId(null); }
      }
    ];

    if (invoice.receiptUrl) {
      actions.push(
        {
          label: 'View Receipt',
          action: () => handleViewReceipt(invoice, 'solar-invoice'),
          color: 'info'
        },
        {
          label: 'Download Receipt',
          action: () => handleDownloadReceipt(invoice, 'solar-invoice'),
          color: 'success'
        }
      );
    }

    if (invoice.status === 'draft') {
      actions.push(
        { label: 'Send to Customer', action: () => { handleSendInvoice(invoice); setOpenDropdownId(null); } }
      );
    }

    if (invoice.paymentStatus === 'pending' || invoice.paymentStatus === 'partial') {
      actions.push(
        { label: 'Record Payment', action: () => { setSelectedInvoice(invoice); setShowPaymentModal(true); setOpenDropdownId(null); }, color: 'warning' }
      );
    }

    if (invoice.paymentStatus === 'for_verification') {
      actions.push(
        { label: 'View Proof', action: () => { const p = invoice.payments?.find(p => p.method === 'gcash'); p?.proof ? window.open(p.proof, '_blank') : showToast('No proof', 'warning'); setOpenDropdownId(null); } },
        { label: 'Verify Payment', action: () => { setSelectedInvoice(invoice); setShowSolarVerifyModal(true); setOpenDropdownId(null); }, color: 'success' },
        { label: 'Reject Payment', action: () => handleVerifySolarPayment(false, invoice), color: 'danger' }
      );
    }

    return actions;
  };

  const SkeletonLoader = () => (
    <div className="admin-billing-admbil">
      <div className="billing-header-admbil">
        <div className="skeleton-line-admbil large-admbil"></div>
        <div className="skeleton-button-admbil"></div>
      </div>
      <div className="stats-cards-admbil">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="stat-card-admbil skeleton-card-admbil">
            <div className="skeleton-line-admbil small-admbil"></div>
            <div className="skeleton-line-admbil large-admbil"></div>
          </div>
        ))}
      </div>
      <div className="billing-tabs-admbil">
        {[1, 2, 3].map(i => <div key={i} className="skeleton-tab-admbil"></div>)}
      </div>
      <div className="filters-section-admbil">
        <div className="skeleton-select-admbil"></div>
        <div className="skeleton-search-admbil"></div>
      </div>
      <div className="payments-table-container-admbil">
        <div className="skeleton-table-admbil"></div>
      </div>
    </div>
  );

  if (loading && assessments.length === 0 && solarInvoices.length === 0 && activeTab !== 'transactions') {
    return <SkeletonLoader />;
  }

  return (
    <>
      <Helmet>
        <title>Billing Management | Admin | Salfer Engineering</title>
      </Helmet>

      <div className="admin-billing-admbil">
        <div className="billing-header-admbil">
          <div>
            <h1>Billing Management</h1>
            <p>Manage invoices, verify payments, and track all transactions</p>
          </div>
          {activeTab === 'solar-invoices' && (
            <button className="create-invoice-btn-admbil" onClick={() => { setModalMode('create'); fetchProjects(); setShowInvoiceModal(true); }}>
              <FaPlus /> Create Solar Invoice
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="stats-cards-admbil">
          <div className="stat-card-admbil revenue-admbil">
            <div className="stat-info-admbil">
              <span className="stat-value-admbil">{formatCurrency(stats.totalRevenue)}</span>
              <span className="stat-label-admbil">Total Revenue</span>
            </div>
          </div>
          <div className="stat-card-admbil pending-amount-admbil">
            <div className="stat-info-admbil">
              <span className="stat-value-admbil">{formatCurrency(stats.pendingAmount)}</span>
              <span className="stat-label-admbil">Pending Collection</span>
            </div>
          </div>
          <div className="stat-card-admbil pre-assessment-admbil">
            <div className="stat-info-admbil">
              <span className="stat-value-admbil">{stats.totalPreAssessments}</span>
              <span className="stat-label-admbil">Pre-Assessments</span>
              <div className="stat-detail-admbil">
                <span>Paid: {stats.paidPre}</span>
                <span>Auto: {stats.autoVerified}</span>
                <span>Cash: {stats.pendingCash}</span>
              </div>
            </div>
          </div>
          <div className="stat-card-admbil solar-invoice-admbil">
            <div className="stat-info-admbil">
              <span className="stat-value-admbil">{stats.totalSolarInvoices}</span>
              <span className="stat-label-admbil">Solar Invoices</span>
              <div className="stat-detail-admbil">
                <span>Paid: {stats.paidSolar}</span>
                <span>Partial: {stats.partial}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="billing-tabs-admbil">
          <button className={`tab-btn-admbil ${activeTab === 'pre-assessments' ? 'active-admbil' : ''}`} onClick={() => { setActiveTab('pre-assessments'); setFilter('all'); setCurrentPage(1); }}>Pre-Assessments</button>
          <button className={`tab-btn-admbil ${activeTab === 'solar-invoices' ? 'active-admbil' : ''}`} onClick={() => { setActiveTab('solar-invoices'); setFilter('all'); setCurrentPage(1); }}>Solar Invoices</button>
          <button className={`tab-btn-admbil ${activeTab === 'transactions' ? 'active-admbil' : ''}`} onClick={() => { setActiveTab('transactions'); setCurrentPage(1); }}>Transactions</button>
        </div>

        {/* Filters */}
        <div className="filters-section-admbil">
          <div className="filter-group-admbil">
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
              ) : (
                <>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="for_verification">For Verification</option>
                </>
              )}
            </select>
          </div>
          <div className="search-group-admbil">
            <FaSearch className="search-icon-admbil" />
            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        {/* PRE-ASSESSMENTS TABLE */}
        {activeTab === 'pre-assessments' && (
          <>
            <div className="payments-table-container-admbil">
              <table className="payments-table-admbil">
                <thead>
                  <tr>
                    <th>Booking Ref</th>
                    <th>Invoice</th>
                    <th>Client</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Gateway</th>
                    <th>Payment</th>
                    <th>Assessment</th>
                    <th>Receipt</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.length === 0 ? (
                    <tr><td colSpan="10" className="empty-state-admbil">No pre-assessments found</td></tr>
                  ) : (
                    assessments.map(assessment => {
                      const actions = getPreAssessmentActions(assessment);
                      const isOpen = openDropdownId === assessment._id;
                      const autoVerified = (assessment.paymentGateway === 'paymongo' || assessment.autoVerified === true) && assessment.paymentStatus === 'paid';

                      return (
                        <tr key={assessment._id}>
                          <td className="ref-cell-admbil">{assessment.bookingReference}</td>
                          <td>{assessment.invoiceNumber}</td>
                          <td><strong>{assessment.clientId?.contactFirstName} {assessment.clientId?.contactLastName}</strong></td>
                          <td>{formatDate(assessment.bookedAt)}</td>
                          <td className="amount-admbil">{formatCurrency(assessment.assessmentFee)}</td>
                          <td>{getGatewayBadge(assessment)}</td>
                          <td>{getPaymentStatusBadge(assessment.paymentStatus)}</td>
                          <td>{getAssessmentStatusBadge(assessment.assessmentStatus)}</td>
                          <td className="receipt-cell-admbil">
                            {assessment.receiptUrl ? (
                              <a
                                href={assessment.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="receipt-link-admbil"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <FaReceipt /> View
                              </a>
                            ) : (
                              <span className="no-receipt-admbil">—</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center', position: 'relative' }}>
                            {autoVerified ? (
                              <span className="verified-badge-admbil auto-verified-admbil">Auto-Verified</span>
                            ) : assessment.paymentMethod === 'cash' && assessment.paymentStatus === 'paid' ? (
                              <span className="verified-badge-admbil">Verified</span>
                            ) : assessment.paymentStatus === 'failed' ? (
                              <span className="failed-badge-admbil">Failed</span>
                            ) : (
                              <div className="action-dropdown-container-admbil" ref={isOpen ? dropdownRef : null}>
                                <button className="action-dropdown-toggle-admbil" onClick={() => setOpenDropdownId(isOpen ? null : assessment._id)}>
                                  Action <FaChevronDown className={`dropdown-arrow-admbil ${isOpen ? 'open-admbil' : ''}`} />
                                </button>
                                {isOpen && (
                                  <div className="action-dropdown-menu-admbil">
                                    {actions.map((action, idx) => (
                                      <button key={idx} className={`dropdown-item-admbil ${action.color || ''}`} onClick={action.action}>
                                        <span>{action.label}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination-admbil">
                <button className="page-btn-admbil" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><FaChevronLeft /> Previous</button>
                <span className="page-info-admbil">Page {currentPage} of {totalPages}</span>
                <button className="page-btn-admbil" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next <FaChevronRight /></button>
              </div>
            )}
          </>
        )}

        {/* SOLAR INVOICES TABLE */}
        {activeTab === 'solar-invoices' && (
          <>
            <div className="payments-table-container-admbil">
              <table className="payments-table-admbil">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Project ID</th>
                    <th>Client</th>
                    <th>Type</th>
                    <th>Due Date</th>
                    <th>Amount</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th>Receipt</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {solarInvoices.length === 0 ? (
                    <tr><td colSpan="11" className="empty-state-admbil">No solar invoices found</td></tr>
                  ) : (
                    solarInvoices.map(invoice => {
                      const actions = getSolarInvoiceActions(invoice);
                      const isOpen = openDropdownId === invoice._id;
                      const autoVerified = invoice.paymentStatus === 'paid' && invoice.payments?.some(p => p.method === 'paymongo');

                      return (
                        <tr key={invoice._id}>
                          <td className="ref-cell-admbil">{invoice.invoiceNumber}</td>
                          <td><span className="project-id-admbil">{invoice.projectId?.projectReference || invoice.projectId?._id || 'N/A'}</span></td>
                          <td><strong>{invoice.clientId?.contactFirstName} {invoice.clientId?.contactLastName}</strong></td>
                          <td>{getInvoiceTypeBadge(invoice.invoiceType)}</td>
                          <td>{formatDate(invoice.dueDate)}</td>
                          <td className="amount-admbil">{formatCurrency(invoice.totalAmount)}</td>
                          <td className="amount-admbil">{formatCurrency(invoice.amountPaid)}</td>
                          <td className="amount-admbil balance-admbil">{formatCurrency(invoice.balance)}</td>
                          <td>{getPaymentStatusBadge(invoice.paymentStatus)}</td>
                          <td className="receipt-cell-admbil">
                            {invoice.receiptUrl ? (
                              <a
                                href={invoice.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="receipt-link-admbil"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <FaReceipt /> View
                              </a>
                            ) : (
                              <span className="no-receipt-admbil">—</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center', position: 'relative' }}>
                            {autoVerified ? (
                              <span className="verified-badge-admbil auto-verified-admbil">Auto-Verified</span>
                            ) : (
                              <div className="action-dropdown-container-admbil" ref={isOpen ? dropdownRef : null}>
                                <button className="action-dropdown-toggle-admbil" onClick={() => setOpenDropdownId(isOpen ? null : invoice._id)}>
                                  Action <FaChevronDown className={`dropdown-arrow-admbil ${isOpen ? 'open-admbil' : ''}`} />
                                </button>
                                {isOpen && (
                                  <div className="action-dropdown-menu-admbil">
                                    {actions.map((action, idx) => (
                                      <button key={idx} className={`dropdown-item-admbil ${action.color || ''}`} onClick={action.action}>
                                        <span>{action.label}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination-admbil">
                <button className="page-btn-admbil" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><FaChevronLeft /> Previous</button>
                <span className="page-info-admbil">Page {currentPage} of {totalPages}</span>
                <button className="page-btn-admbil" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next <FaChevronRight /></button>
              </div>
            )}
          </>
        )}

        {/* TRANSACTIONS TABLE */}
        {activeTab === 'transactions' && (
          <div className="payments-table-container-admbil">
            <table className="payments-table-admbil">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Reference</th>
                  <th>Invoice</th>
                  <th>Client</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr><td colSpan="9" className="empty-state-admbil">No transactions found</td></tr>
                ) : (
                  transactions.map(transaction => (
                    <tr key={transaction.id}>
                      <td>{formatDate(transaction.date)}</td>
                      <td><span className={`transaction-type-admbil ${transaction.type === 'Pre-Assessment' ? 'pre-admbil' : 'project-admbil'}`}>{transaction.type}</span></td>
                      <td>{transaction.reference}</td>
                      <td>{transaction.invoiceNumber}</td>
                      <td><strong>{transaction.client}</strong></td>
                      <td className="amount-admbil">{formatCurrency(transaction.amount)}</td>
                      <td>{transaction.method?.toUpperCase()}</td>
                      <td>{getPaymentStatusBadge(transaction.status)}</td>
                      <td className="receipt-cell-admbil">
                        {transaction.receiptUrl ? (
                          <a
                            href={transaction.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="receipt-link-admbil"
                          >
                            <FaReceipt /> View
                          </a>
                        ) : (
                          <span className="no-receipt-admbil">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Verify Payment Modal */}
        {showVerifyModal && selectedAssessment && (
          <div className="modal-overlay-admbil" onClick={() => setShowVerifyModal(false)}>
            <div className="modal-content-admbil" onClick={e => e.stopPropagation()}>
              <h3>Verify Payment</h3>
              <div className="modal-body-admbil">
                <div className="payment-details-admbil">
                  <div className="detail-row-admbil"><span>Ref:</span><strong>{selectedAssessment.bookingReference}</strong></div>
                  <div className="detail-row-admbil"><span>Amount:</span><strong>{formatCurrency(selectedAssessment.assessmentFee)}</strong></div>
                </div>
                {selectedAssessment.paymentProof && (
                  <div className="payment-proof-admbil">
                    <button className="view-proof-btn-admbil" onClick={() => window.open(selectedAssessment.paymentProof, '_blank')}>View Screenshot</button>
                  </div>
                )}
                <div className="verification-notes-admbil">
                  <label>Notes</label>
                  <textarea rows="3" value={verificationNote} onChange={(e) => setVerificationNote(e.target.value)} />
                </div>
              </div>
              <div className="modal-actions-admbil">
                <button className="btn-cancel-admbil" onClick={() => setShowVerifyModal(false)}>Cancel</button>
                <button className="btn-reject-admbil" onClick={() => handleVerifyPayment(false)}>Reject</button>
                <button className="btn-verify-admbil" onClick={() => handleVerifyPayment(true)}>Verify</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Status Modal */}
        {showEditStatusModal && selectedAssessment && (
          <div className="modal-overlay-admbil" onClick={() => setShowEditStatusModal(false)}>
            <div className="modal-content-admbil" onClick={e => e.stopPropagation()}>
              <h3>Edit Status</h3>
              <div className="modal-body-admbil">
                <div className="detail-row-admbil"><span>Ref:</span><strong>{selectedAssessment.bookingReference}</strong></div>
                <div className="detail-row-admbil"><span>Amount:</span><strong>{formatCurrency(selectedAssessment.assessmentFee)}</strong></div>
                <div className="form-group-admbil">
                  <label>Status</label>
                  <select value={editStatusData.paymentStatus} onChange={(e) => setEditStatusData({ ...editStatusData, paymentStatus: e.target.value })}>
                    <option value="">Select</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Cancel</option>
                  </select>
                </div>
                <div className="verification-notes-admbil">
                  <label>Notes</label>
                  <textarea rows="3" value={editStatusData.notes} onChange={(e) => setEditStatusData({ ...editStatusData, notes: e.target.value })} />
                </div>
              </div>
              <div className="modal-actions-admbil">
                <button className="btn-cancel-admbil" onClick={() => setShowEditStatusModal(false)}>Cancel</button>
                <button className="btn-save-admbil" onClick={handleEditPaymentStatus} disabled={!editStatusData.paymentStatus || isSubmitting}>
                  {isSubmitting ? <FaSpinner className="spinning-admbil" /> : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Solar Verify Modal */}
        {showSolarVerifyModal && selectedInvoice && (
          <div className="modal-overlay-admbil" onClick={() => setShowSolarVerifyModal(false)}>
            <div className="modal-content-admbil" onClick={e => e.stopPropagation()}>
              <h3>Verify Invoice Payment</h3>
              <div className="modal-body-admbil">
                <div className="detail-row-admbil"><span>Invoice:</span><strong>{selectedInvoice.invoiceNumber}</strong></div>
                <div className="detail-row-admbil"><span>Amount:</span><strong>{formatCurrency(selectedInvoice.totalAmount)}</strong></div>
                <div className="verification-notes-admbil">
                  <label>Notes</label>
                  <textarea rows="3" value={verificationNote} onChange={(e) => setVerificationNote(e.target.value)} />
                </div>
              </div>
              <div className="modal-actions-admbil">
                <button className="btn-cancel-admbil" onClick={() => setShowSolarVerifyModal(false)}>Cancel</button>
                <button className="btn-reject-admbil" onClick={() => handleVerifySolarPayment(false, selectedInvoice)}>Reject</button>
                <button className="btn-verify-admbil" onClick={() => handleVerifySolarPayment(true, selectedInvoice)}>Verify</button>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Modal - Create/View */}
        {showInvoiceModal && (
          <div className="modal-overlay-admbil" onClick={() => setShowInvoiceModal(false)}>
            <div className="modal-content-admbil invoice-modal-admbil" onClick={e => e.stopPropagation()}>
              <h3>{modalMode === 'create' ? 'Create Invoice' : 'Invoice Details'}</h3>
              {modalMode === 'create' ? (
                <div className="modal-body-admbil">
                  <div className="invoice-form-admbil">
                    <div className="form-group-admbil">
                      <label>Project *</label>
                      <select value={invoiceFormData.projectId} onChange={(e) => setInvoiceFormData({ ...invoiceFormData, projectId: e.target.value })}>
                        <option value="">Select project...</option>
                        {projects.map(p => <option key={p._id} value={p._id}>{p.projectName} - {p.projectReference}</option>)}
                      </select>
                    </div>
                    <div className="form-row-admbil">
                      <div className="form-group-admbil">
                        <label>Type</label>
                        <select value={invoiceFormData.invoiceType} onChange={(e) => setInvoiceFormData({ ...invoiceFormData, invoiceType: e.target.value })}>
                          <option value="initial">Initial (30%)</option>
                          <option value="progress">Progress (40%)</option>
                          <option value="final">Final (30%)</option>
                          <option value="full">Full (100%)</option>
                        </select>
                      </div>
                      <div className="form-group-admbil">
                        <label>Due Date *</label>
                        <input type="date" value={invoiceFormData.dueDate} onChange={(e) => setInvoiceFormData({ ...invoiceFormData, dueDate: e.target.value })} />
                      </div>
                    </div>
                    <div className="invoice-totals-admbil">
                      <div className="total-row-admbil"><span>Total:</span><strong>{formatCurrency(invoiceFormData.totalAmount)}</strong></div>
                    </div>
                  </div>
                </div>
              ) : (
                selectedInvoice && (
                  <>
                    <div className="modal-body-admbil">
                      <div className="invoice-view-admbil">
                        <div className="detail-section-admbil">
                          <p><strong>Invoice:</strong> {selectedInvoice.invoiceNumber}</p>
                          <p><strong>Project:</strong> {selectedInvoice.projectId?.projectName}</p>
                          <p><strong>Type:</strong> {selectedInvoice.invoiceType}</p>
                          <p><strong>Status:</strong> {getPaymentStatusBadge(selectedInvoice.paymentStatus)}</p>
                          <p><strong>Total:</strong> {formatCurrency(selectedInvoice.totalAmount)}</p>
                          <p><strong>Paid:</strong> {formatCurrency(selectedInvoice.amountPaid)}</p>
                          <p><strong>Balance:</strong> {formatCurrency(selectedInvoice.balance)}</p>
                          {selectedInvoice.receiptUrl && (
                            <p><strong>Receipt:</strong> <a href={selectedInvoice.receiptUrl} target="_blank" rel="noopener noreferrer">View Receipt</a></p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="modal-actions-admbil">
                      <button className="cancel-btn-admbil" onClick={() => setShowInvoiceModal(false)}>Close</button>
                    </div>
                  </>
                )
              )}
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedInvoice && (
          <div className="modal-overlay-admbil" onClick={() => setShowPaymentModal(false)}>
            <div className="modal-content-admbil" onClick={e => e.stopPropagation()}>
              <h3>Record Payment</h3>
              <div className="modal-body-admbil">
                <div className="payment-info-admbil">
                  <p><strong>Invoice:</strong> {selectedInvoice.invoiceNumber}</p>
                  <p><strong>Balance:</strong> {formatCurrency(selectedInvoice.balance)}</p>
                </div>
                <div className="form-group-admbil">
                  <label>Amount *</label>
                  <input type="number" value={paymentData.amount} onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })} />
                </div>
                <div className="form-group-admbil">
                  <label>Method</label>
                  <select value={paymentData.method} onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}>
                    <option value="gcash">GCash</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
                <div className="form-group-admbil">
                  <label>Reference</label>
                  <input type="text" value={paymentData.reference} onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })} />
                </div>
              </div>
              <div className="modal-actions-admbil">
                <button className="cancel-btn-admbil" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button className="record-btn-admbil" onClick={handleRecordPayment} disabled={!paymentData.amount || isSubmitting}>
                  {isSubmitting ? 'Recording...' : 'Record'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal for Pre-assessment */}
        {showDetailModal && selectedAssessment && (
          <div className="modal-overlay-admbil" onClick={() => setShowDetailModal(false)}>
            <div className="modal-content-admbil" onClick={e => e.stopPropagation()}>
              <h3>Pre-Assessment Details</h3>
              <div className="modal-body-admbil">
                <div className="detail-section-admbil">
                  <p><strong>Booking Ref:</strong> {selectedAssessment.bookingReference}</p>
                  <p><strong>Invoice:</strong> {selectedAssessment.invoiceNumber}</p>
                  <p><strong>Client:</strong> {selectedAssessment.clientId?.contactFirstName} {selectedAssessment.clientId?.contactLastName}</p>
                  <p><strong>Amount:</strong> {formatCurrency(selectedAssessment.assessmentFee)}</p>
                  <p><strong>Payment Status:</strong> {getPaymentStatusBadge(selectedAssessment.paymentStatus)}</p>
                  <p><strong>Assessment Status:</strong> {getAssessmentStatusBadge(selectedAssessment.assessmentStatus)}</p>
                  {selectedAssessment.receiptUrl && (
                    <p><strong>Receipt:</strong> <a href={selectedAssessment.receiptUrl} target="_blank" rel="noopener noreferrer">View Receipt</a></p>
                  )}
                </div>
              </div>
              <div className="modal-actions-admbil">
                <button className="cancel-btn-admbil" onClick={() => setShowDetailModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} position="bottom-right" />
      </div>
    </>
  );
};

export default AdminBilling;