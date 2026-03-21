import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  FaFileInvoice, 
  FaDownload, 
  FaEye, 
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaCreditCard,
  FaQrcode,
  FaPrint,
  FaEnvelope
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../../styles/Customer/quotation.css';

const Quotation = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('quotations');
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Mock data
  const [quotations, setQuotations] = useState([
    {
      id: 'QT-2024-001',
      date: '2024-04-01',
      validUntil: '2024-05-01',
      amount: 250000,
      status: 'pending',
      items: [
        { name: '5kW Solar Panels', qty: 13, price: 15000, total: 195000 },
        { name: '5kW Hybrid Inverter', qty: 1, price: 45000, total: 45000 },
        { name: 'Mounting Structure', qty: 1, price: 8000, total: 8000 },
        { name: 'Installation Labor', qty: 1, price: 2000, total: 2000 }
      ]
    },
    {
      id: 'QT-2024-002',
      date: '2024-03-15',
      validUntil: '2024-04-15',
      amount: 180000,
      status: 'expired',
      items: []
    }
  ]);

  const [bills, setBills] = useState([
    {
      id: 'INV-2024-001',
      date: '2024-04-05',
      dueDate: '2024-04-20',
      amount: 1500,
      status: 'paid',
      description: 'Site Assessment Fee',
      paymentDate: '2024-04-05'
    },
    {
      id: 'INV-2024-002',
      date: '2024-05-10',
      dueDate: '2024-05-25',
      amount: 25000,
      status: 'pending',
      description: 'Initial Payment - Solar Installation'
    },
    {
      id: 'INV-2024-003',
      date: '2024-06-01',
      dueDate: '2024-06-15',
      amount: 50000,
      status: 'pending',
      description: 'Final Payment'
    }
  ]);

  const [payments, setPayments] = useState([
    {
      id: 'PAY-2024-001',
      date: '2024-04-05',
      amount: 1500,
      method: 'GCash',
      invoiceId: 'INV-2024-001',
      status: 'completed'
    }
  ]);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return <span className="status-badge pending">Pending</span>;
      case 'paid':
        return <span className="status-badge paid">Paid</span>;
      case 'expired':
        return <span className="status-badge expired">Expired</span>;
      case 'completed':
        return <span className="status-badge completed">Completed</span>;
      default:
        return <span className="status-badge">{status}</span>;
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

  const handlePayNow = (bill) => {
    setSelectedInvoice(bill);
    setShowPaymentModal(true);
  };

  const handleViewQuotation = (quote) => {
    setSelectedInvoice(quote);
  };

  const closeModal = () => {
    setShowPaymentModal(false);
    setSelectedInvoice(null);
  };

  // Skeleton Loader Component
  const SkeletonLoader = () => (
    <div className="billing-container">
      <div className="billing-header">
        <div className="skeleton-line large"></div>
        <div className="skeleton-line small"></div>
      </div>

      <div className="billing-tabs">
        {[1, 2, 3].map((item) => (
          <div key={item} className="skeleton-tab"></div>
        ))}
      </div>

      <div className="skeleton-list">
        {[1, 2].map((item) => (
          <div key={item} className="skeleton-card">
            <div className="skeleton-header">
              <div className="skeleton-line medium"></div>
              <div className="skeleton-badge"></div>
            </div>
            <div className="skeleton-amount"></div>
            <div className="skeleton-actions">
              <div className="skeleton-button"></div>
              <div className="skeleton-button"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Quotations & Bills | Salfer Engineering</title>
        </Helmet>
        <SkeletonLoader />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Quotations & Bills | Salfer Engineering</title>
      </Helmet>
      
      <div className="billing-container">
        <div className="billing-header">
          <h1>Quotations & Bills</h1>
          <p>View and manage your quotations and billing statements</p>
        </div>

        {/* Tabs */}
        <div className="billing-tabs">
          <button 
            className={`tab-btn ${activeTab === 'quotations' ? 'active' : ''}`}
            onClick={() => setActiveTab('quotations')}
          >
            <FaFileInvoice /> Quotations
          </button>
          <button 
            className={`tab-btn ${activeTab === 'bills' ? 'active' : ''}`}
            onClick={() => setActiveTab('bills')}
          >
            <FaMoneyBillWave /> Bills
          </button>
          <button 
            className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            <FaCreditCard /> Payment History
          </button>
        </div>

        {/* Quotations Tab */}
        {activeTab === 'quotations' && (
          <div className="quotations-list">
            {quotations.length === 0 ? (
              <div className="empty-state">
                <FaFileInvoice className="empty-icon" />
                <h3>No quotations yet</h3>
                <p>Your quotations will appear here</p>
              </div>
            ) : (
              quotations.map(quote => (
                <div key={quote.id} className="quotation-card">
                  <div className="card-header">
                    <div>
                      <h3>{quote.id}</h3>
                      <p>Issued: {new Date(quote.date).toLocaleDateString()}</p>
                      <p>Valid until: {new Date(quote.validUntil).toLocaleDateString()}</p>
                    </div>
                    {getStatusBadge(quote.status)}
                  </div>
                  
                  <div className="card-amount">
                    <span>Total Amount</span>
                    <strong>{formatCurrency(quote.amount)}</strong>
                  </div>

                  <div className="card-actions">
                    <button className="action-btn view" onClick={() => handleViewQuotation(quote)}>
                      <FaEye /> View Details
                    </button>
                    <button className="action-btn download">
                      <FaDownload /> Download
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Bills Tab */}
        {activeTab === 'bills' && (
          <div className="bills-list">
            {bills.length === 0 ? (
              <div className="empty-state">
                <FaMoneyBillWave className="empty-icon" />
                <h3>No bills yet</h3>
                <p>Your bills will appear here</p>
              </div>
            ) : (
              bills.map(bill => (
                <div key={bill.id} className="bill-card">
                  <div className="card-header">
                    <div>
                      <h3>{bill.id}</h3>
                      <p>{bill.description}</p>
                      <p>Due: {new Date(bill.dueDate).toLocaleDateString()}</p>
                    </div>
                    {getStatusBadge(bill.status)}
                  </div>
                  
                  <div className="card-amount">
                    <span>Amount Due</span>
                    <strong>{formatCurrency(bill.amount)}</strong>
                  </div>

                  <div className="card-actions">
                    {bill.status === 'pending' && (
                      <button className="action-btn pay" onClick={() => handlePayNow(bill)}>
                        <FaCreditCard /> Pay Now
                      </button>
                    )}
                    <button className="action-btn view">
                      <FaEye /> View Details
                    </button>
                    <button className="action-btn download">
                      <FaDownload /> Download
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="payments-list">
            {payments.length === 0 ? (
              <div className="empty-state">
                <FaCreditCard className="empty-icon" />
                <h3>No payment history</h3>
                <p>Your payments will appear here</p>
              </div>
            ) : (
              <div className="payments-table">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Invoice</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(payment => (
                      <tr key={payment.id}>
                        <td>{new Date(payment.date).toLocaleDateString()}</td>
                        <td>{payment.invoiceId}</td>
                        <td className="amount">{formatCurrency(payment.amount)}</td>
                        <td>{payment.method}</td>
                        <td>{getStatusBadge(payment.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedInvoice && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>Pay Invoice</h3>
              <div className="modal-body">
                <div className="invoice-summary">
                  <p><strong>Invoice:</strong> {selectedInvoice.id}</p>
                  <p><strong>Amount:</strong> {formatCurrency(selectedInvoice.amount)}</p>
                  <p><strong>Due Date:</strong> {new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
                </div>

                <div className="payment-methods">
                  <h4>Select Payment Method</h4>
                  <button className="payment-method">
                    <FaQrcode /> GCash
                  </button>
                  <button className="payment-method">
                    <FaCreditCard /> Bank Transfer
                  </button>
                </div>

                <div className="gcash-details">
                  <h4>GCash Details</h4>
                  <p>Number: <strong>0917XXXXXXX</strong></p>
                  <p>Name: <strong>SALFER ENGINEERING CORP</strong></p>
                  <p>Amount: <strong>{formatCurrency(selectedInvoice.amount)}</strong></p>
                </div>

                <div className="upload-section">
                  <label>Upload Payment Proof</label>
                  <input type="file" accept="image/*" />
                  <small>Upload screenshot of your payment</small>
                </div>
              </div>

              <div className="modal-actions">
                <button className="cancel-btn" onClick={closeModal}>Cancel</button>
                <button className="submit-btn">Submit Payment</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Quotation;