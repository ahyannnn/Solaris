// pages/Customer/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
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
      'completed': <span className="status-badge-cusdash status-completed-cusdash">Completed</span>
    };
    return badges[status] || <span className="status-badge-cusdash">{status}</span>;
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

  const WelcomeSkeleton = () => (
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
  );

  const StatsSkeleton = () => (
    <div className="stats-grid-cusdash">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="stat-card-cusdash skeleton-card-cusdash">
          <div className="skeleton-line-cusdash skeleton-label-cusdash"></div>
          <div className="skeleton-line-cusdash skeleton-value-cusdash"></div>
          <div className="skeleton-line-cusdash skeleton-trend-cusdash"></div>
        </div>
      ))}
    </div>
  );

  const ProjectSkeleton = () => (
    <div className="project-card-enhanced-cusdash skeleton-card-cusdash">
      <div className="project-header-cusdash">
        <div className="project-info-cusdash">
          <div className="skeleton-line-cusdash skeleton-project-name-cusdash"></div>
          <div className="skeleton-line-cusdash skeleton-project-system-cusdash"></div>
        </div>
        <div className="skeleton-badge-cusdash"></div>
      </div>
      <div className="project-content-layout-cusdash">
        <div className="skeleton-progress-ring-cusdash"></div>
        <div className="project-details-cusdash">
          <div className="project-metric-cusdash">
            <div className="skeleton-line-cusdash skeleton-metric-label-cusdash"></div>
            <div className="skeleton-line-cusdash skeleton-metric-value-cusdash"></div>
          </div>
          <div className="project-metric-cusdash">
            <div className="skeleton-line-cusdash skeleton-metric-label-cusdash"></div>
            <div className="skeleton-line-cusdash skeleton-metric-value-cusdash"></div>
          </div>
          <div className="skeleton-button-cusdash skeleton-action-cusdash"></div>
        </div>
      </div>
    </div>
  );

  const ActivitySkeleton = () => (
    <div className="activities-card-cusdash skeleton-card-cusdash">
      <div className="activities-list-cusdash">
        {[1, 2, 3].map((item) => (
          <div key={item} className="activity-item-cusdash">
            <div className="activity-content-cusdash">
              <div className="skeleton-line-cusdash skeleton-activity-title-cusdash"></div>
              <div className="skeleton-line-cusdash skeleton-activity-ref-cusdash"></div>
              <div className="skeleton-line-cusdash skeleton-activity-date-cusdash"></div>
            </div>
            <div className="skeleton-badge-cusdash skeleton-status-cusdash"></div>
          </div>
        ))}
      </div>
    </div>
  );

  const InfoCardSkeleton = () => (
    <div className="info-card-cusdash skeleton-card-cusdash">
      <div className="info-card-content-cusdash">
        <div className="skeleton-line-cusdash skeleton-card-value-cusdash"></div>
        <div className="skeleton-line-cusdash skeleton-card-label-cusdash"></div>
        <div className="skeleton-line-cusdash skeleton-card-link-cusdash"></div>
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
              <div className="skeleton-line-cusdash skeleton-section-title-cusdash"></div>
            </div>
            <div className="row-layout-cusdash">
              <div className="project-section-cusdash">
                <ProjectSkeleton />
              </div>
              <div className="activities-section-cusdash">
                <div className="section-header-cusdash">
                  <div className="skeleton-line-cusdash skeleton-section-title-cusdash"></div>
                </div>
                <ActivitySkeleton />
              </div>
            </div>
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
        {/* Welcome Section - Premium SaaS Hero */}
        <div className="welcome-section-cusdash">
          <div className="welcome-content-cusdash">
            <h1 className="page-title-cusdash">Dashboard</h1>
            <p className="welcome-greeting-cusdash">Welcome back, {getFullName() || 'Valued Customer'}</p>
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

        {/* Project Selector - Clean Select */}
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
                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        )}

        {/* Stats Cards - NO ICONS */}
        <div className="stats-grid-cusdash">
          <div className="stat-card-cusdash">
            <div className="stat-content-cusdash">
              <span className="stat-label-cusdash">Active Projects</span>
              <span className="stat-value-cusdash">{project ? 1 : 0}</span>
              <span className="stat-trend-cusdash">
                {project ? `${getProjectProgress()}% complete` : 'No active projects'}
              </span>
            </div>
          </div>
          <div className="stat-card-cusdash">
            <div className="stat-content-cusdash">
              <span className="stat-label-cusdash">Free Quotes</span>
              <span className="stat-value-cusdash">{recentQuotes.length}</span>
              <span className="stat-trend-cusdash">Recent requests</span>
            </div>
          </div>
          <div className="stat-card-cusdash">
            <div className="stat-content-cusdash">
              <span className="stat-label-cusdash">Pending Payments</span>
              <span className="stat-value-cusdash">{pendingPayments.length}</span>
              <span className="stat-trend-cusdash">Awaiting payment</span>
            </div>
          </div>
          <div className="stat-card-cusdash">
            <div className="stat-content-cusdash">
              <span className="stat-label-cusdash">Appointments</span>
              <span className="stat-value-cusdash">{upcomingAppointments.length}</span>
              <span className="stat-trend-cusdash">Upcoming</span>
            </div>
          </div>
        </div>

        {/* Row Layout: Active Project + Recent Activity */}
        <div className="row-layout-cusdash">
          {/* Left: Active Project Card */}
          <div className="project-section-cusdash">
            <div className="section-header-cusdash">
              <h2 className="section-title-cusdash">Active Project</h2>
              {project && (
                <Link to="/dashboard/myproject" className="view-all-link-cusdash">
                  View Details
                  <svg className="arrow-icon-cusdash" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 7H13M13 7L7 1M13 7L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
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
                      <Link to="/dashboard/myproject" className="action-link-cusdash">
                        Track Progress
                        <svg className="action-arrow-cusdash" width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M1 7H13M13 7L7 1M13 7L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Link>
                    </div>
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

          {/* Right: Recent Activity - Timeline Style */}
          <div className="activities-section-cusdash">
            <div className="section-header-cusdash">
              <h2 className="section-title-cusdash">Recent Activity</h2>
              {recentQuotes.length > 0 && (
                <Link to="book-assessment" className="view-all-link-cusdash">
                  View All
                  <svg className="arrow-icon-cusdash" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 7H13M13 7L7 1M13 7L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              )}
            </div>
            
            <div className="activities-card-cusdash">
              <div className="activities-list-cusdash">
                {recentQuotes.length > 0 ? (
                  recentQuotes.map((quote, index) => (
                    <React.Fragment key={quote._id}>
                      <div className="activity-item-cusdash">
                        <div className="activity-marker-cusdash"></div>
                        <div className="activity-content-cusdash">
                          <div className="activity-header-cusdash">
                            <span className="activity-title-cusdash">Quote Request</span>
                            <span className="activity-reference-cusdash">{quote.quotationReference}</span>
                          </div>
                          <span className="activity-date-cusdash">
                            {new Date(quote.requestedAt).toLocaleDateString('en-PH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="activity-status-cusdash">
                          {getStatusBadge(quote.status)}
                        </div>
                      </div>
                      {index < recentQuotes.length - 1 && <div className="activity-divider-cusdash"></div>}
                    </React.Fragment>
                  ))
                ) : (
                  <div className="empty-small-cusdash">
                    <p className="empty-text-cusdash">No recent activity</p>
                    <Link to="book-assessment" className="link-cusdash">
                      Request your first quote
                      <svg className="arrow-icon-cusdash" width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M1 7H13M13 7L7 1M13 7L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Info Cards - NO ICONS */}
        <div className="info-grid-cusdash">
          <div className="info-card-cusdash">
            <div className="info-card-content-cusdash">
              <span className="card-value-large-cusdash">{projectsList.filter(p => p.status !== 'completed').length}</span>
              <span className="card-label-cusdash">Active Projects</span>
              <p className="card-description-cusdash">Track your solar installation progress</p>
              <Link to="/dashboard/myproject" className="card-link-cusdash">
                View Projects
                <svg className="arrow-icon-cusdash" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 7H13M13 7L7 1M13 7L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          </div>

          <div className="info-card-cusdash">
            <div className="info-card-content-cusdash">
              <span className="card-value-large-cusdash">{pendingPayments.length}</span>
              <span className="card-label-cusdash">Pending Payments</span>
              <p className="card-description-cusdash">Complete your payments to continue</p>
              <Link to="billing" className="card-link-cusdash">
                Make Payment
                <svg className="arrow-icon-cusdash" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 7H13M13 7L7 1M13 7L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          </div>

          <div className="info-card-cusdash">
            <div className="info-card-content-cusdash">
              <span className="card-value-large-cusdash">{upcomingAppointments.length}</span>
              <span className="card-label-cusdash">Upcoming</span>
              <p className="card-description-cusdash">Scheduled site assessments</p>
              <Link to="book-assessment" className="card-link-cusdash">
                Schedule Now
                <svg className="arrow-icon-cusdash" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M1 7H13M13 7L7 1M13 7L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
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