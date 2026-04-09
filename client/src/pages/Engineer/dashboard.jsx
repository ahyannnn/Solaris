import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaTachometerAlt, 
  FaClipboardList, 
  FaCheckCircle, 
  FaClock, 
  FaSpinner,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUser,
  FaMicrochip,
  FaChartLine,
  FaArrowRight,
  FaExclamationTriangle,
  FaTools,
  FaHome,
  FaBuilding,
  FaPhone,
  FaEnvelope,
  FaWifi,
  FaBatteryFull
} from 'react-icons/fa';
import '../../styles/Engineer/dashboard.css';

const EngineerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    myProjects: 0,
    myAssessments: 0,
    completedAssessments: 0,
    myDevices: 0,
    mySchedules: 0,
    todaySchedules: 0
  });
  const [myAssessments, setMyAssessments] = useState([]);
  const [mySchedules, setMySchedules] = useState([]);
  const [myDevices, setMyDevices] = useState([]);
  const [userName, setUserName] = useState('');

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
      const myProjects = projectsRes.data.projects || [];
      const activeProjects = myProjects.filter(p => p.status !== 'completed' && p.status !== 'cancelled').length;

      // Fetch MY assessments (assigned to this engineer)
      const assessmentsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments/engineer/my-assessments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const myAssessmentsList = assessmentsRes.data.assessments || [];
      const pendingAssessments = myAssessmentsList.filter(a => a.assessmentStatus === 'scheduled').length;
      const completedAssessments = myAssessmentsList.filter(a => a.assessmentStatus === 'completed').length;

      // Fetch MY devices (devices assigned to my assessments)
      const myDevicesList = myAssessmentsList.filter(a => a.iotDeviceId).map(a => a.iotDeviceId);
      
      // Fetch MY schedules (assigned to this engineer)
      const schedulesRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/schedules/engineer/my-schedules`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const mySchedulesList = schedulesRes.data.schedules || [];
      const upcomingSchedules = mySchedulesList.filter(s => s.status === 'scheduled' || s.status === 'confirmed');
      const todaySchedules = mySchedulesList.filter(s => {
        const today = new Date().toDateString();
        return new Date(s.scheduledDate).toDateString() === today && s.status !== 'completed';
      }).length;

      setStats({
        myProjects: activeProjects,
        myAssessments: pendingAssessments,
        completedAssessments: completedAssessments,
        myDevices: myDevicesList.length,
        mySchedules: upcomingSchedules.length,
        todaySchedules: todaySchedules
      });

      setMyAssessments(myAssessmentsList.slice(0, 5));
      setMySchedules(upcomingSchedules.slice(0, 5));
      setMyDevices(myDevicesList.slice(0, 5));

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
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    return time;
  }; 

  const getAssessmentStatusBadge = (status) => {
    const badges = {
      'scheduled': <span className="status-badge-engdas scheduled-engdas">Scheduled</span>,
      'device_deployed': <span className="status-badge-engdas deployed-engdas">Device Deployed</span>,
      'data_collecting': <span className="status-badge-engdas collecting-engdas">Data Collecting</span>,
      'data_analyzing': <span className="status-badge-engdas analyzing-engdas">Analyzing</span>,
      'completed': <span className="status-badge-engdas completed-engdas">Completed</span>
    };
    return badges[status] || <span className="status-badge-engdas scheduled-engdas">{status}</span>;
  };

  const getScheduleStatusBadge = (status) => {
    const badges = {
      'scheduled': <span className="status-badge-engdas scheduled-engdas">Scheduled</span>,
      'confirmed': <span className="status-badge-engdas confirmed-engdas">Confirmed</span>,
      'in_progress': <span className="status-badge-engdas in-progress-engdas">In Progress</span>,
      'completed': <span className="status-badge-engdas completed-engdas">Completed</span>
    };
    return badges[status] || <span className="status-badge-engdas scheduled-engdas">{status}</span>;
  };

  const SkeletonLoader = () => (
    <div className="engdas-dashboard">
      <div className="engdas-header">
        <div className="engdas-skeleton-title"></div>
        <div className="engdas-skeleton-subtitle"></div>
      </div>
      <div className="engdas-stats-grid">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="engdas-stat-card engdas-skeleton-card">
            <div className="engdas-skeleton-line"></div>
            <div className="engdas-skeleton-line engdas-skeleton-large"></div>
          </div>
        ))}
      </div>
      <div className="engdas-content-grid">
        <div className="engdas-recent-section engdas-skeleton-card">
          <div className="engdas-skeleton-line"></div>
          <div className="engdas-skeleton-line"></div>
        </div>
        <div className="engdas-upcoming-section engdas-skeleton-card">
          <div className="engdas-skeleton-line"></div>
          <div className="engdas-skeleton-line"></div>
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
        {/* Header */}
        <div className="engdas-header">
          <div>
            <h1>My Dashboard</h1>
            <p>Welcome back, {userName}! Here's what's assigned to you.</p>
          </div>
        </div>

        {/* Stats Cards - Lahat ng naka-assign sa engineer */}
        <div className="engdas-stats-grid">
          <div className="engdas-stat-card">
            <div className="engdas-stat-icon">
              <FaTools />
            </div>
            <div className="engdas-stat-info">
              <span className="engdas-stat-value">{stats.myProjects}</span>
              <span className="engdas-stat-label">My Active Projects</span>
            </div>
          </div>
          <div className="engdas-stat-card">
            <div className="engdas-stat-icon">
              <FaClipboardList />
            </div>
            <div className="engdas-stat-info">
              <span className="engdas-stat-value">{stats.myAssessments}</span>
              <span className="engdas-stat-label">Pending Assessments</span>
            </div>
          </div>
          <div className="engdas-stat-card">
            <div className="engdas-stat-icon">
              <FaCheckCircle />
            </div>
            <div className="engdas-stat-info">
              <span className="engdas-stat-value">{stats.completedAssessments}</span>
              <span className="engdas-stat-label">Completed Assessments</span>
            </div>
          </div>
          <div className="engdas-stat-card">
            <div className="engdas-stat-icon">
              <FaMicrochip />
            </div>
            <div className="engdas-stat-info">
              <span className="engdas-stat-value">{stats.myDevices}</span>
              <span className="engdas-stat-label">My Active Devices</span>
            </div>
          </div>
          <div className="engdas-stat-card">
            <div className="engdas-stat-icon">
              <FaCalendarAlt />
            </div>
            <div className="engdas-stat-info">
              <span className="engdas-stat-value">{stats.mySchedules}</span>
              <span className="engdas-stat-label">Upcoming Schedules</span>
            </div>
          </div>
          <div className="engdas-stat-card">
            <div className="engdas-stat-icon">
              <FaClock />
            </div>
            <div className="engdas-stat-info">
              <span className="engdas-stat-value">{stats.todaySchedules}</span>
              <span className="engdas-stat-label">Today's Tasks</span>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="engdas-content-grid">
          {/* My Assessments */}
          <div className="engdas-recent-section">
            <div className="engdas-section-header">
              <h3>
                <FaClipboardList /> My Assessments
              </h3>
              <button 
                className="engdas-view-all"
                onClick={() => navigate('/app/engineer/assessment')}
              >
                View All <FaArrowRight />
              </button>
            </div>
            <div className="engdas-assessment-list">
              {myAssessments.length === 0 ? (
                <div className="engdas-empty-state">
                  <p>No assessments assigned to you yet</p>
                </div>
              ) : (
                myAssessments.map(assessment => (
                  <div key={assessment._id} className="engdas-assessment-item">
                    <div className="engdas-assessment-info">
                      <div className="engdas-assessment-client">
                        <FaUser />
                        <span>{assessment.clientId?.contactFirstName} {assessment.clientId?.contactLastName}</span>
                      </div>
                      <div className="engdas-assessment-address">
                        <FaMapMarkerAlt />
                        <span>{assessment.addressId?.barangay || assessment.address?.barangay || 'Address TBD'}</span>
                      </div>
                      <div className="engdas-assessment-date">
                        <FaCalendarAlt />
                        <span>Preferred: {formatDate(assessment.preferredDate)}</span>
                      </div>
                    </div>
                    <div className="engdas-assessment-status">
                      {getAssessmentStatusBadge(assessment.assessmentStatus)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* My Schedules */}
          <div className="engdas-upcoming-section">
            <div className="engdas-section-header">
              <h3>
                <FaCalendarAlt /> My Schedules
              </h3>
              <button 
                className="engdas-view-all"
                onClick={() => navigate('/app/engineer/schedule')}
              >
                View All <FaArrowRight />
              </button>
            </div>
            <div className="engdas-schedule-list">
              {mySchedules.length === 0 ? (
                <div className="engdas-empty-state">
                  <p>No schedules assigned to you yet</p>
                </div>
              ) : (
                mySchedules.map(schedule => (
                  <div key={schedule._id} className="engdas-schedule-item">
                    <div className="engdas-schedule-info">
                      <div className="engdas-schedule-title">
                        <span className="engdas-schedule-name">{schedule.title}</span>
                        <span className="engdas-schedule-time">
                          <FaClock /> {formatTime(schedule.scheduledTime)}
                        </span>
                      </div>
                      <div className="engdas-schedule-client">
                        <FaUser />
                        <span>{schedule.clientName}</span>
                      </div>
                      <div className="engdas-schedule-address">
                        <FaMapMarkerAlt />
                        <span>{schedule.address?.barangay || 'Address TBD'}</span>
                      </div>
                    </div>
                    <div className="engdas-schedule-status">
                      {getScheduleStatusBadge(schedule.status)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* My Devices Section */}
        <div className="engdas-devices-section">
          <div className="engdas-section-header">
            <h3>
              <FaMicrochip /> My Active Devices
            </h3>
            <button 
              className="engdas-view-all"
              onClick={() => navigate('/app/engineer/device')}
            >
              View All <FaArrowRight />
            </button>
          </div>
          <div className="engdas-devices-grid">
            {myDevices.length === 0 ? (
              <div className="engdas-empty-state">
                <p>No devices assigned to you yet</p>
              </div>
            ) : (
              myDevices.map((device, index) => (
                <div key={device?._id || index} className="engdas-device-card">
                  <div className="engdas-device-icon">
                    <FaMicrochip />
                  </div>
                  <div className="engdas-device-info">
                    <div className="engdas-device-name">{device?.deviceName || 'IoT Device'}</div>
                    <div className="engdas-device-id">{device?.deviceId || 'N/A'}</div>
                  </div>
                  <div className="engdas-device-status online-engdas">
                    <FaWifi /> Online
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="engdas-quick-actions">
          <h3>Quick Actions</h3>
          <div className="engdas-actions-grid">
            <button 
              className="engdas-action-btn"
              onClick={() => navigate('/app/engineer/assessment')}
            >
              <FaClipboardList /> View Assessments
            </button>
            <button 
              className="engdas-action-btn"
              onClick={() => navigate('/app/engineer/schedule')}
            >
              <FaCalendarAlt /> View Schedule
            </button>
            <button 
              className="engdas-action-btn"
              onClick={() => navigate('/app/engineer/device')}
            >
              <FaMicrochip /> Monitor Devices
            </button>
            <button 
              className="engdas-action-btn"
              onClick={() => navigate('/app/engineer/project')}
            >
              <FaTools /> My Projects
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EngineerDashboard;