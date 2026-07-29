// pages/Admin/AdminDashboard.cuspro.jsx - Premium Modern Recharts Redesign
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
  FaArrowRight,
  FaUsers,
  FaProjectDiagram,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaChevronRight,
  FaClock,
  FaArrowUp
} from 'react-icons/fa';
import '../../styles/Admin/dashboard.css';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// Status Configurations
const FREE_QUOTE_STATUS = {
  pending: { label: 'Pending', class: 'pending' },
  assigned: { label: 'Assigned', class: 'assigned' },
  processing: { label: 'Processing', class: 'processing' },
  accepted: { label: 'Accepted', class: 'accepted' },
  completed: { label: 'Completed', class: 'completed' },
  cancelled: { label: 'Cancelled', class: 'cancelled' }
};

const PRE_ASSESSMENT_STATUS = {
  pending_review: { label: 'Pending Review', class: 'pending' },
  pending_payment: { label: 'Pending Payment', class: 'pending' },
  scheduled: { label: 'Scheduled', class: 'scheduled' },
  site_visit_ongoing: { label: 'Site Visit Ongoing', class: 'processing' },
  device_deployed: { label: 'Device Deployed', class: 'processing' },
  data_collecting: { label: 'Collecting Data', class: 'processing' },
  data_analyzing: { label: 'Analyzing Data', class: 'processing' },
  report_draft: { label: 'Report Draft', class: 'processing' },
  quotation_generated: { label: 'Quotation Generated', class: 'processing' },
  quotation_accepted: { label: 'Quotation Accepted', class: 'accepted' },
  completed: { label: 'Completed', class: 'completed' },
  cancelled: { label: 'Cancelled', class: 'cancelled' }
};

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
        projectsRes
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
        }).catch(() => ({ data: { projects: [] } }))
      ]);

      const freeQuotes = freeQuotesRes.data.quotes || [];
      const pendingQuotes = freeQuotes.filter(q => q.status === 'pending');
      const completedQuotes = freeQuotes.filter(q => q.status === 'completed');

      const assessments = preAssessmentsRes.data.assessments || [];
      const pendingAssessments = assessments.filter(a => a.paymentStatus === 'pending');
      const completedAssessments = assessments.filter(a => a.assessmentStatus === 'completed');
      const scheduledAssessments = assessments.filter(a => a.assessmentStatus === 'scheduled');

      const projects = projectsRes.data.projects || [];

      // Build transactions for revenue
      const preTransactions = assessments
        .filter(a => a.invoiceNumber)
        .map(a => ({
          amount: a.assessmentFee || 0,
          status: a.paymentStatus === 'paid' ? 'Paid' : 'Pending',
          date: a.confirmedAt || a.bookedAt || a.createdAt
        }));

      const projectTransactions = projects
        .filter(p => p.amountPaid > 0)
        .map(p => ({
          amount: p.amountPaid || 0,
          status: p.status === 'completed' ? 'Paid' : 'Pending',
          date: p.startDate || p.createdAt
        }));

      const allTransactions = [...preTransactions, ...projectTransactions];
      
      const totalRevenue = allTransactions.reduce((sum, p) => sum + (p.amount || 0), 0);
      const thisMonthRevenue = allTransactions
        .filter(p => p.status === 'Paid' && new Date(p.date).getMonth() === new Date().getMonth())
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
        devices: devicesRes.data || { total: 0, active: 0, deployed: 0 }
      });

      // Process monthly data
      const monthlyFreeQuotes = new Array(12).fill(0);
      const monthlyAssessments = new Array(12).fill(0);
      const monthlyRevenue = new Array(12).fill(0);
      
      freeQuotes.forEach(quote => {
        if (quote.requestedAt) {
          const month = new Date(quote.requestedAt).getMonth();
          monthlyFreeQuotes[month]++;
        }
      });
      
      assessments.forEach(assessment => {
        if (assessment.bookedAt) {
          const month = new Date(assessment.bookedAt).getMonth();
          monthlyAssessments[month]++;
        }
      });
      
      const completedPayments = allTransactions.filter(p => p.status === 'Paid');
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

      const activities = generateRecentActivities(freeQuotes, assessments, projects);
      setRecentActivities(activities.slice(0, 5));

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const generateRecentActivities = (freeQuotes, assessments, projects) => {
    const activities = [];

    freeQuotes.slice(0, 2).forEach(quote => {
      let message = '';
      const statusConfig = FREE_QUOTE_STATUS[quote.status] || { label: quote.status || 'Unknown' };
      
      switch(quote.status) {
        case 'pending':
          message = `New quote request: ${quote.quotationReference}`;
          break;
        case 'assigned':
          message = `Quote assigned: ${quote.quotationReference}`;
          break;
        case 'processing':
          message = `Processing quote: ${quote.quotationReference}`;
          break;
        case 'accepted':
          message = `Quote accepted: ${quote.quotationReference}`;
          break;
        case 'completed':
          message = `Quote completed: ${quote.quotationReference}`;
          break;
        case 'cancelled':
          message = `Quote cancelled: ${quote.quotationReference}`;
          break;
        default:
          message = `Quote update: ${quote.quotationReference}`;
      }
      
      activities.push({
        id: `quote-${quote._id}`,
        type: 'free-quote',
        message: message,
        time: new Date(quote.requestedAt || quote.createdAt).toLocaleString(),
        status: quote.status,
        action: '/app/admin/siteassessment'
      });
    });

    assessments.slice(0, 3).forEach(assessment => {
      let message = '';
      const status = assessment.assessmentStatus || assessment.paymentStatus;
      
      switch(status) {
        case 'pending_review':
          message = `Pending review: ${assessment.bookingReference}`;
          break;
        case 'pending_payment':
          message = `Payment verification: ${assessment.bookingReference}`;
          break;
        case 'scheduled':
          message = `Assessment scheduled: ${assessment.bookingReference}`;
          break;
        case 'site_visit_ongoing':
          message = `Site visit ongoing: ${assessment.bookingReference}`;
          break;
        case 'device_deployed':
          message = `Device deployed: ${assessment.bookingReference}`;
          break;
        case 'data_collecting':
          message = `Collecting data for: ${assessment.bookingReference}`;
          break;
        case 'data_analyzing':
          message = `Analyzing data for: ${assessment.bookingReference}`;
          break;
        case 'report_draft':
          message = `Report draft ready: ${assessment.bookingReference}`;
          break;
        case 'quotation_generated':
          message = `Quotation generated: ${assessment.bookingReference}`;
          break;
        case 'quotation_accepted':
          message = `Quotation accepted: ${assessment.bookingReference}`;
          break;
        case 'completed':
          message = `Assessment completed: ${assessment.bookingReference}`;
          break;
        case 'cancelled':
          message = `Assessment cancelled: ${assessment.bookingReference}`;
          break;
        default:
          message = `Assessment update: ${assessment.bookingReference}`;
      }
      
      activities.push({
        id: `assessment-${assessment._id}`,
        type: 'pre-assessment',
        message,
        time: new Date(assessment.bookedAt || assessment.createdAt).toLocaleString(),
        status: status,
        action: '/app/admin/siteassessment'
      });
    });

    // Sort by time (newest first)
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

  // Quick Actions
  const quickActions = [
    { 
      icon: <FaClipboardList />, 
      label: 'Manage Assessments', 
      description: 'Review and assign assessments',
      color: 'indigo',
      link: '/app/admin/siteassessment'
    },
    { 
      icon: <FaProjectDiagram />, 
      label: 'View Projects', 
      description: 'Track all projects status',
      color: 'emerald',
      link: '/app/admin/project'
    },
    { 
      icon: <FaMoneyBillWave />, 
      label: 'Billing Overview', 
      description: 'Review payments and invoices',
      color: 'purple',
      link: '/app/admin/billing'
    },
    { 
      icon: <FaUsers />, 
      label: 'User Management', 
      description: 'Manage user accounts',
      color: 'amber',
      link: '/app/admin/usermanagement'
    }
  ];

  /* --- STATS CARDS COMPONENT WITH SPARKLINES --- */
  const StatsCards = () => {
    const cards = [
      {
        title: 'Free Quotes',
        value: stats.freeQuotes.total,
        icon: <FaFileInvoiceDollar />,
        color: 'blue',
        detail: `${stats.freeQuotes.pending} pending`,
        trend: '+12%',
        data: monthlyData.freeQuotes
      },
      {
        title: 'Pre Assessments',
        value: stats.preAssessments.total,
        icon: <FaClipboardList />,
        color: 'green',
        detail: `${stats.preAssessments.scheduled} scheduled`,
        trend: '+8%',
        data: monthlyData.assessments
      },
      {
        title: 'Total Revenue',
        value: formatCurrency(stats.revenue.total || 0),
        icon: <FaChartLine />,
        color: 'purple',
        detail: `${formatCurrency(stats.revenue.thisMonth)} this month`,
        trend: '+5%',
        data: monthlyData.revenue
      },
      {
        title: 'IoT Devices',
        value: stats.devices.total || 0,
        icon: <FaMicrochip />,
        color: 'orange',
        detail: `${stats.devices.active || 0} active`,
        trend: '+16%',
        data: monthlyData.revenue 
      }
    ];

    return (
      <div className="modern-stats-grid">
        {cards.map((card, index) => {
          const maxVal = Math.max(...card.data, 1);
          
          return (
            <div key={index} className={`modern-stat-card ${card.color}`}>
              <div className="modern-stat-header">
                <div className={`modern-stat-icon-wrapper ${card.color}`}>
                  {card.icon}
                </div>
                <div className="modern-stat-trend">
                  <FaArrowUp className="modern-trend-icon" /> {card.trend}
                </div>
              </div>
              <div className="modern-stat-content">
                <span className="modern-stat-value">{card.value}</span>
                <span className="modern-stat-label">{card.title}</span>
                <span className="modern-stat-detail">{card.detail}</span>
              </div>
              
              {/* Sparkline Footer */}
              <div className="modern-stat-sparkline">
                <svg width="100%" height="30" viewBox="0 0 120 30" preserveAspectRatio="none">
                  <path
                    d={`M0 ${30 - (card.data[0] / maxVal) * 25} ${
                      card.data.map((d, i) => `L${(i / (card.data.length - 1)) * 120} ${30 - (d / maxVal) * 25}`).join(' ')
                    }`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /* --- RECHARTS: PROJECT OVERVIEW AREA CHART (Left) --- */
  const ProjectOverviewChart = () => {
    const chartData = monthlyData.labels.map((label, i) => ({
      name: label,
      quotes: monthlyData.freeQuotes[i],
      assessments: monthlyData.assessments[i]
    }));

    const CustomTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        return (
          <div className="modern-chart-tooltip">
            <p className="tooltip-label">{label}</p>
            {payload.map((entry, idx) => (
              <p key={idx} className="tooltip-item" style={{ color: entry.color }}>
                {entry.name}: {entry.value}
              </p>
            ))}
          </div>
        );
      }
      return null;
    };

    return (
      <div className="modern-chart-card">
        <div className="modern-chart-header">
          <div>
            <h3>Project Overview</h3>
            <span className="modern-chart-period">Track your quotes and assessments performance</span>
          </div>
          <div className="modern-chart-actions">
            <span className="modern-legend-dot quote-color"></span> Free Quotes
            <span className="modern-legend-dot assessment-color"></span> Pre-Assessments
          </div>
        </div>
        <div className="modern-chart-body" style={{ height: '280px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorQuotes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorAssessments" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f472b6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f472b6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 12}} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#94a3b8', fontSize: 12}} 
                width={30}
              />
              <Tooltip content={<CustomTooltip />} cursor={{stroke: '#cbd5e1', strokeWidth: 1}} />
              <Area 
                type="monotone" 
                dataKey="quotes" 
                stroke="#8b5cf6" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorQuotes)" 
                dot={{ r: 5, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7 }}
              />
              <Area 
                type="monotone" 
                dataKey="assessments" 
                stroke="#ec4899" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorAssessments)" 
                dot={{ r: 5, fill: '#ec4899', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 7 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  /* --- RECHARTS: REVENUE TREND AREA CHART (Right - Green) --- */
  const RevenueTrendChart = () => {
    const chartData = monthlyData.labels.map((label, i) => ({
      name: label,
      revenue: monthlyData.revenue[i]
    }));

    const CustomTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        return (
          <div className="modern-chart-tooltip">
            <p className="tooltip-label">{label}</p>
            <p className="tooltip-item" style={{ color: '#10b981' }}>
              Revenue: {formatCurrency(payload[0].value)}
            </p>
          </div>
        );
      }
      return null;
    };

    return (
      <div className="modern-chart-card">
        <div className="modern-chart-header">
          <div>
            <h3>Revenue Trend</h3>
            <span className="modern-chart-period">Monthly revenue overview from Jan to Dec</span>
          </div>
          <div className="modern-chart-actions">
            <span className="modern-legend-dot revenue-color"></span> Monthly Revenue
          </div>
        </div>
        <div className="modern-chart-body" style={{ height: '280px' }}>
          {monthlyData.revenue.every(v => v === 0) ? (
            <div className="modern-empty-chart">
              <p>No revenue data available</p>
              <small>Complete payments to see revenue trends</small>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}} 
                  width={50}
                  tickFormatter={(value) => `₱${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{stroke: '#cbd5e1', strokeWidth: 1}} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    );
  };

  /* --- RECENT ACTIVITY COMPONENT --- */
  const RecentActivity = () => {
    const getStatusConfig = (status, type) => {
      if (type === 'free-quote') {
        return FREE_QUOTE_STATUS[status] || { label: status || 'Unknown', class: 'pending' };
      } else {
        return PRE_ASSESSMENT_STATUS[status] || { label: status?.replace(/_/g, ' ') || 'Unknown', class: 'pending' };
      }
    };

    const getStatusClass = (status, type) => {
      const config = getStatusConfig(status, type);
      return config.class;
    };

    const getStatusText = (status, type) => {
      const config = getStatusConfig(status, type);
      return config.label;
    };

    const getActivityIcon = (activity) => {
      if (activity.type === 'free-quote') return <FaFileInvoiceDollar />;
      if (activity.message?.includes('Payment') || activity.message?.includes('payment')) return <FaMoneyBillWave />;
      if (activity.message?.includes('scheduled') || activity.message?.includes('Scheduled')) return <FaCalendarAlt />;
      if (activity.status === 'completed') return <FaCheckCircle />;
      if (activity.status === 'cancelled') return <FaExclamationTriangle />;
      return <FaClipboardList />;
    };

    return (
      <div className="modern-activity-container">
        <div className="modern-activity-header">
          <div className="modern-activity-title">
            <FaClock /> Recent Activity
          </div>
          <button 
            className="modern-activity-view-all"
            onClick={() => navigate('/app/admin/siteassessment')}
          >
            View All <FaChevronRight />
          </button>
        </div>
        
        <div className="modern-activity-list">
          {recentActivities.length === 0 ? (
            <div className="modern-empty-activity">
              <p>No recent activities</p>
              <small>Activities will appear here as they happen</small>
            </div>
          ) : (
            recentActivities.map((activity) => {
              const type = activity.type || 'pre-assessment';
              const statusClass = getStatusClass(activity.status, type);
              const statusText = getStatusText(activity.status, type);
              
              return (
                <div 
                  key={activity.id} 
                  className="modern-activity-item"
                  onClick={() => navigate(activity.action)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(activity.action)}
                >
                  <div className={`modern-activity-icon ${statusClass}`}>
                    {getActivityIcon(activity)}
                  </div>
                  <div className="modern-activity-content">
                    <p className="modern-activity-message">{activity.message}</p>
                    <span className="modern-activity-time">{activity.time}</span>
                  </div>
                  <div className={`modern-activity-status ${statusClass}`}>
                    {statusText}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  /* --- QUICK ACTIONS COMPONENT --- */
  const QuickActions = () => (
    <div className="modern-quick-actions">
      <div className="modern-section-header">
        <h3>Quick Actions</h3>
      </div>
      <div className="modern-quick-actions-grid">
        {quickActions.map((action, index) => (
          <div 
            key={index} 
            className={`modern-quick-action-item ${action.color}`}
            onClick={() => navigate(action.link)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate(action.link)}
          >
            <div className="modern-quick-action-icon-wrapper">
              {action.icon}
            </div>
            <div className="modern-quick-action-content">
              <span className="modern-quick-action-label">{action.label}</span>
              <span className="modern-quick-action-description">{action.description}</span>
            </div>
            <FaArrowRight className="modern-quick-action-arrow" />
          </div>
        ))}
      </div>
    </div>
  );

  /* --- SKELETON LOADER --- */
  const SkeletonLoader = () => (
    <div className="modern-admin-dashboard">
      <div className="modern-welcome-section">
        <div className="skeleton-title"></div>
        <div className="skeleton-subtitle"></div>
      </div>
      <div className="modern-stats-grid">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="modern-stat-card skeleton-card">
            <div className="skeleton-stat-main"></div>
          </div>
        ))}
      </div>
      <div className="modern-quick-actions-grid">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton-quick-action"></div>
        ))}
      </div>
      <div className="modern-charts-row">
        <div className="modern-chart-card skeleton-card">
          <div className="skeleton-chart"></div>
        </div>
        <div className="modern-chart-card skeleton-card">
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
      <div className="modern-error-state">
        <FaExclamationTriangle className="modern-error-icon" />
        <h2>Error Loading Dashboard</h2>
        <p>{error}</p>
        <button onClick={fetchDashboardData} className="modern-retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | Salfer Engineering</title>
      </Helmet>

      <div className="modern-admin-dashboard">
        {/* Stats Cards with SVG Sparklines */}
        <StatsCards />

        {/* Quick Actions */}
        <QuickActions />

        {/* Charts Row - Both Area Charts */}
        <div className="modern-charts-row">
          <ProjectOverviewChart />
          <RevenueTrendChart />
        </div>

        {/* Recent Activity */}
        <RecentActivity />
      </div>
    </>
  );
};

export default AdminDashboard;