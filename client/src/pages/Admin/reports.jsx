// pages/Admin/Reports.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import { FaSpinner, FaFilePdf, FaFileExcel, FaTimes, FaChevronDown } from 'react-icons/fa';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import '../../styles/Admin/reports.css';
import logo from '../../assets/Salfare_Logo.png';

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

const Reports = () => {
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('site-assessment');  const [dateRange, setDateRange] = useState({
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
  const [transactions, setTransactions] = useState([]);

  // Real-time data updates (no page refresh). Cleaned up on unmount.
  useRealtimeTable(['pre-assessments', 'projects', 'users', 'service-requests'], () => {
    fetchAllData();
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

      // Build transactions for financial report
      const preTransactions = allAssessments
        .filter(a => a.invoiceNumber)
        .map(a => ({
          id: a._id,
          type: 'Pre-Assessment',
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
          clientType: a.clientId?.client_type || 'Residential',
          address: a.clientId?.address
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
          clientEmail: p.clientId?.userId?.email,
          clientPhone: p.clientId?.contactNumber,
          clientType: p.clientId?.client_type || 'Residential',
          address: p.clientId?.address
        }));

      const allTransactions = [...preTransactions, ...projectTransactions].sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(allTransactions);

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
        type: activeTab === 'clients' ? 'client-transaction' : activeTab, // ✅ Map 'clients' to 'client-transaction'
        dateRange,
        filters: {}
      };

      if (activeTab === 'site-assessment' && selectedAssessment) {
        reportPayload.filters.assessmentId = selectedAssessment;
      } else if (activeTab === 'project-summary' && selectedProject) {
        reportPayload.filters.projectId = selectedProject;
      } else if (activeTab === 'clients' && selectedClient) {
        reportPayload.filters.clientId = selectedClient;
      } else if (activeTab === 'services') {
        if (selectedServiceType) reportPayload.filters.serviceType = selectedServiceType;
        if (selectedServiceStatus) reportPayload.filters.status = selectedServiceStatus;
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

  // The table and its export must come from the same server query.
  const fetchCurrentReport = async () => {
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

      if (false && reportData && reportData.report) {
        dataToExport = reportData.report;
      } else {
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
      }

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

  // Skeleton Loader
  const SkeletonLoader = () => (
    <div className="reports-container">
      <div className="reports-header-reports">
        <div className="skeleton-line-large-reports"></div>
        <div className="skeleton-line-medium-reports"></div>
      </div>
      <div className="report-tabs-reports">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="skeleton-tab-reports"></div>
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

      <div className="reports-container-reports">
        {/* --- Minimalist Header --- */}
      

        {/* Report Type Tabs */}
        <div className={`report-tabs-reports ${showMoreTabs ? 'show-more-reports' : ''}`}>
          <button
            className={`tab-btn-reports ${activeTab === 'site-assessment' ? 'active-reports' : ''}`}
            onClick={() => { setActiveTab('site-assessment'); setReportData(null); setShowMoreTabs(false); }}
          >
            Site Assessment
          </button>
          <button
            className={`tab-btn-reports ${activeTab === 'project-summary' ? 'active-reports' : ''}`}
            onClick={() => { setActiveTab('project-summary'); setReportData(null); setShowMoreTabs(false); }}
          >
            Project Summary
          </button>
          <button
            className={`tab-btn-reports desktop-tab-reports ${activeTab === 'financial' ? 'active-reports' : ''}`}
            onClick={() => { setActiveTab('financial'); setReportData(null); setShowMoreTabs(false); }}
          >
            Financial
          </button>
          <button
            className={`tab-btn-reports desktop-tab-reports ${activeTab === 'clients' ? 'active-reports' : ''}`}
            onClick={() => { setActiveTab('clients'); setReportData(null); setShowMoreTabs(false); }}
          >
            Clients
          </button>
          <button
            className={`tab-btn-reports desktop-tab-reports ${activeTab === 'services' ? 'active-reports' : ''}`}
            onClick={() => { setActiveTab('services'); setReportData(null); setShowMoreTabs(false); }}
          >
            Services
          </button>
          <div className="more-wrap-reports">
            <button
              className={`tab-btn-reports more-tab-btn-reports ${(activeTab === 'financial' || activeTab === 'clients' || activeTab === 'services') ? 'active-reports' : ''}`}
              onClick={() => setShowMoreTabs((v) => !v)}
              aria-expanded={showMoreTabs}
              aria-haspopup="true"
              type="button"
            >
              More <FaChevronDown className={`more-chevron-reports ${showMoreTabs ? 'open' : ''}`} />
            </button>
            {showMoreTabs && (
              <div className="more-menu-reports" role="menu">
                <button
                  role="menuitem"
                  className={`more-item-reports ${activeTab === 'financial' ? 'active-reports' : ''}`}
                  onClick={() => { setActiveTab('financial'); setReportData(null); setShowMoreTabs(false); }}
                >
                  Financial
                </button>
                <button
                  role="menuitem"
                  className={`more-item-reports ${activeTab === 'clients' ? 'active-reports' : ''}`}
                  onClick={() => { setActiveTab('clients'); setReportData(null); setShowMoreTabs(false); }}
                >
                  Clients
                </button>
                <button
                  role="menuitem"
                  className={`more-item-reports ${activeTab === 'services' ? 'active-reports' : ''}`}
                  onClick={() => { setActiveTab('services'); setReportData(null); setShowMoreTabs(false); }}
                >
                  Services
                </button>
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

        </div>

        {/* ============ SITE ASSESSMENT REPORTS ============ */}
        {activeTab === 'site-assessment' && (
          <div className="report-content-reports">
            <div className="report-section-reports">
              <h2>Site Assessment</h2>
              <p>Complete list of site evaluations with booking details and status.</p>
            </div>

            <div className="report-section-reports">
              <div className="table-container-reports">
                <table className="reports-table-reports">
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
                    {(reportData?.report?.assessments || []).map(assessment => {
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
            </div>

            <div className="report-actions-reports">
              <button className="export-btn-reports pdf" onClick={() => exportReport('pdf')} disabled={generating}>
                <FaFilePdf /> Export as PDF
              </button>
              <button className="export-btn-reports excel" onClick={() => exportReport('xlsx')} disabled={generating}>
                <FaFileExcel /> Export as Excel
              </button>
            </div>
          </div>
        )}

        {/* ============ PROJECT SUMMARY REPORTS ============ */}
        {activeTab === 'project-summary' && (
          <div className="report-content-reports">
            <div className="report-section-reports">
              <h2>Project Summary</h2>
              <p>Overview of all projects with key details and status.</p>
            </div>

            <div className="report-section-reports">
              <div className="table-container-reports">
                <table className="reports-table-reports">
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
                    {(reportData?.report?.projects || []).map(project => (
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
            </div>

            <div className="report-actions-reports">
              <button className="export-btn-reports pdf" onClick={() => exportReport('pdf')} disabled={generating}>
                <FaFilePdf /> Export as PDF
              </button>
              <button className="export-btn-reports excel" onClick={() => exportReport('xlsx')} disabled={generating}>
                <FaFileExcel /> Export as Excel
              </button>
            </div>
          </div>
        )}

        {/* ============ FINANCIAL REPORTS ============ */}
        {activeTab === 'financial' && (
          <div className="report-content-reports">
            <div className="report-section-reports">
              <h2>Financial</h2>
              <p>Summary of all financial transactions including payments and status.</p>
            </div>

            <div className="report-section-reports">
              <div className="table-container-reports">
                <table className="reports-table-reports">
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
                    {(reportData?.report?.payments || []).map((transaction, idx) => (
                      <tr key={idx}>
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
            </div>

            <div className="report-actions-reports">
              <button className="export-btn-reports pdf" onClick={() => exportReport('pdf')} disabled={generating}>
                <FaFilePdf /> Export as PDF
              </button>
              <button className="export-btn-reports excel" onClick={() => exportReport('xlsx')} disabled={generating}>
                <FaFileExcel /> Export as Excel
              </button>
            </div>
          </div>
        )}

        {/* ============ CLIENTS REPORTS ============ */}
        {activeTab === 'clients' && (
          <div className="report-content-reports">
            <div className="report-section-reports">
              <h2>Clients</h2>
              <p>Complete list of all clients with their contact details and information.</p>
            </div>

            <div className="report-section-reports">
              <div className="table-container-reports">
                <table className="reports-table-reports">
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
                    {(reportData?.report?.clients || []).length > 0 ? (
                      (reportData?.report?.clients || []).map(client => (
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
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" data-label="" className="empty-state-reports">No clients found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="report-actions-reports">
              <button className="export-btn-reports pdf" onClick={() => exportReport('pdf')} disabled={generating}>
                <FaFilePdf /> Export as PDF
              </button>
              <button className="export-btn-reports excel" onClick={() => exportReport('xlsx')} disabled={generating}>
                <FaFileExcel /> Export as Excel
              </button>
            </div>
          </div>
        )}

        {/* ============ SERVICES REPORTS ============ */}
        {activeTab === 'services' && (
          <div className="report-content-reports">
            <div className="report-section-reports">
              <h2>Services</h2>
              <p>Complete list of service requests with customer details and status.</p>
            </div>

            <div className="report-section-reports">
              <div className="table-container-reports">
                <table className="reports-table-reports">
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
                    {(reportData?.report?.services || []).length > 0 ? (
                      (reportData?.report?.services || []).map((service, idx) => (
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
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" data-label="" className="empty-state-reports">No service requests found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="report-actions-reports">
              <button className="export-btn-reports pdf" onClick={() => exportReport('pdf')} disabled={generating}>
                <FaFilePdf /> Export as PDF
              </button>
              <button className="export-btn-reports excel" onClick={() => exportReport('xlsx')} disabled={generating}>
                <FaFileExcel /> Export as Excel
              </button>
            </div>
          </div>
        )}

        {/* Report Preview Modal */}
        {false && reportData && reportData.report && (
          <div className="report-preview-overlay-reports" onClick={() => setReportData(null)}>
            <div className="report-preview-reports" onClick={e => e.stopPropagation()}>
              <div className="preview-header-reports">
                <button className="close-preview-reports" onClick={() => setReportData(null)}><FaTimes /></button>
              </div>
              <div className="preview-content-reports">
                {/* Company Logo and Report Header */}
                <div className="report-header-reports">
                  <div className="company-info-reports">
                    <img
                      src={logo}
                      alt="Salfer Engineering"
                      className="company-logo-reports"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                    <div className="company-logo-placeholder-reports" style={{ display: 'none' }}>
                      <span>🏢</span>
                    </div>
                    <div className="company-details-reports">
                      <h2 className="company-name-reports">Salfer Engineering</h2>
                      <p className="company-address-reports">San Nicolas St. Bunsuran 3rd, Pandi, Bulacan</p>
                      <p className="company-tagline-reports">Solar Technology Enterprise</p>
                    </div>
                  </div>
                  <div className="report-title-section-reports">
                    <h3 className="report-title-reports">
                      {activeTab === 'clients' ? 'Clients Report' : activeTab === 'services' ? 'Services Report' : reportData.report.title || 'Report'}
                    </h3>
                    <p className="report-generated-reports">Generated: {new Date(reportData.report.generatedAt).toLocaleString()}</p>
                    {reportData.report.dateRange && (
                      <p className="report-date-range-reports">
                        Date Range: {reportData.report.dateRange.startDate || 'All'} to {reportData.report.dateRange.endDate || 'All'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Assessment Details Table - Only for site-assessment tab */}
                {activeTab === 'site-assessment' && reportData.report.assessments && reportData.report.assessments.length > 0 && (
                  <div className="preview-table-section-reports">
                    <h4>Assessment Details</h4>
                    <div className="table-container-reports">
                      <table className="reports-table-reports">
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
                          {reportData.report.assessments.slice(0, 10).map((item, index) => (
                            <tr key={index}>
                              <td data-label="Booking Ref" className="ref-cell-reports">{item.bookingReference || 'N/A'}</td>
                              <td data-label="Client Name" className="client-cell-reports">{item.clientName || 'N/A'}</td>
                              <td data-label="Contact">{item.clientContact || 'N/A'}</td>
                              <td data-label="Type">
                                <span className="property-type-badge-reports">
                                  {item.propertyType || 'N/A'}
                                </span>
                              </td>
                              <td data-label="Status">
                                <span className="status-badge-reports">
                                  {item.statusDisplay || item.assessmentStatus || 'N/A'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {reportData.report.assessments.length > 10 && (
                        <p className="preview-note-reports">Showing 10 of {reportData.report.assessments.length} records</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Project Details Table - Only for project-summary tab */}
                {activeTab === 'project-summary' && reportData.report.projects && reportData.report.projects.length > 0 && (
                  <div className="preview-table-section-reports">
                    <h4>Project Details</h4>
                    <div className="table-container-reports">
                      <table className="reports-table-reports">
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
                          {reportData.report.projects.slice(0, 10).map((item, index) => (
                            <tr key={index}>
                              <td data-label="Project Ref" className="ref-cell-reports">{item.projectReference || 'N/A'}</td>
                              <td data-label="Client Name" className="client-cell-reports">{item.clientName || 'N/A'}</td>
                              <td data-label="Contact">{item.clientContact || 'N/A'}</td>
                              <td data-label="System Type">
                                <span className="system-type-badge-reports">
                                  {item.systemType || 'N/A'}
                                </span>
                              </td>
                              <td data-label="System Size">{item.systemSize || 'N/A'} kWp</td>
                              <td data-label="Status">
                                <span className={`project-status-badge-reports ${item.status?.toLowerCase()}`}>
                                  {item.status || 'N/A'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {reportData.report.projects.length > 10 && (
                        <p className="preview-note-reports">Showing 10 of {reportData.report.projects.length} records</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment Details Table - Only for financial tab */}
                {activeTab === 'financial' && reportData.report.payments && reportData.report.payments.length > 0 && (
                  <div className="preview-table-section-reports">
                    <h4>Payment Details</h4>
                    <div className="table-container-reports">
                      <table className="reports-table-reports">
                        <thead>
                          <tr>
                            <th>Reference</th>
                            <th>Client Name</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Status</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.report.payments.slice(0, 10).map((item, index) => (
                            <tr key={index}>
                              <td data-label="Reference" className="ref-cell-reports">{item.reference || item.projectName || 'N/A'}</td>
                              <td data-label="Client Name" className="client-cell-reports">{item.clientName || item.client || 'N/A'}</td>
                              <td data-label="Amount" className="amount-reports">{formatCurrency(item.amount || 0)}</td>
                              <td data-label="Method">
                                <span className={`payment-method-reports ${(item.method || item.paymentMethod || '').toLowerCase()}`}>
                                  {item.method || item.paymentMethod || 'N/A'}
                                </span>
                              </td>
                              <td data-label="Status">
                                <span className="status-badge-reports">
                                  {item.status || 'N/A'}
                                </span>
                              </td>
                              <td data-label="Date">{item.date ? formatDate(item.date) : 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {reportData.report.payments.length > 10 && (
                        <p className="preview-note-reports">Showing 10 of {reportData.report.payments.length} records</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Clients Details Table - Only for clients tab */}
                {activeTab === 'clients' && reportData.report.clients && reportData.report.clients.length > 0 && (
                  <div className="preview-table-section-reports">
                    <h4>Client Details</h4>
                    <div className="table-container-reports">
                      <table className="reports-table-reports">
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
                          {reportData.report.clients.slice(0, 10).map((item, index) => (
                            <tr key={index}>
                              <td data-label="Name" className="client-cell-reports"><strong>{item.clientName || 'N/A'}</strong></td>
                              <td data-label="Contact">{item.clientContact || 'N/A'}</td>
                              <td data-label="Email">{item.email || 'N/A'}</td>
                              <td data-label="Client Type">
                                <span className="client-type-badge-reports">
                                  {item.clientType || 'Residential'}
                                </span>
                              </td>
                              <td data-label="Address">
                                {item.address || 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {reportData.report.clients.length > 10 && (
                        <p className="preview-note-reports">Showing 10 of {reportData.report.clients.length} records</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Services Details Table - Only for services tab */}
                {activeTab === 'services' && reportData.report.services && reportData.report.services.length > 0 && (
                  <div className="preview-table-section-reports">
                    <h4>Service Details</h4>
                    <div className="table-container-reports">
                      <table className="reports-table-reports">
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
                          {reportData.report.services.slice(0, 10).map((item, index) => (
                            <tr key={index}>
                              <td data-label="Reference" className="ref-cell-reports">{item.reference || 'N/A'}</td>
                              <td data-label="Client Name" className="client-cell-reports">{item.clientName || 'N/A'}</td>
                              <td data-label="Contact">{item.clientContact || 'N/A'}</td>
                              <td data-label="Service Type">
                                <span className="system-type-badge-reports">
                                  {item.serviceType || 'N/A'}
                                </span>
                              </td>
                              <td data-label="Preferred Date">{item.preferredDate ? formatDate(item.preferredDate) : 'N/A'}</td>
                              <td data-label="Status">
                                <span className="status-badge-reports">
                                  {item.status || 'N/A'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {reportData.report.services.length > 10 && (
                        <p className="preview-note-reports">Showing 10 of {reportData.report.services.length} records</p>
                      )}
                    </div>
                  </div>
                )}

                {!reportData.report.assessments?.length &&
                  !reportData.report.projects?.length &&
                  !reportData.report.payments?.length &&
                  !reportData.report.clients?.length &&
                  !reportData.report.services?.length && (
                    <div className="preview-raw-reports">
                      <pre>{JSON.stringify(reportData.report, null, 2)}</pre>
                    </div>
                  )}
              </div>
              <div className="preview-actions-reports">
                <button className="export-btn-reports pdf" onClick={() => exportReport('pdf')}>
                  <FaFilePdf /> Download PDF
                </button>
                <button className="export-btn-reports excel" onClick={() => exportReport('xlsx')}>
                  <FaFileExcel /> Download Excel
                </button>
                <button className="export-btn-reports print" onClick={() => setReportData(null)}>
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