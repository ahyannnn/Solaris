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
  FaMoneyBillWaveAlt
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
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/projects/${selectedProject._id}/progress`,
        {
          installationNotes: progressForm.installationNotes,
          status: progressForm.status,
          sitePhotos: progressForm.sitePhotos
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast('Project progress updated successfully!', 'success');
      setShowProgressModal(false);
      setSelectedProject(null);
      setProgressForm({ installationNotes: '', status: '', sitePhotos: [] });
      fetchProjects();
    } catch (error) {
      console.error('Error updating progress:', error);
      showToast('Failed to update progress', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingPhotos(true);
    const formData = new FormData();
    files.forEach(file => formData.append('photos', file));

    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/projects/${selectedProject._id}/upload-photos`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );
      setProgressForm(prev => ({
        ...prev,
        sitePhotos: [...prev.sitePhotos, ...response.data.photos]
      }));
      showToast('Photos uploaded successfully', 'success');
    } catch (err) {
      console.error('Error uploading photos:', err);
      showToast('Failed to upload photos', 'error');
    } finally {
      setUploadingPhotos(false);
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

  // ✅ UPDATED: Added full_paid to status badge
  const getStatusBadge = (status) => {
    const badges = {
      'quoted': <span className="status-badge-engineerproject quoted">Quoted</span>,
      'approved': <span className="status-badge-engineerproject approved">Approved</span>,
      'initial_paid': <span className="status-badge-engineerproject initial-paid">Initial Paid</span>,
      'full_paid': <span className="status-badge-engineerproject full-paid">Full Paid (Awaiting Installation)</span>,
      'in_progress': <span className="status-badge-engineerproject in-progress">In Progress</span>,
      'progress_paid': <span className="status-badge-engineerproject progress-paid">Progress Paid</span>,
      'completed': <span className="status-badge-engineerproject completed">Completed</span>,
      'cancelled': <span className="status-badge-engineerproject cancelled">Cancelled</span>
    };
    return badges[status] || <span className="status-badge-engineerproject">{status}</span>;
  };

  const getPreAssessmentData = (project) => {
    if (project.preAssessmentId && typeof project.preAssessmentId === 'object') {
      return project.preAssessmentId;
    }
    return null;
  };

  // ✅ Helper to check if engineer can start installation
  const canStartInstallation = (status) => {
    return ['approved', 'initial_paid', 'full_paid'].includes(status);
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

        {/* Projects Grid */}
        <div className="projects-grid-engineerproject">
          {filteredProjects.length === 0 ? (
            <div className="empty-state-engineerproject">
              <FaTools className="empty-icon" />
              <h3>No projects assigned</h3>
              <p>You haven't been assigned to any projects yet.</p>
            </div>
          ) : (
            filteredProjects.map(project => {
              const preAssessment = getPreAssessmentData(project);
              const canStart = canStartInstallation(project.status);
              const isInProgress = project.status === 'in_progress';
              const isProgressPaid = project.status === 'progress_paid';
              const isFullPaid = project.status === 'full_paid';

              return (
                <div key={project._id} className="project-card-engineerproject">
                  <div className="card-header-engineerproject">
                    <div>
                      <h3>{project.projectName}</h3>
                      <p className="project-ref">{project.projectReference}</p>
                    </div>
                    {getStatusBadge(project.status)}
                  </div>

                  <div className="card-details-engineerproject">
                    <div className="detail-item">
                      <FaUser />
                      <span>{project.clientId?.contactFirstName} {project.clientId?.contactLastName}</span>
                    </div>
                    {/* Add client email display */}
                    <div className="detail-item">
                      <FaEnvelope />
                      <span className="client-email">{project.clientId?.userId?.email || 'No email provided'}</span>
                    </div>
                    <div className="detail-item">
                      <FaSolarPanel />
                      <span>{project.systemSize} kWp | {project.systemType}</span>
                    </div>
                    <div className="detail-item">
                      <FaMapMarkerAlt />
                      <span className="truncate">
                        {project.addressId?.houseOrBuilding} {project.addressId?.street}, {project.addressId?.barangay}
                      </span>
                    </div>
                    <div className="detail-item">
                      <FaCalendarAlt />
                      <span>Started: {formatDate(project.startDate)}</span>
                    </div>
                    {/* Show payment info for full_paid projects */}
                    {isFullPaid && (
                      <div className="detail-item full-paid-badge">
                        <FaMoneyBillWaveAlt />
                        <span className="full-paid-text">Full Payment Completed - Ready for Installation</span>
                      </div>
                    )}
                  </div>

                  {/* Payment Info Section (no progress bar) */}
                  <div className="payment-info-engineerproject">
                    <div className="payment-stats">
                      <span className="paid-amount">Paid: {formatCurrency(project.amountPaid)}</span>
                      <span className="total-amount">Total: {formatCurrency(project.totalCost)}</span>
                    </div>
                  </div>

                  <div className="card-actions-engineerproject">
                    <button
                      className="action-btn view"
                      onClick={() => { setSelectedProject(project); setShowDetailModal(true); }}
                    >
                      <FaEye /> View Details
                    </button>

                    {/* Start Installation button - for approved, initial_paid, OR full_paid */}
                    {canStart && (
                      <button
                        className="action-btn start"
                        onClick={() => {
                          setSelectedProject(project);
                          setProgressForm({ installationNotes: '', status: 'in_progress', sitePhotos: [] });
                          setShowProgressModal(true);
                        }}
                      >
                        <FaTools /> Start Installation
                      </button>
                    )}

                    {/* Update Progress button - for in_progress or progress_paid */}
                    {(isInProgress || isProgressPaid) && (
                      <button
                        className="action-btn update"
                        onClick={() => {
                          setSelectedProject(project);
                          setProgressForm({ installationNotes: project.installationNotes || '', status: project.status, sitePhotos: project.sitePhotos || [] });
                          setShowProgressModal(true);
                        }}
                      >
                        <FaCheckCircle /> Update Progress
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
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
                <p><strong>Status:</strong> {getStatusBadge(selectedProject.status)}</p>
                <p><strong>Created:</strong> {formatDate(selectedProject.createdAt)}</p>
                {selectedProject.paymentPreference === 'full' && (
                  <p><strong>Payment Type:</strong> Full Payment</p>
                )}
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

              {/* <div className="detail-section">
                <h4>Financial Summary</h4>
                <p><strong>Total Cost:</strong> {formatCurrency(selectedProject.totalCost)}</p>
                <p><strong>Amount Paid:</strong> {formatCurrency(selectedProject.amountPaid)}</p>
                <p><strong>Balance:</strong> {formatCurrency(selectedProject.balance)}</p>
              </div> */}

              {/* {selectedProject.paymentSchedule?.length > 0 && (
                <div className="detail-section">
                  <h4>Payment Schedule</h4>
                  <table className="payment-table">
                    <thead>
                      <tr><th>Type</th><th>Amount</th><th>Due Date</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {selectedProject.paymentSchedule.map((payment, idx) => (
                        <tr key={idx}>
                          <td className="capitalize">{payment.type === 'full' ? 'Full Payment' : payment.type}</td>
                          <td>{formatCurrency(payment.amount)}</td>
                          <td>{formatDate(payment.dueDate)}</td>
                          <td>{payment.status === 'paid' ? 'Paid' : payment.status === 'overdue' ? 'Overdue' : 'Pending'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )} */}

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
                      <img key={idx} src={photo} alt={`Site ${idx + 1}`} className="photo-thumb" />
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

        {/* Progress Update Modal - ORIGINAL DROPDOWN OPTIONS RESTORED */}
        {showProgressModal && selectedProject && (
          <div className="modal-overlay-engineerproject" onClick={() => setShowProgressModal(false)}>
            <div className="modal-content-engineerproject progress-modal" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowProgressModal(false)}>×</button>
              <h3>Update Project Progress</h3>
              <p><strong>Project:</strong> {selectedProject.projectName}</p>

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
                {/* ✅ ORIGINAL DROPDOWN OPTIONS - RESTORED */}
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
                  <label htmlFor="photo-upload" className="upload-label">
                    <FaCamera /> {uploadingPhotos ? 'Uploading...' : 'Click to upload photos'}
                  </label>
                </div>
                {progressForm.sitePhotos.length > 0 && (
                  <div className="photo-preview">
                    <p>{progressForm.sitePhotos.length} photo(s) uploaded</p>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowProgressModal(false)}>Cancel</button>
                <button className="update-btn" onClick={updateProgress} disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Update Progress'}
                </button>
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