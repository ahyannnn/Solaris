// pages/Admin/BankTransferVerification.jsx
import React, { useState, useEffect, useRef } from 'react';
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
  FaFilter,
  FaClock,
  FaMoneyBillWave,
  FaUniversity,
  FaUser,
  FaFileInvoice,
  FaCalendarAlt,
  FaBuilding,
  FaReceipt,
  FaTimes,
  FaCheck,
  FaExclamationTriangle,
  FaBank
} from 'react-icons/fa';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import '../../styles/Admin/bankTransferVerification.css';

const BankTransferVerification = () => {
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('waiting_verification');
  const [bankFilter, setBankFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Bank options
  const bankOptions = [
    { id: 'all', name: 'All Banks' },
    { id: 'BPI', name: 'BPI' },
    { id: 'UnionBank', name: 'UnionBank' },
    { id: 'BDO', name: 'BDO' },
    { id: 'Metrobank', name: 'Metrobank' },
    { id: 'Landbank', name: 'Landbank' },
    { id: 'Security Bank', name: 'Security Bank' },
    { id: 'China Bank', name: 'China Bank' },
    { id: 'PNB', name: 'PNB' },
    { id: 'EastWest Bank', name: 'EastWest Bank' },
    { id: 'RCBC', name: 'RCBC' }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, bankFilter, debouncedSearchTerm]);

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, [statusFilter, bankFilter, debouncedSearchTerm, currentPage]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');

      const params = {
        status: statusFilter,
        bank: bankFilter,
        search: debouncedSearchTerm,
        page: currentPage,
        limit: 20
      };

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/payments/bank-transfer/pending`,
        { headers: { Authorization: `Bearer ${token}` }, params }
      );

      setPayments(response.data.data || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
      setTotalItems(response.data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching payments:', error);
      showToast('Failed to fetch bank transfer payments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/payments/bank-transfer/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleApprove = async (paymentId) => {
    if (!window.confirm('Are you sure you want to approve this payment?')) return;

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/payments/bank-transfer/${paymentId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showToast('Payment approved successfully!', 'success');
        fetchPayments();
        fetchStats();
        setShowDetailModal(false);
      }
    } catch (error) {
      console.error('Error approving payment:', error);
      showToast(error.response?.data?.message || 'Failed to approve payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      showToast('Please provide a rejection reason', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/payments/bank-transfer/${selectedPayment._id}/reject`,
        { rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        showToast('Payment rejected successfully', 'warning');
        fetchPayments();
        fetchStats();
        setShowRejectModal(false);
        setShowDetailModal(false);
        setRejectionReason('');
        setSelectedPayment(null);
      }
    } catch (error) {
      console.error('Error rejecting payment:', error);
      showToast(error.response?.data?.message || 'Failed to reject payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetail = (payment) => {
    setSelectedPayment(payment);
    setShowDetailModal(true);
  };

  const handleViewProof = (url) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleViewReceipt = (url) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
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

  const getStatusBadge = (status) => {
    const badges = {
      'waiting_verification': <span className="status-badge waiting">Waiting for Verification</span>,
      'verified': <span className="status-badge verified">Verified</span>,
      'rejected': <span className="status-badge rejected">Rejected</span>
    };
    return badges[status] || <span className="status-badge">{status}</span>;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'waiting_verification': return <FaClock className="status-icon waiting" />;
      case 'verified': return <FaCheckCircle className="status-icon verified" />;
      case 'rejected': return <FaTimesCircle className="status-icon rejected" />;
      default: return null;
    }
  };

  const SkeletonLoader = () => (
    <div className="bank-transfer-verification">
      <div className="header-section">
        <div className="skeleton-line large"></div>
        <div className="skeleton-line medium"></div>
      </div>
      <div className="stats-grid">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="skeleton-stat"></div>
        ))}
      </div>
      <div className="filter-section">
        <div className="skeleton-filter"></div>
        <div className="skeleton-filter"></div>
        <div className="skeleton-search"></div>
      </div>
      <div className="table-container">
        <div className="skeleton-table"></div>
      </div>
    </div>
  );

  if (loading && payments.length === 0) {
    return <SkeletonLoader />;
  }

  return (
    <>
      <Helmet>
        <title>Bank Transfer Verification | Admin | Salfer Engineering</title>
      </Helmet>

      <div className="bank-transfer-verification">
        {/* Header */}
        <div className="header-section">
          <div>
            <h1>Bank Transfer Verification</h1>
            <p>Manage and verify manual bank transfer payments from customers</p>
          </div>
          <div className="header-actions">
            <button className="refresh-btn" onClick={() => { fetchPayments(); fetchStats(); }}>
              <FaSpinner className={loading ? 'spinning' : ''} /> Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card total">
              <div className="stat-icon"><FaMoneyBillWave /></div>
              <div className="stat-info">
                <span className="stat-value">{stats.total}</span>
                <span className="stat-label">Total Submissions</span>
              </div>
            </div>
            <div className="stat-card waiting">
              <div className="stat-icon"><FaClock /></div>
              <div className="stat-info">
                <span className="stat-value">{stats.waiting_verification}</span>
                <span className="stat-label">Waiting for Verification</span>
              </div>
            </div>
            <div className="stat-card verified">
              <div className="stat-icon"><FaCheckCircle /></div>
              <div className="stat-info">
                <span className="stat-value">{stats.verified}</span>
                <span className="stat-label">Verified</span>
                <span className="stat-amount">{formatCurrency(stats.verifiedAmount)}</span>
              </div>
            </div>
            <div className="stat-card rejected">
              <div className="stat-icon"><FaTimesCircle /></div>
              <div className="stat-info">
                <span className="stat-value">{stats.rejected}</span>
                <span className="stat-label">Rejected</span>
              </div>
            </div>
            <div className="stat-card amount">
              <div className="stat-icon"><FaMoneyBillWave /></div>
              <div className="stat-info">
                <span className="stat-value">{formatCurrency(stats.totalAmount)}</span>
                <span className="stat-label">Total Amount</span>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="filter-section">
          <div className="filter-group">
            <label><FaFilter /> Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="waiting_verification">Waiting for Verification</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="filter-group">
            <label><FaBank /> Bank</label>
            <select value={bankFilter} onChange={(e) => setBankFilter(e.target.value)}>
              {bankOptions.map(bank => (
                <option key={bank.id} value={bank.id}>{bank.name}</option>
              ))}
            </select>
          </div>

          <div className="search-group">
            <label><FaSearch /> Search</label>
            <div className="search-input-wrapper">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by reference, customer, or invoice..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="clear-search" onClick={() => setSearchTerm('')}>×</button>
              )}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="results-count">
          <p>Showing {payments.length} of {totalItems} submission(s)</p>
        </div>

        {/* Table */}
        <div className="table-container">
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-state">
                    <FaExclamationTriangle />
                    <p>No bank transfer submissions found</p>
                    <span>Try adjusting your filters</span>
                  </td>
                </tr>
              ) : (
                payments.map(payment => (
                  <tr key={payment._id} className={payment.status}>
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
                    <td>
                      <span className="bank-name">{payment.bankName}</span>
                    </td>
                    <td className="amount-cell">{formatCurrency(payment.amount)}</td>
                    <td className="ref-cell">{payment.transactionReference}</td>
                    <td>{getStatusBadge(payment.status)}</td>
                    <td className="actions-cell">
                      <button
                        className="action-btn view"
                        onClick={() => handleViewDetail(payment)}
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      {payment.status === 'waiting_verification' && (
                        <>
                          <button
                            className="action-btn approve"
                            onClick={() => handleApprove(payment._id)}
                            disabled={isSubmitting}
                            title="Approve Payment"
                          >
                            <FaCheck />
                          </button>
                          <button
                            className="action-btn reject"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowRejectModal(true);
                            }}
                            disabled={isSubmitting}
                            title="Reject Payment"
                          >
                            <FaTimes />
                          </button>
                        </>
                      )}
                      {payment.status === 'verified' && payment.receiptUrl && (
                        <button
                          className="action-btn receipt"
                          onClick={() => handleViewReceipt(payment.receiptUrl)}
                          title="View Receipt"
                        >
                          <FaReceipt />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="page-btn"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <FaChevronLeft /> Previous
            </button>
            <span className="page-info">
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="page-btn"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next <FaChevronRight />
            </button>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedPayment && (
          <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
            <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>
                <FaTimes />
              </button>

              <div className="modal-header">
                <div className="modal-title">
                  <h3>Payment Details</h3>
                  {getStatusBadge(selectedPayment.status)}
                </div>
                <div className="modal-subtitle">
                  <span>Submitted: {formatDateTime(selectedPayment.createdAt)}</span>
                </div>
              </div>

              <div className="modal-body">
                {/* Customer Info */}
                <div className="detail-section">
                  <h4><FaUser /> Customer Information</h4>
                  <div className="detail-grid two-col">
                    <div>
                      <label>Name</label>
                      <p>{selectedPayment.clientId?.contactFirstName} {selectedPayment.clientId?.contactLastName}</p>
                    </div>
                    <div>
                      <label>Email</label>
                      <p>{selectedPayment.clientEmail || 'N/A'}</p>
                    </div>
                    <div>
                      <label>Contact</label>
                      <p>{selectedPayment.clientId?.contactNumber || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Invoice Info */}
                <div className="detail-section">
                  <h4><FaFileInvoice /> Invoice Information</h4>
                  <div className="detail-grid two-col">
                    <div>
                      <label>Invoice Number</label>
                      <p><strong>{selectedPayment.invoiceId?.invoiceNumber}</strong></p>
                    </div>
                    <div>
                      <label>Invoice Type</label>
                      <p>{selectedPayment.invoiceId?.invoiceType || 'N/A'}</p>
                    </div>
                    <div>
                      <label>Expected Amount</label>
                      <p className="amount">{formatCurrency(selectedPayment.invoiceId?.totalAmount)}</p>
                    </div>
                    <div>
                      <label>Balance</label>
                      <p className="amount">{formatCurrency(selectedPayment.invoiceId?.balance)}</p>
                    </div>
                  </div>
                </div>

                {/* Project Info */}
                <div className="detail-section">
                  <h4><FaBuilding /> Project Information</h4>
                  <div className="detail-grid two-col">
                    <div>
                      <label>Project Name</label>
                      <p>{selectedPayment.projectId?.projectName || 'N/A'}</p>
                    </div>
                    <div>
                      <label>Project Reference</label>
                      <p>{selectedPayment.projectId?.projectReference || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="detail-section">
                  <h4><FaMoneyBillWave /> Payment Information</h4>
                  <div className="detail-grid two-col">
                    <div>
                      <label>Bank Used</label>
                      <p><strong>{selectedPayment.bankName}</strong></p>
                    </div>
                    <div>
                      <label>Account Name</label>
                      <p>{selectedPayment.accountName || 'N/A'}</p>
                    </div>
                    <div>
                      <label>Transaction Reference</label>
                      <p><strong>{selectedPayment.transactionReference}</strong></p>
                    </div>
                    <div>
                      <label>Amount Submitted</label>
                      <p className="amount">{formatCurrency(selectedPayment.amount)}</p>
                    </div>
                    <div>
                      <label>Transfer Date</label>
                      <p>{formatDate(selectedPayment.transferDate)}</p>
                    </div>
                    <div>
                      <label>Transfer Time</label>
                      <p>{selectedPayment.transferTime}</p>
                    </div>
                  </div>
                </div>

                {/* Proof of Payment */}
                <div className="detail-section">
                  <h4>📎 Proof of Payment</h4>
                  <div className="proof-container">
                    {selectedPayment.proofOfPayment ? (
                      <div className="proof-actions">
                        <button
                          className="proof-btn"
                          onClick={() => handleViewProof(selectedPayment.proofOfPayment)}
                        >
                          View Proof
                        </button>
                        <a
                          href={selectedPayment.proofOfPayment}
                          download
                          className="proof-btn download"
                        >
                          <FaDownload /> Download
                        </a>
                      </div>
                    ) : (
                      <p className="no-proof">No proof uploaded</p>
                    )}
                  </div>
                </div>

                {/* Remarks */}
                {selectedPayment.remarks && (
                  <div className="detail-section">
                    <h4>Remarks</h4>
                    <p className="remarks-text">{selectedPayment.remarks}</p>
                  </div>
                )}

                {/* Rejection Reason */}
                {selectedPayment.status === 'rejected' && selectedPayment.rejectionReason && (
                  <div className="detail-section rejected">
                    <h4><FaTimesCircle /> Rejection Reason</h4>
                    <p className="rejection-text">{selectedPayment.rejectionReason}</p>
                  </div>
                )}

                {/* Receipt */}
                {selectedPayment.status === 'verified' && selectedPayment.receiptUrl && (
                  <div className="detail-section">
                    <h4><FaReceipt /> Receipt</h4>
                    <div className="receipt-actions">
                      <button
                        className="receipt-btn"
                        onClick={() => handleViewReceipt(selectedPayment.receiptUrl)}
                      >
                        <FaReceipt /> View Receipt
                      </button>
                      <span className="receipt-number">#{selectedPayment.receiptNumber}</span>
                    </div>
                  </div>
                )}

                {/* Verification Info */}
                {selectedPayment.status !== 'waiting_verification' && selectedPayment.verifiedAt && (
                  <div className="detail-section">
                    <h4>Verification Info</h4>
                    <div className="detail-grid two-col">
                      <div>
                        <label>Verified By</label>
                        <p>{selectedPayment.verifiedBy?.firstName} {selectedPayment.verifiedBy?.lastName}</p>
                      </div>
                      <div>
                        <label>Verified At</label>
                        <p>{formatDateTime(selectedPayment.verifiedAt)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                {selectedPayment.status === 'waiting_verification' && (
                  <>
                    <button
                      className="btn-reject"
                      onClick={() => {
                        setShowRejectModal(true);
                      }}
                      disabled={isSubmitting}
                    >
                      Reject
                    </button>
                    <button
                      className="btn-approve"
                      onClick={() => handleApprove(selectedPayment._id)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <FaSpinner className="spinning" /> : <FaCheck />}
                      Approve Payment
                    </button>
                  </>
                )}
                <button className="btn-close" onClick={() => setShowDetailModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && selectedPayment && (
          <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
            <div className="modal-content reject-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Reject Payment</h3>
                <button className="modal-close" onClick={() => setShowRejectModal(false)}>
                  <FaTimes />
                </button>
              </div>

              <div className="modal-body">
                <div className="reject-info">
                  <FaExclamationTriangle className="warning-icon" />
                  <p>You are about to reject this payment submission.</p>
                  <div className="payment-summary">
                    <div><strong>Customer:</strong> {selectedPayment.clientId?.contactFirstName} {selectedPayment.clientId?.contactLastName}</div>
                    <div><strong>Invoice:</strong> {selectedPayment.invoiceId?.invoiceNumber}</div>
                    <div><strong>Amount:</strong> {formatCurrency(selectedPayment.amount)}</div>
                    <div><strong>Bank:</strong> {selectedPayment.bankName}</div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Rejection Reason *</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please explain why this payment is being rejected..."
                    rows="4"
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowRejectModal(false)}>
                  Cancel
                </button>
                <button
                  className="btn-reject-confirm"
                  onClick={handleReject}
                  disabled={isSubmitting || !rejectionReason.trim()}
                >
                  {isSubmitting ? <FaSpinner className="spinning" /> : <FaTimes />}
                  Confirm Rejection
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
          position="bottom-right"
        />
      </div>
    </>
  );
};

export default BankTransferVerification;