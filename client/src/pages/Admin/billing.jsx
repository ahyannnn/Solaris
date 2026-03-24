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
  FaFileInvoice,
  FaMoneyBillWave,
  FaQrcode,
  FaClock,
  FaExclamationTriangle,
  FaDownload,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
  FaPlus,
  FaCreditCard,
  FaPrint,
  FaEnvelope,
  FaTrash,
  FaEdit,
  FaCheck,
  FaTimes,
  FaReceipt,
  FaHistory,
  FaChartLine,
  FaCalendarAlt,
  FaDollarSign,
  FaUsers,
  FaBuilding
} from 'react-icons/fa';
import '../../styles/Admin/billing.css';

const AdminBilling = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pre-assessments'); // 'pre-assessments', 'solar-invoices', 'transactions'
  
  // Pre-assessment state
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verificationNote, setVerificationNote] = useState('');
  
  // Solar Invoice state
  const [solarInvoices, setSolarInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
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
  
  // Transactions state
  const [transactions, setTransactions] = useState([]);
  
  // Projects for invoice creation
  const [projects, setProjects] = useState([]);
  
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    totalPreAssessments: 0,
    pending: 0,
    forVerification: 0,
    paidPre: 0,
    totalSolarInvoices: 0,
    paidSolar: 0,
    partial: 0,
    totalRevenue: 0,
    pendingAmount: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // view, create, edit

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
      
      setAssessments(response.data.assessments || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching pre-assessments:', error);
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
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      
      // Fetch all payments from both pre-assessments and solar invoices
      const [preRes, solarRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/solar-invoices`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      const prePayments = preRes.data.assessments
        .filter(a => a.paymentStatus === 'paid' || a.paymentStatus === 'for_verification')
        .map(a => ({
          id: a._id,
          type: 'Pre-Assessment',
          reference: a.bookingReference,
          invoiceNumber: a.invoiceNumber,
          amount: a.assessmentFee,
          method: a.paymentMethod || 'cash',
          status: a.paymentStatus,
          date: a.confirmedAt || a.bookedAt,
          client: `${a.clientId?.contactFirstName} ${a.clientId?.contactLastName}`
        }));
      
      const solarPayments = solarRes.data.invoices
        .filter(i => i.paymentStatus === 'paid' || i.paymentStatus === 'partial')
        .flatMap(i => i.payments.map(p => ({
          id: p._id,
          type: 'Solar Installation',
          reference: i.invoiceNumber,
          invoiceNumber: i.invoiceNumber,
          amount: p.amount,
          method: p.method,
          status: i.paymentStatus,
          date: p.date,
          client: `${i.clientId?.contactFirstName} ${i.clientId?.contactLastName}`
        })));
      
      setTransactions([...prePayments, ...solarPayments].sort((a, b) => new Date(b.date) - new Date(a.date)));
      setTotalPages(1);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = sessionStorage.getItem('token');
      
      const [preStatsRes, solarStatsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: {} })),
        axios.get(`${import.meta.env.VITE_API_URL}/api/solar-invoices/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { stats: {} } }))
      ]);
      
      setStats({
        totalPreAssessments: preStatsRes.data.total || 0,
        pending: preStatsRes.data.pending || 0,
        forVerification: preStatsRes.data.forVerification || 0,
        paidPre: preStatsRes.data.paid || 0,
        totalSolarInvoices: solarStatsRes.data.stats?.total || 0,
        paidSolar: solarStatsRes.data.stats?.paid || 0,
        partial: solarStatsRes.data.stats?.partial || 0,
        totalRevenue: (preStatsRes.data.totalRevenue || 0) + (solarStatsRes.data.stats?.totalRevenue || 0),
        pendingAmount: (preStatsRes.data.pendingRevenue || 0) + (solarStatsRes.data.stats?.pendingAmount || 0)
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

  const handleVerifyPayment = async (verified) => {
    if (!selectedAssessment) return;

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/pre-assessments/${selectedAssessment._id}/verify-payment`,
        {
          verified,
          notes: verificationNote
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      fetchPreAssessments();
      fetchStats();
      setShowVerifyModal(false);
      setSelectedAssessment(null);
      setVerificationNote('');
      alert(verified ? 'Payment verified successfully!' : 'Payment rejected');
    } catch (error) {
      console.error('Error verifying payment:', error);
      alert('Failed to verify payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSolarInvoice = async () => {
    if (!invoiceFormData.projectId || !invoiceFormData.totalAmount || !invoiceFormData.dueDate) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/solar-invoices`, 
        invoiceFormData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Invoice created successfully!');
      setShowInvoiceModal(false);
      resetInvoiceForm();
      fetchSolarInvoices();
      fetchStats();
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert(error.response?.data?.message || 'Failed to create invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedInvoice || !paymentData.amount) return;

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/solar-invoices/${selectedInvoice._id}/payment`,
        paymentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Payment recorded successfully!');
      setShowPaymentModal(false);
      setSelectedInvoice(null);
      setPaymentData({ amount: '', method: 'gcash', reference: '', notes: '' });
      fetchSolarInvoices();
      fetchStats();
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Failed to record payment');
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
      alert('Invoice sent to customer!');
      fetchSolarInvoices();
    } catch (error) {
      console.error('Error sending invoice:', error);
      alert('Failed to send invoice');
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
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Failed to download invoice');
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
      'pending': <span className="status-badge pending"><FaClock /> Pending</span>,
      'for_verification': <span className="status-badge for-verification"><FaQrcode /> For Verification</span>,
      'paid': <span className="status-badge paid"><FaCheckCircle /> Paid</span>,
      'partial': <span className="status-badge partial"><FaMoneyBillWave /> Partial</span>,
      'failed': <span className="status-badge failed"><FaTimesCircle /> Failed</span>,
      'overdue': <span className="status-badge overdue"><FaExclamationTriangle /> Overdue</span>
    };
    return badges[status] || <span className="status-badge">{status}</span>;
  };

  const getAssessmentStatusBadge = (status) => {
    const badges = {
      'pending_payment': <span className="status-badge pending">Pending Payment</span>,
      'scheduled': <span className="status-badge scheduled">Scheduled</span>,
      'device_deployed': <span className="status-badge deployed">Device Deployed</span>,
      'data_collecting': <span className="status-badge collecting">Data Collecting</span>,
      'completed': <span className="status-badge completed">Completed</span>
    };
    return badges[status] || <span className="status-badge">{status}</span>;
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

  if (loading && (activeTab === 'pre-assessments' ? assessments.length === 0 : solarInvoices.length === 0) && activeTab !== 'transactions') {
    return (
      <div className="billing-loading">
        <FaSpinner className="spinner" />
        <p>Loading billing data...</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Billing Management | Admin | Salfer Engineering</title>
      </Helmet>

      <div className="admin-billing">
        <div className="billing-header">
          <div>
            <h1><FaReceipt /> Billing Management</h1>
            <p>Manage invoices, verify payments, and track all transactions</p>
          </div>
          {activeTab === 'solar-invoices' && (
            <button className="create-invoice-btn" onClick={() => { setModalMode('create'); setShowInvoiceModal(true); }}>
              <FaPlus /> Create Solar Invoice
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="stats-cards">
          <div className="stat-card revenue">
            <div className="stat-icon"><FaDollarSign /></div>
            <div className="stat-info">
              <span className="stat-value">{formatCurrency(stats.totalRevenue)}</span>
              <span className="stat-label">Total Revenue</span>
            </div>
          </div>
          <div className="stat-card pending-amount">
            <div className="stat-icon"><FaClock /></div>
            <div className="stat-info">
              <span className="stat-value">{formatCurrency(stats.pendingAmount)}</span>
              <span className="stat-label">Pending Collection</span>
            </div>
          </div>
          <div className="stat-card pre-assessment">
            <div className="stat-icon"><FaFileInvoice /></div>
            <div className="stat-info">
              <span className="stat-value">{stats.totalPreAssessments}</span>
              <span className="stat-label">Pre-Assessments</span>
              <div className="stat-detail">
                <span>Paid: {stats.paidPre}</span>
                <span>Pending: {stats.pending}</span>
                <span>For Verification: {stats.forVerification}</span>
              </div>
            </div>
          </div>
          <div className="stat-card solar-invoice">
            <div className="stat-icon"><FaCreditCard /></div>
            <div className="stat-info">
              <span className="stat-value">{stats.totalSolarInvoices}</span>
              <span className="stat-label">Solar Invoices</span>
              <div className="stat-detail">
                <span>Paid: {stats.paidSolar}</span>
                <span>Partial: {stats.partial}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="billing-tabs">
          <button 
            className={`tab-btn ${activeTab === 'pre-assessments' ? 'active' : ''}`}
            onClick={() => { setActiveTab('pre-assessments'); setFilter('all'); setCurrentPage(1); }}
          >
            <FaFileInvoice /> Pre-Assessments
          </button>
          <button 
            className={`tab-btn ${activeTab === 'solar-invoices' ? 'active' : ''}`}
            onClick={() => { setActiveTab('solar-invoices'); setFilter('all'); setCurrentPage(1); }}
          >
            <FaCreditCard /> Solar Invoices
          </button>
          <button 
            className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => { setActiveTab('transactions'); setCurrentPage(1); }}
          >
            <FaHistory /> Transaction History
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
              ) : null}
            </select>
          </div>
          <div className="search-group">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by reference, invoice, or client name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Pre-Assessments Table */}
        {activeTab === 'pre-assessments' && (
          <div className="payments-table-container">
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Booking Ref</th>
                  <th>Invoice</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Payment Status</th>
                  <th>Assessment Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="empty-state">
                      <FaFileInvoice className="empty-icon" />
                      <p>No pre-assessments found</p>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(assessment => (
                    <tr key={assessment._id}>
                      <td className="ref-cell">{assessment.bookingReference}</td>
                      <td>{assessment.invoiceNumber}</td>
                      <td>
                        <div className="client-info">
                          <strong>{assessment.clientId?.contactFirstName} {assessment.clientId?.contactLastName}</strong>
                          <small>{assessment.clientId?.contactNumber}</small>
                        </div>
                      </td>
                      <td>{formatDate(assessment.bookedAt)}</td>
                      <td className="amount">{formatCurrency(assessment.assessmentFee)}</td>
                      <td>
                        {assessment.paymentMethod ? (
                          <span className="payment-method">
                            {assessment.paymentMethod === 'gcash' ? <FaQrcode /> : <FaMoneyBillWave />}
                            {assessment.paymentMethod.toUpperCase()}
                          </span>
                        ) : '-'}
                      </td>
                      <td>{getPaymentStatusBadge(assessment.paymentStatus)}</td>
                      <td>{getAssessmentStatusBadge(assessment.assessmentStatus)}</td>
                      <td className="actions">
                        {assessment.paymentStatus === 'for_verification' && (
                          <>
                            <button 
                              className="action-btn view-proof"
                              onClick={() => {
                                if (assessment.paymentProof) window.open(assessment.paymentProof, '_blank');
                              }}
                              title="View Payment Proof"
                            >
                              <FaEye />
                            </button>
                            <button 
                              className="action-btn verify"
                              onClick={() => {
                                setSelectedAssessment(assessment);
                                setShowVerifyModal(true);
                              }}
                              title="Verify Payment"
                            >
                              <FaCheckCircle />
                            </button>
                          </>
                        )}
                        {assessment.paymentStatus === 'pending' && (
                          <span className="no-action">Awaiting Payment</span>
                        )}
                        {assessment.paymentStatus === 'paid' && (
                          <span className="verified-badge"><FaCheckCircle /> Verified</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Solar Invoices Table */}
        {activeTab === 'solar-invoices' && (
          <div className="payments-table-container">
            <table className="payments-table">
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
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="empty-state">
                      <FaCreditCard className="empty-icon" />
                      <p>No solar invoices found</p>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(invoice => (
                    <tr key={invoice._id}>
                      <td className="ref-cell">{invoice.invoiceNumber}</td>
                      <td>{invoice.projectId?.projectName || 'N/A'}</td>
                      <td>
                        <div className="client-info">
                          <strong>{invoice.clientId?.contactFirstName} {invoice.clientId?.contactLastName}</strong>
                          <small>{invoice.clientId?.contactNumber}</small>
                        </div>
                      </td>
                      <td><span className={`invoice-type ${invoice.invoiceType}`}>{invoice.invoiceType}</span></td>
                      <td>{formatDate(invoice.issueDate)}</td>
                      <td>{formatDate(invoice.dueDate)}</td>
                      <td className="amount">{formatCurrency(invoice.totalAmount)}</td>
                      <td className="amount">{formatCurrency(invoice.amountPaid)}</td>
                      <td className="amount balance">{formatCurrency(invoice.balance)}</td>
                      <td>{getPaymentStatusBadge(invoice.paymentStatus)}</td>
                      <td className="actions">
                        <button 
                          className="action-btn view"
                          onClick={() => { setSelectedInvoice(invoice); setModalMode('view'); setShowInvoiceModal(true); }}
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <button 
                          className="action-btn download"
                          onClick={() => handleDownloadInvoice(invoice)}
                          title="Download PDF"
                        >
                          <FaDownload />
                        </button>
                        {invoice.status === 'draft' && (
                          <button 
                            className="action-btn send"
                            onClick={() => handleSendInvoice(invoice)}
                            title="Send to Customer"
                          >
                            <FaEnvelope />
                          </button>
                        )}
                        {(invoice.paymentStatus === 'pending' || invoice.paymentStatus === 'partial') && (
                          <button 
                            className="action-btn payment"
                            onClick={() => { setSelectedInvoice(invoice); setShowPaymentModal(true); }}
                            title="Record Payment"
                          >
                            <FaMoneyBillWave />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Transactions Table */}
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
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-state">
                      <FaHistory className="empty-icon" />
                      <p>No transactions found</p>
                    </td>
                  </tr>
                ) : (
                  transactions.map(transaction => (
                    <tr key={transaction.id}>
                      <td>{formatDate(transaction.date)}</td>
                      <td><span className={`transaction-type ${transaction.type === 'Pre-Assessment' ? 'pre' : 'solar'}`}>{transaction.type}</span></td>
                      <td>{transaction.reference}</td>
                      <td>{transaction.invoiceNumber}</td>
                      <td>{transaction.client}</td>
                      <td className="amount">{formatCurrency(transaction.amount)}</td>
                      <td><span className="payment-method">{transaction.method?.toUpperCase()}</span></td>
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
          <div className="pagination">
            <button 
              className="page-btn"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <FaChevronLeft /> Previous
            </button>
            <span className="page-info">Page {currentPage} of {totalPages}</span>
            <button 
              className="page-btn"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next <FaChevronRight />
            </button>
          </div>
        )}

        {/* Verify Payment Modal */}
        {showVerifyModal && selectedAssessment && (
          <div className="modal-overlay" onClick={() => setShowVerifyModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>Verify Payment</h3>
              
              <div className="modal-body">
                <div className="payment-details">
                  <div className="detail-row"><span>Booking Reference:</span><strong>{selectedAssessment.bookingReference}</strong></div>
                  <div className="detail-row"><span>Invoice Number:</span><strong>{selectedAssessment.invoiceNumber}</strong></div>
                  <div className="detail-row"><span>Client:</span><strong>{selectedAssessment.clientId?.contactFirstName} {selectedAssessment.clientId?.contactLastName}</strong></div>
                  <div className="detail-row"><span>Amount:</span><strong className="amount">{formatCurrency(selectedAssessment.assessmentFee)}</strong></div>
                  <div className="detail-row"><span>Payment Method:</span><strong>{selectedAssessment.paymentMethod?.toUpperCase()}</strong></div>
                  {selectedAssessment.paymentReference && (
                    <div className="detail-row"><span>Reference Number:</span><strong>{selectedAssessment.paymentReference}</strong></div>
                  )}
                </div>

                {selectedAssessment.paymentProof && (
                  <div className="payment-proof">
                    <label>Payment Proof:</label>
                    <button className="view-proof-btn" onClick={() => window.open(selectedAssessment.paymentProof, '_blank')}>
                      <FaEye /> View Screenshot
                    </button>
                  </div>
                )}

                <div className="verification-notes">
                  <label>Verification Notes (Optional):</label>
                  <textarea rows="3" value={verificationNote} onChange={(e) => setVerificationNote(e.target.value)} placeholder="Add any notes about this verification..." />
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowVerifyModal(false)}>Cancel</button>
                <button className="btn-reject" onClick={() => handleVerifyPayment(false)}><FaTimesCircle /> Reject Payment</button>
                <button className="btn-verify" onClick={() => handleVerifyPayment(true)}><FaCheckCircle /> Verify & Confirm</button>
              </div>
            </div>
          </div>
        )}

        {/* Create/View Solar Invoice Modal */}
        {showInvoiceModal && (
          <div className="modal-overlay" onClick={() => setShowInvoiceModal(false)}>
            <div className="modal-content invoice-modal" onClick={e => e.stopPropagation()}>
              <h3>{modalMode === 'create' ? 'Create Solar Invoice' : 'Invoice Details'}</h3>
              
              {modalMode === 'create' ? (
                <div className="invoice-form">
                  <div className="form-group">
                    <label>Select Project *</label>
                    <select value={invoiceFormData.projectId} onChange={(e) => setInvoiceFormData({ ...invoiceFormData, projectId: e.target.value })}>
                      <option value="">Select a project...</option>
                      {projects.map(project => (
                        <option key={project._id} value={project._id}>{project.projectName} - {project.projectReference}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Invoice Type</label>
                      <select value={invoiceFormData.invoiceType} onChange={(e) => setInvoiceFormData({ ...invoiceFormData, invoiceType: e.target.value })}>
                        <option value="initial">Initial Payment (30%)</option>
                        <option value="progress">Progress Payment (40%)</option>
                        <option value="final">Final Payment (30%)</option>
                        <option value="full">Full Payment</option>
                        <option value="additional">Additional Work</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Due Date *</label>
                      <input type="date" value={invoiceFormData.dueDate} onChange={(e) => setInvoiceFormData({ ...invoiceFormData, dueDate: e.target.value })} />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <input type="text" value={invoiceFormData.description} onChange={(e) => setInvoiceFormData({ ...invoiceFormData, description: e.target.value })} placeholder="Invoice description" />
                  </div>

                  <label>Invoice Items</label>
                  {invoiceFormData.items.map((item, index) => (
                    <div key={index} className="invoice-item-row">
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
                      <span className="item-total">{formatCurrency(item.total)}</span>
                      {invoiceFormData.items.length > 1 && (
                        <button type="button" className="remove-item" onClick={() => removeInvoiceItem(index)}><FaTrash /></button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="add-item-btn" onClick={addInvoiceItem}><FaPlus /> Add Item</button>

                  <div className="invoice-totals">
                    <div className="total-row"><span>Subtotal:</span><span>{formatCurrency(invoiceFormData.subtotal)}</span></div>
                    <div className="total-row"><span>Tax (12%):</span><span>{formatCurrency(invoiceFormData.tax)}</span></div>
                    <div className="total-row"><span>Discount:</span><input type="number" value={invoiceFormData.discount} onChange={(e) => {
                      setInvoiceFormData({ ...invoiceFormData, discount: parseFloat(e.target.value) });
                      calculateTotals();
                    }} /></div>
                    <div className="total-row grand-total"><strong>Total:</strong><strong>{formatCurrency(invoiceFormData.totalAmount)}</strong></div>
                  </div>

                  <div className="modal-actions">
                    <button className="cancel-btn" onClick={() => setShowInvoiceModal(false)}>Cancel</button>
                    <button className="create-btn" onClick={handleCreateSolarInvoice} disabled={isSubmitting}>
                      {isSubmitting ? <><FaSpinner className="spinner" /> Creating...</> : 'Create Invoice'}
                    </button>
                  </div>
                </div>
              ) : (
                selectedInvoice && (
                  <div className="invoice-view">
                    <div className="detail-section"><h4>Invoice Information</h4>
                      <p><strong>Invoice #:</strong> {selectedInvoice.invoiceNumber}</p>
                      <p><strong>Project:</strong> {selectedInvoice.projectId?.projectName}</p>
                      <p><strong>Type:</strong> {selectedInvoice.invoiceType}</p>
                      <p><strong>Status:</strong> {getPaymentStatusBadge(selectedInvoice.paymentStatus)}</p>
                      <p><strong>Issue Date:</strong> {formatDate(selectedInvoice.issueDate)}</p>
                      <p><strong>Due Date:</strong> {formatDate(selectedInvoice.dueDate)}</p>
                    </div>
                    <div className="detail-section"><h4>Client Information</h4>
                      <p><strong>Name:</strong> {selectedInvoice.clientId?.contactFirstName} {selectedInvoice.clientId?.contactLastName}</p>
                      <p><strong>Email:</strong> {selectedInvoice.clientId?.userId?.email}</p>
                      <p><strong>Contact:</strong> {selectedInvoice.clientId?.contactNumber}</p>
                    </div>
                    <div className="detail-section"><h4>Items</h4>
                      <table className="items-table"><thead><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
                      <tbody>{selectedInvoice.items?.map((item, idx) => (
                        <tr key={idx}><td>{item.name}</td><td>{item.quantity}</td><td>{formatCurrency(item.unitPrice)}</td><td>{formatCurrency(item.total)}</td></tr>
                      ))}</tbody></table>
                      <div className="totals"><div>Subtotal: {formatCurrency(selectedInvoice.subtotal)}</div><div>Tax: {formatCurrency(selectedInvoice.tax)}</div><div>Discount: {formatCurrency(selectedInvoice.discount)}</div><div className="grand"><strong>Total: {formatCurrency(selectedInvoice.totalAmount)}</strong></div></div>
                    </div>
                    <div className="modal-actions"><button className="cancel-btn" onClick={() => setShowInvoiceModal(false)}>Close</button></div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Record Payment Modal */}
        {showPaymentModal && selectedInvoice && (
          <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>Record Payment</h3>
              <div className="payment-info"><p><strong>Invoice:</strong> {selectedInvoice.invoiceNumber}</p><p><strong>Total Amount:</strong> {formatCurrency(selectedInvoice.totalAmount)}</p><p><strong>Paid:</strong> {formatCurrency(selectedInvoice.amountPaid)}</p><p><strong>Balance:</strong> {formatCurrency(selectedInvoice.balance)}</p></div>
              <div className="form-group"><label>Payment Amount *</label><input type="number" value={paymentData.amount} onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })} placeholder="Enter amount" /></div>
              <div className="form-group"><label>Payment Method</label><select value={paymentData.method} onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}><option value="gcash">GCash</option><option value="bank_transfer">Bank Transfer</option><option value="cash">Cash</option><option value="check">Check</option></select></div>
              <div className="form-group"><label>Reference Number</label><input type="text" value={paymentData.reference} onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })} placeholder="Transaction reference" /></div>
              <div className="form-group"><label>Notes</label><textarea rows="2" value={paymentData.notes} onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })} placeholder="Add notes..." /></div>
              <div className="modal-actions"><button className="cancel-btn" onClick={() => setShowPaymentModal(false)}>Cancel</button><button className="record-btn" onClick={handleRecordPayment} disabled={!paymentData.amount || isSubmitting}>{isSubmitting ? <><FaSpinner className="spinner" /> Recording...</> : 'Record Payment'}</button></div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminBilling;