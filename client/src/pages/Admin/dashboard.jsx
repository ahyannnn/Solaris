// src/pages/Admin/AdminDashboard.cuspro.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaFileInvoiceDollar, 
  FaClipboardList, 
  FaChartLine,
  FaMicrochip,
  FaCheckCircle,
  FaExclamationTriangle,
  FaDownload,
  FaCalendarAlt,
  FaMoneyBillWave,
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
    devices: { total: 0, active: 0, deployed: 0 }
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [monthlyData, setMonthlyData] = useState({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    freeQuotes: new Array(12).fill(0),
    assessments: new Array(12).fill(0),
    revenue: new Array(12).fill(0)
  });

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
        devicesRes,
        projectsRes,
        clientsRes
      ] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/free-quotes`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { quotes: [] } })),
        axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { assessments: [] } })),
        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/devices`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { total: 0, active: 0, deployed: 0 } })),
        axios.get(`${import.meta.env.VITE_API_URL}/api/projects`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { projects: [] } })),
        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/clients`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { clients: [] } }))
      ]);

      const freeQuotes = freeQuotesRes.data.quotes || [];
      const pendingQuotes = freeQuotes.filter(q => q.status === 'pending');
      const completedQuotes = freeQuotes.filter(q => q.status === 'completed');

      const assessments = preAssessmentsRes.data.assessments || [];
      const pendingAssessments = assessments.filter(a => a.paymentStatus === 'pending');
      const completedAssessments = assessments.filter(a => a.assessmentStatus === 'completed');
      const scheduledAssessments = assessments.filter(a => a.assessmentStatus === 'scheduled');

      const projects = projectsRes.data.projects || [];

      // Build transactions from assessments
      const preTransactions = assessments
        .filter(a => a.invoiceNumber)
        .map(a => ({
          id: a._id,
          type: 'Pre-Assessment Booking',
          reference: a.bookingReference,
          invoiceNumber: a.invoiceNumber,
          amount: a.assessmentFee || 0,
          method: a.paymentGateway === 'paymongo' ? 'PayMongo' : (a.paymentMethod || 'cash'),
          status: a.paymentStatus === 'paid' ? 'Paid' : a.paymentStatus === 'for_verification' ? 'For Verification' : 'Pending',
          date: a.confirmedAt || a.bookedAt || a.createdAt,
          client: `${a.clientId?.contactFirstName || ''} ${a.clientId?.contactLastName || ''}`.trim(),
          clientId: a.clientId?._id,
          clientEmail: a.clientId?.userId?.email,
          clientPhone: a.clientId?.contactNumber,
          clientType: a.clientId?.client_type || 'Residential'
        }));

      // Build project payments
      const projectTransactions = projects
        .filter(p => p.amountPaid > 0)
        .map(p => ({
          id: p._id,
          type: 'Project Payment',
          reference: p.projectReference,
          projectName: p.projectName,
          amount: p.amountPaid || 0,
          method: 'Manual',
          status: p.status === 'completed' ? 'Completed' : p.status === 'full_paid' ? 'Full Payment Received' : 'In Progress',
          date: p.startDate || p.createdAt,
          client: `${p.clientId?.contactFirstName || ''} ${p.clientId?.contactLastName || ''}`.trim(),
          clientId: p.clientId?._id,
          clientPhone: p.clientId?.contactNumber,
          clientType: p.clientId?.client_type || 'Residential'
        }));

      const allTransactions = [...preTransactions, ...projectTransactions];
      
      // Calculate revenue totals
      const totalRevenue = allTransactions.reduce((sum, p) => sum + (p.amount || 0), 0);
      const thisMonthRevenue = allTransactions
        .filter(p => (p.status === 'Paid' || p.status === 'Completed' || p.status === 'Full Payment Received') && new Date(p.date).getMonth() === new Date().getMonth())
        .reduce((sum, p) => sum + (p.amount || 0), 0);

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
        revenue: { 
          total: totalRevenue, 
          thisMonth: thisMonthRevenue 
        },
        devices: devicesRes.data
      });

      // Process monthly data from actual API data
      const monthlyFreeQuotes = new Array(12).fill(0);
      const monthlyAssessments = new Array(12).fill(0);
      const monthlyRevenue = new Array(12).fill(0);
      
      // Group free quotes by month
      freeQuotes.forEach(quote => {
        if (quote.requestedAt) {
          const month = new Date(quote.requestedAt).getMonth();
          monthlyFreeQuotes[month]++;
        }
      });
      
      // Group assessments by month
      assessments.forEach(assessment => {
        if (assessment.bookedAt) {
          const month = new Date(assessment.bookedAt).getMonth();
          monthlyAssessments[month]++;
        }
      });
      
      // Group completed payments by month for revenue
      const completedPayments = allTransactions.filter(p => 
        p.status === 'Paid' || p.status === 'Completed' || p.status === 'Full Payment Received'
      );
      
      completedPayments.forEach(payment => {
        if (payment.date) {
          const month = new Date(payment.date).getMonth();
          monthlyRevenue[month] += payment.amount || 0;
        }
      });
      
      setMonthlyData({
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        freeQuotes: monthlyFreeQuotes,
        assessments: monthlyAssessments,
        revenue: monthlyRevenue
      });

      const activities = generateRecentActivities(freeQuotes, assessments);
      setRecentActivities(activities.slice(0, 3));

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const generateRecentActivities = (freeQuotes, assessments) => {
    const activities = [];

    freeQuotes.slice(0, 2).forEach(quote => {
      activities.push({
        id: `quote-${quote._id}`,
        type: 'free-quote',
        message: `New quote request: ${quote.quotationReference}`,
        time: new Date(quote.requestedAt).toLocaleString(),
        status: quote.status,
        action: `/app/admin/siteassessment`
      });
    });

    assessments.slice(0, 3).forEach(assessment => {
      let message = '';
      
      if (assessment.paymentStatus === 'for_verification') {
        message = `Payment verification: ${assessment.bookingReference}`;
      } else if (assessment.assessmentStatus === 'scheduled') {
        message = `Assessment scheduled: ${assessment.bookingReference}`;
      } else if (assessment.assessmentStatus === 'completed') {
        message = `Assessment completed: ${assessment.bookingReference}`;
      } else {
        message = `New booking: ${assessment.bookingReference}`;
      }
      
      activities.push({
        id: `assessment-${assessment._id}`,
        type: 'pre-assessment',
        message,
        time: new Date(assessment.bookedAt).toLocaleString(),
        status: assessment.assessmentStatus || assessment.paymentStatus,
        action: `/app/admin/siteassessment`
      });
    });

    return activities.sort((a, b) => new Date(b.time) - new Date(a.time));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const StatsCards = () => {
    const cards = [
      {
        title: 'Free Quotes',
        value: stats.freeQuotes.total,
        icon: <FaFileInvoiceDollar />,
        color: 'blue',
        details: [
          { label: 'Pending', value: stats.freeQuotes.pending },
          { label: 'Completed', value: stats.freeQuotes.completed }
        ]
      },
      {
        title: 'Pre Assessments',
        value: stats.preAssessments.total,
        icon: <FaClipboardList />,
        color: 'green',
        details: [
          { label: 'Pending', value: stats.preAssessments.pending },
          { label: 'Scheduled', value: stats.preAssessments.scheduled },
          { label: 'Completed', value: stats.preAssessments.completed }
        ]
      },
      {
        title: 'Total Revenue',
        value: formatCurrency(stats.revenue.total || 0),
        icon: <FaChartLine />,
        color: 'purple',
        details: [
          { label: 'This Month', value: formatCurrency(stats.revenue.thisMonth || 0) }
        ]
      },
      {
        title: 'IoT Devices',
        value: stats.devices.total || 0,
        icon: <FaMicrochip />,
        color: 'orange',
        details: [
          { label: 'Active', value: stats.devices.active || 0 },
          { label: 'Deployed', value: stats.devices.deployed || 0 }
        ]
      }
    ];

    return (
      <div className="adsih-stats-grid">
        {cards.map((card, index) => (
          <div key={index} className={`adsih-stat-card ${card.color}`}>
            <div className="adsih-stat-main">
              <div className="adsih-stat-info">
                <span className="adsih-stat-label">{card.title}</span>
                <span className="adsih-stat-value">{card.value}</span>
              </div>
              <div className="adsih-stat-icon">{card.icon}</div>
            </div>
            <div className="adsih-stat-details">
              {card.details.map((detail, idx) => (
                <div key={idx} className="adsih-stat-detail">
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

  const Charts = () => {
    const maxFreeQuotes = Math.max(...monthlyData.freeQuotes, 1);
    const maxAssessments = Math.max(...monthlyData.assessments, 1);
    const maxComparison = Math.max(maxFreeQuotes, maxAssessments);
    const maxRevenue = Math.max(...monthlyData.revenue, 1);

    return (
      <div className="adsih-charts-row">
        {/* Free Quotes vs Pre-Assessments Chart */}
        <div className="adsih-chart-card">
          <div className="adsih-chart-header">
            <h3>Free Quotes vs Pre-Assessments</h3>
            
          </div>
          <div className="adsih-chart-body">
            <div className="adsih-comparison-chart">
              <div className="adsih-bar-chart dual-bars">
                {monthlyData.labels.map((label, index) => (
                  <div key={index} className="adsih-dual-bar-item">
                    <div className="adsih-bars-container">
                      <div 
                        className="adsih-bar adsih-quote-bar" 
                        style={{ height: `${(monthlyData.freeQuotes[index] / maxComparison) * 160}px` }}
                      >
                        {monthlyData.freeQuotes[index] > 0 && (
                          <span className="adsih-bar-value">{monthlyData.freeQuotes[index]}</span>
                        )}
                      </div>
                      <div 
                        className="adsih-bar adsih-assessment-bar" 
                        style={{ height: `${(monthlyData.assessments[index] / maxComparison) * 160}px` }}
                      >
                        {monthlyData.assessments[index] > 0 && (
                          <span className="adsih-bar-value">{monthlyData.assessments[index]}</span>
                        )}
                      </div>
                    </div>
                    <span className="adsih-bar-label">{label}</span>
                  </div>
                ))}
              </div>
              <div className="adsih-chart-legend">
                <div className="adsih-legend-item">
                  <div className="adsih-legend-color quote-color"></div>
                  <span>Free Quotes</span>
                </div>
                <div className="adsih-legend-item">
                  <div className="adsih-legend-color assessment-color"></div>
                  <span>Pre-Assessments</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Overview Chart */}
        <div className="adsih-chart-card">
          <div className="adsih-chart-header">
            <h3>Revenue Overview</h3>
            
          </div>
          <div className="adsih-chart-body">
            {monthlyData.revenue.every(v => v === 0) ? (
              <div className="adsih-empty-chart">
                <p>No revenue data available</p>
                <small>Complete payments to see revenue trends</small>
              </div>
            ) : (
              <div className="adsih-bar-chart">
                {monthlyData.revenue.map((value, index) => (
                  <div key={index} className="adsih-bar-item">
                    <div 
                      className="adsih-bar adsih-revenue-bar" 
                      style={{ height: `${(value / maxRevenue) * 160}px` }}
                    >
                      {value > 0 && <span className="adsih-bar-value">{formatCurrency(value)}</span>}
                    </div>
                    <span className="adsih-bar-label">{monthlyData.labels[index]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const RecentActivity = () => {
    const getStatusClass = (status) => {
      switch(status) {
        case 'completed': return 'completed';
        case 'pending': return 'pending';
        case 'for_verification': return 'verification';
        case 'scheduled': return 'scheduled';
        default: return '';
      }
    };

    const getStatusText = (status) => {
      switch(status) {
        case 'completed': return 'Completed';
        case 'pending': return 'Pending';
        case 'for_verification': return 'Verifying';
        case 'scheduled': return 'Scheduled';
        default: return status;
      }
    };

    const getActivityIcon = (activity) => {
      if (activity.type === 'free-quote') return <FaFileInvoiceDollar />;
      if (activity.message.includes('Payment')) return <FaMoneyBillWave />;
      if (activity.message.includes('scheduled')) return <FaCalendarAlt />;
      if (activity.status === 'completed') return <FaCheckCircle />;
      return <FaClipboardList />;
    };

    return (
      <div className="adsih-recent-activity">
        <div className="adsih-activity-header">
          <h3>Recent Activity</h3>
          <button className="adsih-view-all" onClick={() => navigate('/app/admin/siteassessment')}>
            View All <FaArrowRight />
          </button>
        </div>
        
        <div className="adsih-activity-list">
          {recentActivities.length === 0 ? (
            <div className="adsih-empty-activity">
              <p>No recent activities</p>
            </div>
          ) : (
            recentActivities.map((activity) => (
              <div 
                key={activity.id} 
                className="adsih-activity-item"
                onClick={() => activity.action && navigate(activity.action)}
              >
                <div className="adsih-activity-icon">
                  {getActivityIcon(activity)}
                </div>
                <div className="adsih-activity-content">
                  <p className="adsih-activity-message">{activity.message}</p>
                  <span className="adsih-activity-time">{activity.time}</span>
                </div>
                <div className={`adsih-activity-status ${getStatusClass(activity.status)}`}>
                  {getStatusText(activity.status)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const SkeletonLoader = () => (
    <div className="adsih-admin-dashboard">
      <div className="adsih-dashboard-header">
        <div className="skeleton-title"></div>
        <div className="skeleton-subtitle"></div>
      </div>
      <div className="adsih-stats-grid">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="adsih-stat-card skeleton-card">
            <div className="skeleton-stat-main"></div>
            <div className="skeleton-details"></div>
          </div>
        ))}
      </div>
      <div className="adsih-charts-row">
        <div className="adsih-chart-card skeleton-card">
          <div className="skeleton-chart"></div>
        </div>
        <div className="adsih-chart-card skeleton-card">
          <div className="skeleton-chart"></div>
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
      <div className="adsih-error-state">
        <FaExclamationTriangle className="adsih-error-icon" />
        <h2>Error Loading Dashboard</h2>
        <p>{error}</p>
        <button onClick={fetchDashboardData} className="adsih-retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | Salfer Engineering</title>
      </Helmet>

      <div className="adsih-admin-dashboard">
        <div className="adsih-dashboard-header">
          <h1>Dashboard</h1>
          <p>Overview of your solar business performance</p>
        </div>

        <StatsCards />
        <Charts />
        <RecentActivity />
      </div>
    </>
  );
};

export default AdminDashboard;