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
  FaPercentage,
  FaFilter,
  FaPlus
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
    status: '',
  });

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

  // Upload photos only - separate from progress update
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

      // Clear the new photo states
      setNewPhotoFiles([]);
      setNewPhotoPreviews([]);

      // Refresh the project data to show new photos
      await fetchProjects();

      showToast(`${uploadedPhotoUrls.length} photo(s) uploaded successfully!`, 'success');
    } catch (uploadError) {
      console.error('Error uploading photos:', uploadError);
      showToast(uploadError.response?.data?.message || 'Failed to upload photos', 'error');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const updateProgress = async () => {
    if (!selectedProject) return;

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');

      // Get existing photos from the project
      const existingPhotos = selectedProject.sitePhotos || [];

      // Update project progress (no photo upload here)
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/projects/${selectedProject._id}/progress`,
        {
          installationNotes: progressForm.installationNotes,
          status: progressForm.status,
          // Don't modify photos here
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast('Project progress updated successfully!', 'success');

      // Close modal and reset form
      setShowProgressModal(false);
      setSelectedProject(null);
      setProgressForm({ installationNotes: '', status: '' });
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

  // Handle file selection - only store new files and previews
  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Create object URLs for preview
    const previews = files.map(file => URL.createObjectURL(file));

    setNewPhotoFiles(prev => [...prev, ...files]);
    setNewPhotoPreviews(prev => [...prev, ...previews]);

    // Clear the input so same file can be re-selected
    e.target.value = '';
  };

  const removePhoto = (index) => {
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(newPhotoPreviews[index]);

    // Remove from previews
    setNewPhotoPreviews(prev => prev.filter((_, i) => i !== index));

    // Remove from files to upload
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

  // Helper to check if engineer can start installation
  const canStartInstallation = (status, paymentPreference) => {
    // Full payment preference: can start when status is full_paid
    if (paymentPreference === 'full' && status === 'full_paid') {
      return true;
    }

    // Fifty-fifty or thirty-sixty-ten payment preferences: can start when status is initial_paid
    if ((paymentPreference === 'fifty_fifty' || paymentPreference === 'thirty_sixty_ten') && status === 'initial_paid') {
      return true;
    }

    return false;
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
      <div className="projects-table-container-engineerproject">
        <table className="projects-table-engineerproject">
          <thead>
            <tr>
              <th>Project</th>
              <th>Client</th>
              <th>System</th>
              <th>Address</th>
              <th>Payment</th>
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
        <div className="project-header-engineerproject">
          <div>
            <h1>My Projects</h1>
            <p>View and track your assigned solar installation projects</p>
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
                    <th>Status</th>
                    <th>Financial</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map(project => {
                    const canStart = canStartInstallation(project.status, project.paymentPreference);
                    const isInProgress = project.status === 'in_progress';
                    const isProgressPaid = project.status === 'progress_paid';

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
                            <button
                              className="action-btn view"
                              onClick={() => { setSelectedProject(project); setShowDetailModal(true); }}
                            >
                              <FaEye /> View
                            </button>

                            {/* Start Installation button */}
                            {canStart && (
                              <button
                                className="action-btn start"
                                onClick={() => {
                                  setSelectedProject(project);
                                  setProgressForm({
                                    installationNotes: '',
                                    status: 'in_progress',
                                  });
                                  setNewPhotoFiles([]);
                                  setNewPhotoPreviews([]);
                                  setShowProgressModal(true);
                                }}
                              >
                                <FaTools /> Start
                              </button>
                            )}

                            {/* Update Progress button */}
                            {project.status !== 'completed' && !canStart&& (
                              <button
                                className="action-btn update"
                                onClick={() => {
                                  setSelectedProject(project);
                                  setProgressForm({
                                    installationNotes: project.installationNotes || '',
                                    status: project.status,
                                  });
                                  setNewPhotoFiles([]);
                                  setNewPhotoPreviews([]);
                                  setShowProgressModal(true);
                                }}
                              >
                                <FaCheckCircle /> Update
                              </button>
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

              <div className="modal-actions">
                <button className="close-btn" onClick={() => setShowDetailModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Progress Update Modal with Photo Upload */}
        {showProgressModal && selectedProject && (
          <div className="modal-overlay-engineerproject" onClick={() => setShowProgressModal(false)}>
            <div className="modal-content-engineerproject progress-modal" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => {
                setShowProgressModal(false);
                setProgressForm({ installationNotes: '', status: '' });
                setNewPhotoFiles([]);
                setNewPhotoPreviews([]);
              }}>×</button>
              <h3>Update Project Progress</h3>
              <p><strong>Project:</strong> {selectedProject.projectName}</p>

              {/* Show existing photos count */}
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
                />
              </div>

              <div className="form-group">
                <label>Update Status</label>
                <select
                  value={progressForm.status}
                  onChange={(e) => setProgressForm({ ...progressForm, status: e.target.value })}
                >
                  <option value="in_progress">In Progress</option>
                  <option value="progress_paid">Progress Payment Received</option>
                  <option value="completed">Mark as Completed</option>
                </select>
              </div>

              <div className="form-group">
                <label>Add New Photos</label>
                <div className="photo-upload-area">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoSelect}
                    disabled={uploadingPhotos}
                    id="photo-upload"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="photo-upload" className="upload-white-btn">
                    <FaCamera /> Select photos to upload
                  </label>
                  <p className="upload-hint">
                    {newPhotoFiles.length > 0
                      ? `${newPhotoFiles.length} new photo(s) selected`
                      : 'Select new photos to add to this project'}
                  </p>
                </div>

                {/* Only show new photos that haven't been uploaded yet */}
                {newPhotoPreviews.length > 0 && (
                  <div className="photo-preview-grid">
                    {newPhotoPreviews.map((preview, index) => (
                      <div key={index} className="photo-preview-item">
                        <img src={preview} alt={`New upload ${index + 1}`} className="photo-preview-thumb" />
                        <button
                          className="remove-photo-btn"
                          onClick={() => removePhoto(index)}
                          title="Remove photo"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-actions-side-by-side">
                <button
                  className="cancel-btn"
                  onClick={() => {
                    setShowProgressModal(false);
                    setProgressForm({ installationNotes: '', status: '' });
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
                    disabled={uploadingPhotos || newPhotoFiles.length === 0}
                  >
                    {uploadingPhotos ? <FaSpinner className="spinning" /> : <FaUpload />}
                    {uploadingPhotos ? 'Uploading...' : 'Upload Photos'}
                  </button>
                  <button
                    className="update-btn"
                    onClick={updateProgress}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <FaSpinner className="spinning" /> : null}
                    {isSubmitting ? 'Updating...' : 'Update Progress'}
                  </button>
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