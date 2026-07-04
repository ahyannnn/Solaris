// pages/Customer/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  FaCalendarAlt,
  FaProjectDiagram,
  FaFileInvoiceDollar,
  FaHeadset,
  FaClock,
  FaMapMarkerAlt,
  FaChevronRight,
  FaCheckCircle,
  FaCircle,
  FaExclamationTriangle,
  FaBell,
  FaArrowRight
} from 'react-icons/fa';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import '../../styles/Customer/dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [recentQuotes, setRecentQuotes] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [projectsList, setProjectsList] = useState([]);
  const [allActivities, setAllActivities] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');

      if (!token) {
        navigate('/login');
        return;
      }

      const userRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/clients/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(userRes.data.client);

      const projectsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects/my-projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const projects = projectsRes.data.projects || [];
      setProjectsList(projects);
      const activeProject = projects.find(p => p.status !== 'completed');
      setProject(activeProject || null);
      if (activeProject) setActiveProjectId(activeProject._id);

      const quotesRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/free-quotes/my-quotes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sortedQuotes = (quotesRes.data.quotes || [])
        .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))
        .slice(0, 3);
      setRecentQuotes(sortedQuotes);

      const preAssessmentsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const pending = (preAssessmentsRes.data.assessments || [])
        .filter(a => a.paymentStatus === 'pending')
        .sort((a, b) => new Date(b.createdAt || b.preferredDate) - new Date(a.createdAt || a.preferredDate))
        .slice(0, 3);
      setPendingPayments(pending);

      const upcoming = (preAssessmentsRes.data.assessments || [])
        .filter(a => new Date(a.preferredDate) > new Date())
        .sort((a, b) => new Date(a.preferredDate) - new Date(b.preferredDate))
        .slice(0, 3);
      setUpcomingAppointments(upcoming);

      // Combine activities for timeline
      const activities = [];
      sortedQuotes.forEach(q => {
        activities.push({
          id: q._id,
          type: 'quote',
          title: 'Quote Request',
          reference: q.quotationReference,
          date: q.requestedAt,
          status: q.status,
          icon: <FaFileInvoiceDollar />
        });
      });
      pending.forEach(p => {
        activities.push({
          id: p._id,
          type: 'payment',
          title: 'Payment Required',
          reference: p.assessmentReference || 'Assessment',
          date: p.createdAt || p.preferredDate,
          status: 'pending',
          icon: <FaExclamationTriangle />
        });
      });
      upcoming.forEach(u => {
        activities.push({
          id: u._id,
          type: 'appointment',
          title: 'Upcoming Assessment',
          reference: u.assessmentType || 'Site Assessment',
          date: u.preferredDate,
          status: 'scheduled',
          icon: <FaCalendarAlt />
        });
      });
      activities.sort((a, b) => new Date(b.date) - new Date(a.date));
      setAllActivities(activities.slice(0, 5));

      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      showToast('Failed to load dashboard data', 'error');
      setLoading(false);
    }
  };

  const handleProjectChange = (projectId) => {
    const selected = projectsList.find(p => p._id === projectId);
    setProject(selected);
    setActiveProjectId(projectId);
  };

  const getFullName = () => {
    if (!user) return '';
    return [user.contactFirstName, user.contactMiddleName, user.contactLastName].filter(n => n).join(' ');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getProjectProgress = () => {
    if (!project) return 0;
    if (project.totalCost === 0) return 0;
    return Math.round((project.amountPaid / project.totalCost) * 100);
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': <span className="status-badge-cusdash status-pending-cusdash">Pending</span>,
      'paid': <span className="status-badge-cusdash status-paid-cusdash">Paid</span>,
      'for_verification': <span className="status-badge-cusdash status-verification-cusdash">Verification</span>,
      'processing': <span className="status-badge-cusdash status-processing-cusdash">Processing</span>,
      'quoted': <span className="status-badge-cusdash status-quoted-cusdash">Quoted</span>,
      'approved': <span className="status-badge-cusdash status-approved-cusdash">Approved</span>,
      'in_progress': <span className="status-badge-cusdash status-progress-cusdash">In Progress</span>,
      'completed': <span className="status-badge-cusdash status-completed-cusdash">Completed</span>,
      'scheduled': <span className="status-badge-cusdash status-scheduled-cusdash">Scheduled</span>
    };
    return badges[status] || <span className="status-badge-cusdash">{status}</span>;
  };

  const getProjectStatusProgress = (status) => {
    const steps = ['pending', 'approved', 'in_progress', 'completed'];
    const index = steps.indexOf(status);
    return index >= 0 ? (index / (steps.length - 1)) * 100 : 0;
  };

  const ProgressRing = ({ progress }) => {
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
      <div className="progress-ring-wrapper-cusdash">
        <svg className="progress-ring-cusdash" width="120" height="120" viewBox="0 0 120 120">
          <circle
            className="progress-ring-bg-cusdash"
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            strokeWidth="3"
          />
          <circle
            className="progress-ring-fill-cusdash"
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div className="progress-ring-content-cusdash">
          <span className="progress-ring-value-cusdash">{progress}%</span>
          <span className="progress-ring-label-cusdash">Progress</span>
        </div>
      </div>
    );
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'quote': return <FaFileInvoiceDollar className="activity-icon-cusdash" />;
      case 'payment': return <FaExclamationTriangle className="activity-icon-cusdash" />;
      case 'appointment': return <FaCalendarAlt className="activity-icon-cusdash" />;
      default: return <FaBell className="activity-icon-cusdash" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'quote': return '#2563EB';
      case 'payment': return '#EF4444';
      case 'appointment': return '#F59E0B';
      default: return '#8B5CF6';
    }
  };

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Dashboard | Salfer Engineering</title>
        </Helmet>
        <div className="dashboard-container-cusdash">
          <div className="welcome-section-cusdash">
            <div className="welcome-content-cusdash">
              <div className="skeleton-line-cusdash skeleton-title-cusdash"></div>
              <div className="skeleton-line-cusdash skeleton-text-cusdash"></div>
            </div>
            <div className="welcome-actions-cusdash">
              <div className="skeleton-button-cusdash"></div>
              <div className="skeleton-button-cusdash"></div>
            </div>
          </div>
          <div className="stats-grid-cusdash">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="stat-card-cusdash skeleton-card-cusdash">
                <div className="skeleton-line-cusdash skeleton-label-cusdash"></div>
                <div className="skeleton-line-cusdash skeleton-value-cusdash"></div>
                <div className="skeleton-line-cusdash skeleton-trend-cusdash"></div>
              </div>
            ))}
          </div>
          <div className="row-layout-cusdash">
            <div className="project-section-cusdash">
              <div className="skeleton-card-cusdash" style={{ padding: '24px', borderRadius: 'var(--radius-2xl)' }}>
                <div className="skeleton-line-cusdash skeleton-project-name-cusdash"></div>
                <div className="skeleton-line-cusdash skeleton-project-system-cusdash"></div>
                <div className="skeleton-progress-ring-cusdash" style={{ marginTop: '16px' }}></div>
              </div>
            </div>
            <div className="activities-section-cusdash">
              <div className="skeleton-card-cusdash" style={{ padding: '20px', borderRadius: 'var(--radius-2xl)' }}>
                <div className="skeleton-line-cusdash skeleton-activity-title-cusdash"></div>
                <div className="skeleton-line-cusdash skeleton-activity-ref-cusdash"></div>
                <div className="skeleton-line-cusdash skeleton-activity-date-cusdash"></div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dashboard | Salfer Engineering</title>
      </Helmet>

      <div className="dashboard-container-cusdash">
        {/* Welcome Section */}
        <div className="welcome-section-cusdash">
          <div className="welcome-content-cusdash">
            <h1 className="page-title-cusdash">Dashboard</h1>
            <p className="welcome-greeting-cusdash">Welcome back, {getFullName() || 'Valued Customer'}</p>
          </div>
          <div className="welcome-actions-cusdash">
            <Link to="book-assessment" className="btn-primary-cusdash">
              <FaCalendarAlt /> Book Assessment
            </Link>
            <Link to="book-assessment" className="btn-secondary-cusdash">
              Request Quote
            </Link>
          </div>
        </div>

        {/* Pending Payments Alert */}
        {pendingPayments.length > 0 && (
          <div className="pending-payments-alert-cusdash">
            <div className="alert-icon-cusdash">
              <FaExclamationTriangle />
            </div>
            <div className="alert-content-cusdash">
              <strong>You have {pendingPayments.length} pending payment(s)</strong>
              <p>Please settle your payments to continue your project.</p>
            </div>
            <Link to="billing" className="alert-action-cusdash">
              Pay Now <FaArrowRight />
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        <div className="quick-actions-cusdash">
          <h3 className="quick-actions-title-cusdash">Quick Actions</h3>
          <div className="action-grid-cusdash">
            <Link to="book-assessment" className="quick-action-item-cusdash">
              <div className="quick-action-icon-cusdash" style={{ background: '#DBEAFE', color: '#2563EB' }}>
                <FaCalendarAlt />
              </div>
              <span className="quick-action-label-cusdash">Book Assessment</span>
              <FaChevronRight className="quick-action-arrow-cusdash" />
            </Link>
            <Link to="project" className="quick-action-item-cusdash">
              <div className="quick-action-icon-cusdash" style={{ background: '#D1FAE5', color: '#059669' }}>
                <FaProjectDiagram />
              </div>
              <span className="quick-action-label-cusdash">View Projects</span>
              <FaChevronRight className="quick-action-arrow-cusdash" />
            </Link>
            <Link to="billing" className="quick-action-item-cusdash">
              <div className="quick-action-icon-cusdash" style={{ background: '#FEF3C7', color: '#D97706' }}>
                <FaFileInvoiceDollar />
              </div>
              <span className="quick-action-label-cusdash">Pay Bills</span>
              <FaChevronRight className="quick-action-arrow-cusdash" />
            </Link>
            <Link to="support" className="quick-action-item-cusdash">
              <div className="quick-action-icon-cusdash" style={{ background: '#EDE9FE', color: '#7C3AED' }}>
                <FaHeadset />
              </div>
              <span className="quick-action-label-cusdash">Get Support</span>
              <FaChevronRight className="quick-action-arrow-cusdash" />
            </Link>
          </div>
        </div>

        {/* Project Selector */}
        {projectsList.length > 1 && (
          <div className="project-selector-container-cusdash">
            <label className="selector-label-cusdash">Active Project</label>
            <div className="custom-select-cusdash">
              <select
                value={activeProjectId || ''}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="project-select-cusdash"
              >
                {projectsList.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.projectName || p.projectReference} — {p.status.replace('_', ' ')}
                  </option>
                ))}
              </select>
              <svg className="select-icon-cusdash" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="stats-grid-cusdash">
          <div className="stat-card-cusdash">
            <div className="stat-content-cusdash">
              <span className="stat-label-cusdash">Active Projects</span>
              <span className="stat-value-cusdash">{projectsList.filter(p => p.status !== 'completed').length}</span>
              <span className="stat-trend-cusdash">
                {project ? `${getProjectProgress()}% complete` : 'No active projects'}
              </span>
            </div>
          </div>
          <div className="stat-card-cusdash">
            <div className="stat-content-cusdash">
              <span className="stat-label-cusdash">Quotes</span>
              <span className="stat-value-cusdash">{recentQuotes.length}</span>
              <span className="stat-trend-cusdash">Recent requests</span>
            </div>
          </div>
          <div className="stat-card-cusdash">
            <div className="stat-content-cusdash">
              <span className="stat-label-cusdash">Payments</span>
              <span className="stat-value-cusdash">{pendingPayments.length}</span>
              <span className="stat-trend-cusdash">Pending</span>
            </div>
          </div>
          <div className="stat-card-cusdash">
            <div className="stat-content-cusdash">
              <span className="stat-label-cusdash">Assessments</span>
              <span className="stat-value-cusdash">{upcomingAppointments.length}</span>
              <span className="stat-trend-cusdash">Upcoming</span>
            </div>
          </div>
        </div>

        {/* Row Layout: Active Project + Recent Activity */}
        <div className="row-layout-cusdash">
          {/* Active Project */}
          <div className="project-section-cusdash">
            <div className="section-header-cusdash">
              <h2 className="section-title-cusdash">Active Project</h2>
              {project && (
                <Link to="/app/customer/project" className="view-all-link-cusdash">
                  View Details
                  <FaChevronRight className="arrow-icon-cusdash" />
                </Link>
              )}
            </div>

            {project ? (
              <div className="project-card-enhanced-cusdash">
                <div className="project-header-cusdash">
                  <div className="project-info-cusdash">
                    <h3 className="project-name-cusdash">{project.projectName || project.projectReference}</h3>
                    <p className="project-system-cusdash">{project.systemSize} Solar System · {project.systemType}</p>
                  </div>
                  {getStatusBadge(project.status)}
                </div>

                <div className="project-content-layout-cusdash">
                  <ProgressRing progress={getProjectProgress()} />
                  <div className="project-details-cusdash">
                    <div className="project-metric-cusdash">
                      <span className="metric-label-cusdash">Total Cost</span>
                      <span className="metric-value-cusdash">{formatCurrency(project.totalCost)}</span>
                    </div>
                    <div className="project-metric-cusdash">
                      <span className="metric-label-cusdash">Amount Paid</span>
                      <span className="metric-value-cusdash">{formatCurrency(project.amountPaid)}</span>
                    </div>
                    <div className="project-actions-cusdash">
                      <Link to="/app/customer/project" className="action-link-cusdash">
                        Track Progress <FaArrowRight className="action-arrow-cusdash" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Project Milestones */}


                {/* Project Milestones */}
                <div className="milestones-section-cusdash">
                  <h4 className="milestones-title-cusdash">Project Milestones</h4>
                  <div className="milestones-list-cusdash">
                    {['pending', 'approved', 'in_progress', 'completed'].map((step, index) => {
                      const currentStatus = project.status;
                      const stepIndex = ['pending', 'approved', 'in_progress', 'completed'].indexOf(step);
                      const currentIndex = ['pending', 'approved', 'in_progress', 'completed'].indexOf(currentStatus);
                      const isCompleted = currentIndex > stepIndex || (currentStatus === 'completed' && step === 'completed');
                      const isActive = currentStatus === step;

                      return (
                        <div key={step} className={`milestone-item-cusdash ${isCompleted ? 'completed-cusdash' : ''} ${isActive ? 'active-cusdash' : ''}`}>
                          <div className="milestone-icon-cusdash">
                            {isCompleted ? <FaCheckCircle className="milestone-check-cusdash" /> : <FaCircle className="milestone-circle-cusdash" />}
                          </div>
                          <div className="milestone-info-cusdash">
                            <span className="milestone-label-cusdash">
                              {step === 'pending' ? 'Pending' :
                                step === 'approved' ? 'Approved' :
                                  step === 'in_progress' ? 'In Progress' : 'Completed'}
                            </span>
                            {isActive && <span className="milestone-status-cusdash">Current</span>}
                          </div>
                          {index < 3 && <div className={`milestone-line-cusdash ${isCompleted ? 'completed-line-cusdash' : ''}`} />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state-cusdash">
                <div className="empty-state-content-cusdash">
                  <h3 className="empty-state-title-cusdash">No active projects</h3>
                  <p className="empty-state-description-cusdash">Start your solar journey with a free assessment</p>
                  <Link to="book-assessment" className="btn-primary-cusdash">
                    Get Started
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="activities-section-cusdash">
            <div className="section-header-cusdash">
              <h2 className="section-title-cusdash">Recent Activity</h2>
              {allActivities.length > 0 && (
                <Link to="book-assessment" className="view-all-link-cusdash">
                  View All
                  <FaChevronRight className="arrow-icon-cusdash" />
                </Link>
              )}
            </div>

            <div className="activities-card-cusdash">
              <div className="activities-list-cusdash">
                {allActivities.length > 0 ? (
                  allActivities.map((activity, index) => (
                    <React.Fragment key={activity.id}>
                      <div className="activity-item-cusdash">
                        <div className="activity-icon-wrapper-cusdash" style={{ background: `${getActivityColor(activity.type)}15`, color: getActivityColor(activity.type) }}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="activity-content-cusdash">
                          <div className="activity-header-cusdash">
                            <span className="activity-title-cusdash">{activity.title}</span>
                            <span className="activity-reference-cusdash">{activity.reference}</span>
                          </div>
                          <span className="activity-date-cusdash">
                            {new Date(activity.date).toLocaleDateString('en-PH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="activity-status-cusdash">
                          {getStatusBadge(activity.status)}
                        </div>
                      </div>
                      {index < allActivities.length - 1 && <div className="activity-divider-cusdash"></div>}
                    </React.Fragment>
                  ))
                ) : (
                  <div className="empty-small-cusdash">
                    <p className="empty-text-cusdash">No recent activity</p>
                    <Link to="book-assessment" className="link-cusdash">
                      Request your first quote
                      <FaChevronRight className="arrow-icon-cusdash" />
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Appointments */}
            {upcomingAppointments.length > 0 && (
              <div className="appointments-section-cusdash">
                <h3 className="appointments-title-cusdash">
                  <FaClock className="appointments-icon-cusdash" />
                  Upcoming Appointments
                </h3>
                <div className="appointments-list-cusdash">
                  {upcomingAppointments.map(appointment => (
                    <div key={appointment._id} className="appointment-item-cusdash">
                      <div className="appointment-date-cusdash">
                        <span className="appointment-day-cusdash">
                          {new Date(appointment.preferredDate).toLocaleDateString('en-PH', { day: 'numeric' })}
                        </span>
                        <span className="appointment-month-cusdash">
                          {new Date(appointment.preferredDate).toLocaleDateString('en-PH', { month: 'short' })}
                        </span>
                      </div>
                      <div className="appointment-info-cusdash">
                        <span className="appointment-address-cusdash">
                          <FaMapMarkerAlt className="appointment-location-icon-cusdash" />
                          {appointment.address
                            ? [
                              appointment.address.houseOrBuilding,
                              appointment.address.street,
                              appointment.address.barangay,
                              appointment.address.cityMunicipality,
                              appointment.address.province,
                              appointment.address.zipCode,
                            ]
                              .filter(Boolean)
                              .join(', ')
                            : 'Location to be confirmed'}
                        </span>
                      </div>
                      <div className="appointment-status-cusdash">
                        {getStatusBadge('scheduled')}
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

export default Dashboard;