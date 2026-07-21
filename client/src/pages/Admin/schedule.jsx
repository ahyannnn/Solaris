// pages/Admin/AdminSchedule.adsche.jsx - Card View with only View Details
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { 
  FaCalendarAlt, 
  FaEye, 
  FaClock,
  FaSpinner,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaFilter,
  FaMapMarkerAlt,
  FaUser,
  FaCamera,
  FaPhone,
  FaFileAlt,
  FaClipboardList,
  FaHome,
  FaBuilding,
  FaCheckCircle,
  FaUserCog
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
    upcoming: 0,
    inProgress: 0
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
      setStats(response.data.stats || {
        total: 0, scheduled: 0, confirmed: 0, completed: 0, cancelled: 0, upcoming: 0, inProgress: 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
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
    if (!time) return 'N/A';
    return time;
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

  const getStatusColor = (status) => {
    const colors = {
      'scheduled': '#3B82F6',
      'confirmed': '#8B5CF6',
      'in_progress': '#F59E0B',
      'completed': '#22C55E',
      'cancelled': '#EF4444',
      'rescheduled': '#F59E0B'
    };
    return colors[status] || '#64748B';
  };

  const getTypeIcon = (type) => {
    const icons = {
      'pre_assessment': <FaClipboardList />,
      'site_visit': <FaHome />,
      'installation': <FaBuilding />,
      'inspection': <FaCheckCircle />
    };
    return icons[type] || <FaCalendarAlt />;
  };

  const handleViewSchedule = (schedule) => {
    setSelectedSchedule(schedule);
    setShowDetailModal(true);
  };

  const filteredSchedules = schedules.filter(schedule => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return schedule.title?.toLowerCase().includes(searchLower) ||
           schedule.clientName?.toLowerCase().includes(searchLower) ||
           schedule._id?.toLowerCase().includes(searchLower) ||
           schedule.type?.toLowerCase().includes(searchLower);
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
      <div className="schedule-cards-container-adsche">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="schedule-card-skeleton-adsche">
            <div className="skeleton-line-adsche medium"></div>
            <div className="skeleton-line-adsche small"></div>
            <div className="skeleton-line-adsche small"></div>
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
        <title>Schedule Management | Admin | Salfer Engineering</title>
      </Helmet>

      <div className="schedule-management-adsche">
        <div className="schedule-header-adsche">
          <div>
            
            <p>View and manage all site visits, assessments, and installations</p>
          </div>
          <div className="header-actions-adsche">
            <span className="total-count-adsche">{stats.total} Total Schedules</span>
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
              placeholder="Search by title, client, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Schedule Cards */}
        <div className="schedule-cards-container-adsche">
          {filteredSchedules.length === 0 ? (
            <div className="empty-state-adsche">
              <p>No schedules found</p>
            </div>
          ) : (
            filteredSchedules.map(schedule => {
              const hasSitePhotos = schedule.sitePhotos && schedule.sitePhotos.length > 0;
              
              return (
                <div key={schedule._id} className="schedule-card-adsche">
                  <div className="schedule-card-header-adsche">
                    <div className="schedule-card-title-adsche">
                      <div className="schedule-type-icon-adsche" style={{ color: getStatusColor(schedule.status) }}>
                        {getTypeIcon(schedule.type)}
                      </div>
                      <div>
                        <h3 className="schedule-title-adsche">{schedule.title}</h3>
                        <div className="schedule-ref-adsche">ID: {schedule._id}</div>
                      </div>
                    </div>
                    <div className="schedule-card-status-adsche">
                      {getStatusBadge(schedule.status)}
                      {getTypeBadge(schedule.type)}
                    </div>
                  </div>

                  <div className="schedule-card-body-adsche">
                    <div className="schedule-card-info-adsche">
                      <div className="info-row-adsche">
                        <span className="info-label-adsche">
                          <FaCalendarAlt />
                          Date & Time
                        </span>
                        <span className="info-value-adsche">
                          {formatDate(schedule.scheduledDate)} at {formatTime(schedule.scheduledTime)}
                          {schedule.endTime && ` - ${formatTime(schedule.endTime)}`}
                        </span>
                      </div>
                      <div className="info-row-adsche">
                        <span className="info-label-adsche">
                          <FaUser />
                          Client
                        </span>
                        <span className="info-value-adsche">
                          {schedule.clientName || 'N/A'}
                          {schedule.clientPhone && (
                            <span className="client-phone-adsche">
                              <FaPhone /> {schedule.clientPhone}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="info-row-adsche">
                        <span className="info-label-adsche">
                          <FaUserCog />
                          Engineer
                        </span>
                        <span className="info-value-adsche">
                          {schedule.assignedEngineerId?.firstName} {schedule.assignedEngineerId?.lastName || 'Not assigned'}
                        </span>
                      </div>
                      {schedule.address && (
                        <div className="info-row-adsche">
                          <span className="info-label-adsche">
                            <FaMapMarkerAlt />
                            Address
                          </span>
                          <span className="info-value-adsche">
                            {schedule.address.houseOrBuilding} {schedule.address.street}, {schedule.address.barangay}, {schedule.address.cityMunicipality}
                          </span>
                        </div>
                      )}
                    </div>

                    {hasSitePhotos && (
                      <div className="schedule-card-photos-adsche">
                        <span className="photos-label-adsche">
                          <FaCamera /> {schedule.sitePhotos.length} site photo(s)
                        </span>
                        <div className="photos-preview-adsche">
                          {schedule.sitePhotos.slice(0, 4).map((photo, idx) => (
                            <div key={idx} className="photo-thumb-adsche">
                              <img src={photo} alt={`Site ${idx + 1}`} />
                            </div>
                          ))}
                          {schedule.sitePhotos.length > 4 && (
                            <div className="photo-more-adsche">+{schedule.sitePhotos.length - 4}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {schedule.description && (
                      <div className="schedule-card-description-adsche">
                        <FaFileAlt className="desc-icon-adsche" />
                        <span>{schedule.description}</span>
                      </div>
                    )}
                  </div>

                  <div className="schedule-card-footer-adsche">
                    <button 
                      className="view-details-btn-adsche"
                      onClick={() => handleViewSchedule(schedule)}
                    >
                      <FaEye /> View Details
                    </button>
                  </div>
                </div>
              );
            })
          )}
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
                {selectedSchedule.clientEmail && (
                  <p><strong>Email:</strong> {selectedSchedule.clientEmail}</p>
                )}
                {selectedSchedule.address && (
                  <p><strong>Address:</strong> {selectedSchedule.address.houseOrBuilding} {selectedSchedule.address.street}, {selectedSchedule.address.barangay}, {selectedSchedule.address.cityMunicipality}</p>
                )}
              </div>

              <div className="detail-section-adsche">
                <h4>Assigned Personnel</h4>
                <p><strong>Engineer:</strong> {selectedSchedule.assignedEngineerId?.firstName} {selectedSchedule.assignedEngineerId?.lastName || 'Not assigned'}</p>
                {selectedSchedule.assignedEngineerId?.email && (
                  <p><strong>Engineer Email:</strong> {selectedSchedule.assignedEngineerId.email}</p>
                )}
                {selectedSchedule.assignedEngineerId?.phone && (
                  <p><strong>Engineer Phone:</strong> {selectedSchedule.assignedEngineerId.phone}</p>
                )}
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

              {/* Site Photos */}
              {selectedSchedule.sitePhotos && selectedSchedule.sitePhotos.length > 0 && (
                <div className="detail-section-adsche">
                  <h4><FaCamera /> Site Photos ({selectedSchedule.sitePhotos.length})</h4>
                  <div className="site-photos-grid-adsche">
                    {selectedSchedule.sitePhotos.map((photo, index) => (
                      <div key={index} className="site-photo-item-adsche">
                        <img src={photo} alt={`Site photo ${index + 1}`} />
                        <div className="photo-overlay-adsche">
                          <FaCamera />
                        </div>
                      </div>
                    ))}
                  </div>
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