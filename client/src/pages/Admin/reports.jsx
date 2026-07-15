// pages/Admin/Reports.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { FaSpinner, FaFilePdf, FaFileExcel, FaPrint, FaTimes, FaDownload, FaEye, FaChevronDown } from 'react-icons/fa';
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
  1: { label: 'pending_review', display: 'Pending Review' },
  2: { label: 'pending_payment', display: 'Pending Payment' },
  3: { label: 'scheduled', display: 'Scheduled' },
  4: { label: 'site_visit_ongoing', display: 'Site Visit Ongoing' },
  5: { label: 'device_deployed', display: 'Device Deployed' },
  6: { label: 'data_collecting', display: 'Data Collecting' },
  7: { label: 'data_analyzing', display: 'Data Analyzing' },
  8: { label: 'report_draft', display: 'Report Draft' },
  9: { label: 'quotation_generated', display: 'Quotation Generated' },
  10: { label: 'quotation_accepted', display: 'Quotation Accepted' },
  11: { label: 'completed', display: 'Completed' },
  12: { label: 'cancelled', display: 'Cancelled' }
};

// Assessment Results Summary Ranges
const ASSESSMENT_RESULTS_SUMMARY = {
  IRRADIANCE: {
    POOR: { min: 0, max: 300, label: 'Poor' },
    MODERATE: { min: 301, max: 500, label: 'Moderate' },
    GOOD: { min: 501, max: 700, label: 'Good' },
    EXCELLENT: { min: 701, max: 1000, label: 'Excellent' }
  },
  TEMPERATURE: {
    OPTIMAL: { min: 15, max: 25, label: 'Optimal' },
    ACCEPTABLE: { min: 26, max: 35, label: 'Acceptable' },
    HIGH: { min: 36, max: 45, label: 'High - Efficiency Reduced' },
    CRITICAL: { min: 46, max: 60, label: 'Critical - Significant Loss' }
  },
  HUMIDITY: {
    LOW: { min: 0, max: 30, label: 'Low' },
    MODERATE: { min: 31, max: 60, label: 'Moderate' },
    HIGH: { min: 61, max: 80, label: 'High' },
    VERY_HIGH: { min: 81, max: 100, label: 'Very High - Condensation Risk' }
  },
  SHADING_IMPACT: {
    NEGLIGIBLE: { min: 0, max: 10, label: 'Negligible Impact' },
    LOW: { min: 11, max: 20, label: 'Low Impact' },
    MODERATE: { min: 21, max: 35, label: 'Moderate Impact' },
    SEVERE: { min: 36, max: 100, label: 'Severe Impact - Not Recommended' }
  },
  SITE_SUITABILITY: {
    POOR: { min: 0, max: 39, label: 'Poor - Not Recommended' },
    FAIR: { min: 40, max: 59, label: 'Fair - Consider with Caution' },
    GOOD: { min: 60, max: 79, label: 'Good - Recommended' },
    EXCELLENT: { min: 80, max: 100, label: 'Excellent - Highly Recommended' }
  },
  PAYBACK_PERIOD: {
    EXCELLENT: { min: 0, max: 3, label: 'Excellent ROI' },
    GOOD: { min: 3.1, max: 5, label: 'Good ROI' },
    ACCEPTABLE: { min: 5.1, max: 7, label: 'Acceptable ROI' },
    POOR: { min: 7.1, max: 15, label: 'Poor ROI' }
  },
  CO2_OFFSET: {
    SMALL: { min: 0, max: 2, label: 'Small Impact' },
    MEDIUM: { min: 2.1, max: 5, label: 'Medium Impact' },
    LARGE: { min: 5.1, max: 10, label: 'Large Impact' },
    SIGNIFICANT: { min: 10.1, max: 100, label: 'Significant Impact' }
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
    <div className="reports-container">
      <div className="reports-header">
        <div className="skeleton-line large"></div>
        <div className="skeleton-line medium"></div>
      </div>
      <div className="stats-cards">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="stat-card skeleton-card">
            <div className="skeleton-line small"></div>
            <div className="skeleton-line large"></div>
          </div>
        ))}
      </div>
      <div className="report-tabs">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton-tab"></div>
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
        <title>Reports | Admin | Salfer Engineering</title>
      </Helmet>

      <div className="reports-container">
        <div className="reports-header">
          <h1>Reports & Analytics</h1>
          <p>Generate comprehensive reports and analyze business performance</p>
        </div>

        {/* Quick Stats Cards */}
        <div className="stats-cards">
          <div className="stat-card revenue">
            <div className="stat-info">
              <span className="stat-value">{formatCurrency(stats.revenue.total)}</span>
              <span className="stat-label">Total Revenue</span>
              <span className="stat-change">+{formatCurrency(stats.revenue.thisMonth)} this month</span>
            </div>
          </div>
          <div className="stat-card assessments">
            <div className="stat-info">
              <span className="stat-value">{stats.assessments.total}</span>
              <span className="stat-label">Total Assessments</span>
              <span className="stat-change">{stats.assessments.completed} completed</span>
            </div>
          </div>
          <div className="stat-card projects">
            <div className="stat-info">
              <span className="stat-value">{stats.projects.total}</span>
              <span className="stat-label">Total Projects</span>
              <span className="stat-change">{stats.projects.inProgress} in progress</span>
            </div>
          </div>
          <div className="stat-card clients">
            <div className="stat-info">
              <span className="stat-value">{stats.clients.total}</span>
              <span className="stat-label">Total Clients</span>
              <span className="stat-change">{stats.clients.active} active</span>
            </div>
          </div>
        </div>

        {/* Report Type Tabs */}
        <div className="report-tabs">
          <button
            className={`tab-btn ${activeTab === 'site-assessment' ? 'active' : ''}`}
            onClick={() => { setActiveTab('site-assessment'); setReportData(null); }}
          >
            Site Assessment
          </button>
          <button
            className={`tab-btn ${activeTab === 'project-summary' ? 'active' : ''}`}
            onClick={() => { setActiveTab('project-summary'); setReportData(null); }}
          >
            Project Summary
          </button>
          <button
            className={`tab-btn ${activeTab === 'financial' ? 'active' : ''}`}
            onClick={() => { setActiveTab('financial'); setReportData(null); }}
          >
            Financial
          </button>
          <button
            className={`tab-btn ${activeTab === 'client-transaction' ? 'active' : ''}`}
            onClick={() => { setActiveTab('client-transaction'); setReportData(null); }}
          >
            Client Transactions
          </button>
        </div>

        {/* Report Controls */}
        <div className="report-controls">
          <div className="date-range">
            <label>Date Range</label>
            <div className="date-inputs">
              <input type="date" value={dateRange.startDate} onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} />
              <span>to</span>
              <input type="date" value={dateRange.endDate} onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })} />
            </div>
          </div>

          {activeTab === 'site-assessment' && (
            <div className="report-filter">
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
            <div className="report-filter">
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
            <div className="report-filter">
              <label>Filter by Client</label>
              <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
                <option value="">All Clients</option>
                {clients.map(c => (
                  <option key={c._id} value={c._id}>{c.contactFirstName} {c.contactLastName}</option>
                ))}
              </select>
            </div>
          )}

          <button className="generate-btn" onClick={generateReport} disabled={generating}>
            {generating ? <FaSpinner className="spinning" /> : 'Generate Report'}
          </button>
        </div>

        {/* ============ SITE ASSESSMENT REPORTS ============ */}
        {activeTab === 'site-assessment' && (
          <div className="report-content">
            <div className="report-section">
              <h2>Site Assessment Results</h2>
              <p>Complete results of site evaluations including IoT data, technical findings, and suitability analysis.</p>

              <div className="suitability-summary">
                <div className="suitability-card suitable">
                  <div className="suitability-stats">
                    <span className="label">Suitable for Solar</span>
                    <strong>{stats.assessments.suitable}</strong>
                    <span className="percentage">{stats.assessments.total > 0 ? ((stats.assessments.suitable / stats.assessments.total) * 100).toFixed(1) : 0}%</span>
                  </div>
                </div>
                <div className="suitability-card conditional">
                  <div className="suitability-stats">
                    <span className="label">Conditional Approval</span>
                    <strong>{stats.assessments.conditional}</strong>
                    <span className="percentage">{stats.assessments.total > 0 ? ((stats.assessments.conditional / stats.assessments.total) * 100).toFixed(1) : 0}%</span>
                  </div>
                </div>
                <div className="suitability-card not-suitable">
                  <div className="suitability-stats">
                    <span className="label">Not Suitable</span>
                    <strong>{stats.assessments.notSuitable}</strong>
                    <span className="percentage">{stats.assessments.total > 0 ? ((stats.assessments.notSuitable / stats.assessments.total) * 100).toFixed(1) : 0}%</span>
                  </div>
                </div>
                <div className="suitability-card pending">
                  <div className="suitability-stats">
                    <span className="label">Pending Assessment</span>
                    <strong>{stats.assessments.pending}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="report-section">
              <h2>IoT Data & Environmental Metrics</h2>
              <div className="technical-findings-grid">
                <div className="finding-card irradiance">
                  <div className="finding-info">
                    <span>Average Irradiance</span>
                    <strong>529.17 W/m²</strong>
                    <small>Peak: 1123.40 W/m²</small>
                  </div>
                </div>
                <div className="finding-card temperature">
                  <div className="finding-info">
                    <span>Temperature Impact</span>
                    <strong>42.3°C</strong>
                    <small>-8.2% derating</small>
                  </div>
                </div>
                <div className="finding-card humidity">
                  <div className="finding-info">
                    <span>Average Humidity</span>
                    <strong>67.8%</strong>
                    <small>Range: 45–89%</small>
                  </div>
                </div>
                <div className="finding-card shading">
                  <div className="finding-info">
                    <span>Peak Sun Hours</span>
                    <strong>4.2 hrs/day</strong>
                    <small>12.5% shading loss</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="report-section">
              <h2>Detailed Assessment Results with IoT Data</h2>
              <div className="table-container">
                <table className="reports-table">
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
                            <span className="status-number-badge">
                              {statusNum || 'N/A'}
                            </span>
                          </td>
                          <td className="ref-cell">{assessment.bookingReference}</td>
                          <td className="client-cell">{assessment.clientId?.contactFirstName} {assessment.clientId?.contactLastName}</td>
                          <td className="metric-cell">
                            {avgIrradiance ? `${avgIrradiance.toFixed(0)} W/m²` : 'N/A'}
                            {irradianceRating && <small>({irradianceRating.label})</small>}
                          </td>
                          <td className="metric-cell">{peakSunHours?.toFixed(1) || 'N/A'} hrs</td>
                          <td className="metric-cell">
                            {avgTemp ? `${avgTemp.toFixed(1)}°C` : 'N/A'}
                            {tempRating && <small>({tempRating.label})</small>}
                          </td>
                          <td className="metric-cell">
                            {avgHumidity ? `${avgHumidity.toFixed(0)}%` : 'N/A'}
                            {humidityRating && <small>({humidityRating.label})</small>}
                          </td>
                          <td className="metric-cell">
                            {shadingPercentage !== undefined ? `${shadingPercentage.toFixed(0)}%` : 'N/A'}
                            {shadingRating && <small>({shadingRating.label})</small>}
                          </td>
                          <td className="score-cell">
                            <span className="score-badge">
                              {suitabilityScore || 'N/A'}
                            </span>
                          </td>
                          <td className="recommendation-cell">
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

            <div className="report-actions">
              <button className="export-btn pdf" onClick={() => exportReport('pdf')} disabled={generating}>
                <FaFilePdf /> Export as PDF
              </button>
              <button className="export-btn excel" onClick={() => exportReport('xlsx')} disabled={generating}>
                <FaFileExcel /> Export as Excel
              </button>
            </div>
          </div>
        )}

        {/* ============ PROJECT SUMMARY REPORTS ============ */}
        {activeTab === 'project-summary' && (
          <div className="report-content">
            <div className="report-section">
              <h2>Project Status Overview</h2>
              <p>Shows the overall status of projects. Tracks project progress. Helps monitor pending tasks and milestones.</p>

              <div className="project-stats-grid">
                <div className="project-stat-card">
                  <span className="stat-label">Total Projects</span>
                  <strong className="stat-value">{stats.projects.total}</strong>
                </div>
                <div className="project-stat-card in-progress">
                  <span className="stat-label">In Progress</span>
                  <strong>{stats.projects.inProgress}</strong>
                </div>
                <div className="project-stat-card completed">
                  <span className="stat-label">Completed</span>
                  <strong>{stats.projects.completed}</strong>
                </div>
                <div className="project-stat-card pending">
                  <span className="stat-label">Pending</span>
                  <strong>{stats.projects.pending}</strong>
                </div>
                <div className="project-stat-card full-paid">
                  <span className="stat-label">Full Payment</span>
                  <strong>{stats.projects.fullPaid}</strong>
                </div>
              </div>
            </div>

            <div className="report-section">
              <h2>Project Progress Tracking</h2>
              <div className="table-container">
                <table className="reports-table">
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
                          <td className="project-name-cell"><strong>{project.projectName}</strong></td>
                          <td className="ref-cell">{project.projectReference}</td>
                          <td className="client-cell">{project.clientId?.contactFirstName} {project.clientId?.contactLastName}</td>
                          <td>{project.systemSize || 'N/A'} kWp</td>
                          <td>
                            <span className={`project-status-badge ${project.status}`}>
                              {project.status === 'in_progress' ? 'In Progress' :
                                project.status === 'completed' ? 'Completed' :
                                  project.status === 'full_paid' ? 'Full Payment' :
                                    project.status === 'initial_paid' ? 'Initial Paid' :
                                      project.status === 'quoted' ? 'Quoted' :
                                        project.status === 'approved' ? 'Approved' : 'Pending'}
                            </span>
                          </td>
                          <td>
                            <div className="progress-bar-container">
                              <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                              <span className="progress-text">{progress}%</span>
                            </div>
                          </td>
                          <td className="amount">{formatCurrency(project.amountPaid || 0)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="report-actions">
              <button className="export-btn pdf" onClick={() => exportReport('pdf')} disabled={generating}>
                <FaFilePdf /> Export as PDF
              </button>
              <button className="export-btn excel" onClick={() => exportReport('xlsx')} disabled={generating}>
                <FaFileExcel /> Export as Excel
              </button>
            </div>
          </div>
        )}

        {/* ============ FINANCIAL REPORTS ============ */}
        {activeTab === 'financial' && (
          <div className="report-content">
            <div className="report-section">
              <h2>Financial Summary</h2>
              <p>Summarizes payments made by clients. Includes billing records. Helps track overall financial performance.</p>

              <div className="financial-summary-grid">
                <div className="financial-card total-revenue">
                  <div>
                    <span>Total Revenue</span>
                    <strong>{formatCurrency(stats.revenue.total)}</strong>
                  </div>
                </div>
                <div className="financial-card this-month">
                  <div>
                    <span>This Month</span>
                    <strong>{formatCurrency(stats.revenue.thisMonth)}</strong>
                  </div>
                </div>
                <div className="financial-card last-month">
                  <div>
                    <span>Last Month</span>
                    <strong>{formatCurrency(stats.revenue.lastMonth)}</strong>
                  </div>
                </div>
                <div className="financial-card growth">
                  <div>
                    <span>Growth</span>
                    <strong className={stats.revenue.thisMonth > stats.revenue.lastMonth ? 'positive' : 'negative'}>
                      {stats.revenue.lastMonth > 0 ? ((stats.revenue.thisMonth - stats.revenue.lastMonth) / stats.revenue.lastMonth * 100).toFixed(1) : 0}%
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="report-section">
              <h2>Payment Summary by Status</h2>
              <div className="payment-status-grid">
                <div className="payment-status-card paid">
                  <div>
                    <span>Paid Transactions</span>
                    <strong>{stats.payments.paid}</strong>
                    <small>{formatCurrency(transactions.filter(t => t.status === 'Paid' || t.status === 'Completed').reduce((sum, t) => sum + t.amount, 0))}</small>
                  </div>
                </div>
                <div className="payment-status-card pending">
                  <div>
                    <span>Pending Payments</span>
                    <strong>{stats.payments.pending}</strong>
                  </div>
                </div>
                <div className="payment-status-card verification">
                  <div>
                    <span>For Verification</span>
                    <strong>{stats.payments.forVerification}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="report-section">
              <h2>Recent Transactions</h2>
              <div className="table-container">
                <table className="reports-table">
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
                        <td className="client-cell">{transaction.client}</td>
                        <td><span className="transaction-type pre">{transaction.type}</span></td>
                        <td className="ref-cell">{transaction.reference || transaction.projectName}</td>
                        <td className="amount">{formatCurrency(transaction.amount)}</td>
                        <td>
                          <span className={`payment-method ${transaction.method?.toLowerCase()}`}>
                            {transaction.method}
                          </span>
                        </td>
                        <td>
                          <span className="status-badge">
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="report-actions">
              <button className="export-btn pdf" onClick={() => exportReport('pdf')} disabled={generating}>
                <FaFilePdf /> Export as PDF
              </button>
              <button className="export-btn excel" onClick={() => exportReport('xlsx')} disabled={generating}>
                <FaFileExcel /> Export as Excel
              </button>
            </div>
          </div>
        )}

        {/* ============ CLIENT TRANSACTION REPORTS ============ */}
        {activeTab === 'client-transaction' && (
          <div className="report-content">
            <div className="report-section">
              <h2>Client Transaction History</h2>
              <p>Displays detailed records of client bookings. Includes payment transactions. Useful for reviewing client activity history.</p>

              <div className="client-stats-grid">
                <div className="client-stat-card">
                  <div>
                    <span>Total Clients</span>
                    <strong>{stats.clients.total}</strong>
                  </div>
                </div>
                <div className="client-stat-card">
                  <div>
                    <span>Active Clients</span>
                    <strong>{stats.clients.active}</strong>
                  </div>
                </div>
                <div className="client-stat-card">
                  <div>
                    <span>New This Month</span>
                    <strong>{stats.clients.new}</strong>
                  </div>
                </div>
                <div className="client-stat-card">
                  <div>
                    <span>Total Transactions</span>
                    <strong>{transactions.length}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="report-section">
              <h2>Client Demographics</h2>
              <div className="demographics-grid">
                <div className="demo-card">
                  <h3>Client Type Distribution</h3>
                  <div className="demo-item">
                    <span>Residential</span>
                    <strong>{Math.round((stats.clients.residential / stats.clients.total) * 100) || 0}%</strong>
                    <div className="progress-bar">
                      <div className="progress" style={{ width: `${(stats.clients.residential / stats.clients.total) * 100 || 0}%` }}></div>
                    </div>
                  </div>
                  <div className="demo-item">
                    <span>Company</span>
                    <strong>{Math.round((stats.clients.company / stats.clients.total) * 100) || 0}%</strong>
                    <div className="progress-bar">
                      <div className="progress" style={{ width: `${(stats.clients.company / stats.clients.total) * 100 || 0}%` }}></div>
                    </div>
                  </div>
                  <div className="demo-item">
                    <span>Industrial</span>
                    <strong>{Math.round((stats.clients.industrial / stats.clients.total) * 100) || 0}%</strong>
                    <div className="progress-bar">
                      <div className="progress" style={{ width: `${(stats.clients.industrial / stats.clients.total) * 100 || 0}%` }}></div>
                    </div>
                  </div>
                </div>
                <div className="demo-card">
                  <h3>Payment Method Distribution</h3>
                  <div className="demo-item">
                    <span>PayMongo</span>
                    <strong>{transactions.filter(t => t.method === 'PayMongo').length}</strong>
                  </div>
                  <div className="demo-item">
                    <span>GCash</span>
                    <strong>{transactions.filter(t => t.method === 'gcash').length}</strong>
                  </div>
                  <div className="demo-item">
                    <span>Cash/Manual</span>
                    <strong>{transactions.filter(t => t.method === 'cash' || t.method === 'Manual').length}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="report-section">
              <h2>Client Transaction Details</h2>
              <div className="table-container">
                <table className="reports-table">
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
                        <td className="client-cell"><strong>{transaction.client}</strong></td>
                        <td>{transaction.clientPhone || 'N/A'}</td>
                        <td><span className="transaction-type pre">{transaction.type}</span></td>
                        <td className="ref-cell">{transaction.reference || transaction.projectName}</td>
                        <td className="amount">{formatCurrency(transaction.amount)}</td>
                        <td>
                          <span className={`payment-method ${transaction.method?.toLowerCase()}`}>
                            {transaction.method}
                          </span>
                        </td>
                        <td>
                          <span className="status-badge">
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="report-actions">
              <button className="export-btn pdf" onClick={() => exportReport('pdf')} disabled={generating}>
                <FaFilePdf /> Export as PDF
              </button>
              <button className="export-btn excel" onClick={() => exportReport('xlsx')} disabled={generating}>
                <FaFileExcel /> Export as Excel
              </button>
            </div>
          </div>
        )}

        {/* Report Preview Modal */}
        {reportData && (
          <div className="report-preview-overlay" onClick={() => setReportData(null)}>
            <div className="report-preview" onClick={e => e.stopPropagation()}>
              <div className="preview-header">
                <h3>Report Preview</h3>
                <button className="close-preview" onClick={() => setReportData(null)}><FaTimes /></button>
              </div>
              <div className="preview-content">
                <pre>{JSON.stringify(reportData, null, 2)}</pre>
              </div>
              <div className="preview-actions">
                <button className="export-btn pdf" onClick={() => exportReport('pdf')}>
                  <FaFilePdf /> Download PDF
                </button>
                <button className="export-btn excel" onClick={() => exportReport('xlsx')}>
                  <FaFileExcel /> Download Excel
                </button>
                <button className="export-btn print" onClick={() => setReportData(null)}>
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