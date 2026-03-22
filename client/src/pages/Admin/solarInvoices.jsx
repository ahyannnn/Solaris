// pages/Admin/solarInvoices.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { 
  FaSolarPanel, 
  FaEye, 
  FaCheckCircle, 
  FaSpinner,
  FaDownload,
  FaFilter,
  FaClock,
  FaCreditCard,
  FaFileInvoice,
  FaMoneyBillWave
} from 'react-icons/fa';
import '../../styles/Admin/solarInvoices.css';

const AdminSolarInvoices = () => {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    method: 'gcash',
    reference: '',
    notes: ''
  });
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    partial: 0,
    totalRevenue: 0,
    pendingAmount: 0
  });

  useEffect(() => {
    fetchInvoices();
    fetchStats();
  }, [filter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/solar-invoices`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: filter === 'all' ? undefined : filter }
      });
      setInvoices(response.data.invoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/solar-invoices/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleRecordPayment = async () => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/solar-invoices/${selectedInvoice._id}/payment`,
        paymentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      fetchInvoices();
      fetchStats();
      setShowPaymentModal(false);
      setSelectedInvoice(null);
      setPaymentData({ amount: '', method: 'gcash', reference: '', notes: '' });
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Failed to record payment');
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

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return <span className="status-badge pending">Pending</span>;
      case 'paid':
        return <span className="status-badge paid">Paid</span>;
      case 'partial':
        return <span className="status-badge partial">Partial</span>;
      case 'overdue':
        return <span className="status-badge overdue">Overdue</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="solar-invoices-loading">
        <FaSpinner className="spinner" />
        <p>Loading solar invoices...</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Solar Installation Invoices | Admin | Salfer Engineering</title>
      </Helmet>

      <div className="admin-solar-invoices">
        <div className="invoices-header">
          <h1><FaSolarPanel /> Solar Installation Invoices</h1>
          <p>Manage solar installation project payments and invoices</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-cards">
          <div className="stat-card total">
            <div className="stat-icon"><FaFileInvoice /></div>
            <div className="stat-info">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total Invoices</span>
            </div>
          </div>
          <div className="stat-card pending">
            <div className="stat-icon"><FaClock /></div>
            <div className="stat-info">
              <span className="stat-value">{stats.pending}</span>
              <span className="stat-label">Pending</span>
            </div>
          </div>
          <div className="stat-card partial">
            <div className="stat-icon"><FaCreditCard /></div>
            <div className="stat-info">
              <span className="stat-value">{stats.partial}</span>
              <span className="stat-label">Partial Payments</span>
            </div>
          </div>
          <div className="stat-card paid">
            <div className="stat-icon"><FaCheckCircle /></div>
            <div className="stat-info">
              <span className="stat-value">{stats.paid}</span>
              <span className="stat-label">Paid</span>
            </div>
          </div>
        </div>

        {/* Revenue Summary */}
        <div className="revenue-summary">
          <div className="summary-card">
            <h3>Total Revenue</h3>
            <p className="revenue-amount">{formatCurrency(stats.totalRevenue)}</p>
            <small>From completed payments</small>
          </div>
          <div className="summary-card">
            <h3>Pending Collection</h3>
            <p className="pending-amount">{formatCurrency(stats.pendingAmount)}</p>
            <small>From unpaid invoices</small>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="invoices-table-container">
          <div className="filters">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              Pending
            </button>
            <button 
              className={`filter-btn ${filter === 'partial' ? 'active' : ''}`}
              onClick={() => setFilter('partial')}
            >
              Partial
            </button>
            <button 
              className={`filter-btn ${filter === 'paid' ? 'active' : ''}`}
              onClick={() => setFilter('paid')}
            >
              Paid
            </button>
          </div>

          <table className="invoices-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Project</th>
                <th>Client</th>
                <th>Type</th>
                <th>Date</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(invoice => (
                <tr key={invoice._id}>
                  <td className="invoice-number">{invoice.invoiceNumber}</td>
                  <td>{invoice.projectId?.projectName || 'N/A'}</td>
                  <td>
                    {invoice.clientId?.contactFirstName} {invoice.clientId?.contactLastName}
                  </td>
                  <td>
                    <span className={`invoice-type ${invoice.invoiceType}`}>
                      {invoice.invoiceType}
                    </span>
                  </td>
                  <td>{new Date(invoice.issueDate).toLocaleDateString()}</td>
                  <td>{new Date(invoice.dueDate).toLocaleDateString()}</td>
                  <td className="amount">{formatCurrency(invoice.totalAmount)}</td>
                  <td className="amount">{formatCurrency(invoice.amountPaid)}</td>
                  <td className="amount balance">{formatCurrency(invoice.balance)}</td>
                  <td>{getStatusBadge(invoice.paymentStatus)}</td>
                  <td className="actions">
                    <button 
                      className="action-btn view"
                      onClick={() => setSelectedInvoice(invoice)}
                      title="View Details"
                    >
                      <FaEye />
                    </button>
                    {(invoice.paymentStatus === 'pending' || invoice.paymentStatus === 'partial') && (
                      <button 
                        className="action-btn record"
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setPaymentData({ ...paymentData, amount: invoice.balance });
                          setShowPaymentModal(true);
                        }}
                        title="Record Payment"
                      >
                        <FaMoneyBillWave />
                      </button>
                    )}
                    <button className="action-btn download" title="Download PDF">
                      <FaDownload />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && selectedInvoice && (
          <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>Record Payment</h3>
              <div className="invoice-summary">
                <p><strong>Invoice:</strong> {selectedInvoice.invoiceNumber}</p>
                <p><strong>Total Amount:</strong> {formatCurrency(selectedInvoice.totalAmount)}</p>
                <p><strong>Paid:</strong> {formatCurrency(selectedInvoice.amountPaid)}</p>
                <p><strong>Balance:</strong> {formatCurrency(selectedInvoice.balance)}</p>
              </div>

              <div className="form-group">
                <label>Payment Amount *</label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  placeholder="Enter payment amount"
                />
              </div>

              <div className="form-group">
                <label>Payment Method *</label>
                <select
                  value={paymentData.method}
                  onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                >
                  <option value="gcash">GCash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                </select>
              </div>

              <div className="form-group">
                <label>Reference Number</label>
                <input
                  type="text"
                  value={paymentData.reference}
                  onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                  placeholder="Transaction reference number"
                />
              </div>

              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  rows="2"
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  placeholder="Add notes about this payment"
                />
              </div>

              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowPaymentModal(false)}>
                  Cancel
                </button>
                <button className="btn-submit" onClick={handleRecordPayment}>
                  Record Payment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminSolarInvoices;