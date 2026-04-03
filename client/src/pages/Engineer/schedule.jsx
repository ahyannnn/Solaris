// pages/Engineer/Schedule.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { 
  FaCalendarAlt, 
  FaEye, 
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
  FaCalendarWeek,
  FaList,
  FaHome,
  FaPhone,
  FaEnvelope,
  FaBuilding,
  FaInfoCircle,
  FaPlay,
  FaFlagCheckered
} from 'react-icons/fa';
import { useToast, ToastNotification } from '../../assets/toastnotification';
//import '../../styles/Engineer/schedule.css';

const EngineerSchedule = () => {
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [upcomingSchedules, setUpcomingSchedules] = useState([]);
  const [pastSchedules, setPastSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, [filter, typeFilter, currentPage]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/schedules/engineer/my-schedules`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          status: filter === 'all' ? undefined : filter,
          type: typeFilter === 'all' ? undefined : typeFilter,
          page: currentPage,
          limit: 10
        }
      });
      
      setSchedules(response.data.schedules || []);
      setUpcomingSchedules(response.data.upcoming || []);
      setPastSchedules(response.data.past || []);
      setTotalPages(response.data.totalPages || 1);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      showToast('Failed to load schedules', 'error');
      setLoading(false);
    }
  };

  const handleUpdateScheduleStatus = async () => {
    if (!selectedSchedule || !updateStatus) return;

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/schedules/${selectedSchedule._id}/status`,
        { status: updateStatus, notes: updateNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showToast(`Schedule marked as ${updateStatus}`, 'success');
      setShowUpdateModal(false);
      setSelectedSchedule(null);
      setUpdateStatus('');
      setUpdateNotes('');
      fetchSchedules();
    } catch (error) {
      console.error('Error updating schedule:', error);
      showToast('Failed to update schedule', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestReschedule = async () => {
    if (!selectedSchedule) return;

    const newDate = prompt('Enter new date (YYYY-MM-DD):');
    const newTime = prompt('Enter new time (HH:MM):');
    const reason = prompt('Reason for reschedule:');

    if (!newDate || !newTime || !reason) {
      showToast('Please provide all reschedule details', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/schedules/${selectedSchedule._id}/reschedule-request`,
        { newDate, newTime, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showToast('Reschedule request sent to admin', 'success');
      setShowDetailModal(false);
      setSelectedSchedule(null);
      fetchSchedules();
    } catch (error) {
      console.error('Error requesting reschedule:', error);
      showToast('Failed to request reschedule', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    return time;
  };

  const formatShortDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      'scheduled': <span className="status-badge-engineer-schedule scheduled">Scheduled</span>,
      'confirmed': <span className="status-badge-engineer-schedule confirmed">Confirmed</span>,
      'in_progress': <span className="status-badge-engineer-schedule in-progress">In Progress</span>,
      'completed': <span className="status-badge-engineer-schedule completed">Completed</span>,
      'cancelled': <span className="status-badge-engineer-schedule cancelled">Cancelled</span>,
      'rescheduled': <span className="status-badge-engineer-schedule rescheduled">Rescheduled</span>
    };
    return badges[status] || <span className="status-badge-engineer-schedule">{status}</span>;
  };

  const getTypeBadge = (type) => {
    const badges = {
      'pre_assessment': <span className="type-badge-engineer-schedule pre-assessment">Pre-Assessment</span>,
      'site_visit': <span className="type-badge-engineer-schedule site-visit">Site Visit</span>,
      'installation': <span className="type-badge-engineer-schedule installation">Installation</span>,
      'inspection': <span className="type-badge-engineer-schedule inspection">Inspection</span>
    };
    return badges[type] || <span className="type-badge-engineer-schedule">{type}</span>;
  };

  const getNextActionButton = (schedule) => {
    switch (schedule.status) {
      case 'scheduled':
      case 'confirmed':
        return (
          <button 
            className="action-btn start"
            onClick={() => {
              setSelectedSchedule(schedule);
              setUpdateStatus('in_progress');
              setShowUpdateModal(true);
            }}
          >
            <FaPlay /> Start
          </button>
        );
      case 'in_progress':
        return (
          <button 
            className="action-btn complete"
            onClick={() => {
              setSelectedSchedule(schedule);
              setUpdateStatus('completed');
              setShowUpdateModal(true);
            }}
          >
            <FaFlagCheckered /> Complete
          </button>
        );
      default:
        return null;
    }
  };

  const getStatusActions = (schedule) => {
    if (schedule.status === 'scheduled' || schedule.status === 'confirmed') {
      return (
        <div className="action-buttons">
          {getNextActionButton(schedule)}
          <button 
            className="action-btn reschedule"
            onClick={() => {
              setSelectedSchedule(schedule);
              handleRequestReschedule();
            }}
          >
            Request Reschedule
          </button>
        </div>
      );
    }
    return null;
  };

  const filteredSchedules = schedules.filter(schedule => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return schedule.title?.toLowerCase().includes(searchLower) ||
           schedule.clientName?.toLowerCase().includes(searchLower) ||
           schedule.address?.street?.toLowerCase().includes(searchLower);
  });

  const SkeletonLoader = () => (
    <div className="engineer-schedule-container">
      <div className="schedule-header-engineer">
        <div className="skeleton-line large"></div>
        <div className="skeleton-line medium"></div>
      </div>
      <div className="schedule-stats-engineer">
        {[1, 2, 3].map(i => (
          <div key={i} className="stat-card skeleton-card">
            <div className="skeleton-line small"></div>
            <div className="skeleton-line large"></div>
          </div>
        ))}
      </div>
      <div className="schedule-controls-engineer">
        <div className="skeleton-button"></div>
        <div className="skeleton-select"></div>
        <div className="skeleton-search"></div>
      </div>
      <div className="schedule-list-engineer">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="schedule-card skeleton-card">
            <div className="skeleton-line"></div>
            <div className="skeleton-line small"></div>
            <div className="skeleton-line"></div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading && schedules.length === 0) {
    return <SkeletonLoader />;
  }

  return (
    <>
      <Helmet>
        <title>My Schedule | Engineer | Salfer Engineering</title>
      </Helmet>

      <div className="engineer-schedule-container">
        <div className="schedule-header-engineer">
          <h1>My Schedule</h1>
          <p>View and manage your upcoming site visits and assessments</p>
        </div>

        {/* Stats Cards */}
        <div className="schedule-stats-engineer">
          <div className="stat-card total">
            <div className="stat-info">
              <span className="stat-value">{upcomingSchedules.length}</span>
              <span className="stat-label">Upcoming</span>
            </div>
          </div>
          <div className="stat-card today">
            <div className="stat-info">
              <span className="stat-value">{schedules.filter(s => s.status === 'in_progress').length}</span>
              <span className="stat-label">In Progress</span>
            </div>
          </div>
          <div className="stat-card completed">
            <div className="stat-info">
              <span className="stat-value">{pastSchedules.length}</span>
              <span className="stat-label">Completed</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="schedule-controls-engineer">
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <FaList /> List View
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
            >
              <FaCalendarWeek /> Calendar View
            </button>
          </div>
          <div className="filter-group">
            <FaFilter className="filter-icon" />
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
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

        {/* List View */}
        {viewMode === 'list' && (
          <div className="schedule-list-engineer">
            {filteredSchedules.length === 0 ? (
              <div className="empty-state">
                <FaCalendarAlt className="empty-icon" />
                <h3>No schedules found</h3>
                <p>You don't have any upcoming schedules at the moment.</p>
              </div>
            ) : (
              filteredSchedules.map(schedule => (
                <div key={schedule._id} className="schedule-card">
                  <div className="schedule-card-header">
                    <div className="schedule-type">
                      {getTypeBadge(schedule.type)}
                      {getStatusBadge(schedule.status)}
                    </div>
                    <div className="schedule-date-large">
                      <FaCalendarAlt />
                      <span>{formatDate(schedule.scheduledDate)}</span>
                    </div>
                  </div>
                  
                  <div className="schedule-card-body">
                    <h3>{schedule.title}</h3>
                    <div className="schedule-details">
                      <div className="detail-item">
                        <FaClock />
                        <span>{formatTime(schedule.scheduledTime)} - {schedule.endTime || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <FaUser />
                        <span>{schedule.clientName}</span>
                      </div>
                      <div className="detail-item">
                        <FaMapMarkerAlt />
                        <span>
                          {schedule.address?.houseOrBuilding} {schedule.address?.street}, 
                          {schedule.address?.barangay}, {schedule.address?.cityMunicipality}
                        </span>
                      </div>
                      {schedule.clientPhone && (
                        <div className="detail-item">
                          <FaPhone />
                          <span>{schedule.clientPhone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="schedule-card-footer">
                    <button 
                      className="action-btn view"
                      onClick={() => { setSelectedSchedule(schedule); setShowDetailModal(true); }}
                    >
                      <FaEye /> View Details
                    </button>
                    {getStatusActions(schedule)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="calendar-view-engineer">
            <div className="calendar-header">
              <h3>Weekly Schedule</h3>
            </div>
            <div className="calendar-grid">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="calendar-day-header">
                  {day}
                </div>
              ))}
              {/* Simplified calendar view - shows upcoming schedules by day */}
              {upcomingSchedules.slice(0, 7).map((schedule, index) => (
                <div key={index} className={`calendar-day ${schedule.status === 'completed' ? 'completed' : ''}`}>
                  <div className="calendar-date">{formatShortDate(schedule.scheduledDate)}</div>
                  <div className="calendar-event">
                    <div className="event-time">{formatTime(schedule.scheduledTime)}</div>
                    <div className="event-title">{schedule.title}</div>
                    <div className="event-client">{schedule.clientName}</div>
                    {getTypeBadge(schedule.type)}
                  </div>
                </div>
              ))}
              {upcomingSchedules.length < 7 && [...Array(7 - upcomingSchedules.length)].map((_, i) => (
                <div key={`empty-${i}`} className="calendar-day empty">
                  <div className="calendar-date">No events</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination-engineer">
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
          <div className="modal-overlay-engineer" onClick={() => setShowDetailModal(false)}>
            <div className="modal-content-engineer detail-modal" onClick={e => e.stopPropagation()}>
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
                <p><strong>Address:</strong> 
                  {selectedSchedule.address?.houseOrBuilding} {selectedSchedule.address?.street}, 
                  {selectedSchedule.address?.barangay}, {selectedSchedule.address?.cityMunicipality}
                </p>
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
                <button className="cancel-btn" onClick={() => setShowDetailModal(false)}>Close</button>
                {selectedSchedule.status === 'scheduled' || selectedSchedule.status === 'confirmed' ? (
                  <>
                    <button 
                      className="start-btn"
                      onClick={() => {
                        setShowDetailModal(false);
                        setSelectedSchedule(selectedSchedule);
                        setUpdateStatus('in_progress');
                        setShowUpdateModal(true);
                      }}
                    >
                      <FaPlay /> Start Visit
                    </button>
                    <button 
                      className="reschedule-btn"
                      onClick={handleRequestReschedule}
                    >
                      Request Reschedule
                    </button>
                  </>
                ) : selectedSchedule.status === 'in_progress' ? (
                  <button 
                    className="complete-btn"
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedSchedule(selectedSchedule);
                      setUpdateStatus('completed');
                      setShowUpdateModal(true);
                    }}
                  >
                    <FaFlagCheckered /> Mark Complete
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* Update Status Modal */}
        {showUpdateModal && selectedSchedule && (
          <div className="modal-overlay-engineer" onClick={() => setShowUpdateModal(false)}>
            <div className="modal-content-engineer" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowUpdateModal(false)}>×</button>
              <h3>Update Schedule Status</h3>
              <p><strong>Schedule:</strong> {selectedSchedule.title}</p>
              <p><strong>Client:</strong> {selectedSchedule.clientName}</p>
              <p><strong>Date:</strong> {formatDate(selectedSchedule.scheduledDate)}</p>
              
              <div className="form-group">
                <label>Status Update</label>
                <select value={updateStatus} onChange={(e) => setUpdateStatus(e.target.value)}>
                  <option value="">Select status...</option>
                  {updateStatus === 'in_progress' && <option value="in_progress">Start Site Visit</option>}
                  {updateStatus === 'completed' && <option value="completed">Mark as Completed</option>}
                </select>
              </div>

              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea 
                  rows="3" 
                  value={updateNotes} 
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  placeholder="Add any notes about this visit..."
                />
              </div>

              <div className="info-box">
                <FaInfoCircle />
                <small>
                  {updateStatus === 'in_progress' 
                    ? "Starting the site visit will notify the admin and customer." 
                    : "Completing this schedule will mark it as done."}
                </small>
              </div>

              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowUpdateModal(false)}>Cancel</button>
                <button 
                  className="submit-btn" 
                  onClick={handleUpdateScheduleStatus}
                  disabled={!updateStatus || isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Confirm Update'}
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

export default EngineerSchedule;