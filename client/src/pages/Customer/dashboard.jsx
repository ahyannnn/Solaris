// pages/Customer/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../../styles/Customer/dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [recentQuotes, setRecentQuotes] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);

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

      // Fetch user data
      const userRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/clients/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(userRes.data.client);

      // Fetch active project
      const projectsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects/my-projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const activeProject = projectsRes.data.projects?.find(p => p.status !== 'completed');
      setProject(activeProject || null);

      // Fetch recent free quotes
      const quotesRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/free-quotes/my-quotes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecentQuotes(quotesRes.data.quotes?.slice(0, 3) || []);

      // Fetch pending payments
      const preAssessmentsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const pending = preAssessmentsRes.data.assessments?.filter(a => a.paymentStatus === 'pending') || [];
      setPendingPayments(pending);

      // Fetch upcoming appointments
      const appointmentsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const upcoming = appointmentsRes.data.assessments?.filter(a => new Date(a.preferredDate) > new Date()) || [];
      setUpcomingAppointments(upcoming.slice(0, 3));

      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setLoading(false);
    }
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
      'pending': <span className="status-badge-dash pending-dash">Pending</span>,
      'paid': <span className="status-badge-dash paid-dash">Paid</span>,
      'for_verification': <span className="status-badge-dash for-verification-dash">For Verification</span>,
      'processing': <span className="status-badge-dash processing-dash">Processing</span>,
      'quoted': <span className="status-badge-dash quoted-dash">Quoted</span>,
      'approved': <span className="status-badge-dash approved-dash">Approved</span>,
      'in_progress': <span className="status-badge-dash in-progress-dash">In Progress</span>,
      'completed': <span className="status-badge-dash completed-dash">Completed</span>
    };
    return badges[status] || <span className="status-badge-dash">{status}</span>;
  };

  // Skeleton Components
  const WelcomeSkeleton = () => (
    <div className="welcome-section-dash">
      <div className="welcome-content-dash">
        <div className="skeleton-line-dash large-dash"></div>
        <div className="skeleton-line-dash medium-dash"></div>
      </div>
      <div className="welcome-actions-dash">
        <div className="skeleton-button-dash"></div>
        <div className="skeleton-button-dash"></div>
      </div>
    </div>
  );

  const StatsSkeleton = () => (
    <div className="stats-grid-dash">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="stat-card-dash skeleton-card-dash">
          <div className="skeleton-line-dash small-dash"></div>
          <div className="skeleton-line-dash large-dash"></div>
          <div className="skeleton-line-dash tiny-dash"></div>
        </div>
      ))}
    </div>
  );

  const ProjectSkeleton = () => (
    <div className="project-card-dash skeleton-card-dash">
      <div className="project-header-dash">
        <div className="skeleton-line-dash medium-dash"></div>
        <div className="skeleton-badge-dash"></div>
      </div>
      <div className="project-progress-dash">
        <div className="skeleton-progress-dash"></div>
        <div className="skeleton-line-dash small-dash"></div>
      </div>
      <div className="project-actions-dash">
        <div className="skeleton-button-dash small-dash"></div>
      </div>
    </div>
  );

  const QuickActionsSkeleton = () => (
    <div className="quick-actions-dash">
      {[1, 2, 3].map((item) => (
        <div key={item} className="skeleton-button-dash large-dash"></div>
      ))}
    </div>
  );

  const QuotesSkeleton = () => (
    <div className="info-card-dash skeleton-card-dash">
      <div className="skeleton-line-dash medium-dash"></div>
      <div className="info-list-dash">
        {[1, 2, 3].map((item) => (
          <div key={item} className="info-item-dash">
            <div className="skeleton-line-dash small-dash"></div>
            <div className="skeleton-line-dash tiny-dash"></div>
            <div className="skeleton-badge-dash small-dash"></div>
          </div>
        ))}
      </div>
      <div className="skeleton-line-dash tiny-dash"></div>
    </div>
  );

  const PaymentsSkeleton = () => (
    <div className="info-card-dash skeleton-card-dash">
      <div className="skeleton-line-dash medium-dash"></div>
      <div className="info-list-dash">
        {[1, 2].map((item) => (
          <div key={item} className="info-item-dash">
            <div className="skeleton-line-dash small-dash"></div>
            <div className="skeleton-line-dash tiny-dash"></div>
            <div className="skeleton-badge-dash small-dash"></div>
          </div>
        ))}
      </div>
      <div className="skeleton-line-dash tiny-dash"></div>
    </div>
  );

  const AppointmentsSkeleton = () => (
    <div className="info-card-dash skeleton-card-dash">
      <div className="skeleton-line-dash medium-dash"></div>
      <div className="info-list-dash">
        {[1, 2].map((item) => (
          <div key={item} className="info-item-dash">
            <div className="skeleton-line-dash small-dash"></div>
            <div className="skeleton-line-dash tiny-dash"></div>
          </div>
        ))}
      </div>
      <div className="skeleton-line-dash tiny-dash"></div>
    </div>
  );

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Dashboard | Salfer Engineering</title>
        </Helmet>
        <div className="dashboard-container-dash">
          <WelcomeSkeleton />
          <StatsSkeleton />
          
          <div className="dashboard-main-dash">
            <div className="section-header-dash">
              <div className="skeleton-line-dash medium-dash"></div>
            </div>
            <ProjectSkeleton />
            
            <div className="section-header-dash">
              <div className="skeleton-line-dash medium-dash"></div>
            </div>
            <QuickActionsSkeleton />
          </div>
          
          <div className="info-grid-dash">
            <QuotesSkeleton />
            <PaymentsSkeleton />
            <AppointmentsSkeleton />
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

      <div className="dashboard-container-dash">
        {/* Welcome Section */}
        <div className="welcome-section-dash">
          <div className="welcome-content-dash">
            <h1>Welcome back, {getFullName() || 'Valued Customer'}!</h1>
            <p>Track your solar journey and manage your projects</p>
          </div>
          <div className="welcome-actions-dash">
            <Link to="/dashboard/schedule" className="btn-primary-dash">
              Book Assessment
            </Link>
            <Link to="/dashboard/quotation" className="btn-secondary-dash">
              Request Quote
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid-dash">
          <div className="stat-card-dash">
            <span className="stat-label-dash">Active Projects</span>
            <span className="stat-value-dash">{project ? 1 : 0}</span>
            <span className="stat-trend-dash">
              {project ? `${getProjectProgress()}% Complete` : 'No active projects'}
            </span>
          </div>
          <div className="stat-card-dash">
            <span className="stat-label-dash">Free Quotes</span>
            <span className="stat-value-dash">{recentQuotes.length}</span>
            <span className="stat-trend-dash">Requests submitted</span>
          </div>
          <div className="stat-card-dash">
            <span className="stat-label-dash">Pending Payments</span>
            <span className="stat-value-dash">{pendingPayments.length}</span>
            <span className="stat-trend-dash">Awaiting payment</span>
          </div>
          <div className="stat-card-dash">
            <span className="stat-label-dash">Upcoming Appointments</span>
            <span className="stat-value-dash">{upcomingAppointments.length}</span>
            <span className="stat-trend-dash">Scheduled assessments</span>
          </div>
        </div>

        {/* Active Project Section */}
        <div className="dashboard-main-dash">
          <div className="section-header-dash">
            <h2>Active Project</h2>
            {project && <Link to="/dashboard/myproject" className="view-all-dash">View Details</Link>}
          </div>
          
          {project ? (
            <div className="project-card-dash">
              <div className="project-header-dash">
                <div>
                  <h3>{project.projectName || project.projectReference}</h3>
                  <p className="project-system-dash">{project.systemSize} Solar System | {project.systemType}</p>
                </div>
                {getStatusBadge(project.status)}
              </div>
              
              <div className="project-progress-dash">
                <div className="progress-label-dash">
                  <span>Overall Progress</span>
                  <span>{getProjectProgress()}%</span>
                </div>
                <div className="progress-bar-dash">
                  <div className="progress-fill-dash" style={{ width: `${getProjectProgress()}%` }}></div>
                </div>
              </div>
              
              <div className="project-actions-dash">
                <Link to="/dashboard/myproject" className="action-link-dash">
                  Track Progress
                </Link>
              </div>
            </div>
          ) : (
            <div className="empty-state-dash">
              <h3>No active projects</h3>
              <p>Start your solar journey today</p>
              <Link to="/dashboard/schedule" className="btn-primary-dash small-dash">
                Get Started
              </Link>
            </div>
          )}

          {/* Quick Actions */}
          <div className="section-header-dash">
            <h2>Quick Actions</h2>
          </div>
          <div className="quick-actions-dash">
            <Link to="/dashboard/schedule" className="action-card-dash">
              <span>Book Assessment</span>
              <span className="action-desc-dash">Schedule pre-assessment</span>
            </Link>
            <Link to="/dashboard/quotation" className="action-card-dash">
              <span>Request Quote</span>
              <span className="action-desc-dash">Get free quotation</span>
            </Link>
            <Link to="/dashboard/customersettings?tab=addresses" className="action-card-dash">
              <span>Manage Addresses</span>
              <span className="action-desc-dash">Update your location</span>
            </Link>
          </div>
        </div>

        {/* Recent Quotes, Pending Payments, Upcoming Appointments - All in One Row */}
        <div className="info-grid-dash">
          {/* Recent Quotes */}
          <div className="info-card-dash">
            <div className="info-card-header-dash">
              <h3>Recent Quotes</h3>
              <Link to="/dashboard/quotation?tab=free-quotes" className="view-all-dash">View All</Link>
            </div>
            
            <div className="info-list-dash">
              {recentQuotes.length > 0 ? (
                recentQuotes.map(quote => (
                  <div key={quote._id} className="info-item-dash">
                    <div className="info-item-content-dash">
                      <span className="info-item-title-dash">{quote.quotationReference}</span>
                      <span className="info-item-date-dash">{new Date(quote.requestedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="info-item-action-dash">
                      {getStatusBadge(quote.status)}
                      <Link to={`/dashboard/quotation?tab=free-quotes&id=${quote._id}`} className="view-link-dash">
                        View
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-small-dash">
                  <p>No quotes yet</p>
                  <Link to="/dashboard/schedule" className="link-dash">Request a quote</Link>
                </div>
              )}
            </div>
          </div>

          {/* Pending Payments */}
          <div className="info-card-dash">
            <div className="info-card-header-dash">
              <h3>Pending Payments</h3>
              <Link to="/dashboard/quotation?tab=pre-assessments" className="view-all-dash">View All</Link>
            </div>
            
            <div className="info-list-dash">
              {pendingPayments.length > 0 ? (
                pendingPayments.map(payment => (
                  <div key={payment.id} className="info-item-dash">
                    <div className="info-item-content-dash">
                      <span className="info-item-title-dash">{payment.invoiceNumber}</span>
                      <span className="info-item-amount-dash">{formatCurrency(payment.assessmentFee)}</span>
                    </div>
                    <div className="info-item-action-dash">
                      {getStatusBadge(payment.paymentStatus)}
                      <Link to={`/dashboard/quotation?tab=pre-assessments`} className="pay-link-dash">
                        Pay Now
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-small-dash">
                  <p>No pending payments</p>
                  <span className="text-muted-dash">All caught up!</span>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="info-card-dash">
            <div className="info-card-header-dash">
              <h3>Upcoming Appointments</h3>
              <Link to="/dashboard/quotation?tab=pre-assessments" className="view-all-dash">View All</Link>
            </div>
            
            <div className="info-list-dash">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map(appointment => (
                  <div key={appointment.id} className="info-item-dash">
                    <div className="info-item-content-dash">
                      <span className="info-item-title-dash">Pre-Assessment</span>
                      <span className="info-item-date-dash">{new Date(appointment.preferredDate).toLocaleDateString()}</span>
                    </div>
                    <div className="info-item-status-dash">
                      <span className={`appointment-status-dash ${appointment.paymentStatus === 'paid' ? 'confirmed-dash' : 'pending-dash'}`}>
                        {appointment.paymentStatus === 'paid' ? 'Confirmed' : 'Pending Payment'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-small-dash">
                  <p>No upcoming appointments</p>
                  <Link to="/dashboard/schedule" className="link-dash">Book an assessment</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;