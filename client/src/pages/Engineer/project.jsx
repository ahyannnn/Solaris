// pages/Engineer/Project.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import {
  FaSearch,
  FaEye,
  FaCheckCircle,
  FaSpinner,
  FaChevronLeft,
  FaChevronRight,
  FaTools,
  FaFilter,
  FaFolderOpen,
  FaPlay,
  FaUpload,
  FaCamera,
  FaTrash,
  FaImage,
  FaCheck,
  FaClock
} from 'react-icons/fa';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import '../../styles/Engineer/project.css';

const EngineerProject = () => {
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [newPhotoFiles, setNewPhotoFiles] = useState([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState([]);
  const [progressForm, setProgressForm] = useState({
    installationNotes: '',
  });

  useEffect(() => {
    fetchProjects();
  }, [filter, currentPage]);

  // ============================================================
  // FETCH PROJECTS - API
  // ============================================================
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects/engineer/my-projects`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: filter === 'all' ? undefined : filter, page: currentPage, limit: 10 }
      });

      const projectsData = response.data.projects || [];
      setProjects(projectsData);
      setTotalPages(response.data.totalPages || 1);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching projects:', error);
      showToast('Failed to load projects', 'error');
      setLoading(false);
    }
  };

  // ============================================================
  // TIMELINE LOGIC
  // ============================================================

  const isPaymentPaid = (project, paymentType) => {
    const scheduleItem = project.paymentSchedule?.find(p => p.type === paymentType);
    if (scheduleItem?.status === 'paid') return true;
    if (paymentType === 'full' && project.fullPaymentCompleted) return true;
    return false;
  };

  const getTimelineItems = (project) => {
    if (!project) return [];

    const isFullPayment = project.paymentPreference === 'full';
    const initialPaid = isPaymentPaid(project, 'initial');
    const progressPaid = isPaymentPaid(project, 'progress');
    const finalPaid = isPaymentPaid(project, 'final');
    const fullPaid = isPaymentPaid(project, 'full');

    if (isFullPayment) {
      return [
        { key: 'quotation', title: 'Quotation', completed: true, date: project.createdAt },
        { key: 'payment', title: 'Full Payment', completed: fullPaid, date: project.paymentSchedule?.find(p => p.type === 'full')?.paidAt },
        { key: 'installation', title: 'Installation', completed: ['full_paid', 'in_progress', 'completed'].includes(project.status), date: project.startDate },
        { key: 'complete', title: 'Completion', completed: project.status === 'completed', date: project.actualCompletionDate }
      ];
    } else if (project.paymentPreference === 'fifty_fifty') {
      return [
        { key: 'quotation', title: 'Quotation', completed: true, date: project.createdAt },
        { key: 'initial', title: 'Initial (50%)', completed: initialPaid || finalPaid, date: project.paymentSchedule?.find(p => p.type === 'initial')?.paidAt },
        { key: 'installation', title: 'Installation', completed: ['in_progress', 'full_paid', 'completed'].includes(project.status) || finalPaid, date: project.startDate },
        { key: 'final', title: 'Final (50%)', completed: finalPaid, date: project.paymentSchedule?.find(p => p.type === 'final')?.paidAt },
        { key: 'complete', title: 'Handover', completed: project.status === 'completed', date: project.actualCompletionDate }
      ];
    } else {
      return [
        { key: 'quotation', title: 'Quotation', completed: true, date: project.createdAt },
        { key: 'initial', title: 'Initial (30%)', completed: initialPaid || finalPaid, date: project.paymentSchedule?.find(p => p.type === 'initial')?.paidAt },
        { key: 'installation', title: 'Installation', completed: ['in_progress', 'progress_paid', 'full_paid', 'completed'].includes(project.status) || finalPaid, date: project.startDate },
        { key: 'progress', title: 'Progress (60%)', completed: progressPaid || finalPaid, date: project.paymentSchedule?.find(p => p.type === 'progress')?.paidAt },
        { key: 'final', title: 'Final (10%)', completed: finalPaid, date: project.paymentSchedule?.find(p => p.type === 'final')?.paidAt },
        { key: 'complete', title: 'Handover', completed: project.status === 'completed', date: project.actualCompletionDate }
      ];
    }
  };

  const getProjectProgress = (project) => {
    const timeline = getTimelineItems(project);
    const completed = timeline.filter(item => item.completed).length;
    return Math.round((completed / timeline.length) * 100);
  };

  // ============================================================
  // PHOTO UPLOAD - API
  // ============================================================

  const uploadPhotos = async () => {
    if (!selectedProject) return;
    if (newPhotoFiles.length === 0) {
      showToast('Please select photos to upload', 'warning');
      return;
    }

    setUploadingPhotos(true);
    try {
      const token = sessionStorage.getItem('token');
      const formData = new FormData();
      newPhotoFiles.forEach(file => formData.append('photos', file));

      const uploadResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/projects/${selectedProject._id}/upload-photos`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );

      const uploadedPhotoUrls = uploadResponse.data.photos || [];
      console.log('📸 Photos uploaded:', uploadedPhotoUrls);

      setNewPhotoFiles([]);
      setNewPhotoPreviews([]);

      await fetchProjects();

      showToast(`${uploadedPhotoUrls.length} photo(s) uploaded successfully!`, 'success');
    } catch (uploadError) {
      console.error('Error uploading photos:', uploadError);
      showToast(uploadError.response?.data?.message || 'Failed to upload photos', 'error');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const previews = files.map(file => URL.createObjectURL(file));

    setNewPhotoFiles(prev => [...prev, ...files]);
    setNewPhotoPreviews(prev => [...prev, ...previews]);

    e.target.value = '';
  };

  const removePhoto = (index) => {
    URL.revokeObjectURL(newPhotoPreviews[index]);
    setNewPhotoPreviews(prev => prev.filter((_, i) => i !== index));
    setNewPhotoFiles(prev => prev.filter((_, i) => i !== index));
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

  const getPaymentTypeLabel = (paymentPreference) => {
    const labels = {
      'full': 'Full Payment',
      'installment': 'Installment (30-40-30)',
      'fifty_fifty': 'Installment (50-50)',
      'thirty_sixty_ten': 'Installment (30-60-10)'
    };
    return labels[paymentPreference] || 'Installment Plan';
  };

  const getPaymentTypeDescription = (paymentPreference) => {
    const descriptions = {
      'full': '100% One-time',
      'installment': '30% → 40% → 30%',
      'fifty_fifty': '50% → 50%',
      'thirty_sixty_ten': '30% → 60% → 10%'
    };
    return descriptions[paymentPreference] || '';
  };

  const getStatusBadge = (status, paymentPreference) => {
    if (status === 'full_paid') {
      if (paymentPreference === 'full') {
        return <span className="status-badge-engineerproject full-paid">Full Payment Completed</span>;
      } else {
        return <span className="status-badge-engineerproject full-paid-installment">Final Payment Received</span>;
      }
    }

    const badges = {
      'quoted': <span className="status-badge-engineerproject quoted">Quoted</span>,
      'approved': <span className="status-badge-engineerproject approved">Approved</span>,
      'initial_paid': <span className="status-badge-engineerproject initial-paid">Initial Paid</span>,
      'in_progress': <span className="status-badge-engineerproject in-progress">In Progress</span>,
      'progress_paid': <span className="status-badge-engineerproject progress-paid">Progress Paid</span>,
      'completed': <span className="status-badge-engineerproject completed">Completed</span>,
      'cancelled': <span className="status-badge-engineerproject cancelled">Cancelled</span>
    };
    return badges[status] || <span className="status-badge-engineerproject">{status}</span>;
  };

  // ============================================================
  // STEP-BASED WORKFLOW FUNCTIONS - FIXED ✅
  // ============================================================

  /**
   * Check if the required initial payment is paid
   */
  const isRequiredPaymentPaid = (project) => {
    const { paymentPreference } = project;

    if (paymentPreference === 'full') {
      return isPaymentPaid(project, 'full');
    } else if (paymentPreference === 'fifty_fifty') {
      return isPaymentPaid(project, 'initial');
    } else if (paymentPreference === 'thirty_sixty_ten') {
      return isPaymentPaid(project, 'initial');
    }
    return false;
  };

  /**
   * Check if project is waiting for payment (used in modal to lock the submit button)
   */
  const isWaitingForPayment = (project) => {
    const { status, paymentPreference } = project;

    if (status === 'quoted' || status === 'approved') {
      return true;
    }

    if (status === 'in_progress') {
      if (paymentPreference === 'fifty_fifty') {
        return !isPaymentPaid(project, 'final');
      }
      if (paymentPreference === 'thirty_sixty_ten') {
        if (isPaymentPaid(project, 'progress')) {
          return !isPaymentPaid(project, 'final');
        }
        return true;
      }
      if (paymentPreference === 'full') {
        return !isPaymentPaid(project, 'full');
      }
    }

    if (status === 'progress_paid') {
      if (paymentPreference === 'fifty_fifty') {
        return !isPaymentPaid(project, 'final');
      }
      if (paymentPreference === 'thirty_sixty_ten') {
        return !isPaymentPaid(project, 'final');
      }
    }

    return false;
  };

  /**
   * Check if project is on the final step (ready to complete)
   */
  const isFinalStep = (project) => {
    const { status, paymentPreference } = project;

    // Completed projects are not in final step
    if (status === 'completed') return false;

    // Full Payment: full_paid means final step (if installation started)
    if (paymentPreference === 'full') {
      if (status === 'full_paid' || (status === 'in_progress' && isPaymentPaid(project, 'full'))) {
        return true;
      }
    }

    // 50-50: final payment paid means final step
    if (paymentPreference === 'fifty_fifty') {
      if (status === 'full_paid' || (status === 'in_progress' && isPaymentPaid(project, 'final'))) {
        return true;
      }
    }

    // 30-60-10: final (10%) payment paid means final step
    if (paymentPreference === 'thirty_sixty_ten') {
      if (status === 'full_paid' || (status === 'in_progress' && isPaymentPaid(project, 'final'))) {
        return true;
      }
      // Also if status is progress_paid and final is paid
      if (status === 'progress_paid' && isPaymentPaid(project, 'final')) {
        return true;
      }
    }

    return false;
  };

  /**
   * Get the current action for a project
   * 
   * RULES:
   * - quoted/approved → NO BUTTON (waiting for payment)
   * - initial_paid/full_paid (with required payment paid) → Start
   * - in_progress → Update (ALWAYS may Update, kahit 60% pending or final step)
   * - progress_paid → Update
   * - completed → View
   * - full_paid for installment → Update (final step)
   * 
   * ✅ FIXED: Removed isWaitingForPayment() check from in_progress
   * The payment lock now only exists in the modal
   */
  const getProjectAction = (project) => {
    const { status, paymentPreference } = project;

    // Completed → View only
    if (status === 'completed') {
      return { type: 'view', label: 'View', icon: <FaEye />, isFinal: false };
    }

    // WAITING FOR PAYMENT → NO BUTTON
    if (status === 'quoted' || status === 'approved') {
      return { type: 'none', label: null, icon: null, isFinal: false };
    }

    // Ready to start → Start Installation
    if (status === 'initial_paid' && isRequiredPaymentPaid(project)) {
      return { type: 'start', label: 'Start', icon: <FaTools />, isFinal: false };
    }

    // Full payment ready to start (ONLY for Full Payment preference)
    if (status === 'full_paid' && paymentPreference === 'full' && isRequiredPaymentPaid(project)) {
      return { type: 'start', label: 'Start', icon: <FaTools />, isFinal: false };
    }

    // ============================================================
    // FIX: full_paid for INSTALLMENT projects
    // full_paid in installment = final payment received
    // Should show UPDATE button (not Complete in table)
    // ============================================================
    if (status === 'full_paid' && paymentPreference !== 'full') {
      const finalStep = isFinalStep(project);
      return { type: 'update', label: 'Update', icon: <FaCheckCircle />, isFinal: finalStep };
    }

    // ============================================================
    // ✅ FIXED: in_progress → ALWAYS show Update button
    // NO payment check here! That belongs in the modal.
    // ============================================================
    if (status === 'in_progress') {
      const finalStep = isFinalStep(project);
      return { type: 'update', label: 'Update', icon: <FaCheckCircle />, isFinal: finalStep };
    }

    // ============================================================
    // ✅ FIXED: progress_paid → ALWAYS show Update button
    // NO payment check here! That belongs in the modal.
    // ============================================================
    if (status === 'progress_paid') {
      const finalStep = isFinalStep(project);
      return { type: 'update', label: 'Update', icon: <FaCheckCircle />, isFinal: finalStep };
    }

    // No action
    return { type: 'none', label: null, icon: null, isFinal: false };
  };

  // ============================================================
  // UPDATE PROGRESS - API
  // ============================================================

  const updateProgress = async (actionType, isFinalAction) => {
    if (!selectedProject) return;

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');

      // Determine next status based on action type
      let nextStatus = selectedProject.status;
      if (actionType === 'start') {
        nextStatus = 'in_progress';
      } else if (actionType === 'complete' || isFinalAction) {
        nextStatus = 'completed';
      } else if (actionType === 'update') {
        nextStatus = 'in_progress';
      }

      const payload = {
        installationNotes: progressForm.installationNotes,
      };

      if (nextStatus !== selectedProject.status) {
        payload.status = nextStatus;
      }

      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/projects/${selectedProject._id}/progress`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      let statusMessage = 'Project progress updated successfully!';
      if (actionType === 'start') statusMessage = 'Installation started successfully!';
      if (actionType === 'complete' || isFinalAction) statusMessage = 'Project marked as completed!';

      showToast(statusMessage, 'success');

      setShowProgressModal(false);
      setSelectedProject(null);
      setProgressForm({ installationNotes: '' });
      setNewPhotoFiles([]);
      setNewPhotoPreviews([]);
      fetchProjects();
    } catch (error) {
      console.error('Error updating progress:', error);
      showToast(error.response?.data?.message || 'Failed to update progress', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================
  // SUMMARY CARDS
  // ============================================================

  const totalProjects = projects.length;
  const readyToStart = projects.filter(p => {
    const action = getProjectAction(p);
    return action.type === 'start';
  }).length;
  const inProgress = projects.filter(p => p.status === 'in_progress').length;
  const completed = projects.filter(p => p.status === 'completed').length;

  // ============================================================
  // RENDER PROGRESS INDICATOR
  // ============================================================

  const renderProgressIndicator = (project) => {
    const progress = getProjectProgress(project);
    const isCompleted = project.status === 'completed';

    return (
      <div className="progress-indicator-compact">
        <span className={`progress-percentage-text ${isCompleted ? 'completed' : ''}`}>{progress}%</span>
        <div className="progress-stage-label">
          {isCompleted ? (
            <span className="stage-label completed-label">Completed</span>
          ) : (
            <span className="stage-label current-label">{getTimelineItems(project).find(i => !i.completed)?.title || ''}</span>
          )}
        </div>
      </div>
    );
  };

  const filteredProjects = projects.filter(project => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return project.projectName?.toLowerCase().includes(searchLower) ||
      project.projectReference?.toLowerCase().includes(searchLower) ||
      project.clientId?.contactFirstName?.toLowerCase().includes(searchLower) ||
      project.clientId?.contactLastName?.toLowerCase().includes(searchLower);
  });

  const SkeletonLoader = () => (
    <div className="engineer-project-container">
      <div className="summary-cards-grid">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="summary-card skeleton-card">
            <div className="skeleton-line large"></div>
            <div className="skeleton-line medium"></div>
          </div>
        ))}
      </div>
      <div className="project-header-engineerproject">
        <div className="skeleton-line large"></div>
        <div className="skeleton-line medium"></div>
      </div>
      <div className="project-filters-engineerproject">
        <div className="skeleton-select"></div>
        <div className="skeleton-search"></div>
      </div>
      <div className="projects-table-container-engineerproject">
        <table className="projects-table-engineerproject">
          <thead>
            <tr>
              <th>Project</th>
              <th>Client</th>
              <th>System</th>
              <th>Address</th>
              <th>Payment</th>
              <th>Progress</th>
              <th>Status</th>
              <th>Financial</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map(i => (
              <tr key={i} className="skeleton-row">
                <td><div className="skeleton-cell"></div></td>
                <td><div className="skeleton-cell"></div></td>
                <td><div className="skeleton-cell"></div></td>
                <td><div className="skeleton-cell"></div></td>
                <td><div className="skeleton-cell"></div></td>
                <td><div className="skeleton-cell"></div></td>
                <td><div className="skeleton-cell"></div></td>
                <td><div className="skeleton-cell"></div></td>
                <td><div className="skeleton-cell"></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading && projects.length === 0) {
    return <SkeletonLoader />;
  }

  return (
    <>
      <Helmet>
        <title>My Projects | Engineer | Salfer Engineering</title>
      </Helmet>

      <div className="engineer-project-container">

        {/* SUMMARY CARDS */}
        <div className="summary-cards-grid">
          <div className="summary-card">
            <div className="summary-card-content">
              <span className="summary-card-value">{totalProjects}</span>
              <span className="summary-card-label">Total Projects</span>
              <span className="summary-card-subtitle">Assigned projects</span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-card-content">
              <span className="summary-card-value">{readyToStart}</span>
              <span className="summary-card-label">Ready to Start</span>
              <span className="summary-card-subtitle">Ready for installation</span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-card-content">
              <span className="summary-card-value">{inProgress}</span>
              <span className="summary-card-label">In Progress</span>
              <span className="summary-card-subtitle">Active installations</span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-card-content">
              <span className="summary-card-value">{completed}</span>
              <span className="summary-card-label">Completed</span>
              <span className="summary-card-subtitle">Finished projects</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="project-filters-engineerproject">
          <div className="filter-group-engineerproject">
            <FaFilter className="filter-icon" />
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="quoted">Quoted</option>
              <option value="approved">Approved</option>
              <option value="initial_paid">Initial Paid</option>
              <option value="full_paid">Full Paid</option>
              <option value="in_progress">In Progress</option>
              <option value="progress_paid">Progress Paid</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="search-group-engineerproject">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by project name, reference or client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Projects Table */}
        {filteredProjects.length === 0 ? (
          <div className="empty-state-engineerproject">
            <FaTools className="empty-icon" />
            <h3>No projects assigned</h3>
            <p>You haven't been assigned to any projects yet.</p>
          </div>
        ) : (
          <>
            <div className="projects-table-container-engineerproject">
              <table className="projects-table-engineerproject">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Client</th>
                    <th>System</th>
                    <th>Address</th>
                    <th>Payment</th>
                    <th>Progress</th>
                    <th>Status</th>
                    <th>Financial</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map(project => {
                    const action = getProjectAction(project);
                    const isViewOnly = action.type === 'view';
                    const isStart = action.type === 'start';
                    const isUpdate = action.type === 'update';
                    const noAction = action.type === 'none';

                    return (
                      <tr key={project._id}>
                        <td data-label="Project">
                          <div className="project-name-cell">{project.projectName}</div>
                          <div className="project-ref-cell">{project.projectReference}</div>
                        </td>
                        <td data-label="Client">
                          <div className="client-cell">
                            <span className="client-name">{project.clientId?.contactFirstName} {project.clientId?.contactLastName}</span>
                            <span className="client-contact">{project.clientId?.contactNumber}</span>
                          </div>
                        </td>
                        <td data-label="System">
                          <div className="system-cell">
                            <span className="system-size">{project.systemSize} kWp</span>
                            <span className="system-type">{project.systemType}</span>
                          </div>
                        </td>
                        <td data-label="Address">
                          <div className="address-cell">
                            <span className="address-text" title={`${project.addressId?.houseOrBuilding || ''} ${project.addressId?.street || ''}, ${project.addressId?.barangay || ''}, ${project.addressId?.cityMunicipality || ''}`}>
                              {project.addressId?.houseOrBuilding} {project.addressId?.street}, {project.addressId?.barangay}
                            </span>
                          </div>
                        </td>
                        <td data-label="Payment">
                          <div className="payment-cell">
                            <span className="payment-label">{getPaymentTypeLabel(project.paymentPreference)}</span>
                            <span className="payment-desc">{getPaymentTypeDescription(project.paymentPreference)}</span>
                          </div>
                        </td>
                        <td data-label="Progress">
                          {renderProgressIndicator(project)}
                        </td>
                        <td data-label="Status">
                          {getStatusBadge(project.status, project.paymentPreference)}
                        </td>
                        <td data-label="Financial">
                          <div className="financial-cell">
                            <span className="amount-paid">Paid: {formatCurrency(project.amountPaid)}</span>
                            <span className="total-amount">Total: {formatCurrency(project.totalCost)}</span>
                          </div>
                        </td>
                        <td data-label="Actions">
                          <div className="actions-cell">
                            {isViewOnly && (
                              <button
                                className="action-btn view"
                                onClick={() => { setSelectedProject(project); setShowDetailModal(true); }}
                              >
                                <FaEye /> View
                              </button>
                            )}

                            {isStart && (
                              <button
                                className="action-btn start"
                                onClick={() => {
                                  setSelectedProject(project);
                                  setProgressForm({ installationNotes: '' });
                                  setNewPhotoFiles([]);
                                  setNewPhotoPreviews([]);
                                  setShowProgressModal(true);
                                }}
                              >
                                <FaTools /> Start
                              </button>
                            )}

                            {isUpdate && (
                              <button
                                className="action-btn update"
                                onClick={() => {
                                  setSelectedProject(project);
                                  setProgressForm({ installationNotes: project.installationNotes || '' });
                                  setNewPhotoFiles([]);
                                  setNewPhotoPreviews([]);
                                  setShowProgressModal(true);
                                }}
                              >
                                <FaCheckCircle /> Update
                              </button>
                            )}

                            {noAction && (
                              <span className="action-placeholder">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination-engineerproject">
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
          </>
        )}

        {/* ============================================================
            Detail Modal
            ============================================================ */}
        {showDetailModal && selectedProject && (
          <div className="modal-overlay-engineerproject" onClick={() => setShowDetailModal(false)}>
            <div className="modal-content-engineerproject detail-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header-engineerproject">
                <h3>Project Details</h3>
                <button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button>
              </div>
              <div className="modal-body-engineerproject">
                {/* Project Information */}
                <div className="detail-section">
                  <h4>Project Information</h4>
                  <p><strong>Name:</strong> {selectedProject.projectName}</p>
                  <p><strong>Reference:</strong> {selectedProject.projectReference}</p>
                  <p><strong>Status:</strong> {getStatusBadge(selectedProject.status, selectedProject.paymentPreference)}</p>
                  <p><strong>Created:</strong> {formatDate(selectedProject.createdAt)}</p>
                  <p><strong>Payment Method:</strong> {getPaymentTypeLabel(selectedProject.paymentPreference)}</p>
                  <p><strong>Payment Schedule:</strong> {getPaymentTypeDescription(selectedProject.paymentPreference)}</p>
                </div>

                {/* PROJECT PROGRESS */}
                <div className="detail-section progress-section">
                  <h4>Project Progress</h4>
                  <div className="modal-timeline">
                    {getTimelineItems(selectedProject).map((item, index) => {
                      const isCompleted = item.completed || selectedProject.status === 'completed';
                      const isCurrent = index === getTimelineItems(selectedProject).findIndex(i => !i.completed) && selectedProject.status !== 'completed';
                      const isUpcoming = !isCompleted && !isCurrent;

                      return (
                        <div key={item.key} className="modal-timeline-item">
                          <div className="modal-timeline-marker">
                            {isCompleted ? (
                              <FaCheckCircle className="timeline-icon completed" />
                            ) : isCurrent ? (
                              <div className="timeline-icon current-dot"></div>
                            ) : (
                              <div className="timeline-icon upcoming-dot"></div>
                            )}
                            {index < getTimelineItems(selectedProject).length - 1 && (
                              <div className={`modal-timeline-line ${isCompleted ? 'completed' : ''}`} />
                            )}
                          </div>
                          <div className="modal-timeline-content">
                            <div className="modal-timeline-title">
                              <span className={isCompleted ? 'completed-text' : isCurrent ? 'current-text' : 'upcoming-text'}>
                                {item.title}
                              </span>
                              {isCompleted && <FaCheck className="check-icon" />}
                            </div>
                            <div className="modal-timeline-date">
                              {item.completed ? formatDate(item.date) : isCurrent ? 'In Progress' : 'Upcoming'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="modal-progress-percent">
                    <span className="progress-label">Overall Progress</span>
                    <span className="progress-value">{getProjectProgress(selectedProject)}%</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Client Information</h4>
                  <p><strong>Name:</strong> {selectedProject.clientId?.contactFirstName} {selectedProject.clientId?.contactLastName}</p>
                  <p><strong>Contact:</strong> {selectedProject.clientId?.contactNumber}</p>
                  <p><strong>Email:</strong> {selectedProject.clientId?.userId?.email || 'No email provided'}</p>
                  <p><strong>Address:</strong> {selectedProject.addressId?.houseOrBuilding} {selectedProject.addressId?.street}, {selectedProject.addressId?.barangay}, {selectedProject.addressId?.cityMunicipality}</p>
                </div>

                <div className="detail-section">
                  <h4>System Specifications</h4>
                  <p><strong>System Size:</strong> {selectedProject.systemSize} kWp</p>
                  <p><strong>System Type:</strong> {selectedProject.systemType}</p>
                  <p><strong>Panels Needed:</strong> {selectedProject.panelsNeeded || 'To be determined'}</p>
                  <p><strong>Inverter Type:</strong> {selectedProject.inverterType || 'Standard'}</p>
                  <p><strong>Battery Type:</strong> {selectedProject.batteryType || 'N/A'}</p>
                </div>

                <div className="detail-section">
                  <h4>Financial Summary</h4>
                  <p><strong>Total Cost:</strong> {formatCurrency(selectedProject.totalCost)}</p>
                  <p><strong>Amount Paid:</strong> {formatCurrency(selectedProject.amountPaid)}</p>
                  <p><strong>Balance:</strong> {formatCurrency(selectedProject.balance)}</p>
                </div>

                {selectedProject.paymentSchedule && selectedProject.paymentSchedule.length > 0 && (
                  <div className="detail-section">
                    <h4>Payment Schedule</h4>
                    <table className="payment-schedule-table">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Amount</th>
                          <th>Due Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProject.paymentSchedule.map((p, idx) => (
                          <tr key={idx}>
                            <td className="payment-type-cell">{p.type}</td>
                            <td>{formatCurrency(p.amount)}</td>
                            <td>{formatDate(p.dueDate)}</td>
                            <td>
                              <span className={`payment-status-badge ${p.status}`}>
                                {p.status === 'paid' ? 'Paid' : p.status === 'pending' ? 'Pending' : 'Overdue'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {selectedProject.installationNotes && (
                  <div className="detail-section">
                    <h4>Installation Notes</h4>
                    <p>{selectedProject.installationNotes}</p>
                  </div>
                )}

                {selectedProject.sitePhotos?.length > 0 && (
                  <div className="detail-section">
                    <h4>Site Photos</h4>
                    <div className="photo-grid">
                      {selectedProject.sitePhotos.map((photo, idx) => (
                        <div key={idx} className="photo-item">
                          <img src={photo} alt={`Site ${idx + 1}`} className="photo-thumb" onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=No+Image'; }} />
                          <a href={photo} target="_blank" rel="noopener noreferrer" className="photo-view-link">View</a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button className="close-btn" onClick={() => setShowDetailModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            Progress Update Modal - FIXED ✅
            Just disabled buttons when payment pending - no new UI elements
            ============================================================ */}
        {showProgressModal && selectedProject && (
          <div className="modal-overlay-engineerproject" onClick={() => setShowProgressModal(false)}>
            <div className="modal-content-engineerproject progress-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header-engineerproject">
                <h3>
                  {getProjectAction(selectedProject).type === 'start' && 'Start Installation'}
                  {getProjectAction(selectedProject).type === 'update' && 
                    (getProjectAction(selectedProject).isFinal ? 'Complete Project' : 'Update Project Progress')}
                </h3>
                <button className="modal-close" onClick={() => {
                  setShowProgressModal(false);
                  setProgressForm({ installationNotes: '' });
                  setNewPhotoFiles([]);
                  setNewPhotoPreviews([]);
                }}>×</button>
              </div>
              <div className="modal-body-engineerproject">
                <p><strong>Project:</strong> {selectedProject.projectName}</p>

                {/* Progress Chart */}
                <div className="modal-progress-chart">
                  <div className="progress-chart-header">
                    <span className="chart-label">Project Progress</span>
                    <span className="chart-percentage">{getProjectProgress(selectedProject)}%</span>
                  </div>
                  <div className="progress-chart-bar">
                    <div
                      className="progress-chart-fill"
                      style={{ width: `${getProjectProgress(selectedProject)}%` }}
                    ></div>
                  </div>
                  <div className="progress-chart-stages">
                    {getTimelineItems(selectedProject).map((item, index) => {
                      const isCompleted = item.completed || selectedProject.status === 'completed';
                      const isCurrent = index === getTimelineItems(selectedProject).findIndex(i => !i.completed) && selectedProject.status !== 'completed';

                      return (
                        <div key={item.key} className={`chart-stage ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                          <div className="stage-dot"></div>
                          <span className="stage-label">{item.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedProject.sitePhotos && selectedProject.sitePhotos.length > 0 && (
                  <div className="existing-photos-info">
                    <FaImage /> {selectedProject.sitePhotos.length} existing photo(s) on file
                  </div>
                )}

                <div className="form-group">
                  <label>Installation Notes</label>
                  <textarea
                    rows="4"
                    value={progressForm.installationNotes}
                    onChange={(e) => setProgressForm({ ...progressForm, installationNotes: e.target.value })}
                    placeholder="Describe the progress, challenges, next steps..."
                    disabled={isWaitingForPayment(selectedProject)}
                  />
                </div>

                <div className="form-group">
                  <label>Add New Photos</label>
                  <div className="photo-upload-area">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoSelect}
                      disabled={uploadingPhotos || isWaitingForPayment(selectedProject)}
                      id="photo-upload"
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="photo-upload" className="upload-white-btn">
                      <FaCamera /> Select photos to upload
                    </label>
                    <p className="upload-hint">
                      {newPhotoFiles.length > 0
                        ? `${newPhotoFiles.length} new photo(s) selected`
                        : isWaitingForPayment(selectedProject) 
                          ? 'Upload disabled - payment required' 
                          : 'Select new photos to add to this project'}
                    </p>
                  </div>

                  {newPhotoPreviews.length > 0 && (
                    <div className="photo-preview-grid">
                      {newPhotoPreviews.map((preview, index) => (
                        <div key={index} className="photo-preview-item">
                          <img src={preview} alt={`New upload ${index + 1}`} className="photo-preview-thumb" />
                          <button
                            className="remove-photo-btn"
                            onClick={() => removePhoto(index)}
                            title="Remove photo"
                            disabled={isWaitingForPayment(selectedProject)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-actions-side-by-side">
                <button
                  className="cancel-btn"
                  onClick={() => {
                    setShowProgressModal(false);
                    setProgressForm({ installationNotes: '' });
                    setNewPhotoFiles([]);
                    setNewPhotoPreviews([]);
                  }}
                >
                  Cancel
                </button>
                <div className="action-buttons-group">
                  <button
                    className="upload-photos-btn"
                    onClick={uploadPhotos}
                    disabled={uploadingPhotos || newPhotoFiles.length === 0 || isWaitingForPayment(selectedProject)}
                  >
                    {uploadingPhotos ? <FaSpinner className="spinning" /> : <FaUpload />}
                    {uploadingPhotos ? 'Uploading...' : 'Upload Photos'}
                  </button>
                  
                  {(() => {
                    const action = getProjectAction(selectedProject);
                    const isFinal = action.isFinal || false;
                    const progressLocked = isWaitingForPayment(selectedProject);

                    let buttonText = 'Update Progress';
                    if (action.type === 'start') buttonText = 'Start Installation';
                    else if (isFinal) buttonText = 'Complete Project';

                    return (
                      <button
                        className="update-btn"
                        onClick={() => {
                          if (progressLocked) return;
                          updateProgress(action.type, isFinal);
                        }}
                        disabled={isSubmitting || progressLocked}
                      >
                        {isSubmitting ? <FaSpinner className="spinning" /> : null}
                        {isSubmitting ? 'Submitting...' : buttonText}
                      </button>
                    );
                  })()}
                </div>
              </div>
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

export default EngineerProject;