// pages/Admin/Schedule.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { 
  FaCalendarAlt, 
  FaEye, 
  FaEdit, 
  FaTrash, 
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaUser,
  FaMapMarkerAlt,
  FaSpinner,
  FaSearch,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
  FaPlus
} from 'react-icons/fa';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import '../../styles/Admin/schedule.css';

const AdminSchedule = () => {
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    upcoming: 0
  });

  useEffect(() => {
    fetchSchedules();
    fetchStats();
  }, [filter, typeFilter, currentPage]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/schedules`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          status: filter === 'all' ? undefined : filter,
          type: typeFilter === 'all' ? undefined : typeFilter,
          page: currentPage,
          limit: 10
        }
      });
      setSchedules(response.data.schedules || []);
      setTotalPages(response.data.totalPages || 1);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      showToast('Failed to load schedules', 'error');
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/schedules/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/schedules/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast(`Schedule marked as ${status}`, 'success');
      fetchSchedules();
      fetchStats();
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Failed to update status', 'error');
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;
    
    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/schedules/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('Schedule deleted successfully', 'success');
      fetchSchedules();
      fetchStats();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      showToast('Failed to delete schedule', 'error');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    return time || 'N/A';
  };

  const getStatusBadge = (status) => {
    const badges = {
      'scheduled': <span className="status-badge-schedule scheduled">Scheduled</span>,
      'confirmed': <span className="status-badge-schedule confirmed">Confirmed</span>,
      'in_progress': <span className="status-badge-schedule in-progress">In Progress</span>,
      'completed': <span className="status-badge-schedule completed">Completed</span>,
      'cancelled': <span className="status-badge-schedule cancelled">Cancelled</span>,
      'rescheduled': <span className="status-badge-schedule rescheduled">Rescheduled</span>
    };
    return badges[status] || <span className="status-badge-schedule">{status}</span>;
  };

  const getTypeBadge = (type) => {
    const badges = {
      'pre_assessment': <span className="type-badge-schedule pre-assessment">Pre-Assessment</span>,
      'site_visit': <span className="type-badge-schedule site-visit">Site Visit</span>,
      'installation': <span className="type-badge-schedule installation">Installation</span>,
      'inspection': <span className="type-badge-schedule inspection">Inspection</span>
    };
    return badges[type] || <span className="type-badge-schedule">{type}</span>;
  };

  const filteredSchedules = schedules.filter(schedule => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return schedule.title?.toLowerCase().includes(searchLower) ||
           schedule.clientName?.toLowerCase().includes(searchLower) ||
           schedule._id?.toLowerCase().includes(searchLower);
  });

  const SkeletonLoader = () => (
    <div className="schedule-management">
      <div className="schedule-header">
        <div className="skeleton-line large"></div>
        <div className="skeleton-line medium"></div>
      </div>
      <div className="schedule-stats">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="stat-card skeleton-card">
            <div className="skeleton-line small"></div>
            <div className="skeleton-line large"></div>
          </div>
        ))}
      </div>
      <div className="schedule-filters">
        <div className="skeleton-select"></div>
        <div className="skeleton-select"></div>
        <div className="skeleton-search"></div>
      </div>
      <div className="schedule-table-container">
        <div className="skeleton-table">
          <div className="skeleton-table-header"></div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton-table-row"></div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading && schedules.length === 0) {
    return <SkeletonLoader />;
  }

  return (
    <>
      <Helmet>
        <title>Schedule Management | Admin | Salfer Engineering</title>
      </Helmet>

      <div className="schedule-management">
        <div className="schedule-header">
          <h1>Schedule Management</h1>
          <p>Manage all site visits, assessments, and installation schedules</p>
        </div>

        {/* Stats Cards */}
        <div className="schedule-stats">
          <div className="stat-card total">
            <div className="stat-info">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total Schedules</span>
            </div>
          </div>
          <div className="stat-card upcoming">
            <div className="stat-info">
              <span className="stat-value">{stats.upcoming}</span>
              <span className="stat-label">Upcoming</span>
            </div>
          </div>
          <div className="stat-card completed">
            <div className="stat-info">
              <span className="stat-value">{stats.completed}</span>
              <span className="stat-label">Completed</span>
            </div>
          </div>
          <div className="stat-card cancelled">
            <div className="stat-info">
              <span className="stat-value">{stats.cancelled}</span>
              <span className="stat-label">Cancelled</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="schedule-filters">
          <div className="filter-group">
            <FaFilter className="filter-icon" />
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="filter-group">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              <option value="pre_assessment">Pre-Assessment</option>
              <option value="site_visit">Site Visit</option>
              <option value="installation">Installation</option>
              <option value="inspection">Inspection</option>
            </select>
          </div>
          <div className="search-group">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by title or client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Schedules Table */}
        <div className="schedule-table-container">
          <table className="schedule-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Client</th>
                <th>Date & Time</th>
                <th>Engineer</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-state">
                    <p>No schedules found</p>
                  </td>
                </tr>
              ) : (
                filteredSchedules.map(schedule => (
                  <tr key={schedule._id}>
                    <td className="title-cell">
                      <div className="schedule-title">{schedule.title}</div>
                      <div className="schedule-ref">{schedule._id}</div>
                    </td>
                    <td>
                      <div className="client-name">{schedule.clientName}</div>
                      <div className="client-phone">{schedule.clientPhone}</div>
                    </td>
                    <td>
                      <div className="schedule-date">{formatDate(schedule.scheduledDate)}</div>
                      <div className="schedule-time">{formatTime(schedule.scheduledTime)} - {schedule.endTime || ''}</div>
                    </td>
                    <td>{schedule.assignedEngineerId?.firstName} {schedule.assignedEngineerId?.lastName || 'Unassigned'}</td>
                    <td>{getTypeBadge(schedule.type)}</td>
                    <td>{getStatusBadge(schedule.status)}</td>
                    <td className="actions-cell">
                      <button 
                        className="action-btn view"
                        onClick={() => { setSelectedSchedule(schedule); setShowDetailModal(true); }}
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      {schedule.status === 'scheduled' && (
                        <button 
                          className="action-btn confirm"
                          onClick={() => handleUpdateStatus(schedule._id, 'confirmed')}
                          title="Confirm Schedule"
                        >
                          <FaCheckCircle />
                        </button>
                      )}
                      {schedule.status === 'confirmed' && (
                        <button 
                          className="action-btn start"
                          onClick={() => handleUpdateStatus(schedule._id, 'in_progress')}
                          title="Start"
                        >
                          <FaClock />
                        </button>
                      )}
                      {schedule.status === 'in_progress' && (
                        <button 
                          className="action-btn complete"
                          onClick={() => handleUpdateStatus(schedule._id, 'completed')}
                          title="Mark Complete"
                        >
                          <FaCheckCircle />
                        </button>
                      )}
                      <button 
                        className="action-btn delete"
                        onClick={() => handleDeleteSchedule(schedule._id)}
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
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
        {showDetailModal && selectedSchedule && (
          <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
            <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button>
              <h3>Schedule Details</h3>
              
              <div className="detail-section">
                <h4>Schedule Information</h4>
                <p><strong>Title:</strong> {selectedSchedule.title}</p>
                <p><strong>Type:</strong> {getTypeBadge(selectedSchedule.type)}</p>
                <p><strong>Status:</strong> {getStatusBadge(selectedSchedule.status)}</p>
                <p><strong>Date:</strong> {formatDate(selectedSchedule.scheduledDate)}</p>
                <p><strong>Time:</strong> {selectedSchedule.scheduledTime} - {selectedSchedule.endTime || 'N/A'}</p>
                {selectedSchedule.duration && <p><strong>Duration:</strong> {selectedSchedule.duration} hours</p>}
              </div>

              <div className="detail-section">
                <h4>Client Information</h4>
                <p><strong>Name:</strong> {selectedSchedule.clientName}</p>
                <p><strong>Phone:</strong> {selectedSchedule.clientPhone}</p>
                <p><strong>Address:</strong> {selectedSchedule.address?.houseOrBuilding} {selectedSchedule.address?.street}, {selectedSchedule.address?.barangay}, {selectedSchedule.address?.cityMunicipality}</p>
              </div>

              <div className="detail-section">
                <h4>Assigned Personnel</h4>
                <p><strong>Engineer:</strong> {selectedSchedule.assignedEngineerId?.firstName} {selectedSchedule.assignedEngineerId?.lastName || 'Not assigned'}</p>
              </div>

              {selectedSchedule.description && (
                <div className="detail-section">
                  <h4>Description</h4>
                  <p>{selectedSchedule.description}</p>
                </div>
              )}

              {selectedSchedule.notes && (
                <div className="detail-section">
                  <h4>Notes</h4>
                  <p>{selectedSchedule.notes}</p>
                </div>
              )}

              <div className="modal-actions">
                <button className="close-btn" onClick={() => setShowDetailModal(false)}>Close</button>
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

export default AdminSchedule;