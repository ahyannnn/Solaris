// pages/Admin/billing.jsx
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
  FaChevronRight
} from 'react-icons/fa';
import '../../styles/Admin/billing.css';

const AdminBilling = () => {
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verificationNote, setVerificationNote] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    forVerification: 0,
    paid: 0,
    failed: 0
  });

  useEffect(() => {
    fetchAssessments();
    fetchStats();
  }, [filter, currentPage]);

  const fetchAssessments = async () => {
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
      console.error('Error fetching assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleVerifyPayment = async (verified) => {
    if (!selectedAssessment) return;

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
      
      // Refresh data
      fetchAssessments();
      fetchStats();
      setShowVerifyModal(false);
      setSelectedAssessment(null);
      setVerificationNote('');
    } catch (error) {
      console.error('Error verifying payment:', error);
      alert('Failed to verify payment. Please try again.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPaymentStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return <span className="status-badge pending"><FaClock /> Pending</span>;
      case 'for_verification':
        return <span className="status-badge for-verification"><FaQrcode /> For Verification</span>;
      case 'paid':
        return <span className="status-badge paid"><FaCheckCircle /> Paid</span>;
      case 'failed':
        return <span className="status-badge failed"><FaTimesCircle /> Failed</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  const getAssessmentStatusBadge = (status) => {
    switch(status) {
      case 'pending_payment':
        return <span className="status-badge pending">Pending Payment</span>;
      case 'scheduled':
        return <span className="status-badge scheduled">Scheduled</span>;
      case 'device_deployed':
        return <span className="status-badge deployed">Device Deployed</span>;
      case 'data_collecting':
        return <span className="status-badge collecting">Data Collecting</span>;
      case 'completed':
        return <span className="status-badge completed">Completed</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  const filteredAssessments = assessments.filter(assessment => {
    if (!searchTerm) return true;
    return assessment.bookingReference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           assessment.clientId?.contactFirstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           assessment.clientId?.contactLastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           assessment.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleViewPaymentProof = (assessment) => {
    if (assessment.paymentProof) {
      window.open(assessment.paymentProof, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="billing-loading">
        <FaSpinner className="spinner" />
        <p>Loading payment requests...</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Payment Verification | Admin | Salfer Engineering</title>
      </Helmet>

      <div className="admin-billing">
        <div className="billing-header">
          <h1>Payment Verification</h1>
          <p>Review and verify customer payments for pre-assessments</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-cards">
          <div className="stat-card total">
            <div className="stat-icon"><FaFileInvoice /></div>
            <div className="stat-info">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total Payments</span>
            </div>
          </div>
          <div className="stat-card pending">
            <div className="stat-icon"><FaClock /></div>
            <div className="stat-info">
              <span className="stat-value">{stats.pending}</span>
              <span className="stat-label">Pending</span>
            </div>
          </div>
          <div className="stat-card for-verification">
            <div className="stat-icon"><FaQrcode /></div>
            <div className="stat-info">
              <span className="stat-value">{stats.forVerification}</span>
              <span className="stat-label">For Verification</span>
            </div>
          </div>
          <div className="stat-card paid">
            <div className="stat-icon"><FaCheckCircle /></div>
            <div className="stat-info">
              <span className="stat-value">{stats.paid}</span>
              <span className="stat-label">Verified & Paid</span>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="filters-section">
          <div className="filter-tabs">
            <button 
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              Pending
            </button>
            <button 
              className={`filter-tab ${filter === 'for_verification' ? 'active' : ''}`}
              onClick={() => setFilter('for_verification')}
            >
              For Verification
            </button>
            <button 
              className={`filter-tab ${filter === 'paid' ? 'active' : ''}`}
              onClick={() => setFilter('paid')}
            >
              Paid
            </button>
          </div>

          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by reference, invoice, or client name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Payments Table */}
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
              {filteredAssessments.length === 0 ? (
                <tr>
                  <td colSpan="9" className="empty-state">
                    <FaFileInvoice className="empty-icon" />
                    <p>No payment requests found</p>
                  </td>
                </tr>
              ) : (
                filteredAssessments.map(assessment => (
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
                            onClick={() => handleViewPaymentProof(assessment)}
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
                        <span className="verified-badge">
                          <FaCheckCircle /> Verified
                        </span>
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

        {/* Verification Modal */}
        {showVerifyModal && selectedAssessment && (
          <div className="modal-overlay" onClick={() => setShowVerifyModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>Verify Payment</h3>
              
              <div className="modal-body">
                <div className="payment-details">
                  <div className="detail-row">
                    <span>Booking Reference:</span>
                    <strong>{selectedAssessment.bookingReference}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Invoice Number:</span>
                    <strong>{selectedAssessment.invoiceNumber}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Client:</span>
                    <strong>{selectedAssessment.clientId?.contactFirstName} {selectedAssessment.clientId?.contactLastName}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Amount:</span>
                    <strong className="amount">{formatCurrency(selectedAssessment.assessmentFee)}</strong>
                  </div>
                  <div className="detail-row">
                    <span>Payment Method:</span>
                    <strong>{selectedAssessment.paymentMethod?.toUpperCase()}</strong>
                  </div>
                  {selectedAssessment.paymentReference && (
                    <div className="detail-row">
                      <span>Reference Number:</span>
                      <strong>{selectedAssessment.paymentReference}</strong>
                    </div>
                  )}
                </div>

                {selectedAssessment.paymentProof && (
                  <div className="payment-proof">
                    <label>Payment Proof:</label>
                    <button 
                      className="view-proof-btn"
                      onClick={() => handleViewPaymentProof(selectedAssessment)}
                    >
                      <FaEye /> View Screenshot
                    </button>
                  </div>
                )}

                <div className="verification-notes">
                  <label>Verification Notes (Optional):</label>
                  <textarea
                    rows="3"
                    value={verificationNote}
                    onChange={(e) => setVerificationNote(e.target.value)}
                    placeholder="Add any notes about this verification..."
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  className="btn-cancel" 
                  onClick={() => setShowVerifyModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn-reject"
                  onClick={() => handleVerifyPayment(false)}
                >
                  <FaTimesCircle /> Reject Payment
                </button>
                <button 
                  className="btn-verify"
                  onClick={() => handleVerifyPayment(true)}
                >
                  <FaCheckCircle /> Verify & Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminBilling;