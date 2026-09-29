// pages/Admin/Reports.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import {
  FaFilePdf,
  FaFileExcel,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaExternalLinkAlt,
  FaSearch,
  FaRedo,
  FaInbox
} from 'react-icons/fa';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import '../../styles/Admin/reports.css';

const PAGE_SIZE = 10;

// Windowed page numbers, e.g. 1 … 4 [5] 6 … 12
const getPageNumbers = (currentPage, totalPages) => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages = new Set([1, totalPages, currentPage]);
  if (currentPage - 1 > 1) pages.add(currentPage - 1);
  if (currentPage + 1 < totalPages) pages.add(currentPage + 1);
  return [...pages].sort((a, b) => a - b);
};

// Helper function to convert assessment status string to number
const getStatusNumber = (statusString) => {
  const statusMap = {
    'pending_review': 1,
    'pending_payment': 2,
    'scheduled': 3,
    'site_visit_ongoing': 4,
    'device_deployed': 5,
    'data_collecting': 6,
    'data_analyzing': 7,
    'report_draft': 8,
    'quotation_generated': 9,
    'quotation_accepted': 10,
    'completed': 11,
    'cancelled': 12
  };
  return statusMap[statusString] || null;
};

const TABS = [
  { key: 'site-assessment', label: 'Site Assessment', title: 'Site Assessment', description: 'Complete list of site evaluations with booking details and status.', empty: 'No site assessments found' },
  { key: 'project-summary', label: 'Project Summary', title: 'Project Summary', description: 'Overview of all projects with key details and status.', empty: 'No projects found' },
  { key: 'financial', label: 'Financial', title: 'Financial', description: 'Summary of all financial transactions including payments and status.', empty: 'No financial transactions found' },
  { key: 'clients', label: 'Clients', title: 'Clients', description: 'Complete list of all clients with their contact details and information.', empty: 'No clients found' },
  { key: 'services', label: 'Services', title: 'Services', description: 'Complete list of service requests with customer details and status.', empty: 'No service requests found' },
  { key: 'quotations', label: 'Quotations', title: 'Quotations', description: 'Click any card to view the full quotation in a new tab. No PDF or Excel generation in this tab.', empty: 'No quotations found' }
];

const Reports = () => {
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('site-assessment');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState(null);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedServiceType, setSelectedServiceType] = useState('');
  const [selectedServiceStatus, setSelectedServiceStatus] = useState('');
  const [showMoreTabs, setShowMoreTabs] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const SERVICE_OPTIONS = [
    'Electrical Design and Wiring',
    'CCTV Installation',
    'Broadcast system integration',
    'Lighting system design and integration',
    'Solar Installation Course with hands on training',
    'Maintenance'
  ];
  const SERVICE_STATUS_OPTIONS = ['pending', 'contacted', 'scheduled', 'completed', 'cancelled'];

  // Data for reports
  const [assessments, setAssessments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [quotations, setQuotations] = useState([]);

  // Quotation tab filters (client-side only, no PDF/Excel generation)
  const [quotationSearch, setQuotationSearch] = useState('');
  const [quotationStatusFilter, setQuotationStatusFilter] = useState('');
  const [quotationSourceFilter, setQuotationSourceFilter] = useState('');

  // Real-time data updates (no page refresh). Cleaned up on unmount.
  useRealtimeTable(['pre-assessments', 'projects', 'users', 'service-requests', 'free-quotes'], () => {
    fetchAllData();
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');

      const [assessmentsRes, projectsRes, clientsRes, freeQuotesRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { assessments: [] } })),
        axios.get(`${import.meta.env.VITE_API_URL}/api/projects`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { projects: [] } })),
        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/clients`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { clients: [] } })),
        axios.get(`${import.meta.env.VITE_API_URL}/api/free-quotes?limit=1000`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { quotes: [] } }))
      ]);

      const allAssessments = assessmentsRes.data.assessments || [];
      const allProjects = projectsRes.data.projects || [];
      const allClients = clientsRes.data.clients || [];
      const allFreeQuotes = freeQuotesRes.data.quotes || freeQuotesRes.data.freeQuotes || [];

      setAssessments(allAssessments);
      setProjects(allProjects);
      setClients(allClients);

      // Build unified quotations list — only records with an existing quotation file.
      // Free Quotes: completed (draft/sent) or accepted WITH file; Pre-Assessments:
      // report_draft / quotation_generated / quotation_accepted / completed WITH file.
      const freeQuoteItems = allFreeQuotes
        .filter(q => {
          const url = q.quotationFile || q.quotationUrl;
          if (!url) return false;
          return ['completed', 'accepted'].includes(q.status);
        })
        .map(q => {
          const firstName = q.clientId?.contactFirstName || q.clientName?.split?.(' ')?.[0] || '';
          const lastName = q.clientId?.contactLastName || q.clientName?.split?.(' ')?.slice(1)?.join(' ') || '';
          const fullName = `${firstName} ${lastName}`.trim() || q.clientName || 'N/A';
          return {
            id: q._id,
            sourceType: 'free-quote',
            sourceLabel: 'Free Quote',
            name: fullName,
            reference: q.quotationReference || 'N/A',
            status: q.status || 'pending',
            url: q.quotationFile || q.quotationUrl || null,
            date: q.quotationSentAt || q.requestedAt || q.createdAt || null
          };
        });

      const preAssessmentItems = allAssessments
        .filter(a => {
          const url = a?.quotation?.quotationUrl || a?.finalQuotation;
          if (!url) return false;
          return ['report_draft', 'quotation_generated', 'quotation_accepted', 'completed'].includes(a.assessmentStatus);
        })
        .map(a => {
          const fullName = `${a.clientId?.contactFirstName || ''} ${a.clientId?.contactLastName || ''}`.trim() || 'N/A';
          return {
            id: a._id,
            sourceType: 'pre-assessment',
            sourceLabel: 'Site Assessment',
            name: fullName,
            reference: a.bookingReference || a?.quotation?.quotationNumber || 'N/A',
            status: a.assessmentStatus || 'N/A',
            url: a?.quotation?.quotationUrl || a?.finalQuotation || null,
            date: a?.quotation?.quotationDate || a?.quotation?.generatedAt || a?.createdAt || null
          };
        });

      const allQuotations = [...freeQuoteItems, ...preAssessmentItems].sort(
        (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
      );
      setQuotations(allQuotations);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Failed to fetch data', 'error');
      setLoading(false);
    }
  };

  // The table and its export must come from the same server query.
  // Quotations tab is client-side only (cards + redirect, no PDF/Excel generation).
  const fetchCurrentReport = async () => {
    if (activeTab === 'quotations') return null;
    const token = sessionStorage.getItem('token');
    const params = new URLSearchParams({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });

    if (activeTab === 'site-assessment' && selectedAssessment) params.append('assessmentId', selectedAssessment);
    if (activeTab === 'project-summary' && selectedProject) params.append('projectId', selectedProject);
    if (activeTab === 'financial' && selectedProject) params.append('projectId', selectedProject);
    if (activeTab === 'clients' && selectedClient) params.append('clientId', selectedClient);
    if (activeTab === 'services' && selectedServiceType) params.append('serviceType', selectedServiceType);
    if (activeTab === 'services' && selectedServiceStatus) params.append('status', selectedServiceStatus);

    const endpoint = activeTab === 'clients' ? 'client-transaction' : activeTab;
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/admin/reports/${endpoint}?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data?.report;
  };

  useEffect(() => {
    let cancelled = false;
    if (activeTab === 'quotations') {
      if (!cancelled) setReportData({ report: null });
      return () => { cancelled = true; };
    }
    fetchCurrentReport()
      .then(report => { if (!cancelled) setReportData({ report }); })
      .catch(error => {
        console.error('Error loading report data:', error);
        if (!cancelled) setReportData({ report: null });
      });
    return () => { cancelled = true; };
  }, [activeTab, dateRange.startDate, dateRange.endDate, selectedAssessment, selectedProject, selectedClient, selectedServiceType, selectedServiceStatus]);

  const exportReport = async (format) => {
    setGenerating(true);
    try {
      const token = sessionStorage.getItem('token');

      let dataToExport = await fetchCurrentReport();

      const params = new URLSearchParams();
      params.append('startDate', dateRange.startDate);
      params.append('endDate', dateRange.endDate);

      if (activeTab === 'site-assessment' && selectedAssessment) {
        params.append('assessmentId', selectedAssessment);
      } else if (activeTab === 'project-summary' && selectedProject) {
        params.append('projectId', selectedProject);
      } else if (activeTab === 'financial' && selectedProject) {
        params.append('projectId', selectedProject);
      } else if (activeTab === 'clients' && selectedClient) {
        params.append('clientId', selectedClient);
      } else if (activeTab === 'services') {
        if (selectedServiceType) params.append('serviceType', selectedServiceType);
        if (selectedServiceStatus) params.append('status', selectedServiceStatus);
      }

      let response;
      if (activeTab === 'site-assessment') {
        response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admin/reports/site-assessment?${params}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else if (activeTab === 'project-summary') {
        response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admin/reports/project-summary?${params}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else if (activeTab === 'financial') {
        response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admin/reports/financial?${params}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else if (activeTab === 'clients') {
        // ✅ Use client-transaction for the API endpoint
        response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admin/reports/client-transaction?${params}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else if (activeTab === 'services') {
        response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admin/reports/services?${params}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        throw new Error('Invalid report type');
      }

      dataToExport = response.data?.report;

      if (!dataToExport) {
        showToast('No data matches the selected filters.', 'warning');
        setGenerating(false);
        return;
      }

      // ✅ Map 'clients' to 'client-transaction' for export
      const exportType = activeTab === 'clients' ? 'client-transaction' : activeTab;
      const generatedBy = sessionStorage.getItem('userName') || localStorage.getItem('userName') || dataToExport?.generatedBy || undefined;

      const exportResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/reports/export`,
        {
          format: format,
          type: exportType,
          data: dataToExport,
          generatedBy
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([exportResponse.data]));
      const link = document.createElement('a');
      link.href = url;
      const fileExtension = format === 'csv' ? 'csv' : format === 'pdf' ? 'pdf' : 'xlsx';
      link.setAttribute('download', `${activeTab}_report_${new Date().toISOString().split('T')[0]}.${fileExtension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToast(`Report exported as ${format.toUpperCase()}`, 'success');
    } catch (error) {
      console.error('Error exporting report:', error);
      showToast('Failed to export report', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // ============ QUOTATION TAB HELPERS (cards + redirect, no export) ============
  const formatQuotationStatus = (status) => {
    if (!status) return 'N/A';
    return String(status).replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const isQuotationUrlSafe = (url) => {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/');
  };

  const handleOpenQuotation = (quotation) => {
    const url = quotation?.url;
    if (!isQuotationUrlSafe(url)) {
      showToast('No quotation file available for this record', 'warning');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getFilteredQuotations = () => {
    const start = dateRange.startDate ? new Date(dateRange.startDate) : null;
    const end = dateRange.endDate ? new Date(dateRange.endDate) : null;
    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);
    const term = (quotationSearch || '').trim().toLowerCase();

    return quotations.filter((q) => {
      if (quotationSourceFilter && q.sourceType !== quotationSourceFilter) return false;
      if (quotationStatusFilter && String(q.status).toLowerCase() !== String(quotationStatusFilter).toLowerCase()) return false;
      if (q.date && (start || end)) {
        const d = new Date(q.date);
        if (isNaN(d.getTime())) return true;
        if (start && d < start) return false;
        if (end && d > end) return false;
      }
      if (term) {
        const haystack = `${q.name || ''} ${q.reference || ''} ${q.status || ''}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  };

  const quotationStatusOptions = [...new Set(quotations.map((q) => q.status).filter(Boolean))].sort();

  // ============ PAGINATION (display only — export always refetches everything) ============
  const tabRows = (() => {
    switch (activeTab) {
      case 'site-assessment': return reportData?.report?.assessments || [];
      case 'project-summary': return reportData?.report?.projects || [];
      case 'financial': return reportData?.report?.payments || [];
      case 'clients': return reportData?.report?.clients || [];
      case 'services': return reportData?.report?.services || [];
      case 'quotations': return getFilteredQuotations();
      default: return [];
    }
  })();

  const totalRows = tabRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pagedRows = totalRows === 0 ? [] : tabRows.slice(startIndex, startIndex + PAGE_SIZE);
  const rangeStart = totalRows === 0 ? 0 : startIndex + 1;
  const rangeEnd = Math.min(startIndex + PAGE_SIZE, totalRows);

  // Reset to page 1 whenever the tab or any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, dateRange.startDate, dateRange.endDate, selectedAssessment, selectedProject, selectedClient, selectedServiceType, selectedServiceStatus, quotationSearch, quotationSourceFilter, quotationStatusFilter]);

  const handleResetFilters = () => {
    setDateRange({
      startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    });
    setSelectedAssessment('');
    setSelectedProject('');
    setSelectedClient('');
    setSelectedServiceType('');
    setSelectedServiceStatus('');
    setQuotationSearch('');
    setQuotationSourceFilter('');
    setQuotationStatusFilter('');
    setCurrentPage(1);
  };

  const activeTabMeta = TABS.find((t) => t.key === activeTab) || TABS[0];

  // ============ SHARED PRESENTATION BLOCKS ============
  const ReportCardHead = () => (
    <div className="report-card-head-reports">
      <div className="report-card-head-text-reports">
        <h2>{activeTabMeta.title}</h2>
        <p>{activeTabMeta.description}</p>
      </div>
      <span className="report-count-reports">
        {totalRows === 0
          ? 'No records'
          : `Showing ${rangeStart}–${rangeEnd} of ${totalRows}`}
      </span>
    </div>
  );

  const ReportEmpty = ({ message }) => (
    <div className="report-empty-reports">
      <span className="report-empty-icon-reports"><FaInbox /></span>
      <h3>{message}</h3>
      <p>Try widening the date range or clearing the filters above.</p>
    </div>
  );

  const ReportPagination = () => {
    if (totalRows <= PAGE_SIZE) return null;
    return (
      <div className="pagination">
        <div className="pagination-info">
          Showing {rangeStart} to {rangeEnd} of {totalRows} {totalRows === 1 ? 'record' : 'records'}
        </div>
        <div className="pagination-controls">
          <button
            className="page-btn"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={safePage === 1}
          >
            <FaChevronLeft /> Previous
          </button>
          {getPageNumbers(safePage, totalPages).map((p, i, arr) => (
            <React.Fragment key={p}>
              {i > 0 && p - arr[i - 1] > 1 && <span className="pagination-info">…</span>}
              <button
                className={`page-number ${safePage === p ? 'active' : ''}`}
                onClick={() => setCurrentPage(p)}
                aria-current={safePage === p ? 'page' : undefined}
              >
                {p}
              </button>
            </React.Fragment>
          ))}
          <button
            className="page-btn"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
          >
            Next <FaChevronRight />
          </button>
        </div>
      </div>
    );
  };

  // Skeleton Loader — mirrors the real shell (tab strip, toolbar, data card)
  const SkeletonLoader = () => (
    <div className="reports-container-reports">
      <div className="report-tabs-reports">
        {TABS.map((t) => (
          <div key={t.key} className="skeleton-tab-reports"></div>
        ))}
      </div>
      <div className="report-controls-reports">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '0 0 auto' }}>
          <div className="skeleton-row-reports" style={{ width: 64, height: 12 }}></div>
          <div className="skeleton-field-reports" style={{ width: 210 }}></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '0 1 240px', minWidth: 200 }}>
          <div className="skeleton-row-reports" style={{ width: 92, height: 12 }}></div>
          <div className="skeleton-field-reports"></div>
        </div>
      </div>
      <div className="skeleton-card-reports">
        <div className="skeleton-card-head-reports">
          <div className="skeleton-line-medium-reports" style={{ width: 180, height: 20 }}></div>
          <div className="skeleton-row-reports" style={{ width: '60%' }}></div>
        </div>
        <div className="skeleton-card-body-reports">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="skeleton-row-reports" style={{ width: `${95 - (i % 3) * 12}%` }}></div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <>
      <Helmet>
        <title>Reports | Admin | Salfer Engineering</title>
      </Helmet>

      <div className="reports-container-reports">
        {/* Report Type Tabs — full-width segmented control, 6 equal cells */}
        <div className={`report-tabs-reports ${showMoreTabs ? 'show-more-reports' : ''}`}>
          {TABS.map((t) => {
            // On small screens only the first two tabs stay visible; the rest move into "More".
            const isOverflowTab = ['financial', 'clients', 'services', 'quotations'].includes(t.key);
            return (
              <button
                key={t.key}
                className={`tab-btn-reports ${isOverflowTab ? 'desktop-tab-reports' : ''} ${activeTab === t.key ? 'active-reports' : ''}`}
                onClick={() => { setActiveTab(t.key); setReportData(null); setShowMoreTabs(false); }}
                aria-current={activeTab === t.key ? 'page' : undefined}
              >
                {t.label}
              </button>
            );
          })}
          <div className="more-wrap-reports">
            <button
              className={`tab-btn-reports more-tab-btn-reports ${(activeTab === 'financial' || activeTab === 'clients' || activeTab === 'services' || activeTab === 'quotations') ? 'active-reports' : ''}`}
              onClick={() => setShowMoreTabs((v) => !v)}
              aria-expanded={showMoreTabs}
              aria-haspopup="true"
              type="button"
            >
              More <FaChevronDown className={`more-chevron-reports ${showMoreTabs ? 'open' : ''}`} />
            </button>
            {showMoreTabs && (
              <div className="more-menu-reports" role="menu">
                {TABS.filter((t) => ['financial', 'clients', 'services', 'quotations'].includes(t.key)).map((t) => (
                  <button
                    key={t.key}
                    role="menuitem"
                    className={`more-item-reports ${activeTab === t.key ? 'active-reports' : ''}`}
                    onClick={() => { setActiveTab(t.key); setReportData(null); setShowMoreTabs(false); }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>


        {/* Report Controls */}
        <div className="report-controls-reports">
          <div className="date-range-reports">
            <label>Date Range</label>
            <div className="date-inputs-reports">
              <input type="date" value={dateRange.startDate} onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} />
              <span>to</span>
              <input type="date" value={dateRange.endDate} onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })} />
            </div>
          </div>

          {activeTab === 'site-assessment' && (
            <div className="report-filter-reports">
              <label>Filter by Assessment</label>
              <select value={selectedAssessment} onChange={(e) => setSelectedAssessment(e.target.value)}>
                <option value="">All Assessments</option>
                {assessments.map(a => (
                  <option key={a._id} value={a._id}>{a.bookingReference} - {a.clientId?.contactFirstName} {a.clientId?.contactLastName}</option>
                ))}
              </select>
            </div>
          )}

          {activeTab === 'project-summary' && (
            <div className="report-filter-reports">
              <label>Filter by Project</label>
              <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
                <option value="">All Projects</option>
                {projects.map(p => (
                  <option key={p._id} value={p._id}>{p.projectName} - {p.projectReference}</option>
                ))}
              </select>
            </div>
          )}

          {activeTab === 'clients' && (
            <div className="report-filter-reports">
              <label>Filter by Client</label>
              <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
                <option value="">All Clients</option>
                {clients.map(c => (
                  <option key={c._id} value={c._id}>{c.contactFirstName} {c.contactLastName}</option>
                ))}
              </select>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="report-filter-reports">
              <label>Filter by Service Type</label>
              <select value={selectedServiceType} onChange={(e) => setSelectedServiceType(e.target.value)}>
                <option value="">All Service Types</option>
                {SERVICE_OPTIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="report-filter-reports">
              <label>Filter by Status</label>
              <select value={selectedServiceStatus} onChange={(e) => setSelectedServiceStatus(e.target.value)}>
                <option value="">All Statuses</option>
                {SERVICE_STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          )}

          {activeTab === 'quotations' && (
            <div className="report-filter-reports">
              <label>Search</label>
              <div className="quotation-search-reports">
                <FaSearch className="quotation-search-icon-reports" />
                <input
                  type="text"
                  placeholder="Search name or reference..."
                  value={quotationSearch}
                  onChange={(e) => setQuotationSearch(e.target.value)}
                />
              </div>
            </div>
          )}

          {activeTab === 'quotations' && (
            <div className="report-filter-reports">
              <label>Filter by Source</label>
              <select value={quotationSourceFilter} onChange={(e) => setQuotationSourceFilter(e.target.value)}>
                <option value="">All Sources</option>
                <option value="free-quote">Free Quote</option>
                <option value="pre-assessment">Site Assessment</option>
              </select>
            </div>
          )}

          {activeTab === 'quotations' && (
            <div className="report-filter-reports">
              <label>Filter by Status</label>
              <select value={quotationStatusFilter} onChange={(e) => setQuotationStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                {quotationStatusOptions.map((s) => (
                  <option key={s} value={s}>{formatQuotationStatus(s)}</option>
                ))}
              </select>
            </div>
          )}

          {/* Actions — margin-left:auto keeps them pinned right, absorbing the row's slack */}
          <div className="report-controls-actions-reports">
            <button
              className="reset-btn-reports"
              onClick={handleResetFilters}
              title="Clear all filters and reset the date range"
            >
              <FaRedo /> Reset
            </button>
            {activeTab !== 'quotations' && (
              <>
                <button
                  className="export-btn-reports pdf"
                  onClick={() => exportReport('pdf')}
                  disabled={generating}
                >
                  <FaFilePdf /> Export PDF
                </button>
                <button
                  className="export-btn-reports excel"
                  onClick={() => exportReport('xlsx')}
                  disabled={generating}
                >
                  <FaFileExcel /> Export Excel
                </button>
              </>
            )}
          </div>
        </div>

        {/* ============ SITE ASSESSMENT REPORTS ============ */}
        {activeTab === 'site-assessment' && (
          <div className="report-content-reports">
            <div className="report-section-reports">
              <ReportCardHead />
              <div className="report-card-body-reports">
                {pagedRows.length === 0 ? (
                  <ReportEmpty message={TABS[0].empty} />
                ) : (
                  <>
                    <div className="table-container-reports">
                      <table className="reports-table-reports table-site-assessment-reports">
                        <thead>
                          <tr>
                            <th>Booking Ref</th>
                            <th>Client Name</th>
                            <th>Contact</th>
                            <th>Type</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedRows.map(assessment => {
                            const statusNum = getStatusNumber(assessment.assessmentStatus);
                            const statusDisplay = assessment.statusDisplay || (statusNum ? `${assessment.assessmentStatus?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}` : 'N/A');

                            return (
                              <tr key={assessment._id}>
                                <td data-label="Booking Ref" className="ref-cell-reports">{assessment.bookingReference}</td>
                                <td data-label="Client Name" className="client-cell-reports">{assessment.clientName || 'N/A'}</td>
                                <td data-label="Contact">{assessment.clientContact || 'N/A'}</td>
                                <td data-label="Type">
                                  <span className="property-type-badge-reports">
                                    {assessment.propertyType || 'N/A'}
                                  </span>
                                </td>
                                <td data-label="Status">
                                  <span className="status-badge-reports">
                                    {statusDisplay}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <ReportPagination />
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============ PROJECT SUMMARY REPORTS ============ */}
        {activeTab === 'project-summary' && (
          <div className="report-content-reports">
            <div className="report-section-reports">
              <ReportCardHead />
              <div className="report-card-body-reports">
                {pagedRows.length === 0 ? (
                  <ReportEmpty message={TABS[1].empty} />
                ) : (
                  <>
                    <div className="table-container-reports">
                      <table className="reports-table-reports table-project-summary-reports">
                        <thead>
                          <tr>
                            <th>Project Ref</th>
                            <th>Client Name</th>
                            <th>Contact</th>
                            <th>System Type</th>
                            <th>System Size</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedRows.map(project => (
                            <tr key={project._id}>
                              <td data-label="Project Ref" className="ref-cell-reports">{project.projectReference}</td>
                              <td data-label="Client Name" className="client-cell-reports">{project.clientName || 'N/A'}</td>
                              <td data-label="Contact">{project.clientContact || 'N/A'}</td>
                              <td data-label="System Type">
                                <span className="system-type-badge-reports">
                                  {project.systemType || 'N/A'}
                                </span>
                              </td>
                              <td data-label="System Size">{project.systemSize || 'N/A'} kWp</td>
                              <td data-label="Status">
                                <span className={`project-status-badge-reports ${project.status}`}>
                                  {project.status === 'in_progress' ? 'In Progress' :
                                    project.status === 'completed' ? 'Completed' :
                                      project.status === 'full_paid' ? 'Full Payment' :
                                        project.status === 'initial_paid' ? 'Initial Paid' :
                                          project.status === 'quoted' ? 'Quoted' :
                                            project.status === 'approved' ? 'Approved' : 'Pending'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <ReportPagination />
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============ FINANCIAL REPORTS ============ */}
        {activeTab === 'financial' && (
          <div className="report-content-reports">
            <div className="report-section-reports">
              <ReportCardHead />
              <div className="report-card-body-reports">
                {pagedRows.length === 0 ? (
                  <ReportEmpty message={TABS[2].empty} />
                ) : (
                  <>
                    <div className="table-container-reports">
                      <table className="reports-table-reports table-financial-reports">
                        <thead>
                          <tr>
                            <th>Project/Booking Ref</th>
                            <th>Client Name</th>
                            <th>Amount</th>
                            <th>Payment Method</th>
                            <th>Status</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedRows.map((transaction, idx) => (
                            <tr key={transaction._id || `${transaction.reference}-${idx}`}>
                              <td data-label="Reference" className="ref-cell-reports">{transaction.reference || transaction.projectName}</td>
                              <td data-label="Client Name" className="client-cell-reports">{transaction.clientName || transaction.client || 'N/A'}</td>
                              <td data-label="Amount" className="amount-reports">{formatCurrency(transaction.amount)}</td>
                              <td data-label="Method">
                                <span className={`payment-method-reports ${transaction.method?.toLowerCase()}`}>
                                  {transaction.paymentMethod || transaction.method || 'N/A'}
                                </span>
                              </td>
                              <td data-label="Status">
                                <span className="status-badge-reports">
                                  {transaction.status}
                                </span>
                              </td>
                              <td data-label="Date">{formatDate(transaction.date)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <ReportPagination />
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============ CLIENTS REPORTS ============ */}
        {activeTab === 'clients' && (
          <div className="report-content-reports">
            <div className="report-section-reports">
              <ReportCardHead />
              <div className="report-card-body-reports">
                {pagedRows.length === 0 ? (
                  <ReportEmpty message={TABS[3].empty} />
                ) : (
                  <>
                    <div className="table-container-reports">
                      <table className="reports-table-reports table-clients-reports">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Contact</th>
                            <th>Email</th>
                            <th>Client Type</th>
                            <th>Address</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedRows.map(client => (
                            <tr key={client._id}>
                              <td data-label="Name" className="client-cell-reports">
                                <strong>{client.clientName || 'N/A'}</strong>
                              </td>
                              <td data-label="Contact">{client.clientContact || 'N/A'}</td>
                              <td data-label="Email">{client.email || 'N/A'}</td>
                              <td data-label="Client Type">
                                <span className="client-type-badge-reports">
                                  {client.clientType || 'Residential'}
                                </span>
                              </td>
                              <td data-label="Address">
                                {client.address || 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <ReportPagination />
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============ SERVICES REPORTS ============ */}
        {activeTab === 'services' && (
          <div className="report-content-reports">
            <div className="report-section-reports">
              <ReportCardHead />
              <div className="report-card-body-reports">
                {pagedRows.length === 0 ? (
                  <ReportEmpty message={TABS[4].empty} />
                ) : (
                  <>
                    <div className="table-container-reports">
                      <table className="reports-table-reports table-services-reports">
                        <thead>
                          <tr>
                            <th>Reference</th>
                            <th>Client Name</th>
                            <th>Contact</th>
                            <th>Service Type</th>
                            <th>Preferred Date</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedRows.map((service, idx) => (
                            <tr key={service._id || idx}>
                              <td data-label="Reference" className="ref-cell-reports">{service.reference || 'N/A'}</td>
                              <td data-label="Client Name" className="client-cell-reports">{service.clientName || 'N/A'}</td>
                              <td data-label="Contact">{service.clientContact || 'N/A'}</td>
                              <td data-label="Service Type">
                                <span className="system-type-badge-reports">
                                  {service.serviceType || 'N/A'}
                                </span>
                              </td>
                              <td data-label="Preferred Date">{service.preferredDate ? formatDate(service.preferredDate) : 'N/A'}</td>
                              <td data-label="Status">
                                <span className="status-badge-reports">
                                  {service.status || 'N/A'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <ReportPagination />
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============ QUOTATIONS REPORT (cards + redirect, no export) ============ */}
        {activeTab === 'quotations' && (
          <div className="report-content-reports">
            <div className="report-section-reports">
              <ReportCardHead />
              <div className="report-card-body-reports">
                {pagedRows.length === 0 ? (
                  <ReportEmpty message={TABS[5].empty} />
                ) : (
                  <>
                    <div className="quotation-grid-reports">
                      {pagedRows.map((q) => {
                        const hasFile = isQuotationUrlSafe(q.url);
                        return (
                          <article
                            key={`${q.sourceType}-${q.id}`}
                            className={`quotation-card-reports ${hasFile ? '' : 'no-file'}`}
                            onClick={() => handleOpenQuotation(q)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpenQuotation(q); } }}
                            tabIndex={0}
                            role="link"
                            aria-label={`View quotation ${q.reference} for ${q.name}`}
                            title={hasFile ? `View ${q.reference} in a new tab` : `${q.reference} — no file yet`}
                          >
                            <div className="quotation-preview-reports">
                              {hasFile ? (
                                <>
                                  <iframe
                                    src={q.url}
                                    title={`Quotation preview ${q.reference}`}
                                    loading="lazy"
                                    tabIndex={-1}
                                    aria-hidden="true"
                                  />
                                  <span className="quotation-open-hint-reports">
                                    <FaExternalLinkAlt /> View
                                  </span>
                                </>
                              ) : (
                                <div className="quotation-no-preview-reports">
                                  <FaFilePdf className="quotation-no-preview-icon-reports" />
                                  <span>No preview available</span>
                                </div>
                              )}
                              <span className="quotation-source-reports">{q.sourceLabel}</span>
                            </div>
                            <div className="quotation-body-reports">
                              <strong className="quotation-name-reports">{q.name || 'N/A'}</strong>
                              <span className="quotation-ref-reports">{q.reference || 'N/A'}</span>
                              <span className="status-badge-reports">{formatQuotationStatus(q.status)}</span>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                    <ReportPagination />
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} position="bottom-right" />
      </div>
    </>
  );
};

export default Reports;
