// pages/Customer/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FaFileInvoice, 
  FaClock, 
  FaCalendarAlt,
  FaChartLine,
  FaHome,
  FaUser,
  FaChevronDown,
  FaArrowRight
} from 'react-icons/fa';
import { useToast, ToastNotification } from '../../assets/toastnotification';
// Assuming CSS is imported, but we will use inline styles or a separate CSS module. For this refactor, we'll use className with -cusdash suffix.
// import '../../styles/Customer/dashboard.css';

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

      // Get quotes and sort by date (newest first) then take first 3
      const quotesRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/free-quotes/my-quotes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sortedQuotes = (quotesRes.data.quotes || [])
        .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))
        .slice(0, 3);
      setRecentQuotes(sortedQuotes);

      // Get pre-assessments and filter for pending payments
      const preAssessmentsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter pending payments and sort by date (newest first) then take first 3
      const pending = (preAssessmentsRes.data.assessments || [])
        .filter(a => a.paymentStatus === 'pending')
        .sort((a, b) => new Date(b.createdAt || b.preferredDate) - new Date(a.createdAt || a.preferredDate))
        .slice(0, 3);
      setPendingPayments(pending);

      // Filter upcoming appointments and sort by date (soonest first) then take first 3
      const upcoming = (preAssessmentsRes.data.assessments || [])
        .filter(a => new Date(a.preferredDate) > new Date())
        .sort((a, b) => new Date(a.preferredDate) - new Date(b.preferredDate))
        .slice(0, 3);
      setUpcomingAppointments(upcoming);

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
      'for_verification': <span className="status-badge-cusdash status-verification-cusdash">For Verification</span>,
      'processing': <span className="status-badge-cusdash status-processing-cusdash">Processing</span>,
      'quoted': <span className="status-badge-cusdash status-quoted-cusdash">Quoted</span>,
      'approved': <span className="status-badge-cusdash status-approved-cusdash">Approved</span>,
      'in_progress': <span className="status-badge-cusdash status-progress-cusdash">In Progress</span>,
      'completed': <span className="status-badge-cusdash status-completed-cusdash">Completed</span>
    };
    return badges[status] || <span className="status-badge-cusdash">{status}</span>;
  };

  // Skeleton Components
  const WelcomeSkeleton = () => (
    <div className="welcome-section-cusdash">
      <div className="welcome-content-cusdash">
        <div className="skeleton-line-cusdash large-cusdash"></div>
        <div className="skeleton-line-cusdash medium-cusdash"></div>
      </div>
      <div className="welcome-actions-cusdash">
        <div className="skeleton-button-cusdash"></div>
        <div className="skeleton-button-cusdash"></div>
      </div>
    </div>
  );

  const StatsSkeleton = () => (
    <div className="stats-grid-cusdash">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="stat-card-cusdash skeleton-card-cusdash">
          <div className="skeleton-line-cusdash small-cusdash"></div>
          <div className="skeleton-line-cusdash large-cusdash"></div>
          <div className="skeleton-line-cusdash tiny-cusdash"></div>
        </div>
      ))}
    </div>
  );

  const ProjectSkeleton = () => (
    <div className="project-card-cusdash skeleton-card-cusdash">
      <div className="project-header-cusdash">
        <div className="skeleton-line-cusdash medium-cusdash"></div>
        <div className="skeleton-badge-cusdash"></div>
      </div>
      <div className="project-progress-cusdash">
        <div className="skeleton-progress-cusdash"></div>
        <div className="skeleton-line-cusdash small-cusdash"></div>
      </div>
      <div className="project-actions-cusdash">
        <div className="skeleton-button-cusdash small-cusdash"></div>
      </div>
    </div>
  );

  const InfoCardSkeleton = () => (
    <div className="info-card-cusdash skeleton-card-cusdash">
      <div className="skeleton-line-cusdash medium-cusdash"></div>
      <div className="info-list-cusdash">
        {[1, 2, 3].map((item) => (
          <div key={item} className="info-item-cusdash">
            <div className="skeleton-line-cusdash small-cusdash"></div>
            <div className="skeleton-line-cusdash tiny-cusdash"></div>
            <div className="skeleton-badge-cusdash small-cusdash"></div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Dashboard | Salfer Engineering</title>
        </Helmet>
        <div className="dashboard-container-cusdash">
          <WelcomeSkeleton />
          <StatsSkeleton />
          
          <div className="dashboard-main-cusdash">
            <div className="section-header-cusdash">
              <div className="skeleton-line-cusdash medium-cusdash"></div>
            </div>
            <ProjectSkeleton />
          </div>
          
          <div className="info-grid-cusdash">
            <InfoCardSkeleton />
            <InfoCardSkeleton />
            <InfoCardSkeleton />
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
            <p className="welcome-greeting-cusdash">Welcome back, {getFullName() || 'Valued Customer'}!</p>
          </div>
          <div className="welcome-actions-cusdash">
            <Link to="book-assessment" className="btn-primary-cusdash">
              Book Assessment
            </Link>
            <Link to="book-assessment" className="btn-secondary-cusdash">
              Request Quote
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
                    {p.projectName || p.projectReference} - {p.status}
                  </option>
                ))}
              </select>
              <FaChevronDown className="select-icon-cusdash" />
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="stats-grid-cusdash">
          <div className="stat-card-cusdash">
            <div className="stat-icon-wrapper-cusdash">
              <FaHome className="stat-icon-cusdash" />
            </div>
            <div className="stat-content-cusdash">
              <span className="stat-label-cusdash">Active Projects</span>
              <span className="stat-value-cusdash">{project ? 1 : 0}</span>
              <span className="stat-trend-cusdash">
                {project ? `${getProjectProgress()}% Complete` : 'No active projects'}
              </span>
            </div>
          </div>
          <div className="stat-card-cusdash">
            <div className="stat-icon-wrapper-cusdash">
              <FaFileInvoice className="stat-icon-cusdash" />
            </div>
            <div className="stat-content-cusdash">
              <span className="stat-label-cusdash">Free Quotes</span>
              <span className="stat-value-cusdash">{recentQuotes.length}</span>
              <span className="stat-trend-cusdash">Recent requests</span>
            </div>
          </div>
          <div className="stat-card-cusdash">
            <div className="stat-icon-wrapper-cusdash">
              <FaClock className="stat-icon-cusdash" />
            </div>
            <div className="stat-content-cusdash">
              <span className="stat-label-cusdash">Pending Payments</span>
              <span className="stat-value-cusdash">{pendingPayments.length}</span>
              <span className="stat-trend-cusdash">Awaiting payment</span>
            </div>
          </div>
          <div className="stat-card-cusdash">
            <div className="stat-icon-wrapper-cusdash">
              <FaCalendarAlt className="stat-icon-cusdash" />
            </div>
            <div className="stat-content-cusdash">
              <span className="stat-label-cusdash">Upcoming Appointments</span>
              <span className="stat-value-cusdash">{upcomingAppointments.length}</span>
              <span className="stat-trend-cusdash">Scheduled assessments</span>
            </div>
          </div>
        </div>

        {/* Active Project Section */}
        <div className="dashboard-main-cusdash">
          <div className="section-header-cusdash">
            <h2 className="section-title-cusdash">Active Project</h2>
            {project && <Link to="/dashboard/myproject" className="view-all-link-cusdash">View Details <FaArrowRight className="arrow-icon-cusdash" /></Link>}
          </div>
          
          {project ? (
            <div className="project-card-cusdash">
              <div className="project-header-cusdash">
                <div className="project-info-cusdash">
                  <h3 className="project-name-cusdash">{project.projectName || project.projectReference}</h3>
                  <p className="project-system-cusdash">{project.systemSize} Solar System | {project.systemType}</p>
                </div>
                {getStatusBadge(project.status)}
              </div>
              
              <div className="project-progress-cusdash">
                <div className="progress-label-cusdash">
                  <span className="progress-text-cusdash">Overall Progress</span>
                  <span className="progress-percent-cusdash">{getProjectProgress()}%</span>
                </div>
                <div className="progress-bar-container-cusdash">
                  <div className="progress-bar-fill-cusdash" style={{ width: `${getProjectProgress()}%` }}></div>
                </div>
              </div>
              
              <div className="project-actions-cusdash">
                <Link to="/dashboard/myproject" className="action-link-cusdash">
                  Track Progress
                </Link>
              </div>
            </div>
          ) : (
            <div className="empty-state-cusdash">
              <div className="empty-state-content-cusdash">
                <h3 className="empty-state-title-cusdash">No active projects</h3>
                <p className="empty-state-description-cusdash">Start your solar journey today</p>
                <Link to="book-assessment" className="btn-primary-cusdash small-cusdash">
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Info Grid */}
        <div className="info-grid-cusdash">
          {/* Recent Quotes */}
          <div className="info-card-cusdash">
            <div className="info-card-header-cusdash">
              <h3 className="info-card-title-cusdash">Recent Quotes</h3>
              {recentQuotes.length > 0 && (
                <Link to="book-assessment" className="view-all-link-cusdash">View All</Link>
              )}
            </div>
            
            <div className="info-list-cusdash">
              {recentQuotes.length > 0 ? (
                recentQuotes.map(quote => (
                  <div key={quote._id} className="info-item-cusdash">
                    <div className="info-item-content-cusdash">
                      <span className="info-item-title-cusdash">{quote.quotationReference}</span>
                      <span className="info-item-date-cusdash">
                        {new Date(quote.requestedAt).toLocaleDateString('en-PH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="info-item-status-cusdash">
                      {getStatusBadge(quote.status)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-small-cusdash">
                  <p className="empty-text-cusdash">No quotes yet</p>
                  <Link to="book-assessment" className="link-cusdash">Request a quote</Link>
                </div>
              )}
            </div>
          </div>

          {/* Pending Payments */}
          <div className="info-card-cusdash">
            <div className="info-card-header-cusdash">
              <h3 className="info-card-title-cusdash">Pending Payments</h3>
              {pendingPayments.length > 0 && (
                <Link to="billing" className="view-all-link-cusdash">View All</Link>
              )}
            </div>
            
            <div className="info-list-cusdash">
              {pendingPayments.length > 0 ? (
                pendingPayments.map(payment => (
                  <div key={payment._id || payment.id} className="info-item-cusdash">
                    <div className="info-item-content-cusdash">
                      <span className="info-item-title-cusdash">{payment.invoiceNumber || payment._id}</span>
                      <span className="info-item-amount-cusdash">{formatCurrency(payment.assessmentFee)}</span>
                    </div>
                    <div className="info-item-actions-cusdash">
                      <Link to="billing" className="pay-link-cusdash">
                        Pay Now
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-small-cusdash">
                  <p className="empty-text-cusdash">No pending payments</p>
                  <span className="text-muted-cusdash">All caught up!</span>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="info-card-cusdash">
            <div className="info-card-header-cusdash">
              <h3 className="info-card-title-cusdash">Upcoming Appointments</h3>
              {upcomingAppointments.length > 0 && (
                <Link to="book-assessment" className="view-all-link-cusdash">View All</Link>
              )}
            </div>
            
            <div className="info-list-cusdash">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map(appointment => (
                  <div key={appointment._id || appointment.id} className="info-item-cusdash">
                    <div className="info-item-content-cusdash">
                      <span className="info-item-title-cusdash">Pre-Assessment</span>
                      <span className="info-item-date-cusdash">
                        {new Date(appointment.preferredDate).toLocaleDateString('en-PH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="info-item-status-cusdash">
                      <span className={`appointment-status-cusdash ${appointment.paymentStatus === 'paid' ? 'confirmed-cusdash' : 'pending-cusdash'}`}>
                        {appointment.paymentStatus === 'paid' ? 'Confirmed' : 'Pending Payment'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-small-cusdash">
                  <p className="empty-text-cusdash">No upcoming appointments</p>
                  <Link to="book-assessment" className="link-cusdash">Book an assessment</Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Toast Notification */}
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