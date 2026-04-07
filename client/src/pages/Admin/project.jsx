// pages/Admin/Project.jsx

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import {
  FaSearch,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaMoneyBillWave,
  FaClock,
  FaExclamationTriangle,
  FaChevronLeft,
  FaChevronRight,
  FaUserCog,
  FaCheck,
  FaTools,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUser,
  FaSolarPanel,
  FaBuilding,
  FaEnvelope,
  FaPhone,
  FaChartLine,
  FaFileInvoice,
  FaDownload
} from 'react-icons/fa';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import '../../styles/Admin/project.css';

const ProjectManagement = () => {
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [engineers, setEngineers] = useState([]);
  const [projectInvoices, setProjectInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    quoted: 0,
    approved: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    engineerId: '',
    assignNotes: '',
    paymentAmount: '',
    paymentMethod: 'cash',
    paymentReference: '',
    newStatus: '',
    statusNotes: ''
  });

  useEffect(() => {
    fetchProjects();
    fetchEngineers();
    fetchStats();
  }, [filter, currentPage]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: filter === 'all' ? undefined : filter, page: currentPage, limit: 10 }
      });
      setProjects(response.data.projects || []);
      setTotalPages(response.data.totalPages || 1);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching projects:', error);
      showToast('Failed to load projects', 'error');
      setLoading(false);
    }
  };

  const fetchEngineers = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users?role=engineer`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEngineers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching engineers:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchProjectInvoices = async (projectId) => {
    try {
      setLoadingInvoices(true);
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/solar-invoices?projectId=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjectInvoices(response.data.invoices || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const updateProjectStatus = async () => {
    if (!selectedProject || !formData.newStatus) return;

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/projects/${selectedProject._id}/status`,
        { status: formData.newStatus, notes: formData.statusNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast(`Project status updated to ${formData.newStatus}`, 'success');
      setShowStatusModal(false);
      setSelectedProject(null);
      setFormData({ ...formData, newStatus: '', statusNotes: '' });
      fetchProjects();
      fetchStats();
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Failed to update status', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const assignEngineer = async () => {
    if (!selectedProject || !formData.engineerId) return;

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/projects/${selectedProject._id}/assign-engineer`,
        { engineerId: formData.engineerId, notes: formData.assignNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast('Engineer assigned successfully', 'success');
      setShowAssignModal(false);
      setSelectedProject(null);
      setFormData({ ...formData, engineerId: '', assignNotes: '' });
      fetchProjects();
    } catch (error) {
      console.error('Error assigning engineer:', error);
      showToast('Failed to assign engineer', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const recordPayment = async () => {
    if (!selectedProject || !formData.paymentAmount) return;

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/projects/${selectedProject._id}/payments`,
        {
          amount: parseFloat(formData.paymentAmount),
          paymentType: formData.paymentMethod === 'initial' ? 'initial' :
            formData.paymentMethod === 'progress' ? 'progress' : 'final',
          paymentReference: formData.paymentReference
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast('Payment recorded successfully', 'success');
      setShowPaymentModal(false);
      setSelectedProject(null);
      setFormData({ ...formData, paymentAmount: '', paymentMethod: 'cash', paymentReference: '' });
      fetchProjects();
      fetchStats();
    } catch (error) {
      console.error('Error recording payment:', error);
      showToast('Failed to record payment', 'error');
    } finally {
      setIsSubmitting(false);
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
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // pages/Admin/Project.jsx - Update getStatusBadge function

const getStatusBadge = (status) => {
  const badges = {
    'quoted': <span className="status-badge-adminproject quoted">Quoted</span>,
    'approved': <span className="status-badge-adminproject approved">Approved</span>,
    'initial_paid': <span className="status-badge-adminproject initial-paid">Initial Paid</span>,
    'full_paid': <span className="status-badge-adminproject full-paid">Full Paid</span>,  // ✅ New badge
    'in_progress': <span className="status-badge-adminproject in-progress">In Progress</span>,
    'progress_paid': <span className="status-badge-adminproject progress-paid">Progress Paid</span>,
    'completed': <span className="status-badge-adminproject completed">Completed</span>,
    'cancelled': <span className="status-badge-adminproject cancelled">Cancelled</span>
  };
  return badges[status] || <span className="status-badge-adminproject">{status}</span>;
};

  const getProgressPercentage = (project) => {
    if (!project.totalCost || project.totalCost === 0) return 0;
    return Math.round((project.amountPaid / project.totalCost) * 100);
  };

  const getPreAssessmentData = (project) => {
    if (project.preAssessmentId && typeof project.preAssessmentId === 'object') {
      return project.preAssessmentId;
    }
    return null;
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
    <div className="project-management-adminproject">
      <div className="project-header-adminproject">
        <div className="skeleton-line large"></div>
        <div className="skeleton-line medium"></div>
      </div>
      <div className="project-stats-adminproject">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="stat-card-adminproject skeleton-card">
            <div className="skeleton-line small"></div>
            <div className="skeleton-line large"></div>
          </div>
        ))}
      </div>
      <div className="project-filters-adminproject">
        <div className="skeleton-select"></div>
        <div className="skeleton-search"></div>
      </div>
      <div className="project-table-container-adminproject">
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
        <title>Project Management | Admin | Salfer Engineering</title>
      </Helmet>

      <div className="project-management-adminproject">
        <div className="project-header-adminproject">
          <div>
            <h1>Project Management</h1>
            <p>Manage solar installation projects from quotation to completion</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="project-stats-adminproject">
          <div className="stat-card-adminproject total">
            <div className="stat-info">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total Projects</span>
            </div>
          </div>
          <div className="stat-card-adminproject quoted">
            <div className="stat-info">
              <span className="stat-value">{stats.quoted}</span>
              <span className="stat-label">Quoted</span>
            </div>
          </div>
          <div className="stat-card-adminproject in-progress">
            <div className="stat-info">
              <span className="stat-value">{stats.inProgress}</span>
              <span className="stat-label">In Progress</span>
            </div>
          </div>
          <div className="stat-card-adminproject completed">
            <div className="stat-info">
              <span className="stat-value">{stats.completed}</span>
              <span className="stat-label">Completed</span>
            </div>
          </div>
          <div className="stat-card-adminproject revenue">
            <div className="stat-info">
              <span className="stat-value">{formatCurrency(stats.totalRevenue)}</span>
              <span className="stat-label">Total Revenue</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="project-filters-adminproject">
          <div className="filter-group-adminproject">
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="quoted">Quoted</option>
              <option value="approved">Approved</option>
              <option value="initial_paid">Initial Paid</option>
              <option value="in_progress">In Progress</option>
              <option value="progress_paid">Progress Paid</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="search-group-adminproject">
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
        <div className="project-table-container-adminproject">
          <table className="project-table-adminproject">
            <thead>
              <tr>
                <th>Project</th>
                <th>Client</th>
                <th>System Size</th>
                <th>Total Cost</th>
                <th>Paid</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-state-adminproject">
                    <p>No projects found</p>
                  </td>
                </tr>
              ) : (
                filteredProjects.map(project => (
                  <tr key={project._id}>
                    <td className="project-cell-adminproject">
                      <div className="project-name">{project.projectName}</div>
                      <div className="project-ref">{project.projectReference}</div>
                    </td>
                    <td>
                      <div><strong>{project.clientId?.contactFirstName} {project.clientId?.contactLastName}</strong></div>
                      <div><small>{project.clientId?.contactNumber}</small></div>
                    </td>
                    <td>{project.systemSize} kW</td>
                    <td className="amount">{formatCurrency(project.totalCost)}</td>
                    <td className="amount">{formatCurrency(project.amountPaid)}</td>
                    <td className="progress-cell">
                      <div className="progress-bar-container">
                        <div className="progress-bar" style={{ width: `${getProgressPercentage(project)}%` }}></div>
                      </div>
                      <span className="progress-text">{getProgressPercentage(project)}%</span>
                    </td>
                    <td>{getStatusBadge(project.status)}</td>
                    <td className="actions-cell">
                      <button
                        className="action-btn view"
                        onClick={() => {
                          setSelectedProject(project);
                          fetchProjectInvoices(project._id);
                          setShowDetailModal(true);
                        }}
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      {project.status === 'quoted' && (
                        <button
                          className="action-btn approve"
                          onClick={() => { setSelectedProject(project); setFormData({ ...formData, newStatus: 'approved' }); setShowStatusModal(true); }}
                          title="Approve Project"
                        >
                          <FaCheck />
                        </button>
                      )}
                      {(project.status === 'approved' || project.status === 'initial_paid') && (
                        <button
                          className="action-btn assign"
                          onClick={() => { setSelectedProject(project); setShowAssignModal(true); }}
                          title="Assign Engineer"
                        >
                          <FaUserCog />
                        </button>
                      )}
                      
                      {project.status === 'initial_paid' && (
                        <button
                          className="action-btn payment"
                          onClick={() => { setSelectedProject(project); setShowPaymentModal(true); }}
                          title="Record Progress Payment"
                        >
                          <FaMoneyBillWave />
                        </button>
                      )}
                      {project.status === 'in_progress' && (
                        <button
                          className="action-btn complete"
                          onClick={() => { setSelectedProject(project); setFormData({ ...formData, newStatus: 'completed' }); setShowStatusModal(true); }}
                          title="Mark Complete"
                        >
                          <FaCheckCircle />
                        </button>
                      )}
                      {project.status !== 'cancelled' && project.status !== 'completed' && (
                        <button
                          className="action-btn cancel"
                          onClick={() => { setSelectedProject(project); setFormData({ ...formData, newStatus: 'cancelled' }); setShowStatusModal(true); }}
                          title="Cancel Project"
                        >
                          <FaTimesCircle />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination-adminproject">
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
          <div className="modal-overlay-adminproject" onClick={() => setShowDetailModal(false)}>
            <div className="modal-content-adminproject detail-modal" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button>
              <h3>Project Details</h3>

              <div className="detail-section">
                <h4>Project Information</h4>
                <p><strong>Project Name:</strong> {selectedProject.projectName}</p>
                <p><strong>Reference:</strong> {selectedProject.projectReference}</p>
                <p><strong>Status:</strong> {getStatusBadge(selectedProject.status)}</p>
                <p><strong>Created:</strong> {formatDate(selectedProject.createdAt)}</p>
                {selectedProject.startDate && <p><strong>Started:</strong> {formatDate(selectedProject.startDate)}</p>}
                {selectedProject.actualCompletionDate && <p><strong>Completed:</strong> {formatDate(selectedProject.actualCompletionDate)}</p>}
              </div>

              <div className="detail-section">
                <h4>Client Information</h4>
                <p><strong>Name:</strong> {selectedProject.clientId?.contactFirstName} {selectedProject.clientId?.contactLastName}</p>
                <p><strong>Contact:</strong> {selectedProject.clientId?.contactNumber}</p>
                <p><strong>Email:</strong> {selectedProject.clientId?.userId?.email}</p>
                <p><strong>Address:</strong> {selectedProject.addressId?.houseOrBuilding} {selectedProject.addressId?.street}, {selectedProject.addressId?.barangay}, {selectedProject.addressId?.cityMunicipality}</p>
              </div>

              <div className="detail-section">
                <h4>System Specifications</h4>
                <p><strong>System Size:</strong> {selectedProject.systemSize} kWp</p>
                <p><strong>System Type:</strong> {selectedProject.systemType === 'grid-tie' ? 'Grid-Tie' : selectedProject.systemType === 'hybrid' ? 'Hybrid' : 'Off-Grid'}</p>
                <p><strong>Panels Needed:</strong> {selectedProject.panelsNeeded || 'To be determined'}</p>
                <p><strong>Inverter Type:</strong> {selectedProject.inverterType || 'Standard'}</p>
                <p><strong>Battery Type:</strong> {selectedProject.batteryType || 'N/A'}</p>
              </div>

              <div className="detail-section">
                <h4>Financial Summary</h4>
                <p><strong>Total Cost:</strong> {formatCurrency(selectedProject.totalCost)}</p>
                <p><strong>Initial Payment (30%):</strong> {formatCurrency(selectedProject.initialPayment)}</p>
                <p><strong>Progress Payment (40%):</strong> {formatCurrency(selectedProject.progressPayment)}</p>
                <p><strong>Final Payment (30%):</strong> {formatCurrency(selectedProject.finalPayment)}</p>
                <p><strong>Amount Paid:</strong> {formatCurrency(selectedProject.amountPaid)}</p>
                <p><strong>Balance:</strong> {formatCurrency(selectedProject.balance)}</p>
                <div className="progress-bar-container large">
                  <div className="progress-bar" style={{ width: `${getProgressPercentage(selectedProject)}%` }}></div>
                </div>
              </div>

              {selectedProject.paymentSchedule?.length > 0 && (
                <div className="detail-section">
                  <h4>Payment Schedule</h4>
                  <table className="payment-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th>Paid Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProject.paymentSchedule.map((payment, idx) => (
                        <tr key={idx}>
                          <td className="capitalize">{payment.type === 'initial' ? 'Initial Deposit (30%)' : payment.type === 'progress' ? 'Progress Payment (40%)' : 'Final Payment (30%)'}</td>
                          <td>{formatCurrency(payment.amount)}</td>
                          <td>{formatDate(payment.dueDate)}</td>
                          <td>
                            {payment.status === 'paid' ? <span className="paid-text">Paid</span> :
                              payment.status === 'overdue' ? <span className="overdue-text">Overdue</span> :
                                <span className="pending-text">Pending</span>}
                          </td>
                          <td>{payment.paidAt ? formatDate(payment.paidAt) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Invoices Section */}
              <div className="detail-section">
                <h4>Generated Invoices</h4>
                {loadingInvoices ? (
                  <div className="loading-invoices">
                    <FaSpinner className="spinning" /> Loading invoices...
                  </div>
                ) : projectInvoices.length === 0 ? (
                  <p className="no-invoices">No invoices generated yet. Invoices will be auto-generated when project is approved.</p>
                ) : (
                  <table className="payment-table">
                    <thead>
                      <tr>
                        <th>Invoice #</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Due Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectInvoices.map((invoice, idx) => (
                        <tr key={idx}>
                          <td>{invoice.invoiceNumber}</td>
                          <td>
                            <span className={`invoice-type-badge ${invoice.invoiceType}`}>
                              {invoice.invoiceType === 'initial' && 'Initial (30%)'}
                              {invoice.invoiceType === 'progress' && 'Progress (40%)'}
                              {invoice.invoiceType === 'final' && 'Final (30%)'}
                              {invoice.invoiceType === 'full' && 'Full (100%)'}
                              {invoice.invoiceType === 'additional' && 'Additional'}
                            </span>
                          </td>
                          <td className="amount">{formatCurrency(invoice.totalAmount)}</td>
                          <td>
                            <span className={`payment-status-badge ${invoice.paymentStatus}`}>
                              {invoice.paymentStatus === 'paid' ? 'Paid' :
                                invoice.paymentStatus === 'partial' ? 'Partial' :
                                  invoice.paymentStatus === 'overdue' ? 'Overdue' : 'Pending'}
                            </span>
                          </td>
                          <td>{formatDate(invoice.dueDate)}</td>
                          <td>
                            <button
                              className="action-btn view"
                              onClick={() => window.open(`${import.meta.env.VITE_API_URL}/api/solar-invoices/${invoice._id}/download`, '_blank')}
                              title="Download PDF"
                            >
                              <FaDownload />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {selectedProject.assignedEngineerId && (
                <div className="detail-section">
                  <h4>Assigned Engineer</h4>
                  <p><strong>Name:</strong> {selectedProject.assignedEngineerId?.firstName} {selectedProject.assignedEngineerId?.lastName}</p>
                  <p><strong>Email:</strong> {selectedProject.assignedEngineerId?.email}</p>
                </div>
              )}

              {selectedProject.installationNotes && (
                <div className="detail-section">
                  <h4>Installation Notes</h4>
                  <p>{selectedProject.installationNotes}</p>
                </div>
              )}

              {selectedProject.projectUpdates?.length > 0 && (
                <div className="detail-section">
                  <h4>Project Timeline</h4>
                  <div className="timeline-list">
                    {selectedProject.projectUpdates.map((update, idx) => (
                      <div key={idx} className="timeline-item">
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                          <strong>{update.title}</strong>
                          <p>{update.description}</p>
                          <small>{formatDate(update.createdAt)}</small>
                        </div>
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

        {/* Assign Engineer Modal */}
        {showAssignModal && selectedProject && (
          <div className="modal-overlay-adminproject" onClick={() => setShowAssignModal(false)}>
            <div className="modal-content-adminproject" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowAssignModal(false)}>×</button>
              <h3>Assign Engineer</h3>
              <p><strong>Project:</strong> {selectedProject.projectName}</p>

              <div className="form-group">
                <label>Select Engineer *</label>
                <select value={formData.engineerId} onChange={(e) => setFormData({ ...formData, engineerId: e.target.value })}>
                  <option value="">Select an engineer...</option>
                  {engineers.map(eng => (
                    <option key={eng._id} value={eng._id}>{eng.firstName} {eng.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  rows="3"
                  value={formData.assignNotes}
                  onChange={(e) => setFormData({ ...formData, assignNotes: e.target.value })}
                  placeholder="Add notes for the engineer about this project..."
                />
              </div>

              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowAssignModal(false)}>Cancel</button>
                <button className="submit-btn" onClick={assignEngineer} disabled={!formData.engineerId || isSubmitting}>
                  {isSubmitting ? 'Assigning...' : 'Assign Engineer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Update Modal */}
        {showStatusModal && selectedProject && (
          <div className="modal-overlay-adminproject" onClick={() => setShowStatusModal(false)}>
            <div className="modal-content-adminproject" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowStatusModal(false)}>×</button>
              <h3>Update Project Status</h3>
              <p><strong>Project:</strong> {selectedProject.projectName}</p>
              <p><strong>Current Status:</strong> {getStatusBadge(selectedProject.status)}</p>

              <div className="form-group">
                <label>New Status *</label>
                <select value={formData.newStatus} onChange={(e) => setFormData({ ...formData, newStatus: e.target.value })}>
                  <option value="">Select status...</option>
                  {selectedProject.status === 'quoted' && <option value="approved">Approve Project</option>}
                  {selectedProject.status === 'in_progress' && <option value="completed">Mark as Completed</option>}
                  {selectedProject.status !== 'cancelled' && selectedProject.status !== 'completed' && <option value="cancelled">Cancel Project</option>}
                </select>
              </div>

              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  rows="3"
                  value={formData.statusNotes}
                  onChange={(e) => setFormData({ ...formData, statusNotes: e.target.value })}
                  placeholder="Add notes about this status change..."
                />
              </div>

              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowStatusModal(false)}>Cancel</button>
                <button className="submit-btn" onClick={updateProjectStatus} disabled={!formData.newStatus || isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedProject && (
          <div className="modal-overlay-adminproject" onClick={() => setShowPaymentModal(false)}>
            <div className="modal-content-adminproject" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}>×</button>
              <h3>Record Payment</h3>
              <p><strong>Project:</strong> {selectedProject.projectName}</p>
              <p><strong>Total Cost:</strong> {formatCurrency(selectedProject.totalCost)}</p>
              <p><strong>Amount Paid:</strong> {formatCurrency(selectedProject.amountPaid)}</p>
              <p><strong>Balance:</strong> {formatCurrency(selectedProject.balance)}</p>

              <div className="form-group">
                <label>Payment Amount *</label>
                <input
                  type="number"
                  value={formData.paymentAmount}
                  onChange={(e) => setFormData({ ...formData, paymentAmount: e.target.value })}
                  placeholder="Enter amount"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>Payment Type</label>
                <select value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}>
                  <option value="initial">Initial Deposit (30%)</option>
                  <option value="progress">Progress Payment (40%)</option>
                  <option value="final">Final Payment (30%)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Reference Number</label>
                <input
                  type="text"
                  value={formData.paymentReference}
                  onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
                  placeholder="Transaction reference number"
                />
              </div>

              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button className="submit-btn" onClick={recordPayment} disabled={!formData.paymentAmount || isSubmitting}>
                  {isSubmitting ? 'Recording...' : 'Record Payment'}
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

export default ProjectManagement;