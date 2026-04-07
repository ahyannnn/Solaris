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
  FaClock,
  FaTag,
  FaGift,
  FaHourglassHalf,
  FaUserCheck,
  FaCreditCard
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
  const [solarInvoices, setSolarInvoices] = useState([]);

  useEffect(() => {
    fetchProjects();
    fetchSolarInvoices();
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

  const fetchSolarInvoices = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/solar-invoices/my-invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSolarInvoices(response.data.invoices || []);
    } catch (error) {
      console.error('Error fetching solar invoices:', error);
    }
  };

  // Helper function to check if a payment type is already paid
  const isPaymentPaid = (project, paymentType) => {
    // First check payment schedule
    const scheduleItem = project.paymentSchedule?.find(p => p.type === paymentType);
    if (scheduleItem?.status === 'paid') return true;

    // Then check solar invoices
    const invoice = solarInvoices.find(inv =>
      inv.projectId?._id === project._id &&
      inv.invoiceType === paymentType
    );
    if (invoice?.paymentStatus === 'paid') return true;

    // For full payment, also check fullPaymentCompleted flag
    if (paymentType === 'full' && project.fullPaymentCompleted) return true;

    return false;
  };

  // Helper function to get payment status for display
  const getPaymentStatus = (project, paymentType) => {
    const scheduleItem = project.paymentSchedule?.find(p => p.type === paymentType);
    const invoice = solarInvoices.find(inv =>
      inv.projectId?._id === project._id &&
      inv.invoiceType === paymentType
    );

    if (scheduleItem?.status === 'paid' || invoice?.paymentStatus === 'paid') {
      return { status: 'paid', text: 'Paid', color: '#10b981' };
    }
    if (invoice?.paymentStatus === 'for_verification') {
      return { status: 'for_verification', text: 'For Verification', color: '#f59e0b' };
    }
    if (scheduleItem?.status === 'overdue') {
      return { status: 'overdue', text: 'Overdue', color: '#ef4444' };
    }
    return { status: 'pending', text: 'Pending', color: '#6b7280' };
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

  // pages/Customer/MyProject.cuspro.jsx - Update getProjectProgress function

  const getProjectProgress = (project) => {
    // For full payment projects
    if (project.paymentPreference === 'full') {
      if (project.status === 'completed') return 100;
      if (project.status === 'in_progress') return 60;
      if (project.status === 'full_paid') return 30;  // ✅ Full paid but not started
      if (project.status === 'approved') return 15;
      if (project.status === 'quoted') return 5;
      return 5;
    }

    // For installment projects
    const initialPaid = isPaymentPaid(project, 'initial');
    const progressPaid = isPaymentPaid(project, 'progress');
    const finalPaid = isPaymentPaid(project, 'final');

    if (finalPaid) return 100;
    if (progressPaid) return 75;
    if (initialPaid) return 30;
    if (project.status === 'approved') return 15;
    if (project.status === 'quoted') return 5;
    return 5;
  };

  // pages/Customer/MyProject.cuspro.jsx - Update getNextStepMessage

  const getNextStepMessage = (project) => {
    const initialPaid = isPaymentPaid(project, 'initial');
    const progressPaid = isPaymentPaid(project, 'progress');
    const finalPaid = isPaymentPaid(project, 'final');
    const fullPaid = isPaymentPaid(project, 'full') || project.fullPaymentCompleted;

    const statusMessages = {
      'quoted': {
        message: 'Waiting for admin approval',
        action: 'Admin will review and approve your project',
        icon: <FaHourglassHalf />
      },
      'approved': {
        message: 'Awaiting payment',
        action: 'Please make the payment to proceed',
        icon: <FaMoneyBillWave />
      },
      'full_paid': {  // ✅ New status message
        message: 'Full payment received',
        action: 'We will assign an engineer and schedule your installation',
        icon: <FaCheckCircle />
      },
      'initial_paid': {
        message: initialPaid ? 'Initial payment completed' : 'Awaiting initial payment',
        action: initialPaid ? 'We will assign an engineer to start installation' : 'Please complete the initial payment',
        icon: initialPaid ? <FaTools /> : <FaMoneyBillWave />
      },
      'in_progress': {
        message: progressPaid ? 'Progress payment completed' : 'Installation in progress',
        action: progressPaid ? 'Installation continuing' : 'Progress payment pending',
        icon: <FaTools />
      },
      'progress_paid': {
        message: finalPaid ? 'All payments completed' : 'Final payment pending',
        action: finalPaid ? 'Installation completing' : 'Please make the final payment',
        icon: finalPaid ? <FaCheckCircle /> : <FaMoneyBillWave />
      },
      'completed': {
        message: 'Project completed!',
        action: 'Your solar system is ready for use',
        icon: <FaCheckCircle />
      }
    };

    return statusMessages[project.status] || {
      message: 'Project in progress',
      action: 'Please wait for updates',
      icon: <FaSpinner />
    };
  };

  const getPreAssessmentData = (project) => {
    if (project.preAssessmentId && typeof project.preAssessmentId === 'object') {
      return project.preAssessmentId;
    }
    return null;
  };

  // Get timeline items based on payment preference and actual payment status
  const getTimelineItems = (project) => {
    const isFullPayment = project.paymentPreference === 'full';
    const initialPaid = isPaymentPaid(project, 'initial');
    const progressPaid = isPaymentPaid(project, 'progress');
    const finalPaid = isPaymentPaid(project, 'final');
    const fullPaid = isPaymentPaid(project, 'full') || project.fullPaymentCompleted;

    // pages/Customer/MyProject.cuspro.jsx - Update getTimelineItems for full payment

    if (isFullPayment) {
      return [
        {
          key: 'quotation',
          title: 'Quotation Sent',
          description: 'Initial quotation has been sent for your review',
          completed: true,
          date: project.createdAt,
          status: 'completed'
        },
        {
          key: 'accepted',
          title: 'Quotation Accepted',
          description: 'You have accepted the quotation',
          completed: project.status !== 'quoted',
          date: project.approvedAt,
          status: project.status !== 'quoted' ? 'completed' : 'pending'
        },
        {
          key: 'full_payment',
          title: 'Full Payment',
          description: 'Full payment has been received',
          completed: fullPaid,
          date: project.paymentSchedule?.find(p => p.type === 'full')?.paidAt || null,
          status: fullPaid ? 'completed' : 'pending'
        },
        {
          key: 'installation_started',
          title: 'Installation Started',
          description: 'Solar panel installation has begun at your site',
          completed: ['in_progress', 'completed'].includes(project.status),
          date: project.startDate,
          status: ['in_progress', 'completed'].includes(project.status) ? 'completed' : 'pending'
        },
        {
          key: 'installation_completed',
          title: 'Installation Completed',
          description: 'Solar system installation is complete and ready for use',
          completed: project.status === 'completed',
          date: project.actualCompletionDate,
          status: project.status === 'completed' ? 'completed' : 'pending'
        }
      ];
    } else {
      // Installment timeline - show actual payment status
      return [
        {
          key: 'quotation',
          title: 'Quotation Sent',
          description: 'Initial quotation has been sent for your review',
          completed: true,
          date: project.createdAt,
          status: 'completed'
        },
        {
          key: 'approved',
          title: 'Admin Approval',
          description: 'Admin is reviewing your project',
          completed: project.status !== 'quoted',
          date: project.approvedAt,
          status: project.status !== 'quoted' ? 'completed' : 'pending'
        },
        {
          key: 'initial_payment',
          title: 'Initial Payment (30%)',
          description: 'Initial payment of 30% has been received',
          completed: initialPaid,
          date: project.paymentSchedule?.find(p => p.type === 'initial')?.paidAt || null,
          status: initialPaid ? 'completed' : 'pending'
        },
        {
          key: 'installation_started',
          title: 'Installation Started',
          description: 'Solar panel installation has begun at your site',
          completed: ['in_progress', 'progress_paid', 'completed'].includes(project.status),
          date: project.startDate,
          status: ['in_progress', 'progress_paid', 'completed'].includes(project.status) ? 'completed' : 'pending'
        },
        {
          key: 'progress_payment',
          title: 'Progress Payment (40%)',
          description: 'Progress payment of 40% has been received',
          completed: progressPaid,
          date: project.paymentSchedule?.find(p => p.type === 'progress')?.paidAt || null,
          status: progressPaid ? 'completed' : 'pending'
        },
        {
          key: 'installation_completed',
          title: 'Installation Completed',
          description: 'Solar system installation is complete',
          completed: project.status === 'completed',
          date: project.actualCompletionDate,
          status: project.status === 'completed' ? 'completed' : 'pending'
        },
        {
          key: 'final_payment',
          title: 'Final Payment (30%)',
          description: 'Final payment of 30% has been received',
          completed: finalPaid,
          date: project.paymentSchedule?.find(p => p.type === 'final')?.paidAt || null,
          status: finalPaid ? 'completed' : 'pending'
        }
      ];
    }
  };

  // Helper function to get current step index
  const getCurrentStepIndex = (status, isFullPayment) => {
    if (isFullPayment) {
      const stepMap = {
        'quoted': 'quotation',
        'approved': 'accepted',
        'in_progress': 'installation_started',
        'completed': 'installation_completed'
      };
      return stepMap[status] || 'quotation';
    } else {
      const stepMap = {
        'quoted': 'quotation',
        'approved': 'approved',
        'initial_paid': 'initial_payment',
        'in_progress': 'installation_started',
        'progress_paid': 'progress_payment',
        'completed': 'installation_completed'
      };
      return stepMap[status] || 'quotation';
    }
  };

  // pages/Customer/MyProject.cuspro.jsx - Update getPaymentSummary

  const getPaymentSummary = (project) => {
    if (project.paymentPreference === 'full') {
      const fullPaid = isPaymentPaid(project, 'full') || project.fullPaymentCompleted;
      if (fullPaid && project.status === 'full_paid') {
        return { text: 'Full payment completed - Awaiting installation', color: '#10b981' };
      }
      if (fullPaid && project.status === 'in_progress') {
        return { text: 'Installation in progress', color: '#3b82f6' };
      }
      if (fullPaid && project.status === 'completed') {
        return { text: 'Project completed!', color: '#10b981' };
      }
      if (project.status === 'approved') {
        return { text: 'Awaiting full payment to start installation', color: '#f59e0b' };
      }
      return { text: 'Full payment pending', color: '#ef4444' };
    } else {
      const initialPaid = isPaymentPaid(project, 'initial');
      const progressPaid = isPaymentPaid(project, 'progress');
      const finalPaid = isPaymentPaid(project, 'final');

      if (finalPaid) return { text: 'All payments completed - Installation complete', color: '#10b981' };
      if (progressPaid) return { text: 'Progress payment completed - Final pending', color: '#f59e0b' };
      if (initialPaid) return { text: 'Initial payment completed - Progress pending', color: '#f59e0b' };
      if (project.status === 'approved') return { text: 'Initial payment pending', color: '#ef4444' };
      if (project.status === 'quoted') return { text: 'Waiting for admin approval', color: '#6b7280' };
      return { text: 'Payment pending', color: '#ef4444' };
    }
  };
  // Get engineer display name
  const getEngineerName = (project) => {
    if (project.assignedEngineerId) {
      if (typeof project.assignedEngineerId === 'object') {
        const firstName = project.assignedEngineerId.firstName || '';
        const lastName = project.assignedEngineerId.lastName || '';
        if (firstName || lastName) {
          return `${firstName} ${lastName}`.trim();
        }
        return project.assignedEngineerId.email || 'Assigned';
      }
      return 'Engineer Assigned';
    }
    return null;
  };

  const nextStep = getNextStepMessage(selectedProject || {});

  // Skeleton Loader Component
  const SkeletonLoader = () => (
    <div className="cuspro-page">
      <div className="cuspro-header-card skeleton-card">
        <div className="skeleton-line large"></div>
        <div className="skeleton-line medium"></div>
      </div>
      <div className="cuspro-selector-card skeleton-card">
        <div className="skeleton-line small"></div>
        <div className="skeleton-select"></div>
      </div>
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
      <div className="cuspro-progress-section skeleton-card">
        <div className="skeleton-line medium"></div>
        <div className="skeleton-progress"></div>
        <div className="skeleton-stats">
          <div className="skeleton-stat"></div>
          <div className="skeleton-stat"></div>
          <div className="skeleton-stat"></div>
        </div>
      </div>
      <div className="cuspro-tab-navigation skeleton-tabs">
        <div className="skeleton-tab"></div>
        <div className="skeleton-tab"></div>
        <div className="skeleton-tab"></div>
        <div className="skeleton-tab"></div>
        <div className="skeleton-tab"></div>
      </div>
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
                    {project.projectName} {project.paymentPreference === 'full' && '(Full Payment)'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {selectedProject && (
          <>
            {/* Hero Card with Payment Preference Badge */}
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
                  {selectedProject.paymentPreference === 'full' && (
                    <span className="cuspro-detail-chip full-payment-chip">
                      <FaTag /> Full Payment
                    </span>
                  )}
                </div>
              </div>
              <div className="cuspro-hero-right">
                <div className={`cuspro-status-badge ${selectedProject.status}`}>
                  {selectedProject.status === 'quoted' ? 'PENDING APPROVAL' :
                    selectedProject.status?.replace('_', ' ').toUpperCase()}
                </div>
              </div>
            </div>

            {/* Next Step Message */}
            <div className="cuspro-next-step-card">
              <div className="cuspro-next-step-icon">
                {nextStep.icon}
              </div>
              <div className="cuspro-next-step-content">
                <h4>Next Step: {nextStep.message}</h4>
                <p>{nextStep.action}</p>
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
              {/* Payment Summary Bar */}
              <div className="cuspro-payment-summary-bar">
                <div
                  className="cuspro-payment-summary-text"
                  style={{ color: getPaymentSummary(selectedProject).color }}
                >
                  {getPaymentSummary(selectedProject).text}
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

            {/* Tab Content */}
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
                      <div className="cuspro-spec-row">
                        <span className="cuspro-spec-label">Payment Plan</span>
                        <span className="cuspro-spec-value">
                          {selectedProject.paymentPreference === 'full' ? 'Full Payment (One-time)' : 'Installment (30% - 40% - 30%)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Installation Address */}
                  <div className="cuspro-info-card">
                    <h3>Installation Address</h3>
                    <div className="cuspro-address-block">
                      <FaMapMarkerAlt className="cuspro-address-icon" />
                      <div>
                        <p>{selectedProject.addressId?.houseOrBuilding || selectedProject.installationAddress?.houseOrBuilding || 'Not specified'}</p>
                        <p>{selectedProject.addressId?.street || selectedProject.installationAddress?.street || ''}</p>
                        <p>{selectedProject.addressId?.barangay || selectedProject.installationAddress?.barangay || ''}</p>
                        <p>{selectedProject.addressId?.cityMunicipality || selectedProject.installationAddress?.city || ''}</p>
                      </div>
                    </div>
                  </div>

                  {/* Assigned Personnel */}
                  <div className="cuspro-info-card">
                    <h3>Assigned Personnel</h3>
                    <div className="cuspro-personnel-list">
                      <div className="cuspro-personnel-item">
                        <div className="cuspro-personnel-avatar">
                          {getEngineerName(selectedProject) ? (
                            <span>{getEngineerName(selectedProject).charAt(0)}</span>
                          ) : (
                            <FaUserCircle />
                          )}
                        </div>
                        <div className="cuspro-personnel-details">
                          <h4>Lead Engineer</h4>
                          {getEngineerName(selectedProject) ? (
                            <>
                              <p>{getEngineerName(selectedProject)}</p>
                              {selectedProject.assignedEngineerId?.email && (
                                <a href={`mailto:${selectedProject.assignedEngineerId.email}`}>
                                  {selectedProject.assignedEngineerId.email}
                                </a>
                              )}
                            </>
                          ) : (
                            <>
                              <p className="not-assigned-text">Not yet assigned</p>
                              <small>An engineer will be assigned once admin approves the project</small>
                            </>
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
                    {selectedProject.status === 'approved' && !isPaymentPaid(selectedProject, 'initial') && (
                      <button className="cuspro-btn-primary" onClick={() => navigate('/app/customer/billing')}>
                        <FaMoneyBillWave /> Make Initial Payment
                      </button>
                    )}
                    {(selectedProject.status === 'in_progress' && !isPaymentPaid(selectedProject, 'progress')) && (
                      <button className="cuspro-btn-primary" onClick={() => navigate('/app/customer/billing')}>
                        <FaMoneyBillWave /> Make Progress Payment
                      </button>
                    )}
                    {(selectedProject.status === 'progress_paid' && !isPaymentPaid(selectedProject, 'final')) && (
                      <button className="cuspro-btn-primary" onClick={() => navigate('/app/customer/billing')}>
                        <FaMoneyBillWave /> Make Final Payment
                      </button>
                    )}
                    {selectedProject.paymentPreference === 'full' && !isPaymentPaid(selectedProject, 'full') && selectedProject.status !== 'quoted' && (
                      <button className="cuspro-btn-primary" onClick={() => navigate('/app/customer/billing')}>
                        <FaMoneyBillWave /> Make Full Payment
                      </button>
                    )}
                    {selectedProject.status === 'quoted' && (
                      <button className="cuspro-btn-secondary" disabled style={{ opacity: 0.6 }}>
                        <FaHourglassHalf /> Waiting for Admin Approval
                      </button>
                    )}
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
                    {getTimelineItems(selectedProject).map((item) => (
                      <div key={item.key} className={`cuspro-timeline-item ${item.status === 'completed' ? 'completed' : ''}`}>
                        <div className="cuspro-timeline-marker">
                          {item.status === 'completed' ? <FaCheckCircle /> : <div className="cuspro-marker-dot"></div>}
                        </div>
                        <div className="cuspro-timeline-content">
                          <h4>{item.title}</h4>
                          <p>{item.description}</p>
                          <span className="cuspro-timeline-date">
                            {item.date ? formatDate(item.date) : 'Pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payments Tab - Updated to show actual payment status */}
              {activeTab === 'payments' && (
                <div className="cuspro-payments-tab">
                  {selectedProject.paymentSchedule?.length > 0 ? (
                    selectedProject.paymentSchedule.map((payment, idx) => {
                      const paymentStatus = getPaymentStatus(selectedProject, payment.type);
                      const isPaid = paymentStatus.status === 'paid';
                      const isForVerification = paymentStatus.status === 'for_verification';

                      return (
                        <div key={idx} className="cuspro-payment-card">
                          <div className="cuspro-payment-header">
                            <div className="cuspro-payment-type">
                              {payment.type === 'initial' && 'Initial Deposit (30%)'}
                              {payment.type === 'progress' && 'Progress Payment (40%)'}
                              {payment.type === 'final' && 'Final Payment (30%)'}
                              {payment.type === 'full' && 'Full Payment (100%)'}
                            </div>
                            <div className={`cuspro-payment-status-badge ${paymentStatus.status}`}>
                              {paymentStatus.text}
                            </div>
                          </div>
                          <div className="cuspro-payment-body">
                            <div className="cuspro-payment-amount">{formatCurrency(payment.amount)}</div>
                            <div className="cuspro-payment-due">
                              <FaClock /> Due: {formatDate(payment.dueDate)}
                            </div>
                            {isPaid && payment.paidAt && (
                              <div className="cuspro-payment-paid-date">
                                Paid on {formatDate(payment.paidAt)}
                              </div>
                            )}
                            {isForVerification && (
                              <div className="cuspro-payment-verification-note">
                                <FaClock /> Payment under review
                              </div>
                            )}
                          </div>
                          {!isPaid && selectedProject.status !== 'quoted' && !isForVerification && (
                            <div className="cuspro-payment-action">
                              <button className="cuspro-btn-pay" onClick={() => navigate('/app/customer/billing')}>
                                Pay Now
                              </button>
                            </div>
                          )}
                          {!isPaid && selectedProject.status === 'quoted' && (
                            <div className="cuspro-payment-action">
                              <button className="cuspro-btn-pay disabled" disabled style={{ opacity: 0.5 }}>
                                Awaiting Approval
                              </button>
                            </div>
                          )}
                          {isForVerification && (
                            <div className="cuspro-payment-action">
                              <button className="cuspro-btn-pay disabled" disabled style={{ opacity: 0.5 }}>
                                Payment Pending Verification
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="cuspro-empty-payments">
                      <p>No payment schedule available yet.</p>
                    </div>
                  )}
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
                    {selectedProject.quotationFile ? (
                      <button className="cuspro-btn-download" onClick={() => window.open(selectedProject.quotationFile, '_blank')}>
                        <FaDownload /> Download
                      </button>
                    ) : (
                      <button className="cuspro-btn-download disabled" disabled>
                        Not Available
                      </button>
                    )}
                  </div>

                  <div className="cuspro-document-card">
                    <div className="cuspro-document-icon">
                      <FaFileAlt />
                    </div>
                    <div className="cuspro-document-info">
                      <h4>Contract</h4>
                      <p>Signed installation contract</p>
                    </div>
                    {selectedProject.contractFile ? (
                      <button className="cuspro-btn-download" onClick={() => window.open(selectedProject.contractFile, '_blank')}>
                        <FaDownload /> Download
                      </button>
                    ) : (
                      <button className="cuspro-btn-download disabled" disabled>
                        Pending
                      </button>
                    )}
                  </div>

                  <div className="cuspro-document-card">
                    <div className="cuspro-document-icon">
                      <FaHistory />
                    </div>
                    <div className="cuspro-document-info">
                      <h4>Permits</h4>
                      <p>Required permits and certifications</p>
                    </div>
                    {selectedProject.permitFiles?.length > 0 ? (
                      <button className="cuspro-btn-download" onClick={() => window.open(selectedProject.permitFiles[0], '_blank')}>
                        <FaDownload /> Download
                      </button>
                    ) : (
                      <button className="cuspro-btn-download disabled" disabled>
                        Pending
                      </button>
                    )}
                  </div>

                  <div className="cuspro-document-card">
                    <div className="cuspro-document-icon">
                      <FaCheckCircle />
                    </div>
                    <div className="cuspro-document-info">
                      <h4>Completion Certificate</h4>
                      <p>Certificate of completion</p>
                    </div>
                    {selectedProject.completionCertificate ? (
                      <button className="cuspro-btn-download" onClick={() => window.open(selectedProject.completionCertificate, '_blank')}>
                        <FaDownload /> Download
                      </button>
                    ) : (
                      <button className="cuspro-btn-download disabled" disabled>
                        Pending
                      </button>
                    )}
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