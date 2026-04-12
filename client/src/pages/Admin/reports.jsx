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
    devices: { total: 0, active: 0, deployed: 0, maintenance: 0 }
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
        }).catch(() => ({ data: { total: 0, active: 0, deployed: 0, maintenance: 0 } }))
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
        {[1, 2, 3, 4, 5].map(i => (
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
        <title>Reports | Admin | Salfer Engineering</title>
      </Helmet>

      <div className="reports-container-adminreports">
        <div className="reports-header-adminreports">
          <h1>Reports & Analytics</h1>
          <p>Generate comprehensive reports and analyze business performance</p>
        </div>

        {/* Quick Stats Cards - No Icons */}
        <div className="stats-cards-adminreports">
          <div className="stat-card-adminreports revenue-adminreports">
            <div className="stat-info-adminreports">
              <span className="stat-value-adminreports">{formatCurrency(stats.revenue.total)}</span>
              <span className="stat-label-adminreports">Total Revenue</span>
              <span className="stat-change-adminreports">+{formatCurrency(stats.revenue.thisMonth)} this month</span>
            </div>
          </div>
          <div className="stat-card-adminreports users-adminreports">
            <div className="stat-info-adminreports">
              <span className="stat-value-adminreports">{stats.users.total}</span>
              <span className="stat-label-adminreports">Total Users</span>
              <span className="stat-change-adminreports">+{stats.users.new} new this month</span>
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
        </div>

        {/* Report Type Tabs */}
        <div className="report-tabs-adminreports">
          <button className={`tab-btn-adminreports ${activeTab === 'financial' ? 'active-adminreports' : ''}`} onClick={() => setActiveTab('financial')}>
            Financial Reports
          </button>
          <button className={`tab-btn-adminreports ${activeTab === 'operational' ? 'active-adminreports' : ''}`} onClick={() => setActiveTab('operational')}>
            Operational Reports
          </button>
          <button className={`tab-btn-adminreports ${activeTab === 'client' ? 'active-adminreports' : ''}`} onClick={() => setActiveTab('client')}>
            Client Reports
          </button>
          <button className={`tab-btn-adminreports ${activeTab === 'device' ? 'active-adminreports' : ''}`} onClick={() => setActiveTab('device')}>
            Device Reports
          </button>
          <button className={`tab-btn-adminreports ${activeTab === 'custom' ? 'active-adminreports' : ''}`} onClick={() => setActiveTab('custom')}>
            Custom Reports
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
          
          {activeTab !== 'financial' && (
            <div className="report-filter-adminreports">
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

          <button className="generate-btn-adminreports" onClick={generateReport} disabled={generating}>
            {generating ? 'Generating...' : 'Generate Report'}
          </button>
        </div>

        {/* Financial Reports */}
        {activeTab === 'financial' && (
          <div className="report-content-adminreports">
            <div className="report-section-adminreports">
              <h2>Revenue Summary</h2>
              <div className="revenue-summary-adminreports">
                <div className="summary-item-adminreports">
                  <span>Total Revenue</span>
                  <strong>{formatCurrency(stats.revenue.total)}</strong>
                </div>
                <div className="summary-item-adminreports">
                  <span>This Month</span>
                  <strong>{formatCurrency(stats.revenue.thisMonth)}</strong>
                </div>
                <div className="summary-item-adminreports">
                  <span>Last Month</span>
                  <strong>{formatCurrency(stats.revenue.lastMonth)}</strong>
                </div>
                <div className="summary-item-adminreports">
                  <span>Growth</span>
                  <strong className={stats.revenue.thisMonth > stats.revenue.lastMonth ? 'positive-adminreports' : 'negative-adminreports'}>
                    {((stats.revenue.thisMonth - stats.revenue.lastMonth) / stats.revenue.lastMonth * 100).toFixed(1)}%
                  </strong>
                </div>
              </div>
            </div>

            <div className="report-section-adminreports">
              <h2>Revenue by Source</h2>
              <div className="revenue-sources-adminreports">
                <div className="source-item-adminreports">
                  <span>Pre-Assessment Fees</span>
                  <strong>{formatCurrency(stats.revenue.total * 0.15)}</strong>
                  <div className="progress-bar-adminreports"><div className="progress-adminreports" style={{ width: '15%' }}></div></div>
                </div>
                <div className="source-item-adminreports">
                  <span>Solar Installation</span>
                  <strong>{formatCurrency(stats.revenue.total * 0.75)}</strong>
                  <div className="progress-bar-adminreports"><div className="progress-adminreports" style={{ width: '75%' }}></div></div>
                </div>
                <div className="source-item-adminreports">
                  <span>Maintenance Services</span>
                  <strong>{formatCurrency(stats.revenue.total * 0.10)}</strong>
                  <div className="progress-bar-adminreports"><div className="progress-adminreports" style={{ width: '10%' }}></div></div>
                </div>
              </div>
            </div>

            <div className="report-section-adminreports">
              <h2>Monthly Revenue Trend</h2>
              <div className="chart-container-adminreports">
                <div className="bar-chart-adminreports">
                  {getRevenueData().labels.map((label, i) => (
                    <div key={i} className="bar-item-adminreports">
                      <div className="bar-adminreports" style={{ height: `${(getRevenueData().values[i] / 600000) * 200}px` }}></div>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="report-actions-adminreports">
              <button className="export-btn-adminreports" onClick={() => exportReport('pdf')} disabled={generating}>
                <FaFilePdf /> Export as PDF
              </button>
              <button className="export-btn-adminreports" onClick={() => exportReport('xlsx')} disabled={generating}>
                <FaFileExcel /> Export as Excel
              </button>
              <button className="export-btn-adminreports" onClick={() => window.print()}>
                <FaPrint /> Print
              </button>
              <button className="export-btn-adminreports" onClick={() => alert('Email sent!')}>
                <FaEnvelope /> Email Report
              </button>
            </div>
          </div>
        )}

        {/* Operational Reports */}
        {activeTab === 'operational' && (
          <div className="report-content-adminreports">
            <div className="report-section-adminreports">
              <h2>Assessment Performance</h2>
              <div className="stats-row-adminreports">
                <div className="stat-box-adminreports">
                  <span>Total Assessments</span>
                  <strong>{stats.assessments.total}</strong>
                </div>
                <div className="stat-box-adminreports">
                  <span>Completed</span>
                  <strong>{stats.assessments.completed}</strong>
                </div>
                <div className="stat-box-adminreports">
                  <span>Completion Rate</span>
                  <strong>{((stats.assessments.completed / stats.assessments.total) * 100).toFixed(1)}%</strong>
                </div>
                <div className="stat-box-adminreports">
                  <span>Avg. Processing Time</span>
                  <strong>3.2 days</strong>
                </div>
              </div>
            </div>

            <div className="report-section-adminreports">
              <h2>Project Status Distribution</h2>
              <div className="pie-chart-container-adminreports">
                <div className="pie-chart-adminreports">
                  {getAssessmentData().labels.map((label, i) => (
                    <div key={i} className="pie-segment-adminreports" style={{ width: `${getAssessmentData().values[i] / getAssessmentData().values.reduce((a,b) => a+b, 0) * 100}%` }}>
                      <span className="segment-label-adminreports">{label}</span>
                      <span className="segment-value-adminreports">{getAssessmentData().values[i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="report-actions-adminreports">
              <button className="export-btn-adminreports" onClick={() => exportReport('pdf')}><FaFilePdf /> Export as PDF</button>
              <button className="export-btn-adminreports" onClick={() => exportReport('xlsx')}><FaFileExcel /> Export as Excel</button>
            </div>
          </div>
        )}

        {/* Client Reports */}
        {activeTab === 'client' && (
          <div className="report-content-adminreports">
            <div className="report-section-adminreports">
              <h2>Client Demographics</h2>
              <div className="demographics-grid-adminreports">
                <div className="demo-card-adminreports">
                  <h3>By Client Type</h3>
                  <div className="demo-item-adminreports"><span>Residential</span><strong>75%</strong></div>
                  <div className="demo-item-adminreports"><span>Commercial</span><strong>20%</strong></div>
                  <div className="demo-item-adminreports"><span>Industrial</span><strong>5%</strong></div>
                </div>
                <div className="demo-card-adminreports">
                  <h3>By Region</h3>
                  <div className="demo-item-adminreports"><span>NCR</span><strong>45%</strong></div>
                  <div className="demo-item-adminreports"><span>Region IV-A</span><strong>25%</strong></div>
                  <div className="demo-item-adminreports"><span>Region III</span><strong>15%</strong></div>
                  <div className="demo-item-adminreports"><span>Others</span><strong>15%</strong></div>
                </div>
              </div>
            </div>

            <div className="report-actions-adminreports">
              <button className="export-btn-adminreports" onClick={() => exportReport('pdf')}><FaFilePdf /> Export as PDF</button>
              <button className="export-btn-adminreports" onClick={() => exportReport('xlsx')}><FaFileExcel /> Export as Excel</button>
            </div>
          </div>
        )}

        {/* Device Reports */}
        {activeTab === 'device' && (
          <div className="report-content-adminreports">
            <div className="report-section-adminreports">
              <h2>Device Inventory</h2>
              <div className="stats-row-adminreports">
                <div className="stat-box-adminreports"><span>Total Devices</span><strong>{stats.devices.total}</strong></div>
                <div className="stat-box-adminreports"><span>Active</span><strong>{stats.devices.active}</strong></div>
                <div className="stat-box-adminreports"><span>Deployed</span><strong>{stats.devices.deployed}</strong></div>
                <div className="stat-box-adminreports"><span>Maintenance</span><strong>{stats.devices.maintenance}</strong></div>
              </div>
            </div>

            <div className="report-section-adminreports">
              <h2>Device Utilization</h2>
              <div className="utilization-chart-adminreports">
                <div className="utilization-bar-adminreports">
                  <div className="utilization-fill-adminreports" style={{ width: `${(stats.devices.deployed / stats.devices.total) * 100}%` }}></div>
                </div>
                <div className="utilization-stats-adminreports">
                  <span>Utilization Rate: {((stats.devices.deployed / stats.devices.total) * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="report-actions-adminreports">
              <button className="export-btn-adminreports" onClick={() => exportReport('pdf')}><FaFilePdf /> Export as PDF</button>
              <button className="export-btn-adminreports" onClick={() => exportReport('xlsx')}><FaFileExcel /> Export as Excel</button>
            </div>
          </div>
        )}

        {/* Custom Reports */}
        {activeTab === 'custom' && (
          <div className="report-content-adminreports">
            <div className="report-section-adminreports">
              <h2>Custom Report Builder</h2>
              <div className="custom-report-builder-adminreports">
                <div className="builder-section-adminreports">
                  <h3>Select Data Fields</h3>
                  <div className="checkbox-group-adminreports">
                    <label><input type="checkbox" /> Revenue Data</label>
                    <label><input type="checkbox" /> Client Data</label>
                    <label><input type="checkbox" /> Assessment Data</label>
                    <label><input type="checkbox" /> Project Data</label>
                    <label><input type="checkbox" /> Device Data</label>
                    <label><input type="checkbox" /> Payment Data</label>
                  </div>
                </div>
                <div className="builder-section-adminreports">
                  <h3>Aggregation</h3>
                  <select>
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                    <option>Quarterly</option>
                    <option>Yearly</option>
                  </select>
                </div>
                <div className="builder-section-adminreports">
                  <h3>Format</h3>
                  <div className="radio-group-adminreports">
                    <label><input type="radio" name="format" /> Summary View</label>
                    <label><input type="radio" name="format" /> Detailed View</label>
                    <label><input type="radio" name="format" /> Chart View</label>
                  </div>
                </div>
              </div>
            </div>
            <div className="report-actions-adminreports">
              <button className="generate-btn-adminreports" onClick={generateReport} disabled={generating}>
                {generating ? 'Generating...' : 'Generate Custom Report'}
              </button>
            </div>
          </div>
        )}

        {/* Report Preview */}
        {reportData && (
          <div className="report-preview-adminreports">
            <h2>Report Preview</h2>
            <div className="preview-content-adminreports">
              <pre>{JSON.stringify(reportData, null, 2)}</pre>
            </div>
            <div className="preview-actions-adminreports">
              <button className="export-btn-adminreports" onClick={() => exportReport('pdf')}><FaFilePdf /> Download PDF</button>
              <button className="export-btn-adminreports" onClick={() => exportReport('xlsx')}><FaFileExcel /> Download Excel</button>
              <button className="export-btn-adminreports" onClick={() => setReportData(null)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Reports;