// pages/Admin/AdminDashboard.cuspro.jsx - Redesigned with Dark Solar Theme Support
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
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
  FaSun,
  FaMoon,
  FaUserCircle
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

  // Real-time data updates (no page refresh). Cleaned up on unmount.
  useRealtimeTable(['free-quotes', 'pre-assessments', 'devices', 'projects', 'users'], () => {
    fetchDashboardData();
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

      switch (quote.status) {
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

      switch (status) {
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
      link: '/app/admin/siteassessment'
    },
    {
      icon: <FaProjectDiagram />,
      label: 'View Projects',
      description: 'Track all projects status',
      link: '/app/admin/project'
    },
    {
      icon: <FaMoneyBillWave />,
      label: 'Billing Overview',
      description: 'Review payments and invoices',
      link: '/app/admin/billing'
    },
    {
      icon: <FaUsers />,
      label: 'User Management',
      description: 'Manage user accounts',
      link: '/app/admin/usermanagement'
    }
  ];

  /* --- STATS CARDS COMPONENT --- */
  const StatsCards = () => {
    const cards = [
      {
        title: 'Free Quotes',
        value: stats.freeQuotes.total,
        icon: <FaFileInvoiceDollar />,
        detail: `${stats.freeQuotes.pending} pending`,
        data: monthlyData.freeQuotes
      },
      {
        title: 'Pre Assessments',
        value: stats.preAssessments.total,
        icon: <FaClipboardList />,
        detail: `${stats.preAssessments.scheduled} scheduled`,
        data: monthlyData.assessments
      },
      {
        title: 'Total Revenue',
        value: formatCurrency(stats.revenue.total || 0),
        icon: <FaChartLine />,
        detail: `${formatCurrency(stats.revenue.thisMonth)} this month`,
        data: monthlyData.revenue
      },
      {
        title: 'IoT Devices',
        value: stats.devices.total || 0,
        icon: <FaMicrochip />,
        detail: `${stats.devices.active || 0} active`,
        data: monthlyData.revenue
      }
    ];

    return (
      <div className="stats-grid_admindashbu">
        {cards.map((card, index) => {
          const maxVal = Math.max(...card.data, 1);

          return (
            <div key={index} className="stat-card_admindashbu">
              <div className="stat-card-header_admindashbu">
                <div className="stat-icon-wrapper_admindashbu">
                  {card.icon}
                </div>
              </div>
              <div className="stat-card-content_admindashbu">
                <span className="stat-value_admindashbu">{card.value}</span>
                <span className="stat-label_admindashbu">{card.title}</span>
                <span className="stat-detail_admindashbu">{card.detail}</span>
              </div>
              <div className="stat-sparkline_admindashbu">
                <svg width="100%" height="30" viewBox="0 0 120 30" preserveAspectRatio="none">
                  <path
                    d={`M0 ${30 - (card.data[0] / maxVal) * 25} ${card.data.map((d, i) => `L${(i / (card.data.length - 1)) * 120} ${30 - (d / maxVal) * 25}`).join(' ')}`}
                    fill="none"
                    stroke="#F39C12"
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

  /* --- PROJECT OVERVIEW CHART --- */
  const ProjectOverviewChart = () => {
    const chartData = monthlyData.labels.map((label, i) => ({
      name: label,
      quotes: monthlyData.freeQuotes[i],
      assessments: monthlyData.assessments[i]
    }));

    // Custom Tooltip - uses CSS variables for dark mode support
    const CustomTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        return (
          <div className="chart-tooltip_admindashbu">
            <p className="tooltip-label_admindashbu">{label}</p>
            {payload.map((entry, idx) => (
              <p key={idx} className="tooltip-item_admindashbu">
                {entry.name}: {entry.value}
              </p>
            ))}
          </div>
        );
      }
      return null;
    };

    return (
      <div className="chart-card_admindashbu">
        <div className="chart-header_admindashbu">
          <div>
            <h3 className="chart-title_admindashbu">Project Overview</h3>
            <span className="chart-subtitle_admindashbu">Track your quotes and assessments performance</span>
          </div>
          <div className="chart-legend_admindashbu">
            <span className="legend-dot_admindashbu quotes-dot_admindashbu"></span> Free Quotes
            <span className="legend-dot_admindashbu assessments-dot_admindashbu"></span> Pre-Assessments
          </div>
        </div>
        <div className="chart-body_admindashbu">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 5, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorQuotes_admindashbu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F39C12" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F39C12" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorAssessments_admindashbu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="var(--border-color, #EEF0ED)" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-secondary, #667085)', fontSize: 12, fontWeight: 500 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-secondary, #667085)', fontSize: 12, fontWeight: 500 }}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-color, #D1D5DB)', strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="quotes"
                stroke="#F39C12"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorQuotes_admindashbu)"
                dot={{ r: 5, fill: '#F39C12', strokeWidth: 2, stroke: 'var(--bg-card, #FFFFFF)' }}
                activeDot={{ r: 7 }}
              />
              <Area
                type="monotone"
                dataKey="assessments"
                stroke="#10B981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorAssessments_admindashbu)"
                dot={{ r: 5, fill: '#10B981', strokeWidth: 2, stroke: 'var(--bg-card, #FFFFFF)' }}
                activeDot={{ r: 7 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  /* --- REVENUE TREND CHART --- */
  const RevenueTrendChart = () => {
    const chartData = monthlyData.labels.map((label, i) => ({
      name: label,
      revenue: monthlyData.revenue[i]
    }));

    // Custom Tooltip - uses CSS variables for dark mode support
    const CustomTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        return (
          <div className="chart-tooltip_admindashbu">
            <p className="tooltip-label_admindashbu">{label}</p>
            <p className="tooltip-item_admindashbu">
              Revenue: {formatCurrency(payload[0].value)}
            </p>
          </div>
        );
      }
      return null;
    };

    return (
      <div className="chart-card_admindashbu">
        <div className="chart-header_admindashbu">
          <div>
            <h3 className="chart-title_admindashbu">Revenue Trend</h3>
            <span className="chart-subtitle_admindashbu">Monthly revenue overview</span>
          </div>
          <div className="chart-legend_admindashbu">
            <span className="legend-dot_admindashbu revenue-dot_admindashbu"></span> Monthly Revenue
          </div>
        </div>
        <div className="chart-body_admindashbu">
          {monthlyData.revenue.every(v => v === 0) ? (
            <div className="empty-chart_admindashbu">
              <p>No revenue data available</p>
              <small>Complete payments to see revenue trends</small>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue_admindashbu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F39C12" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F39C12" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="var(--border-color, #EEF0ED)" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-secondary, #667085)', fontSize: 12, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-secondary, #667085)', fontSize: 12, fontWeight: 500 }}
                  width={70}
                  tickFormatter={(value) =>
                    `₱${value >= 1000 ? (value / 1000).toFixed(0) + 'k' : value}`
                  }
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-color, #D1D5DB)', strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#F39C12"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue_admindashbu)"
                  dot={{ r: 5, fill: '#F39C12', strokeWidth: 2, stroke: 'var(--bg-card, #FFFFFF)' }}
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
      <div className="activity-container_admindashbu">
        <div className="activity-header_admindashbu">
          <div className="activity-title_admindashbu">
            <FaClock className="activity-title-icon_admindashbu" /> Recent Activity
          </div>
          <button
            className="view-all-btn_admindashbu"
            onClick={() => navigate('/app/admin/siteassessment')}
          >
            View All <FaChevronRight />
          </button>
        </div>

        <div className="activity-list_admindashbu">
          {recentActivities.length === 0 ? (
            <div className="empty-activity_admindashbu">
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
                  className="activity-item_admindashbu"
                  onClick={() => navigate(activity.action)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(activity.action)}
                >
                  <div className={`activity-icon_admindashbu ${statusClass}`}>
                    {getActivityIcon(activity)}
                  </div>
                  <div className="activity-content_admindashbu">
                    <p className="activity-message_admindashbu">{activity.message}</p>
                    <span className="activity-time_admindashbu">{activity.time}</span>
                  </div>
                  <div className={`activity-status_admindashbu ${statusClass}`}>
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
    <div className="quick-actions_admindashbu">
      <div className="quick-actions-header_admindashbu">
        <h3 className="quick-actions-title_admindashbu">Quick Actions</h3>
      </div>
      <div className="quick-actions-grid_admindashbu">
        {quickActions.map((action, index) => (
          <div
            key={index}
            className="quick-action-item_admindashbu"
            onClick={() => navigate(action.link)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate(action.link)}
          >
            <div className="quick-action-icon-wrapper_admindashbu">
              {action.icon}
            </div>
            <div className="quick-action-content_admindashbu">
              <span className="quick-action-label_admindashbu">{action.label}</span>
              <span className="quick-action-description_admindashbu">{action.description}</span>
            </div>
            <FaArrowRight className="quick-action-arrow_admindashbu" />
          </div>
        ))}
      </div>
    </div>
  );

  /* --- SKELETON LOADER --- */
  const SkeletonLoader = () => (
    <div className="dashboard-container_admindashbu">
      <div className="stats-grid_admindashbu">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="stat-card_admindashbu skeleton-card_admindashbu">
            <div className="skeleton-stat-main_admindashbu skeleton-line_admindashbu"></div>
          </div>
        ))}
      </div>
      <div className="quick-actions-grid_admindashbu">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton-quick-action_admindashbu skeleton-line_admindashbu"></div>
        ))}
      </div>
      <div className="charts-row_admindashbu">
        <div className="chart-card_admindashbu skeleton-card_admindashbu">
          <div className="skeleton-chart_admindashbu skeleton-line_admindashbu"></div>
        </div>
        <div className="chart-card_admindashbu skeleton-card_admindashbu">
          <div className="skeleton-chart_admindashbu skeleton-line_admindashbu"></div>
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
      <div className="error-state_admindashbu">
        <FaExclamationTriangle className="error-icon_admindashbu" />
        <h2>Error Loading Dashboard</h2>
        <p>{error}</p>
        <button onClick={fetchDashboardData} className="retry-btn_admindashbu">Retry</button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | Salfer Engineering</title>
      </Helmet>

      <div className="dashboard-container_admindashbu">
        {/* Stats Cards */}
        <StatsCards />

        {/* Quick Actions */}
        <QuickActions />

        {/* Charts Row */}
        <div className="charts-row_admindashbu">
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