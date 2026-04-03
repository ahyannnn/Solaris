// src/pages/Admin/AdminDashboard.cuspro.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaFileInvoiceDollar, 
  FaClipboardList, 
  FaUsers, 
  FaMicrochip,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaSpinner,
  FaDownload,
  FaPlus,
  FaChartBar,
  FaEye,
  FaEnvelope,
  FaFileAlt,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaUserCheck,
  FaArrowRight
} from 'react-icons/fa';
import '../../styles/Admin/dashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    freeQuotes: { total: 0, pending: 0, completed: 0 },
    preAssessments: { total: 0, pending: 0, completed: 0, scheduled: 0 },
    revenue: { total: 0, thisMonth: 0 },
    users: { total: 0, newThisMonth: 0 },
    devices: { total: 0, active: 0, deployed: 0 },
    completionRate: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');

      const [
        freeQuotesRes,
        preAssessmentsRes,
        usersRes,
        devicesRes,
        revenueRes
      ] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/free-quotes`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { quotes: [] } })),
        axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { assessments: [] } })),
        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { total: 0, newThisMonth: 0 } })),
        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/devices`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { total: 0, active: 0, deployed: 0 } })),
        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/revenue`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { total: 0, thisMonth: 0 } }))
      ]);

      const freeQuotes = freeQuotesRes.data.quotes || [];
      const pendingQuotes = freeQuotes.filter(q => q.status === 'pending');
      const completedQuotes = freeQuotes.filter(q => q.status === 'completed');

      const assessments = preAssessmentsRes.data.assessments || [];
      const pendingAssessments = assessments.filter(a => a.paymentStatus === 'pending');
      const completedAssessments = assessments.filter(a => a.assessmentStatus === 'completed');
      const scheduledAssessments = assessments.filter(a => a.assessmentStatus === 'scheduled');

      const completionRate = assessments.length > 0 
        ? (completedAssessments.length / assessments.length * 100).toFixed(1)
        : 0;

      setStats({
        freeQuotes: {
          total: freeQuotes.length,
          pending: pendingQuotes.length,
          completed: completedQuotes.length
        },
        preAssessments: {
          total: assessments.length,
          pending: pendingAssessments.length,
          completed: completedAssessments.length,
          scheduled: scheduledAssessments.length
        },
        revenue: revenueRes.data,
        users: usersRes.data,
        devices: devicesRes.data,
        completionRate
      });

      const activities = generateRecentActivities(freeQuotes, assessments);
      setRecentActivities(activities);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const generateRecentActivities = (freeQuotes, assessments) => {
    const activities = [];

    freeQuotes.slice(0, 5).forEach(quote => {
      activities.push({
        id: `quote-${quote._id}`,
        type: 'free-quote',
        message: `New free quote request from ${quote.clientId?.contactFirstName || 'Client'}`,
        time: new Date(quote.requestedAt).toLocaleString(),
        status: quote.status,
        icon: <FaFileAlt />,
        action: `/dashboard/free-quotes/${quote._id}`
      });
    });

    assessments.slice(0, 5).forEach(assessment => {
      let message = '';
      let icon = null;
      
      if (assessment.paymentStatus === 'for_verification') {
        message = `Payment verification needed for ${assessment.bookingReference}`;
        icon = <FaMoneyBillWave />;
      } else if (assessment.assessmentStatus === 'scheduled') {
        message = `Assessment scheduled: ${assessment.bookingReference}`;
        icon = <FaCalendarAlt />;
      } else if (assessment.assessmentStatus === 'completed') {
        message = `Assessment completed: ${assessment.bookingReference}`;
        icon = <FaCheckCircle />;
      } else {
        message = `New pre-assessment booking: ${assessment.bookingReference}`;
        icon = <FaClipboardList />;
      }
      
      activities.push({
        id: `assessment-${assessment._id}`,
        type: 'pre-assessment',
        message,
        time: new Date(assessment.bookedAt).toLocaleString(),
        status: assessment.assessmentStatus,
        icon,
        action: `/dashboard/pre-assessments/${assessment._id}`
      });
    });

    return activities.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Stats Cards Component
  const StatsCards = () => {
    const cards = [
      {
        title: 'Free Quotes',
        value: stats.freeQuotes.total,
        icon: <FaFileInvoiceDollar />,
        details: [
          { label: 'Pending', value: stats.freeQuotes.pending },
          { label: 'Completed', value: stats.freeQuotes.completed }
        ]
      },
      {
        title: 'Pre Assessments',
        value: stats.preAssessments.total,
        icon: <FaClipboardList />,
        details: [
          { label: 'Pending', value: stats.preAssessments.pending },
          { label: 'Scheduled', value: stats.preAssessments.scheduled },
          { label: 'Completed', value: stats.preAssessments.completed }
        ]
      },
      {
        title: 'Revenue',
        value: formatCurrency(stats.revenue.total || 0),
        icon: <FaChartLine />,
        details: [
          { label: 'This Month', value: formatCurrency(stats.revenue.thisMonth || 0) }
        ]
      },
      {
        title: 'Users',
        value: stats.users.total || 0,
        icon: <FaUsers />,
        details: [
          { label: 'New This Month', value: stats.users.newThisMonth || 0 }
        ]
      },
      {
        title: 'IoT Devices',
        value: stats.devices.total || 0,
        icon: <FaMicrochip />,
        details: [
          { label: 'Active', value: stats.devices.active || 0 },
          { label: 'Deployed', value: stats.devices.deployed || 0 }
        ]
      },
      {
        title: 'Completion Rate',
        value: `${stats.completionRate}%`,
        icon: <FaCheckCircle />,
        details: [
          { label: 'Target', value: '85%' }
        ]
      }
    ];

    return (
      <div className="cuspro-stats-grid">
        {cards.map((card, index) => (
          <div key={index} className="cuspro-stat-card">
            <div className="cuspro-stat-header">
              <div className="cuspro-stat-icon">{card.icon}</div>
              <div className="cuspro-stat-value">{card.value}</div>
            </div>
            <div className="cuspro-stat-title">{card.title}</div>
            <div className="cuspro-stat-details">
              {card.details.map((detail, idx) => (
                <div key={idx} className="cuspro-stat-detail">
                  <span>{detail.label}</span>
                  <strong>{detail.value}</strong>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Charts Component
  const Charts = () => {
    const monthlyData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      assessments: [5, 8, 12, 15, 20, 25, 30, 35, 40, 45, 50, 55],
      revenue: [5000, 8000, 12000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000, 55000]
    };

    const maxAssessments = Math.max(...monthlyData.assessments);
    const maxRevenue = Math.max(...monthlyData.revenue);

    const handleExport = () => {
      console.log('Export data');
    };

    return (
      <div className="cuspro-charts-row">
        <div className="cuspro-chart-card">
          <div className="cuspro-chart-header">
            <h3>
              <FaChartLine /> Assessment Trends
            </h3>
            <button className="cuspro-export-btn" onClick={handleExport}>
              <FaDownload /> Export
            </button>
          </div>
          <div className="cuspro-chart-body">
            <div className="cuspro-bar-chart">
              {monthlyData.assessments.map((value, index) => (
                <div key={index} className="cuspro-bar-item">
                  <div 
                    className="cuspro-bar" 
                    style={{ height: `${(value / maxAssessments) * 120}px` }}
                  >
                    <span className="cuspro-bar-value">{value}</span>
                  </div>
                  <span className="cuspro-bar-label">{monthlyData.labels[index]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="cuspro-chart-card">
          <div className="cuspro-chart-header">
            <h3>
              <FaChartBar /> Revenue Overview
            </h3>
          </div>
          <div className="cuspro-chart-body">
            <div className="cuspro-bar-chart">
              {monthlyData.revenue.map((value, index) => (
                <div key={index} className="cuspro-bar-item">
                  <div 
                    className="cuspro-bar cuspro-revenue-bar" 
                    style={{ height: `${(value / maxRevenue) * 120}px` }}
                  >
                    <span className="cuspro-bar-value">{formatCurrency(value)}</span>
                  </div>
                  <span className="cuspro-bar-label">{monthlyData.labels[index]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Quick Actions Component
  const QuickActions = () => {
    const actions = [
      { label: 'New Free Quote', icon: <FaPlus />, path: '/dashboard/free-quotes/new' },
      { label: 'Create Invoice', icon: <FaFileInvoiceDollar />, path: '/dashboard/billing/new' },
      { label: 'Add User', icon: <FaUsers />, path: '/dashboard/usermanagement/new' },
      { label: 'Register Device', icon: <FaMicrochip />, path: '/dashboard/iotdevice/new' },
      { label: 'View Reports', icon: <FaChartLine />, path: '/dashboard/reports' },
      { label: 'Send Announcement', icon: <FaEnvelope />, path: '/dashboard/announcements' },
    ];

    return (
      <div className="cuspro-quick-actions">
        <h3>Quick Actions</h3>
        <div className="cuspro-actions-grid">
          {actions.map((action, index) => (
            <button
              key={index}
              className="cuspro-action-btn"
              onClick={() => navigate(action.path)}
            >
              <span className="cuspro-action-icon">{action.icon}</span>
              <span className="cuspro-action-label">{action.label}</span>
              <FaArrowRight className="cuspro-action-arrow" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Recent Activity Component
  const RecentActivity = () => {
    const getStatusClass = (status) => {
      switch(status) {
        case 'completed': return 'completed';
        case 'pending': return 'pending';
        case 'for_verification': return 'for-verification';
        case 'scheduled': return 'scheduled';
        default: return '';
      }
    };

    const getStatusText = (status) => {
      switch(status) {
        case 'completed': return 'Completed';
        case 'pending': return 'Pending';
        case 'for_verification': return 'For Verification';
        case 'scheduled': return 'Scheduled';
        default: return status;
      }
    };

    return (
      <div className="cuspro-recent-activity">
        <div className="cuspro-activity-header">
          <h3>Recent Activity</h3>
          <button className="cuspro-view-all" onClick={() => navigate('/dashboard/activities')}>
            View All
          </button>
        </div>
        
        <div className="cuspro-activity-list">
          {recentActivities.length === 0 ? (
            <div className="cuspro-empty-activity">
              <p>No recent activities</p>
            </div>
          ) : (
            recentActivities.map((activity) => (
              <div 
                key={activity.id} 
                className="cuspro-activity-item"
                onClick={() => activity.action && navigate(activity.action)}
              >
                <div className="cuspro-activity-icon">{activity.icon}</div>
                <div className="cuspro-activity-content">
                  <p className="cuspro-activity-message">{activity.message}</p>
                  <span className="cuspro-activity-time">{activity.time}</span>
                </div>
                <div className={`cuspro-activity-status ${getStatusClass(activity.status)}`}>
                  {getStatusText(activity.status)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // Skeleton Loader
  const SkeletonLoader = () => (
    <div className="cuspro-admin-dashboard">
      <div className="cuspro-dashboard-header">
        <div className="cuspro-skeleton-title"></div>
        <div className="cuspro-skeleton-subtitle"></div>
      </div>
      <div className="cuspro-stats-grid">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="cuspro-stat-card cuspro-skeleton-card">
            <div className="cuspro-skeleton-line"></div>
            <div className="cuspro-skeleton-line cuspro-skeleton-large"></div>
            <div className="cuspro-skeleton-line cuspro-skeleton-small"></div>
          </div>
        ))}
      </div>
      <div className="cuspro-charts-row">
        <div className="cuspro-chart-card cuspro-skeleton-card">
          <div className="cuspro-skeleton-line"></div>
          <div className="cuspro-skeleton-chart"></div>
        </div>
        <div className="cuspro-quick-actions cuspro-skeleton-card">
          <div className="cuspro-skeleton-line"></div>
          <div className="cuspro-skeleton-line"></div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Admin Dashboard | Salfer Engineering</title>
        </Helmet>
        <SkeletonLoader />
      </>
    );
  }

  if (error) {
    return (
      <div className="cuspro-error-state">
        <FaExclamationTriangle className="cuspro-error-icon" />
        <h2>Error Loading Dashboard</h2>
        <p>{error}</p>
        <button onClick={fetchDashboardData} className="cuspro-retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | Salfer Engineering</title>
      </Helmet>

      <div className="cuspro-admin-dashboard">
        <div className="cuspro-dashboard-header">
          <h1>Admin Dashboard</h1>
          <p>Welcome back! Here's what's happening with your solar business today.</p>
        </div>

        <StatsCards />

        <div className="cuspro-dashboard-row">
          <Charts />
          <QuickActions />
        </div>

        <RecentActivity />
      </div>
    </>
  );
};

export default AdminDashboard;