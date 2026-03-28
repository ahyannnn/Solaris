// pages/Customer/quotation.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import { FaClock, FaCheckCircle, FaBuilding, FaExclamationTriangle } from 'react-icons/fa';
import '../../styles/Customer/quotation.css';

const Quotation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast, showToast, hideToast } = useToast();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('projects');
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsItem, setDetailsItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      
      const transformedBills = preAssessmentsRes.data.assessments?.map(assessment => ({
        id: assessment.invoiceNumber,
        date: new Date(assessment.bookedAt).toLocaleDateString(),
        dueDate: new Date(assessment.preferredDate).toLocaleDateString(),
        amount: assessment.assessmentFee,
        status: assessment.paymentStatus === 'paid' ? 'paid' : 'pending',
        description: 'Pre Assessment Fee',
        bookingReference: assessment.bookingReference,
        paymentStatus: assessment.paymentStatus,
        propertyType: assessment.propertyType,
        desiredCapacity: assessment.desiredCapacity,
        roofType: assessment.roofType,
        preferredDate: assessment.preferredDate,
        address: assessment.address,
        bookedAt: assessment.bookedAt
      })) || [];
      
      setPreAssessments(transformedBills);
      
      const paymentsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(paymentsRes.data.payments || []);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      showToast('Failed to load data', 'error');
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
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/projects/request`, 
        {
          systemSize: solarRequest.systemSize,
          propertyType: solarRequest.propertyType,
          systemType: solarRequest.systemType,
          notes: solarRequest.notes
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showToast('Solar installation request submitted successfully! Our team will contact you within 2-3 business days.', 'success');
      setShowRequestModal(false);
      setSolarRequest({ systemSize: '', propertyType: 'residential', systemType: 'grid-tie', notes: '' });
      
      fetchData();
      
    } catch (err) {
      console.error('Error submitting solar request:', err);
      showToast(err.response?.data?.message || 'Failed to submit request. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayNow = (preAssessment) => {
    setSelectedItem(preAssessment);
    setPaymentProof(null);
    setPaymentReference('');
    setShowPaymentModal(true);
  };

  const handleViewDetails = (item, type) => {
    setDetailsItem(item);
    setShowDetailsModal(true);
  };

  const handlePaymentSubmit = async () => {
    if (!paymentProof) {
      showToast('Please upload payment proof', 'warning');
      return;
    }
    
    if (!paymentReference) {
      showToast('Please enter GCash reference number', 'warning');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('bookingReference', selectedItem.bookingReference);
      formData.append('paymentMethod', 'gcash');
      formData.append('paymentReference', paymentReference);
      formData.append('paymentProof', paymentProof);
      
      await axios.post(`${import.meta.env.VITE_API_URL}/api/pre-assessments/${selectedItem.id}/submit-payment-proof`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (user && user.email) {
        try {
          await axios.post(`${import.meta.env.VITE_API_URL}/api/email/send-payment-confirmation`, {
            email: user.email,
            name: getFullName(),
            invoiceNumber: selectedItem.id,
            amount: selectedItem.amount,
            referenceNumber: paymentReference,
            propertyType: selectedItem.propertyType || 'Not specified',
            preferredDate: selectedItem.preferredDate || new Date().toISOString()
          });
          console.log('Payment confirmation email sent successfully');
        } catch (emailError) {
          console.error('Failed to send payment confirmation email:', emailError);
        }
      }
      
      setPreAssessments(prev => prev.map(item => 
        item.id === selectedItem.id 
          ? { ...item, status: 'for_verification', paymentStatus: 'for_verification' }
          : item
      ));
      
      showToast('Payment submitted successfully! A confirmation email has been sent. Our team will verify your payment within 24-48 hours.', 'success');
      closeModal();
      fetchData();
    } catch (err) {
      console.error('Payment error:', err);
      showToast(err.response?.data?.message || 'Failed to submit payment. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowPaymentModal(false);
    setSelectedItem(null);
    setPaymentProof(null);
    setPaymentReference('');
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': <span className="status-badge-quotation pending-quotation">Pending</span>,
      'paid': <span className="status-badge-quotation paid-quotation">Paid</span>,
      'for_verification': <span className="status-badge-quotation for-verification-quotation">For Verification</span>,
      'processing': <span className="status-badge-quotation processing-quotation">Processing</span>,
      'quoted': <span className="status-badge-quotation quoted-quotation">Quoted</span>,
      'approved': <span className="status-badge-quotation approved-quotation">Approved</span>,
      'initial_paid': <span className="status-badge-quotation initial-paid-quotation">Initial Paid</span>,
      'in_progress': <span className="status-badge-quotation in-progress-quotation">In Progress</span>,
      'completed': <span className="status-badge-quotation completed-quotation">Completed</span>,
      'cancelled': <span className="status-badge-quotation cancelled-quotation">Cancelled</span>
    };
    return badges[status] || <span className="status-badge-quotation">{status}</span>;
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

  // Skeleton Loader Components
  const ProjectsSkeleton = () => (
    <div className="projects-list-quotation">
      {[1, 2, 3].map((item) => (
        <div key={item} className="project-card-quotation skeleton-card-quotation">
          <div className="project-header-quotation">
            <div>
              <div className="skeleton-line-quotation medium-quotation"></div>
              <div className="skeleton-line-quotation small-quotation"></div>
              <div className="skeleton-line-quotation tiny-quotation"></div>
            </div>
            <div className="skeleton-badge-quotation"></div>
          </div>
          <div className="project-progress-quotation">
            <div className="skeleton-progress-quotation"></div>
            <div className="skeleton-line-quotation small-quotation"></div>
          </div>
          <div className="payment-schedule-quotation">
            <div className="skeleton-line-quotation small-quotation"></div>
            <div className="skeleton-schedule-item-quotation"></div>
            <div className="skeleton-schedule-item-quotation"></div>
          </div>
          <div className="project-actions-quotation">
            <div className="skeleton-button-quotation"></div>
            <div className="skeleton-button-quotation"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const QuotesSkeleton = () => (
    <div className="free-quotes-list-quotation">
      {[1, 2, 3].map((item) => (
        <div key={item} className="quote-card-quotation skeleton-card-quotation">
          <div className="card-header-quotation">
            <div>
              <div className="skeleton-line-quotation medium-quotation"></div>
              <div className="skeleton-line-quotation small-quotation"></div>
              <div className="skeleton-line-quotation tiny-quotation"></div>
            </div>
            <div className="skeleton-badge-quotation"></div>
          </div>
          <div className="card-actions-quotation">
            <div className="skeleton-button-quotation"></div>
            <div className="skeleton-button-quotation"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const PreAssessmentsSkeleton = () => (
    <div className="pre-assessments-list-quotation">
      {[1, 2, 3].map((item) => (
        <div key={item} className="bill-card-quotation skeleton-card-quotation">
          <div className="card-header-quotation">
            <div>
              <div className="skeleton-line-quotation medium-quotation"></div>
              <div className="skeleton-line-quotation small-quotation"></div>
              <div className="skeleton-line-quotation tiny-quotation"></div>
            </div>
            <div className="skeleton-badge-quotation"></div>
          </div>
          <div className="card-amount-quotation">
            <div className="skeleton-line-quotation small-quotation"></div>
            <div className="skeleton-line-quotation medium-quotation"></div>
          </div>
          <div className="card-actions-quotation">
            <div className="skeleton-button-quotation"></div>
            <div className="skeleton-button-quotation"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const PaymentsSkeleton = () => (
    <div className="payments-list-quotation">
      <div className="payments-table-quotation">
        <div className="skeleton-table-quotation">
          <div className="skeleton-table-header-quotation">
            <div className="skeleton-line-quotation small-quotation"></div>
            <div className="skeleton-line-quotation small-quotation"></div>
            <div className="skeleton-line-quotation small-quotation"></div>
            <div className="skeleton-line-quotation small-quotation"></div>
            <div className="skeleton-line-quotation small-quotation"></div>
          </div>
          {[1, 2, 3].map((item) => (
            <div key={item} className="skeleton-table-row-quotation">
              <div className="skeleton-line-quotation tiny-quotation"></div>
              <div className="skeleton-line-quotation tiny-quotation"></div>
              <div className="skeleton-line-quotation tiny-quotation"></div>
              <div className="skeleton-line-quotation tiny-quotation"></div>
              <div className="skeleton-badge-quotation"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const MainSkeleton = () => (
    <div className="billing-container-quotation">
      <div className="billing-header-quotation">
        <div>
          <div className="skeleton-line-quotation large-quotation"></div>
          <div className="skeleton-line-quotation medium-quotation"></div>
        </div>
        <div className="skeleton-button-quotation large-quotation"></div>
      </div>

      <div className="billing-tabs-quotation">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="skeleton-tab-quotation"></div>
        ))}
      </div>

      {activeTab === 'projects' && <ProjectsSkeleton />}
      {activeTab === 'free-quotes' && <QuotesSkeleton />}
      {activeTab === 'pre-assessments' && <PreAssessmentsSkeleton />}
      {activeTab === 'payments' && <PaymentsSkeleton />}
    </div>
  );

  if (loading) {
    return (
      <>
        <Helmet>
          <title>My Projects & Bills | Salfer Engineering</title>
        </Helmet>
        <MainSkeleton />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Projects & Bills | Salfer Engineering</title>
      </Helmet>
      
      <div className="billing-container-quotation">
        <div className="billing-header-quotation">
          <div>
            <h1>My Solar Journey</h1>
            <p>Track your projects, view quotes, and manage payments</p>
          </div>
          <button 
            className="request-solar-btn-quotation"
            onClick={() => setShowRequestModal(true)}
          >
            Request Installation
          </button>
        </div>

        {/* Tabs */}
        <div className="billing-tabs-quotation">
          <button 
            className={`tab-btn-quotation ${activeTab === 'projects' ? 'active-quotation' : ''}`}
            onClick={() => setActiveTab('projects')}
          >
            My Projects
          </button>
          <button 
            className={`tab-btn-quotation ${activeTab === 'free-quotes' ? 'active-quotation' : ''}`}
            onClick={() => setActiveTab('free-quotes')}
          >
            Free Quotes
          </button>
          <button 
            className={`tab-btn-quotation ${activeTab === 'pre-assessments' ? 'active-quotation' : ''}`}
            onClick={() => setActiveTab('pre-assessments')}
          >
            Pre-Assessment
          </button>
          <button 
            className={`tab-btn-quotation ${activeTab === 'payments' ? 'active-quotation' : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            Payment History
          </button>
        </div>

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="projects-list-quotation">
            {projects.length === 0 ? (
              <div className="empty-state-quotation">
                <h3>No projects yet</h3>
                <p>Click "Request Installation" to start your solar journey</p>
                <button className="btn-primary-quotation" onClick={() => setShowRequestModal(true)}>
                  Request Installation
                </button>
              </div>
            ) : (
              projects.map(project => (
                <div key={project._id} className="project-card-quotation">
                  <div className="project-header-quotation">
                    <div>
                      <h3>{project.projectName || project.projectReference}</h3>
                      <p className="project-reference-quotation">{project.projectReference}</p>
                      <p className="project-system-quotation">{project.systemSize} Solar System | {project.systemType}</p>
                    </div>
                    {getStatusBadge(project.status)}
                  </div>

                  <div className="project-progress-quotation">
                    <div className="progress-bar-quotation">
                      <div className="progress-fill-quotation" style={{ width: `${getProjectProgress(project)}%` }}></div>
                    </div>
                    <div className="progress-info-quotation">
                      <span>Paid: {formatCurrency(project.amountPaid)}</span>
                      <span>Total: {formatCurrency(project.totalCost)}</span>
                      <span>{getProjectProgress(project)}% Complete</span>
                    </div>
                  </div>

                  <div className="payment-schedule-quotation">
                    <h4>Payment Schedule</h4>
                    <div className="schedule-items-quotation">
                      {project.paymentSchedule?.map((payment, idx) => (
                        <div key={idx} className={`schedule-item-quotation ${payment.status}`}>
                          <span className="schedule-type-quotation">{payment.type}</span>
                          <span className="schedule-amount-quotation">{formatCurrency(payment.amount)}</span>
                          <span className="schedule-status-quotation">
                            {payment.status === 'paid' ? 'Paid' : payment.status === 'overdue' ? 'Overdue' : 'Pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="project-actions-quotation">
                    <button className="action-btn-quotation view-quotation" onClick={() => handleViewDetails(project, 'project')}>
                      View Details
                    </button>
                    <button className="action-btn-quotation download-quotation">
                      Contract
                    </button>
                    {(project.status === 'approved' || project.status === 'initial_paid') && (
                      <button className="action-btn-quotation pay-quotation">
                        Make Payment
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
          <div className="free-quotes-list-quotation">
            {freeQuotes.length === 0 ? (
              <div className="empty-state-quotation">
                <h3>No free quotes yet</h3>
                <p>Use our solar estimator to get a free quote</p>
                <button className="btn-primary-quotation" onClick={() => navigate('/app/customer/book-assessment')}>
                  Get Free Quote
                </button>
              </div>
            ) : (
              freeQuotes.map(quote => (
                <div key={quote._id} className="quote-card-quotation">
                  <div className="card-header-quotation">
                    <div>
                      <h3>{quote.quotationReference}</h3>
                      <p>Requested: {new Date(quote.requestedAt).toLocaleDateString()}</p>
                      <p>{quote.propertyType} property | {quote.desiredCapacity || 'Custom'} system</p>
                    </div>
                    {getStatusBadge(quote.status)}
                  </div>
                  <div className="card-actions-quotation">
                    <button className="action-btn-quotation view-quotation" onClick={() => handleViewDetails(quote, 'quote')}>
                      View Details
                    </button>
                    <button className="action-btn-quotation download-quotation">Download PDF</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Pre-Assessments Tab */}
        {activeTab === 'pre-assessments' && (
          <div className="pre-assessments-list-quotation">
            {preAssessments.length === 0 ? (
              <div className="empty-state-quotation">
                <h3>No pre-assessments yet</h3>
                <p>Book an assessment to start your solar journey</p>
                <button className="btn-primary-quotation" onClick={() => navigate('/app/customer/book-assessment')}>
                  Book Assessment
                </button>
              </div>
            ) : (
              preAssessments.map(assessment => (
                <div key={assessment.id} className="bill-card-quotation">
                  <div className="card-header-quotation">
                    <div>
                      <h3>{assessment.id}</h3>
                      <p>{assessment.description}</p>
                      <p>Due: {assessment.dueDate}</p>
                    </div>
                    {getStatusBadge(assessment.status)}
                  </div>
                  <div className="card-amount-quotation">
                    <span>Amount Due</span>
                    <strong>{formatCurrency(assessment.amount)}</strong>
                  </div>
                  <div className="card-actions-quotation">
                    {(assessment.status === 'pending' && assessment.paymentStatus !== 'for_verification') && (
                      <button className="action-btn-quotation pay-quotation" onClick={() => handlePayNow(assessment)}>
                        Pay via GCash
                      </button>
                    )}
                    
                    {assessment.paymentStatus === 'for_verification' && (
                      <span className="payment-status-quotation">
                        <FaClock style={{ marginRight: '4px' }} /> Payment Pending Verification
                      </span>
                    )}
                    
                    {assessment.paymentStatus === 'paid' && (
                      <span className="payment-status-quotation paid-status-quotation">
                        <FaCheckCircle style={{ marginRight: '4px' }} /> Payment Completed
                      </span>
                    )}
                    
                    <button className="action-btn-quotation view-quotation" onClick={() => handleViewDetails(assessment, 'assessment')}>
                      View Details
                    </button>
                  </div>
                  
                  {(assessment.status === 'pending' && assessment.paymentStatus !== 'for_verification' && assessment.paymentStatus !== 'paid') && (
                    <div className="walkin-note-quotation">
                      <small><FaBuilding style={{ marginRight: '4px' }} /> For walk-in payment, please visit our office at Purok 2, Masaya, San Jose, Camarines Sur</small>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="payments-list-quotation">
            {payments.length === 0 ? (
              <div className="empty-state-quotation">
                <h3>No payment history</h3>
                <p>Your payments will appear here</p>
              </div>
            ) : (
              <div className="payments-table-quotation">
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
                        <td className="amount-quotation">{formatCurrency(payment.amount)}</td>
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

        {/* Payment Modal - GCash Only */}
        {showPaymentModal && selectedItem && (
          <div className="modal-overlay-quotation" onClick={closeModal}>
            <div className="modal-content-quotation" onClick={e => e.stopPropagation()}>
              <button className="modal-close-quotation" onClick={closeModal}>×</button>
              <h3>Pay via GCash</h3>
              <div className="modal-body-quotation">
                <div className="invoice-summary-quotation">
                  <p><strong>Invoice:</strong> {selectedItem.id}</p>
                  <p><strong>Amount:</strong> {formatCurrency(selectedItem.amount)}</p>
                  <p><strong>Due Date:</strong> {selectedItem.dueDate}</p>
                </div>

                <div className="gcash-details-quotation">
                  <h4>GCash Details</h4>
                  <p>Number: <strong>0917XXXXXXX</strong></p>
                  <p>Name: <strong>SALFER ENGINEERING CORP</strong></p>
                  <p>Amount: <strong>{formatCurrency(selectedItem.amount)}</strong></p>
                </div>
                
                <div className="upload-section-quotation">
                  <label>Reference Number *</label>
                  <input 
                    type="text" 
                    value={paymentReference} 
                    onChange={(e) => setPaymentReference(e.target.value)} 
                    placeholder="Enter GCash reference number" 
                  />
                </div>
                
                <div className="upload-section-quotation">
                  <label>Upload Payment Screenshot *</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setPaymentProof(e.target.files[0])} 
                  />
                  {paymentProof && <small>Selected: {paymentProof.name}</small>}
                </div>

                <div className="walkin-note-quotation" style={{ marginTop: '1rem' }}>
                  <small><FaExclamationTriangle style={{ marginRight: '4px' }} /> Payment will be verified within 24-48 hours. You will receive a confirmation email once verified.</small>
                </div>
              </div>

              <div className="modal-actions-quotation">
                <button className="cancel-btn-quotation" onClick={closeModal}>Cancel</button>
                <button className="submit-btn-quotation" onClick={handlePaymentSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Processing...' : 'Submit Payment'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && detailsItem && (
          <div className="modal-overlay-quotation" onClick={() => setShowDetailsModal(false)}>
            <div className="modal-content-quotation details-modal-quotation" onClick={e => e.stopPropagation()}>
              <button className="modal-close-quotation" onClick={() => setShowDetailsModal(false)}>×</button>
              <h3>Details Information</h3>
              
              <div className="details-content-quotation">
                {detailsItem.quotationReference ? (
                  <>
                    <div className="details-section-quotation">
                      <h4>Quote Information</h4>
                      <p><strong>Reference Number:</strong> {detailsItem.quotationReference}</p>
                      <p><strong>Request Date:</strong> {new Date(detailsItem.requestedAt).toLocaleDateString()}</p>
                      <p><strong>Status:</strong> {detailsItem.status}</p>
                    </div>
                    <div className="details-section-quotation">
                      <h4>Details</h4>
                      <p><strong>Property Type:</strong> {detailsItem.propertyType}</p>
                      <p><strong>Monthly Bill:</strong> {formatCurrency(detailsItem.monthlyBill)}</p>
                      <p><strong>Desired Capacity:</strong> {detailsItem.desiredCapacity || 'Not specified'}</p>
                    </div>
                    <div className="details-section-quotation">
                      <h4>Address</h4>
                      <p>{detailsItem.address?.houseOrBuilding} {detailsItem.address?.street}</p>
                      <p>{detailsItem.address?.barangay}, {detailsItem.address?.cityMunicipality}</p>
                      <p>{detailsItem.address?.province} {detailsItem.address?.zipCode}</p>
                    </div>
                  </>
                ) : detailsItem.bookingReference ? (
                  <>
                    <div className="details-section-quotation">
                      <h4>Booking Information</h4>
                      <p><strong>Invoice Number:</strong> {detailsItem.id}</p>
                      <p><strong>Booking Reference:</strong> {detailsItem.bookingReference}</p>
                      <p><strong>Booked Date:</strong> {new Date(detailsItem.bookedAt).toLocaleDateString()}</p>
                      <p><strong>Status:</strong> {
                        detailsItem.paymentStatus === 'paid' ? 'Paid' : 
                        detailsItem.paymentStatus === 'for_verification' ? 'For Verification' : 
                        'Pending'
                      }</p>
                    </div>
                    <div className="details-section-quotation">
                      <h4>Assessment Details</h4>
                      <p><strong>Property Type:</strong> {detailsItem.propertyType}</p>
                      <p><strong>Desired Capacity:</strong> {detailsItem.desiredCapacity || 'Not specified'}</p>
                      <p><strong>Roof Type:</strong> {detailsItem.roofType || 'Not specified'}</p>
                      <p><strong>Preferred Date:</strong> {new Date(detailsItem.preferredDate).toLocaleDateString()}</p>
                      <p><strong>Amount:</strong> {formatCurrency(detailsItem.amount)}</p>
                    </div>
                    <div className="details-section-quotation">
                      <h4>Address</h4>
                      <p>{detailsItem.address}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="details-section-quotation">
                      <h4>Project Information</h4>
                      <p><strong>Project Name:</strong> {detailsItem.projectName || detailsItem.projectReference}</p>
                      <p><strong>Project Reference:</strong> {detailsItem.projectReference}</p>
                      <p><strong>Status:</strong> {detailsItem.status}</p>
                    </div>
                    <div className="details-section-quotation">
                      <h4>System Details</h4>
                      <p><strong>System Size:</strong> {detailsItem.systemSize}</p>
                      <p><strong>System Type:</strong> {detailsItem.systemType}</p>
                      <p><strong>Property Type:</strong> {detailsItem.propertyType}</p>
                    </div>
                    <div className="details-section-quotation">
                      <h4>Financial</h4>
                      <p><strong>Total Cost:</strong> {formatCurrency(detailsItem.totalCost)}</p>
                      <p><strong>Amount Paid:</strong> {formatCurrency(detailsItem.amountPaid)}</p>
                      <p><strong>Balance:</strong> {formatCurrency(detailsItem.totalCost - detailsItem.amountPaid)}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="modal-actions-quotation">
                <button className="cancel-btn-quotation" onClick={() => setShowDetailsModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Request Installation Modal */}
        {showRequestModal && (
          <div className="modal-overlay-quotation" onClick={() => setShowRequestModal(false)}>
            <div className="modal-content-quotation solar-request-modal-quotation" onClick={e => e.stopPropagation()}>
              <button className="modal-close-quotation" onClick={() => setShowRequestModal(false)}>×</button>
              <h3>Request Solar Installation</h3>
              <p className="modal-subtitle-quotation">Get a detailed quote for your solar panel system installation</p>

              <div className="modal-body-quotation">
                <div className="form-group-quotation">
                  <label>Desired System Size *</label>
                  <select value={solarRequest.systemSize} onChange={(e) => setSolarRequest({ ...solarRequest, systemSize: e.target.value })}>
                    <option value="">Select system size</option>
                    <option value="3kW">3kW (Good for small homes)</option>
                    <option value="5kW">5kW (Recommended for average homes)</option>
                    <option value="7kW">7kW (For larger homes)</option>
                    <option value="10kW">10kW (For large homes / small business)</option>
                    <option value="Custom">Custom (I'll specify in notes)</option>
                  </select>
                  {requestErrors.systemSize && <span className="error-text-quotation">{requestErrors.systemSize}</span>}
                </div>

                <div className="form-group-quotation">
                  <label>System Type</label>
                  <select value={solarRequest.systemType} onChange={(e) => setSolarRequest({ ...solarRequest, systemType: e.target.value })}>
                    <option value="grid-tie">Grid-tie (No battery)</option>
                    <option value="hybrid">Hybrid (With battery backup)</option>
                    <option value="off-grid">Off-grid (Complete independence)</option>
                  </select>
                </div>

                <div className="form-group-quotation">
                  <label>Property Type *</label>
                  <select value={solarRequest.propertyType} onChange={(e) => setSolarRequest({ ...solarRequest, propertyType: e.target.value })}>
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="industrial">Industrial</option>
                  </select>
                  {requestErrors.propertyType && <span className="error-text-quotation">{requestErrors.propertyType}</span>}
                </div>

                <div className="form-group-quotation">
                  <label>Additional Notes (Optional)</label>
                  <textarea rows="4" value={solarRequest.notes} onChange={(e) => setSolarRequest({ ...solarRequest, notes: e.target.value })} placeholder="Tell us about your specific needs, roof type, or any questions..." />
                </div>

                <div className="info-box-quotation">
                  <div><strong>What happens next?</strong><p>Our solar specialists will review your request and provide a detailed quotation within 2-3 business days.</p></div>
                </div>
              </div>

              <div className="modal-actions-quotation">
                <button className="cancel-btn-quotation" onClick={() => setShowRequestModal(false)}>Cancel</button>
                <button className="submit-btn-quotation" onClick={handleRequestSolar} disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
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
        />
      </div>
    </>
  );
};

export default Quotation;