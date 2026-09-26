// pages/Engineer/EngineerDashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
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
  FaMicrochip,
  FaArrowRight,
  FaExclamationTriangle,
  FaTools,
  FaSolarPanel,
  FaChevronRight,
  FaBell,
  FaCheck,
  FaInbox,
  FaCheckDouble,
  FaCreditCard,
  FaFlagCheckered,
} from 'react-icons/fa';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import '../../styles/Engineer/dashboard.css';

// Declared at module scope, not inside EngineerDashboard — components created
// during render are re-created (and remounted) on every render.
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
          stroke="var(--chart-bar)"
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

// Mirrors the real layout order (page head -> KPI -> attention -> chart+recent)
// so the transition from skeleton to content does not shift the page.
const SkeletonLoader = () => (
  <div className="engdas-dashboard">
    <div className="engdas-page-head">
      <div className="engdas-welcome-content">
        <div className="engdas-welcome-greeting-wrapper">
          <span className="skeleton-line-engdas skeleton-head-icon"></span>
          <div className="engdas-welcome-text">
            <div className="skeleton-line-engdas skeleton-title-engdas"></div>
            <div className="skeleton-line-engdas skeleton-text-engdas"></div>
          </div>
        </div>
        <div className="engdas-welcome-actions">
          <div className="skeleton-line-engdas skeleton-btn-engdas"></div>
          <div className="skeleton-line-engdas skeleton-btn-engdas"></div>
        </div>
      </div>
    </div>
    <div className="engdas-stats-grid">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="stat-card-engdas skeleton-card-engdas">
          <div className="stat-card-header-engdas">
            <div className="skeleton-line-engdas skeleton-icon-engdas"></div>
          </div>
          <div className="skeleton-line-engdas skeleton-value-engdas"></div>
          <div className="skeleton-line-engdas skeleton-label-engdas"></div>
        </div>
      ))}
    </div>
    <div className="engdas-row-layout">
      <div className="skeleton-panel-engdas">
        <div className="skeleton-line-engdas skeleton-project-name-engdas"></div>
        <div className="skeleton-line-engdas skeleton-project-system-engdas"></div>
      </div>
      <div className="skeleton-panel-engdas">
        <div className="skeleton-line-engdas skeleton-activity-title-engdas"></div>
        <div className="skeleton-line-engdas skeleton-activity-ref-engdas"></div>
        <div className="skeleton-line-engdas skeleton-activity-date-engdas"></div>
      </div>
    </div>
    <div className="engdas-charts-row">
      <div className="skeleton-panel-engdas"></div>
      <div className="skeleton-panel-engdas"></div>
    </div>
  </div>
);

// Real pre-assessment workflow, grouped into 6 customer-facing phases.
//
// The 12 `assessmentStatus` enum values (server/models/PreAssessment.js:90-92)
// are too granular to show as steps, so they are collapsed into milestones.
// Every phase is driven by real persisted data — nothing is mocked:
//   request_received   -> the record exists (bookedAt / requestedAt)
//   approved_booking   -> admin moved it off pending_review (>= pending_payment)
//   payment_received   -> paymentStatus === 'paid' || paymentCompletedAt set
//   scheduled          -> assessmentStatus >= scheduled (bookedAt set)
//   device_deployed    -> deviceDeployedAt set (2nd-to-last phase)
//   assessment_done    -> deviceRetrievedAt set, i.e. the engineer has pulled
//                         the device and the data is in (last phase)
//
// The last phase deliberately keys off `deviceRetrievedAt` and NOT
// assessmentStatus === 'completed': retrieving the device is what finishes the
// engineer's side of the assessment (preAssessmentControllers.js:4309-4312 sets
// assessmentStatus to 'data_analyzing' and stamps deviceRetrievedAt at the same
// moment). Everything after that — report_draft, quotation_generated,
// quotation_accepted, completed — is admin/customer workflow.
const STATUS_RANK = {
  pending_review: 0,
  pending_payment: 1,
  scheduled: 2,
  site_visit_ongoing: 3,
  device_deployed: 4,
  data_collecting: 5,
  data_analyzing: 6,
  report_draft: 7,
  quotation_generated: 8,
  quotation_accepted: 9,
  completed: 10,
};

const rankOf = (assessment) => STATUS_RANK[assessment?.assessmentStatus] ?? 0;

const WORKFLOW_PHASES = [
  {
    key: 'request_received',
    label: 'Request Received',
    Icon: FaInbox,
    isDone: () => true,
  },
  {
    key: 'approved_booking',
    label: 'Approved Booking',
    Icon: FaCheckDouble,
    isDone: (a) => rankOf(a) >= STATUS_RANK.pending_payment,
  },
  {
    key: 'payment_received',
    label: 'Payment Received',
    Icon: FaCreditCard,
    isDone: (a) => a?.paymentStatus === 'paid' || !!a?.paymentCompletedAt,
  },
  {
    key: 'scheduled',
    label: 'Scheduled Assessment',
    Icon: FaCalendarCheck,
    isDone: (a) => rankOf(a) >= STATUS_RANK.scheduled,
  },
  {
    key: 'device_deployed',
    label: 'Device Deployed',
    Icon: FaMicrochip,
    isDone: (a) => !!a?.deviceDeployedAt || rankOf(a) >= STATUS_RANK.device_deployed,
  },
  {
    key: 'assessment_done',
    label: 'Assessment Completed',
    Icon: FaFlagCheckered,
    isDone: (a) => !!a?.deviceRetrievedAt,
  },
];

// Returns per-phase state plus the overall percentage. Percentage counts only
// fully-completed phases, so 5 of 6 done reads 83% while the last is in progress.
//
// Phases are evaluated cumulatively: a phase is only "done" if every phase
// before it is also done. Without that, a record with paymentStatus 'paid' but
// assessmentStatus still 'pending_review' would light up "Payment Received"
// while "Approved Booking" was still in progress — an out-of-order rail.
const getWorkflow = (assessment) => {
  const total = WORKFLOW_PHASES.length;
  const cancelled = assessment?.assessmentStatus === 'cancelled';

  const states = [];
  let reachedCurrent = false;
  for (const phase of WORKFLOW_PHASES) {
    if (cancelled) states.push('upcoming');
    else if (reachedCurrent) states.push('pending');
    else if (phase.isDone(assessment)) states.push('done');
    else {
      states.push('current');
      reachedCurrent = true;
    }
  }

  const doneCount = states.filter((s) => s === 'done').length;

  return {
    states,
    total,
    doneCount,
    currentIndex: states.indexOf('current'),
    cancelled,
    pct: Math.round((doneCount / total) * 100),
  };
};

// Display-only formatting. The API stores enum values lowercase
// ('residential' | 'commercial' | 'industrial' — server/models/PreAssessment.js:8)
// and we leave them that way; only the rendered string is capitalised.
const capitalize = (value) => {
  const s = (value ?? '').toString().trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
};

const getInitials = (name) => {
  const clean = (name || '').trim();
  if (!clean) return '?';
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const EngineerDashboard = () => {
  const { toast, hideToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    myProjects: 0,
    myAssessments: 0,
    mySchedules: 0,
    pendingTasks: 0
  });
  const [myProjects, setMyProjects] = useState([]);
  // Full lists (not sliced) for the Recent Work card + both charts.
  // No extra API calls — derived from the same fetch below.
  const [fullAssessments, setFullAssessments] = useState([]);
  const [fullSchedules, setFullSchedules] = useState([]);
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [pendingTasks, setPendingTasks] = useState([]);

  // Page-head greeting. The app has no auth context — identity lives in
  // storage, same as Dashboard_Layout/dashboard.jsx:965. userName is set to
  // the full name at register (pages/Auth/registerpage.jsx:542).
  const fullName = localStorage.getItem('userName') || sessionStorage.getItem('userName') || '';
  const firstName = fullName.trim().split(/\s+/)[0] || 'there';

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const todayLabel = new Date().toLocaleDateString('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

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
      // NOTE: paginated (default 20) — request max so Recent Work,
      // charts and counts see everything.
      const assessmentsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments/engineer/my-assessments?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const myAssessmentsList = assessmentsRes.data.assessments || [];
      setFullAssessments(myAssessmentsList);
      const pendingAssessments = myAssessmentsList.filter(a => a.assessmentStatus === 'scheduled' || a.assessmentStatus === 'pending_review').length;

      // Set active assessment
      const active = myAssessmentsList.find(a => a.assessmentStatus === 'scheduled' || a.assessmentStatus === 'in_progress' || a.assessmentStatus === 'device_deployed');
      setActiveAssessment(active || myAssessmentsList[0] || null);

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
      // This-week window (Monday 00:00 – Sunday 23:59, local) for the
      // Upcoming Schedules card count.
      const nowRef = new Date();
      const mondayOffset = (nowRef.getDay() + 6) % 7;
      const weekStart = new Date(nowRef);
      weekStart.setDate(nowRef.getDate() - mondayOffset);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      const thisWeekSchedules = upcomingSchedules.filter(s => {
        if (!s?.scheduledDate) return false;
        const d = new Date(s.scheduledDate);
        return !isNaN(d) && d >= weekStart && d <= weekEnd;
      });

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
      // Provisional list. Replaced below once the server tells us which of these
      // it considers actionable; kept as the fallback if that request fails.
      setPendingTasks(pending.slice(0, 5));

      // Pending-tasks total AND the list itself both come from the server.
      //
      // The list used to be filtered with a local copy of the rule
      // (`status === 'in_progress' || 'initial_paid' || 'full_paid'`), which is
      // far weaker than the server's engineerHasAction — that also inspects
      // paymentPreference, the payment schedule and the modal lock. So the card
      // listed projects the server had already ruled out, e.g. a 152-day-old
      // `initial_paid` project with paymentPreference 'installment'. The server
      // now returns `actionableIds` / `assessmentIds` and the local list is
      // intersected with them, so card, KPI and sidebar badge always agree.
      let actionTotal = pending.length;
      let actionableProjectIds = null;
      let actionableAssessmentIds = null;
      try {
        const [projCountRes, assessCountRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/projects/engineer/action-counts`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments/engineer/assessment-action-counts`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        actionableProjectIds = projCountRes.data?.actionableIds;
        actionableAssessmentIds = assessCountRes.data?.assessmentIds;
        actionTotal = (projCountRes.data?.total || 0) + (assessCountRes.data?.total || 0);

        // Older server without actionableIds: keep the local list rather than
        // showing nothing, and the console line makes the mismatch obvious.
        if (!Array.isArray(actionableProjectIds) || !Array.isArray(actionableAssessmentIds)) {
          console.warn('action-counts response missing actionableIds/assessmentIds — falling back to the local pending list');
        }
      } catch (countErr) {
        console.error('Error fetching action counts for dashboard:', countErr);
      }

      if (Array.isArray(actionableProjectIds) && Array.isArray(actionableAssessmentIds)) {
        const projectOk = new Set(actionableProjectIds);
        const assessmentOk = new Set(actionableAssessmentIds);
        setPendingTasks(
          pending
            .filter(t =>
              t.type === 'update_project'
                ? projectOk.has(String(t.id))
                : assessmentOk.has(String(t.id))
            )
            .slice(0, 5)
        );
      }

      setStats({
        myProjects: activeProjects,
        myAssessments: pendingAssessments,
        mySchedules: thisWeekSchedules.length,
        pendingTasks: actionTotal
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

  // Derived once for the Active Assessment workflow stepper.
  const workflow = getWorkflow(activeAssessment);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'assessment': return <FaClipboardList className="activity-icon-engdas" />;
      case 'schedule': return <FaCalendarAlt className="activity-icon-engdas" />;
      case 'project': return <FaTools className="activity-icon-engdas" />;
      default: return <FaBell className="activity-icon-engdas" />;
    }
  };

  // Returns a CSS class, not a hex — accents must follow the active theme.
  const getActivityAccent = (type) => {
    switch (type) {
      case 'assessment': return 'accent-icon--purple';
      case 'schedule': return 'accent-icon--blue';
      case 'project': return 'accent-icon--brand';
      default: return 'accent-icon--slate';
    }
  };

  // ============================================================
  // DERIVED: Recent Work (one merged list)
  // Assessments + projects + schedules, newest first, top 6. This replaced
  // the old separate "Recent Customers" and "Recent Activity" cards, which
  // showed the same assigned-work/status/date data twice.
  // ============================================================
  // photoURL is populated at clientId.userId (object when populated,
  // string id when not) — empty string when no photo.
  const clientPhotoOf = (c) => {
    const u = c?.userId;
    if (u && typeof u === 'object') return u.photoURL || '';
    return '';
  };

  const recentWork = useMemo(() => {
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
          type: 'assessment',
          name,
          photo: clientPhotoOf(c),
          meta: a.bookingReference || capitalize(a.propertyType) || 'Site Assessment',
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
          type: 'project',
          name,
          photo: c ? clientPhotoOf(c) : '',
          meta: p.projectReference || p.projectName || 'Project',
          status: p.status,
          statusType: 'project',
          date: p.startDate || p.createdAt,
        });
      }
    });
    (fullSchedules || []).forEach((s) => {
      const c = s?.clientId;
      const name = c ? `${c.contactFirstName || ''} ${c.contactLastName || ''}`.trim() : '';
      const key = String(s._id || `sched-${s.scheduledDate}`);
      if (map.has(key)) return;
      map.set(key, {
        id: key,
        type: 'schedule',
        name: name || 'Site Visit',
        photo: c ? clientPhotoOf(c) : '',
        meta: s.title || s.address || 'Scheduled visit',
        status: s.status,
        statusType: 'schedule',
        date: s.scheduledDate || s.createdAt,
      });
    });
    return [...map.values()]
      .filter((w) => w.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6);
  }, [fullAssessments, myProjects, fullSchedules]);

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
        {/* Page head — greeting + date + primary CTA, status pill on the right.
            Replaces the old 2-button + 4-square topbar, which duplicated the
            sidebar nav exactly. */}
        <div className="engdas-page-head">
          <div className="engdas-welcome-content">
            <div className="engdas-welcome-greeting-wrapper">
              <span className="engdas-welcome-icon">
                <FaSolarPanel />
              </span>
              <div className="engdas-welcome-text">
                <h1 className="engdas-welcome-greeting">{greeting}, {firstName}</h1>
                <p className="engdas-welcome-subtitle">{todayLabel}</p>
              </div>
            </div>
            <div className="engdas-welcome-actions">
              <Link to="/app/engineer/assessment" className="btn-primary-engdas">
                View Assessments
              </Link>
              <Link to="/app/engineer/schedule" className="btn-secondary-engdas">
                My Schedule
              </Link>
              <div className="engdas-quick-actions">
                <span className="engdas-squares-caption">Quick Actions</span>
                <Link to="/app/engineer/assessment" className="engdas-square-btn accent-icon--purple" title="My Assessments" aria-label="My Assessments">
                  <FaClipboardCheck />
                </Link>
                <Link to="/app/engineer/schedule" className="engdas-square-btn accent-icon--blue" title="My Schedule" aria-label="My Schedule">
                  <FaCalendarCheck />
                </Link>
                <Link to="/app/engineer/project" className="engdas-square-btn accent-icon--brand" title="My Projects" aria-label="My Projects">
                  <FaSolarPanel />
                </Link>
                <Link to="/app/engineer/device" className="engdas-square-btn accent-icon--green" title="My Devices" aria-label="My Devices">
                  <FaMicrochip />
                </Link>
              </div>
            </div>
          </div>
          <div className="engdas-topbar-right">
            {stats.pendingTasks > 0 ? (
              <div className="engdas-inline-alert">
                <span className="engdas-inline-alert-icon accent-icon--amber">
                  <FaExclamationTriangle />
                </span>
                <strong className="engdas-inline-alert-text">{stats.pendingTasks} pending task{stats.pendingTasks === 1 ? '' : 's'}</strong>
                <a
                  href="#engdas-pending-tasks"
                  className="alert-action-engdas engdas-inline-alert-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('engdas-pending-tasks')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                >
                  View Tasks <FaArrowRight />
                </a>
              </div>
            ) : (
              <div className="engdas-caughtup-card">
                <span className="engdas-inline-alert-icon accent-icon--green">
                  <FaCheckCircle />
                </span>
                <span className="engdas-caughtup-text">
                  <strong>All caught up!</strong>
                  <span>No pending tasks</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* KPI row — 4 compact cards. Accent colours come from
            .stat-icon--* classes so they follow the active theme. */}
        <div className="engdas-stats-grid">
          <div className="stat-card-engdas">
            <div className="stat-card-header-engdas">
              <div className="stat-icon-wrapper-engdas stat-icon--brand">
                <FaSolarPanel />
              </div>
              <Sparkline data={statTrends.projects} />
            </div>
            <div className="stat-content-engdas">
              <span className="stat-value-engdas">{stats.myProjects}</span>
              <span className="stat-label-engdas">Active Projects</span>
              <span className="stat-trend-engdas">Assigned to you</span>
            </div>
          </div>
          <div className="stat-card-engdas">
            <div className="stat-card-header-engdas">
              <div className="stat-icon-wrapper-engdas stat-icon--purple">
                <FaClipboardCheck />
              </div>
              <Sparkline data={statTrends.assessments} />
            </div>
            <div className="stat-content-engdas">
              <span className="stat-value-engdas">{stats.myAssessments}</span>
              <span className="stat-label-engdas">Pending Assessments</span>
              <span className="stat-trend-engdas">Need your attention</span>
            </div>
          </div>
          <div className="stat-card-engdas">
            <div className="stat-card-header-engdas">
              <div className="stat-icon-wrapper-engdas stat-icon--amber">
                <FaExclamationTriangle />
              </div>
              <Sparkline data={statTrends.tasks} />
            </div>
            <div className="stat-content-engdas">
              <span className="stat-value-engdas">{stats.pendingTasks}</span>
              <span className="stat-label-engdas">Pending Tasks</span>
              <span className="stat-trend-engdas">Require action</span>
            </div>
          </div>
          <Link to="/app/engineer/schedule" className="stat-card-engdas stat-card-link-engdas" title="Go to My Schedule" aria-label="Go to My Schedule">
            <div className="stat-card-header-engdas">
              <div className="stat-icon-wrapper-engdas stat-icon--blue">
                <FaCalendarCheck />
              </div>
              <Sparkline data={statTrends.schedules} />
            </div>
            <div className="stat-content-engdas">
              <span className="stat-value-engdas">{stats.mySchedules}</span>
              <span className="stat-label-engdas">Upcoming Schedules</span>
              <span className="stat-trend-engdas">This week</span>
            </div>
          </Link>
        </div>

        {/* Needs your attention — the actionable content, promoted above the
            chart. Renders the pendingTasks list that was always fetched but
            never displayed, which also makes the "View Tasks" button work. */}
        <div className="engdas-row-layout">
          <div className="engdas-assessment-section">
            <div className="section-header-engdas">
              <h2 className="section-title-engdas">Active Assessment</h2>
              <Link to="/app/engineer/assessment" className="view-all-link-engdas">
                View All
                <FaChevronRight className="arrow-icon-engdas" />
              </Link>
            </div>

            {activeAssessment ? (
              <div className="assessment-card-engdas">
                <div className="assessment-header-engdas">
                  <span className="assessment-avatar-engdas">
                    {clientPhotoOf(activeAssessment.clientId) ? (
                      <img
                        src={clientPhotoOf(activeAssessment.clientId)}
                        alt=""
                        className="assessment-avatar-photo"
                        loading="lazy"
                        onError={(e) => { e.currentTarget.remove(); }}
                      />
                    ) : (
                      getInitials(`${activeAssessment.clientId?.contactFirstName || ''} ${activeAssessment.clientId?.contactLastName || ''}`)
                    )}
                  </span>
                  <div className="assessment-info-engdas">
                    <h3 className="assessment-name-engdas">
                      {activeAssessment.clientId?.contactFirstName} {activeAssessment.clientId?.contactLastName}
                    </h3>
                    <p className="assessment-reference-engdas">{activeAssessment.bookingReference}</p>
                  </div>
                </div>

                <div className="assessment-workflow">
                  <p className="assessment-workflow-label">Pre-Assessment Workflow</p>
                  <ol
                    className={`workflow-steps${workflow.cancelled ? ' is-cancelled' : ''}`}
                    style={{ '--done': `${(workflow.doneCount / (workflow.total - 1)) * 100}%` }}
                  >
                    {WORKFLOW_PHASES.map((phase, i) => {
                      const state = workflow.states[i];
                      return (
                        <li
                          key={phase.key}
                          title={phase.label}
                          className={`workflow-step is-${state}`}
                        >
                          <span className="workflow-node">
                            {state === 'done' ? <FaCheck aria-hidden="true" /> : <phase.Icon aria-hidden="true" />}
                          </span>
                          <span className="workflow-name">{phase.label}</span>
                          <span className="workflow-state">
                            {state === 'done' && '✓ Completed'}
                            {state === 'current' && '● In Progress'}
                            {state === 'pending' && '○ Not Started'}
                          </span>
                          <span className="sr-only-engdas">
                            {phase.label}: {state === 'done' ? 'completed' : state === 'current' ? 'in progress' : 'not started'}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                  <p className="workflow-overall">
                    Overall Progress: <strong>{workflow.pct}%</strong>
                  </p>
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

          <div className="engdas-pending-tasks-section" id="engdas-pending-tasks">
            <div className="section-header-engdas">
              <h2 className="section-title-engdas">Needs Your Attention</h2>
              <span className="engdas-chart-sub">
                {pendingTasks.length > 0 ? `${pendingTasks.length} item${pendingTasks.length === 1 ? '' : 's'}` : 'Nothing outstanding'}
              </span>
            </div>

            {pendingTasks.length > 0 ? (
              <div className="pending-card-engdas">
                <div className="pending-tasks-list">
                  {pendingTasks.map((task) => (
                    <div
                      key={`${task.type}-${task.id}`}
                      className="pending-task-item"
                      title={`${task.title} — ${task.reference}`}
                    >
                      <span className="task-item-icon">
                        {task.type === 'deploy_device' ? <FaMicrochip />
                          : task.type === 'analyze_data' ? <FaSolarPanel />
                          : <FaClipboardList />}
                      </span>
                      <span className="task-item-content">
                        <span className="task-item-title">{task.title}</span>
                        <span className="task-item-ref">{task.reference} &middot; {formatDate(task.date)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="pending-card-engdas is-clear">
                <div className="pending-clear-engdas">
                  <span className="pending-clear-icon accent-icon--green">
                    <FaCheckCircle />
                  </span>
                  <strong>All caught up</strong>
                  <span>No assessments or projects are waiting on you</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* This week + Recent work */}
        <div className="engdas-charts-row">
          <div className="engdas-chart-card">
            <div className="section-header-engdas">
              <h2 className="section-title-engdas">7-Day Schedule</h2>
              <span className="engdas-chart-sub">Upcoming visits</span>
            </div>
            <div className="engdas-chart-body">
              <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                <BarChart data={weeklyScheduleData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="label" height={24} tickMargin={4} interval={0} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--chart-cursor)' }} />
                  <Bar dataKey="count" name="Visits" fill="var(--chart-bar)" radius={[6, 6, 2, 2]} maxBarSize={34} />
                </BarChart>
              </ResponsiveContainer>
              {weeklyScheduleData.reduce((sum, d) => sum + d.count, 0) === 0 && (
                <div className="engdas-chart-empty">No visits scheduled in the next 7 days</div>
              )}
            </div>
          </div>

          <div className="engdas-recent-card engdas-recent-side">
            <div className="section-header-engdas">
              <h2 className="section-title-engdas">Recent Work</h2>
              <span className="engdas-chart-sub">Latest assigned</span>
            </div>
            {recentWork.length > 0 ? (
              <div className="engdas-recent-list">
                {recentWork.map((w, index) => (
                  <React.Fragment key={`${w.type}-${w.id}`}>
                    <div className="engdas-recent-item">
                      <div className="engdas-recent-avatar">
                        {w.photo ? (
                          <img
                            src={w.photo}
                            alt={w.name}
                            className="engdas-recent-photo"
                            loading="lazy"
                            onError={(e) => { e.currentTarget.remove(); }}
                          />
                        ) : (
                          <span className={`activity-icon-wrapper-engdas ${getActivityAccent(w.type)}`}>
                            {getActivityIcon(w.type)}
                          </span>
                        )}
                      </div>
                      <div className="engdas-recent-info">
                        <span className="engdas-recent-name">{w.name}</span>
                        <span className="engdas-recent-meta">{w.meta} • {formatDate(w.date)}</span>
                      </div>
                      <div className="engdas-recent-status">
                        {getStatusBadge(w.status, w.statusType)}
                      </div>
                    </div>
                    {index < recentWork.length - 1 && <div className="activity-divider-engdas"></div>}
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <div className="empty-small-engdas">
                <p className="empty-text-engdas">No work assigned yet</p>
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

export default EngineerDashboard;