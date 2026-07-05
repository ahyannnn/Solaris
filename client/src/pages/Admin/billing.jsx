// pages/Admin/Billing.jsx - Redesigned without cards
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
  FaReceipt,
  FaUniversity,
  FaClock,
  FaUser,
  FaFileInvoice,
  FaBuilding,
  FaExclamationTriangle
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

  // Solar Invoice state
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

  // Bank Transfer state
  const [bankTransfers, setBankTransfers] = useState([]);
  const [selectedBankTransfer, setSelectedBankTransfer] = useState(null);
  const [showBankTransferDetailModal, setShowBankTransferDetailModal] = useState(false);
  const [showBankRejectModal, setShowBankRejectModal] = useState(false);
  const [bankRejectionReason, setBankRejectionReason] = useState('');
  const [bankTransferFilter, setBankTransferFilter] = useState('waiting_verification');
  const [bankTransferSearch, setBankTransferSearch] = useState('');
  const [bankTransferPage, setBankTransferPage] = useState(1);
  const [bankTransferTotalPages, setBankTransferTotalPages] = useState(1);
  const [bankTransferTotalItems, setBankTransferTotalItems] = useState(0);
  const [bankTransferStats, setBankTransferStats] = useState(null);

  // Transaction history state
  const [transactions, setTransactions] = useState([]);
  const [projects, setProjects] = useState([]);

  // Filter and pagination
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(5);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 20 });
  const dropdownRef = useRef(null);
  const buttonRefs = useRef({});
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
  const [debouncedBankSearch, setDebouncedBankSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedBankSearch(bankTransferSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [bankTransferSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, debouncedSearchTerm, activeTab]);

  useEffect(() => {
    setBankTransferPage(1);
  }, [bankTransferFilter, debouncedBankSearch]);

  useEffect(() => {
    if (activeTab === 'pre-assessments') {
      fetchPreAssessments();
    } else if (activeTab === 'solar-invoices') {
      fetchSolarInvoices();
    } else if (activeTab === 'bank-transfers') {
      fetchBankTransfers();
      fetchBankTransferStats();
    } else {
      fetchTransactions();
    }
    fetchStats();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    };
    
    const handleScroll = () => {
      setOpenDropdownId(null);
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [activeTab, filter, currentPage, debouncedSearchTerm, bankTransferFilter, bankTransferPage, debouncedBankSearch]);

  const handleDropdownClick = (event, itemId) => {
    event.stopPropagation();
    const buttonRect = event.currentTarget.getBoundingClientRect();
    setDropdownPosition({
      top: buttonRect.bottom + 5,
      right: window.innerWidth - buttonRect.right - 10,
    });
    setOpenDropdownId(openDropdownId === itemId ? null : itemId);
  };

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

  // ============================================
  // BANK TRANSFER FUNCTIONS
  // ============================================

  const fetchBankTransfers = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');

      const params = {
        status: bankTransferFilter,
        page: bankTransferPage,
        limit: itemsPerPage
      };

      if (debouncedBankSearch) {
        params.search = debouncedBankSearch;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/payments/bank-transfer/pending`,
        { headers: { Authorization: `Bearer ${token}` }, params }
      );

      setBankTransfers(response.data.data || []);
      setBankTransferTotalPages(response.data.pagination?.totalPages || 1);
      setBankTransferTotalItems(response.data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching bank transfers:', error);
      showToast('Failed to fetch bank transfers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchBankTransferStats = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/payments/bank-transfer/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBankTransferStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching bank transfer stats:', error);
    }
  };

  const handleApproveBankTransfer = async (paymentId) => {
    if (!window.confirm('Are you sure you want to approve this bank transfer payment?')) return;

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/payments/bank-transfer/${paymentId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showToast('Bank transfer payment approved successfully!', 'success');
        fetchBankTransfers();
        fetchBankTransferStats();
        fetchStats();
        setShowBankTransferDetailModal(false);
      }
    } catch (error) {
      console.error('Error approving bank transfer:', error);
      showToast(error.response?.data?.message || 'Failed to approve payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectBankTransfer = async () => {
    if (!bankRejectionReason.trim()) {
      showToast('Please provide a rejection reason', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/payments/bank-transfer/${selectedBankTransfer._id}/reject`,
        { rejectionReason: bankRejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showToast('Bank transfer payment rejected', 'warning');
        fetchBankTransfers();
        fetchBankTransferStats();
        setShowBankRejectModal(false);
        setShowBankTransferDetailModal(false);
        setBankRejectionReason('');
        setSelectedBankTransfer(null);
      }
    } catch (error) {
      console.error('Error rejecting bank transfer:', error);
      showToast(error.response?.data?.message || 'Failed to reject payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewBankTransferDetail = (payment) => {
    setSelectedBankTransfer(payment);
    setShowBankTransferDetailModal(true);
  };

  const handleViewBankProof = (url) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  // ============================================
  // PRE-ASSESSMENT FUNCTIONS
  // ============================================

  const fetchPreAssessments = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');

      const params = {
        page: currentPage,
        limit: itemsPerPage
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
        limit: itemsPerPage
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
      } else if (type === 'bank-transfer') {
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
      } else if (type === 'bank-transfer') {
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

  // ============ VERIFICATION HANDLERS ============
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

  // ============ INVOICE HANDLERS ============
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

  // ============ FORMATTING FUNCTIONS ============
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

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ============ BADGE FUNCTIONS ============
  const getPaymentStatusBadge = (status) => {
    const badges = {
      'pending': <span className="status-badge pending">Pending</span>,
      'for_verification': <span className="status-badge for-verification">Verifying</span>,
      'paid': <span className="status-badge paid">Paid</span>,
      'partial': <span className="status-badge partial">Partial</span>,
      'failed': <span className="status-badge failed">Failed</span>,
      'overdue': <span className="status-badge overdue">Overdue</span>,
      'waiting_verification': <span className="status-badge waiting">Waiting for Verification</span>,
      'verified': <span className="status-badge verified">Verified</span>,
      'rejected': <span className="status-badge rejected">Rejected</span>
    };
    return badges[status] || <span className="status-badge">{status}</span>;
  };

  const getBankTransferStatusBadge = (status) => {
    const badges = {
      'waiting_verification': <span className="status-badge waiting">Waiting for Verification</span>,
      'verified': <span className="status-badge verified">Verified</span>,
      'rejected': <span className="status-badge rejected">Rejected</span>
    };
    return badges[status] || <span className="status-badge">{status}</span>;
  };

  const getAssessmentStatusBadge = (status) => {
    const badges = {
      'pending_payment': <span className="status-badge pending">Pending</span>,
      'scheduled': <span className="status-badge scheduled">Scheduled</span>,
      'device_deployed': <span className="status-badge deployed">Deployed</span>,
      'data_collecting': <span className="status-badge collecting">Collecting</span>,
      'completed': <span className="status-badge paid">Completed</span>
    };
    return badges[status] || <span className="status-badge">{status}</span>;
  };

  const getInvoiceTypeBadge = (type) => {
    const badges = {
      'initial': <span className="invoice-type initial">Initial (30%)</span>,
      'progress': <span className="invoice-type progress">Progress (40%)</span>,
      'final': <span className="invoice-type final">Final (30%)</span>,
      'full': <span className="invoice-type full">Full (100%)</span>,
      'additional': <span className="invoice-type additional">Additional</span>
    };
    return badges[type] || <span className="invoice-type">{type}</span>;
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

  // ============ ACTION FUNCTIONS ============
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

  const getBankTransferActions = (payment) => {
    const actions = [
      {
        label: 'View Details',
        action: () => { handleViewBankTransferDetail(payment); setOpenDropdownId(null); }
      }
    ];

    if (payment.proofOfPayment) {
      actions.push(
        {
          label: 'View Proof',
          action: () => { handleViewBankProof(payment.proofOfPayment); setOpenDropdownId(null); }
        }
      );
    }

    if (payment.status === 'waiting_verification') {
      actions.push(
        {
          label: 'Approve Payment',
          action: () => { handleApproveBankTransfer(payment._id); setOpenDropdownId(null); },
          color: 'success'
        },
        {
          label: 'Reject Payment',
          action: () => { setSelectedBankTransfer(payment); setShowBankRejectModal(true); setOpenDropdownId(null); },
          color: 'danger'
        }
      );
    }

    if (payment.status === 'verified' && payment.receiptUrl) {
      actions.push(
        {
          label: 'View Receipt',
          action: () => handleViewReceipt(payment, 'bank-transfer'),
          color: 'info'
        },
        {
          label: 'Download Receipt',
          action: () => handleDownloadReceipt(payment, 'bank-transfer'),
          color: 'success'
        }
      );
    }

    return actions;
  };

  // ============ PAGINATION HELPERS ============
  const getPageNumbers = (totalPages, currentPage) => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  // ============ SKELETON LOADER ============
  const SkeletonLoader = () => (
    <div className="admin-billing">
      <div className="billing-header">
        <div className="skeleton-line large"></div>
        <div className="skeleton-button"></div>
      </div>
      <div className="billing-tabs">
        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-tab"></div>)}
      </div>
      <div className="filters-section">
        <div className="skeleton-select"></div>
        <div className="skeleton-search"></div>
      </div>
      <div className="payments-table-container">
        <div className="skeleton-table"></div>
      </div>
    </div>
  );

  if (loading && assessments.length === 0 && solarInvoices.length === 0 && bankTransfers.length === 0 && activeTab !== 'transactions') {
    return <SkeletonLoader />;
  }

  return (
    <>
      <Helmet>
        <title>Billing Management | Admin | Salfer Engineering</title>
      </Helmet>

      <div className="admin-billing">
        <div className="billing-header">
          <div>
            <h1>Billing Management</h1>
            <p>Manage invoices, verify payments, and track all transactions</p>
          </div>
          {activeTab === 'solar-invoices' && (
            <button className="create-invoice-btn" onClick={() => { setModalMode('create'); fetchProjects(); setShowInvoiceModal(true); }}>
              <FaPlus /> Create Solar Invoice
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="billing-tabs">
          <button className={`tab-btn ${activeTab === 'pre-assessments' ? 'active' : ''}`} onClick={() => { setActiveTab('pre-assessments'); setFilter('all'); setCurrentPage(1); }}>
            Pre-Assessments
            <span className="tab-badge">{stats.totalPreAssessments}</span>
          </button>
          <button className={`tab-btn ${activeTab === 'solar-invoices' ? 'active' : ''}`} onClick={() => { setActiveTab('solar-invoices'); setFilter('all'); setCurrentPage(1); }}>
            Solar Invoices
            <span className="tab-badge">{stats.totalSolarInvoices}</span>
          </button>
          <button className={`tab-btn ${activeTab === 'bank-transfers' ? 'active' : ''}`} onClick={() => { setActiveTab('bank-transfers'); setBankTransferFilter('waiting_verification'); setBankTransferPage(1); }}>
            <FaUniversity /> Bank Transfers
            {bankTransferStats?.waiting_verification > 0 && (
              <span className="tab-badge">{bankTransferStats.waiting_verification}</span>
            )}
          </button>
          <button className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => { setActiveTab('transactions'); setCurrentPage(1); }}>
            Transactions
          </button>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
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
              ) : activeTab === 'bank-transfers' ? (
                <>
                  <option value="waiting_verification">Waiting for Verification</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
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
          <div className="search-group">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={activeTab === 'bank-transfers' ? bankTransferSearch : searchTerm} 
              onChange={(e) => activeTab === 'bank-transfers' ? setBankTransferSearch(e.target.value) : setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        {/* PRE-ASSESSMENTS TABLE */}
        {activeTab === 'pre-assessments' && (
          <>
            <div className="payments-table-container">
              <table className="payments-table">
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
                    <tr><td colSpan="10" className="empty-state">No pre-assessments found</td></tr>
                  ) : (
                    assessments.map(assessment => {
                      const actions = getPreAssessmentActions(assessment);
                      const isOpen = openDropdownId === assessment._id;
                      const autoVerified = (assessment.paymentGateway === 'paymongo' || assessment.autoVerified === true) && assessment.paymentStatus === 'paid';

                      return (
                        <tr key={assessment._id}>
                          <td className="ref-cell">{assessment.bookingReference}</td>
                          <td>{assessment.invoiceNumber}</td>
                          <td><strong>{assessment.clientId?.contactFirstName} {assessment.clientId?.contactLastName}</strong></td>
                          <td>{formatDate(assessment.bookedAt)}</td>
                          <td className="amount">{formatCurrency(assessment.assessmentFee)}</td>
                          <td>{getGatewayBadge(assessment)}</td>
                          <td>{getPaymentStatusBadge(assessment.paymentStatus)}</td>
                          <td>{getAssessmentStatusBadge(assessment.assessmentStatus)}</td>
                          <td className="receipt-cell">
                            {assessment.receiptUrl ? (
                              <a href={assessment.receiptUrl} target="_blank" rel="noopener noreferrer" className="receipt-link" onClick={(e) => e.stopPropagation()}>
                                <FaReceipt /> View
                              </a>
                            ) : (
                              <span className="no-receipt">—</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center', position: 'relative' }}>
                            {autoVerified ? (
                              <span className="verified-badge auto-verified">Auto-Verified</span>
                            ) : assessment.paymentMethod === 'cash' && assessment.paymentStatus === 'paid' ? (
                              <span className="verified-badge">Verified</span>
                            ) : assessment.paymentStatus === 'failed' ? (
                              <span className="failed-badge">Failed</span>
                            ) : (
                              <div className="action-dropdown-container">
                                <button 
                                  className="action-dropdown-toggle" 
                                  ref={el => buttonRefs.current[assessment._id] = el}
                                  onClick={(e) => handleDropdownClick(e, assessment._id)}
                                >
                                  Action <FaChevronDown className={`dropdown-arrow ${isOpen ? 'open' : ''}`} />
                                </button>
                                {isOpen && (
                                  <div 
                                    className="action-dropdown-menu"
                                    ref={dropdownRef}
                                    style={{
                                      position: 'fixed',
                                      top: dropdownPosition.top,
                                      right: dropdownPosition.right,
                                      zIndex: 9999,
                                    }}
                                  >
                                    {actions.map((action, idx) => (
                                      <button key={idx} className={`dropdown-item ${action.color || ''}`} onClick={action.action}>
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
              <div className="pagination">
                <div className="pagination-info">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
                </div>
                <div className="pagination-controls">
                  <button className="page-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                    <FaChevronLeft /> Previous
                  </button>
                  
                  {getPageNumbers(totalPages, currentPage).map(page => (
                    <button
                      key={page}
                      className={`page-number ${currentPage === page ? 'active' : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button className="page-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                    Next <FaChevronRight />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* SOLAR INVOICES TABLE */}
        {activeTab === 'solar-invoices' && (
          <>
            <div className="payments-table-container">
              <table className="payments-table">
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
                    <tr><td colSpan="11" className="empty-state">No solar invoices found</td></tr>
                  ) : (
                    solarInvoices.map(invoice => {
                      const actions = getSolarInvoiceActions(invoice);
                      const isOpen = openDropdownId === invoice._id;
                      const autoVerified = invoice.paymentStatus === 'paid' && invoice.payments?.some(p => p.method === 'paymongo');

                      return (
                        <tr key={invoice._id}>
                          <td className="ref-cell">{invoice.invoiceNumber}</td>
                          <td><span className="project-id">{invoice.projectId?.projectReference || invoice.projectId?._id || 'N/A'}</span></td>
                          <td><strong>{invoice.clientId?.contactFirstName} {invoice.clientId?.contactLastName}</strong></td>
                          <td>{getInvoiceTypeBadge(invoice.invoiceType)}</td>
                          <td>{formatDate(invoice.dueDate)}</td>
                          <td className="amount">{formatCurrency(invoice.totalAmount)}</td>
                          <td className="amount">{formatCurrency(invoice.amountPaid)}</td>
                          <td className="amount balance">{formatCurrency(invoice.balance)}</td>
                          <td>{getPaymentStatusBadge(invoice.paymentStatus)}</td>
                          <td className="receipt-cell">
                            {invoice.receiptUrl ? (
                              <a href={invoice.receiptUrl} target="_blank" rel="noopener noreferrer" className="receipt-link" onClick={(e) => e.stopPropagation()}>
                                <FaReceipt /> View
                              </a>
                            ) : (
                              <span className="no-receipt">—</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center', position: 'relative' }}>
                            {autoVerified ? (
                              <span className="verified-badge auto-verified">Auto-Verified</span>
                            ) : (
                              <div className="action-dropdown-container">
                                <button 
                                  className="action-dropdown-toggle" 
                                  ref={el => buttonRefs.current[invoice._id] = el}
                                  onClick={(e) => handleDropdownClick(e, invoice._id)}
                                >
                                  Action <FaChevronDown className={`dropdown-arrow ${isOpen ? 'open' : ''}`} />
                                </button>
                                {isOpen && (
                                  <div 
                                    className="action-dropdown-menu"
                                    ref={dropdownRef}
                                    style={{
                                      position: 'fixed',
                                      top: dropdownPosition.top,
                                      right: dropdownPosition.right,
                                      zIndex: 9999,
                                    }}
                                  >
                                    {actions.map((action, idx) => (
                                      <button key={idx} className={`dropdown-item ${action.color || ''}`} onClick={action.action}>
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
              <div className="pagination">
                <div className="pagination-info">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
                </div>
                <div className="pagination-controls">
                  <button className="page-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                    <FaChevronLeft /> Previous
                  </button>
                  
                  {getPageNumbers(totalPages, currentPage).map(page => (
                    <button
                      key={page}
                      className={`page-number ${currentPage === page ? 'active' : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button className="page-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                    Next <FaChevronRight />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* BANK TRANSFERS TABLE */}
        {activeTab === 'bank-transfers' && (
          <>
            <div className="payments-table-container">
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Invoice #</th>
                    <th>Bank</th>
                    <th>Amount</th>
                    <th>Reference</th>
                    <th>Status</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bankTransfers.length === 0 ? (
                    <tr><td colSpan="8" className="empty-state">
                      <FaExclamationTriangle /> No bank transfer submissions found
                    </td></tr>
                  ) : (
                    bankTransfers.map(payment => {
                      const actions = getBankTransferActions(payment);
                      const isOpen = openDropdownId === payment._id;

                      return (
                        <tr key={payment._id} className={payment.status === 'rejected' ? 'rejected-row' : ''}>
                          <td>{formatDate(payment.createdAt)}</td>
                          <td className="customer-cell">
                            <div>
                              <strong>{payment.clientId?.contactFirstName} {payment.clientId?.contactLastName}</strong>
                              <small>{payment.clientEmail}</small>
                            </div>
                          </td>
                          <td className="invoice-cell">
                            <strong>{payment.invoiceId?.invoiceNumber}</strong>
                            <small>{payment.invoiceId?.invoiceType}</small>
                          </td>
                          <td><span className="bank-name">{payment.bankName}</span></td>
                          <td className="amount">{formatCurrency(payment.amount)}</td>
                          <td className="ref-cell">{payment.transactionReference}</td>
                          <td>{getBankTransferStatusBadge(payment.status)}</td>
                          <td style={{ textAlign: 'center', position: 'relative' }}>
                            <div className="action-dropdown-container">
                              <button 
                                className="action-dropdown-toggle" 
                                ref={el => buttonRefs.current[payment._id] = el}
                                onClick={(e) => handleDropdownClick(e, payment._id)}
                              >
                                Action <FaChevronDown className={`dropdown-arrow ${isOpen ? 'open' : ''}`} />
                              </button>
                              {isOpen && (
                                <div 
                                  className="action-dropdown-menu"
                                  ref={dropdownRef}
                                  style={{
                                    position: 'fixed',
                                    top: dropdownPosition.top,
                                    right: dropdownPosition.right,
                                    zIndex: 9999,
                                  }}
                                >
                                  {actions.map((action, idx) => (
                                    <button key={idx} className={`dropdown-item ${action.color || ''}`} onClick={action.action}>
                                      <span>{action.label}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {bankTransferTotalPages > 1 && (
              <div className="pagination">
                <div className="pagination-info">
                  Showing {((bankTransferPage - 1) * itemsPerPage) + 1} to {Math.min(bankTransferPage * itemsPerPage, bankTransferTotalItems)} of {bankTransferTotalItems} entries
                </div>
                <div className="pagination-controls">
                  <button className="page-btn" onClick={() => setBankTransferPage(p => Math.max(1, p - 1))} disabled={bankTransferPage === 1}>
                    <FaChevronLeft /> Previous
                  </button>
                  
                  {getPageNumbers(bankTransferTotalPages, bankTransferPage).map(page => (
                    <button
                      key={page}
                      className={`page-number ${bankTransferPage === page ? 'active' : ''}`}
                      onClick={() => setBankTransferPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button className="page-btn" onClick={() => setBankTransferPage(p => Math.min(bankTransferTotalPages, p + 1))} disabled={bankTransferPage === bankTransferTotalPages}>
                    Next <FaChevronRight />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* TRANSACTIONS TABLE */}
        {activeTab === 'transactions' && (
          <div className="payments-table-container">
            <table className="payments-table">
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
                  <tr><td colSpan="9" className="empty-state">No transactions found</td></tr>
                ) : (
                  transactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(transaction => (
                    <tr key={transaction.id}>
                      <td>{formatDate(transaction.date)}</td>
                      <td><span className={`transaction-type ${transaction.type === 'Pre-Assessment' ? 'pre' : 'project'}`}>{transaction.type}</span></td>
                      <td>{transaction.reference}</td>
                      <td>{transaction.invoiceNumber}</td>
                      <td><strong>{transaction.client}</strong></td>
                      <td className="amount">{formatCurrency(transaction.amount)}</td>
                      <td>{transaction.method?.toUpperCase()}</td>
                      <td>{getPaymentStatusBadge(transaction.status)}</td>
                      <td className="receipt-cell">
                        {transaction.receiptUrl ? (
                          <a href={transaction.receiptUrl} target="_blank" rel="noopener noreferrer" className="receipt-link">
                            <FaReceipt /> View
                          </a>
                        ) : (
                          <span className="no-receipt">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ============================================ */}
        {/* MODALS - Same as before, kept for functionality */}
        {/* ============================================ */}

        {/* Verify Payment Modal */}
        {showVerifyModal && selectedAssessment && (
          <div className="modal-overlay" onClick={() => setShowVerifyModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>Verify Payment</h3>
              <div className="modal-body">
                <div className="payment-details">
                  <div className="detail-row"><span>Ref:</span><strong>{selectedAssessment.bookingReference}</strong></div>
                  <div className="detail-row"><span>Amount:</span><strong>{formatCurrency(selectedAssessment.assessmentFee)}</strong></div>
                </div>
                {selectedAssessment.paymentProof && (
                  <div className="payment-proof">
                    <button className="view-proof-btn" onClick={() => window.open(selectedAssessment.paymentProof, '_blank')}>View Screenshot</button>
                  </div>
                )}
                <div className="verification-notes">
                  <label>Notes</label>
                  <textarea rows="3" value={verificationNote} onChange={(e) => setVerificationNote(e.target.value)} />
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowVerifyModal(false)}>Cancel</button>
                <button className="btn-reject" onClick={() => handleVerifyPayment(false)}>Reject</button>
                <button className="btn-verify" onClick={() => handleVerifyPayment(true)}>Verify</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Status Modal */}
        {showEditStatusModal && selectedAssessment && (
          <div className="modal-overlay" onClick={() => setShowEditStatusModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>Edit Status</h3>
              <div className="modal-body">
                <div className="detail-row"><span>Ref:</span><strong>{selectedAssessment.bookingReference}</strong></div>
                <div className="detail-row"><span>Amount:</span><strong>{formatCurrency(selectedAssessment.assessmentFee)}</strong></div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={editStatusData.paymentStatus} onChange={(e) => setEditStatusData({ ...editStatusData, paymentStatus: e.target.value })}>
                    <option value="">Select</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Cancel</option>
                  </select>
                </div>
                <div className="verification-notes">
                  <label>Notes</label>
                  <textarea rows="3" value={editStatusData.notes} onChange={(e) => setEditStatusData({ ...editStatusData, notes: e.target.value })} />
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowEditStatusModal(false)}>Cancel</button>
                <button className="btn-save" onClick={handleEditPaymentStatus} disabled={!editStatusData.paymentStatus || isSubmitting}>
                  {isSubmitting ? <FaSpinner className="spinning" /> : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Solar Verify Modal */}
        {showSolarVerifyModal && selectedInvoice && (
          <div className="modal-overlay" onClick={() => setShowSolarVerifyModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>Verify Invoice Payment</h3>
              <div className="modal-body">
                <div className="detail-row"><span>Invoice:</span><strong>{selectedInvoice.invoiceNumber}</strong></div>
                <div className="detail-row"><span>Amount:</span><strong>{formatCurrency(selectedInvoice.totalAmount)}</strong></div>
                <div className="verification-notes">
                  <label>Notes</label>
                  <textarea rows="3" value={verificationNote} onChange={(e) => setVerificationNote(e.target.value)} />
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowSolarVerifyModal(false)}>Cancel</button>
                <button className="btn-reject" onClick={() => handleVerifySolarPayment(false, selectedInvoice)}>Reject</button>
                <button className="btn-verify" onClick={() => handleVerifySolarPayment(true, selectedInvoice)}>Verify</button>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Modal - Create/View */}
        {showInvoiceModal && (
          <div className="modal-overlay" onClick={() => setShowInvoiceModal(false)}>
            <div className="modal-content invoice-modal" onClick={e => e.stopPropagation()}>
              <h3>{modalMode === 'create' ? 'Create Invoice' : 'Invoice Details'}</h3>
              {modalMode === 'create' ? (
                <div className="modal-body">
                  <div className="invoice-form">
                    <div className="form-group">
                      <label>Project *</label>
                      <select value={invoiceFormData.projectId} onChange={(e) => setInvoiceFormData({ ...invoiceFormData, projectId: e.target.value })}>
                        <option value="">Select project...</option>
                        {projects.map(p => <option key={p._id} value={p._id}>{p.projectName} - {p.projectReference}</option>)}
                      </select>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Type</label>
                        <select value={invoiceFormData.invoiceType} onChange={(e) => setInvoiceFormData({ ...invoiceFormData, invoiceType: e.target.value })}>
                          <option value="initial">Initial (30%)</option>
                          <option value="progress">Progress (40%)</option>
                          <option value="final">Final (30%)</option>
                          <option value="full">Full (100%)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Due Date *</label>
                        <input type="date" value={invoiceFormData.dueDate} onChange={(e) => setInvoiceFormData({ ...invoiceFormData, dueDate: e.target.value })} />
                      </div>
                    </div>
                    <div className="invoice-totals">
                      <div className="total-row"><span>Total:</span><strong>{formatCurrency(invoiceFormData.totalAmount)}</strong></div>
                    </div>
                  </div>
                </div>
              ) : (
                selectedInvoice && (
                  <>
                    <div className="modal-body">
                      <div className="invoice-view">
                        <div className="detail-section">
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
                    <div className="modal-actions">
                      <button className="btn-cancel" onClick={() => setShowInvoiceModal(false)}>Close</button>
                    </div>
                  </>
                )
              )}
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedInvoice && (
          <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>Record Payment</h3>
              <div className="modal-body">
                <div className="payment-info">
                  <p><strong>Invoice:</strong> {selectedInvoice.invoiceNumber}</p>
                  <p><strong>Balance:</strong> {formatCurrency(selectedInvoice.balance)}</p>
                </div>
                <div className="form-group">
                  <label>Amount *</label>
                  <input type="number" value={paymentData.amount} onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Method</label>
                  <select value={paymentData.method} onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}>
                    <option value="gcash">GCash</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Reference</label>
                  <input type="text" value={paymentData.reference} onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })} />
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button className="btn-record" onClick={handleRecordPayment} disabled={!paymentData.amount || isSubmitting}>
                  {isSubmitting ? 'Recording...' : 'Record'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal for Pre-assessment */}
        {showDetailModal && selectedAssessment && (
          <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>Pre-Assessment Details</h3>
              <div className="modal-body">
                <div className="detail-section">
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
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowDetailModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Bank Transfer Detail Modal */}
        {showBankTransferDetailModal && selectedBankTransfer && (
          <div className="modal-overlay" onClick={() => setShowBankTransferDetailModal(false)}>
            <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowBankTransferDetailModal(false)}><FaTimes /></button>
              
              <div className="modal-header">
                <div className="modal-title">
                  <h3>Bank Transfer Details</h3>
                  {getBankTransferStatusBadge(selectedBankTransfer.status)}
                </div>
                <div className="modal-subtitle">
                  <span>Submitted: {formatDateTime(selectedBankTransfer.createdAt)}</span>
                </div>
              </div>

              <div className="modal-body">
                {/* Customer Info */}
                <div className="detail-section">
                  <h4><FaUser /> Customer Information</h4>
                  <div className="detail-grid two-col">
                    <div>
                      <label>Name</label>
                      <p>{selectedBankTransfer.clientId?.contactFirstName} {selectedBankTransfer.clientId?.contactLastName}</p>
                    </div>
                    <div>
                      <label>Email</label>
                      <p>{selectedBankTransfer.clientEmail || 'N/A'}</p>
                    </div>
                    <div>
                      <label>Contact</label>
                      <p>{selectedBankTransfer.clientId?.contactNumber || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Invoice Info */}
                <div className="detail-section">
                  <h4><FaFileInvoice /> Invoice Information</h4>
                  <div className="detail-grid two-col">
                    <div>
                      <label>Invoice Number</label>
                      <p><strong>{selectedBankTransfer.invoiceId?.invoiceNumber}</strong></p>
                    </div>
                    <div>
                      <label>Invoice Type</label>
                      <p>{selectedBankTransfer.invoiceId?.invoiceType || 'N/A'}</p>
                    </div>
                    <div>
                      <label>Expected Amount</label>
                      <p className="amount">{formatCurrency(selectedBankTransfer.invoiceId?.totalAmount)}</p>
                    </div>
                    <div>
                      <label>Balance</label>
                      <p className="amount">{formatCurrency(selectedBankTransfer.invoiceId?.balance)}</p>
                    </div>
                  </div>
                </div>

                {/* Project Info */}
                <div className="detail-section">
                  <h4><FaBuilding /> Project Information</h4>
                  <div className="detail-grid two-col">
                    <div>
                      <label>Project Name</label>
                      <p>{selectedBankTransfer.projectId?.projectName || 'N/A'}</p>
                    </div>
                    <div>
                      <label>Project Reference</label>
                      <p>{selectedBankTransfer.projectId?.projectReference || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="detail-section">
                  <h4><FaMoneyBillWave /> Payment Information</h4>
                  <div className="detail-grid two-col">
                    <div>
                      <label>Bank Used</label>
                      <p><strong>{selectedBankTransfer.bankName}</strong></p>
                    </div>
                    <div>
                      <label>Account Name</label>
                      <p>{selectedBankTransfer.accountName || 'N/A'}</p>
                    </div>
                    <div>
                      <label>Transaction Reference</label>
                      <p><strong>{selectedBankTransfer.transactionReference}</strong></p>
                    </div>
                    <div>
                      <label>Amount Submitted</label>
                      <p className="amount">{formatCurrency(selectedBankTransfer.amount)}</p>
                    </div>
                    <div>
                      <label>Transfer Date</label>
                      <p>{formatDate(selectedBankTransfer.transferDate)}</p>
                    </div>
                    <div>
                      <label>Transfer Time</label>
                      <p>{selectedBankTransfer.transferTime}</p>
                    </div>
                  </div>
                </div>

                {/* Proof of Payment */}
                <div className="detail-section">
                  <h4>Proof of Payment</h4>
                  <div className="proof-container">
                    {selectedBankTransfer.proofOfPayment ? (
                      <div className="proof-actions">
                        <button className="proof-btn" onClick={() => handleViewBankProof(selectedBankTransfer.proofOfPayment)}>
                          <FaEye /> View Proof
                        </button>
                        <a href={selectedBankTransfer.proofOfPayment} download className="proof-btn download">
                          <FaDownload /> Download
                        </a>
                      </div>
                    ) : (
                      <p className="no-proof">No proof uploaded</p>
                    )}
                  </div>
                </div>

                {/* Remarks */}
                {selectedBankTransfer.remarks && (
                  <div className="detail-section">
                    <h4>Remarks</h4>
                    <p className="remarks-text">{selectedBankTransfer.remarks}</p>
                  </div>
                )}

                {/* Rejection Reason */}
                {selectedBankTransfer.status === 'rejected' && selectedBankTransfer.rejectionReason && (
                  <div className="detail-section rejected">
                    <h4><FaTimesCircle /> Rejection Reason</h4>
                    <p className="rejection-text">{selectedBankTransfer.rejectionReason}</p>
                  </div>
                )}

                {/* Receipt */}
                {selectedBankTransfer.status === 'verified' && selectedBankTransfer.receiptUrl && (
                  <div className="detail-section">
                    <h4><FaReceipt /> Receipt</h4>
                    <div className="receipt-actions">
                      <button className="receipt-btn" onClick={() => handleViewReceipt(selectedBankTransfer, 'bank-transfer')}>
                        <FaReceipt /> View Receipt
                      </button>
                      <span className="receipt-number">#{selectedBankTransfer.receiptNumber}</span>
                    </div>
                  </div>
                )}

                {/* Verification Info */}
                {selectedBankTransfer.status !== 'waiting_verification' && selectedBankTransfer.verifiedAt && (
                  <div className="detail-section">
                    <h4>Verification Info</h4>
                    <div className="detail-grid two-col">
                      <div>
                        <label>Verified By</label>
                        <p>{selectedBankTransfer.verifiedBy?.firstName} {selectedBankTransfer.verifiedBy?.lastName}</p>
                      </div>
                      <div>
                        <label>Verified At</label>
                        <p>{formatDateTime(selectedBankTransfer.verifiedAt)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                {selectedBankTransfer.status === 'waiting_verification' && (
                  <>
                    <button className="btn-reject" onClick={() => setShowBankRejectModal(true)} disabled={isSubmitting}>
                      Reject
                    </button>
                    <button className="btn-approve" onClick={() => handleApproveBankTransfer(selectedBankTransfer._id)} disabled={isSubmitting}>
                      {isSubmitting ? <FaSpinner className="spinning" /> : <FaCheckCircle />}
                      Approve Payment
                    </button>
                  </>
                )}
                <button className="btn-close" onClick={() => setShowBankTransferDetailModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Bank Transfer Reject Modal */}
        {showBankRejectModal && selectedBankTransfer && (
          <div className="modal-overlay" onClick={() => setShowBankRejectModal(false)}>
            <div className="modal-content reject-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Reject Bank Transfer Payment</h3>
                <button className="modal-close" onClick={() => setShowBankRejectModal(false)}><FaTimes /></button>
              </div>

              <div className="modal-body">
                <div className="reject-info">
                  <FaExclamationTriangle className="warning-icon" />
                  <p>You are about to reject this bank transfer payment.</p>
                  <div className="payment-summary">
                    <div><strong>Customer:</strong> {selectedBankTransfer.clientId?.contactFirstName} {selectedBankTransfer.clientId?.contactLastName}</div>
                    <div><strong>Invoice:</strong> {selectedBankTransfer.invoiceId?.invoiceNumber}</div>
                    <div><strong>Amount:</strong> {formatCurrency(selectedBankTransfer.amount)}</div>
                    <div><strong>Bank:</strong> {selectedBankTransfer.bankName}</div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Rejection Reason *</label>
                  <textarea
                    value={bankRejectionReason}
                    onChange={(e) => setBankRejectionReason(e.target.value)}
                    placeholder="Please explain why this payment is being rejected..."
                    rows="4"
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowBankRejectModal(false)}>Cancel</button>
                <button className="btn-reject-confirm" onClick={handleRejectBankTransfer} disabled={isSubmitting || !bankRejectionReason.trim()}>
                  {isSubmitting ? <FaSpinner className="spinning" /> : <FaTimes />}
                  Confirm Rejection
                </button>
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