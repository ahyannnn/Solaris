// pages/Customer/quotation.jsx
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
  FaEnvelope,
  FaSpinner,
  FaSolarPanel,
  FaArrowRight,
  FaTimes,
  FaRegFileAlt,
  FaProjectDiagram,
  FaBuilding
} from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../../styles/Customer/quotation.css';

const Quotation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('projects');
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentReference, setPaymentReference] = useState('');
  
  // Solar Installation Request Form
  const [solarRequest, setSolarRequest] = useState({
    systemSize: '',
    propertyType: 'residential',
    systemType: 'grid-tie',
    notes: ''
  });
  const [requestErrors, setRequestErrors] = useState({});

  // State for actual data from API
  const [freeQuotes, setFreeQuotes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [preAssessments, setPreAssessments] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = sessionStorage.getItem('token');
      
      // Fetch free quotes
      const freeQuotesRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/free-quotes/my-quotes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFreeQuotes(freeQuotesRes.data.quotes || []);
      
      // Fetch projects
      const projectsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects/my-projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(projectsRes.data.projects || []);
      
      // Fetch pre-assessments
      const preAssessmentsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const transformedBills = preAssessmentsRes.data.assessments?.map(assessment => ({
        id: assessment.invoiceNumber,
        date: new Date(assessment.bookedAt).toLocaleDateString(),
        dueDate: new Date(assessment.preferredDate).toLocaleDateString(),
        amount: assessment.assessmentFee,
        status: assessment.paymentStatus === 'paid' ? 'paid' : 'pending',
        description: 'Pre Assessment Fee',
        bookingReference: assessment.bookingReference,
        paymentStatus: assessment.paymentStatus
      })) || [];
      
      setPreAssessments(transformedBills);
      
      // Fetch payments
      const paymentsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(paymentsRes.data.payments || []);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setLoading(false);
    }
  };

  const validateRequestForm = () => {
    const errors = {};
    if (!solarRequest.systemSize) {
      errors.systemSize = 'Please select or enter system size';
    }
    if (!solarRequest.propertyType) {
      errors.propertyType = 'Please select property type';
    }
    setRequestErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRequestSolar = async () => {
    if (!validateRequestForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const token = sessionStorage.getItem('token');
      
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/projects/request`, 
        {
          systemSize: solarRequest.systemSize,
          propertyType: solarRequest.propertyType,
          systemType: solarRequest.systemType,
          notes: solarRequest.notes
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Solar installation request submitted successfully! Our team will contact you within 2-3 business days.');
      setShowRequestModal(false);
      setSolarRequest({ systemSize: '', propertyType: 'residential', systemType: 'grid-tie', notes: '' });
      
      fetchData();
      
    } catch (err) {
      console.error('Error submitting solar request:', err);
      alert(err.response?.data?.message || 'Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayNow = (preAssessment) => {
    setSelectedItem(preAssessment);
    setPaymentMethod('');
    setPaymentProof(null);
    setPaymentReference('');
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async () => {
    if (!paymentMethod) {
      alert('Please select a payment method');
      return;
    }
    
    if (paymentMethod === 'gcash' && !paymentProof) {
      alert('Please upload payment proof');
      return;
    }
    
    if (paymentMethod === 'gcash' && !paymentReference) {
      alert('Please enter GCash reference number');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const token = sessionStorage.getItem('token');
      
      if (paymentMethod === 'gcash') {
        const formData = new FormData();
        formData.append('bookingReference', selectedItem.bookingReference);
        formData.append('paymentMethod', 'gcash');
        formData.append('paymentReference', paymentReference);
        formData.append('paymentProof', paymentProof);
        
        await axios.post(`${import.meta.env.VITE_API_URL}/api/pre-assessments/payment`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else if (paymentMethod === 'cash') {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/pre-assessments/cash-payment`, {
          bookingReference: selectedItem.bookingReference
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      setPreAssessments(prev => prev.map(item => 
        item.id === selectedItem.id 
          ? { ...item, status: paymentMethod === 'gcash' ? 'for_verification' : 'pending', paymentStatus: paymentMethod === 'gcash' ? 'for_verification' : 'pending' }
          : item
      ));
      
      alert('Payment submitted successfully!');
      closeModal();
      fetchData();
    } catch (err) {
      console.error('Payment error:', err);
      alert(err.response?.data?.message || 'Failed to submit payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowPaymentModal(false);
    setSelectedItem(null);
    setPaymentMethod('');
    setPaymentProof(null);
    setPaymentReference('');
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': <span className="status-badge pending">Pending</span>,
      'paid': <span className="status-badge paid">Paid</span>,
      'for_verification': <span className="status-badge for-verification">For Verification</span>,
      'processing': <span className="status-badge processing">Processing</span>,
      'quoted': <span className="status-badge quoted">Quoted</span>,
      'approved': <span className="status-badge approved">Approved</span>,
      'initial_paid': <span className="status-badge initial-paid">Initial Paid</span>,
      'in_progress': <span className="status-badge in-progress">In Progress</span>,
      'completed': <span className="status-badge completed">Completed</span>,
      'cancelled': <span className="status-badge cancelled">Cancelled</span>
    };
    return badges[status] || <span className="status-badge">{status}</span>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getProjectProgress = (project) => {
    if (project.totalCost === 0) return 0;
    return Math.round((project.amountPaid / project.totalCost) * 100);
  };

  // Skeleton Loader
  if (loading) {
    return (
      <div className="billing-loading">
        <FaSpinner className="spinner" />
        <p>Loading your data...</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Projects & Bills | Salfer Engineering</title>
      </Helmet>
      
      <div className="billing-container">
        <div className="billing-header">
          <div>
            <h1>My Solar Journey</h1>
            <p>Track your projects, view quotes, and manage payments</p>
          </div>
          <button 
            className="request-solar-btn"
            onClick={() => setShowRequestModal(true)}
          >
            <FaSolarPanel /> Request Installation
          </button>
        </div>

        {/* Tabs */}
        <div className="billing-tabs">
          <button 
            className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            <FaProjectDiagram /> My Projects
          </button>
          <button 
            className={`tab-btn ${activeTab === 'free-quotes' ? 'active' : ''}`}
            onClick={() => setActiveTab('free-quotes')}
          >
            <FaRegFileAlt /> Free Quotes
          </button>
          <button 
            className={`tab-btn ${activeTab === 'pre-assessments' ? 'active' : ''}`}
            onClick={() => setActiveTab('pre-assessments')}
          >
            <FaBuilding /> Pre-Assessment
          </button>
          <button 
            className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            <FaCreditCard /> Payment History
          </button>
        </div>

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="projects-list">
            {projects.length === 0 ? (
              <div className="empty-state">
                <FaProjectDiagram className="empty-icon" />
                <h3>No projects yet</h3>
                <p>Click "Request Installation" to start your solar journey</p>
                <button className="btn-primary" onClick={() => setShowRequestModal(true)}>
                  Request Installation
                </button>
              </div>
            ) : (
              projects.map(project => (
                <div key={project._id} className="project-card">
                  <div className="project-header">
                    <div>
                      <h3>{project.projectName || project.projectReference}</h3>
                      <p className="project-reference">{project.projectReference}</p>
                      <p className="project-system">{project.systemSize} Solar System | {project.systemType}</p>
                    </div>
                    {getStatusBadge(project.status)}
                  </div>

                  <div className="project-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${getProjectProgress(project)}%` }}></div>
                    </div>
                    <div className="progress-info">
                      <span>Paid: {formatCurrency(project.amountPaid)}</span>
                      <span>Total: {formatCurrency(project.totalCost)}</span>
                      <span>{getProjectProgress(project)}% Complete</span>
                    </div>
                  </div>

                  <div className="payment-schedule">
                    <h4>Payment Schedule</h4>
                    <div className="schedule-items">
                      {project.paymentSchedule?.map((payment, idx) => (
                        <div key={idx} className={`schedule-item ${payment.status}`}>
                          <span className="schedule-type">{payment.type}</span>
                          <span className="schedule-amount">{formatCurrency(payment.amount)}</span>
                          <span className="schedule-status">
                            {payment.status === 'paid' ? '✓ Paid' : payment.status === 'overdue' ? 'Overdue' : 'Pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="project-actions">
                    <button className="action-btn view" onClick={() => {}}>
                      <FaEye /> View Details
                    </button>
                    <button className="action-btn download">
                      <FaDownload /> Contract
                    </button>
                    {(project.status === 'approved' || project.status === 'initial_paid') && (
                      <button className="action-btn pay" onClick={() => {}}>
                        <FaCreditCard /> Make Payment
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Free Quotes Tab */}
        {activeTab === 'free-quotes' && (
          <div className="free-quotes-list">
            {freeQuotes.length === 0 ? (
              <div className="empty-state">
                <FaRegFileAlt className="empty-icon" />
                <h3>No free quotes yet</h3>
                <p>Use our solar estimator to get a free quote</p>
                <button className="btn-primary" onClick={() => navigate('/app/customer/book-assessment')}>
                  Get Free Quote
                </button>
              </div>
            ) : (
              freeQuotes.map(quote => (
                <div key={quote._id} className="quote-card">
                  <div className="card-header">
                    <div>
                      <h3>{quote.quotationReference}</h3>
                      <p>Requested: {new Date(quote.requestedAt).toLocaleDateString()}</p>
                      <p>{quote.propertyType} property | {quote.desiredCapacity || 'Custom'} system</p>
                    </div>
                    {getStatusBadge(quote.status)}
                  </div>
                  <div className="card-actions">
                    <button className="action-btn view">View Details</button>
                    <button className="action-btn download">Download PDF</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Pre-Assessments Tab */}
        {activeTab === 'pre-assessments' && (
          <div className="pre-assessments-list">
            {preAssessments.length === 0 ? (
              <div className="empty-state">
                <FaBuilding className="empty-icon" />
                <h3>No pre-assessments yet</h3>
                <p>Book an assessment to start your solar journey</p>
                <button className="btn-primary" onClick={() => navigate('/app/customer/book-assessment')}>
                  Book Assessment
                </button>
              </div>
            ) : (
              preAssessments.map(assessment => (
                <div key={assessment.id} className="bill-card">
                  <div className="card-header">
                    <div>
                      <h3>{assessment.id}</h3>
                      <p>{assessment.description}</p>
                      <p>Due: {assessment.dueDate}</p>
                    </div>
                    {getStatusBadge(assessment.status)}
                  </div>
                  <div className="card-amount">
                    <span>Amount Due</span>
                    <strong>{formatCurrency(assessment.amount)}</strong>
                  </div>
                  <div className="card-actions">
                    {(assessment.status === 'pending' || assessment.paymentStatus === 'pending') && (
                      <button className="action-btn pay" onClick={() => handlePayNow(assessment)}>
                        <FaCreditCard /> Pay Now
                      </button>
                    )}
                    {assessment.paymentStatus === 'for_verification' && (
                      <span className="payment-status">⏳ Payment Pending Verification</span>
                    )}
                    <button className="action-btn view">View Details</button>
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
                    <tr><th>Date</th><th>Invoice</th><th>Amount</th><th>Method</th><th>Status</th></tr>
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
        {showPaymentModal && selectedItem && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>Pay Pre-Assessment Fee</h3>
              <div className="modal-body">
                <div className="invoice-summary">
                  <p><strong>Invoice:</strong> {selectedItem.id}</p>
                  <p><strong>Amount:</strong> {formatCurrency(selectedItem.amount)}</p>
                  <p><strong>Due Date:</strong> {selectedItem.dueDate}</p>
                </div>

                <div className="payment-methods">
                  <h4>Select Payment Method</h4>
                  <div className="payment-options">
                    <label className={`payment-option ${paymentMethod === 'gcash' ? 'selected' : ''}`}>
                      <input type="radio" name="paymentMethod" value="gcash" checked={paymentMethod === 'gcash'} onChange={(e) => setPaymentMethod(e.target.value)} />
                      <FaQrcode /> GCash
                    </label>
                    <label className={`payment-option ${paymentMethod === 'cash' ? 'selected' : ''}`}>
                      <input type="radio" name="paymentMethod" value="cash" checked={paymentMethod === 'cash'} onChange={(e) => setPaymentMethod(e.target.value)} />
                      <FaMoneyBillWave /> Cash (Walk-in)
                    </label>
                  </div>
                </div>

                {paymentMethod === 'gcash' && (
                  <>
                    <div className="gcash-details">
                      <h4>GCash Details</h4>
                      <p>Number: <strong>0917XXXXXXX</strong></p>
                      <p>Name: <strong>SALFER ENGINEERING CORP</strong></p>
                      <p>Amount: <strong>{formatCurrency(selectedItem.amount)}</strong></p>
                    </div>
                    <div className="upload-section">
                      <label>Reference Number *</label>
                      <input type="text" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="Enter GCash reference number" />
                    </div>
                    <div className="upload-section">
                      <label>Upload Payment Screenshot *</label>
                      <input type="file" accept="image/*" onChange={(e) => setPaymentProof(e.target.files[0])} />
                      {paymentProof && <small>Selected: {paymentProof.name}</small>}
                    </div>
                  </>
                )}

                {paymentMethod === 'cash' && (
                  <div className="cash-details">
                    <p>Please visit our office to pay the amount:</p>
                    <div className="office-info">
                      <p><strong>Address:</strong> Purok 2, Masaya, San Jose, Camarines Sur</p>
                      <p><strong>Office Hours:</strong> Mon-Fri, 9AM-6PM</p>
                      <p><strong>Amount:</strong> {formatCurrency(selectedItem.amount)}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button className="cancel-btn" onClick={closeModal}>Cancel</button>
                <button className="submit-btn" onClick={handlePaymentSubmit} disabled={isSubmitting}>
                  {isSubmitting ? <><FaSpinner className="spinner" /> Processing...</> : 'Submit Payment'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Request Installation Modal */}
        {showRequestModal && (
          <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
            <div className="modal-content solar-request-modal" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowRequestModal(false)}><FaTimes /></button>
              <h3><FaSolarPanel /> Request Solar Installation</h3>
              <p className="modal-subtitle">Get a detailed quote for your solar panel system installation</p>

              <div className="modal-body">
                <div className="form-group">
                  <label>Desired System Size *</label>
                  <select value={solarRequest.systemSize} onChange={(e) => setSolarRequest({ ...solarRequest, systemSize: e.target.value })}>
                    <option value="">Select system size</option>
                    <option value="3kW">3kW (Good for small homes)</option>
                    <option value="5kW">5kW (Recommended for average homes)</option>
                    <option value="7kW">7kW (For larger homes)</option>
                    <option value="10kW">10kW (For large homes / small business)</option>
                    <option value="Custom">Custom (I'll specify in notes)</option>
                  </select>
                  {requestErrors.systemSize && <span className="error-text">{requestErrors.systemSize}</span>}
                </div>

                <div className="form-group">
                  <label>System Type</label>
                  <select value={solarRequest.systemType} onChange={(e) => setSolarRequest({ ...solarRequest, systemType: e.target.value })}>
                    <option value="grid-tie">Grid-tie (No battery)</option>
                    <option value="hybrid">Hybrid (With battery backup)</option>
                    <option value="off-grid">Off-grid (Complete independence)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Property Type *</label>
                  <select value={solarRequest.propertyType} onChange={(e) => setSolarRequest({ ...solarRequest, propertyType: e.target.value })}>
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="industrial">Industrial</option>
                  </select>
                  {requestErrors.propertyType && <span className="error-text">{requestErrors.propertyType}</span>}
                </div>

                <div className="form-group">
                  <label>Additional Notes (Optional)</label>
                  <textarea rows="4" value={solarRequest.notes} onChange={(e) => setSolarRequest({ ...solarRequest, notes: e.target.value })} placeholder="Tell us about your specific needs, roof type, or any questions..." />
                </div>

                <div className="info-box">
                  <FaCheckCircle />
                  <div><strong>What happens next?</strong><p>Our solar specialists will review your request and provide a detailed quotation within 2-3 business days.</p></div>
                </div>
              </div>

              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowRequestModal(false)}>Cancel</button>
                <button className="submit-btn" onClick={handleRequestSolar} disabled={isSubmitting}>
                  {isSubmitting ? <><FaSpinner className="spinner" /> Submitting...</> : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Quotation;