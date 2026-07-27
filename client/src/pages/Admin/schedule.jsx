// pages/Admin/AdminSchedule.jsx - Table View with Tabs
import React, { useState, useEffect, useRef } from 'react';
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
  FaUserCog,
  FaSyncAlt,
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
  
  // Tabs instead of filter
  const [activeTab, setActiveTab] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  
  // Dropdown
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 20 });
  const buttonRefs = useRef({});
  const dropdownRef = useRef(null);
  
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
  }, [activeTab, typeFilter, currentPage]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/schedules`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { 
          status: activeTab === 'all' ? undefined : activeTab,
          type: typeFilter === 'all' ? undefined : typeFilter,
          page: currentPage,
          limit: itemsPerPage
        }
      });
      setSchedules(response.data.schedules || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalItems(response.data.total || 0);
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

  const handleDropdownClick = (event, scheduleId) => {
    event.stopPropagation();
    const buttonRect = event.currentTarget.getBoundingClientRect();
    setDropdownPosition({
      top: buttonRect.bottom + 5,
      right: window.innerWidth - buttonRect.right - 10,
    });
    setOpenDropdownId(openDropdownId === scheduleId ? null : scheduleId);
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

  const filteredSchedules = schedules.filter(schedule => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return schedule.title?.toLowerCase().includes(searchLower) ||
           schedule.clientName?.toLowerCase().includes(searchLower) ||
           schedule._id?.toLowerCase().includes(searchLower) ||
           schedule.type?.toLowerCase().includes(searchLower);
  });

  // Pagination calculations
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const SkeletonLoader = () => (
    <div className="schedule-management-adsche">
      <div className="schedule-header-adsche">
        <div className="skeleton-line-adsche large"></div>
        <div className="skeleton-line-adsche medium"></div>
      </div>
      <div className="schedule-tabs-adsche">
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton-tab-adsche"></div>)}
      </div>
      <div className="schedule-filters-adsche">
        <div className="skeleton-select-adsche"></div>
        <div className="skeleton-search-adsche"></div>
      </div>
      <div className="schedule-table-container-adsche">
        <div className="skeleton-table-adsche"></div>
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
        {/* --- Minimalist Header --- */}
        <div className="schedule-header-adsche">
          <div></div>
        </div>

        {/* --- TABS (Status) --- */}
        <div className="schedule-tabs-adsche">
          <button
            className={`tab-btn-adsche ${activeTab === 'all' ? 'active-adsche' : ''}`}
            onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
          >
            All Schedules
            <span className="tab-badge-adsche">{stats.total}</span>
          </button>
          <button
            className={`tab-btn-adsche ${activeTab === 'scheduled' ? 'active-adsche' : ''}`}
            onClick={() => { setActiveTab('scheduled'); setCurrentPage(1); }}
          >
            Scheduled
            <span className="tab-badge-adsche">{stats.scheduled}</span>
          </button>
          <button
            className={`tab-btn-adsche ${activeTab === 'confirmed' ? 'active-adsche' : ''}`}
            onClick={() => { setActiveTab('confirmed'); setCurrentPage(1); }}
          >
            Confirmed
            <span className="tab-badge-adsche">{stats.confirmed}</span>
          </button>
          <button
            className={`tab-btn-adsche ${activeTab === 'in_progress' ? 'active-adsche' : ''}`}
            onClick={() => { setActiveTab('in_progress'); setCurrentPage(1); }}
          >
            In Progress
            <span className="tab-badge-adsche">{stats.inProgress}</span>
          </button>
          <button
            className={`tab-btn-adsche ${activeTab === 'completed' ? 'active-adsche' : ''}`}
            onClick={() => { setActiveTab('completed'); setCurrentPage(1); }}
          >
            Completed
            <span className="tab-badge-adsche">{stats.completed}</span>
          </button>
          <button
            className={`tab-btn-adsche ${activeTab === 'cancelled' ? 'active-adsche' : ''}`}
            onClick={() => { setActiveTab('cancelled'); setCurrentPage(1); }}
          >
            Cancelled
            <span className="tab-badge-adsche">{stats.cancelled}</span>
          </button>
        </div>

        {/* --- TOOLBAR (Search, Type Filter, Refresh) --- */}
        <div className="schedule-filters-adsche">
          <div className="search-group-adsche">
            <FaSearch className="search-icon-adsche" />
            <input
              type="text"
              placeholder="Search by title, client, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group-adsche">
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">All Types</option>
              <option value="pre_assessment">Pre-Assessment</option>
              <option value="site_visit">Site Visit</option>
              <option value="installation">Installation</option>
              <option value="inspection">Inspection</option>
            </select>
            <FaChevronDown className="select-arrow-adsche" />
          </div>
          <button className="refresh-btn-adsche" onClick={() => { fetchSchedules(); fetchStats(); }}>
            <FaSyncAlt className={loading ? 'spinning-adsche' : ''} /> Refresh
          </button>
        </div>

        {/* --- TABLE --- */}
        <div className="schedule-table-container-adsche">
          <table className="schedule-table-adsche">
            <thead>
              <tr>
                <th>Title / ID</th>
                <th>Client</th>
                <th>Engineer</th>
                <th>Date & Time</th>
                <th>Type</th>
                <th>Status</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.length === 0 ? (
                <tr><td colSpan="7" className="empty-state-adsche">No schedules found</td></tr>
              ) : (
                filteredSchedules.map(schedule => {
                  const isOpen = openDropdownId === schedule._id;

                  return (
                    <tr key={schedule._id}>
                      <td className="ref-cell-adsche">
                        <div className="schedule-title-adsche">{schedule.title}</div>
                        <div className="schedule-id-adsche">{schedule._id}</div>
                      </td>
                      <td className="client-cell-adsche">
                        <strong>{schedule.clientName || 'N/A'}</strong>
                        {schedule.clientPhone && (
                          <div className="client-contact-adsche"><FaPhone /> {schedule.clientPhone}</div>
                        )}
                      </td>
                      <td>
                        {schedule.assignedEngineerId?.firstName} {schedule.assignedEngineerId?.lastName || 'Not assigned'}
                      </td>
                      <td>
                        <div className="date-cell-adsche">
                          <FaCalendarAlt className="cell-icon-adsche" />
                          {formatDate(schedule.scheduledDate)}
                        </div>
                        <div className="time-cell-adsche">
                          <FaClock className="cell-icon-adsche" />
                          {formatTime(schedule.scheduledTime)}
                          {schedule.endTime && ` - ${formatTime(schedule.endTime)}`}
                        </div>
                      </td>
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
                              <button
                                className="dropdown-item-adsche"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSchedule(schedule);
                                  setShowDetailModal(true);
                                  setOpenDropdownId(null);
                                }}
                              >
                                <FaEye /> View Details
                              </button>
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

        {/* --- Pagination --- */}
        {totalPages > 1 && (
          <div className="pagination-adsche">
            <div className="pagination-info-adsche">
              Showing {startItem} to {endItem} of {totalItems} entries
            </div>
            <div className="pagination-controls-adsche">
              <button 
                className="page-btn-adsche"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <FaChevronLeft /> Previous
              </button>
              
              {getPageNumbers().map(page => (
                <button
                  key={page}
                  className={`page-number-adsche ${currentPage === page ? 'active-adsche' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              
              <button 
                className="page-btn-adsche"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next <FaChevronRight />
              </button>
            </div>
          </div>
        )}

        {/* --- DETAIL MODAL (NO X BUTTON) --- */}
        {showDetailModal && selectedSchedule && (
          <div className="modal-overlay-adsche" onClick={() => setShowDetailModal(false)}>
            <div className="modal-content-adsche detail-modal-adsche" onClick={e => e.stopPropagation()}>
              <div className="modal-header-adsche">
                <h3>Schedule Details</h3>
              </div>
              
              <div className="modal-body-adsche">
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
              </div>

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