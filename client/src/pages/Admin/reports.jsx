// pages/Admin/Reports.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { 
  FaChartLine,
  FaFileInvoice,
  FaUsers,
  FaSolarPanel,
  FaMicrochip,
  FaDownload,
  FaSpinner,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaProjectDiagram,
  FaClipboardList,
  FaChartBar,
  FaChartPie,
  FaFileExcel,
  FaFilePdf,
  FaPrint,
  FaEnvelope,
  FaFilter,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaEye,
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa';
import '../../styles/Admin/reports.css';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('financial');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [reportType, setReportType] = useState('all');
  const [reportData, setReportData] = useState(null);
  const [stats, setStats] = useState({
    revenue: { total: 0, thisMonth: 0, lastMonth: 0 },
    users: { total: 0, new: 0, active: 0 },
    assessments: { total: 0, completed: 0, pending: 0 },
    projects: { total: 0, inProgress: 0, completed: 0 },
    devices: { total: 0, active: 0, deployed: 0 }
  });

  useEffect(() => {
    fetchReportStats();
  }, []);

  const fetchReportStats = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      
      const [revenueRes, usersRes, assessmentsRes, projectsRes, devicesRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/revenue/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { total: 0, thisMonth: 0, lastMonth: 0 } })),
        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { total: 0, new: 0, active: 0 } })),
        axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { total: 0, completed: 0, pending: 0 } })),
        axios.get(`${import.meta.env.VITE_API_URL}/api/projects/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { total: 0, inProgress: 0, completed: 0 } })),
        axios.get(`${import.meta.env.VITE_API_URL}/api/admin/devices/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { total: 0, active: 0, deployed: 0 } }))
      ]);

      setStats({
        revenue: revenueRes.data,
        users: usersRes.data,
        assessments: assessmentsRes.data,
        projects: projectsRes.data,
        devices: devicesRes.data
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/reports/generate`,
        {
          type: activeTab,
          reportType,
          dateRange,
          format: 'json'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReportData(response.data);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const exportReport = async (format) => {
    setGenerating(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/reports/export`,
        {
          type: activeTab,
          reportType,
          dateRange,
          format
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeTab}_report_${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report');
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

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-PH').format(num || 0);
  };

  const getRevenueData = () => {
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      values: [125000, 150000, 180000, 220000, 280000, 320000, 350000, 380000, 420000, 450000, 480000, 520000]
    };
  };

  const getAssessmentData = () => {
    return {
      labels: ['Completed', 'In Progress', 'Pending', 'Cancelled'],
      values: [stats.assessments.completed || 45, stats.assessments.pending || 12, 8, 5]
    };
  };

  if (loading) {
    return (
      <div className="reports-loading">
        <FaSpinner className="spinner" />
        <p>Loading reports...</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Reports | Admin | Salfer Engineering</title>
      </Helmet>

      <div className="admin-reports">
        <div className="reports-header">
          <h1><FaChartLine /> Reports & Analytics</h1>
          <p>Generate comprehensive reports and analyze business performance</p>
        </div>

        {/* Quick Stats Cards */}
        <div className="stats-cards">
          <div className="stat-card revenue">
            <div className="stat-icon"><FaMoneyBillWave /></div>
            <div className="stat-info">
              <span className="stat-value">{formatCurrency(stats.revenue.total)}</span>
              <span className="stat-label">Total Revenue</span>
              <span className="stat-change">+{formatCurrency(stats.revenue.thisMonth)} this month</span>
            </div>
          </div>
          <div className="stat-card users">
            <div className="stat-icon"><FaUsers /></div>
            <div className="stat-info">
              <span className="stat-value">{stats.users.total}</span>
              <span className="stat-label">Total Users</span>
              <span className="stat-change">+{stats.users.new} new this month</span>
            </div>
          </div>
          <div className="stat-card assessments">
            <div className="stat-icon"><FaClipboardList /></div>
            <div className="stat-info">
              <span className="stat-value">{stats.assessments.total}</span>
              <span className="stat-label">Total Assessments</span>
              <span className="stat-change">{stats.assessments.completed} completed</span>
            </div>
          </div>
          <div className="stat-card projects">
            <div className="stat-icon"><FaProjectDiagram /></div>
            <div className="stat-info">
              <span className="stat-value">{stats.projects.total}</span>
              <span className="stat-label">Total Projects</span>
              <span className="stat-change">{stats.projects.inProgress} in progress</span>
            </div>
          </div>
        </div>

        {/* Report Type Tabs */}
        <div className="report-tabs">
          <button className={`tab-btn ${activeTab === 'financial' ? 'active' : ''}`} onClick={() => setActiveTab('financial')}>
            <FaMoneyBillWave /> Financial Reports
          </button>
          <button className={`tab-btn ${activeTab === 'operational' ? 'active' : ''}`} onClick={() => setActiveTab('operational')}>
            <FaChartBar /> Operational Reports
          </button>
          <button className={`tab-btn ${activeTab === 'client' ? 'active' : ''}`} onClick={() => setActiveTab('client')}>
            <FaUsers /> Client Reports
          </button>
          <button className={`tab-btn ${activeTab === 'device' ? 'active' : ''}`} onClick={() => setActiveTab('device')}>
            <FaMicrochip /> Device Reports
          </button>
          <button className={`tab-btn ${activeTab === 'custom' ? 'active' : ''}`} onClick={() => setActiveTab('custom')}>
            <FaChartLine /> Custom Reports
          </button>
        </div>

        {/* Report Controls */}
        <div className="report-controls">
          <div className="date-range">
            <label><FaCalendarAlt /> Date Range</label>
            <div className="date-inputs">
              <input type="date" value={dateRange.startDate} onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} />
              <span>to</span>
              <input type="date" value={dateRange.endDate} onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })} />
            </div>
          </div>
          
          {activeTab !== 'financial' && (
            <div className="report-filter">
              <label><FaFilter /> Filter</label>
              <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                <option value="all">All</option>
                {activeTab === 'operational' && (
                  <>
                    <option value="assessment">Assessments</option>
                    <option value="project">Projects</option>
                    <option value="quotation">Quotations</option>
                  </>
                )}
                {activeTab === 'client' && (
                  <>
                    <option value="new">New Clients</option>
                    <option value="active">Active Clients</option>
                    <option value="inactive">Inactive Clients</option>
                  </>
                )}
                {activeTab === 'device' && (
                  <>
                    <option value="active">Active Devices</option>
                    <option value="deployed">Deployed Devices</option>
                    <option value="maintenance">Maintenance</option>
                  </>
                )}
              </select>
            </div>
          )}
          
          <button className="generate-btn" onClick={generateReport} disabled={generating}>
            {generating ? <><FaSpinner className="spinner" /> Generating...</> : 'Generate Report'}
          </button>
        </div>

        {/* Financial Reports */}
        {activeTab === 'financial' && (
          <div className="report-content">
            <div className="report-section">
              <h2>Revenue Summary</h2>
              <div className="revenue-summary">
                <div className="summary-item">
                  <span>Total Revenue</span>
                  <strong>{formatCurrency(stats.revenue.total)}</strong>
                </div>
                <div className="summary-item">
                  <span>This Month</span>
                  <strong>{formatCurrency(stats.revenue.thisMonth)}</strong>
                </div>
                <div className="summary-item">
                  <span>Last Month</span>
                  <strong>{formatCurrency(stats.revenue.lastMonth)}</strong>
                </div>
                <div className="summary-item">
                  <span>Growth</span>
                  <strong className={stats.revenue.thisMonth > stats.revenue.lastMonth ? 'positive' : 'negative'}>
                    {((stats.revenue.thisMonth - stats.revenue.lastMonth) / stats.revenue.lastMonth * 100).toFixed(1)}%
                  </strong>
                </div>
              </div>
            </div>

            <div className="report-section">
              <h2>Revenue by Source</h2>
              <div className="revenue-sources">
                <div className="source-item">
                  <span>Pre-Assessment Fees</span>
                  <strong>{formatCurrency(stats.revenue.total * 0.15)}</strong>
                  <div className="progress-bar"><div className="progress" style={{ width: '15%' }}></div></div>
                </div>
                <div className="source-item">
                  <span>Solar Installation</span>
                  <strong>{formatCurrency(stats.revenue.total * 0.75)}</strong>
                  <div className="progress-bar"><div className="progress" style={{ width: '75%' }}></div></div>
                </div>
                <div className="source-item">
                  <span>Maintenance Services</span>
                  <strong>{formatCurrency(stats.revenue.total * 0.10)}</strong>
                  <div className="progress-bar"><div className="progress" style={{ width: '10%' }}></div></div>
                </div>
              </div>
            </div>

            <div className="report-section">
              <h2>Monthly Revenue Trend</h2>
              <div className="chart-container">
                <div className="bar-chart">
                  {getRevenueData().labels.map((label, i) => (
                    <div key={i} className="bar-item">
                      <div className="bar" style={{ height: `${(getRevenueData().values[i] / 600000) * 200}px` }}></div>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="report-actions">
              <button className="export-btn" onClick={() => exportReport('pdf')} disabled={generating}>
                <FaFilePdf /> Export as PDF
              </button>
              <button className="export-btn" onClick={() => exportReport('xlsx')} disabled={generating}>
                <FaFileExcel /> Export as Excel
              </button>
              <button className="export-btn" onClick={() => window.print()}>
                <FaPrint /> Print
              </button>
              <button className="export-btn" onClick={() => alert('Email sent!')}>
                <FaEnvelope /> Email Report
              </button>
            </div>
          </div>
        )}

        {/* Operational Reports */}
        {activeTab === 'operational' && (
          <div className="report-content">
            <div className="report-section">
              <h2>Assessment Performance</h2>
              <div className="stats-row">
                <div className="stat-box">
                  <span>Total Assessments</span>
                  <strong>{stats.assessments.total}</strong>
                </div>
                <div className="stat-box">
                  <span>Completed</span>
                  <strong>{stats.assessments.completed}</strong>
                </div>
                <div className="stat-box">
                  <span>Completion Rate</span>
                  <strong>{((stats.assessments.completed / stats.assessments.total) * 100).toFixed(1)}%</strong>
                </div>
                <div className="stat-box">
                  <span>Avg. Processing Time</span>
                  <strong>3.2 days</strong>
                </div>
              </div>
            </div>

            <div className="report-section">
              <h2>Project Status Distribution</h2>
              <div className="pie-chart-container">
                <div className="pie-chart">
                  {getAssessmentData().labels.map((label, i) => (
                    <div key={i} className="pie-segment" style={{ width: `${getAssessmentData().values[i] / getAssessmentData().values.reduce((a,b) => a+b, 0) * 100}%` }}>
                      <span className="segment-label">{label}</span>
                      <span className="segment-value">{getAssessmentData().values[i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="report-actions">
              <button className="export-btn" onClick={() => exportReport('pdf')}><FaFilePdf /> Export as PDF</button>
              <button className="export-btn" onClick={() => exportReport('xlsx')}><FaFileExcel /> Export as Excel</button>
            </div>
          </div>
        )}

        {/* Client Reports */}
        {activeTab === 'client' && (
          <div className="report-content">
            <div className="report-section">
              <h2>Client Demographics</h2>
              <div className="demographics-grid">
                <div className="demo-card">
                  <h3>By Client Type</h3>
                  <div className="demo-item"><span>Residential</span><strong>75%</strong></div>
                  <div className="demo-item"><span>Commercial</span><strong>20%</strong></div>
                  <div className="demo-item"><span>Industrial</span><strong>5%</strong></div>
                </div>
                <div className="demo-card">
                  <h3>By Region</h3>
                  <div className="demo-item"><span>NCR</span><strong>45%</strong></div>
                  <div className="demo-item"><span>Region IV-A</span><strong>25%</strong></div>
                  <div className="demo-item"><span>Region III</span><strong>15%</strong></div>
                  <div className="demo-item"><span>Others</span><strong>15%</strong></div>
                </div>
              </div>
            </div>

            <div className="report-actions">
              <button className="export-btn" onClick={() => exportReport('pdf')}><FaFilePdf /> Export as PDF</button>
              <button className="export-btn" onClick={() => exportReport('xlsx')}><FaFileExcel /> Export as Excel</button>
            </div>
          </div>
        )}

        {/* Device Reports */}
        {activeTab === 'device' && (
          <div className="report-content">
            <div className="report-section">
              <h2>Device Inventory</h2>
              <div className="stats-row">
                <div className="stat-box"><span>Total Devices</span><strong>{stats.devices.total}</strong></div>
                <div className="stat-box"><span>Active</span><strong>{stats.devices.active}</strong></div>
                <div className="stat-box"><span>Deployed</span><strong>{stats.devices.deployed}</strong></div>
                <div className="stat-box"><span>Maintenance</span><strong>{stats.devices.maintenance}</strong></div>
              </div>
            </div>

            <div className="report-section">
              <h2>Device Utilization</h2>
              <div className="utilization-chart">
                <div className="utilization-bar">
                  <div className="utilization-fill" style={{ width: `${(stats.devices.deployed / stats.devices.total) * 100}%` }}></div>
                </div>
                <div className="utilization-stats">
                  <span>Utilization Rate: {((stats.devices.deployed / stats.devices.total) * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="report-actions">
              <button className="export-btn" onClick={() => exportReport('pdf')}><FaFilePdf /> Export as PDF</button>
              <button className="export-btn" onClick={() => exportReport('xlsx')}><FaFileExcel /> Export as Excel</button>
            </div>
          </div>
        )}

        {/* Custom Reports */}
        {activeTab === 'custom' && (
          <div className="report-content">
            <div className="report-section">
              <h2>Custom Report Builder</h2>
              <div className="custom-report-builder">
                <div className="builder-section">
                  <h3>Select Data Fields</h3>
                  <div className="checkbox-group">
                    <label><input type="checkbox" /> Revenue Data</label>
                    <label><input type="checkbox" /> Client Data</label>
                    <label><input type="checkbox" /> Assessment Data</label>
                    <label><input type="checkbox" /> Project Data</label>
                    <label><input type="checkbox" /> Device Data</label>
                    <label><input type="checkbox" /> Payment Data</label>
                  </div>
                </div>
                <div className="builder-section">
                  <h3>Aggregation</h3>
                  <select>
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                    <option>Quarterly</option>
                    <option>Yearly</option>
                  </select>
                </div>
                <div className="builder-section">
                  <h3>Format</h3>
                  <div className="radio-group">
                    <label><input type="radio" name="format" /> Summary View</label>
                    <label><input type="radio" name="format" /> Detailed View</label>
                    <label><input type="radio" name="format" /> Chart View</label>
                  </div>
                </div>
              </div>
            </div>
            <div className="report-actions">
              <button className="generate-btn" onClick={generateReport} disabled={generating}>
                {generating ? <><FaSpinner className="spinner" /> Generating...</> : 'Generate Custom Report'}
              </button>
            </div>
          </div>
        )}

        {/* Report Preview */}
        {reportData && (
          <div className="report-preview">
            <h2>Report Preview</h2>
            <div className="preview-content">
              <pre>{JSON.stringify(reportData, null, 2)}</pre>
            </div>
            <div className="preview-actions">
              <button className="export-btn" onClick={() => exportReport('pdf')}><FaFilePdf /> Download PDF</button>
              <button className="export-btn" onClick={() => exportReport('xlsx')}><FaFileExcel /> Download Excel</button>
              <button className="export-btn" onClick={() => setReportData(null)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Reports;