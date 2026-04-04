// pages/Customer/MyProject.cuspro.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaProjectDiagram,
  FaUserCircle,
  FaCalendarAlt,
  FaCheckCircle,
  FaSpinner,
  FaMoneyBillWave,
  FaFileInvoice,
  FaDownload,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaSolarPanel,
  FaTools,
  FaChevronDown,
  FaChevronUp,
  FaFileAlt,
  FaUserCog,
  FaUsers,
  FaMicrochip,
  FaWifi,
  FaRulerCombined,
  FaHistory,
  FaClock
} from 'react-icons/fa';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import '../../styles/Customer/myproject.css';

const MyProject = () => {
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects/my-projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setProjects(response.data.projects || []);
      
      if (response.data.projects?.length > 0) {
        setSelectedProject(response.data.projects[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching projects:', error);
      showToast('Failed to load projects', 'error');
      setLoading(false);
    }
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
    if (!date) return 'TBD';
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProjectProgress = (project) => {
    const statusProgress = {
      'quoted': 10,
      'approved': 20,
      'initial_paid': 30,
      'in_progress': 60,
      'progress_paid': 80,
      'completed': 100
    };
    return statusProgress[project.status] || 0;
  };

  const getPreAssessmentData = (project) => {
    if (project.preAssessmentId && typeof project.preAssessmentId === 'object') {
      return project.preAssessmentId;
    }
    return null;
  };

  // Skeleton Loader Component
  const SkeletonLoader = () => (
    <div className="cuspro-page">
      {/* Header Card Skeleton */}
      <div className="cuspro-header-card skeleton-card">
        <div className="skeleton-line large"></div>
        <div className="skeleton-line medium"></div>
      </div>

      {/* Selector Card Skeleton */}
      <div className="cuspro-selector-card skeleton-card">
        <div className="skeleton-line small"></div>
        <div className="skeleton-select"></div>
      </div>

      {/* Hero Card Skeleton */}
      <div className="cuspro-hero-card skeleton-card">
        <div className="cuspro-hero-left">
          <div className="skeleton-line large"></div>
          <div className="skeleton-line small"></div>
          <div className="skeleton-details">
            <div className="skeleton-chip"></div>
            <div className="skeleton-chip"></div>
            <div className="skeleton-chip"></div>
          </div>
        </div>
        <div className="cuspro-hero-right">
          <div className="skeleton-badge"></div>
        </div>
      </div>

      {/* Progress Section Skeleton */}
      <div className="cuspro-progress-section skeleton-card">
        <div className="skeleton-line medium"></div>
        <div className="skeleton-progress"></div>
        <div className="skeleton-stats">
          <div className="skeleton-stat"></div>
          <div className="skeleton-stat"></div>
          <div className="skeleton-stat"></div>
        </div>
      </div>

      {/* Tab Navigation Skeleton */}
      <div className="cuspro-tab-navigation skeleton-tabs">
        <div className="skeleton-tab"></div>
        <div className="skeleton-tab"></div>
        <div className="skeleton-tab"></div>
        <div className="skeleton-tab"></div>
        <div className="skeleton-tab"></div>
      </div>

      {/* Tab Content Skeleton */}
      <div className="cuspro-tab-content skeleton-card">
        <div className="skeleton-content">
          <div className="skeleton-line medium"></div>
          <div className="skeleton-grid">
            <div className="skeleton-info-card"></div>
            <div className="skeleton-info-card"></div>
            <div className="skeleton-info-card"></div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <>
        <Helmet>
          <title>My Projects | Salfer Engineering</title>
        </Helmet>
        <SkeletonLoader />
      </>
    );
  }

  if (projects.length === 0) {
    return (
      <>
        <Helmet>
          <title>My Projects | Salfer Engineering</title>
        </Helmet>
        <div className="cuspro-page">
          <div className="cuspro-empty-state-card">
            <FaProjectDiagram className="cuspro-empty-icon" />
            <h2>No Projects Yet</h2>
            <p>You haven't started any solar installation projects yet.</p>
            <button className="cuspro-btn-primary" onClick={() => navigate('/app/customer/book-assessment')}>
              Book an Assessment
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Projects | Salfer Engineering</title>
      </Helmet>

      <div className="cuspro-page">
        {/* Header Card */}
        <div className="cuspro-header-card">
          <div className="cuspro-header-card-content">
            <h1>My Solar Project</h1>
            <p>Track your installation progress and manage your project</p>
          </div>
        </div>

        {/* Project Selector Card */}
        {projects.length > 1 && (
          <div className="cuspro-selector-card">
            <div className="cuspro-selector-card-content">
              <label>Select Project</label>
              <select 
                value={selectedProject?._id} 
                onChange={(e) => setSelectedProject(projects.find(p => p._id === e.target.value))}
                className="cuspro-project-select"
              >
                {projects.map(project => (
                  <option key={project._id} value={project._id}>
                    {project.projectName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {selectedProject && (
          <>
            {/* Hero Card */}
            <div className="cuspro-hero-card">
              <div className="cuspro-hero-left">
                <h2>{selectedProject.projectName}</h2>
                <p className="cuspro-project-ref">{selectedProject.projectReference}</p>
                <div className="cuspro-hero-details">
                  <span className="cuspro-detail-chip">
                    <FaSolarPanel /> {selectedProject.systemSize} kWp
                  </span>
                  <span className="cuspro-detail-chip">
                    <FaTools /> {selectedProject.systemType === 'grid-tie' ? 'Grid-Tie' : 
                             selectedProject.systemType === 'hybrid' ? 'Hybrid' : 'Off-Grid'}
                  </span>
                  <span className="cuspro-detail-chip">
                    <FaMapMarkerAlt /> {selectedProject.addressId?.barangay || 'Location TBD'}
                  </span>
                </div>
              </div>
              <div className="cuspro-hero-right">
                <div className={`cuspro-status-badge ${selectedProject.status}`}>
                  {selectedProject.status?.replace('_', ' ').toUpperCase()}
                </div>
              </div>
            </div>

            {/* Progress Section */}
            <div className="cuspro-progress-section">
              <div className="cuspro-progress-header">
                <span className="cuspro-progress-label">Overall Progress</span>
                <span className="cuspro-progress-percentage">{getProjectProgress(selectedProject)}%</span>
              </div>
              <div className="cuspro-progress-track">
                <div className="cuspro-progress-fill" style={{ width: `${getProjectProgress(selectedProject)}%` }}></div>
              </div>
              <div className="cuspro-stats-row">
                <div className="cuspro-stat-block">
                  <span className="cuspro-stat-label">Total Cost</span>
                  <strong className="cuspro-stat-value">{formatCurrency(selectedProject.totalCost)}</strong>
                </div>
                <div className="cuspro-stat-block">
                  <span className="cuspro-stat-label">Amount Paid</span>
                  <strong className="cuspro-stat-value">{formatCurrency(selectedProject.amountPaid)}</strong>
                </div>
                <div className="cuspro-stat-block">
                  <span className="cuspro-stat-label">Balance</span>
                  <strong className="cuspro-stat-value">{formatCurrency(selectedProject.balance)}</strong>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="cuspro-tab-navigation">
              <button 
                className={`cuspro-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button 
                className={`cuspro-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
                onClick={() => setActiveTab('timeline')}
              >
                Timeline
              </button>
              <button 
                className={`cuspro-tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
                onClick={() => setActiveTab('payments')}
              >
                Payments
              </button>
              <button 
                className={`cuspro-tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
                onClick={() => setActiveTab('documents')}
              >
                Documents
              </button>
              <button 
                className={`cuspro-tab-btn ${activeTab === 'support' ? 'active' : ''}`}
                onClick={() => setActiveTab('support')}
              >
                Support
              </button>
            </div>

            {/* Tab Content - keep your existing content */}
            <div className="cuspro-tab-content">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="cuspro-overview-tab">
                  {/* System Specs */}
                  <div className="cuspro-info-card">
                    <h3>System Specifications</h3>
                    <div className="cuspro-specs-grid">
                      <div className="cuspro-spec-row">
                        <span className="cuspro-spec-label">Panels Needed</span>
                        <span className="cuspro-spec-value">{getPreAssessmentData(selectedProject)?.panelsNeeded || selectedProject.panelsNeeded || 'TBD'}</span>
                      </div>
                      <div className="cuspro-spec-row">
                        <span className="cuspro-spec-label">Inverter Type</span>
                        <span className="cuspro-spec-value">{selectedProject.inverterType || 'Standard'}</span>
                      </div>
                      <div className="cuspro-spec-row">
                        <span className="cuspro-spec-label">Battery Type</span>
                        <span className="cuspro-spec-value">{selectedProject.batteryType || 'N/A'}</span>
                      </div>
                      <div className="cuspro-spec-row">
                        <span className="cuspro-spec-label">Property Type</span>
                        <span className="cuspro-spec-value">{getPreAssessmentData(selectedProject)?.propertyType || 'Residential'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Installation Address */}
                  <div className="cuspro-info-card">
                    <h3>Installation Address</h3>
                    <div className="cuspro-address-block">
                      <FaMapMarkerAlt className="cuspro-address-icon" />
                      <div>
                        <p>{selectedProject.addressId?.houseOrBuilding || selectedProject.installationAddress?.houseOrBuilding}</p>
                        <p>{selectedProject.addressId?.street || selectedProject.installationAddress?.street}</p>
                        <p>{selectedProject.addressId?.barangay || selectedProject.installationAddress?.barangay}</p>
                        <p>{selectedProject.addressId?.city || selectedProject.installationAddress?.city}</p>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Personnel */}
                  <div className="cuspro-info-card">
                    <h3>Assigned Personnel</h3>
                    <div className="cuspro-personnel-list">
                      <div className="cuspro-personnel-item">
                        <div className="cuspro-personnel-avatar">
                          {selectedProject.assignedEngineerId?.firstName ? (
                            <span>{selectedProject.assignedEngineerId.firstName[0]}{selectedProject.assignedEngineerId.lastName?.[0]}</span>
                          ) : (
                            <FaUserCircle />
                          )}
                        </div>
                        <div className="cuspro-personnel-details">
                          <h4>Lead Engineer</h4>
                          <p>{selectedProject.assignedEngineerId?.firstName} {selectedProject.assignedEngineerId?.lastName || 'To be assigned'}</p>
                          {selectedProject.assignedEngineerId?.email && (
                            <a href={`mailto:${selectedProject.assignedEngineerId.email}`}>{selectedProject.assignedEngineerId.email}</a>
                          )}
                        </div>
                      </div>
                      <div className="cuspro-personnel-item">
                        <div className="cuspro-personnel-avatar">
                          <FaUserCog />
                        </div>
                        <div className="cuspro-personnel-details">
                          <h4>Project Coordinator</h4>
                          <p>Solaris Support Team</p>
                          <a href="mailto:support@salferengineering.com">support@salferengineering.com</a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="cuspro-action-buttons">
                    <button className="cuspro-btn-primary" onClick={() => navigate('/app/customer/billing')}>
                      <FaMoneyBillWave /> Make Payment
                    </button>
                    <button className="cuspro-btn-secondary" onClick={() => setActiveTab('support')}>
                      <FaEnvelope /> Contact Support
                    </button>
                  </div>
                </div>
              )}

              {/* Timeline Tab */}
              {activeTab === 'timeline' && (
                <div className="cuspro-timeline-tab">
                  <div className="cuspro-timeline-container">
                    <div className="cuspro-timeline-item completed">
                      <div className="cuspro-timeline-marker">
                        <FaCheckCircle />
                      </div>
                      <div className="cuspro-timeline-content">
                        <h4>Quotation Sent</h4>
                        <p>Initial quotation has been sent for your review</p>
                        <span className="cuspro-timeline-date">{formatDate(selectedProject.createdAt)}</span>
                      </div>
                    </div>

                    <div className={`cuspro-timeline-item ${selectedProject.status !== 'quoted' ? 'completed' : ''}`}>
                      <div className="cuspro-timeline-marker">
                        {selectedProject.status !== 'quoted' ? <FaCheckCircle /> : <div className="cuspro-marker-dot"></div>}
                      </div>
                      <div className="cuspro-timeline-content">
                        <h4>Project Approved</h4>
                        <p>You have approved the quotation and project is confirmed</p>
                        <span className="cuspro-timeline-date">{selectedProject.approvedAt ? formatDate(selectedProject.approvedAt) : 'Pending'}</span>
                      </div>
                    </div>

                    <div className={`cuspro-timeline-item ${selectedProject.amountPaid >= (selectedProject.initialPayment || 0) ? 'completed' : ''}`}>
                      <div className="cuspro-timeline-marker">
                        {selectedProject.amountPaid >= (selectedProject.initialPayment || 0) ? <FaCheckCircle /> : <div className="cuspro-marker-dot"></div>}
                      </div>
                      <div className="cuspro-timeline-content">
                        <h4>Initial Payment</h4>
                        <p>Initial payment of 30% has been received</p>
                        <span className="cuspro-timeline-date">
                          {selectedProject.paymentSchedule?.find(p => p.type === 'initial')?.paidAt 
                            ? formatDate(selectedProject.paymentSchedule.find(p => p.type === 'initial').paidAt) 
                            : 'Pending'}
                        </span>
                      </div>
                    </div>

                    <div className={`cuspro-timeline-item ${['in_progress', 'progress_paid', 'completed'].includes(selectedProject.status) ? 'completed' : ''}`}>
                      <div className="cuspro-timeline-marker">
                        {['in_progress', 'progress_paid', 'completed'].includes(selectedProject.status) ? <FaCheckCircle /> : <div className="cuspro-marker-dot"></div>}
                      </div>
                      <div className="cuspro-timeline-content">
                        <h4>Installation Started</h4>
                        <p>Solar panel installation has begun at your site</p>
                        <span className="cuspro-timeline-date">{selectedProject.startDate ? formatDate(selectedProject.startDate) : 'Pending'}</span>
                      </div>
                    </div>

                    <div className={`cuspro-timeline-item ${selectedProject.status === 'progress_paid' || selectedProject.status === 'completed' ? 'completed' : ''}`}>
                      <div className="cuspro-timeline-marker">
                        {selectedProject.status === 'progress_paid' || selectedProject.status === 'completed' ? <FaCheckCircle /> : <div className="cuspro-marker-dot"></div>}
                      </div>
                      <div className="cuspro-timeline-content">
                        <h4>Progress Payment</h4>
                        <p>Progress payment of 40% has been received</p>
                        <span className="cuspro-timeline-date">
                          {selectedProject.paymentSchedule?.find(p => p.type === 'progress')?.paidAt 
                            ? formatDate(selectedProject.paymentSchedule.find(p => p.type === 'progress').paidAt) 
                            : 'Pending'}
                        </span>
                      </div>
                    </div>

                    <div className={`cuspro-timeline-item ${selectedProject.status === 'completed' ? 'completed' : ''}`}>
                      <div className="cuspro-timeline-marker">
                        {selectedProject.status === 'completed' ? <FaCheckCircle /> : <div className="cuspro-marker-dot"></div>}
                      </div>
                      <div className="cuspro-timeline-content">
                        <h4>Installation Completed</h4>
                        <p>Solar system installation is complete and ready for use</p>
                        <span className="cuspro-timeline-date">{selectedProject.actualCompletionDate ? formatDate(selectedProject.actualCompletionDate) : 'Pending'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payments Tab */}
              {activeTab === 'payments' && (
                <div className="cuspro-payments-tab">
                  {selectedProject.paymentSchedule?.map((payment, idx) => (
                    <div key={idx} className="cuspro-payment-card">
                      <div className="cuspro-payment-header">
                        <div className="cuspro-payment-type">
                          {payment.type === 'initial' && 'Initial Deposit (30%)'}
                          {payment.type === 'progress' && 'Progress Payment (40%)'}
                          {payment.type === 'final' && 'Final Payment (30%)'}
                        </div>
                        <div className={`cuspro-payment-status-badge ${payment.status}`}>
                          {payment.status === 'paid' ? 'Paid' : payment.status === 'overdue' ? 'Overdue' : 'Pending'}
                        </div>
                      </div>
                      <div className="cuspro-payment-body">
                        <div className="cuspro-payment-amount">{formatCurrency(payment.amount)}</div>
                        <div className="cuspro-payment-due">
                          <FaClock /> Due: {formatDate(payment.dueDate)}
                        </div>
                        {payment.status === 'paid' && payment.paidAt && (
                          <div className="cuspro-payment-paid-date">
                            Paid on {formatDate(payment.paidAt)}
                          </div>
                        )}
                      </div>
                      {payment.status !== 'paid' && (
                        <div className="cuspro-payment-action">
                          <button className="cuspro-btn-pay" onClick={() => navigate('/app/customer/billing')}>
                            Pay Now
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Documents Tab */}
              {activeTab === 'documents' && (
                <div className="cuspro-documents-tab">
                  <div className="cuspro-document-card">
                    <div className="cuspro-document-icon">
                      <FaFileInvoice />
                    </div>
                    <div className="cuspro-document-info">
                      <h4>Quotation</h4>
                      <p>Detailed quotation for your solar system</p>
                    </div>
                    <button className="cuspro-btn-download" onClick={() => window.open(selectedProject.quotationFile, '_blank')}>
                      <FaDownload /> Download
                    </button>
                  </div>

                  <div className="cuspro-document-card">
                    <div className="cuspro-document-icon">
                      <FaFileAlt />
                    </div>
                    <div className="cuspro-document-info">
                      <h4>Contract</h4>
                      <p>Signed installation contract</p>
                    </div>
                    <button className="cuspro-btn-download" onClick={() => window.open(selectedProject.contractFile, '_blank')}>
                      <FaDownload /> Download
                    </button>
                  </div>

                  <div className="cuspro-document-card">
                    <div className="cuspro-document-icon">
                      <FaHistory />
                    </div>
                    <div className="cuspro-document-info">
                      <h4>Permits</h4>
                      <p>Required permits and certifications</p>
                    </div>
                    <button className="cuspro-btn-download" onClick={() => window.open(selectedProject.permitFiles?.[0], '_blank')}>
                      <FaDownload /> Download
                    </button>
                  </div>

                  <div className="cuspro-document-card">
                    <div className="cuspro-document-icon">
                      <FaCheckCircle />
                    </div>
                    <div className="cuspro-document-info">
                      <h4>Completion Certificate</h4>
                      <p>Certificate of completion</p>
                    </div>
                    <button className="cuspro-btn-download" onClick={() => window.open(selectedProject.completionCertificate, '_blank')}>
                      <FaDownload /> Download
                    </button>
                  </div>
                </div>
              )}

              {/* Support Tab */}
              {activeTab === 'support' && (
                <div className="cuspro-support-tab">
                  <div className="cuspro-support-card">
                    <div className="cuspro-support-icon">
                      <FaEnvelope />
                    </div>
                    <h3>Email Support</h3>
                    <p>Send us an email and we'll respond within 24 hours</p>
                    <a href="mailto:support@salferengineering.com" className="cuspro-support-link">
                      support@salferengineering.com
                    </a>
                  </div>

                  <div className="cuspro-support-card">
                    <div className="cuspro-support-icon">
                      <FaPhone />
                    </div>
                    <h3>Phone Support</h3>
                    <p>Call us during business hours (Mon-Fri, 9AM-6PM)</p>
                    <a href="tel:+63212345678" className="cuspro-support-link">
                      (02) 1234-5678
                    </a>
                  </div>

                  <div className="cuspro-support-card">
                    <div className="cuspro-support-icon">
                      <FaUserCog />
                    </div>
                    <h3>Project Coordinator</h3>
                    <p>Your dedicated project coordinator</p>
                    <div className="cuspro-coordinator-info">
                      <strong>Solaris Support Team</strong>
                      <a href="mailto:projects@salferengineering.com">projects@salferengineering.com</a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

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

export default MyProject;