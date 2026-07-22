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
  FaFilter
} from 'react-icons/fa';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import '../../styles/Engineer/project.css';

const EngineerProject = () => {
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
      <div className="table-container-engineerproject">
        <div className="skeleton-table">
          <div className="skeleton-table-header"></div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton-table-row"></div>
          ))}
        </div>
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
           
            <p>View and track your assigned solar installation projects</p>
          </div>
        </div>

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
            
            <input
              type="text"
              placeholder="Search by project name, reference or client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container-engineerproject">
          <table className="projects-table-engineerproject">
            <thead>
              <tr>
                <th>Project</th>
                <th>Client</th>
                <th>System</th>
                <th>Payment Plan</th>
                <th>Total Cost</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-state-engineerproject">
                    <FaTools className="empty-icon" />
                    <h3>No projects assigned</h3>
                    <p>You haven't been assigned to any projects yet.</p>
                  </td>
                </tr>
              ) : (
                filteredProjects.map(project => (
                  <tr key={project._id} className="clickable-row">
                    <td>
                      <div className="project-cell">
                        <div className="project-name">{project.projectName}</div>
                        <div className="project-ref">{project.projectReference}</div>
                      </div>
                    </td>
                    <td>
                      <div className="client-cell">
                        <div className="client-name">{project.clientId?.contactFirstName} {project.clientId?.contactLastName}</div>
                        <div className="client-email">{project.clientId?.userId?.email || 'No email'}</div>
                      </div>
                    </td>
                    <td>
                      <div className="system-cell">
                        <span>{project.systemSize} kWp</span>
                        <span className="system-type">{project.systemType}</span>
                      </div>
                    </td>
                    <td>
                      <div className="payment-cell">
                        <span className="payment-label">{getPaymentTypeLabel(project.paymentPreference)}</span>
                        <span className="payment-detail">{getPaymentTypeDescription(project.paymentPreference)}</span>
                      </div>
                    </td>
                    <td>
                      <span className="amount-cell">{formatCurrency(project.totalCost)}</span>
                    </td>
                    <td>
                      {getStatusBadge(project.status, project.paymentPreference)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="view-btn-engineerproject" 
                        onClick={() => { setSelectedProject(project); setShowDetailModal(true); }}
                      >
                        <FaEye /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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

        <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      </div>
    </>
  );
};

export default EngineerProject;