// pages/Customer/MyProject.cuspro.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaProjectDiagram,
  FaUserCircle,
  FaCheckCircle,
  FaMoneyBillWave,
  FaMapMarkerAlt,
  FaSolarPanel,
  FaClock,
  FaEnvelope,
  FaPhone,
  FaImages,
  FaCamera,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
  FaDownload
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
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    fetchProjects();
    fetchSolarInvoices();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      const targetProgress = getProjectProgress(selectedProject);
      let currentProgress = 0;
      const step = targetProgress / 60;
      let frame;

      const animate = () => {
        currentProgress += step;
        if (currentProgress >= targetProgress) {
          setAnimatedProgress(targetProgress);
          return;
        }
        setAnimatedProgress(currentProgress);
        frame = requestAnimationFrame(animate);
      };

      frame = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(frame);
    }
  }, [selectedProject]);

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

  const isPaymentPaid = (project, paymentType) => {
    const scheduleItem = project.paymentSchedule?.find(p => p.type === paymentType);
    if (scheduleItem?.status === 'paid') return true;

    const invoice = solarInvoices.find(inv =>
      inv.projectId?._id === project._id &&
      inv.invoiceType === paymentType
    );
    if (invoice?.paymentStatus === 'paid') return true;

    if (paymentType === 'full' && project.fullPaymentCompleted) return true;

    return false;
  };

  const getPaymentStatus = (project, paymentType) => {
    const scheduleItem = project.paymentSchedule?.find(p => p.type === paymentType);
    const invoice = solarInvoices.find(inv =>
      inv.projectId?._id === project._id &&
      inv.invoiceType === paymentType
    );

    // ✅ If final payment is paid, show previous payments as paid
    const finalPaid = isPaymentPaid(project, 'final');
    
    if (paymentType !== 'final' && finalPaid) {
      return { status: 'paid', text: 'Paid', color: '#10b981' };
    }

    if (scheduleItem?.status === 'paid' || invoice?.paymentStatus === 'paid') {
      return { status: 'paid', text: 'Paid', color: '#10b981' };
    }
    if (invoice?.paymentStatus === 'for_verification') {
      return { status: 'for_verification', text: 'Verifying', color: '#f59e0b' };
    }
    if (scheduleItem?.status === 'overdue') {
      return { status: 'overdue', text: 'Overdue', color: '#ef4444' };
    }
    return { status: 'pending', text: 'Pending', color: '#64748b' };
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
    if (project.paymentPreference === 'full') {
      if (project.status === 'completed') return 100;
      if (project.status === 'in_progress') return 60;
      if (project.status === 'full_paid') return 40;
      if (project.status === 'approved') return 15;
      return 5;
    }

    const initialPaid = isPaymentPaid(project, 'initial');
    const progressPaid = isPaymentPaid(project, 'progress');
    const finalPaid = isPaymentPaid(project, 'final');

    // ✅ FIXED: When final payment is paid, show 90% (almost complete)
    if (finalPaid) {
      // If installation is completed, show 100%
      if (project.status === 'completed') return 100;
      // If final payment is made but installation not completed, show 90%
      return 90;
    }
    if (progressPaid) return 75;
    if (initialPaid) return 30;
    if (project.status === 'approved') return 15;
    return 5;
  };

  const getNextStepMessage = (project) => {
    const initialPaid = isPaymentPaid(project, 'initial');
    const progressPaid = isPaymentPaid(project, 'progress');
    const finalPaid = isPaymentPaid(project, 'final');
    const fullPaid = isPaymentPaid(project, 'full');

    if (project.status === 'quoted') {
      return { message: 'Waiting for admin approval', action: 'Admin will review your project soon' };
    }
    if (project.status === 'approved' && !initialPaid && !fullPaid) {
      return { message: 'Ready for payment', action: 'Complete initial payment to start installation' };
    }
    
    // For full payment plan
    if (fullPaid && project.paymentPreference === 'full') {
      return { message: 'Payment completed', action: 'Installation will begin soon' };
    }
    
    // ✅ FIXED: When final payment is paid but installation not complete
    if (finalPaid && project.status !== 'completed') {
      return { message: 'Final payment received', action: 'Engineer will complete the installation shortly' };
    }
    
    if (initialPaid && !progressPaid && !finalPaid) {
      return { message: 'Installation starting soon', action: 'Engineer will be assigned shortly' };
    }
    if (progressPaid && !finalPaid) {
      return { message: 'Installation in progress', action: 'Your solar system is being installed' };
    }
    if (project.status === 'completed') {
      return { message: 'Project complete', action: 'Enjoy your solar energy!' };
    }
    return { message: 'Project active', action: 'Track progress here' };
  };

  const getPreAssessmentData = (project) => {
    if (project.preAssessmentId && typeof project.preAssessmentId === 'object') {
      return project.preAssessmentId;
    }
    return null;
  };

  const getTimelineItems = (project) => {
    const isFullPayment = project.paymentPreference === 'full';
    const initialPaid = isPaymentPaid(project, 'initial');
    const progressPaid = isPaymentPaid(project, 'progress');
    const finalPaid = isPaymentPaid(project, 'final');
    const fullPaid = isPaymentPaid(project, 'full');

    if (isFullPayment) {
      return [
        { key: 'quotation', title: 'Quotation', desc: 'Project quoted', completed: true, date: project.createdAt },
        { key: 'payment', title: 'Full Payment', desc: 'Payment completed', completed: fullPaid, date: project.paymentSchedule?.find(p => p.type === 'full')?.paidAt },
        { key: 'installation', title: 'Installation', desc: 'System installation', 
          completed: ['full_paid', 'in_progress', 'completed'].includes(project.status), 
          date: project.startDate },
        { key: 'complete', title: 'Completion', desc: 'Project handover', 
          completed: project.status === 'completed', 
          date: project.actualCompletionDate }
      ];
    } else {
      // ✅ FIXED: If final payment is paid, progress payment should be considered completed
      const isProgressCompleted = progressPaid || finalPaid;
      const isInitialCompleted = initialPaid || finalPaid;
      
      return [
        { 
          key: 'quotation', 
          title: 'Quotation', 
          desc: 'Project quoted', 
          completed: true, 
          date: project.createdAt 
        },
        { 
          key: 'initial', 
          title: 'Initial (30%)', 
          desc: 'Down payment', 
          completed: isInitialCompleted,
          date: project.paymentSchedule?.find(p => p.type === 'initial')?.paidAt 
        },
        { 
          key: 'installation', 
          title: 'Installation', 
          desc: 'System setup', 
          completed: ['in_progress', 'progress_paid', 'full_paid', 'completed'].includes(project.status) || finalPaid,
          date: project.startDate 
        },
        { 
          key: 'progress', 
          title: 'Progress (40%)', 
          desc: 'Milestone payment', 
          completed: isProgressCompleted,
          date: project.paymentSchedule?.find(p => p.type === 'progress')?.paidAt 
        },
        { 
          key: 'final', 
          title: 'Final (30%)', 
          desc: 'Completion payment', 
          completed: finalPaid, 
          date: project.paymentSchedule?.find(p => p.type === 'final')?.paidAt 
        },
        { 
          key: 'complete', 
          title: 'Handover', 
          desc: 'System activated', 
          completed: project.status === 'completed', 
          date: project.actualCompletionDate 
        }
      ];
    }
  };

  const getEngineerName = (project) => {
    if (project.engineerFullName) {
      return project.engineerFullName;
    }

    if (project.assignedEngineerId && typeof project.assignedEngineerId === 'object') {
      const engineer = project.assignedEngineerId;

      if (engineer.fullName && engineer.fullName !== 'undefined undefined') {
        return engineer.fullName;
      }

      if (engineer.firstName && engineer.lastName) {
        return `${engineer.firstName} ${engineer.lastName}`.trim();
      }

      if (engineer.firstName) {
        return engineer.firstName;
      }

      if (engineer.lastName) {
        return engineer.lastName;
      }

      if (engineer.name) {
        return engineer.name;
      }

      if (engineer.email) {
        const emailName = engineer.email.split('@')[0];
        const formattedName = emailName
          .split(/[._-]/)
          .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join(' ');
        return formattedName;
      }

      return 'Engineer assigned';
    }

    return null;
  };

  const openPhotoModal = (photos, index) => {
    setSelectedPhoto(photos);
    setCurrentPhotoIndex(index);
    setShowPhotoModal(true);
  };

  const closePhotoModal = () => {
    setShowPhotoModal(false);
    setSelectedPhoto(null);
    setCurrentPhotoIndex(0);
  };

  const nextPhoto = () => {
    if (selectedPhoto && currentPhotoIndex < selectedPhoto.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const prevPhoto = () => {
    if (selectedPhoto && currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  const downloadPhoto = async (url, index) => {
    try {
      const response = await axios.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'image/jpeg' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `site-photo-${index + 1}.jpg`;
      link.click();
      URL.revokeObjectURL(link.href);
      showToast('Photo downloaded successfully', 'success');
    } catch (error) {
      console.error('Error downloading photo:', error);
      showToast('Failed to download photo', 'error');
    }
  };

  const nextStep = getNextStepMessage(selectedProject || {});
  const sitePhotos = selectedProject?.sitePhotos || [];

  const SkeletonLoader = () => (
    <div className="cuspro-page">
      <div className="cuspro-header-card skeleton-card">
        <div className="skeleton-line large"></div>
        <div className="skeleton-line medium"></div>
      </div>
      <div className="cuspro-hero-card skeleton-card">
        <div className="skeleton-line large"></div>
        <div className="skeleton-line small"></div>
        <div className="skeleton-details">
          <div className="skeleton-chip"></div>
          <div className="skeleton-chip"></div>
          <div className="skeleton-chip"></div>
        </div>
      </div>
      <div className="cuspro-two-col">
        <div className="skeleton-card"></div>
        <div className="skeleton-card"></div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <>
        <Helmet>
          <title>My Project | Salfer Engineering</title>
        </Helmet>
        <SkeletonLoader />
      </>
    );
  }

  if (projects.length === 0) {
    return (
      <>
        <Helmet>
          <title>My Project | Salfer Engineering</title>
        </Helmet>
        <div className="cuspro-page">
          <div className="cuspro-empty-state-card">
            <FaProjectDiagram className="cuspro-empty-icon" />
            <h2>No Projects Yet</h2>
            <p>Start your solar journey with a free assessment</p>
            <button className="cuspro-btn-primary" onClick={() => navigate('/app/customer/book-assessment')}>
              Book Assessment
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Project | Salfer Engineering</title>
      </Helmet>

      <div className="cuspro-page">
        <div className="cuspro-header-card">
          <h1>My Project</h1>
          <p>Track your solar installation progress</p>
        </div>

        {projects.length > 1 && (
          <div className="cuspro-selector-card">
            <select
              value={selectedProject?._id}
              onChange={(e) => setSelectedProject(projects.find(p => p._id === e.target.value))}
              className="cuspro-project-select"
            >
              {projects.map(project => (
                <option key={project._id} value={project._id}>
                  {project.projectName} {project.paymentPreference === 'full' ? '· Full Payment' : '· Installment'}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedProject && (
          <>
            <div className="cuspro-hero-card">
              <div className="cuspro-hero-main">
                <div>
                  <h2>{selectedProject.projectName}</h2>
                  <p className="cuspro-project-ref">{selectedProject.projectReference}</p>
                </div>
                <div className={`cuspro-status-badge ${selectedProject.status}`}>
                  {selectedProject.status?.replace('_', ' ').toUpperCase()}
                </div>
              </div>
              <div className="cuspro-hero-tags">
                <span><FaSolarPanel /> {selectedProject.systemSize} kWp</span>
                <span>{selectedProject.systemType === 'grid-tie' ? 'Grid-Tie' : selectedProject.systemType === 'hybrid' ? 'Hybrid' : 'Off-Grid'}</span>
                <span><FaMapMarkerAlt /> {selectedProject.addressId?.barangay || 'Location TBD'}</span>
                {selectedProject.paymentPreference === 'full' && (
                  <span className="full-payment-tag">Full Payment</span>
                )}
              </div>
            </div>

            <div className="cuspro-two-col">
              <div className="cuspro-left-col">
                <div className="cuspro-progress-card">
                  <h3>Project Progress</h3>
                  <div className="cuspro-progress-ring-wrapper">
                    <svg className="cuspro-progress-ring" viewBox="0 0 120 120">
                      <circle
                        className="cuspro-progress-bg"
                        cx="60" cy="60" r="52"
                        fill="none" stroke="#E2E8F0" strokeWidth="6"
                      />
                      <circle
                        className="cuspro-progress-fill"
                        cx="60" cy="60" r="52"
                        fill="none" stroke="#2563EB" strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 52}`}
                        strokeDashoffset={`${2 * Math.PI * 52 * (1 - animatedProgress / 100)}`}
                        transform="rotate(-90 60 60)"
                      />
                      <text x="60" y="52" textAnchor="middle" fill="#0F172A" fontSize="26" fontWeight="700">
                        {getProjectProgress(selectedProject)}%
                      </text>
                      <text x="60" y="72" textAnchor="middle" fill="#64748B" fontSize="11" fontWeight="500">
                        Complete
                      </text>
                    </svg>
                  </div>
                  <div className="cuspro-progress-stats">
                    <div className="cuspro-stat">
                      <span>Total Cost</span>
                      <strong>{formatCurrency(selectedProject.totalCost)}</strong>
                    </div>
                    <div className="cuspro-stat">
                      <span>Paid</span>
                      <strong>{formatCurrency(selectedProject.amountPaid)}</strong>
                    </div>
                    <div className="cuspro-stat">
                      <span>Balance</span>
                      <strong>{formatCurrency(selectedProject.balance)}</strong>
                    </div>
                  </div>
                </div>

                {sitePhotos.length > 0 && (
                  <div className="cuspro-photos-card">
                    <h3><FaImages /> Site Photos ({sitePhotos.length})</h3>
                    <p className="cuspro-photos-subtitle">Installation progress photos from your engineer</p>
                    <div className="cuspro-photos-grid">
                      {sitePhotos.slice(0, 6).map((photo, idx) => (
                        <div key={idx} className="cuspro-photo-item" onClick={() => openPhotoModal(sitePhotos, idx)}>
                          <img src={photo} alt={`Site progress ${idx + 1}`} onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=No+Image'; }} />
                          <div className="cuspro-photo-overlay"><FaCamera /></div>
                        </div>
                      ))}
                      {sitePhotos.length > 6 && (
                        <div className="cuspro-photo-item more-photos" onClick={() => openPhotoModal(sitePhotos, 0)}>
                          <div className="more-photos-overlay"><FaImages /><span>+{sitePhotos.length - 6} more</span></div>
                        </div>
                      )}
                    </div>
                    <button className="cuspro-view-all-btn" onClick={() => openPhotoModal(sitePhotos, 0)}>
                      <FaImages /> View All Photos ({sitePhotos.length})
                    </button>
                  </div>
                )}

                <div className="cuspro-next-card">
                  <h3>Next Step</h3>
                  <div className="cuspro-next-content">
                    <h4>{nextStep.message}</h4>
                    <p>{nextStep.action}</p>
                  </div>
                  <div className="cuspro-next-actions">
                    {selectedProject.status === 'approved' && !isPaymentPaid(selectedProject, 'initial') && !isPaymentPaid(selectedProject, 'full') && (
                      <button className="cuspro-btn-primary" onClick={() => navigate('/app/customer/billing')}>Make Payment</button>
                    )}
                    {(selectedProject.status === 'in_progress' && !isPaymentPaid(selectedProject, 'progress') && !isPaymentPaid(selectedProject, 'final')) && (
                      <button className="cuspro-btn-primary" onClick={() => navigate('/app/customer/billing')}>Make Progress Payment</button>
                    )}
                    {(selectedProject.status === 'progress_paid' && !isPaymentPaid(selectedProject, 'final')) && (
                      <button className="cuspro-btn-primary" onClick={() => navigate('/app/customer/billing')}>Make Final Payment</button>
                    )}
                  </div>
                </div>
              </div>

              <div className="cuspro-right-col">
                <div className="cuspro-details-card">
                  <h3>System Details</h3>
                  <div className="cuspro-details-grid">
                    <div className="cuspro-detail-item"><span>Panels Needed</span><strong>{getPreAssessmentData(selectedProject)?.panelsNeeded || selectedProject.panelsNeeded || 'TBD'}</strong></div>
                    <div className="cuspro-detail-item"><span>Inverter Type</span><strong>{selectedProject.inverterType || 'Standard'}</strong></div>
                    <div className="cuspro-detail-item"><span>Battery</span><strong>{selectedProject.batteryType || 'N/A'}</strong></div>
                    <div className="cuspro-detail-item"><span>Property</span><strong>{getPreAssessmentData(selectedProject)?.propertyType || 'Residential'}</strong></div>
                  </div>
                </div>

                <div className="cuspro-details-card">
                  <h3>Installation Address</h3>
                  <div className="cuspro-address">
                    <p>{selectedProject.addressId?.houseOrBuilding || 'Not specified'}</p>
                    <p>{selectedProject.addressId?.street || ''}</p>
                    <p>{selectedProject.addressId?.barangay || ''}</p>
                    <p>{selectedProject.addressId?.cityMunicipality || ''}</p>
                  </div>
                </div>

                <div className="cuspro-details-card">
                  <h3>Assigned Engineer</h3>
                  {getEngineerName(selectedProject) ? (
                    <div className="cuspro-engineer">
                      <div className="cuspro-engineer-avatar">{getEngineerName(selectedProject).charAt(0)}</div>
                      <div>
                        <strong>{getEngineerName(selectedProject)}</strong>
                        {selectedProject.assignedEngineerId?.email && (
                          <p className="engineer-email"><FaEnvelope className="email-icon" /> {selectedProject.assignedEngineerId.email}</p>
                        )}
                        {selectedProject.assignedEngineerId?.phone && (
                          <p className="engineer-phone"><FaPhone className="phone-icon" /> {selectedProject.assignedEngineerId.phone}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="cuspro-engineer-placeholder">
                      <FaUserCircle />
                      <div><strong>Pending Assignment</strong><p>Engineer will be assigned after approval</p></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="cuspro-tab-nav">
              <button className={`cuspro-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
              <button className={`cuspro-tab ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>Timeline</button>
              <button className={`cuspro-tab ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}>Payments</button>
            </div>

            <div className="cuspro-tab-content">
              {activeTab === 'overview' && (
                <div className="cuspro-overview">
                  <div className="cuspro-overview-grid">
                    <div className="cuspro-overview-card">
                      <h4>Installation Timeline</h4>
                      <div className="cuspro-timeline-mini">
                        {getTimelineItems(selectedProject).slice(0, 4).map((item, idx) => (
                          <div key={item.key} className={`cuspro-timeline-mini-item ${item.completed ? 'completed' : ''}`}>
                            <span className="cuspro-milestone-dot"></span>
                            <div><p>{item.title}</p><small>{item.completed ? formatDate(item.date) : 'Pending'}</small></div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="cuspro-overview-card">
                      <h4>Payment Summary</h4>
                      <div className="cuspro-payment-mini">
                        {selectedProject.paymentSchedule?.map((payment, idx) => {
                          const status = getPaymentStatus(selectedProject, payment.type);
                          return (
                            <div key={idx} className="cuspro-payment-mini-item">
                              <div><span>{payment.type === 'initial' ? 'Initial (30%)' : payment.type === 'progress' ? 'Progress (40%)' : payment.type === 'final' ? 'Final (30%)' : 'Full (100%)'}</span><strong>{formatCurrency(payment.amount)}</strong></div>
                              <span className={`cuspro-payment-mini-status ${status.status}`}>{status.text}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="cuspro-contact-card">
                    <h4>Need Help?</h4>
                    <p>Contact our support team for assistance</p>
                    <div className="cuspro-contact-actions">
                      <a href="mailto:support@salferengineering.com"><FaEnvelope /> support@salferengineering.com</a>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'timeline' && (
                <div className="cuspro-timeline-full">
                  {getTimelineItems(selectedProject).map((item, idx) => (
                    <div key={item.key} className={`cuspro-timeline-full-item ${item.completed ? 'completed' : ''}`}>
                      <div className="cuspro-timeline-marker">{item.completed ? <FaCheckCircle /> : <span>{idx + 1}</span>}</div>
                      <div className="cuspro-timeline-info"><h4>{item.title}</h4><p>{item.desc}</p></div>
                      <div className="cuspro-timeline-date">{item.completed ? formatDate(item.date) : '—'}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'payments' && (
                <div className="cuspro-payments-full">
                  {selectedProject.paymentSchedule?.length > 0 ? (
                    selectedProject.paymentSchedule.map((payment, idx) => {
                      const status = getPaymentStatus(selectedProject, payment.type);
                      return (
                        <div key={idx} className="cuspro-payment-full-item">
                          <div className="cuspro-payment-full-header">
                            <div>
                              <h4>{payment.type === 'initial' ? 'Initial Deposit (30%)' : payment.type === 'progress' ? 'Progress Payment (40%)' : payment.type === 'final' ? 'Final Payment (30%)' : 'Full Payment (100%)'}</h4>
                              <p>Due: {formatDate(payment.dueDate)}</p>
                            </div>
                            <span className={`cuspro-payment-full-status ${status.status}`}>{status.text}</span>
                          </div>
                          <div className="cuspro-payment-full-amount">
                            <strong>{formatCurrency(payment.amount)}</strong>
                            {status.status === 'paid' && payment.paidAt && <span>Paid on {formatDate(payment.paidAt)}</span>}
                          </div>
                          {status.status !== 'paid' && status.status !== 'for_verification' && selectedProject.status !== 'quoted' && (
                            <button className="cuspro-btn-pay" onClick={() => navigate('/app/customer/billing')}>Pay Now</button>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="cuspro-empty-text">No payment schedule available</p>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {showPhotoModal && selectedPhoto && (
          <div className="cuspro-photo-modal-overlay" onClick={closePhotoModal}>
            <div className="cuspro-photo-modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="cuspro-photo-modal-close" onClick={closePhotoModal}><FaTimes /></button>
              <div className="cuspro-photo-modal-main">
                <img src={selectedPhoto[currentPhotoIndex]} alt={`Site photo ${currentPhotoIndex + 1}`} onError={(e) => { e.target.src = 'https://via.placeholder.com/800x600?text=Image+Not+Available'; }} />
                {selectedPhoto.length > 1 && (
                  <>
                    <button className="cuspro-photo-nav prev" onClick={prevPhoto} disabled={currentPhotoIndex === 0}><FaChevronLeft /></button>
                    <button className="cuspro-photo-nav next" onClick={nextPhoto} disabled={currentPhotoIndex === selectedPhoto.length - 1}><FaChevronRight /></button>
                  </>
                )}
              </div>
              <div className="cuspro-photo-modal-footer">
                <div className="cuspro-photo-counter">{currentPhotoIndex + 1} / {selectedPhoto.length}</div>
                <button className="cuspro-photo-download" onClick={() => downloadPhoto(selectedPhoto[currentPhotoIndex], currentPhotoIndex)}><FaDownload /> Download</button>
              </div>
            </div>
          </div>
        )}

        <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      </div>
    </>
  );
};

export default MyProject;