// pages/Customer/Reports.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/Customer/reports.css';

const Reports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState('assessment');
  const [selectedProject, setSelectedProject] = useState(null);
  const [reports, setReports] = useState([]);
  const [projects, setProjects] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [deviceData, setDeviceData] = useState([]);

  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      
      // Fetch projects
      const projectsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects/my-projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(projectsRes.data.projects || []);
      
      // Fetch completed assessments
      const assessmentsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments/my-assessments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const completedAssessments = assessmentsRes.data.assessments?.filter(a => a.status === 'completed') || [];
      setAssessments(completedAssessments);
      
      // Fetch IoT device data
      const deviceRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/device-data/my-data`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeviceData(deviceRes.data.data || []);
      
      // Generate mock reports data
      generateMockReports();
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching reports data:', err);
      generateMockReports();
      setLoading(false);
    }
  };

  const generateMockReports = () => {
    const mockReports = [
      {
        id: 1,
        type: 'assessment',
        title: 'Site Assessment Report - ASM-2024-001',
        reference: 'ASM-2024-001',
        date: '2024-03-10',
        author: 'Engr. Juan Dela Cruz',
        status: 'completed',
        description: '7-day IoT site assessment results with solar irradiance data, temperature readings, and shading analysis.',
        downloadUrl: '#'
      },
      {
        id: 2,
        type: 'project',
        title: 'Project Progress Report - PRJ-2024-001',
        reference: 'PRJ-2024-001',
        date: '2024-03-15',
        author: 'Engr. Juan Dela Cruz',
        status: 'completed',
        description: 'Installation progress report with milestone completion and site updates.',
        downloadUrl: '#'
      },
      {
        id: 3,
        type: 'financial',
        title: 'Financial Transaction Report',
        reference: 'FIN-2024-001',
        date: '2024-03-20',
        author: 'Admin',
        status: 'completed',
        description: 'Summary of payments, invoices, and billing transactions.',
        downloadUrl: '#'
      },
      {
        id: 4,
        type: 'device',
        title: 'IoT Device Weekly Report',
        reference: 'DEV-2024-001',
        date: '2024-03-07',
        author: 'System',
        status: 'completed',
        description: 'Weekly summary of IoT device readings including irradiance, temperature, and humidity data.',
        downloadUrl: '#'
      },
      {
        id: 5,
        type: 'assessment',
        title: 'Site Assessment Report - ASM-2024-002',
        reference: 'ASM-2024-002',
        date: '2024-02-25',
        author: 'Engr. Maria Santos',
        status: 'completed',
        description: '7-day IoT site assessment for commercial property.',
        downloadUrl: '#'
      },
      {
        id: 6,
        type: 'project',
        title: 'Project Completion Report - PRJ-2024-001',
        reference: 'PRJ-2024-001',
        date: '2024-03-28',
        author: 'Engr. Juan Dela Cruz',
        status: 'completed',
        description: 'Final project report with system specifications and turnover documentation.',
        downloadUrl: '#'
      }
    ];
    
    setReports(mockReports);
  };

  const getReportTypeLabel = (type) => {
    const types = {
      'assessment': 'Site Assessment Report',
      'project': 'Project Progress Report',
      'financial': 'Financial Transaction Report',
      'device': 'IoT Device Report',
      'client': 'Client Transaction Report'
    };
    return types[type] || type;
  };

  const getReportIcon = (type) => {
    const icons = {
      'assessment': '📊',
      'project': '📁',
      'financial': '💰',
      'device': '📡',
      'client': '👤'
    };
    return icons[type] || '📄';
  };

  const handleExportReport = async (report) => {
    setExporting(true);
    try {
      // Simulate download
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert(`${report.title} downloaded successfully!`);
    } catch (err) {
      alert('Failed to download report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleGenerateReport = async () => {
    setExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Report generation started. You will be notified when ready.');
    } catch (err) {
      alert('Failed to generate report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const filteredReports = reports.filter(report => 
    selectedReportType === 'all' ? true : report.type === selectedReportType
  );

  // Skeleton Loader
  const SkeletonLoader = () => (
    <div className="reports-container-cusset">
      <div className="reports-header-cusset">
        <div className="skeleton-line-cusset large-cusset"></div>
        <div className="skeleton-line-cusset medium-cusset"></div>
      </div>
      <div className="report-type-filters-cusset">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="skeleton-button-cusset"></div>
        ))}
      </div>
      <div className="reports-grid-cusset">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="report-card-cusset skeleton-card-cusset">
            <div className="skeleton-line-cusset medium-cusset"></div>
            <div className="skeleton-line-cusset small-cusset"></div>
            <div className="skeleton-line-cusset tiny-cusset"></div>
            <div className="skeleton-button-cusset small-cusset"></div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Reports | SOLARIS</title>
        </Helmet>
        <SkeletonLoader />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Reports | SOLARIS</title>
      </Helmet>

      <div className="reports-container-cusset">
        {/* Header */}
        <div className="reports-header-cusset">
          <div>
            <h1>Reports</h1>
            <p>View and download your assessment reports, project updates, and transaction summaries</p>
          </div>
          <button 
            className="generate-btn-cusset" 
            onClick={handleGenerateReport}
            disabled={exporting}
          >
            {exporting ? 'Generating...' : '+ Generate New Report'}
          </button>
        </div>

        {/* Report Type Filters */}
        <div className="report-type-filters-cusset">
          <button 
            className={`filter-btn-cusset ${selectedReportType === 'all' ? 'active-cusset' : ''}`}
            onClick={() => setSelectedReportType('all')}
          >
            All Reports
          </button>
          <button 
            className={`filter-btn-cusset ${selectedReportType === 'assessment' ? 'active-cusset' : ''}`}
            onClick={() => setSelectedReportType('assessment')}
          >
            Site Assessment
          </button>
          <button 
            className={`filter-btn-cusset ${selectedReportType === 'project' ? 'active-cusset' : ''}`}
            onClick={() => setSelectedReportType('project')}
          >
            Project Progress
          </button>
          <button 
            className={`filter-btn-cusset ${selectedReportType === 'financial' ? 'active-cusset' : ''}`}
            onClick={() => setSelectedReportType('financial')}
          >
            Financial Reports
          </button>
          <button 
            className={`filter-btn-cusset ${selectedReportType === 'device' ? 'active-cusset' : ''}`}
            onClick={() => setSelectedReportType('device')}
          >
            IoT Device Data
          </button>
        </div>

        {/* Stats Summary */}
        <div className="stats-summary-cusset">
          <div className="stat-summary-card-cusset">
            <span className="stat-summary-label-cusset">Total Reports</span>
            <span className="stat-summary-value-cusset">{reports.length}</span>
          </div>
          <div className="stat-summary-card-cusset">
            <span className="stat-summary-label-cusset">Site Assessments</span>
            <span className="stat-summary-value-cusset">{reports.filter(r => r.type === 'assessment').length}</span>
          </div>
          <div className="stat-summary-card-cusset">
            <span className="stat-summary-label-cusset">Project Reports</span>
            <span className="stat-summary-value-cusset">{reports.filter(r => r.type === 'project').length}</span>
          </div>
          <div className="stat-summary-card-cusset">
            <span className="stat-summary-label-cusset">Device Reports</span>
            <span className="stat-summary-value-cusset">{reports.filter(r => r.type === 'device').length}</span>
          </div>
        </div>

        {/* Reports Grid */}
        <div className="reports-grid-cusset">
          {filteredReports.length > 0 ? (
            filteredReports.map(report => (
              <div key={report.id} className="report-card-cusset">
                <div className="report-icon-cusset">{getReportIcon(report.type)}</div>
                <div className="report-content-cusset">
                  <h3>{report.title}</h3>
                  <div className="report-meta-cusset">
                    <span className="report-type-cusset">{getReportTypeLabel(report.type)}</span>
                    <span className="report-date-cusset">{new Date(report.date).toLocaleDateString()}</span>
                  </div>
                  <p className="report-description-cusset">{report.description}</p>
                  <div className="report-footer-cusset">
                    <span className="report-author-cusset">By: {report.author}</span>
                    <span className="report-reference-cusset">{report.reference}</span>
                  </div>
                  <button 
                    className="download-btn-cusset" 
                    onClick={() => handleExportReport(report)}
                    disabled={exporting}
                  >
                    {exporting ? 'Downloading...' : 'Download PDF'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state-cusset">
              <div className="empty-icon-cusset">📄</div>
              <h3>No reports available</h3>
              <p>Complete an assessment or project to generate reports</p>
              <button className="btn-primary-cusset" onClick={() => navigate('/dashboard/schedule')}>
                Book an Assessment
              </button>
            </div>
          )}
        </div>

        {/* Available Report Types Section */}
        <div className="report-types-info-cusset">
          <h2>Available Report Types</h2>
          <div className="report-types-grid-cusset">
            <div className="report-type-card-cusset">
              <div className="type-icon-cusset">📊</div>
              <h3>Site Assessment Report</h3>
              <p>Complete 7-day IoT data including solar irradiance, temperature, humidity, GPS coordinates, and shading analysis. Includes site classification and engineer recommendations.</p>
            </div>
            <div className="report-type-card-cusset">
              <div className="type-icon-cusset">📁</div>
              <h3>Project Progress Report</h3>
              <p>Track installation milestones, completion status, assigned personnel, and project timeline updates throughout the installation phase.</p>
            </div>
            <div className="report-type-card-cusset">
              <div className="type-icon-cusset">💰</div>
              <h3>Financial Transaction Report</h3>
              <p>Summary of all payments, invoices, billing history, and transaction status including assessment fees and installation payments.</p>
            </div>
            <div className="report-type-card-cusset">
              <div className="type-icon-cusset">📡</div>
              <h3>IoT Device Weekly Report</h3>
              <p>Detailed data logs from the IoT monitoring device including 15-minute interval readings, data completeness, and device performance metrics.</p>
            </div>
            <div className="report-type-card-cusset">
              <div className="type-icon-cusset">👤</div>
              <h3>Client Transaction Report</h3>
              <p>Complete record of client bookings, assessment requests, quotation history, and service transactions.</p>
            </div>
            <div className="report-type-card-cusset">
              <div className="type-icon-cusset">⚙️</div>
              <h3>Equipment Monitoring Report</h3>
              <p>Track performance and condition of installed solar equipment including panel output and inverter status (post-installation).</p>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="export-options-cusset">
          <h2>Export Options</h2>
          <div className="export-buttons-cusset">
            <button className="export-btn-cusset" onClick={() => handleGenerateReport()}>
              Export All Reports (ZIP)
            </button>
            <button className="export-btn-cusset" onClick={() => handleGenerateReport()}>
              Export Data (CSV)
            </button>
            <button className="export-btn-cusset" onClick={() => handleGenerateReport()}>
              Share Reports
            </button>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="disclaimer-cusset">
          <p>
            <strong>Note:</strong> Reports are generated based on data collected from IoT monitoring devices and manual engineer inputs. 
            Solar energy production estimates are for planning purposes only. For detailed engineering analysis, please consult your assigned engineer.
            Reports are valid for 30 days from the date of generation.
          </p>
        </div>
      </div>
    </>
  );
};

export default Reports;