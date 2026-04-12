// pages/Admin/Reports.jsx

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { 
  FaChartLine, FaFileInvoice, FaUsers, FaSolarPanel, FaMicrochip, 
  FaDownload, FaSpinner, FaCalendarAlt, FaMoneyBillWave, FaProjectDiagram, 
  FaClipboardList, FaChartBar, FaChartPie, FaFileExcel, FaFilePdf, 
  FaPrint, FaEnvelope, FaFilter, FaSearch, FaChevronLeft, FaChevronRight, 
  FaEye, FaCheckCircle, FaExclamationTriangle, FaClipboardCheck, FaHistory,
  FaBuilding, FaHardHat, FaRulerCombined, FaThermometerHalf, FaTachometerAlt,
  FaDollarSign, FaCreditCard, FaWallet, FaReceipt, FaUserCheck, FaUserClock,
  FaCheck, FaTimes, FaArrowRight, FaClock, FaBoxes, FaTools
} from 'react-icons/fa';
import '../../styles/Admin/reports.css';

const Reports = () => {
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
        const peakSunHours = assessment.assessmentResults?.peakSunHours;
        const shadingPercentage = assessment.assessmentResults?.shadingPercentage;
        
        if (peakSunHours && shadingPercentage) {
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
        return assessment.assessmentResults?.summary?.siteSuitabilityScore || null;
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
      alert('Report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      alert(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const exportReport = async (format) => {
    setGenerating(true);
    try {
      const token = sessionStorage.getItem('token');
      
      // If we have generated report data, use it
      let dataToExport = null;
      
      if (reportData && reportData.report) {
        // Use the already generated report data
        dataToExport = reportData.report;
        console.log('Using generated report data');
      } else {
        // Otherwise fetch fresh data with filters
        console.log('Fetching fresh data for export...');
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
        alert('No data to export. Please generate a report first.');
        setGenerating(false);
        return;
      }
      
      console.log('Exporting data:', dataToExport.summary);
      
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
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([exportResponse.data]));
      const link = document.createElement('a');
      link.href = url;
      const fileExtension = format === 'csv' ? 'csv' : format === 'pdf' ? 'pdf' : 'xlsx';
      link.setAttribute('download', `${activeTab}_report_${new Date().toISOString().split('T')[0]}.${fileExtension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      alert(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting report:', error);
      if (error.response && error.response.data) {
        const reader = new FileReader();
        reader.onload = function() {
          try {
            const errorData = JSON.parse(reader.result);
            alert(errorData.message || 'Failed to export report');
          } catch(e) {
            alert('Failed to export report');
          }
        };
        reader.readAsText(error.response.data);
      } else {
        alert('Failed to export report');
      }
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
    <div className="reports-container-adminreports">
      <div className="reports-header-adminreports">
        <div className="skeleton-line-adminreports large-adminreports"></div>
        <div className="skeleton-line-adminreports medium-adminreports"></div>
      </div>
      <div className="stats-cards-adminreports">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="stat-card-adminreports skeleton-card-adminreports">
            <div className="skeleton-line-adminreports small-adminreports"></div>
            <div className="skeleton-line-adminreports large-adminreports"></div>
          </div>
        ))}
      </div>
      <div className="report-tabs-adminreports">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton-tab-adminreports"></div>
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

      <div className="reports-container-adminreports">
        <div className="reports-header-adminreports">
          <h1>Reports & Analytics</h1>
          <p>Generate comprehensive reports and analyze business performance</p>
        </div>

        {/* Quick Stats Cards */}
        <div className="stats-cards-adminreports">
          <div className="stat-card-adminreports revenue-adminreports">
            <div className="stat-info-adminreports">
              <span className="stat-value-adminreports">{formatCurrency(stats.revenue.total)}</span>
              <span className="stat-label-adminreports">Total Revenue</span>
              <span className="stat-change-adminreports">+{formatCurrency(stats.revenue.thisMonth)} this month</span>
            </div>
          </div>
          <div className="stat-card-adminreports assessments-adminreports">
            <div className="stat-info-adminreports">
              <span className="stat-value-adminreports">{stats.assessments.total}</span>
              <span className="stat-label-adminreports">Total Assessments</span>
              <span className="stat-change-adminreports">{stats.assessments.completed} completed</span>
            </div>
          </div>
          <div className="stat-card-adminreports projects-adminreports">
            <div className="stat-info-adminreports">
              <span className="stat-value-adminreports">{stats.projects.total}</span>
              <span className="stat-label-adminreports">Total Projects</span>
              <span className="stat-change-adminreports">{stats.projects.inProgress} in progress</span>
            </div>
          </div>
          <div className="stat-card-adminreports clients-adminreports">
            <div className="stat-info-adminreports">
              <span className="stat-value-adminreports">{stats.clients.total}</span>
              <span className="stat-label-adminreports">Total Clients</span>
              <span className="stat-change-adminreports">{stats.clients.active} active</span>
            </div>
          </div>
        </div>

        {/* Report Type Tabs - 4 Reports */}
        <div className="report-tabs-adminreports">
          <button 
            className={`tab-btn-adminreports ${activeTab === 'site-assessment' ? 'active-adminreports' : ''}`} 
            onClick={() => { setActiveTab('site-assessment'); setReportData(null); }}
          >
            <FaClipboardCheck /> Site Assessment Reports
          </button>
          <button 
            className={`tab-btn-adminreports ${activeTab === 'project-summary' ? 'active-adminreports' : ''}`} 
            onClick={() => { setActiveTab('project-summary'); setReportData(null); }}
          >
            <FaProjectDiagram /> Project Summary Reports
          </button>
          <button 
            className={`tab-btn-adminreports ${activeTab === 'financial' ? 'active-adminreports' : ''}`} 
            onClick={() => { setActiveTab('financial'); setReportData(null); }}
          >
            <FaMoneyBillWave /> Financial Reports
          </button>
          <button 
            className={`tab-btn-adminreports ${activeTab === 'client-transaction' ? 'active-adminreports' : ''}`} 
            onClick={() => { setActiveTab('client-transaction'); setReportData(null); }}
          >
            <FaHistory /> Client Transaction Reports
          </button>
        </div>

        {/* Report Controls */}
        <div className="report-controls-adminreports">
          <div className="date-range-adminreports">
            <label><FaCalendarAlt /> Date Range</label>
            <div className="date-inputs-adminreports">
              <input type="date" value={dateRange.startDate} onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} />
              <span>to</span>
              <input type="date" value={dateRange.endDate} onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })} />
            </div>
          </div>
          
          {/* Dynamic filters based on active tab */}
          {activeTab === 'site-assessment' && (
            <div className="report-filter-adminreports">
              <label><FaClipboardList /> Filter by Assessment</label>
              <select value={selectedAssessment} onChange={(e) => setSelectedAssessment(e.target.value)}>
                <option value="">All Assessments</option>
                {assessments.map(a => (
                  <option key={a._id} value={a._id}>{a.bookingReference} - {a.clientId?.contactFirstName} {a.clientId?.contactLastName}</option>
                ))}
              </select>
            </div>
          )}
          
          {activeTab === 'project-summary' && (
            <div className="report-filter-adminreports">
              <label><FaProjectDiagram /> Filter by Project</label>
              <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
                <option value="">All Projects</option>
                {projects.map(p => (
                  <option key={p._id} value={p._id}>{p.projectName} - {p.projectReference}</option>
                ))}
              </select>
            </div>
          )}
          
          {activeTab === 'client-transaction' && (
            <div className="report-filter-adminreports">
              <label><FaUsers /> Filter by Client</label>
              <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
                <option value="">All Clients</option>
                {clients.map(c => (
                  <option key={c._id} value={c._id}>{c.contactFirstName} {c.contactLastName}</option>
                ))}
              </select>
            </div>
          )}
          
          <button className="generate-btn-adminreports" onClick={generateReport} disabled={generating}>
            {generating ? <FaSpinner className="spinning" /> : <FaChartLine />} Generate Report
          </button>
        </div>

        {/* ============ SITE ASSESSMENT REPORTS ============ */}
        {activeTab === 'site-assessment' && (
          <div className="report-content-adminreports">
            <div className="report-section-adminreports">
              <h2><FaClipboardCheck /> Site Assessment Results</h2>
              <p>Contains results of site evaluations. Includes technical findings from assessments. Helps review whether a site is suitable for solar installation.</p>
              
              <div className="suitability-summary-adminreports">
                <div className="suitability-card suitable">
                  <FaCheckCircle />
                  <div className="suitability-stats">
                    <span className="label">Suitable for Solar</span>
                    <strong>{stats.assessments.suitable}</strong>
                    <span className="percentage">{stats.assessments.total > 0 ? ((stats.assessments.suitable / stats.assessments.total) * 100).toFixed(1) : 0}%</span>
                  </div>
                </div>
                <div className="suitability-card conditional">
                  <FaExclamationTriangle />
                  <div className="suitability-stats">
                    <span className="label">Conditional Approval</span>
                    <strong>{stats.assessments.conditional}</strong>
                    <span className="percentage">{stats.assessments.total > 0 ? ((stats.assessments.conditional / stats.assessments.total) * 100).toFixed(1) : 0}%</span>
                  </div>
                </div>
                <div className="suitability-card not-suitable">
                  <FaTimes />
                  <div className="suitability-stats">
                    <span className="label">Not Suitable</span>
                    <strong>{stats.assessments.notSuitable}</strong>
                    <span className="percentage">{stats.assessments.total > 0 ? ((stats.assessments.notSuitable / stats.assessments.total) * 100).toFixed(1) : 0}%</span>
                  </div>
                </div>
                <div className="suitability-card pending">
                  <FaClock />
                  <div className="suitability-stats">
                    <span className="label">Pending Assessment</span>
                    <strong>{stats.assessments.pending}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="report-section-adminreports">
              <h2><FaHardHat /> Technical Findings Summary</h2>
              <div className="technical-findings-grid">
                <div className="finding-card">
                  <FaRulerCombined />
                  <div className="finding-info">
                    <span>Average Roof Area</span>
                    <strong>85 m²</strong>
                  </div>
                </div>
                <div className="finding-card">
                  <FaThermometerHalf />
                  <div className="finding-info">
                    <span>Temperature Impact</span>
                    <strong>-8% efficiency</strong>
                  </div>
                </div>
                <div className="finding-card">
                  <FaSolarPanel />
                  <div className="finding-info">
                    <span>Peak Sun Hours</span>
                    <strong>4.8 hrs/day</strong>
                  </div>
                </div>
                <div className="finding-card">
                  <FaTachometerAlt />
                  <div className="finding-info">
                    <span>Average Shading</span>
                    <strong>12%</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="report-section-adminreports">
              <h2>Recent Assessment Results</h2>
              <div className="assessments-table-container">
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>Booking Ref</th>
                      <th>Client Name</th>
                      <th>Roof Area</th>
                      <th>Peak Sun Hours</th>
                      <th>Shading</th>
                      <th>Suitability Score</th>
                      <th>Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessments.slice(0, 10).map(assessment => {
                      const peakSunHours = assessment.assessmentResults?.peakSunHours;
                      const shadingPercentage = assessment.assessmentResults?.shadingPercentage;
                      let suitabilityScore = assessment.assessmentResults?.summary?.siteSuitabilityScore;
                      
                      if (!suitabilityScore && peakSunHours && shadingPercentage) {
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
                      
                      const roofArea = (assessment.engineerAssessment?.roofLength || assessment.roofLength) && 
                                      (assessment.engineerAssessment?.roofWidth || assessment.roofWidth)
                        ? ((assessment.engineerAssessment?.roofLength || assessment.roofLength) * 
                           (assessment.engineerAssessment?.roofWidth || assessment.roofWidth)).toFixed(1)
                        : null;
                      
                      return (
                        <tr key={assessment._id}>
                          <td>{assessment.bookingReference}</td>
                          <td>{assessment.clientId?.contactFirstName} {assessment.clientId?.contactLastName}</td>
                          <td>{roofArea ? `${roofArea} m²` : 'N/A'}</td>
                          <td>{peakSunHours?.toFixed(1) || 'N/A'}</td>
                          <td>{shadingPercentage?.toFixed(0) || 'N/A'}%</td>
                          <td>
                            <span className={`score-badge ${suitabilityScore >= 70 ? 'high' : suitabilityScore >= 50 ? 'medium' : 'low'}`}>
                              {suitabilityScore || 'N/A'}
                            </span>
                          </td>
                          <td>
                            {suitabilityScore >= 70 ? '✓ Suitable for Solar' : 
                             suitabilityScore >= 50 ? '⚠ Conditional Approval' : 
                             suitabilityScore ? '✗ Not Recommended' : '⏳ Pending Assessment'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="report-actions-adminreports">
              <button className="export-btn-adminreports" onClick={() => exportReport('pdf')} disabled={generating}>
                <FaFilePdf /> Export as PDF
              </button>
              <button className="export-btn-adminreports" onClick={() => exportReport('xlsx')} disabled={generating}>
                <FaFileExcel /> Export as Excel
              </button>
              <button className="export-btn-adminreports" onClick={() => exportReport('csv')} disabled={generating}>
                <FaDownload /> Export as CSV
              </button>
              <button className="export-btn-adminreports" onClick={() => window.print()}>
                <FaPrint /> Print Report
              </button>
            </div>
          </div>
        )}

        {/* ============ PROJECT SUMMARY REPORTS ============ */}
        {activeTab === 'project-summary' && (
          <div className="report-content-adminreports">
            <div className="report-section-adminreports">
              <h2><FaProjectDiagram /> Project Status Overview</h2>
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

            <div className="report-section-adminreports">
              <h2>Project Progress Tracking</h2>
              <div className="projects-table-container">
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
                          <td><strong>{project.projectName}</strong></td>
                          <td>{project.projectReference}</td>
                          <td>{project.clientId?.contactFirstName} {project.clientId?.contactLastName}</td>
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

            <div className="report-actions-adminreports">
              <button className="export-btn-adminreports" onClick={() => exportReport('pdf')} disabled={generating}>
                <FaFilePdf /> Export as PDF
              </button>
              <button className="export-btn-adminreports" onClick={() => exportReport('xlsx')} disabled={generating}>
                <FaFileExcel /> Export as Excel
              </button>
              <button className="export-btn-adminreports" onClick={() => exportReport('csv')} disabled={generating}>
                <FaDownload /> Export as CSV
              </button>
              <button className="export-btn-adminreports" onClick={() => window.print()}>
                <FaPrint /> Print Report
              </button>
            </div>
          </div>
        )}

        {/* ============ FINANCIAL REPORTS ============ */}
        {activeTab === 'financial' && (
          <div className="report-content-adminreports">
            <div className="report-section-adminreports">
              <h2><FaMoneyBillWave /> Financial Summary</h2>
              <p>Summarizes payments made by clients. Includes billing records. Helps track overall financial performance.</p>
              
              <div className="financial-summary-grid">
                <div className="financial-card total-revenue">
                  <FaWallet />
                  <div>
                    <span>Total Revenue</span>
                    <strong>{formatCurrency(stats.revenue.total)}</strong>
                  </div>
                </div>
                <div className="financial-card this-month">
                  <FaCalendarAlt />
                  <div>
                    <span>This Month</span>
                    <strong>{formatCurrency(stats.revenue.thisMonth)}</strong>
                  </div>
                </div>
                <div className="financial-card last-month">
                  <FaClock />
                  <div>
                    <span>Last Month</span>
                    <strong>{formatCurrency(stats.revenue.lastMonth)}</strong>
                  </div>
                </div>
                <div className="financial-card growth">
                  <FaChartLine />
                  <div>
                    <span>Growth</span>
                    <strong className={stats.revenue.thisMonth > stats.revenue.lastMonth ? 'positive' : 'negative'}>
                      {stats.revenue.lastMonth > 0 ? ((stats.revenue.thisMonth - stats.revenue.lastMonth) / stats.revenue.lastMonth * 100).toFixed(1) : 0}%
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="report-section-adminreports">
              <h2>Payment Summary by Status</h2>
              <div className="payment-status-grid">
                <div className="payment-status-card paid">
                  <FaCheckCircle />
                  <div>
                    <span>Paid Transactions</span>
                    <strong>{stats.payments.paid}</strong>
                    <small>{formatCurrency(transactions.filter(t => t.status === 'Paid' || t.status === 'Completed').reduce((sum, t) => sum + t.amount, 0))}</small>
                  </div>
                </div>
                <div className="payment-status-card pending">
                  <FaClock />
                  <div>
                    <span>Pending Payments</span>
                    <strong>{stats.payments.pending}</strong>
                  </div>
                </div>
                <div className="payment-status-card verification">
                  <FaEye />
                  <div>
                    <span>For Verification</span>
                    <strong>{stats.payments.forVerification}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="report-section-adminreports">
              <h2>Recent Transactions</h2>
              <div className="payments-table-container">
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
                        <td>{transaction.client}</td>
                        <td>{transaction.type}</td>
                        <td>{transaction.reference || transaction.projectName}</td>
                        <td className="amount">{formatCurrency(transaction.amount)}</td>
                        <td>
                          <span className={`payment-method ${transaction.method?.toLowerCase()}`}>
                            {transaction.method}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${transaction.status === 'Paid' || transaction.status === 'Completed' ? 'paid' : transaction.status === 'For Verification' ? 'for_verification' : 'pending'}`}>
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="report-actions-adminreports">
              <button className="export-btn-adminreports" onClick={() => exportReport('pdf')} disabled={generating}>
                <FaFilePdf /> Export as PDF
              </button>
              <button className="export-btn-adminreports" onClick={() => exportReport('xlsx')} disabled={generating}>
                <FaFileExcel /> Export as Excel
              </button>
              <button className="export-btn-adminreports" onClick={() => exportReport('csv')} disabled={generating}>
                <FaDownload /> Export as CSV
              </button>
              <button className="export-btn-adminreports" onClick={() => window.print()}>
                <FaPrint /> Print Report
              </button>
            </div>
          </div>
        )}

        {/* ============ CLIENT TRANSACTION REPORTS ============ */}
        {activeTab === 'client-transaction' && (
          <div className="report-content-adminreports">
            <div className="report-section-adminreports">
              <h2><FaHistory /> Client Transaction History</h2>
              <p>Displays detailed records of client bookings. Includes payment transactions. Useful for reviewing client activity history.</p>
              
              <div className="client-stats-grid">
                <div className="client-stat-card">
                  <FaUsers />
                  <div>
                    <span>Total Clients</span>
                    <strong>{stats.clients.total}</strong>
                  </div>
                </div>
                <div className="client-stat-card">
                  <FaUserCheck />
                  <div>
                    <span>Active Clients</span>
                    <strong>{stats.clients.active}</strong>
                  </div>
                </div>
                <div className="client-stat-card">
                  <FaUserClock />
                  <div>
                    <span>New This Month</span>
                    <strong>{stats.clients.new}</strong>
                  </div>
                </div>
                <div className="client-stat-card">
                  <FaReceipt />
                  <div>
                    <span>Total Transactions</span>
                    <strong>{transactions.length}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="report-section-adminreports">
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
                    <span>Cash</span>
                    <strong>{transactions.filter(t => t.method === 'cash' || t.method === 'Manual').length}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="report-section-adminreports">
              <h2>Client Transaction Details</h2>
              <div className="transactions-table-container">
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
                        <td><strong>{transaction.client}</strong></td>
                        <td>{transaction.clientPhone || 'N/A'}</td>
                        <td>
                          <span className="transaction-type pre">
                            {transaction.type}
                          </span>
                        </td>
                        <td>{transaction.reference || transaction.projectName}</td>
                        <td className="amount">{formatCurrency(transaction.amount)}</td>
                        <td>
                          <span className={`payment-method ${transaction.method?.toLowerCase()}`}>
                            {transaction.method}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${transaction.status === 'Paid' || transaction.status === 'Completed' ? 'paid' : transaction.status === 'For Verification' ? 'for_verification' : 'pending'}`}>
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="report-actions-adminreports">
              <button className="export-btn-adminreports" onClick={() => exportReport('pdf')} disabled={generating}>
                <FaFilePdf /> Export as PDF
              </button>
              <button className="export-btn-adminreports" onClick={() => exportReport('xlsx')} disabled={generating}>
                <FaFileExcel /> Export as Excel
              </button>
              <button className="export-btn-adminreports" onClick={() => exportReport('csv')} disabled={generating}>
                <FaDownload /> Export as CSV
              </button>
              <button className="export-btn-adminreports" onClick={() => window.print()}>
                <FaPrint /> Print Report
              </button>
            </div>
          </div>
        )}

        {/* Report Preview Modal */}
        {reportData && (
          <div className="report-preview-overlay" onClick={() => setReportData(null)}>
            <div className="report-preview-adminreports" onClick={e => e.stopPropagation()}>
              <div className="preview-header">
                <h3>Report Preview</h3>
                <button className="close-preview" onClick={() => setReportData(null)}>×</button>
              </div>
              <div className="preview-content-adminreports">
                <pre>{JSON.stringify(reportData, null, 2)}</pre>
              </div>
              <div className="preview-actions-adminreports">
                <button className="export-btn-adminreports" onClick={() => exportReport('pdf')}>
                  <FaFilePdf /> Download PDF
                </button>
                <button className="export-btn-adminreports" onClick={() => exportReport('xlsx')}>
                  <FaFileExcel /> Download Excel
                </button>
                <button className="export-btn-adminreports" onClick={() => exportReport('csv')}>
                  <FaDownload /> Download CSV
                </button>
                <button className="export-btn-adminreports" onClick={() => setReportData(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Reports;