// pages/Engineer/Schedule.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import { FaSearch, FaFilter, FaEye, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import '../../styles/Engineer/schedule.css';

const EngineerSchedule = () => {
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchSchedules();
  }, [filter, currentPage]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/schedules/engineer/my-schedules`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          status: filter === 'all' ? undefined : filter,
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

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatShortDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    return time;
  };

  const getStatusBadge = (status) => {
    const badges = {
      'scheduled': <span className="status-badge-esch scheduled-esch">Scheduled</span>,
      'confirmed': <span className="status-badge-esch confirmed-esch">Confirmed</span>,
      'in_progress': <span className="status-badge-esch in-progress-esch">In Progress</span>,
      'completed': <span className="status-badge-esch completed-esch">Completed</span>,
      'cancelled': <span className="status-badge-esch cancelled-esch">Cancelled</span>,
      'rescheduled': <span className="status-badge-esch rescheduled-esch">Rescheduled</span>
    };
    return badges[status] || <span className="status-badge-esch">{status}</span>;
  };

  const getTypeBadge = (type) => {
    const badges = {
      'pre_assessment': <span className="type-badge-esch pre-assessment-esch">Pre-Assessment</span>,
      'site_visit': <span className="type-badge-esch site-visit-esch">Site Visit</span>,
      'installation': <span className="type-badge-esch installation-esch">Installation</span>,
      'inspection': <span className="type-badge-esch inspection-esch">Inspection</span>
    };
    return badges[type] || <span className="type-badge-esch">{type}</span>;
  };

  const filteredSchedules = schedules.filter(schedule => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return schedule.title?.toLowerCase().includes(searchLower) ||
           schedule.clientName?.toLowerCase().includes(searchLower) ||
           schedule.address?.street?.toLowerCase().includes(searchLower);
  });

  const SkeletonLoader = () => (
    <div className="engineer-schedule-container-esch">
      <div className="schedule-header-esch">
        <div className="skeleton-line-esch large-esch"></div>
        <div className="skeleton-line-esch medium-esch"></div>
      </div>
      <div className="schedule-controls-esch">
        <div className="skeleton-select-esch"></div>
        <div className="skeleton-search-esch"></div>
      </div>
      <div className="table-container-esch">
        <div className="skeleton-table-esch">
          <div className="skeleton-table-header-esch"></div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton-table-row-esch"></div>
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
        <title>My Schedule | Engineer | Salfer Engineering</title>
      </Helmet>

      <div className="engineer-schedule-container-esch">
        <div className="schedule-header-esch">
          
          <p>View your upcoming site visits and assessments</p>
        </div>

        <div className="schedule-controls-esch">
          <div className="filter-group-esch">
            <FaFilter className="filter-icon-esch" />
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="search-group-esch">
            
            <input
              type="text"
              placeholder="Search by title or client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container-esch">
          <table className="schedules-table-esch">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Client</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-state-esch">
                    <p>No schedules found</p>
                  </td>
                </tr>
              ) : (
                filteredSchedules.map(schedule => (
                  <tr key={schedule._id} className="clickable-row-esch">
                    <td>
                      <div className="title-cell-esch">
                        <div className="title-text-esch">{schedule.title}</div>
                      </div>
                    </td>
                    <td>
                      {getTypeBadge(schedule.type)}
                    </td>
                    <td>
                      <div className="client-cell-esch">
                        <div className="client-name-esch">{schedule.clientName}</div>
                        {schedule.clientPhone && (
                          <div className="client-phone-esch">{schedule.clientPhone}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="date-cell-esch">
                        {formatShortDate(schedule.scheduledDate)}
                      </div>
                    </td>
                    <td>
                      <div className="time-cell-esch">
                        {formatTime(schedule.scheduledTime)}
                      </div>
                    </td>
                    <td>
                      {getStatusBadge(schedule.status)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="view-btn-esch"
                        onClick={() => { setSelectedSchedule(schedule); setShowDetailModal(true); }}
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
          <div className="pagination-esch">
            <button 
              className="page-btn-esch"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <FaChevronLeft /> Previous
            </button>
            <span className="page-info-esch">Page {currentPage} of {totalPages}</span>
            <button 
              className="page-btn-esch"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next <FaChevronRight />
            </button>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedSchedule && (
          <div className="modal-overlay-esch" onClick={() => setShowDetailModal(false)}>
            <div className="modal-content-esch detail-modal-esch" onClick={e => e.stopPropagation()}>
              <button className="modal-close-esch" onClick={() => setShowDetailModal(false)}>×</button>
              <h3>Schedule Details</h3>
              
              <div className="detail-section-esch">
                <h4>Schedule Information</h4>
                <p><strong>Title:</strong> {selectedSchedule.title}</p>
                <p><strong>Type:</strong> {getTypeBadge(selectedSchedule.type)}</p>
                <p><strong>Status:</strong> {getStatusBadge(selectedSchedule.status)}</p>
                <p><strong>Date:</strong> {formatDate(selectedSchedule.scheduledDate)}</p>
                <p><strong>Time:</strong> {selectedSchedule.scheduledTime} - {selectedSchedule.endTime || 'N/A'}</p>
                {selectedSchedule.duration && <p><strong>Duration:</strong> {selectedSchedule.duration} hours</p>}
              </div>

              <div className="detail-section-esch">
                <h4>Client Information</h4>
                <p><strong>Name:</strong> {selectedSchedule.clientName}</p>
                <p><strong>Phone:</strong> {selectedSchedule.clientPhone}</p>
                <p><strong>Address:</strong> 
                  {selectedSchedule.address?.houseOrBuilding} {selectedSchedule.address?.street}, 
                  {selectedSchedule.address?.barangay}, {selectedSchedule.address?.cityMunicipality}
                </p>
              </div>

              {selectedSchedule.description && (
                <div className="detail-section-esch">
                  <h4>Description</h4>
                  <p>{selectedSchedule.description}</p>
                </div>
              )}

              {selectedSchedule.notes && (
                <div className="detail-section-esch">
                  <h4>Notes</h4>
                  <p>{selectedSchedule.notes}</p>
                </div>
              )}

              <div className="modal-actions-esch">
                <button className="cancel-btn-esch" onClick={() => setShowDetailModal(false)}>Close</button>
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