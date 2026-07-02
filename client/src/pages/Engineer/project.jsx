// pages/Engineer/Project.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import {
  FaSearch,
  FaEye,
  FaCheckCircle,
  FaSpinner,
  FaMoneyBillWave,
  FaClock,
  FaExclamationTriangle,
  FaChevronLeft,
  FaChevronRight,
  FaTools,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaSolarPanel,
  FaMicrochip,
  FaWifi,
  FaRulerCombined,
  FaDownload,
  FaUpload,
  FaCamera,
  FaMoneyBillWaveAlt,
  FaTrash,
  FaImage,
  FaPercentage
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
  const [progressForm, setProgressForm] = useState({
    installationNotes: '',
    status: '',
    sitePhotos: []
  });
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [previewPhotos, setPreviewPhotos] = useState([]);

  useEffect(() => {
    fetchProjects();
  }, [filter, currentPage]);

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

  const updateProgress = async () => {
    if (!selectedProject) return;

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      
      let newStatus = progressForm.status;
      
      if (selectedProject.status === 'full_paid' && 
          selectedProject.paymentPreference !== 'full' && 
          progressForm.status === 'completed') {
        newStatus = 'completed';
      }
      
      if (selectedProject.status === 'in_progress' && 
          progressForm.status === 'full_paid' && 
          selectedProject.paymentPreference !== 'full') {
        newStatus = 'full_paid';
      }
      
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/projects/${selectedProject._id}/progress`,
        {
          installationNotes: progressForm.installationNotes,
          status: newStatus,
          sitePhotos: progressForm.sitePhotos
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast('Project progress updated successfully!', 'success');
      setShowProgressModal(false);
      setSelectedProject(null);
      setProgressForm({ installationNotes: '', status: '', sitePhotos: [] });
      setPreviewPhotos([]);
      fetchProjects();
    } catch (error) {
      console.error('Error updating progress:', error);
      showToast(error.response?.data?.message || 'Failed to update progress', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newPreviews = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Date.now() + Math.random()
    }));
    setPreviewPhotos(prev => [...prev, ...newPreviews]);

    setUploadingPhotos(true);
    const formData = new FormData();
    files.forEach(file => formData.append('photos', file));

    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/projects/${selectedProject._id}/upload-photos`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        const uploadedUrls = response.data.photos || [];
        setProgressForm(prev => ({
          ...prev,
          sitePhotos: [...prev.sitePhotos, ...uploadedUrls]
        }));
        showToast(`${uploadedUrls.length} photo(s) uploaded successfully!`, 'success');
        setPreviewPhotos([]);
      } else {
        showToast(response.data.message || 'Failed to upload photos', 'error');
      }
    } catch (err) {
      console.error('Error uploading photos:', err);
      showToast(err.response?.data?.message || 'Failed to upload photos', 'error');
    } finally {
      setUploadingPhotos(false);
      e.target.value = '';
    }
  };

  const removePreviewPhoto = (index) => {
    URL.revokeObjectURL(previewPhotos[index].preview);
    setPreviewPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const removeUploadedPhoto = (index) => {
    setProgressForm(prev => ({
      ...prev,
      sitePhotos: prev.sitePhotos.filter((_, i) => i !== index)
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

  // ✅ FIXED: Get payment type label for display
  const getPaymentTypeLabel = (paymentPreference) => {
    const labels = {
      'full': 'Full Payment',
      'installment': 'Installment (30-40-30)',
      'fifty_fifty': 'Installment (50-50)',
      'thirty_sixty_ten': 'Installment (30-60-10)'
    };
    return labels[paymentPreference] || 'Installment Plan';
  };

  // ✅ FIXED: Get payment type description for the badge
  const getPaymentTypeDescription = (paymentPreference) => {
    const descriptions = {
      'full': '100% One-time Payment',
      'installment': '30% → 40% → 30%',
      'fifty_fifty': '50% → 50%',
      'thirty_sixty_ten': '30% → 60% → 10%'
    };
    return descriptions[paymentPreference] || '';
  };

  // ✅ FIXED: Check if full payment is completed
  const isFullPaymentCompleted = (project) => {
    return project.status === 'full_paid' || 
           (project.paymentPreference === 'full' && project.amountPaid >= project.totalCost);
  };

  const getStatusBadge = (status, paymentPreference) => {
    // For full_paid status with different payment preferences
    if (status === 'full_paid') {
      if (paymentPreference === 'full') {
        return <span className="status-badge-engineerproject full-paid">💳 Full Payment Completed</span>;
      } else {
        // For installment plans (fifty_fifty, thirty_sixty_ten, installment)
        return <span className="status-badge-engineerproject full-paid-installment">✅ Final Payment Received</span>;
      }
    }
    
    const badges = {
      'quoted': <span className="status-badge-engineerproject quoted">📄 Quoted</span>,
      'approved': <span className="status-badge-engineerproject approved">✅ Approved</span>,
      'initial_paid': <span className="status-badge-engineerproject initial-paid">💰 Initial Paid</span>,
      'in_progress': <span className="status-badge-engineerproject in-progress">🔧 In Progress</span>,
      'progress_paid': <span className="status-badge-engineerproject progress-paid">📊 Progress Paid</span>,
      'completed': <span className="status-badge-engineerproject completed">🎉 Completed</span>,
      'cancelled': <span className="status-badge-engineerproject cancelled">❌ Cancelled</span>
    };
    return badges[status] || <span className="status-badge-engineerproject">{status}</span>;
  };

  const canStartInstallation = (status, paymentPreference) => {
    if (paymentPreference === 'full') {
      return ['approved', 'initial_paid', 'full_paid'].includes(status);
    }
    // For all installment types
    return ['approved', 'initial_paid'].includes(status);
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
      <div className="project-header-engineerproject">
        <div className="skeleton-line large"></div>
        <div className="skeleton-line medium"></div>
      </div>
      <div className="project-filters-engineerproject">
        <div className="skeleton-select"></div>
        <div className="skeleton-search"></div>
      </div>
      <div className="projects-grid-engineerproject">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="project-card-engineerproject skeleton-card">
            <div className="skeleton-line"></div>
            <div className="skeleton-line small"></div>
            <div className="skeleton-line"></div>
            <div className="skeleton-button"></div>
          </div>
        ))}
      </div>
    </div>
  );

  useEffect(() => {
    return () => {
      previewPhotos.forEach(photo => {
        if (photo.preview) URL.revokeObjectURL(photo.preview);
      });
    };
  }, [previewPhotos]);

  if (loading && projects.length === 0) {
    return <SkeletonLoader />;
  }

  return (
    <>
      <Helmet>
        <title>My Projects | Engineer | Salfer Engineering</title>
      </Helmet>

      <div className="engineer-project-container">
        <div className="project-header-engineerproject">
          <div>
            <h1>My Projects</h1>
            <p>View and track your assigned solar installation projects</p>
          </div>
        </div>

        <div className="project-filters-engineerproject">
          <div className="filter-group-engineerproject">
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

        <div className="projects-grid-engineerproject">
          {filteredProjects.length === 0 ? (
            <div className="empty-state-engineerproject">
              <FaTools className="empty-icon" />
              <h3>No projects assigned</h3>
              <p>You haven't been assigned to any projects yet.</p>
            </div>
          ) : (
            filteredProjects.map(project => {
              const canStart = canStartInstallation(project.status, project.paymentPreference);
              const isInProgress = project.status === 'in_progress';
              const isProgressPaid = project.status === 'progress_paid';
              const isFullPaid = project.status === 'full_paid';
              const isFullPayment = project.paymentPreference === 'full';
              const isInstallmentFullPaid = isFullPaid && !isFullPayment;

              return (
                <div key={project._id} className="project-card-engineerproject">
                  <div className="card-header-engineerproject">
                    <div>
                      <h3>{project.projectName}</h3>
                      <p className="project-ref">{project.projectReference}</p>
                    </div>
                    {getStatusBadge(project.status, project.paymentPreference)}
                  </div>

                  <div className="card-details-engineerproject">
                    <div className="detail-item"><FaUser /><span>{project.clientId?.contactFirstName} {project.clientId?.contactLastName}</span></div>
                    <div className="detail-item"><FaEnvelope /><span className="client-email">{project.clientId?.userId?.email || 'No email provided'}</span></div>
                    <div className="detail-item"><FaSolarPanel /><span>{project.systemSize} kWp | {project.systemType}</span></div>
                    <div className="detail-item"><FaMapMarkerAlt /><span className="truncate">{project.addressId?.houseOrBuilding} {project.addressId?.street}, {project.addressId?.barangay}</span></div>
                    <div className="detail-item"><FaCalendarAlt /><span>Started: {formatDate(project.startDate)}</span></div>
                    {isFullPaid && (
                      <div className="detail-item full-paid-badge">
                        <FaMoneyBillWaveAlt />
                        <span className="full-paid-text">
                          {isFullPayment 
                            ? '💳 Full Payment Completed - Ready for Installation' 
                            : '✅ Final Payment Received - Complete the project'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="payment-info-engineerproject">
                    <div className="payment-stats">
                      <span className="total-amount">Total: {formatCurrency(project.totalCost)}</span>
                    </div>
                    <div className="payment-method-badge">
                      <span className={`payment-method ${project.paymentPreference}`}>
                        {getPaymentTypeLabel(project.paymentPreference)}
                        <span className="payment-method-detail">
                          {getPaymentTypeDescription(project.paymentPreference)}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="card-actions-engineerproject">
                    <button className="action-btn view" onClick={() => { setSelectedProject(project); setShowDetailModal(true); }}>
                      <FaEye /> View Details
                    </button>

                    {/* Start Installation button */}
                    {canStart && !isInstallmentFullPaid && (
                      <button
                        className="action-btn start"
                        onClick={() => {
                          setSelectedProject(project);
                          setProgressForm({ installationNotes: '', status: 'in_progress', sitePhotos: project.sitePhotos || [] });
                          setPreviewPhotos([]);
                          setShowProgressModal(true);
                        }}
                      >
                        <FaTools /> Start Installation
                      </button>
                    )}

                    {/* Update Progress button */}
                    {(isInProgress || isProgressPaid) && (
                      <button
                        className="action-btn update"
                        onClick={() => {
                          setSelectedProject(project);
                          const defaultStatus = project.status;
                          setProgressForm({ 
                            installationNotes: project.installationNotes || '', 
                            status: defaultStatus, 
                            sitePhotos: project.sitePhotos || [] 
                          });
                          setPreviewPhotos([]);
                          setShowProgressModal(true);
                        }}
                      >
                        <FaCheckCircle /> Update Progress
                      </button>
                    )}

                    {/* Complete Project button for full_paid (installment only) */}
                    {isFullPaid && !isFullPayment && (
                      <button
                        className="action-btn complete"
                        onClick={() => {
                          setSelectedProject(project);
                          setProgressForm({ 
                            installationNotes: project.installationNotes || '', 
                            status: 'completed', 
                            sitePhotos: project.sitePhotos || [] 
                          });
                          setPreviewPhotos([]);
                          setShowProgressModal(true);
                        }}
                      >
                        <FaCheckCircle /> Complete Project
                      </button>
                    )}

                    {/* Confirm Final Payment button for in_progress (installment only) */}
                    {isInProgress && !isFullPayment && (
                      <button
                        className="action-btn payment-received"
                        onClick={() => {
                          setSelectedProject(project);
                          setProgressForm({ 
                            installationNotes: project.installationNotes || '', 
                            status: 'full_paid', 
                            sitePhotos: project.sitePhotos || [] 
                          });
                          setPreviewPhotos([]);
                          setShowProgressModal(true);
                        }}
                      >
                        <FaMoneyBillWave /> Confirm Final Payment
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {totalPages > 1 && (
          <div className="pagination-engineerproject">
            <button className="page-btn" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
              <FaChevronLeft /> Previous
            </button>
            <span className="page-info">Page {currentPage} of {totalPages}</span>
            <button className="page-btn" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
              Next <FaChevronRight />
            </button>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedProject && (
          <div className="modal-overlay-engineerproject" onClick={() => setShowDetailModal(false)}>
            <div className="modal-content-engineerproject detail-modal" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button>
              <h3>Project Details</h3>

              <div className="detail-section">
                <h4>Project Information</h4>
                <p><strong>Name:</strong> {selectedProject.projectName}</p>
                <p><strong>Reference:</strong> {selectedProject.projectReference}</p>
                <p><strong>Status:</strong> {getStatusBadge(selectedProject.status, selectedProject.paymentPreference)}</p>
                <p><strong>Created:</strong> {formatDate(selectedProject.createdAt)}</p>
                <p><strong>Payment Method:</strong> {getPaymentTypeLabel(selectedProject.paymentPreference)}</p>
                <p><strong>Payment Schedule:</strong> {getPaymentTypeDescription(selectedProject.paymentPreference)}</p>
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
                              {p.status === 'paid' ? '✅ Paid' : p.status === 'pending' ? '⏳ Pending' : '📅 Overdue'}
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

              <div className="modal-actions">
                <button className="close-btn" onClick={() => setShowDetailModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Progress Update Modal */}
        {showProgressModal && selectedProject && (
          <div className="modal-overlay-engineerproject" onClick={() => setShowProgressModal(false)}>
            <div className="modal-content-engineerproject progress-modal" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowProgressModal(false)}>×</button>
              <h3>Update Project Progress</h3>
              <p><strong>Project:</strong> {selectedProject.projectName}</p>
              <p><strong>Payment Plan:</strong> {getPaymentTypeLabel(selectedProject.paymentPreference)}</p>

              <div className="form-group">
                <label>Installation Notes</label>
                <textarea 
                  rows="4" 
                  value={progressForm.installationNotes} 
                  onChange={(e) => setProgressForm({ ...progressForm, installationNotes: e.target.value })} 
                  placeholder="Describe the progress, challenges, next steps..." 
                />
              </div>

              <div className="form-group">
                <label>Update Status</label>
                <select value={progressForm.status} onChange={(e) => setProgressForm({ ...progressForm, status: e.target.value })}>
                  {/* For in_progress projects */}
                  {selectedProject.status === 'in_progress' && (
                    <>
                      <option value="in_progress">🔧 In Progress</option>
                      <option value="progress_paid">📊 Progress Payment Received</option>
                      {selectedProject.paymentPreference !== 'full' && (
                        <option value="full_paid">✅ Final Payment Received</option>
                      )}
                      <option value="completed">🎉 Mark as Completed</option>
                    </>
                  )}
                  
                  {/* For progress_paid projects */}
                  {selectedProject.status === 'progress_paid' && (
                    <>
                      <option value="progress_paid">📊 Progress Paid - Continue Work</option>
                      <option value="in_progress">🔧 Back to In Progress</option>
                      {selectedProject.paymentPreference !== 'full' && (
                        <option value="full_paid">✅ Final Payment Received</option>
                      )}
                      <option value="completed">🎉 Mark as Completed</option>
                    </>
                  )}
                  
                  {/* For full_paid projects (installment only) */}
                  {selectedProject.status === 'full_paid' && selectedProject.paymentPreference !== 'full' && (
                    <>
                      <option value="full_paid">✅ Final Payment Received</option>
                      <option value="completed">🎉 Mark as Completed</option>
                    </>
                  )}
                  
                  {/* For starting installation */}
                  {selectedProject.status !== 'in_progress' && 
                   selectedProject.status !== 'progress_paid' && 
                   selectedProject.status !== 'full_paid' && (
                    <>
                      <option value="in_progress">🔧 Start Installation</option>
                      <option value="completed">🎉 Mark as Completed</option>
                    </>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>Upload Site Photos</label>
                <div className="photo-upload-area">
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={handlePhotoUpload} 
                    disabled={uploadingPhotos} 
                    id="photo-upload" 
                    style={{ display: 'none' }} 
                  />
                  <label htmlFor="photo-upload" className={`upload-label ${uploadingPhotos ? 'uploading' : ''}`}>
                    <FaCamera /> {uploadingPhotos ? 'Uploading...' : 'Click to select photos'}
                  </label>
                  <p className="upload-hint">You can select multiple photos (Max 15MB each)</p>
                </div>

                {previewPhotos.length > 0 && (
                  <div className="photo-preview-section">
                    <p className="preview-title">New Photos to Upload:</p>
                    <div className="photo-preview-grid">
                      {previewPhotos.map((photo, idx) => (
                        <div key={photo.id} className="preview-item">
                          <img src={photo.preview} alt="Preview" className="preview-image" />
                          <button type="button" className="remove-preview-btn" onClick={() => removePreviewPhoto(idx)}><FaTrash /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {progressForm.sitePhotos && progressForm.sitePhotos.length > 0 && (
                  <div className="uploaded-photos-section">
                    <p className="uploaded-title">Existing Photos ({progressForm.sitePhotos.length}):</p>
                    <div className="uploaded-photos-grid">
                      {progressForm.sitePhotos.map((photo, idx) => (
                        <div key={idx} className="uploaded-item">
                          <img src={photo} alt={`Uploaded ${idx + 1}`} className="uploaded-image" onError={(e) => { e.target.src = 'https://via.placeholder.com/100?text=Error'; }} />
                          <button type="button" className="remove-uploaded-btn" onClick={() => removeUploadedPhoto(idx)}><FaTrash /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => { setShowProgressModal(false); setPreviewPhotos([]); }}>Cancel</button>
                <button className="update-btn" onClick={updateProgress} disabled={isSubmitting}>
                  {isSubmitting ? <FaSpinner className="spinning" /> : null}
                  {isSubmitting ? 'Updating...' : 'Update Progress'}
                </button>
              </div>
            </div>
          </div>
        )}

        <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      </div>
    </>
  );
};

export default EngineerProject;