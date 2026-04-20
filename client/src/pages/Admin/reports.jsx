// pages/Admin/Reports.jsx

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { FaSpinner, FaFilePdf, FaFileExcel, FaPrint, FaTimes, FaDownload, FaEye } from 'react-icons/fa';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import '../../styles/Admin/reports.css';

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

// Assessment Status Constants with numbers
const ASSESSMENT_STATUS = {
  1: { label: 'pending_review', display: 'Pending Review', color: '#ffc107' },
  2: { label: 'pending_payment', display: 'Pending Payment', color: '#fd7e14' },
  3: { label: 'scheduled', display: 'Scheduled', color: '#17a2b8' },
  4: { label: 'site_visit_ongoing', display: 'Site Visit Ongoing', color: '#6f42c1' },
  5: { label: 'device_deployed', display: 'Device Deployed', color: '#20c997' },
  6: { label: 'data_collecting', display: 'Data Collecting', color: '#28a745' },
  7: { label: 'data_analyzing', display: 'Data Analyzing', color: '#17a2b8' },
  8: { label: 'report_draft', display: 'Report Draft', color: '#6c757d' },
  9: { label: 'quotation_generated', display: 'Quotation Generated', color: '#007bff' },
  10: { label: 'quotation_accepted', display: 'Quotation Accepted', color: '#28a745' },
  11: { label: 'completed', display: 'Completed', color: '#28a745' },
  12: { label: 'cancelled', display: 'Cancelled', color: '#dc3545' }
};

// Assessment Results Summary Ranges
const ASSESSMENT_RESULTS_SUMMARY = {
  IRRADIANCE: {
    POOR: { min: 0, max: 300, label: 'Poor', color: '#dc3545' },
    MODERATE: { min: 301, max: 500, label: 'Moderate', color: '#fd7e14' },
    GOOD: { min: 501, max: 700, label: 'Good', color: '#28a745' },
    EXCELLENT: { min: 701, max: 1000, label: 'Excellent', color: '#007bff' }
  },
  TEMPERATURE: {
    OPTIMAL: { min: 15, max: 25, label: 'Optimal', color: '#28a745' },
    ACCEPTABLE: { min: 26, max: 35, label: 'Acceptable', color: '#ffc107' },
    HIGH: { min: 36, max: 45, label: 'High - Efficiency Reduced', color: '#fd7e14' },
    CRITICAL: { min: 46, max: 60, label: 'Critical - Significant Loss', color: '#dc3545' }
  },
  HUMIDITY: {
    LOW: { min: 0, max: 30, label: 'Low', color: '#28a745' },
    MODERATE: { min: 31, max: 60, label: 'Moderate', color: '#ffc107' },
    HIGH: { min: 61, max: 80, label: 'High', color: '#fd7e14' },
    VERY_HIGH: { min: 81, max: 100, label: 'Very High - Condensation Risk', color: '#dc3545' }
  },
  SHADING_IMPACT: {
    NEGLIGIBLE: { min: 0, max: 10, label: 'Negligible Impact', color: '#28a745' },
    LOW: { min: 11, max: 20, label: 'Low Impact', color: '#ffc107' },
    MODERATE: { min: 21, max: 35, label: 'Moderate Impact', color: '#fd7e14' },
    SEVERE: { min: 36, max: 100, label: 'Severe Impact - Not Recommended', color: '#dc3545' }
  },
  SITE_SUITABILITY: {
    POOR: { min: 0, max: 39, label: 'Poor - Not Recommended', color: '#dc3545' },
    FAIR: { min: 40, max: 59, label: 'Fair - Consider with Caution', color: '#fd7e14' },
    GOOD: { min: 60, max: 79, label: 'Good - Recommended', color: '#ffc107' },
    EXCELLENT: { min: 80, max: 100, label: 'Excellent - Highly Recommended', color: '#28a745' }
  },
  PAYBACK_PERIOD: {
    EXCELLENT: { min: 0, max: 3, label: 'Excellent ROI', color: '#28a745' },
    GOOD: { min: 3.1, max: 5, label: 'Good ROI', color: '#20c997' },
    ACCEPTABLE: { min: 5.1, max: 7, label: 'Acceptable ROI', color: '#ffc107' },
    POOR: { min: 7.1, max: 15, label: 'Poor ROI', color: '#dc3545' }
  },
  CO2_OFFSET: {
    SMALL: { min: 0, max: 2, label: 'Small Impact', color: '#6c757d' },
    MEDIUM: { min: 2.1, max: 5, label: 'Medium Impact', color: '#28a745' },
    LARGE: { min: 5.1, max: 10, label: 'Large Impact', color: '#17a2b8' },
    SIGNIFICANT: { min: 10.1, max: 100, label: 'Significant Impact', color: '#007bff' }
  }
};

// Helper function to get rating based on value
const getRating = (value, ranges) => {
  if (!value && value !== 0) return null;
  for (const [key, range] of Object.entries(ranges)) {
    if (value >= range.min && value <= range.max) {
      return { key, ...range };
    }
  }
  return null;
};

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

  // Data for reports
  const [assessments, setAssessments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [payments, setPayments] = useState([]);

  const [stats, setStats] = useState({
    revenue: { total: 0, thisMonth: 0, lastMonth: 0 },
    assessments: { total: 0, completed: 0, pending: 0, suitable: 0, notSuitable: 0, conditional: 0 },
    projects: { total: 0, inProgress: 0, completed: 0, pending: 0, fullPaid: 0, initialPaid: 0 },
    clients: { total: 0, active: 0, new: 0, residential: 0, company: 0, industrial: 0 },
    payments: { total: 0, paid: 0, pending: 0, forVerification: 0 }
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');

      const [assessmentsRes, projectsRes, clientsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { assessments: [] } })),
        axios.get(`${import.meta.env.VITE_API_URL}/api/projects`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { projects: [] } })),
        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/clients`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { clients: [] } }))
      ]);

      const allAssessments = assessmentsRes.data.assessments || [];
      const allProjects = projectsRes.data.projects || [];
      const allClients = clientsRes.data.clients || [];

      setAssessments(allAssessments);
      setProjects(allProjects);
      setClients(allClients);

      // Calculate suitability from assessments
      const calculateScore = (assessment) => {
        const results = assessment.assessmentResults || {};
        const peakSunHours = results.peakSunHours;
        const shadingPercentage = results.shadingPercentage;
        const summaryScore = results.summary?.siteSuitabilityScore;

        if (summaryScore) return summaryScore;

        if (peakSunHours && shadingPercentage !== undefined) {
          let score = 100;
          if (peakSunHours >= 5.5) score -= 0;
          else if (peakSunHours >= 5) score -= 5;
          else if (peakSunHours >= 4.5) score -= 10;
          else if (peakSunHours >= 4) score -= 20;
          else if (peakSunHours >= 3.5) score -= 30;
          else if (peakSunHours >= 3) score -= 40;
          else score -= 50;

          if (shadingPercentage <= 5) score -= 0;
          else if (shadingPercentage <= 10) score -= 10;
          else if (shadingPercentage <= 15) score -= 20;
          else if (shadingPercentage <= 20) score -= 25;
          else score -= 30;

          return Math.max(0, Math.min(100, Math.round(score)));
        }
        return null;
      };

      const suitable = allAssessments.filter(a => {
        const score = calculateScore(a);
        return score !== null && score >= 70;
      }).length;

      const conditional = allAssessments.filter(a => {
        const score = calculateScore(a);
        return score !== null && score >= 50 && score < 70;
      }).length;

      const notSuitable = allAssessments.filter(a => {
        const score = calculateScore(a);
        return score !== null && score < 50;
      }).length;

      // Build transactions for client transaction report
      const preTransactions = allAssessments
        .filter(a => a.invoiceNumber)
        .map(a => ({
          id: a._id,
          type: 'Pre-Assessment Booking',
          reference: a.bookingReference,
          invoiceNumber: a.invoiceNumber,
          amount: a.assessmentFee,
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
      const projectTransactions = allProjects
        .filter(p => p.amountPaid > 0)
        .map(p => ({
          id: p._id,
          type: 'Project Payment',
          reference: p.projectReference,
          projectName: p.projectName,
          amount: p.amountPaid,
          method: 'Manual',
          status: p.status === 'completed' ? 'Completed' : p.status === 'full_paid' ? 'Full Payment Received' : 'In Progress',
          date: p.startDate || p.createdAt,
          client: `${p.clientId?.contactFirstName || ''} ${p.clientId?.contactLastName || ''}`.trim(),
          clientId: p.clientId?._id,
          clientPhone: p.clientId?.contactNumber,
          clientType: p.clientId?.client_type || 'Residential'
        }));

      const allTransactions = [...preTransactions, ...projectTransactions].sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(allTransactions);

      // Calculate payment stats
      const paidPayments = allTransactions.filter(p => p.status === 'Paid' || p.status === 'Completed' || p.status === 'Full Payment Received').length;
      const pendingPayments = allTransactions.filter(p => p.status === 'Pending').length;
      const forVerification = allTransactions.filter(p => p.status === 'For Verification').length;
      const totalRevenue = allTransactions.reduce((sum, p) => sum + (p.amount || 0), 0);
      const thisMonthRevenue = allTransactions
        .filter(p => (p.status === 'Paid' || p.status === 'Completed') && new Date(p.date).getMonth() === new Date().getMonth())
        .reduce((sum, p) => sum + p.amount, 0);
      const lastMonthRevenue = allTransactions
        .filter(p => (p.status === 'Paid' || p.status === 'Completed') && new Date(p.date).getMonth() === new Date().getMonth() - 1)
        .reduce((sum, p) => sum + p.amount, 0);

      setStats({
        revenue: { total: totalRevenue, thisMonth: thisMonthRevenue, lastMonth: lastMonthRevenue },
        assessments: {
          total: allAssessments.length,
          completed: allAssessments.filter(a => a.assessmentStatus === 'completed').length,
          pending: allAssessments.filter(a => a.assessmentStatus === 'pending_payment' || a.assessmentStatus === 'pending_review').length,
          suitable,
          notSuitable,
          conditional
        },
        projects: {
          total: allProjects.length,
          inProgress: allProjects.filter(p => p.status === 'in_progress').length,
          completed: allProjects.filter(p => p.status === 'completed').length,
          pending: allProjects.filter(p => p.status === 'pending' || p.status === 'quoted' || p.status === 'approved').length,
          fullPaid: allProjects.filter(p => p.status === 'full_paid').length,
          initialPaid: allProjects.filter(p => p.status === 'initial_paid').length
        },
        clients: {
          total: allClients.length,
          active: allClients.filter(c => c.status === 'active').length,
          new: allClients.filter(c => new Date(c.createdAt).getMonth() === new Date().getMonth()).length,
          residential: allClients.filter(c => c.client_type === 'Residential').length,
          company: allClients.filter(c => c.client_type === 'Company').length,
          industrial: allClients.filter(c => c.client_type === 'Industrial').length
        },
        payments: {
          total: allTransactions.length,
          paid: paidPayments,
          pending: pendingPayments,
          forVerification: forVerification
        }
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Failed to fetch data', 'error');
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      const token = sessionStorage.getItem('token');

      let reportPayload = {
        type: activeTab,
        dateRange,
        filters: {}
      };

      if (activeTab === 'site-assessment' && selectedAssessment) {
        reportPayload.filters.assessmentId = selectedAssessment;
      } else if (activeTab === 'project-summary' && selectedProject) {
        reportPayload.filters.projectId = selectedProject;
      } else if (activeTab === 'client-transaction' && selectedClient) {
        reportPayload.filters.clientId = selectedClient;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/reports/generate`,
        reportPayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setReportData(response.data);
      showToast('Report generated successfully!', 'success');
    } catch (error) {
      console.error('Error generating report:', error);
      showToast(error.response?.data?.message || 'Failed to generate report', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const exportReport = async (format) => {
    setGenerating(true);
    try {
      const token = sessionStorage.getItem('token');

      let dataToExport = null;

      if (reportData && reportData.report) {
        dataToExport = reportData.report;
      } else {
        const params = new URLSearchParams();
        params.append('startDate', dateRange.startDate);
        params.append('endDate', dateRange.endDate);

        if (activeTab === 'site-assessment' && selectedAssessment) {
          params.append('assessmentId', selectedAssessment);
        } else if (activeTab === 'project-summary' && selectedProject) {
          params.append('projectId', selectedProject);
        } else if (activeTab === 'client-transaction' && selectedClient) {
          params.append('clientId', selectedClient);
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
        } else if (activeTab === 'client-transaction') {
          response = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/admin/reports/client-transaction?${params}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } else {
          throw new Error('Invalid report type');
        }

        dataToExport = response.data?.report;
      }

      if (!dataToExport) {
        showToast('No data to export. Please generate a report first.', 'warning');
        setGenerating(false);
        return;
      }

      const exportResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/reports/export`,
        {
          format: format,
          type: activeTab,
          data: dataToExport
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

  // Skeleton Loader
  const SkeletonLoader = () => (
    <div className="reports-container-admrep">
      <div className="reports-header-admrep">
        <div className="skeleton-line-admrep large-admrep"></div>
        <div className="skeleton-line-admrep medium-admrep"></div>
      </div>
      <div className="stats-cards-admrep">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="stat-card-admrep skeleton-card-admrep">
            <div className="skeleton-line-admrep small-admrep"></div>
            <div className="skeleton-line-admrep large-admrep"></div>
          </div>
        ))}
      </div>
      <div className="report-tabs-admrep">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton-tab-admrep"></div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <>
      <Helmet>
        <title>Reports | Admin | Solaris</title>
      </Helmet>

      <div className="reports-container-admrep">
        <div className="reports-header-admrep">
          <h1>Reports & Analytics</h1>
          <p>Generate comprehensive reports and analyze business performance</p>
        </div>

        {/* Quick Stats Cards */}
        <div className="stats-cards-admrep">
          <div className="stat-card-admrep revenue-admrep">
            <div className="stat-info-admrep">
              <span className="stat-value-admrep">{formatCurrency(stats.revenue.total)}</span>
              <span className="stat-label-admrep">Total Revenue</span>
              <span className="stat-change-admrep">+{formatCurrency(stats.revenue.thisMonth)} this month</span>
            </div>
          </div>
          <div className="stat-card-admrep assessments-admrep">
            <div className="stat-info-admrep">
              <span className="stat-value-admrep">{stats.assessments.total}</span>
              <span className="stat-label-admrep">Total Assessments</span>
              <span className="stat-change-admrep">{stats.assessments.completed} completed</span>
            </div>
          </div>
          <div className="stat-card-admrep projects-admrep">
            <div className="stat-info-admrep">
              <span className="stat-value-admrep">{stats.projects.total}</span>
              <span className="stat-label-admrep">Total Projects</span>
              <span className="stat-change-admrep">{stats.projects.inProgress} in progress</span>
            </div>
          </div>
          <div className="stat-card-admrep clients-admrep">
            <div className="stat-info-admrep">
              <span className="stat-value-admrep">{stats.clients.total}</span>
              <span className="stat-label-admrep">Total Clients</span>
              <span className="stat-change-admrep">{stats.clients.active} active</span>
            </div>
          </div>
        </div>

        {/* Report Type Tabs */}
        <div className="report-tabs-admrep">
          <button
            className={`tab-btn-admrep ${activeTab === 'site-assessment' ? 'active-admrep' : ''}`}
            onClick={() => { setActiveTab('site-assessment'); setReportData(null); }}
          >
            Site Assessment Reports
          </button>
          <button
            className={`tab-btn-admrep ${activeTab === 'project-summary' ? 'active-admrep' : ''}`}
            onClick={() => { setActiveTab('project-summary'); setReportData(null); }}
          >
            Project Summary Reports
          </button>
          <button
            className={`tab-btn-admrep ${activeTab === 'financial' ? 'active-admrep' : ''}`}
            onClick={() => { setActiveTab('financial'); setReportData(null); }}
          >
            Financial Reports
          </button>
          <button
            className={`tab-btn-admrep ${activeTab === 'client-transaction' ? 'active-admrep' : ''}`}
            onClick={() => { setActiveTab('client-transaction'); setReportData(null); }}
          >
            Client Transaction Reports
          </button>
        </div>

        {/* Report Controls */}
        <div className="report-controls-admrep">
          <div className="date-range-admrep">
            <label>Date Range</label>
            <div className="date-inputs-admrep">
              <input type="date" value={dateRange.startDate} onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} />
              <span>to</span>
              <input type="date" value={dateRange.endDate} onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })} />
            </div>
          </div>

          {activeTab === 'site-assessment' && (
            <div className="report-filter-admrep">
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
            <div className="report-filter-admrep">
              <label>Filter by Project</label>
              <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
                <option value="">All Projects</option>
                {projects.map(p => (
                  <option key={p._id} value={p._id}>{p.projectName} - {p.projectReference}</option>
                ))}
              </select>
            </div>
          )}

          {activeTab === 'client-transaction' && (
            <div className="report-filter-admrep">
              <label>Filter by Client</label>
              <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
                <option value="">All Clients</option>
                {clients.map(c => (
                  <option key={c._id} value={c._id}>{c.contactFirstName} {c.contactLastName}</option>
                ))}
              </select>
            </div>
          )}

          <button className="generate-btn-admrep" onClick={generateReport} disabled={generating}>
            {generating ? <FaSpinner className="spinning-admrep" /> : 'Generate Report'}
          </button>
        </div>

        {/* ============ SITE ASSESSMENT REPORTS ============ */}
        {activeTab === 'site-assessment' && (
          <div className="report-content-admrep">
            <div className="report-section-admrep">
              <h2>Site Assessment Results</h2>
              <p>Complete results of site evaluations including IoT data, technical findings, and suitability analysis.</p>

              <div className="suitability-summary-admrep">
                <div className="suitability-card-admrep suitable-admrep">
                  <div className="suitability-stats-admrep">
                    <span className="label">Suitable for Solar</span>
                    <strong>{stats.assessments.suitable}</strong>
                    <span className="percentage">{stats.assessments.total > 0 ? ((stats.assessments.suitable / stats.assessments.total) * 100).toFixed(1) : 0}%</span>
                  </div>
                </div>
                <div className="suitability-card-admrep conditional-admrep">
                  <div className="suitability-stats-admrep">
                    <span className="label">Conditional Approval</span>
                    <strong>{stats.assessments.conditional}</strong>
                    <span className="percentage">{stats.assessments.total > 0 ? ((stats.assessments.conditional / stats.assessments.total) * 100).toFixed(1) : 0}%</span>
                  </div>
                </div>
                <div className="suitability-card-admrep not-suitable-admrep">
                  <div className="suitability-stats-admrep">
                    <span className="label">Not Suitable</span>
                    <strong>{stats.assessments.notSuitable}</strong>
                    <span className="percentage">{stats.assessments.total > 0 ? ((stats.assessments.notSuitable / stats.assessments.total) * 100).toFixed(1) : 0}%</span>
                  </div>
                </div>
                <div className="suitability-card-admrep pending-admrep">
                  <div className="suitability-stats-admrep">
                    <span className="label">Pending Assessment</span>
                    <strong>{stats.assessments.pending}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="report-section-admrep">
              <h2>IoT Data & Environmental Metrics</h2>
              <div className="technical-findings-grid-admrep">

                <div className="finding-card-admrep irradiance-admrep">
                  <div className="finding-info-admrep">
                    <span>Average Irradiance</span>
                    <strong>529.17 W/m²</strong>
                    <small>Peak: 1123.40 W/m²</small>
                  </div>
                </div>

                <div className="finding-card-admrep temperature-admrep">
                  <div className="finding-info-admrep">
                    <span>Temperature Impact</span>
                    <strong>42.3°C</strong>
                    <small>-8.2% derating</small>
                  </div>
                </div>

                <div className="finding-card-admrep humidity-admrep">
                  <div className="finding-info-admrep">
                    <span>Average Humidity</span>
                    <strong>67.8%</strong>
                    <small>Range: 45–89%</small>
                  </div>
                </div>

                <div className="finding-card-admrep shading-admrep">
                  <div className="finding-info-admrep">
                    <span>Peak Sun Hours</span>
                    <strong>4.2 hrs/day</strong>
                    <small>12.5% shading loss</small>
                  </div>
                </div>

              </div>
            </div>
            {/* Assessment Status Distribution * 
            <div className="report-section-admrep">
              <h2>Assessment Status Distribution</h2>
              <div className="assessment-status-grid-admrep">
                {Object.entries(ASSESSMENT_STATUS).map(([num, status]) => {
                  const count = assessments.filter(a => a.assessmentStatus === status.label).length;
                  const percentage = assessments.length > 0 ? (count / assessments.length * 100).toFixed(1) : 0;
                  return (
                    <div key={num} className="status-card-admrep" style={{ borderLeftColor: status.color }}>
                      <div className="status-header-admrep">
                        <span className="status-name-admrep">{status.display}</span>
                        <span className="status-number-admrep">{count}</span>
                      </div>
                      <div className="status-progress-admrep">
                        <div className="progress-bar-admrep" style={{ width: `${percentage}%`, backgroundColor: status.color }}></div>
                        <span className="status-percentage-admrep">{percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>*/}

            <div className="report-section-admrep">
              <h2>Detailed Assessment Results with IoT Data</h2>
              <div className="assessments-table-container-admrep">
                <table className="reports-table-admrep">
                  <thead>
                    <tr>
                      <th>Status #</th>
                      <th>Booking Ref</th>
                      <th>Client Name</th>
                      <th>Avg Irradiance</th>
                      <th>Peak Sun Hours</th>
                      <th>Avg Temp</th>
                      <th>Humidity</th>
                      <th>Shading</th>
                      <th>Suitability Score</th>
                      <th>Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessments.slice(0, 10).map(assessment => {
                      const results = assessment.assessmentResults || {};
                      const peakSunHours = results.peakSunHours;
                      const avgIrradiance = results.averageIrradiance;
                      const avgTemp = results.averageTemperature;
                      const avgHumidity = results.averageHumidity;
                      const shadingPercentage = results.shadingPercentage;

                      const statusNum = getStatusNumber(assessment.assessmentStatus);

                      let suitabilityScore = results.summary?.siteSuitabilityScore;

                      if (!suitabilityScore && peakSunHours && shadingPercentage !== undefined) {
                        let score = 100;
                        if (peakSunHours >= 5.5) score -= 0;
                        else if (peakSunHours >= 5) score -= 5;
                        else if (peakSunHours >= 4.5) score -= 10;
                        else if (peakSunHours >= 4) score -= 20;
                        else if (peakSunHours >= 3.5) score -= 30;
                        else if (peakSunHours >= 3) score -= 40;
                        else score -= 50;

                        if (shadingPercentage <= 5) score -= 0;
                        else if (shadingPercentage <= 10) score -= 10;
                        else if (shadingPercentage <= 15) score -= 20;
                        else if (shadingPercentage <= 20) score -= 25;
                        else score -= 30;

                        suitabilityScore = Math.max(0, Math.min(100, Math.round(score)));
                      }

                      const irradianceRating = getRating(avgIrradiance, ASSESSMENT_RESULTS_SUMMARY.IRRADIANCE);
                      const tempRating = getRating(avgTemp, ASSESSMENT_RESULTS_SUMMARY.TEMPERATURE);
                      const humidityRating = getRating(avgHumidity, ASSESSMENT_RESULTS_SUMMARY.HUMIDITY);
                      const shadingRating = getRating(shadingPercentage, ASSESSMENT_RESULTS_SUMMARY.SHADING_IMPACT);

                      return (
                        <tr key={assessment._id}>
                          <td>
                            <span className="status-number-badge-admrep" style={{ backgroundColor: ASSESSMENT_STATUS[statusNum]?.color }}>
                              {statusNum || 'N/A'}
                            </span>
                          </td>
                          <td className="ref-cell-admrep">{assessment.bookingReference}</td>
                          <td className="client-cell-admrep">{assessment.clientId?.contactFirstName} {assessment.clientId?.contactLastName}</td>
                          <td className="metric-cell-admrep">
                            {avgIrradiance ? `${avgIrradiance.toFixed(0)} W/m²` : 'N/A'}
                            {irradianceRating && <small style={{ color: irradianceRating.color }}>({irradianceRating.label})</small>}
                          </td>
                          <td className="metric-cell-admrep">{peakSunHours?.toFixed(1) || 'N/A'} hrs</td>
                          <td className="metric-cell-admrep">
                            {avgTemp ? `${avgTemp.toFixed(1)}°C` : 'N/A'}
                            {tempRating && <small style={{ color: tempRating.color }}>({tempRating.label})</small>}
                          </td>
                          <td className="metric-cell-admrep">
                            {avgHumidity ? `${avgHumidity.toFixed(0)}%` : 'N/A'}
                            {humidityRating && <small style={{ color: humidityRating.color }}>({humidityRating.label})</small>}
                          </td>
                          <td className="metric-cell-admrep">
                            {shadingPercentage !== undefined ? `${shadingPercentage.toFixed(0)}%` : 'N/A'}
                            {shadingRating && <small style={{ color: shadingRating.color }}>({shadingRating.label})</small>}
                          </td>
                          <td className="score-cell-admrep">
                            <span className={`score-badge-admrep ${suitabilityScore >= 70 ? 'high-admrep' : suitabilityScore >= 50 ? 'medium-admrep' : 'low-admrep'}`}>
                              {suitabilityScore || 'N/A'}
                            </span>
                          </td>
                          <td className="recommendation-cell-admrep">
                            {suitabilityScore >= 70 ? 'Suitable for Solar' :
                              suitabilityScore >= 50 ? 'Conditional Approval' :
                                suitabilityScore ? 'Not Recommended' : 'Pending Assessment'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="report-actions-admrep">
              <button className="export-btn-admrep pdf-admrep" onClick={() => exportReport('pdf')} disabled={generating}>
                <FaFilePdf /> Export as PDF
              </button>
              <button className="export-btn-admrep excel-admrep" onClick={() => exportReport('xlsx')} disabled={generating}>
                <FaFileExcel /> Export as CSV
              </button>
              {/*<button className="export-btn-admrep csv-admrep" onClick={() => exportReport('csv')} disabled={generating}>
                <FaDownload /> Export as CSV
              </button>
              
              <button className="export-btn-admrep print-admrep" onClick={() => window.print()}>
                <FaPrint /> Print Report
              </button>
              */}
            </div>
          </div>
        )}

        {/* ============ PROJECT SUMMARY REPORTS ============ */}
        {activeTab === 'project-summary' && (
          <div className="report-content-admrep">
            <div className="report-section-admrep">
              <h2>Project Status Overview</h2>
              <p>Shows the overall status of projects. Tracks project progress. Helps monitor pending tasks and milestones.</p>

              <div className="project-stats-grid-admrep">
                <div className="project-stat-card-admrep">
                  <span className="stat-label">Total Projects</span>
                  <strong className="stat-value">{stats.projects.total}</strong>
                </div>
                <div className="project-stat-card-admrep in-progress-admrep">
                  <span className="stat-label">In Progress</span>
                  <strong>{stats.projects.inProgress}</strong>
                </div>
                <div className="project-stat-card-admrep completed-admrep">
                  <span className="stat-label">Completed</span>
                  <strong>{stats.projects.completed}</strong>
                </div>
                <div className="project-stat-card-admrep pending-admrep">
                  <span className="stat-label">Pending</span>
                  <strong>{stats.projects.pending}</strong>
                </div>
                <div className="project-stat-card-admrep full-paid-admrep">
                  <span className="stat-label">Full Payment</span>
                  <strong>{stats.projects.fullPaid}</strong>
                </div>
              </div>
            </div>

            <div className="report-section-admrep">
              <h2>Project Progress Tracking</h2>
              <div className="projects-table-container-admrep">
                <table className="reports-table-admrep">
                  <thead>
                    <tr>
                      <th>Project Name</th>
                      <th>Reference</th>
                      <th>Client</th>
                      <th>System Size</th>
                      <th>Status</th>
                      <th>Progress</th>
                      <th>Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map(project => {
                      let progress = 0;
                      if (project.status === 'completed') progress = 100;
                      else if (project.status === 'in_progress') progress = 50;
                      else if (project.status === 'full_paid') progress = 30;
                      else if (project.status === 'initial_paid') progress = 15;
                      else progress = 5;

                      return (
                        <tr key={project._id}>
                          <td className="project-name-cell-admrep"><strong>{project.projectName}</strong></td>
                          <td className="ref-cell-admrep">{project.projectReference}</td>
                          <td className="client-cell-admrep">{project.clientId?.contactFirstName} {project.clientId?.contactLastName}</td>
                          <td>{project.systemSize || 'N/A'} kWp</td>
                          <td>
                            <span className={`project-status-badge-admrep ${project.status}`}>
                              {project.status === 'in_progress' ? 'In Progress' :
                                project.status === 'completed' ? 'Completed' :
                                  project.status === 'full_paid' ? 'Full Payment' :
                                    project.status === 'initial_paid' ? 'Initial Paid' :
                                      project.status === 'quoted' ? 'Quoted' :
                                        project.status === 'approved' ? 'Approved' : 'Pending'}
                            </span>
                          </td>
                          <td>
                            <div className="progress-bar-container-admrep">
                              <div className="progress-bar-fill-admrep" style={{ width: `${progress}%` }}></div>
                              <span className="progress-text-admrep">{progress}%</span>
                            </div>
                          </td>
                          <td className="amount-admrep">{formatCurrency(project.amountPaid || 0)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="report-actions-admrep">
              <button className="export-btn-admrep pdf-admrep" onClick={() => exportReport('pdf')} disabled={generating}>
                <FaFilePdf /> Export as PDF
              </button>
              <button className="export-btn-admrep excel-admrep" onClick={() => exportReport('xlsx')} disabled={generating}>
                <FaFileExcel /> Export as Excel
              </button>
              <button className="export-btn-admrep csv-admrep" onClick={() => exportReport('csv')} disabled={generating}>
                <FaDownload /> Export as CSV
              </button>
              <button className="export-btn-admrep print-admrep" onClick={() => window.print()}>
                <FaPrint /> Print Report
              </button>
            </div>
          </div>
        )}

        {/* ============ FINANCIAL REPORTS ============ */}
        {activeTab === 'financial' && (
          <div className="report-content-admrep">
            <div className="report-section-admrep">
              <h2>Financial Summary</h2>
              <p>Summarizes payments made by clients. Includes billing records. Helps track overall financial performance.</p>

              <div className="financial-summary-grid-admrep">
                <div className="financial-card-admrep total-revenue-admrep">
                  <div>
                    <span>Total Revenue</span>
                    <strong>{formatCurrency(stats.revenue.total)}</strong>
                  </div>
                </div>
                <div className="financial-card-admrep this-month-admrep">
                  <div>
                    <span>This Month</span>
                    <strong>{formatCurrency(stats.revenue.thisMonth)}</strong>
                  </div>
                </div>
                <div className="financial-card-admrep last-month-admrep">
                  <div>
                    <span>Last Month</span>
                    <strong>{formatCurrency(stats.revenue.lastMonth)}</strong>
                  </div>
                </div>
                <div className="financial-card-admrep growth-admrep">
                  <div>
                    <span>Growth</span>
                    <strong className={stats.revenue.thisMonth > stats.revenue.lastMonth ? 'positive-admrep' : 'negative-admrep'}>
                      {stats.revenue.lastMonth > 0 ? ((stats.revenue.thisMonth - stats.revenue.lastMonth) / stats.revenue.lastMonth * 100).toFixed(1) : 0}%
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="report-section-admrep">
              <h2>Payment Summary by Status</h2>
              <div className="payment-status-grid-admrep">
                <div className="payment-status-card-admrep paid-admrep">
                  <div>
                    <span>Paid Transactions</span>
                    <strong>{stats.payments.paid}</strong>
                    <small>{formatCurrency(transactions.filter(t => t.status === 'Paid' || t.status === 'Completed').reduce((sum, t) => sum + t.amount, 0))}</small>
                  </div>
                </div>
                <div className="payment-status-card-admrep pending-admrep">
                  <div>
                    <span>Pending Payments</span>
                    <strong>{stats.payments.pending}</strong>
                  </div>
                </div>
                <div className="payment-status-card-admrep verification-admrep">
                  <div>
                    <span>For Verification</span>
                    <strong>{stats.payments.forVerification}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="report-section-admrep">
              <h2>Recent Transactions</h2>
              <div className="payments-table-container-admrep">
                <table className="reports-table-admrep">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Client Name</th>
                      <th>Type</th>
                      <th>Reference</th>
                      <th>Amount</th>
                      <th>Payment Method</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 15).map((transaction, idx) => (
                      <tr key={idx}>
                        <td>{formatDate(transaction.date)}</td>
                        <td className="client-cell-admrep">{transaction.client}</td>
                        <td><span className="transaction-type-admrep pre-admrep">{transaction.type}</span></td>
                        <td className="ref-cell-admrep">{transaction.reference || transaction.projectName}</td>
                        <td className="amount-admrep">{formatCurrency(transaction.amount)}</td>
                        <td>
                          <span className={`payment-method-admrep ${transaction.method?.toLowerCase()}`}>
                            {transaction.method}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge-admrep ${transaction.status === 'Paid' || transaction.status === 'Completed' ? 'paid-admrep' : transaction.status === 'For Verification' ? 'for-verification-admrep' : 'pending-admrep'}`}>
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="report-actions-admrep">
              <button className="export-btn-admrep pdf-admrep" onClick={() => exportReport('pdf')} disabled={generating}>
                <FaFilePdf /> Export as PDF
              </button>
              <button className="export-btn-admrep excel-admrep" onClick={() => exportReport('xlsx')} disabled={generating}>
                <FaFileExcel /> Export as Excel
              </button>
              <button className="export-btn-admrep csv-admrep" onClick={() => exportReport('csv')} disabled={generating}>
                <FaDownload /> Export as CSV
              </button>
              <button className="export-btn-admrep print-admrep" onClick={() => window.print()}>
                <FaPrint /> Print Report
              </button>
            </div>
          </div>
        )}

        {/* ============ CLIENT TRANSACTION REPORTS ============ */}
        {activeTab === 'client-transaction' && (
          <div className="report-content-admrep">
            <div className="report-section-admrep">
              <h2>Client Transaction History</h2>
              <p>Displays detailed records of client bookings. Includes payment transactions. Useful for reviewing client activity history.</p>

              <div className="client-stats-grid-admrep">
                <div className="client-stat-card-admrep">
                  <div>
                    <span>Total Clients</span>
                    <strong>{stats.clients.total}</strong>
                  </div>
                </div>
                <div className="client-stat-card-admrep">
                  <div>
                    <span>Active Clients</span>
                    <strong>{stats.clients.active}</strong>
                  </div>
                </div>
                <div className="client-stat-card-admrep">
                  <div>
                    <span>New This Month</span>
                    <strong>{stats.clients.new}</strong>
                  </div>
                </div>
                <div className="client-stat-card-admrep">
                  <div>
                    <span>Total Transactions</span>
                    <strong>{transactions.length}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="report-section-admrep">
              <h2>Client Demographics</h2>
              <div className="demographics-grid-admrep">
                <div className="demo-card-admrep">
                  <h3>Client Type Distribution</h3>
                  <div className="demo-item-admrep">
                    <span>Residential</span>
                    <strong>{Math.round((stats.clients.residential / stats.clients.total) * 100) || 0}%</strong>
                    <div className="progress-bar-admrep">
                      <div className="progress-admrep" style={{ width: `${(stats.clients.residential / stats.clients.total) * 100 || 0}%` }}></div>
                    </div>
                  </div>
                  <div className="demo-item-admrep">
                    <span>Company</span>
                    <strong>{Math.round((stats.clients.company / stats.clients.total) * 100) || 0}%</strong>
                    <div className="progress-bar-admrep">
                      <div className="progress-admrep" style={{ width: `${(stats.clients.company / stats.clients.total) * 100 || 0}%` }}></div>
                    </div>
                  </div>
                  <div className="demo-item-admrep">
                    <span>Industrial</span>
                    <strong>{Math.round((stats.clients.industrial / stats.clients.total) * 100) || 0}%</strong>
                    <div className="progress-bar-admrep">
                      <div className="progress-admrep" style={{ width: `${(stats.clients.industrial / stats.clients.total) * 100 || 0}%` }}></div>
                    </div>
                  </div>
                </div>
                <div className="demo-card-admrep">
                  <h3>Payment Method Distribution</h3>
                  <div className="demo-item-admrep">
                    <span>PayMongo</span>
                    <strong>{transactions.filter(t => t.method === 'PayMongo').length}</strong>
                  </div>
                  <div className="demo-item-admrep">
                    <span>GCash</span>
                    <strong>{transactions.filter(t => t.method === 'gcash').length}</strong>
                  </div>
                  <div className="demo-item-admrep">
                    <span>Cash/Manual</span>
                    <strong>{transactions.filter(t => t.method === 'cash' || t.method === 'Manual').length}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="report-section-admrep">
              <h2>Client Transaction Details</h2>
              <div className="transactions-table-container-admrep">
                <table className="reports-table-admrep">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Client Name</th>
                      <th>Contact</th>
                      <th>Transaction Type</th>
                      <th>Reference</th>
                      <th>Amount</th>
                      <th>Payment Method</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 20).map((transaction, idx) => (
                      <tr key={idx}>
                        <td>{formatDate(transaction.date)}</td>
                        <td className="client-cell-admrep"><strong>{transaction.client}</strong></td>
                        <td>{transaction.clientPhone || 'N/A'}</td>
                        <td><span className="transaction-type-admrep pre-admrep">{transaction.type}</span></td>
                        <td className="ref-cell-admrep">{transaction.reference || transaction.projectName}</td>
                        <td className="amount-admrep">{formatCurrency(transaction.amount)}</td>
                        <td>
                          <span className={`payment-method-admrep ${transaction.method?.toLowerCase()}`}>
                            {transaction.method}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge-admrep ${transaction.status === 'Paid' || transaction.status === 'Completed' ? 'paid-admrep' : transaction.status === 'For Verification' ? 'for-verification-admrep' : 'pending-admrep'}`}>
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="report-actions-admrep">
              <button className="export-btn-admrep pdf-admrep" onClick={() => exportReport('pdf')} disabled={generating}>
                <FaFilePdf /> Export as PDF
              </button>
              <button className="export-btn-admrep excel-admrep" onClick={() => exportReport('xlsx')} disabled={generating}>
                <FaFileExcel /> Export as Excel
              </button>
              <button className="export-btn-admrep csv-admrep" onClick={() => exportReport('csv')} disabled={generating}>
                <FaDownload /> Export as CSV
              </button>
              <button className="export-btn-admrep print-admrep" onClick={() => window.print()}>
                <FaPrint /> Print Report
              </button>
            </div>
          </div>
        )}

        {/* Report Preview Modal */}
        {reportData && (
          <div className="report-preview-overlay-admrep" onClick={() => setReportData(null)}>
            <div className="report-preview-admrep" onClick={e => e.stopPropagation()}>
              <div className="preview-header-admrep">
                <h3>Report Preview</h3>
                <button className="close-preview-admrep" onClick={() => setReportData(null)}><FaTimes /></button>
              </div>
              <div className="preview-content-admrep">
                <pre>{JSON.stringify(reportData, null, 2)}</pre>
              </div>
              <div className="preview-actions-admrep">
                <button className="export-btn-admrep pdf-admrep" onClick={() => exportReport('pdf')}>
                  <FaFilePdf /> Download PDF
                </button>
                <button className="export-btn-admrep csv-admrep" onClick={() => exportReport('xlsx')}>
                  <FaFileExcel /> Download Excel
                </button>
                <button className="export-btn-admrep print-admrep" onClick={() => setReportData(null)}>
                  <FaTimes /> Close
                </button>
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