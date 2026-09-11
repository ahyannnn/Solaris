// pages/Admin/Project.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import {
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaChevronLeft,
  FaChevronRight,
  FaUserCog,
  FaCheck,
  FaChevronDown,
  FaSearch,
  FaSyncAlt,
  FaChartBar,
  FaWallet,
  FaImages,
  FaTimes
} from 'react-icons/fa';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import '../../styles/Admin/project.css';

// Recharts Imports
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

// Collect viewable site photos: the project's own photos, falling back
// to the linked pre-assessment's sitePhotos + site_photo attachments
// (deduplicated, populated URLs only).
const collectProjectPhotos = (project) => {
  if (!project) return [];
  const urls = [];
  const pushUrl = (u) => {
    if (typeof u === 'string' && u.trim() && !urls.includes(u.trim())) urls.push(u.trim());
  };
  if (Array.isArray(project.sitePhotos)) {
    project.sitePhotos.forEach((p) => {
      if (typeof p === 'string') pushUrl(p);
      else if (p && typeof p.url === 'string') pushUrl(p.url);
    });
  }
  if (urls.length === 0) {
    const pa = project.preAssessmentId;
    if (pa && typeof pa === 'object') {
      if (Array.isArray(pa.sitePhotos)) {
        pa.sitePhotos.forEach((p) => {
          if (typeof p === 'string') pushUrl(p);
          else if (p && typeof p.url === 'string') pushUrl(p.url);
        });
      }
      if (Array.isArray(pa.assessmentDocuments)) {
        pa.assessmentDocuments.forEach((doc) => {
          if (doc?.documentType !== 'site_photo') return;
          const f = doc.fileId;
          if (f && typeof f === 'object' && typeof f.url === 'string') pushUrl(f.url);
        });
      }
    }
  }
  return urls;
};

const ProjectManagement = () => {
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [photoViewer, setPhotoViewer] = useState(null); // { photos: [], index: 0 } | null
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [engineers, setEngineers] = useState([]);
  const [projectInvoices, setProjectInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 20 });
  const dropdownRef = useRef(null);
  const buttonRefs = useRef({});
  const [autoOpenAssignModal, setAutoOpenAssignModal] = useState(false);
  const [brokenPhotos, setBrokenPhotos] = useState(() => new Set());
  const [stats, setStats] = useState({
    total: 0, quoted: 0, approved: 0, inProgress: 0, completed: 0, cancelled: 0, totalRevenue: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    engineerId: '', assignNotes: '', newStatus: '', statusNotes: ''
  });

  // CHART DATA STATES
  const [projectStatusChartData, setProjectStatusChartData] = useState([]);
  // Full project list for the workload chart (paginated table list is separate)
  const [allProjectsList, setAllProjectsList] = useState([]);

  // ============================================
  // COMPACT CURRENCY FORMATTER - ALL SIZES
  // ============================================
  const formatCompactCurrency = (amount) => {
    const value = Number(amount) || 0;

    // Return empty string for zero
    if (value === 0) return '';

    const absValue = Math.abs(value);

    // Billions (1,000,000,000+)
    if (absValue >= 1000000000) {
      return `₱${(value / 1000000000).toFixed(1)}B`;
    }

    // Millions (1,000,000 - 999,999,999)
    if (absValue >= 1000000) {
      return `₱${(value / 1000000).toFixed(1)}M`;
    }

    // Thousands (1,000 - 999,999)
    if (absValue >= 1000) {
      return `₱${(value / 1000).toFixed(0)}k`;
    }

    // Less than 1,000
    return `₱${value.toFixed(0)}`;
  };

  // Full currency formatter for tooltips and table
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const openPhotoViewer = (photos, index) => {
    if (!photos || photos.length === 0) return;
    setPhotoViewer({ photos, index: index || 0 });
  };

  const closePhotoViewer = () => setPhotoViewer(null);

  const stepPhotoViewer = (dir) => {
    setPhotoViewer((prev) => {
      if (!prev) return prev;
      const next = prev.index + dir;
      if (next < 0 || next >= prev.photos.length) return prev;
      return { ...prev, index: next };
    });
  };

  // CHART 2 DATA: Engineer workload — active (non-completed, non-cancelled)
  // projects per engineer, plus an Unassigned bar for the assign backlog.
  // useMemo so it stays correct regardless of fetch order (engineers vs projects).
  const workloadData = useMemo(() => {
    const list = allProjectsList || [];
    const engMap = {};
    (engineers || []).forEach((eng) => {
      engMap[String(eng._id)] = {
        name: eng.fullName || [eng.firstName, eng.lastName].filter(Boolean).join(' ') || eng.email || 'Engineer',
        active: 0
      };
    });
    let unassigned = 0;
    list.forEach((project) => {
      if (project.status === 'completed' || project.status === 'cancelled') return;
      const assigned = project.assignedEngineerId;
      const engId = assigned && typeof assigned === 'object' ? assigned._id : assigned;
      if (!engId) {
        unassigned++;
        return;
      }
      const key = String(engId);
      if (!engMap[key]) {
        const popName = assigned && typeof assigned === 'object'
          ? (assigned.fullName || [assigned.firstName, assigned.lastName].filter(Boolean).join(' ') || null)
          : null;
        engMap[key] = { name: popName || 'Unknown', active: 0 };
      }
      engMap[key].active++;
    });
    const rows = Object.values(engMap).sort((a, b) => b.active - a.active);
    rows.unshift({ name: 'Unassigned', active: unassigned, isUnassigned: true });
    return rows;
  }, [allProjectsList, engineers]);

  // Real-time table updates (no page refresh): refetch on socket event and
  // render only the complete server response, so rows never flash partial
  // (N/A) data from the raw payload. Cleaned up on unmount.
  useRealtimeTable(['projects', 'solar-invoices'], () => {
    fetchProjects();
    fetchStats();
  });

  useEffect(() => {
    fetchProjects();
    fetchEngineers();
    fetchStats();

    const handleClickOutside = (event) => {
      // Ignore taps on toggles/menus — their onClick owns open/close.
      // Otherwise mousedown pre-closes and the following click re-opens.
      if (event.target.closest?.('[data-action-menu],[data-action-toggle]')) return;
      setOpenDropdownId(null);
    };

    const handleScroll = () => {
      setOpenDropdownId(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
    // Fetch-all once (filter/sort/paginate client-side so needs-action
    // rows stay on top across ALL pages)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch the full list (project volumes are small); filtering, priority
  // sorting and pagination all happen client-side below.
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 999 }
      });
      setProjects(response.data.projects || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching projects:', error);
      showToast('Failed to load projects', 'error');
      setLoading(false);
    }
  };

  const fetchEngineers = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users?role=engineer`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEngineers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching engineers:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = sessionStorage.getItem('token');

      const statsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = statsResponse.data.stats || {
        total: 0, quoted: 0, approved: 0, inProgress: 0, completed: 0, cancelled: 0, totalRevenue: 0
      };
      setStats(data);

      // CHART 1: Project Status Overview
      const statusData = [
        { name: 'Quoted', value: data.quoted || 0 },
        { name: 'Approved', value: data.approved || 0 },
        { name: 'Initial Paid', value: data.initialPaid || 0 },
        { name: 'In Progress', value: data.inProgress || 0 },
        { name: 'Progress Paid', value: data.progressPaid || 0 },
        { name: 'Completed', value: data.completed || 0 }
      ];

      setProjectStatusChartData(statusData);

      // CHART 2 DATA: full project list for the engineer workload chart
      // (grouped in a useMemo with the engineers list, so fetch order is safe)
      const projectsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 999 }
      });

      setAllProjectsList(projectsResponse.data.projects || []);

    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchProjectInvoices = async (projectId) => {
    try {
      setLoadingInvoices(true);
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/solar-invoices?projectId=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjectInvoices(response.data.invoices || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const updateProjectStatus = async () => {
    if (!selectedProject || !formData.newStatus) return;
    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/projects/${selectedProject._id}/status`,
        { status: formData.newStatus, notes: formData.statusNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast(`Project status updated to ${formData.newStatus}`, 'success');
      setShowStatusModal(false);

      // Store the project reference before clearing
      const projectToAssign = selectedProject;

      setSelectedProject(null);
      setFormData({ ...formData, newStatus: '', statusNotes: '' });
      setOpenDropdownId(null);

      // Check if we need to auto-open assign modal (for 'approved' status)
      if (formData.newStatus === 'approved') {
        // Fetch engineers first if not loaded
        if (engineers.length === 0) {
          await fetchEngineers();
        }
        // Set the selected project and open assign modal
        setSelectedProject(projectToAssign);
        setShowAssignModal(true);
        setAutoOpenAssignModal(false); // Reset flag
      }

      fetchProjects();
      fetchStats();
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Failed to update status', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const assignEngineer = async () => {
    if (!selectedProject || !formData.engineerId) return;

    if (selectedProject.assignedEngineerId) {
      showToast('This project already has an assigned engineer', 'error');
      setShowAssignModal(false);
      setSelectedProject(null);
      setFormData({ ...formData, engineerId: '', assignNotes: '' });
      setOpenDropdownId(null);
      return;
    }

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/projects/${selectedProject._id}/assign-engineer`,
        { engineerId: formData.engineerId, notes: formData.assignNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast('Engineer assigned successfully', 'success');
      setShowAssignModal(false);
      setSelectedProject(null);
      setFormData({ ...formData, engineerId: '', assignNotes: '' });
      setOpenDropdownId(null);
      fetchProjects();
      fetchStats();
    } catch (error) {
      console.error('Error assigning engineer:', error);
      showToast('Failed to assign engineer', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDropdownClick = (event, projectId, forceFlip = false) => {
    event.stopPropagation();
    const buttonRect = event.currentTarget.getBoundingClientRect();
    const project = projects.find(p => p._id === projectId);
    const actionCount = project ? getAvailableActions(project).length : 4;
    const estimatedHeight = Math.min(300, actionCount * 44 + 12);
    const spaceBelow = window.innerHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;
    // Bottom cards always flip upward; others auto-flip only when cut off.
    const shouldFlip = forceFlip || (spaceBelow < estimatedHeight + 10 && spaceAbove > spaceBelow);
    setDropdownPosition({
      top: shouldFlip ? Math.max(10, buttonRect.top - estimatedHeight - 5) : buttonRect.bottom + 5,
      right: window.innerWidth - buttonRect.right - 10,
      maxHeight: shouldFlip ? Math.max(120, Math.min(300, spaceAbove - 16)) : Math.min(300, Math.max(120, spaceBelow - 10)),
    });
    setOpenDropdownId((prev) => (prev === projectId ? null : projectId));
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status) => {
    // Normalize status to lowercase for consistent comparison
    const statusLower = status?.toLowerCase() || '';

    const badges = {
      'quoted': <span className="status-badge-projectmanagement quoted">Quoted</span>,
      'approved': <span className="status-badge-projectmanagement approved">Approved</span>,
      'initial_paid': <span className="status-badge-projectmanagement initial-paid">Initial Paid</span>,
      'full_paid': <span className="status-badge-projectmanagement full-paid">Full Paid</span>,
      'in_progress': <span className="status-badge-projectmanagement in-progress">In Progress</span>,
      'progress_paid': <span className="status-badge-projectmanagement progress-paid">Progress Paid</span>,
      'completed': <span className="status-badge-projectmanagement completed">Completed</span>,
      'cancelled': <span className="status-badge-projectmanagement cancelled">Cancelled</span>
    };

    return badges[statusLower] || <span className="status-badge-projectmanagement">{status}</span>;
  };

  // Row priority: needs-action rows first (mirrors page actions and the
  // sidebar badge counts). 1 quoted (approve) → 2 approved/initial_paid
  // without engineer (assign) → 3 initial_paid (record progress) → 4 rest
  // (in_progress etc. are completed by the engineer, not the admin;
  // completed, cancelled, view-only). Newest kept within each group.
  const getAdminProjectPriority = (project) => {
    const s = project.status?.toLowerCase() || '';
    const hasEng = !!project.assignedEngineerId;
    if (s === 'quoted') return 1;
    if ((s === 'approved' || s === 'initial_paid') && !hasEng) return 2;
    if (s === 'initial_paid') return 3;
    return 4;
  };

  const getProjectTime = (project) => {
    const t = new Date(project.createdAt).getTime();
    return Number.isNaN(t) ? 0 : t;
  };

  const filteredProjects = projects
    .filter(project => filter === 'all' || project.status === filter)
    .filter(project => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return project.projectName?.toLowerCase().includes(searchLower) ||
        project.projectReference?.toLowerCase().includes(searchLower) ||
        project.clientId?.contactFirstName?.toLowerCase().includes(searchLower) ||
        project.clientId?.contactLastName?.toLowerCase().includes(searchLower);
      // Stable sort: priority groups first, newest kept within each group.
    })
    .sort((a, b) =>
      getAdminProjectPriority(a) - getAdminProjectPriority(b) ||
      getProjectTime(b) - getProjectTime(a)
    );

  const totalItems = filteredProjects.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const pagedProjects = filteredProjects.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage
  );

  const getAvailableActions = (project) => {
    const actions = [
      {
        label: 'View Details',
        icon: <FaEye />,
        action: () => {
          setSelectedProject(project);
          fetchProjectInvoices(project._id);
          setShowDetailModal(true);
          setOpenDropdownId(null);
        },
        color: 'primary'
      }
    ];

    // FIX: Add Approve action for quoted projects (case insensitive)
    const statusLower = project.status?.toLowerCase() || '';

    if (statusLower === 'quoted') {
      actions.push({
        label: 'Approve Project',
        icon: <FaCheck />,
        action: () => {
          setSelectedProject(project);
          setFormData({ ...formData, newStatus: 'approved' });
          setAutoOpenAssignModal(true); // Set flag to auto-open assign modal
          setShowStatusModal(true);
          setOpenDropdownId(null);
        },
        color: 'success'
      });
    }

    const hasAssignedEngineer = !!project.assignedEngineerId;

    if (
      (statusLower === 'approved' || statusLower === 'initial_paid') &&
      !hasAssignedEngineer
    ) {
      actions.push(
        {
          label: 'Assign Engineer',
          icon: <FaUserCog />,
          action: () => {
            setSelectedProject(project);
            setShowAssignModal(true);
            setOpenDropdownId(null);
          },
          color: 'primary'
        }
      );
    }

    // NOTE: No "Mark as Completed" here by design — only the assigned
    // engineer marks completion (via their Update flow with photo proof).

    // FIX: Only show Cancel Project if status is NOT completed or cancelled
    if (statusLower !== 'cancelled' && statusLower !== 'completed') {
      actions.push(
        {
          label: 'Cancel Project',
          icon: <FaTimesCircle />,
          action: () => {
            setSelectedProject(project);
            setFormData({ ...formData, newStatus: 'cancelled' });
            setShowStatusModal(true);
            setOpenDropdownId(null);
          },
          color: 'danger'
        }
      );
    }

    return actions;
  };

  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(safeCurrentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, safeCurrentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  // ============================================
  // CHART TOOLTIPS - Uses CSS variables for theming
  // ============================================
  const StatusTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="recharts-custom-tooltip-projectmanagement">
          <p className="tooltip-label-projectmanagement">{label}</p>
          <p className="tooltip-item-projectmanagement">
            Projects: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  const WorkloadTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const count = payload[0].value || 0;
      return (
        <div className="recharts-custom-tooltip-projectmanagement">
          <p className="tooltip-label-projectmanagement">{label}</p>
          <p className="tooltip-item-projectmanagement">
            {count} active project{count !== 1 ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  const SkeletonLoader = () => (
    <div className="project-management">
      <div className="project-header-projectmanagement">
        <div className="skeleton-title-projectmanagement"></div>
        <div className="skeleton-subtitle-projectmanagement"></div>
      </div>
      <div className="project-charts-row-projectmanagement">
        <div className="skeleton-chart-projectmanagement"></div>
        <div className="skeleton-chart-projectmanagement"></div>
      </div>
      <div className="project-tabs-projectmanagement">
        <div className="skeleton-tab-projectmanagement"></div>
      </div>
      <div className="project-filters-projectmanagement">
        <div className="skeleton-select-projectmanagement"></div>
        <div className="skeleton-search-projectmanagement"></div>
      </div>
      <div className="project-table-container-projectmanagement">
        <div className="skeleton-table-projectmanagement"></div>
      </div>
    </div>
  );

  if (loading && projects.length === 0) return <SkeletonLoader />;

  return (
    <>
      <Helmet><title>Project Management | Admin | Salfer Engineering</title></Helmet>

      <div className="project-management">
        {/* --- Minimalist Header (Empty) --- */}


        {/* ============================================ */}
        {/* CHARTS ROW                                   */}
        {/* ============================================ */}
        <div className="project-charts-row-projectmanagement">
          {/* CHART 1: Project Status Overview */}
          <div className="project-chart-card-projectmanagement">
            <div className="project-chart-header-projectmanagement">
              <h3>Project Status Overview</h3>
              <span className="project-chart-period-projectmanagement">Current Project Status</span>
            </div>
            <div className="project-chart-wrapper-projectmanagement">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={projectStatusChartData}
                  layout="vertical"
                  margin={{ top: 10, right: 10, left: 20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorStatus" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="5%" stopColor="#F39C12" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#F39C12" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="var(--border-color, #EEF0ED)" />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-secondary, #17212B)', fontSize: 11, fontWeight: 500 }}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-secondary, #17212B)', fontSize: 11, fontWeight: 500 }}
                    width={100}
                  />
                  <Tooltip content={<StatusTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                  <Bar
                    dataKey="value"
                    fill="url(#colorStatus)"
                    radius={[0, 4, 4, 0]}
                    barSize={28}
                    label={{
                      position: 'right',
                      fill: 'var(--text-primary, #17212B)',
                      fontSize: 12,
                      fontWeight: 600,
                      formatter: (value) => value > 0 ? value : ''
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CHART 2: Engineer Workload */}
          <div className="project-chart-card-projectmanagement">
            <div className="project-chart-header-projectmanagement">
              <h3>Engineer Workload</h3>
              <span className="project-chart-period-projectmanagement">Active Projects per Engineer</span>
            </div>
            <div className="project-chart-wrapper-projectmanagement">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={workloadData}
                  layout="vertical"
                  margin={{ top: 10, right: 10, left: 20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorWorkload" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.2} />
                    </linearGradient>
                    <linearGradient id="colorUnassigned" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="var(--border-color, #EEF0ED)" />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-secondary, #17212B)', fontSize: 11, fontWeight: 500 }}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-secondary, #17212B)', fontSize: 11, fontWeight: 500 }}
                    width={110}
                  />
                  <Tooltip content={<WorkloadTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                  <Bar
                    dataKey="active"
                    radius={[0, 4, 4, 0]}
                    barSize={28}
                    label={{
                      position: 'right',
                      fill: 'var(--text-primary, #17212B)',
                      fontSize: 12,
                      fontWeight: 600,
                      formatter: (value) => value > 0 ? value : ''
                    }}
                  >
                    {workloadData.map((entry, index) => (
                      <Cell key={index} fill={entry.isUnassigned ? 'url(#colorUnassigned)' : 'url(#colorWorkload)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* TOOLBAR                                      */}
        {/* ============================================ */}
        <div className="project-tabs-projectmanagement"></div>

        <div className="project-filters-projectmanagement">
          <div className="search-group-projectmanagement">
            <FaSearch className="search-icon-projectmanagement" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="filter-group-projectmanagement">
            <select value={filter} onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">All Status</option>
              <option value="quoted">Quoted</option>
              <option value="approved">Approved</option>
              <option value="initial_paid">Initial Paid</option>
              <option value="in_progress">In Progress</option>
              <option value="progress_paid">Progress Paid</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <FaChevronDown className="select-arrow-projectmanagement" />
          </div>
          <button className="refresh-btn-projectmanagement" onClick={() => { fetchProjects(); fetchStats(); }}>
            <FaSyncAlt className={loading ? 'spinning-projectmanagement' : ''} /> Refresh
          </button>
        </div>

        {/* ============================================ */}
        {/* TABLE                                        */}
        {/* ============================================ */}
        <div className="project-table-container-projectmanagement">
          <div className="table-wrapper-projectmanagement">
            <table className="project-table-projectmanagement">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Project</th>
                  <th>Size</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Status</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.length === 0 ? (
                  <tr><td colSpan="7" data-label="" className="empty-state-projectmanagement">No projects found</td></tr>
                ) : (
                  pagedProjects.map((project, idx) => {
                    const actions = getAvailableActions(project);
                    const isOpen = openDropdownId === project._id;

                    return (
                      <tr key={project._id}>
                        <td data-label="Client" className="client-cell-projectmanagement">
                          <div className="client-profile-projectmanagement">
                            {project.clientId?.userId?.photoURL && !brokenPhotos.has(project._id) ? (
                              <img
                                src={project.clientId.userId.photoURL}
                                alt=""
                                className="client-photo-projectmanagement"
                                onError={() => setBrokenPhotos((prev) => new Set(prev).add(project._id))}
                              />
                            ) : (
                              <span className="client-initials-projectmanagement">
                                {((project.clientId?.contactFirstName?.[0] || '') + (project.clientId?.contactLastName?.[0] || '') || '—').toUpperCase()}
                              </span>
                            )}
                            <span className="client-name-projectmanagement">
                              {project.clientId?.contactFirstName} {project.clientId?.contactLastName}
                              <small>{project.clientId?.contactNumber || 'N/A'}</small>
                            </span>
                          </div>
                        </td>
                        <td data-label="Project" className="project-cell-projectmanagement">
                          <div className="project-name-projectmanagement">{project.projectName}</div>
                          <div className="project-ref-projectmanagement">{project.projectReference}</div>
                        </td>
                        <td data-label="Size">{project.systemSize} kW</td>
                        <td data-label="Total" className="amount-projectmanagement">{formatCurrency(project.totalCost)}</td>
                        <td data-label="Paid" className="amount-projectmanagement">{formatCurrency(project.amountPaid)}</td>
                        <td data-label="Status">{getStatusBadge(project.status)}</td>
                        <td data-label="Actions" style={{ textAlign: 'center', position: 'relative' }}>
                          <div className="action-dropdown-container-projectmanagement">
                            <button
                              className="action-dropdown-toggle-projectmanagement"
                              data-action-toggle
                              ref={el => buttonRefs.current[project._id] = el}
                              onClick={(e) => handleDropdownClick(e, project._id, idx >= pagedProjects.length - 2)}
                            >
                              Action <FaChevronDown className={`dropdown-arrow-projectmanagement ${isOpen ? 'open' : ''}`} />
                            </button>

                            {isOpen && (
                              <div
                                className="action-dropdown-menu-projectmanagement"
                                data-action-menu
                                ref={dropdownRef}
                                style={{
                                  position: 'fixed',
                                  top: dropdownPosition.top,
                                  right: dropdownPosition.right,
                                  zIndex: 9999,
                                  maxHeight: dropdownPosition.maxHeight,
                                }}
                              >
                                {actions.map((action, idx) => (
                                  <button
                                    key={idx}
                                    className={`dropdown-item-projectmanagement ${action.color || ''}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      action.action();
                                    }}
                                  >
                                    {action.icon} <span>{action.label}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="pagination-projectmanagement">
            <div className="pagination-info-projectmanagement">
              Showing {startItem} to {endItem} of {totalItems} entries
            </div>
            <div className="pagination-controls-projectmanagement">
              <button
                className="page-btn-projectmanagement"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={safeCurrentPage === 1}
              >
                <FaChevronLeft /> Previous
              </button>

              {getPageNumbers().map(page => (
                <button
                  key={page}
                  className={`page-number-projectmanagement ${safeCurrentPage === page ? 'active-projectmanagement' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

              <button
                className="page-btn-projectmanagement"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={safeCurrentPage === totalPages}
              >
                Next <FaChevronRight />
              </button>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* MODALS                                       */}
        {/* ============================================ */}

        {/* Detail Modal */}
        {showDetailModal && selectedProject && (
          <div className="modal-overlay-projectmanagement" onClick={() => setShowDetailModal(false)}>
            <div className="modal-projectmanagement detail-modal-projectmanagement" onClick={e => e.stopPropagation()}>
              <div className="modal-header-projectmanagement">
                <h3>Project Details</h3>
              </div>
              <div className="modal-body-projectmanagement">
                <div className="detail-grid-projectmanagement">
                  {/* Left Column */}
                  <div className="detail-column-projectmanagement">
                    <div className="detail-section-projectmanagement">
                      <h4>Project</h4>
                      <p><strong>Name:</strong> {selectedProject.projectName}</p>
                      <p><strong>Ref:</strong> {selectedProject.projectReference}</p>
                      <p><strong>Status:</strong> {getStatusBadge(selectedProject.status)}</p>
                      {selectedProject.sourceType && (
                        <p><strong>Source:</strong> {selectedProject.sourceType}</p>
                      )}
                    </div>
                    <div className="detail-section-projectmanagement">
                      <h4>Client</h4>
                      <p><strong>Name:</strong> {selectedProject.clientId?.contactFirstName} {selectedProject.clientId?.contactLastName}</p>
                      <p><strong>Contact:</strong> {selectedProject.clientId?.contactNumber}</p>
                      <p><strong>Email:</strong> {selectedProject.clientId?.userId?.email}</p>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="detail-column-projectmanagement">
                    <div className="detail-section-projectmanagement">
                      <h4>System</h4>
                      <p><strong>Size:</strong> {selectedProject.systemSize} kWp</p>
                      <p><strong>Type:</strong> {selectedProject.systemType}</p>
                      {selectedProject.panelsNeeded && (
                        <p><strong>Panels Needed:</strong> {selectedProject.panelsNeeded}</p>
                      )}
                    </div>
                    <div className="detail-section-projectmanagement">
                      <h4>Financial</h4>
                      <p><strong>Total:</strong> {formatCurrency(selectedProject.totalCost)}</p>
                      <p><strong>Paid:</strong> {formatCurrency(selectedProject.amountPaid)}</p>
                      <p><strong>Balance:</strong> {formatCurrency(selectedProject.balance)}</p>
                      {selectedProject.paymentPreference && (
                        <p><strong>Payment Preference:</strong> {selectedProject.paymentPreference}</p>
                      )}
                    </div>
                    {selectedProject.assignedEngineerId && (
                      <div className="detail-section-projectmanagement">
                        <h4>Assigned Engineer</h4>
                        <p><strong>Name:</strong> {selectedProject.assignedEngineerId.firstName} {selectedProject.assignedEngineerId.lastName}</p>
                        <p><strong>Email:</strong> {selectedProject.assignedEngineerId.email}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Equipment Breakdown Section - Supports BOTH Pre-Assessment AND Free Quote */}
                {(() => {
                  // Check both sources for equipment breakdown
                  const preAssessmentEquipment = selectedProject.preAssessmentId?.quotation?.systemDetails?.equipmentBreakdown;
                  const freeQuoteEquipment = selectedProject.quotationDetails?.equipmentBreakdown
                    || selectedProject.sourceId?.quotationDetails?.equipmentBreakdown;
                  const equipment = preAssessmentEquipment || freeQuoteEquipment;

                  if (!equipment) return null;

                  return (
                    <div className="detail-section-projectmanagement">
                      <h4>Equipment Breakdown</h4>
                      <table className="payment-schedule-table">
                        <thead>
                          <tr>
                            <th>Category</th>
                            <th>Item</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const rows = [];

                            // Process each category
                            Object.entries(equipment).forEach(([category, data]) => {
                              // Skip empty categories
                              if (!data) return;

                              // Check if category has 'items' array (like electricalComponents, cables, etc.)
                              if (data.items && Array.isArray(data.items) && data.items.length > 0) {
                                data.items.forEach((item, index) => {
                                  rows.push(
                                    <tr key={`${category}-${index}`}>
                                      <td className="payment-type-cell">{index === 0 ? category.replace(/([A-Z])/g, ' $1').trim() : ''}</td>
                                      <td>{item.name || 'Item'}</td>
                                      <td>{item.quantity || 1}</td>
                                      <td>{formatCurrency(item.price || item.unitPrice || 0)}</td>
                                      <td>{formatCurrency(item.total || (item.quantity || 1) * (item.price || item.unitPrice || 0))}</td>
                                    </tr>
                                  );
                                });
                              }
                              // Direct equipment items (panels, inverter, battery, mountingStructure)
                              else if (data.name && data.quantity !== undefined) {
                                // Only show if quantity > 0
                                if (data.quantity > 0) {
                                  rows.push(
                                    <tr key={category}>
                                      <td className="payment-type-cell">{category.replace(/([A-Z])/g, ' $1').trim()}</td>
                                      <td>{data.name}</td>
                                      <td>{data.quantity}</td>
                                      <td>{formatCurrency(data.unitPrice || data.price || 0)}</td>
                                      <td>{formatCurrency(data.total || (data.quantity * (data.unitPrice || data.price || 0)))}</td>
                                    </tr>
                                  );
                                }
                              }
                            });

                            return rows.length > 0 ? rows : (
                              <tr>
                                <td colSpan="5" style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
                                  No equipment items found
                                </td>
                              </tr>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                {(() => {
                  const photos = collectProjectPhotos(selectedProject);
                  if (photos.length === 0) return null;
                  return (
                    <div className="detail-section-projectmanagement">
                      <h4><FaImages /> Site Photos ({photos.length})</h4>
                      <div className="site-photos-grid-projectmanagement">
                        {photos.slice(0, 6).map((photo, idx) => (
                          <div key={idx} className="site-photo-item-projectmanagement" onClick={() => openPhotoViewer(photos, idx)}>
                            <img src={photo} alt={`Site photo ${idx + 1}`} loading="lazy" onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=No+Image'; }} />
                          </div>
                        ))}
                        {photos.length > 6 && (
                          <div className="site-photo-item-projectmanagement more-photos" onClick={() => openPhotoViewer(photos, 0)}>
                            <div className="more-photos-overlay"><FaImages /><span>+{photos.length - 6} more</span></div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div className="modal-actions-projectmanagement">
                <button className="cancel-btn-projectmanagement" onClick={() => setShowDetailModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Engineer Modal */}
        {showAssignModal && selectedProject && (
          <div className="modal-overlay-projectmanagement" onClick={() => setShowAssignModal(false)}>
            <div className="modal-projectmanagement assign-engineer-modal-projectmanagement" onClick={e => e.stopPropagation()}>
              <div className="modal-header-projectmanagement">
                <h3>Assign Engineer</h3>
              </div>
              <div className="modal-body-projectmanagement">
                <div className="detail-row-projectmanagement">
                  <span>Project:</span>
                  <strong>{selectedProject.projectName}</strong>
                </div>

                <div className="form-group-projectmanagement">
                  <label>Select Engineer</label>
                  <div className="engineer-grid-projectmanagement">
                    {engineers.length === 0 ? (
                      <div className="no-engineers-projectmanagement">No engineers available</div>
                    ) : (
                      engineers.map(eng => (
                        <div
                          key={eng._id}
                          className={`engineer-card-projectmanagement ${formData.engineerId === eng._id ? 'selected-projectmanagement' : ''}`}
                          onClick={() => setFormData({ ...formData, engineerId: eng._id })}
                        >
                          <div className="engineer-avatar-projectmanagement">
                            <span>{eng.fullName?.charAt(0) || 'E'}</span>
                          </div>
                          <div className="engineer-info-projectmanagement">
                            <div className="engineer-name-projectmanagement">{eng.fullName || 'Engineer'}</div>
                            <div className="engineer-email-projectmanagement">{eng.email}</div>
                          </div>
                          {formData.engineerId === eng._id && (
                            <div className="engineer-selected-badge-projectmanagement">
                              <FaCheckCircle />
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="form-group-projectmanagement">
                  <label>Notes</label>
                  <textarea
                    rows="3"
                    value={formData.assignNotes}
                    onChange={(e) => setFormData({ ...formData, assignNotes: e.target.value })}
                    placeholder="Add any special instructions or notes..."
                  />
                </div>
              </div>
              <div className="modal-actions-projectmanagement">
                <button
                  className="cancel-btn-projectmanagement"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedProject(null);
                    setAutoOpenAssignModal(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="assign-btn-projectmanagement"
                  onClick={assignEngineer}
                  disabled={!formData.engineerId || isSubmitting}
                >
                  {isSubmitting ? 'Assigning...' : 'Assign Engineer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Modal - FIXED */}
        {showStatusModal && selectedProject && (
          <div className="modal-overlay-projectmanagement" onClick={() => setShowStatusModal(false)}>
            <div className="modal-projectmanagement" onClick={e => e.stopPropagation()}>
              <div className="modal-header-projectmanagement">
                <h3>Update Status</h3>
              </div>
              <div className="modal-body-projectmanagement">
                <p><strong>Project:</strong> {selectedProject.projectName}</p>
                <p><strong>Current:</strong> {getStatusBadge(selectedProject.status)}</p>
                <div className="form-group-projectmanagement">
                  <label>New Status</label>
                  <select
                    value={formData.newStatus}
                    onChange={(e) => setFormData({ ...formData, newStatus: e.target.value })}
                  >
                    <option value="">Select...</option>

                    {/* FIX: Check for 'quoted' (case insensitive) */}
                    {selectedProject.status?.toLowerCase() === 'quoted' && (
                      <option value="approved">Approve</option>
                    )}

                    {/* NOTE: No 'Complete' option by design — only the assigned
                        engineer marks completion (with photo proof). */}

                    {/* FIX: Only show Cancel if not completed or cancelled */}
                    {selectedProject.status?.toLowerCase() !== 'cancelled' &&
                      selectedProject.status?.toLowerCase() !== 'completed' && (
                        <option value="cancelled">Cancel</option>
                      )}
                  </select>
                </div>
                <div className="form-group-projectmanagement">
                  <label>Notes</label>
                  <textarea
                    rows="3"
                    value={formData.statusNotes}
                    onChange={(e) => setFormData({ ...formData, statusNotes: e.target.value })}
                    placeholder="Add notes about this status change..."
                  />
                </div>
              </div>
              <div className="modal-actions-projectmanagement">
                <button className="cancel-btn-projectmanagement" onClick={() => setShowStatusModal(false)}>Cancel</button>
                <button
                  className="approve-btn-projectmanagement"
                  onClick={updateProjectStatus}
                  disabled={!formData.newStatus || isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        )}

        {photoViewer && (
          <div className="site-photo-viewer-overlay-projectmanagement" onClick={closePhotoViewer}>
            <div className="site-photo-viewer-content-projectmanagement" onClick={(e) => e.stopPropagation()}>
              <button className="site-photo-viewer-close-projectmanagement" onClick={closePhotoViewer}><FaTimes /></button>
              <div className="site-photo-viewer-main-projectmanagement">
                <img src={photoViewer.photos[photoViewer.index]} alt={`Site photo ${photoViewer.index + 1}`} onError={(e) => { e.target.src = 'https://via.placeholder.com/800x600?text=Image+Not+Available'; }} />
                {photoViewer.photos.length > 1 && (
                  <>
                    <button className="site-photo-viewer-nav-projectmanagement prev" onClick={() => stepPhotoViewer(-1)} disabled={photoViewer.index === 0}><FaChevronLeft /></button>
                    <button className="site-photo-viewer-nav-projectmanagement next" onClick={() => stepPhotoViewer(1)} disabled={photoViewer.index === photoViewer.photos.length - 1}><FaChevronRight /></button>
                  </>
                )}
              </div>
              <div className="site-photo-viewer-counter-projectmanagement">{photoViewer.index + 1} / {photoViewer.photos.length}</div>
            </div>
          </div>
        )}

        <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      </div>
    </>
  );
};

export default ProjectManagement;