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
  FaChevronLeft,
  FaChevronRight,
  FaUserCog,
  FaCheck,
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
    total: 0, quoted: 0, approved: 0, inProgress: 0, completed: 0, cancelled: 0, totalRevenue: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    engineerId: '', assignNotes: '', paymentAmount: '', paymentMethod: 'cash', paymentReference: '', newStatus: '', statusNotes: ''
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
      setStats(response.data.stats || { total: 0, quoted: 0, approved: 0, inProgress: 0, completed: 0, cancelled: 0, totalRevenue: 0 });
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
        { amount: parseFloat(formData.paymentAmount), paymentType: formData.paymentMethod, paymentReference: formData.paymentReference },
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
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status) => {
    const badges = {
      'quoted': <span className="status-badge-adminproject quoted">Quoted</span>,
      'approved': <span className="status-badge-adminproject approved">Approved</span>,
      'initial_paid': <span className="status-badge-adminproject initial-paid">Initial Paid</span>,
      'full_paid': <span className="status-badge-adminproject full-paid">Full Paid</span>,
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
        <div className="skeleton-title"></div>
        <div className="skeleton-subtitle"></div>
      </div>
      <div className="project-stats-adminproject">
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="stat-card-adminproject skeleton"></div>)}
      </div>
      <div className="project-filters-adminproject">
        <div className="skeleton-select"></div>
        <div className="skeleton-search"></div>
      </div>
      <div className="project-table-container-adminproject">
        <div className="skeleton-table"></div>
      </div>
    </div>
  );

  if (loading && projects.length === 0) return <SkeletonLoader />;

  return (
    <>
      <Helmet><title>Project Management | Admin | Salfer Engineering</title></Helmet>

      <div className="project-management-adminproject">
        <div className="project-header-adminproject">
          <h1>Project Management</h1>
          <p>Manage solar installation projects from quotation to completion</p>
        </div>

        <div className="project-stats-adminproject">
          <div className="stat-card-adminproject total"><span className="stat-value">{stats.total}</span><span className="stat-label">Total Projects</span></div>
          <div className="stat-card-adminproject quoted"><span className="stat-value">{stats.quoted}</span><span className="stat-label">Quoted</span></div>
          <div className="stat-card-adminproject in-progress"><span className="stat-value">{stats.inProgress}</span><span className="stat-label">In Progress</span></div>
          <div className="stat-card-adminproject completed"><span className="stat-value">{stats.completed}</span><span className="stat-label">Completed</span></div>
          <div className="stat-card-adminproject revenue"><span className="stat-value">{formatCurrency(stats.totalRevenue)}</span><span className="stat-label">Revenue</span></div>
        </div>

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
            <input type="text" placeholder="Search projects..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="project-table-container-adminproject">
          <table className="project-table-adminproject">
            <thead>
              <tr>
                <th>Project</th>
                <th>Client</th>
                <th>Size</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.length === 0 ? (
                <tr><td colSpan="8" className="empty-state-adminproject">No projects found</td></tr>
              ) : (
                filteredProjects.map(project => (
                  <tr key={project._id}>
                    <td className="project-cell-adminproject">
                      <div className="project-name">{project.projectName}</div>
                      <div className="project-ref">{project.projectReference}</div>
                    </td>
                    <td><div><strong>{project.clientId?.contactFirstName} {project.clientId?.contactLastName}</strong></div><div><small>{project.clientId?.contactNumber}</small></div></td>
                    <td>{project.systemSize} kW</td>
                    <td className="amount">{formatCurrency(project.totalCost)}</td>
                    <td className="amount">{formatCurrency(project.amountPaid)}</td>
                    <td className="progress-cell">
                      <div className="progress-bar-container"><div className="progress-bar" style={{ width: `${getProgressPercentage(project)}%` }}></div></div>
                      <span className="progress-text">{getProgressPercentage(project)}%</span>
                    </td>
                    <td>{getStatusBadge(project.status)}</td>
                    <td className="actions-cell">
                      <button className="action-btn view" onClick={() => { setSelectedProject(project); fetchProjectInvoices(project._id); setShowDetailModal(true); }} title="View"><FaEye /></button>
                      {project.status === 'quoted' && <button className="action-btn approve" onClick={() => { setSelectedProject(project); setFormData({ ...formData, newStatus: 'approved' }); setShowStatusModal(true); }} title="Approve"><FaCheck /></button>}
                      {(project.status === 'approved' || project.status === 'initial_paid') && <button className="action-btn assign" onClick={() => { setSelectedProject(project); setShowAssignModal(true); }} title="Assign Engineer"><FaUserCog /></button>}
                      {project.status === 'initial_paid' && <button className="action-btn payment" onClick={() => { setSelectedProject(project); setShowPaymentModal(true); }} title="Record Payment"><FaMoneyBillWave /></button>}
                      {project.status === 'in_progress' && <button className="action-btn complete" onClick={() => { setSelectedProject(project); setFormData({ ...formData, newStatus: 'completed' }); setShowStatusModal(true); }} title="Complete"><FaCheckCircle /></button>}
                      {project.status !== 'cancelled' && project.status !== 'completed' && <button className="action-btn cancel" onClick={() => { setSelectedProject(project); setFormData({ ...formData, newStatus: 'cancelled' }); setShowStatusModal(true); }} title="Cancel"><FaTimesCircle /></button>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination-adminproject">
            <button className="page-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><FaChevronLeft /> Previous</button>
            <span className="page-info">Page {currentPage} of {totalPages}</span>
            <button className="page-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next <FaChevronRight /></button>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedProject && (
          <div className="modal-overlay-adminproject" onClick={() => setShowDetailModal(false)}>
            <div className="modal-content-adminproject detail-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header"><h3>Project Details</h3><button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button></div>
              <div className="modal-body">
                <div className="detail-section"><h4>Project</h4><p><strong>Name:</strong> {selectedProject.projectName}</p><p><strong>Ref:</strong> {selectedProject.projectReference}</p><p><strong>Status:</strong> {getStatusBadge(selectedProject.status)}</p></div>
                <div className="detail-section"><h4>Client</h4><p><strong>Name:</strong> {selectedProject.clientId?.contactFirstName} {selectedProject.clientId?.contactLastName}</p><p><strong>Contact:</strong> {selectedProject.clientId?.contactNumber}</p><p><strong>Email:</strong> {selectedProject.clientId?.userId?.email}</p></div>
                <div className="detail-section"><h4>System</h4><p><strong>Size:</strong> {selectedProject.systemSize} kWp</p><p><strong>Type:</strong> {selectedProject.systemType}</p></div>
                <div className="detail-section"><h4>Financial</h4><p><strong>Total:</strong> {formatCurrency(selectedProject.totalCost)}</p><p><strong>Paid:</strong> {formatCurrency(selectedProject.amountPaid)}</p><p><strong>Balance:</strong> {formatCurrency(selectedProject.balance)}</p></div>

                {selectedProject.paymentSchedule?.length > 0 && (
                  <div className="detail-section"><h4>Payment Schedule</h4>
                    <table className="payment-table"><thead><tr><th>Type</th><th>Amount</th><th>Due</th><th>Status</th></tr></thead>
                      <tbody>{selectedProject.paymentSchedule.map((p, i) => <tr key={i}><td>{p.type}</td><td>{formatCurrency(p.amount)}</td><td>{formatDate(p.dueDate)}</td><td>{p.status}</td></tr>)}</tbody></table>
                  </div>
                )}

                <div className="detail-section"><h4>Invoices</h4>
                  {loadingInvoices ? <FaSpinner className="spinning" /> : projectInvoices.length === 0 ? <p>No invoices</p> :
                    <table className="payment-table"><thead><tr><th>Invoice</th><th>Type</th><th>Amount</th><th>Status</th></tr></thead>
                      <tbody>{projectInvoices.map((inv, i) => <tr key={i}><td>{inv.invoiceNumber}</td><td>{inv.invoiceType}</td><td>{formatCurrency(inv.totalAmount)}</td><td>{inv.paymentStatus}</td></tr>)}</tbody></table>
                  }
                </div>
              </div>
              <div className="modal-actions"><button className="close-btn" onClick={() => setShowDetailModal(false)}>Close</button></div>
            </div>
          </div>
        )}

        {/* Assign Engineer Modal */}
        {showAssignModal && selectedProject && (
          <div className="modal-overlay-adminproject" onClick={() => setShowAssignModal(false)}>
            <div className="modal-content-adminproject" onClick={e => e.stopPropagation()}>
              <div className="modal-header"><h3>Assign Engineer</h3><button className="modal-close" onClick={() => setShowAssignModal(false)}>×</button></div>
              <div className="modal-body">
                <p><strong>Project:</strong> {selectedProject.projectName}</p>
                <div className="form-group"><label>Engineer</label><select value={formData.engineerId} onChange={(e) => setFormData({ ...formData, engineerId: e.target.value })}><option value="">Select...</option>{engineers.map(e => <option key={e._id} value={e._id}>{e.fullName || `${e.firstName} ${e.lastName}`}</option>)}</select></div>
                <div className="form-group"><label>Notes</label><textarea rows="3" value={formData.assignNotes} onChange={(e) => setFormData({ ...formData, assignNotes: e.target.value })} /></div>
              </div>
              <div className="modal-actions"><button className="cancel-btn" onClick={() => setShowAssignModal(false)}>Cancel</button><button className="submit-btn" onClick={assignEngineer} disabled={!formData.engineerId || isSubmitting}>{isSubmitting ? 'Assigning...' : 'Assign'}</button></div>
            </div>
          </div>
        )}

        {/* Status Modal */}
        {showStatusModal && selectedProject && (
          <div className="modal-overlay-adminproject" onClick={() => setShowStatusModal(false)}>
            <div className="modal-content-adminproject" onClick={e => e.stopPropagation()}>
              <div className="modal-header"><h3>Update Status</h3><button className="modal-close" onClick={() => setShowStatusModal(false)}>×</button></div>
              <div className="modal-body">
                <p><strong>Project:</strong> {selectedProject.projectName}</p>
                <p><strong>Current:</strong> {getStatusBadge(selectedProject.status)}</p>
                <div className="form-group"><label>New Status</label><select value={formData.newStatus} onChange={(e) => setFormData({ ...formData, newStatus: e.target.value })}><option value="">Select...</option>{selectedProject.status === 'quoted' && <option value="approved">Approve</option>}{selectedProject.status === 'in_progress' && <option value="completed">Complete</option>}<option value="cancelled">Cancel</option></select></div>
                <div className="form-group"><label>Notes</label><textarea rows="3" value={formData.statusNotes} onChange={(e) => setFormData({ ...formData, statusNotes: e.target.value })} /></div>
              </div>
              <div className="modal-actions"><button className="cancel-btn" onClick={() => setShowStatusModal(false)}>Cancel</button><button className="submit-btn" onClick={updateProjectStatus} disabled={!formData.newStatus || isSubmitting}>{isSubmitting ? 'Updating...' : 'Update'}</button></div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedProject && (
          <div className="modal-overlay-adminproject" onClick={() => setShowPaymentModal(false)}>
            <div className="modal-content-adminproject" onClick={e => e.stopPropagation()}>
              <div className="modal-header"><h3>Record Payment</h3><button className="modal-close" onClick={() => setShowPaymentModal(false)}>×</button></div>
              <div className="modal-body">
                <p><strong>Project:</strong> {selectedProject.projectName}</p>
                <p><strong>Balance:</strong> {formatCurrency(selectedProject.balance)}</p>
                <div className="form-group"><label>Amount</label><input type="number" value={formData.paymentAmount} onChange={(e) => setFormData({ ...formData, paymentAmount: e.target.value })} /></div>
                <div className="form-group"><label>Type</label><select value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}><option value="initial">Initial (30%)</option><option value="progress">Progress (40%)</option><option value="final">Final (30%)</option></select></div>
                <div className="form-group"><label>Reference</label><input type="text" value={formData.paymentReference} onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })} /></div>
              </div>
              <div className="modal-actions"><button className="cancel-btn" onClick={() => setShowPaymentModal(false)}>Cancel</button><button className="submit-btn" onClick={recordPayment} disabled={!formData.paymentAmount || isSubmitting}>{isSubmitting ? 'Recording...' : 'Record'}</button></div>
            </div>
          </div>
        )}

        <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      </div>
    </>
  );
};

export default ProjectManagement;