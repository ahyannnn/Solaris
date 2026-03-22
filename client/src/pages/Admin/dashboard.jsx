// src/pages/Admin/dashboard.jsx
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
  FaEnvelope
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

      // Fetch all required data in parallel
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

      // Process free quotes data
      const freeQuotes = freeQuotesRes.data.quotes || [];
      const pendingQuotes = freeQuotes.filter(q => q.status === 'pending');
      const completedQuotes = freeQuotes.filter(q => q.status === 'completed');

      // Process pre-assessments data
      const assessments = preAssessmentsRes.data.assessments || [];
      const pendingAssessments = assessments.filter(a => a.paymentStatus === 'pending');
      const completedAssessments = assessments.filter(a => a.assessmentStatus === 'completed');
      const scheduledAssessments = assessments.filter(a => a.assessmentStatus === 'scheduled');

      // Calculate completion rate
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

      // Generate recent activities
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

    // Add free quote activities
    freeQuotes.slice(0, 5).forEach(quote => {
      activities.push({
        id: `quote-${quote._id}`,
        type: 'free-quote',
        message: `New free quote request from ${quote.clientId?.contactFirstName || 'Client'}`,
        time: new Date(quote.requestedAt).toLocaleString(),
        status: quote.status,
        icon: '📄',
        action: `/dashboard/free-quotes/${quote._id}`
      });
    });

    // Add pre-assessment activities
    assessments.slice(0, 5).forEach(assessment => {
      let message = '';
      let icon = '';
      
      if (assessment.paymentStatus === 'for_verification') {
        message = `Payment verification needed for ${assessment.bookingReference}`;
        icon = '💰';
      } else if (assessment.assessmentStatus === 'scheduled') {
        message = `Assessment scheduled: ${assessment.bookingReference}`;
        icon = '📅';
      } else if (assessment.assessmentStatus === 'completed') {
        message = `Assessment completed: ${assessment.bookingReference}`;
        icon = '✅';
      } else {
        message = `New pre-assessment booking: ${assessment.bookingReference}`;
        icon = '📋';
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

    // Sort by time (newest first)
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
        color: '#3498db',
        details: [
          { label: 'Pending', value: stats.freeQuotes.pending, color: '#f39c12' },
          { label: 'Completed', value: stats.freeQuotes.completed, color: '#2ecc71' }
        ]
      },
      {
        title: 'Pre Assessments',
        value: stats.preAssessments.total,
        icon: <FaClipboardList />,
        color: '#9b59b6',
        details: [
          { label: 'Pending', value: stats.preAssessments.pending, color: '#f39c12' },
          { label: 'Scheduled', value: stats.preAssessments.scheduled, color: '#3498db' },
          { label: 'Completed', value: stats.preAssessments.completed, color: '#2ecc71' }
        ]
      },
      {
        title: 'Revenue',
        value: formatCurrency(stats.revenue.total || 0),
        icon: <FaChartLine />,
        color: '#2ecc71',
        details: [
          { label: 'This Month', value: formatCurrency(stats.revenue.thisMonth || 0), color: '#27ae60' }
        ]
      },
      {
        title: 'Users',
        value: stats.users.total || 0,
        icon: <FaUsers />,
        color: '#e74c3c',
        details: [
          { label: 'New This Month', value: stats.users.newThisMonth || 0, color: '#e67e22' }
        ]
      },
      {
        title: 'IoT Devices',
        value: stats.devices.total || 0,
        icon: <FaMicrochip />,
        color: '#1abc9c',
        details: [
          { label: 'Active', value: stats.devices.active || 0, color: '#2ecc71' },
          { label: 'Deployed', value: stats.devices.deployed || 0, color: '#f39c12' }
        ]
      },
      {
        title: 'Completion Rate',
        value: `${stats.completionRate}%`,
        icon: <FaCheckCircle />,
        color: '#f39c12',
        details: [
          { label: 'Target', value: '85%', color: '#95a5a6' }
        ]
      }
    ];

    return (
      <div className="stats-cards-grid">
        {cards.map((card, index) => (
          <div key={index} className="stat-card" style={{ borderTopColor: card.color }}>
            <div className="stat-card-header">
              <div className="stat-icon" style={{ color: card.color }}>
                {card.icon}
              </div>
              <div className="stat-value">{card.value}</div>
            </div>
            <div className="stat-title">{card.title}</div>
            <div className="stat-details">
              {card.details.map((detail, idx) => (
                <div key={idx} className="stat-detail-item">
                  <span className="detail-label">{detail.label}</span>
                  <span className="detail-value" style={{ color: detail.color }}>
                    {detail.value}
                  </span>
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
    // Mock data for charts - will be replaced with real API data
    const monthlyData = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      assessments: [5, 8, 12, 15, 20, 25, 30, 35, 40, 45, 50, 55],
      revenue: [5000, 8000, 12000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000, 55000]
    };

    const handleExport = () => {
      console.log('Export data');
    };

    return (
      <div className="charts-container">
        <div className="chart-card">
          <div className="chart-header">
            <h3>
              <FaChartLine /> Assessment Trends
            </h3>
            <button className="export-btn" onClick={handleExport}>
              <FaDownload /> Export
            </button>
          </div>
          <div className="chart-placeholder">
            <div className="chart-bars">
              {monthlyData.assessments.map((value, index) => (
                <div key={index} className="chart-bar-wrapper">
                  <div 
                    className="chart-bar" 
                    style={{ height: `${(value / 60) * 100}%` }}
                    title={`${value} assessments`}
                  >
                    <span className="bar-value">{value}</span>
                  </div>
                  <span className="bar-label">{monthlyData.labels[index]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>
              <FaChartBar /> Revenue Overview
            </h3>
          </div>
          <div className="chart-placeholder">
            <div className="revenue-bars">
              {monthlyData.revenue.map((value, index) => (
                <div key={index} className="revenue-bar-wrapper">
                  <div 
                    className="revenue-bar" 
                    style={{ height: `${(value / 60000) * 100}%` }}
                    title={formatCurrency(value)}
                  >
                    <span className="bar-value">{formatCurrency(value)}</span>
                  </div>
                  <span className="bar-label">{monthlyData.labels[index]}</span>
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
      { label: 'New Free Quote', icon: <FaPlus />, path: '/dashboard/free-quotes/new', color: '#3498db' },
      { label: 'Create Invoice', icon: <FaFileInvoiceDollar />, path: '/dashboard/billing/new', color: '#2ecc71' },
      { label: 'Add User', icon: <FaUsers />, path: '/dashboard/usermanagement/new', color: '#9b59b6' },
      { label: 'Register Device', icon: <FaMicrochip />, path: '/dashboard/iotdevice/new', color: '#1abc9c' },
      { label: 'View Reports', icon: <FaChartLine />, path: '/dashboard/reports', color: '#e74c3c' },
      { label: 'Send Announcement', icon: <FaEnvelope />, path: '/dashboard/announcements', color: '#f39c12' },
    ];

    return (
      <div className="quick-actions-card">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          {actions.map((action, index) => (
            <button
              key={index}
              className="action-btn"
              style={{ borderColor: action.color }}
              onClick={() => navigate(action.path)}
            >
              <span className="action-icon" style={{ color: action.color }}>
                {action.icon}
              </span>
              <span className="action-label">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Recent Activity Component
  const RecentActivity = () => {
    const getStatusIcon = (status) => {
      switch(status) {
        case 'completed':
          return <FaCheckCircle className="status-icon completed" />;
        case 'pending':
        case 'for_verification':
          return <FaClock className="status-icon pending" />;
        case 'cancelled':
          return <FaExclamationTriangle className="status-icon cancelled" />;
        default:
          return <FaClock className="status-icon" />;
      }
    };

    const getStatusText = (status) => {
      switch(status) {
        case 'completed': return 'Completed';
        case 'pending': return 'Pending';
        case 'for_verification': return 'For Verification';
        case 'cancelled': return 'Cancelled';
        case 'scheduled': return 'Scheduled';
        default: return status;
      }
    };

    return (
      <div className="recent-activity-card">
        <div className="card-header">
          <h3>Recent Activity</h3>
          <button className="view-all-btn" onClick={() => navigate('/dashboard/activities')}>
            View All
          </button>
        </div>
        
        <div className="activity-list">
          {recentActivities.length === 0 ? (
            <div className="empty-state">
              <p>No recent activities</p>
            </div>
          ) : (
            recentActivities.map((activity) => (
              <div 
                key={activity.id} 
                className="activity-item"
                onClick={() => activity.action && navigate(activity.action)}
              >
                <div className="activity-icon">{activity.icon || '📋'}</div>
                <div className="activity-content">
                  <p className="activity-message">{activity.message}</p>
                  <span className="activity-time">{activity.time}</span>
                </div>
                <div className="activity-status">
                  {getStatusIcon(activity.status)}
                  <span className="status-text">{getStatusText(activity.status)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        <FaSpinner className="spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard-error">
        <FaExclamationTriangle className="error-icon" />
        <h2>Error Loading Dashboard</h2>
        <p>{error}</p>
        <button onClick={fetchDashboardData} className="retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | Salfer Engineering</title>
      </Helmet>

      <div className="admin-dashboard">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <p>Welcome back! Here's what's happening with your solar business today.</p>
        </div>

        {/* Stats Cards */}
        <StatsCards />

        {/* Charts Section */}
        <div className="dashboard-row">
          <Charts />
          <QuickActions />
        </div>

        {/* Recent Activity */}
        <RecentActivity />
      </div>
    </>
  );
};

export default AdminDashboard;