// pages/Engineer/Reports.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import {
  FaSearch,
  FaEye,
  FaSpinner,
  FaChevronLeft,
  FaChevronRight,
  FaDownload,
  FaFilePdf,
  FaFileExcel,
  FaCalendarAlt,
  FaChartLine,
  FaClipboardList,
  FaMicrochip
} from 'react-icons/fa';
import '../../styles/Engineer/reports.css';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    assessment: 0,
    device: 0,
    quotation: 0
  });

  useEffect(() => {
    fetchReports();
    fetchStats();
  }, [filter, currentPage]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/engineer/reports`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          type: filter === 'all' ? undefined : filter,
          page: currentPage,
          limit: 10
        }
      });

      setReports(response.data.reports || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/engineer/reports/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  const handleDownloadReport = async (report) => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/engineer/reports/${report._id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${report.type}_${report.reference}_${new Date(report.createdAt).toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report');
    }
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/engineer/reports/generate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Report generation started. It will be available shortly.');
      fetchReports();
      fetchStats();
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getReportTypeBadge = (type) => {
    const badges = {
      'assessment': <span className="type-badge-engreports assessment-engreports">Assessment Report</span>,
      'device': <span className="type-badge-engreports device-engreports">Device Data Report</span>,
      'quotation': <span className="type-badge-engreports quotation-engreports">Quotation Report</span>
    };
    return badges[type] || <span className="type-badge-engreports">{type}</span>;
  };

  const getReportIcon = (type) => {
    switch (type) {
      case 'assessment': return <FaClipboardList />;
      case 'device': return <FaMicrochip />;
      case 'quotation': return <FaFileExcel />;
      default: return <FaFilePdf />;
    }
  };

  const filteredReports = reports.filter(report => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return report.reference?.toLowerCase().includes(searchLower) ||
      report.clientName?.toLowerCase().includes(searchLower) ||
      report.assessmentReference?.toLowerCase().includes(searchLower);
  });

  // Skeleton Loader
  const SkeletonLoader = () => (
    <div className="reports-container-engreports">
      <div className="reports-header-engreports">
        <div className="skeleton-line-engreports large-engreports"></div>
        <div className="skeleton-line-engreports medium-engreports"></div>
      </div>
      <div className="stats-cards-engreports">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="stat-card-engreports skeleton-card-engreports">
            <div className="skeleton-line-engreports small-engreports"></div>
            <div className="skeleton-line-engreports large-engreports"></div>
          </div>
        ))}
      </div>
      <div className="reports-filters-engreports">
        <div className="skeleton-select-engreports"></div>
        <div className="skeleton-search-engreports"></div>
      </div>
      <div className="reports-table-container-engreports">
        <div className="skeleton-table-engreports">
          <div className="skeleton-table-header-engreports"></div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton-table-row-engreports"></div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading && reports.length === 0) {
    return <SkeletonLoader />;
  }

  return (
    <>
      <Helmet>
        <title>Reports | Engineer Dashboard</title>
      </Helmet>

      <div className="reports-container-engreports">
        <div className="reports-header-engreports">
          <h1>Reports</h1>
          <p>Generate and download assessment reports</p>
        </div>

        {/* Stats Cards - No Icons */}
        <div className="stats-cards-engreports">
          <div className="stat-card-engreports total-engreports">
            <div className="stat-info-engreports">
              <span className="stat-value-engreports">{stats.total}</span>
              <span className="stat-label-engreports">Total Reports</span>
            </div>
          </div>
          <div className="stat-card-engreports assessment-engreports">
            <div className="stat-info-engreports">
              <span className="stat-value-engreports">{stats.assessment}</span>
              <span className="stat-label-engreports">Assessment Reports</span>
            </div>
          </div>
          <div className="stat-card-engreports device-engreports">
            <div className="stat-info-engreports">
              <span className="stat-value-engreports">{stats.device}</span>
              <span className="stat-label-engreports">Device Data Reports</span>
            </div>
          </div>
          <div className="stat-card-engreports quotation-engreports">
            <div className="stat-info-engreports">
              <span className="stat-value-engreports">{stats.quotation}</span>
              <span className="stat-label-engreports">Quotation Reports</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="reports-filters-engreports">
          <div className="filter-group-engreports">
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Reports</option>
              <option value="assessment">Assessment Reports</option>
              <option value="device">Device Data Reports</option>
              <option value="quotation">Quotation Reports</option>
            </select>
          </div>
          <div className="search-group-engreports">
            
            <input
              type="text"
              placeholder="Search by reference or client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            className="generate-btn-engreports"
            onClick={handleGenerateReport}
            disabled={generating}
          >
            {generating ? 'Generating...' : 'Generate New Report'}
          </button>
        </div>

        {/* Reports Table */}
        <div className="reports-table-container-engreports">
          <table className="reports-table-engreports">
            <thead>
              <tr>
                <th>Report Type</th>
                <th>Reference</th>
                <th>Client / Assessment</th>
                <th>Generated Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-state-engreports">
                    <p>No reports found</p>
                  </td>
                </tr>
              ) : (
                filteredReports.map(report => (
                  <tr key={report._id}>
                    <td>{getReportTypeBadge(report.type)}</td>
                    <td className="ref-cell-engreports">{report.reference}</td>
                    <td>
                      <div className="client-info-engreports">
                        <strong>{report.clientName || '—'}</strong>
                        {report.assessmentReference && (
                          <small>{report.assessmentReference}</small>
                        )}
                      </div>
                    </td>
                    <td>{formatDateTime(report.createdAt)}</td>
                    <td className="actions-cell-engreports">
                      <button
                        className="action-btn-engreports view-engreports"
                        onClick={() => handleViewReport(report)}
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      <button
                        className="action-btn-engreports download-engreports"
                        onClick={() => handleDownloadReport(report)}
                        title="Download PDF"
                      >
                        <FaDownload />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination-engreports">
            <button
              className="page-btn-engreports"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <FaChevronLeft /> Previous
            </button>
            <span className="page-info-engreports">Page {currentPage} of {totalPages}</span>
            <button
              className="page-btn-engreports"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next <FaChevronRight />
            </button>
          </div>
        )}

        {/* Report Details Modal */}
        {showReportModal && selectedReport && (
          <div className="modal-overlay-engreports" onClick={() => setShowReportModal(false)}>
            <div className="modal-content-engreports large-engreports" onClick={e => e.stopPropagation()}>
              <button className="modal-close-engreports" onClick={() => setShowReportModal(false)}>×</button>
              <h2>Report Details</h2>

              <div className="report-details-engreports">
                <div className="detail-section-engreports">
                  <h3>Report Information</h3>
                  <p><strong>Type:</strong> {getReportTypeBadge(selectedReport.type)}</p>
                  <p><strong>Reference:</strong> {selectedReport.reference}</p>
                  <p><strong>Generated:</strong> {formatDateTime(selectedReport.createdAt)}</p>
                  <p><strong>Generated By:</strong> {selectedReport.generatedBy || 'You'}</p>
                </div>

                <div className="detail-section-engreports">
                  <h3>Related Information</h3>
                  <p><strong>Client:</strong> {selectedReport.clientName || '—'}</p>
                  <p><strong>Assessment:</strong> {selectedReport.assessmentReference || '—'}</p>
                  {selectedReport.deviceId && (
                    <p><strong>Device ID:</strong> {selectedReport.deviceId}</p>
                  )}
                  {selectedReport.period && (
                    <p><strong>Data Period:</strong> {formatDate(selectedReport.period.start)} - {formatDate(selectedReport.period.end)}</p>
                  )}
                </div>

                {selectedReport.summary && (
                  <div className="detail-section-engreports">
                    <h3>Report Summary</h3>
                    {selectedReport.type === 'assessment' && (
                      <>
                        <p><strong>Property Type:</strong> {selectedReport.summary.propertyType}</p>
                        <p><strong>System Size:</strong> {selectedReport.summary.systemSize} kW</p>
                        <p><strong>Estimated Savings:</strong> ₱{selectedReport.summary.estimatedSavings?.toLocaleString()}</p>
                      </>
                    )}
                    {selectedReport.type === 'device' && (
                      <>
                        <p><strong>Total Readings:</strong> {selectedReport.summary.totalReadings}</p>
                        <p><strong>Avg Power:</strong> {selectedReport.summary.avgPower} W</p>
                        <p><strong>Peak Power:</strong> {selectedReport.summary.peakPower} W</p>
                        <p><strong>Data Completeness:</strong> {selectedReport.summary.dataCompleteness}%</p>
                      </>
                    )}
                    {selectedReport.type === 'quotation' && (
                      <>
                        <p><strong>Total Cost:</strong> ₱{selectedReport.summary.totalCost?.toLocaleString()}</p>
                        <p><strong>System Size:</strong> {selectedReport.summary.systemSize} kW</p>
                        <p><strong>Valid Until:</strong> {formatDate(selectedReport.summary.validUntil)}</p>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="modal-actions-engreports">
                <button className="btn-secondary-engreports" onClick={() => setShowReportModal(false)}>
                  Close
                </button>
                <button className="btn-primary-engreports" onClick={() => handleDownloadReport(selectedReport)}>
                  <FaDownload /> Download PDF
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