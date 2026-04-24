// pages/Admin/AdminSchedule.adsche.jsx
import React, { useState, useEffect, useRef } from 'react';
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
  FaPlus,
  FaChevronDown
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
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 20 });
  const dropdownRef = useRef(null);
  const buttonRefs = useRef({});
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
    
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    };
    
    const handleScroll = () => {
      setOpenDropdownId(null);
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [filter, typeFilter, currentPage]);

  const handleDropdownClick = (event, scheduleId) => {
    event.stopPropagation();
    const buttonRect = event.currentTarget.getBoundingClientRect();
    setDropdownPosition({
      top: buttonRect.bottom + 5,
      right: window.innerWidth - buttonRect.right - 10,
    });
    setOpenDropdownId(openDropdownId === scheduleId ? null : scheduleId);
  };

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
      setOpenDropdownId(null);
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
      setOpenDropdownId(null);
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
      'scheduled': <span className="status-badge-adsche scheduled">Scheduled</span>,
      'confirmed': <span className="status-badge-adsche confirmed">Confirmed</span>,
      'in_progress': <span className="status-badge-adsche in-progress">In Progress</span>,
      'completed': <span className="status-badge-adsche completed">Completed</span>,
      'cancelled': <span className="status-badge-adsche cancelled">Cancelled</span>,
      'rescheduled': <span className="status-badge-adsche rescheduled">Rescheduled</span>
    };
    return badges[status] || <span className="status-badge-adsche">{status}</span>;
  };

  const getTypeBadge = (type) => {
    const badges = {
      'pre_assessment': <span className="type-badge-adsche pre-assessment">Pre-Assessment</span>,
      'site_visit': <span className="type-badge-adsche site-visit">Site Visit</span>,
      'installation': <span className="type-badge-adsche installation">Installation</span>,
      'inspection': <span className="type-badge-adsche inspection">Inspection</span>
    };
    return badges[type] || <span className="type-badge-adsche">{type}</span>;
  };

  const getAvailableActions = (schedule) => {
    const actions = [
      { 
        label: 'View Details', 
        icon: <FaEye />, 
        action: () => { setSelectedSchedule(schedule); setShowDetailModal(true); setOpenDropdownId(null); },
        color: 'primary'
      }
    ];

    if (schedule.status === 'scheduled') {
      actions.push(
        { label: 'Confirm Schedule', icon: <FaCheckCircle />, action: () => handleUpdateStatus(schedule._id, 'confirmed'), color: 'success' }
      );
    }
    
    if (schedule.status === 'confirmed') {
      actions.push(
        { label: 'Start', icon: <FaClock />, action: () => handleUpdateStatus(schedule._id, 'in_progress'), color: 'warning' }
      );
    }
    
    if (schedule.status === 'in_progress') {
      actions.push(
        { label: 'Mark Complete', icon: <FaCheckCircle />, action: () => handleUpdateStatus(schedule._id, 'completed'), color: 'success' }
      );
    }
    
    actions.push(
      { label: 'Delete', icon: <FaTrash />, action: () => handleDeleteSchedule(schedule._id), color: 'danger' }
    );

    return actions;
  };

  const filteredSchedules = schedules.filter(schedule => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return schedule.title?.toLowerCase().includes(searchLower) ||
           schedule.clientName?.toLowerCase().includes(searchLower) ||
           schedule._id?.toLowerCase().includes(searchLower);
  });

  const SkeletonLoader = () => (
    <div className="schedule-management-adsche">
      <div className="schedule-header-adsche">
        <div className="skeleton-line-adsche large"></div>
        <div className="skeleton-line-adsche medium"></div>
      </div>
      <div className="schedule-stats-adsche">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="stat-card-adsche skeleton-card-adsche">
            <div className="skeleton-line-adsche small"></div>
            <div className="skeleton-line-adsche large"></div>
          </div>
        ))}
      </div>
      <div className="schedule-filters-adsche">
        <div className="skeleton-select-adsche"></div>
        <div className="skeleton-select-adsche"></div>
        <div className="skeleton-search-adsche"></div>
      </div>
      <div className="schedule-table-container-adsche">
        <div className="skeleton-table-adsche">
          <div className="skeleton-table-header-adsche"></div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton-table-row-adsche"></div>
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

      <div className="schedule-management-adsche">
        <div className="schedule-header-adsche">
          <h1>Schedule Management</h1>
          <p>Manage all site visits, assessments, and installation schedules</p>
        </div>

        {/* Stats Cards */}
        <div className="schedule-stats-adsche">
          <div className="stat-card-adsche total">
            <div className="stat-info-adsche">
              <span className="stat-value-adsche">{stats.total}</span>
              <span className="stat-label-adsche">Total Schedules</span>
            </div>
          </div>
          <div className="stat-card-adsche upcoming">
            <div className="stat-info-adsche">
              <span className="stat-value-adsche">{stats.upcoming}</span>
              <span className="stat-label-adsche">Upcoming</span>
            </div>
          </div>
          <div className="stat-card-adsche completed">
            <div className="stat-info-adsche">
              <span className="stat-value-adsche">{stats.completed}</span>
              <span className="stat-label-adsche">Completed</span>
            </div>
          </div>
          <div className="stat-card-adsche cancelled">
            <div className="stat-info-adsche">
              <span className="stat-value-adsche">{stats.cancelled}</span>
              <span className="stat-label-adsche">Cancelled</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="schedule-filters-adsche">
          <div className="filter-group-adsche">
            <FaFilter className="filter-icon-adsche" />
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="filter-group-adsche">
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              <option value="pre_assessment">Pre-Assessment</option>
              <option value="site_visit">Site Visit</option>
              <option value="installation">Installation</option>
              <option value="inspection">Inspection</option>
            </select>
          </div>
          <div className="search-group-adsche">
            <FaSearch className="search-icon-adsche" />
            <input
              type="text"
              placeholder="Search by title or client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Schedules Table */}
        <div className="schedule-table-container-adsche">
          <table className="schedule-table-adsche">
            <thead>
              <tr>
                <th>Title</th>
                <th>Client</th>
                <th>Date & Time</th>
                <th>Engineer</th>
                <th>Type</th>
                <th>Status</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.length === 0 ? (
                <tr className="empty-row-adsche">
                  <td colSpan="7" className="empty-state-adsche">
                    <p>No schedules found</p>
                  </td>
                </tr>
              ) : (
                filteredSchedules.map(schedule => {
                  const actions = getAvailableActions(schedule);
                  const isOpen = openDropdownId === schedule._id;
                  
                  return (
                    <tr key={schedule._id}>
                      <td className="title-cell-adsche">
                        <div className="schedule-title-adsche">{schedule.title}</div>
                        <div className="schedule-ref-adsche">{schedule._id}</div>
                      </td>
                      <td>
                        <div className="client-name-adsche">{schedule.clientName}</div>
                        <div className="client-phone-adsche">{schedule.clientPhone}</div>
                      </td>
                      <td>
                        <div className="schedule-date-adsche">{formatDate(schedule.scheduledDate)}</div>
                        <div className="schedule-time-adsche">{formatTime(schedule.scheduledTime)} - {schedule.endTime || ''}</div>
                      </td>
                      <td>{schedule.assignedEngineerId?.firstName} {schedule.assignedEngineerId?.lastName || 'Unassigned'}</td>
                      <td>{getTypeBadge(schedule.type)}</td>
                      <td>{getStatusBadge(schedule.status)}</td>
                      <td style={{ textAlign: 'center', position: 'relative' }}>
                        <div className="action-dropdown-container-adsche">
                          <button 
                            className="action-dropdown-toggle-adsche"
                            ref={el => buttonRefs.current[schedule._id] = el}
                            onClick={(e) => handleDropdownClick(e, schedule._id)}
                          >
                            Action <FaChevronDown className={`dropdown-arrow-adsche ${isOpen ? 'open-adsche' : ''}`} />
                          </button>
                          
                          {isOpen && (
                            <div 
                              className="action-dropdown-menu-adsche"
                              ref={dropdownRef}
                              style={{
                                position: 'fixed',
                                top: dropdownPosition.top,
                                right: dropdownPosition.right,
                                zIndex: 9999,
                              }}
                            >
                              {actions.map((action, idx) => (
                                <button 
                                  key={idx} 
                                  className={`dropdown-item-adsche ${action.color || ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    action.action();
                                  }}
                                >
                                  {action.icon} <span>{action.label}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination-adsche">
            <button 
              className="page-btn-adsche"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <FaChevronLeft /> Previous
            </button>
            <span className="page-info-adsche">Page {currentPage} of {totalPages}</span>
            <button 
              className="page-btn-adsche"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next <FaChevronRight />
            </button>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedSchedule && (
          <div className="modal-overlay-adsche" onClick={() => setShowDetailModal(false)}>
            <div className="modal-content-adsche detail-modal-adsche" onClick={e => e.stopPropagation()}>
              <button className="modal-close-adsche" onClick={() => setShowDetailModal(false)}>×</button>
              <h3>Schedule Details</h3>
              
              <div className="detail-section-adsche">
                <h4>Schedule Information</h4>
                <p><strong>Title:</strong> {selectedSchedule.title}</p>
                <p><strong>Type:</strong> {getTypeBadge(selectedSchedule.type)}</p>
                <p><strong>Status:</strong> {getStatusBadge(selectedSchedule.status)}</p>
                <p><strong>Date:</strong> {formatDate(selectedSchedule.scheduledDate)}</p>
                <p><strong>Time:</strong> {selectedSchedule.scheduledTime} - {selectedSchedule.endTime || 'N/A'}</p>
                {selectedSchedule.duration && <p><strong>Duration:</strong> {selectedSchedule.duration} hours</p>}
              </div>

              <div className="detail-section-adsche">
                <h4>Client Information</h4>
                <p><strong>Name:</strong> {selectedSchedule.clientName}</p>
                <p><strong>Phone:</strong> {selectedSchedule.clientPhone}</p>
                <p><strong>Address:</strong> {selectedSchedule.address?.houseOrBuilding} {selectedSchedule.address?.street}, {selectedSchedule.address?.barangay}, {selectedSchedule.address?.cityMunicipality}</p>
              </div>

              <div className="detail-section-adsche">
                <h4>Assigned Personnel</h4>
                <p><strong>Engineer:</strong> {selectedSchedule.assignedEngineerId?.firstName} {selectedSchedule.assignedEngineerId?.lastName || 'Not assigned'}</p>
              </div>

              {selectedSchedule.description && (
                <div className="detail-section-adsche">
                  <h4>Description</h4>
                  <p>{selectedSchedule.description}</p>
                </div>
              )}

              {selectedSchedule.notes && (
                <div className="detail-section-adsche">
                  <h4>Notes</h4>
                  <p>{selectedSchedule.notes}</p>
                </div>
              )}

              <div className="modal-actions-adsche">
                <button className="close-btn-adsche" onClick={() => setShowDetailModal(false)}>Close</button>
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