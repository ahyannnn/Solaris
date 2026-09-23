// pages/Engineer/EngineerDashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  FaCalendarAlt,
  FaCalendarCheck,
  FaClipboardCheck,
  FaClipboardList,
  FaCheckCircle,
  FaSpinner,
  FaMapMarkerAlt,
  FaMicrochip,
  FaArrowRight,
  FaExclamationTriangle,
  FaTools,
  FaSolarPanel,
  FaHome,
  FaBuilding,
  FaPhone,
  FaEnvelope,
  FaWifi,
  FaBatteryFull,
  FaChevronRight,
  FaCircle,
  FaBell,
  FaProjectDiagram,
} from 'react-icons/fa';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import '../../styles/Engineer/dashboard.css';

const EngineerDashboard = () => {
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    myProjects: 0,
    myAssessments: 0,
    mySchedules: 0,
    todaySchedules: 0,
    pendingTasks: 0
  });
  const [myAssessments, setMyAssessments] = useState([]);
  const [mySchedules, setMySchedules] = useState([]);
  const [myDevices, setMyDevices] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  // Full lists (not sliced) for Recent Customers card + 2 charts.
  // No extra API calls — derived from the same fetch below.
  const [fullAssessments, setFullAssessments] = useState([]);
  const [fullSchedules, setFullSchedules] = useState([]);
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [allActivities, setAllActivities] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);

  // Helper function to get full address
  const getFullAddress = (address) => {
    if (!address) return 'TBD';
    
    const parts = [
      address.houseOrBuilding,
      address.street,
      address.barangay,
      address.cityMunicipality,
      address.province
    ].filter(part => part && part.trim() !== '');
    
    return parts.length > 0 ? parts.join(', ') : 'TBD';
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');

      // Fetch MY projects (assigned to this engineer)
      // NOTE: endpoint is paginated (default 10, max 50) — dashboard needs
      // the full picture for stats/charts, so request the max page.
      const projectsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects/engineer/my-projects?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const myProjectsList = projectsRes.data.projects || [];
      setMyProjects(myProjectsList);
      const activeProjects = myProjectsList.filter(p => p.status !== 'completed' && p.status !== 'cancelled').length;

      // Fetch MY assessments (assigned to this engineer)
      // NOTE: paginated (default 20) — request max so Recent Customers,
      // charts and counts see everything.
      const assessmentsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments/engineer/my-assessments?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const myAssessmentsList = assessmentsRes.data.assessments || [];
      setMyAssessments(myAssessmentsList.slice(0, 5));
      setFullAssessments(myAssessmentsList);
      const pendingAssessments = myAssessmentsList.filter(a => a.assessmentStatus === 'scheduled' || a.assessmentStatus === 'pending_review').length;

      // Set active assessment
      const active = myAssessmentsList.find(a => a.assessmentStatus === 'scheduled' || a.assessmentStatus === 'in_progress' || a.assessmentStatus === 'device_deployed');
      setActiveAssessment(active || myAssessmentsList[0] || null);

      // Fetch MY devices
      const myDevicesList = myAssessmentsList.filter(a => a.iotDeviceId).map(a => a.iotDeviceId);
      setMyDevices(myDevicesList.slice(0, 5));

      // Fetch MY schedules (assigned to this engineer)
      // NOTE: paginated (default 10 oldest-first, max 50) — without the max
      // limit the 7-day chart only ever saw the oldest page (often all past
      // dates) and rendered all zeros.
      const schedulesRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/schedules/engineer/my-schedules?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const mySchedulesList = schedulesRes.data.schedules || [];
      setFullSchedules(mySchedulesList);
      const upcomingSchedules = mySchedulesList.filter(s => s.status === 'scheduled' || s.status === 'confirmed');
      const todayScheds = mySchedulesList.filter(s => {
        const today = new Date().toDateString();
        return new Date(s.scheduledDate).toDateString() === today && s.status !== 'completed' && s.status !== 'cancelled';
      });
      setMySchedules(upcomingSchedules.slice(0, 5));

      // ============================================================
      // PENDING TASKS FOR ENGINEER
      // ============================================================
      const pending = [];

      // 1. Assessments that need device deployment (device assigned but not deployed)
      myAssessmentsList.forEach(a => {
        const hasDeviceAssigned = a.assignedDeviceId || a.iotDeviceId || a.assignedDevice;
        const isDeployed = a.deviceDeployedAt ? true : false;
        
        if (hasDeviceAssigned && !isDeployed && a.assessmentStatus === 'scheduled') {
          pending.push({
            id: a._id,
            type: 'deploy_device',
            title: 'Deploy Device',
            reference: a.bookingReference || 'Assessment',
            date: a.bookedAt || a.createdAt,
            link: `/app/engineer/assessment/${a._id}`
          });
        }

        // NOTE: report_draft is deliberately NOT counted — the sidebar red
        // dots exclude it (no engineer action left), so the dashboard
        // fallback must not count it either.

        // 3. Assessments that need data analysis
        if (a.assessmentStatus === 'data_collecting' || a.assessmentStatus === 'data_analyzing') {
          pending.push({
            id: a._id,
            type: 'analyze_data',
            title: 'Analyze IoT Data',
            reference: a.bookingReference || 'Assessment',
            date: a.deviceDeployedAt || a.createdAt,
            link: `/app/engineer/assessment/${a._id}`
          });
        }
      });

      // 4. Projects that need progress update (in_progress status)
      myProjectsList.forEach(p => {
        if (p.status === 'in_progress' || p.status === 'initial_paid' || p.status === 'full_paid') {
          pending.push({
            id: p._id,
            type: 'update_project',
            title: 'Update Project Progress',
            reference: p.projectReference || p.projectName,
            date: p.startDate || p.createdAt,
            link: `/app/engineer/project/${p._id}`
          });
        }
      });

      // Sort by date (oldest first - priority)
      pending.sort((a, b) => new Date(a.date) - new Date(b.date));
      setPendingTasks(pending.slice(0, 5));

      // Pending-tasks total = sidebar red dots (server action counts for
      // My Assessments + My Projects). The local list above is only a
      // top-5 preview with different predicates, so it must not drive
      // the count.
      let actionTotal = pending.length;
      try {
        const [projCountRes, assessCountRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/projects/engineer/action-counts`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments/engineer/assessment-action-counts`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        actionTotal = (projCountRes.data?.total || 0) + (assessCountRes.data?.total || 0);
      } catch (countErr) {
        console.error('Error fetching action counts for dashboard:', countErr);
      }

      setStats({
        myProjects: activeProjects,
        myAssessments: pendingAssessments,
        mySchedules: upcomingSchedules.length,
        todaySchedules: todayScheds.length,
        pendingTasks: actionTotal
      });

      // Combine activities for timeline - ONLY 3 MOST RECENT
      const activities = [];
      myAssessmentsList.forEach(a => {
        if (a.assessmentStatus === 'scheduled' || a.assessmentStatus === 'pending_review') {
          activities.push({
            id: a._id,
            type: 'assessment',
            title: 'Assessment Pending',
            reference: a.bookingReference || 'Assessment',
            date: a.bookedAt || a.createdAt,
            status: a.assessmentStatus,
            icon: <FaClipboardList />
          });
        }
      });
      todayScheds.forEach(s => {
        activities.push({
          id: s._id,
          type: 'schedule',
          title: "Today's Schedule",
          reference: s.title || 'Site Visit',
          date: s.scheduledDate,
          status: s.status,
          icon: <FaCalendarAlt />
        });
      });
      myProjectsList.forEach(p => {
        if (p.status === 'in_progress') {
          activities.push({
            id: p._id,
            type: 'project',
            title: 'Project in Progress',
            reference: p.projectName || p.projectReference,
            date: p.startDate || p.createdAt,
            status: p.status,
            icon: <FaTools />
          });
        }
      });
      // Sort by date (newest first) and take only 3
      activities.sort((a, b) => new Date(b.date) - new Date(a.date));
      setAllActivities(activities.slice(0, 3));

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  // Realtime: admin assignments or customer updates refresh without reload.
  useRealtimeTable(
    ['projects', 'pre-assessments', 'schedules', 'free-quotes'],
    () => { fetchDashboardData(); },
    { debounceMs: 600 }
  );

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status, type = 'assessment') => {
    const badges = {
      'assessment': {
        'scheduled': <span className="status-badge-engdas scheduled-engdas">Scheduled</span>,
        'pending_review': <span className="status-badge-engdas pending-engdas">Pending Review</span>,
        'pending_payment': <span className="status-badge-engdas pending-engdas">Pending Payment</span>,
        'site_visit_ongoing': <span className="status-badge-engdas in-progress-engdas">Site Visit</span>,
        'device_deployed': <span className="status-badge-engdas deployed-engdas">Device Deployed</span>,
        'data_collecting': <span className="status-badge-engdas collecting-engdas">Data Collecting</span>,
        'data_analyzing': <span className="status-badge-engdas analyzing-engdas">Analyzing</span>,
        'completed': <span className="status-badge-engdas completed-engdas">Completed</span>,
        'cancelled': <span className="status-badge-engdas cancelled-engdas">Cancelled</span>
      },
      'schedule': {
        'scheduled': <span className="status-badge-engdas scheduled-engdas">Scheduled</span>,
        'confirmed': <span className="status-badge-engdas confirmed-engdas">Confirmed</span>,
        'in_progress': <span className="status-badge-engdas in-progress-engdas">In Progress</span>,
        'completed': <span className="status-badge-engdas completed-engdas">Completed</span>,
        'cancelled': <span className="status-badge-engdas cancelled-engdas">Cancelled</span>
      },
      'project': {
        'pending': <span className="status-badge-engdas pending-engdas">Pending</span>,
        'approved': <span className="status-badge-engdas approved-engdas">Approved</span>,
        'in_progress': <span className="status-badge-engdas in-progress-engdas">In Progress</span>,
        'completed': <span className="status-badge-engdas completed-engdas">Completed</span>
      },
      'task': {
        'pending': <span className="status-badge-engdas pending-engdas">Pending</span>,
        'in_progress': <span className="status-badge-engdas in-progress-engdas">In Progress</span>,
        'completed': <span className="status-badge-engdas completed-engdas">Completed</span>
      }
    };
    return badges[type]?.[status] || <span className="status-badge-engdas">{status}</span>;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'assessment': return <FaClipboardList className="activity-icon-engdas" />;
      case 'schedule': return <FaCalendarAlt className="activity-icon-engdas" />;
      case 'project': return <FaTools className="activity-icon-engdas" />;
      default: return <FaBell className="activity-icon-engdas" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'assessment': return '#8B5CF6';
      case 'schedule': return '#3B82F6';
      case 'project': return '#F59E0B';
      default: return '#64748B';
    }
  };

  // ============================================================
  // DERIVED: Recent Customers (cards only, no buttons/links)
  // Mix of assessments + projects, newest first, top 5.
  // ============================================================
  // photoURL is populated at clientId.userId (object when populated,
  // string id when not) — empty string when no photo.
  const clientPhotoOf = (c) => {
    const u = c?.userId;
    if (u && typeof u === 'object') return u.photoURL || '';
    return '';
  };

  const recentCustomers = useMemo(() => {
    const map = new Map();
    (fullAssessments || []).forEach((a) => {
      const c = a?.clientId;
      if (!c) return;
      const key = String(c._id || `${c.contactFirstName}-${c.contactLastName}-${a.bookingReference}`);
      const name = `${c.contactFirstName || ''} ${c.contactLastName || ''}`.trim() || 'Customer';
      const date = a.bookedAt || a.createdAt;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name,
          photo: clientPhotoOf(c),
          meta: a.bookingReference || a.propertyType || 'Site Assessment',
          status: a.assessmentStatus,
          statusType: 'assessment',
          date,
        });
      }
    });
    (myProjects || []).forEach((p) => {
      const c = p?.clientId;
      const nameFromClient = c ? `${c.contactFirstName || ''} ${c.contactLastName || ''}`.trim() : '';
      const name = nameFromClient || p.clientName || p.projectName || 'Customer';
      if (!name || name === 'Customer') return;
      const key = String(p._id || `${name}-${p.projectReference}`);
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name,
          photo: c ? clientPhotoOf(c) : '',
          meta: p.projectReference || p.projectName || 'Project',
          status: p.status,
          statusType: 'project',
          date: p.startDate || p.createdAt,
        });
      }
    });
    return [...map.values()]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [fullAssessments, myProjects]);

  const getInitials = (name) => {
    if (!name) return 'C';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // ============================================================
  // CHART 1: 7-day schedule workload (next 7 days from today)
  // ============================================================
  const weeklyScheduleData = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push({
        key: d.toDateString(),
        label: i === 0 ? 'Today' : d.toLocaleDateString('en-PH', { weekday: 'short' }),
        full: d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
        count: 0,
      });
    }
    (fullSchedules || []).forEach((s) => {
      if (!s?.scheduledDate) return;
      if (s.status === 'completed' || s.status === 'cancelled') return;
      const key = new Date(s.scheduledDate).toDateString();
      const slot = days.find((d) => d.key === key);
      if (slot) slot.count += 1;
    });
    return days.map(({ label, full, count }) => ({ label, full, count }));
  }, [fullSchedules]);

  // ============================================================
  // Stat sparklines (admin-style): last 7 days buckets, no new API.
  // ============================================================
  const statTrends = useMemo(() => {
    const keys = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      keys.push(d.toDateString());
    }
    const bucket = (items, pickDate) => {
      const counts = new Array(7).fill(0);
      (items || []).forEach((it) => {
        const raw = pickDate(it);
        if (!raw) return;
        const k = new Date(raw).toDateString();
        const idx = keys.indexOf(k);
        if (idx >= 0) counts[idx] += 1;
      });
      return counts;
    };
    const needsAction = (a) =>
      ['scheduled', 'pending_review', 'data_collecting', 'data_analyzing'].includes(a?.assessmentStatus);
    const projectNeedsAction = (p) =>
      ['in_progress', 'initial_paid', 'full_paid'].includes(p?.status);
    return {
      projects: bucket(myProjects, (p) => p.startDate || p.createdAt),
      assessments: bucket(fullAssessments, (a) => a.bookedAt || a.createdAt),
      tasks: bucket(
        [
          ...(fullAssessments || []).filter(needsAction).map((a) => ({ d: a.bookedAt || a.createdAt })),
          ...(myProjects || []).filter(projectNeedsAction).map((p) => ({ d: p.startDate || p.createdAt })),
        ],
        (x) => x.d
      ),
      schedules: bucket(fullSchedules, (s) => s.scheduledDate),
    };
  }, [myProjects, fullAssessments, fullSchedules]);

  const Sparkline = ({ data }) => {
    const arr = Array.isArray(data) && data.length ? data : [0];
    const maxVal = Math.max(...arr, 1);
    const n = arr.length;
    const pts = arr.map((d, i) => {
      const x = n === 1 ? 60 : (i / (n - 1)) * 120;
      const y = 30 - (d / maxVal) * 25;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    });
    return (
      <div className="stat-sparkline-engdas">
        <svg width="100%" height="30" viewBox="0 0 120 30" preserveAspectRatio="none">
          <path
            d={pts.join(' ')}
            fill="none"
            stroke="#F39C12"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  };

  const ChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const row = payload[0]?.payload;
      return (
        <div className="engdas-chart-tooltip">
          <p className="engdas-chart-tooltip-label">{row?.full || label || payload[0]?.name}</p>
          {payload.map((entry, idx) => (
            <p key={idx} className="engdas-chart-tooltip-item">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const SkeletonLoader = () => (
    <div className="engdas-dashboard">
      <div className="engdas-welcome-section">
        <div className="skeleton-line-engdas skeleton-title-engdas"></div>
        <div className="skeleton-line-engdas skeleton-text-engdas"></div>
      </div>
      <div className="engdas-stats-grid">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="stat-card-engdas skeleton-card-engdas">
            <div className="skeleton-line-engdas skeleton-label-engdas"></div>
            <div className="skeleton-line-engdas skeleton-value-engdas"></div>
          </div>
        ))}
      </div>
      <div className="engdas-row-layout">
        <div className="skeleton-card-engdas" style={{ padding: '24px', borderRadius: 'var(--radius-2xl)' }}>
          <div className="skeleton-line-engdas skeleton-project-name-engdas"></div>
          <div className="skeleton-line-engdas skeleton-project-system-engdas"></div>
        </div>
        <div className="skeleton-card-engdas" style={{ padding: '20px', borderRadius: 'var(--radius-2xl)' }}>
          <div className="skeleton-line-engdas skeleton-activity-title-engdas"></div>
          <div className="skeleton-line-engdas skeleton-activity-ref-engdas"></div>
          <div className="skeleton-line-engdas skeleton-activity-date-engdas"></div>
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
        {/* Top action bar — 6 buttons left, alerts right. Manuscript Links kept as-is. */}
        <div className="engdas-welcome-section engdas-topbar">
          <div className="engdas-topbar-left">
            <div className="engdas-welcome-actions">
              <Link to="/app/engineer/assessment" className="btn-primary-engdas">
                <FaClipboardList /> View Assessments
              </Link>
              <Link to="/app/engineer/schedule" className="btn-secondary-engdas">
                <FaCalendarAlt /> My Schedule
              </Link>
            </div>
            <div className="engdas-topbar-squares">
              <span className="engdas-squares-caption">Quick Actions</span>
              <Link to="/app/engineer/assessment" className="engdas-square-btn" title="My Assessments" aria-label="My Assessments" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6' }}>
                <FaClipboardCheck />
              </Link>
              <Link to="/app/engineer/schedule" className="engdas-square-btn" title="My Schedule" aria-label="My Schedule" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6' }}>
                <FaCalendarCheck />
              </Link>
              <Link to="/app/engineer/project" className="engdas-square-btn" title="My Projects" aria-label="My Projects" style={{ background: 'rgba(243, 156, 18, 0.12)', color: '#F39C12' }}>
                <FaSolarPanel />
              </Link>
              <Link to="/app/engineer/device" className="engdas-square-btn" title="My Devices" aria-label="My Devices" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}>
                <FaMicrochip />
              </Link>
            </div>
          </div>
          {stats.pendingTasks > 0 && (
            <div className="engdas-topbar-right">
              <div className="engdas-inline-alert">
                <span className="engdas-inline-alert-icon" style={{ background: 'rgba(243, 156, 18, 0.12)', color: '#F39C12' }}>
                  <FaExclamationTriangle />
                </span>
                <strong className="engdas-inline-alert-text">You have {stats.pendingTasks} pending task(s)</strong>
                <Link to="#pending-tasks" className="alert-action-engdas engdas-inline-alert-btn" onClick={(e) => {
                  e.preventDefault();
                  document.querySelector('.engdas-pending-tasks-section')?.scrollIntoView({ behavior: 'smooth' });
                }}>
                  View Tasks <FaArrowRight />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards — admin-sized with icons + sparkline */}
        <div className="engdas-stats-grid">
          <div className="stat-card-engdas">
            <div className="stat-card-header-engdas">
              <div className="stat-icon-wrapper-engdas" style={{ background: 'rgba(243, 156, 18, 0.12)', color: '#F39C12' }}>
                <FaSolarPanel />
              </div>
            </div>
            <div className="stat-content-engdas">
              <span className="stat-value-engdas">{stats.myProjects}</span>
              <span className="stat-label-engdas">Active Projects</span>
              <span className="stat-trend-engdas">Assigned to you</span>
            </div>
            <Sparkline data={statTrends.projects} />
          </div>
          <div className="stat-card-engdas">
            <div className="stat-card-header-engdas">
              <div className="stat-icon-wrapper-engdas" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6' }}>
                <FaClipboardCheck />
              </div>
            </div>
            <div className="stat-content-engdas">
              <span className="stat-value-engdas">{stats.myAssessments}</span>
              <span className="stat-label-engdas">Pending Assessments</span>
              <span className="stat-trend-engdas">Need your attention</span>
            </div>
            <Sparkline data={statTrends.assessments} />
          </div>
          <div className="stat-card-engdas">
            <div className="stat-card-header-engdas">
              <div className="stat-icon-wrapper-engdas" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}>
                <FaExclamationTriangle />
              </div>
            </div>
            <div className="stat-content-engdas">
              <span className="stat-value-engdas">{stats.pendingTasks}</span>
              <span className="stat-label-engdas">Pending Tasks</span>
              <span className="stat-trend-engdas">Require action</span>
            </div>
            <Sparkline data={statTrends.tasks} />
          </div>
          <Link to="/app/engineer/schedule" className="stat-card-engdas stat-card-link-engdas" title="Go to My Schedule" aria-label="Go to My Schedule">
            <div className="stat-card-header-engdas">
              <div className="stat-icon-wrapper-engdas" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6' }}>
                <FaCalendarCheck />
              </div>
            </div>
            <div className="stat-content-engdas">
              <span className="stat-value-engdas">{stats.mySchedules}</span>
              <span className="stat-label-engdas">Upcoming Schedules</span>
              <span className="stat-trend-engdas">This week</span>
            </div>
            <Sparkline data={statTrends.schedules} />
          </Link>
        </div>

        {/* Schedule + Recent Customers side-by-side (cards only, no buttons) */}
        <div className="engdas-charts-row">
          <div className="engdas-chart-card">
            <div className="section-header-engdas">
              <h2 className="section-title-engdas">7-Day Schedule</h2>
              <span className="engdas-chart-sub">Upcoming visits</span>
            </div>
            <div className="engdas-chart-body">
              <ResponsiveContainer width="100%" height="100%" minHeight={230}>
                <BarChart data={weeklyScheduleData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="label" height={24} tickMargin={4} interval={0} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(243,156,18,0.08)' }} />
                  <Bar dataKey="count" name="Visits" fill="#F39C12" radius={[6, 6, 2, 2]} maxBarSize={34} />
                </BarChart>
              </ResponsiveContainer>
              {weeklyScheduleData.reduce((sum, d) => sum + d.count, 0) === 0 && (
                <div className="engdas-chart-empty">No visits scheduled in the next 7 days</div>
              )}
            </div>
          </div>

          <div className="engdas-recent-card engdas-recent-side">
            <div className="section-header-engdas">
              <h2 className="section-title-engdas">Recent Customers</h2>
              <span className="engdas-chart-sub">Latest assigned work</span>
            </div>
            {recentCustomers.length > 0 ? (
              <div className="engdas-recent-list">
                {recentCustomers.map((c, index) => (
                  <React.Fragment key={c.id}>
                    <div className="engdas-recent-item">
                      <div className="engdas-recent-avatar">
                        <span className="engdas-recent-initials">{getInitials(c.name)}</span>
                        {c.photo ? (
                          <img
                            src={c.photo}
                            alt={c.name}
                            className="engdas-recent-photo"
                            loading="lazy"
                            onError={(e) => { e.currentTarget.remove(); }}
                          />
                        ) : null}
                      </div>
                      <div className="engdas-recent-info">
                        <span className="engdas-recent-name">{c.name}</span>
                        <span className="engdas-recent-meta">{c.meta} • {formatDate(c.date)}</span>
                      </div>
                      <div className="engdas-recent-status">
                        {getStatusBadge(c.status, c.statusType)}
                      </div>
                    </div>
                    {index < recentCustomers.length - 1 && <div className="activity-divider-engdas"></div>}
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <div className="empty-small-engdas">
                <p className="empty-text-engdas">No customers assigned yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Row Layout: Active Assessment + Recent Activity */}
        <div className="engdas-row-layout">
          {/* Active Assessment */}
          <div className="engdas-assessment-section">
            <div className="section-header-engdas">
              <h2 className="section-title-engdas">Active Assessment</h2>
              {activeAssessment && (
                <Link to="/app/engineer/assessment" className="view-all-link-engdas">
                  View All
                  <FaChevronRight className="arrow-icon-engdas" />
                </Link>
              )}
            </div>

            {activeAssessment ? (
              <div className="assessment-card-engdas">
                <div className="assessment-header-engdas">
                  <div className="assessment-info-engdas">
                    <h3 className="assessment-name-engdas">
                      {activeAssessment.clientId?.contactFirstName} {activeAssessment.clientId?.contactLastName}
                    </h3>
                    <p className="assessment-reference-engdas">{activeAssessment.bookingReference}</p>
                  </div>
                  {getStatusBadge(activeAssessment.assessmentStatus, 'assessment')}
                </div>

                <div className="assessment-content-engdas">
                  <div className="assessment-details-engdas">
                    <div className="assessment-metric-engdas">
                      <span className="metric-label-engdas">Property Type</span>
                      <span className="metric-value-engdas">{activeAssessment.propertyType || 'N/A'}</span>
                    </div>

                    <div className="assessment-metric-engdas">
                      <span className="metric-label-engdas">
                        <FaMapMarkerAlt /> Address
                      </span>
                      <span className="metric-value-engdas">
                        {getFullAddress(activeAssessment.addressId)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state-engdas">
                <div className="empty-state-content-engdas">
                  <h3 className="empty-state-title-engdas">No active assessments</h3>
                  <p className="empty-state-description-engdas">You have no assessments assigned yet</p>
                </div>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="engdas-activities-section">
            <div className="section-header-engdas">
              <h2 className="section-title-engdas">Recent Activity</h2>
              {allActivities.length > 0 && (
                <Link to="/app/engineer/assessment" className="view-all-link-engdas">
                  View All
                  <FaChevronRight className="arrow-icon-engdas" />
                </Link>
              )}
            </div>

            <div className="activities-card-engdas">
              <div className="activities-list-engdas">
                {allActivities.length > 0 ? (
                  allActivities.map((activity, index) => (
                    <React.Fragment key={activity.id}>
                      <div className="activity-item-engdas">
                        <div className="activity-icon-wrapper-engdas" style={{ background: `${getActivityColor(activity.type)}15`, color: getActivityColor(activity.type) }}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="activity-content-engdas">
                          <div className="activity-header-engdas">
                            <span className="activity-title-engdas">{activity.title}</span>
                            <span className="activity-reference-engdas">{activity.reference}</span>
                          </div>
                          <span className="activity-date-engdas">
                            {formatDate(activity.date)}
                          </span>
                        </div>
                        <div className="activity-status-engdas">
                          {getStatusBadge(activity.status,
                            activity.type === 'assessment' ? 'assessment' :
                              activity.type === 'schedule' ? 'schedule' : 'project'
                          )}
                        </div>
                      </div>
                      {index < allActivities.length - 1 && <div className="activity-divider-engdas"></div>}
                    </React.Fragment>
                  ))
                ) : (
                  <div className="empty-small-engdas">
                    <p className="empty-text-engdas">No recent activity</p>
                  </div>
                )}
              </div>
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

export default EngineerDashboard;