// pages/Engineer/EngineerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  FaCalendarAlt,
  FaClipboardList,
  FaCheckCircle,
  FaClock,
  FaSpinner,
  FaMapMarkerAlt,
  FaUser,
  FaMicrochip,
  FaArrowRight,
  FaExclamationTriangle,
  FaTools,
  FaHome,
  FaBuilding,
  FaPhone,
  FaEnvelope,
  FaWifi,
  FaBatteryFull,
  FaChevronRight,
  FaCircle,
  FaBell,
  FaProjectDiagram
} from 'react-icons/fa';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import '../../styles/Engineer/dashboard.css';

const EngineerDashboard = () => {
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    myProjects: 0,
    myAssessments: 0,
    mySchedules: 0,
    todaySchedules: 0
  });
  const [myAssessments, setMyAssessments] = useState([]);
  const [mySchedules, setMySchedules] = useState([]);
  const [myDevices, setMyDevices] = useState([]);
  const [userName, setUserName] = useState('');
  const [myProjects, setMyProjects] = useState([]);
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [allActivities, setAllActivities] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');

      // Fetch MY projects (assigned to this engineer)
      const projectsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects/engineer/my-projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const myProjectsList = projectsRes.data.projects || [];
      setMyProjects(myProjectsList);
      const activeProjects = myProjectsList.filter(p => p.status !== 'completed' && p.status !== 'cancelled').length;

      // Fetch MY assessments (assigned to this engineer)
      const assessmentsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments/engineer/my-assessments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const myAssessmentsList = assessmentsRes.data.assessments || [];
      setMyAssessments(myAssessmentsList.slice(0, 5));
      const pendingAssessments = myAssessmentsList.filter(a => a.assessmentStatus === 'scheduled' || a.assessmentStatus === 'pending_review').length;

      // Set active assessment
      const active = myAssessmentsList.find(a => a.assessmentStatus === 'scheduled' || a.assessmentStatus === 'in_progress' || a.assessmentStatus === 'device_deployed');
      setActiveAssessment(active || myAssessmentsList[0] || null);

      // Fetch MY devices
      const myDevicesList = myAssessmentsList.filter(a => a.iotDeviceId).map(a => a.iotDeviceId);
      setMyDevices(myDevicesList.slice(0, 5));
      
      // Fetch MY schedules (assigned to this engineer)
      const schedulesRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/schedules/engineer/my-schedules`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const mySchedulesList = schedulesRes.data.schedules || [];
      const upcomingSchedules = mySchedulesList.filter(s => s.status === 'scheduled' || s.status === 'confirmed');
      const todayScheds = mySchedulesList.filter(s => {
        const today = new Date().toDateString();
        return new Date(s.scheduledDate).toDateString() === today && s.status !== 'completed' && s.status !== 'cancelled';
      });
      setTodaySchedules(todayScheds);
      setMySchedules(upcomingSchedules.slice(0, 5));

      // Get user name from session storage or localStorage
      const storedName = sessionStorage.getItem('userName') || localStorage.getItem('userName') || 'Engineer';
      setUserName(storedName);

      setStats({
        myProjects: activeProjects,
        myAssessments: pendingAssessments,
        mySchedules: upcomingSchedules.length,
        todaySchedules: todayScheds.length
      });

      // Combine activities for timeline
      const activities = [];
      myAssessmentsList.forEach(a => {
        if (a.assessmentStatus === 'scheduled' || a.assessmentStatus === 'pending_review') {
          activities.push({
            id: a._id,
            type: 'assessment',
            title: 'Assessment Pending',
            reference: a.bookingReference || 'Assessment',
            date: a.bookedAt || a.createdAt,
            status: a.assessmentStatus,
            icon: <FaClipboardList />
          });
        }
      });
      todayScheds.forEach(s => {
        activities.push({
          id: s._id,
          type: 'schedule',
          title: 'Today\'s Schedule',
          reference: s.title || 'Site Visit',
          date: s.scheduledDate,
          status: s.status,
          icon: <FaCalendarAlt />
        });
      });
      myProjectsList.forEach(p => {
        if (p.status === 'in_progress') {
          activities.push({
            id: p._id,
            type: 'project',
            title: 'Project in Progress',
            reference: p.projectName || p.projectReference,
            date: p.startDate || p.createdAt,
            status: p.status,
            icon: <FaTools />
          });
        }
      });
      activities.sort((a, b) => new Date(b.date) - new Date(a.date));
      setAllActivities(activities.slice(0, 5));

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    return time;
  };

  const getStatusBadge = (status, type = 'assessment') => {
    const badges = {
      'assessment': {
        'scheduled': <span className="status-badge-engdas scheduled-engdas">Scheduled</span>,
        'pending_review': <span className="status-badge-engdas pending-engdas">Pending Review</span>,
        'pending_payment': <span className="status-badge-engdas pending-engdas">Pending Payment</span>,
        'site_visit_ongoing': <span className="status-badge-engdas in-progress-engdas">Site Visit</span>,
        'device_deployed': <span className="status-badge-engdas deployed-engdas">Device Deployed</span>,
        'data_collecting': <span className="status-badge-engdas collecting-engdas">Data Collecting</span>,
        'data_analyzing': <span className="status-badge-engdas analyzing-engdas">Analyzing</span>,
        'completed': <span className="status-badge-engdas completed-engdas">Completed</span>,
        'cancelled': <span className="status-badge-engdas cancelled-engdas">Cancelled</span>
      },
      'schedule': {
        'scheduled': <span className="status-badge-engdas scheduled-engdas">Scheduled</span>,
        'confirmed': <span className="status-badge-engdas confirmed-engdas">Confirmed</span>,
        'in_progress': <span className="status-badge-engdas in-progress-engdas">In Progress</span>,
        'completed': <span className="status-badge-engdas completed-engdas">Completed</span>,
        'cancelled': <span className="status-badge-engdas cancelled-engdas">Cancelled</span>
      },
      'project': {
        'pending': <span className="status-badge-engdas pending-engdas">Pending</span>,
        'approved': <span className="status-badge-engdas approved-engdas">Approved</span>,
        'in_progress': <span className="status-badge-engdas in-progress-engdas">In Progress</span>,
        'completed': <span className="status-badge-engdas completed-engdas">Completed</span>
      }
    };
    return badges[type]?.[status] || <span className="status-badge-engdas">{status}</span>;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'assessment': return <FaClipboardList className="activity-icon-engdas" />;
      case 'schedule': return <FaCalendarAlt className="activity-icon-engdas" />;
      case 'project': return <FaTools className="activity-icon-engdas" />;
      default: return <FaBell className="activity-icon-engdas" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'assessment': return '#8B5CF6';
      case 'schedule': return '#3B82F6';
      case 'project': return '#F59E0B';
      default: return '#64748B';
    }
  };

  const SkeletonLoader = () => (
    <div className="engdas-dashboard">
      <div className="engdas-welcome-section">
        <div className="skeleton-line-engdas skeleton-title-engdas"></div>
        <div className="skeleton-line-engdas skeleton-text-engdas"></div>
      </div>
      <div className="engdas-stats-grid">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="stat-card-engdas skeleton-card-engdas">
            <div className="skeleton-line-engdas skeleton-label-engdas"></div>
            <div className="skeleton-line-engdas skeleton-value-engdas"></div>
          </div>
        ))}
      </div>
      <div className="engdas-row-layout">
        <div className="skeleton-card-engdas" style={{ padding: '24px', borderRadius: 'var(--radius-2xl)' }}>
          <div className="skeleton-line-engdas skeleton-project-name-engdas"></div>
          <div className="skeleton-line-engdas skeleton-project-system-engdas"></div>
        </div>
        <div className="skeleton-card-engdas" style={{ padding: '20px', borderRadius: 'var(--radius-2xl)' }}>
          <div className="skeleton-line-engdas skeleton-activity-title-engdas"></div>
          <div className="skeleton-line-engdas skeleton-activity-ref-engdas"></div>
          <div className="skeleton-line-engdas skeleton-activity-date-engdas"></div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <>
        <Helmet>
          <title>My Dashboard | Engineer | Salfer Engineering</title>
        </Helmet>
        <SkeletonLoader />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Dashboard | Engineer | Salfer Engineering</title>
      </Helmet>

      <div className="engdas-dashboard">
        {/* Welcome Section */}
        <div className="engdas-welcome-section">
          <div className="engdas-welcome-content">
            
            <p className="engdas-welcome-greeting">Welcome back, {userName || 'Engineer'}!</p>
          </div>
          <div className="engdas-welcome-actions">
            <Link to="/app/engineer/assessment" className="btn-primary-engdas">
              <FaClipboardList /> View Assessments
            </Link>
            <Link to="/app/engineer/schedule" className="btn-secondary-engdas">
              <FaCalendarAlt /> My Schedule
            </Link>
          </div>
        </div>

        {/* Today's Tasks Alert */}
        {todaySchedules.length > 0 && (
          <div className="engdas-today-alert">
            <div className="alert-icon-engdas">
              <FaClock />
            </div>
            <div className="alert-content-engdas">
              <strong>You have {todaySchedules.length} task(s) for today</strong>
              <p>Check your schedule for details.</p>
            </div>
            <Link to="/app/engineer/schedule" className="alert-action-engdas">
              View Schedule <FaArrowRight />
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        <div className="engdas-quick-actions">
          <h3 className="quick-actions-title-engdas">Quick Actions</h3>
          <div className="engdas-action-grid">
            <Link to="/app/engineer/assessment" className="quick-action-item-engdas">
              <div className="quick-action-icon-engdas" style={{ background: '#EDE9FE', color: '#7C3AED' }}>
                <FaClipboardList />
              </div>
              <span className="quick-action-label-engdas">My Assessments</span>
              <FaChevronRight className="quick-action-arrow-engdas" />
            </Link>
            <Link to="/app/engineer/schedule" className="quick-action-item-engdas">
              <div className="quick-action-icon-engdas" style={{ background: '#DBEAFE', color: '#2563EB' }}>
                <FaCalendarAlt />
              </div>
              <span className="quick-action-label-engdas">My Schedule</span>
              <FaChevronRight className="quick-action-arrow-engdas" />
            </Link>
            <Link to="/app/engineer/project" className="quick-action-item-engdas">
              <div className="quick-action-icon-engdas" style={{ background: '#FEF3C7', color: '#D97706' }}>
                <FaTools />
              </div>
              <span className="quick-action-label-engdas">My Projects</span>
              <FaChevronRight className="quick-action-arrow-engdas" />
            </Link>
            <Link to="/app/engineer/device" className="quick-action-item-engdas">
              <div className="quick-action-icon-engdas" style={{ background: '#D1FAE5', color: '#059669' }}>
                <FaMicrochip />
              </div>
              <span className="quick-action-label-engdas">My Devices</span>
              <FaChevronRight className="quick-action-arrow-engdas" />
            </Link>
          </div>
        </div>

        {/* Stats Cards - Only 4 cards */}
        <div className="engdas-stats-grid">
          <div className="stat-card-engdas">
            <div className="stat-content-engdas">
              <span className="stat-label-engdas">Active Projects</span>
              <span className="stat-value-engdas">{stats.myProjects}</span>
              <span className="stat-trend-engdas">Assigned to you</span>
            </div>
          </div>
          <div className="stat-card-engdas">
            <div className="stat-content-engdas">
              <span className="stat-label-engdas">Pending Assessments</span>
              <span className="stat-value-engdas">{stats.myAssessments}</span>
              <span className="stat-trend-engdas">Need your attention</span>
            </div>
          </div>
          <div className="stat-card-engdas">
            <div className="stat-content-engdas">
              <span className="stat-label-engdas">Today's Tasks</span>
              <span className="stat-value-engdas">{stats.todaySchedules}</span>
              <span className="stat-trend-engdas">For today</span>
            </div>
          </div>
          <div className="stat-card-engdas">
            <div className="stat-content-engdas">
              <span className="stat-label-engdas">Upcoming Schedules</span>
              <span className="stat-value-engdas">{stats.mySchedules}</span>
              <span className="stat-trend-engdas">This week</span>
            </div>
          </div>
        </div>

        {/* Row Layout: Active Assessment + Recent Activity */}
        <div className="engdas-row-layout">
          {/* Active Assessment */}
          <div className="engdas-assessment-section">
            <div className="section-header-engdas">
              <h2 className="section-title-engdas">Active Assessment</h2>
              {activeAssessment && (
                <Link to="/app/engineer/assessment" className="view-all-link-engdas">
                  View All
                  <FaChevronRight className="arrow-icon-engdas" />
                </Link>
              )}
            </div>

            {activeAssessment ? (
              <div className="assessment-card-engdas">
                <div className="assessment-header-engdas">
                  <div className="assessment-info-engdas">
                    <h3 className="assessment-name-engdas">
                      {activeAssessment.clientId?.contactFirstName} {activeAssessment.clientId?.contactLastName}
                    </h3>
                    <p className="assessment-reference-engdas">{activeAssessment.bookingReference}</p>
                  </div>
                  {getStatusBadge(activeAssessment.assessmentStatus, 'assessment')}
                </div>

                <div className="assessment-content-engdas">
                  <div className="assessment-details-engdas">
                    <div className="assessment-metric-engdas">
                      <span className="metric-label-engdas">Property Type</span>
                      <span className="metric-value-engdas">{activeAssessment.propertyType || 'N/A'}</span>
                    </div>
                    <div className="assessment-metric-engdas">
                      <span className="metric-label-engdas">Preferred Date</span>
                      <span className="metric-value-engdas">{formatDate(activeAssessment.preferredDate)}</span>
                    </div>
                    <div className="assessment-metric-engdas">
                      <span className="metric-label-engdas">
                        <FaMapMarkerAlt /> Address
                      </span>
                      <span className="metric-value-engdas">
                        {activeAssessment.address?.barangay || activeAssessment.address?.cityMunicipality || 'TBD'}
                      </span>
                    </div>
                  </div>
                </div>

                
              </div>
            ) : (
              <div className="empty-state-engdas">
                <div className="empty-state-content-engdas">
                  <h3 className="empty-state-title-engdas">No active assessments</h3>
                  <p className="empty-state-description-engdas">You have no assessments assigned yet</p>
                </div>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="engdas-activities-section">
            <div className="section-header-engdas">
              <h2 className="section-title-engdas">Recent Activity</h2>
              {allActivities.length > 0 && (
                <Link to="/app/engineer/assessment" className="view-all-link-engdas">
                  View All
                  <FaChevronRight className="arrow-icon-engdas" />
                </Link>
              )}
            </div>

            <div className="activities-card-engdas">
              <div className="activities-list-engdas">
                {allActivities.length > 0 ? (
                  allActivities.map((activity, index) => (
                    <React.Fragment key={activity.id}>
                      <div className="activity-item-engdas">
                        <div className="activity-icon-wrapper-engdas" style={{ background: `${getActivityColor(activity.type)}15`, color: getActivityColor(activity.type) }}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="activity-content-engdas">
                          <div className="activity-header-engdas">
                            <span className="activity-title-engdas">{activity.title}</span>
                            <span className="activity-reference-engdas">{activity.reference}</span>
                          </div>
                          <span className="activity-date-engdas">
                            {formatDate(activity.date)}
                          </span>
                        </div>
                        <div className="activity-status-engdas">
                          {getStatusBadge(activity.status, 
                            activity.type === 'assessment' ? 'assessment' : 
                            activity.type === 'schedule' ? 'schedule' : 'project'
                          )}
                        </div>
                      </div>
                      {index < allActivities.length - 1 && <div className="activity-divider-engdas"></div>}
                    </React.Fragment>
                  ))
                ) : (
                  <div className="empty-small-engdas">
                    <p className="empty-text-engdas">No recent activity</p>
                  </div>
                )}
              </div>
            </div>

            {/* Today's Schedules */}
            {todaySchedules.length > 0 && (
              <div className="today-schedules-section-engdas">
                <h3 className="schedules-title-engdas">
                  <FaClock className="schedules-icon-engdas" />
                  Today's Schedule
                </h3>
                <div className="schedules-list-engdas">
                  {todaySchedules.map(schedule => (
                    <div key={schedule._id} className="schedule-item-engdas">
                      <div className="schedule-time-engdas">
                        <span className="schedule-hour-engdas">{formatTime(schedule.scheduledTime)}</span>
                      </div>
                      <div className="schedule-info-engdas">
                        <span className="schedule-title-engdas">{schedule.title}</span>
                        <span className="schedule-client-engdas">
                          <FaUser className="schedule-user-icon-engdas" />
                          {schedule.clientName}
                        </span>
                      </div>
                      <div className="schedule-status-engdas">
                        {getStatusBadge(schedule.status, 'schedule')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

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

export default EngineerDashboard;