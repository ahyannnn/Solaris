// pages/Customer/MyProject.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaProjectDiagram,
  FaUser,
  FaUserCircle,
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaMoneyBillWave,
  FaFileInvoice,
  FaDownload,
  FaEye,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaBuilding,
  FaSolarPanel,
  FaTools,
  FaChartLine,
  FaHistory,
  FaChevronRight,
  FaChevronDown,
  FaFileAlt,
  FaUserCog,
  FaUsers,
  FaCalendarCheck,
  FaRulerCombined,
  FaMicrochip,
  FaWifi
} from 'react-icons/fa';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import '../../styles/Customer/myproject.css';

const MyProject = () => {
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeMilestone, setActiveMilestone] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    timeline: true,
    personnel: true,
    payments: true,
    documents: true,
    systemSpecs: true
  });

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

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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

  const getStatusBadge = (status) => {
    const badges = {
      'quoted': <span className="status-badge quoted">Quoted</span>,
      'approved': <span className="status-badge approved">Approved</span>,
      'initial_paid': <span className="status-badge initial-paid">Initial Payment</span>,
      'in_progress': <span className="status-badge in-progress">In Progress</span>,
      'progress_paid': <span className="status-badge progress-paid">Progress Payment</span>,
      'completed': <span className="status-badge completed">Completed</span>,
      'cancelled': <span className="status-badge cancelled">Cancelled</span>
    };
    return badges[status] || <span className="status-badge">{status}</span>;
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

  const getMilestones = (project) => {
    const milestones = [
      { 
        key: 'quoted', 
        label: 'Quotation Sent', 
        description: 'Initial quotation has been sent for your review',
        date: project.createdAt,
        completed: ['quoted', 'approved', 'initial_paid', 'in_progress', 'progress_paid', 'completed'].includes(project.status)
      },
      { 
        key: 'approved', 
        label: 'Project Approved', 
        description: 'You have approved the quotation and project is confirmed',
        date: project.approvedAt,
        completed: ['approved', 'initial_paid', 'in_progress', 'progress_paid', 'completed'].includes(project.status)
      },
      { 
        key: 'initial_paid', 
        label: 'Initial Payment', 
        description: 'Initial payment of 30% has been received',
        date: project.paymentSchedule?.find(p => p.type === 'initial')?.paidAt,
        completed: project.amountPaid >= (project.initialPayment || 0)
      },
      { 
        key: 'in_progress', 
        label: 'Installation Started', 
        description: 'Solar panel installation has begun at your site',
        date: project.startDate,
        completed: ['in_progress', 'progress_paid', 'completed'].includes(project.status)
      },
      { 
        key: 'progress_paid', 
        label: 'Progress Payment', 
        description: 'Progress payment of 40% has been received',
        date: project.paymentSchedule?.find(p => p.type === 'progress')?.paidAt,
        completed: project.amountPaid >= (project.initialPayment + project.progressPayment)
      },
      { 
        key: 'completed', 
        label: 'Installation Completed', 
        description: 'Solar system installation is complete and ready for use',
        date: project.actualCompletionDate,
        completed: project.status === 'completed'
      }
    ];
    return milestones;
  };

  const handleDownload = (docName, url) => {
    if (url) {
      window.open(url, '_blank');
    } else {
      showToast(`${docName} not available yet`, 'warning');
    }
  };

  // Get pre-assessment data if available
  const getPreAssessmentData = (project) => {
    if (project.preAssessmentId && typeof project.preAssessmentId === 'object') {
      return project.preAssessmentId;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="myproject-container">
        <div className="loading-container">
          <FaSpinner className="spinner" />
          <p>Loading your projects...</p>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <>
        <Helmet>
          <title>My Projects | Salfer Engineering</title>
        </Helmet>
        <div className="myproject-container">
          <div className="empty-state">
            <FaProjectDiagram className="empty-icon" />
            <h2>No Projects Yet</h2>
            <p>You haven't started any solar installation projects yet.</p>
            <button className="btn-primary" onClick={() => navigate('/app/customer/book-assessment')}>
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

      <div className="myproject-container">
        <div className="myproject-header">
          <h1>My Solar Projects</h1>
          <p>Track your solar installation projects, view progress, and manage documents</p>
        </div>

        {/* Project Selector */}
        {projects.length > 1 && (
          <div className="project-selector">
            <label>Select Project:</label>
            <div className="project-selector-buttons">
              {projects.map(project => (
                <button
                  key={project._id}
                  className={`project-select-btn ${selectedProject?._id === project._id ? 'active' : ''}`}
                  onClick={() => setSelectedProject(project)}
                >
                  {project.projectName}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedProject && (
          <div className="project-dashboard">
            {/* Project Overview Card */}
            <div className="overview-card">
              <div className="overview-header">
                <div>
                  <h2>{selectedProject.projectName}</h2>
                  <p className="project-ref">Ref: {selectedProject.projectReference}</p>
                </div>
                {getStatusBadge(selectedProject.status)}
              </div>
              <div className="overview-details">
                <div className="detail-item">
                  <FaSolarPanel />
                  <div>
                    <span>System Size</span>
                    <strong>{selectedProject.systemSize} kWp</strong>
                  </div>
                </div>
                <div className="detail-item">
                  <FaTools />
                  <div>
                    <span>System Type</span>
                    <strong>{selectedProject.systemType === 'grid-tie' ? 'Grid-Tie' : 
                             selectedProject.systemType === 'hybrid' ? 'Hybrid' : 'Off-Grid'}</strong>
                  </div>
                </div>
                <div className="detail-item">
                  <FaMapMarkerAlt />
                  <div>
                    <span>Location</span>
                    <strong>
                      {selectedProject.addressId?.houseOrBuilding || selectedProject.installationAddress?.houseOrBuilding} 
                      {selectedProject.addressId?.street || selectedProject.installationAddress?.street}, 
                      {selectedProject.addressId?.barangay || selectedProject.installationAddress?.barangay}
                    </strong>
                  </div>
                </div>
                <div className="detail-item">
                  <FaCalendarAlt />
                  <div>
                    <span>Start Date</span>
                    <strong>{formatDate(selectedProject.startDate)}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="progress-card">
              <div className="progress-header">
                <h3>Project Progress</h3>
                <span className="progress-percent">{getProjectProgress(selectedProject)}%</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${getProjectProgress(selectedProject)}%` }}></div>
              </div>
              <div className="progress-stats">
                <div className="stat">
                  <span>Total Cost</span>
                  <strong>{formatCurrency(selectedProject.totalCost)}</strong>
                </div>
                <div className="stat">
                  <span>Amount Paid</span>
                  <strong>{formatCurrency(selectedProject.amountPaid)}</strong>
                </div>
                <div className="stat">
                  <span>Balance</span>
                  <strong>{formatCurrency(selectedProject.balance)}</strong>
                </div>
              </div>
            </div>

            {/* System Specifications from PreAssessment */}
            {getPreAssessmentData(selectedProject) && (
              <div className="section-card">
                <div className="section-header" onClick={() => toggleSection('systemSpecs')}>
                  <h3><FaMicrochip /> System Specifications</h3>
                  <FaChevronDown className={`chevron ${expandedSections.systemSpecs ? 'expanded' : ''}`} />
                </div>
                {expandedSections.systemSpecs && (
                  <div className="section-content">
                    <div className="specs-grid">
                      <div className="spec-item">
                        <FaSolarPanel />
                        <div>
                          <label>Panels Needed</label>
                          <p>{getPreAssessmentData(selectedProject)?.panelsNeeded || selectedProject.panelsNeeded || 'To be determined'}</p>
                        </div>
                      </div>
                      <div className="spec-item">
                        <FaMicrochip />
                        <div>
                          <label>Inverter Type</label>
                          <p>{selectedProject.inverterType || 'Standard'}</p>
                        </div>
                      </div>
                      <div className="spec-item">
                        <FaWifi />
                        <div>
                          <label>Battery Type</label>
                          <p>{selectedProject.batteryType || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="spec-item">
                        <FaRulerCombined />
                        <div>
                          <label>Property Type</label>
                          <p>{getPreAssessmentData(selectedProject)?.propertyType || 'Residential'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Project Timeline Section */}
            <div className="section-card">
              <div className="section-header" onClick={() => toggleSection('timeline')}>
                <h3><FaCalendarAlt /> Project Timeline</h3>
                <FaChevronDown className={`chevron ${expandedSections.timeline ? 'expanded' : ''}`} />
              </div>
              {expandedSections.timeline && (
                <div className="section-content">
                  <div className="milestone-timeline">
                    {getMilestones(selectedProject).map((milestone, index) => (
                      <div key={milestone.key} className={`milestone ${milestone.completed ? 'completed' : ''}`}>
                        <div className="milestone-marker">
                          {milestone.completed ? <FaCheckCircle /> : <div className="marker-dot"></div>}
                        </div>
                        <div className="milestone-content">
                          <h4>{milestone.label}</h4>
                          <p>{milestone.description}</p>
                          <span className="milestone-date">{milestone.date ? formatDate(milestone.date) : 'Pending'}</span>
                        </div>
                        {index < getMilestones(selectedProject).length - 1 && <div className="milestone-line"></div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Assigned Personnel Section */}
            <div className="section-card">
              <div className="section-header" onClick={() => toggleSection('personnel')}>
                <h3><FaUsers /> Assigned Personnel</h3>
                <FaChevronDown className={`chevron ${expandedSections.personnel ? 'expanded' : ''}`} />
              </div>
              {expandedSections.personnel && (
                <div className="section-content">
                  <div className="personnel-grid">
                    <div className="personnel-card">
                      <div className="personnel-avatar">
                        {selectedProject.assignedEngineerId?.firstName ? (
                          <div className="avatar-initials">
                            {selectedProject.assignedEngineerId.firstName[0]}
                            {selectedProject.assignedEngineerId.lastName?.[0]}
                          </div>
                        ) : (
                          <FaUserCircle />
                        )}
                      </div>
                      <div className="personnel-info">
                        <h4>Lead Engineer</h4>
                        <strong>{selectedProject.assignedEngineerId?.firstName} {selectedProject.assignedEngineerId?.lastName || 'To be assigned'}</strong>
                        {selectedProject.assignedEngineerId?.email && (
                          <p><FaEnvelope /> {selectedProject.assignedEngineerId.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="personnel-card">
                      <div className="personnel-avatar">
                        <FaUserCog />
                      </div>
                      <div className="personnel-info">
                        <h4>Project Coordinator</h4>
                        <strong>Solaris Support Team</strong>
                        <p><FaPhone /> (02) 1234-5678</p>
                        <p><FaEnvelope /> support@salferengineering.com</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Schedule Section */}
            <div className="section-card">
              <div className="section-header" onClick={() => toggleSection('payments')}>
                <h3><FaMoneyBillWave /> Payment Schedule</h3>
                <FaChevronDown className={`chevron ${expandedSections.payments ? 'expanded' : ''}`} />
              </div>
              {expandedSections.payments && (
                <div className="section-content">
                  <div className="payment-schedule">
                    {selectedProject.paymentSchedule?.map((payment, idx) => (
                      <div key={idx} className={`payment-item ${payment.status}`}>
                        <div className="payment-type">
                          <span className="type-badge">{payment.type === 'initial' ? 'Initial Deposit (30%)' : 
                                                       payment.type === 'progress' ? 'Progress Payment (40%)' : 
                                                       'Final Payment (30%)'}</span>
                        </div>
                        <div className="payment-details">
                          <span className="amount">{formatCurrency(payment.amount)}</span>
                          <span className="due-date">Due: {formatDate(payment.dueDate)}</span>
                        </div>
                        <div className="payment-status">
                          {payment.status === 'paid' ? (
                            <span className="paid-badge">Paid on {formatDate(payment.paidAt)}</span>
                          ) : payment.status === 'overdue' ? (
                            <span className="overdue-badge">Overdue</span>
                          ) : (
                            <span className="pending-badge">Pending</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Documents Section */}
            <div className="section-card">
              <div className="section-header" onClick={() => toggleSection('documents')}>
                <h3><FaFileInvoice /> Project Documents</h3>
                <FaChevronDown className={`chevron ${expandedSections.documents ? 'expanded' : ''}`} />
              </div>
              {expandedSections.documents && (
                <div className="section-content">
                  <div className="documents-grid">
                    {selectedProject.quotationFile && (
                      <div className="document-item">
                        <FaFileInvoice />
                        <div>
                          <h4>Quotation</h4>
                          <p>Detailed quotation for your solar system</p>
                        </div>
                        <button className="download-btn" onClick={() => handleDownload('Quotation', selectedProject.quotationFile)}>
                          <FaDownload /> Download
                        </button>
                      </div>
                    )}
                    <div className="document-item">
                      <FaFileAlt />
                      <div>
                        <h4>Contract</h4>
                        <p>Signed installation contract</p>
                      </div>
                      <button className="download-btn" onClick={() => handleDownload('Contract', selectedProject.contractFile)}>
                        <FaDownload /> Download
                      </button>
                    </div>
                    <div className="document-item">
                      <FaHistory />
                      <div>
                        <h4>Permits</h4>
                        <p>Required permits and certifications</p>
                      </div>
                      <button className="download-btn" onClick={() => handleDownload('Permits', selectedProject.permitFiles?.[0])}>
                        <FaDownload /> Download
                      </button>
                    </div>
                    <div className="document-item">
                      <FaCheckCircle />
                      <div>
                        <h4>Completion Certificate</h4>
                        <p>Certificate of completion</p>
                      </div>
                      <button className="download-btn" onClick={() => handleDownload('Completion Certificate', selectedProject.completionCertificate)}>
                        <FaDownload /> Download
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button className="btn-primary" onClick={() => navigate('/app/customer/billing')}>
                <FaMoneyBillWave /> Make Payment
              </button>
              <button className="btn-secondary" onClick={() => navigate('/app/customer/support')}>
                <FaEnvelope /> Contact Support
              </button>
            </div>
          </div>
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