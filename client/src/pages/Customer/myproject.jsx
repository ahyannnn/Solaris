import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  FaSolarPanel, 
  FaCheckCircle, 
  FaClock, 
  FaCalendarAlt,
  FaUser,
  FaTools,
  FaClipboardList,
  FaChartLine,
  FaFileInvoice,
  FaDownload,
  FaArrowRight,
  FaExclamationTriangle,
  FaMapMarkerAlt
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../../styles/Customer/myproject.css';

const MyProject = () => {
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - replace with actual API call
    setTimeout(() => {
      setProject({
        id: 'PRJ-2024-001',
        name: 'Residential Solar Installation',
        address: '123 Rizal St., Barangay San Jose, Manila',
        status: 'in-progress',
        progress: 65,
        startDate: '2024-04-01',
        estimatedCompletion: '2024-06-30',
        actualCompletion: null,
        systemSize: '5.2 kW',
        panels: 13,
        inverter: '5 kW Hybrid',
        engineer: 'Engr. Juan Dela Cruz',
        milestones: [
          { id: 1, name: 'Site Assessment', date: '2024-04-05', status: 'completed' },
          { id: 2, name: 'System Design', date: '2024-04-15', status: 'completed' },
          { id: 3, name: 'Permit Processing', date: '2024-04-25', status: 'completed' },
          { id: 4, name: 'Installation', date: '2024-05-20', status: 'in-progress' },
          { id: 5, name: 'Inspection & Testing', date: '2024-06-05', status: 'pending' },
          { id: 6, name: 'Turnover & Training', date: '2024-06-20', status: 'pending' }
        ],
        documents: [
          { id: 1, name: 'System Design Plan', type: 'PDF', size: '2.5 MB', url: '#' },
          { id: 2, name: 'Permit Documents', type: 'PDF', size: '1.8 MB', url: '#' },
          { id: 3, name: 'Equipment List', type: 'PDF', size: '0.5 MB', url: '#' }
        ]
      });
      setLoading(false);
    }, 1500);
  }, []);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return <span className="status-badge pending">Pending</span>;
      case 'assessment':
        return <span className="status-badge assessment">Assessment</span>;
      case 'in-progress':
        return <span className="status-badge in-progress">In Progress</span>;
      case 'completed':
        return <span className="status-badge completed">Completed</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  const getMilestoneIcon = (status) => {
    switch(status) {
      case 'completed':
        return <FaCheckCircle className="milestone-icon completed" />;
      case 'in-progress':
        return <FaClock className="milestone-icon in-progress" />;
      default:
        return <FaClock className="milestone-icon pending" />;
    }
  };

  // Skeleton Loader Component
  const SkeletonLoader = () => (
    <div className="project-container">
      <div className="project-header">
        <div className="skeleton-line large"></div>
        <div className="skeleton-line small"></div>
      </div>

      {/* Overview Skeleton */}
      <div className="project-overview skeleton-card">
        <div className="skeleton-line medium"></div>
        <div className="skeleton-line small"></div>
        <div className="skeleton-details-grid">
          <div className="skeleton-line"></div>
          <div className="skeleton-line"></div>
          <div className="skeleton-line"></div>
          <div className="skeleton-line"></div>
        </div>
        <div className="skeleton-progress"></div>
      </div>

      {/* Address Skeleton */}
      <div className="address-card skeleton-card">
        <div className="skeleton-line medium"></div>
        <div className="skeleton-line"></div>
      </div>

      {/* System Details Skeleton */}
      <div className="system-details skeleton-card">
        <div className="skeleton-line medium"></div>
        <div className="skeleton-details-grid">
          <div className="skeleton-box"></div>
          <div className="skeleton-box"></div>
          <div className="skeleton-box"></div>
        </div>
      </div>

      {/* Milestones Skeleton */}
      <div className="milestones-section skeleton-card">
        <div className="skeleton-line medium"></div>
        <div className="skeleton-timeline">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="skeleton-timeline-item">
              <div className="skeleton-icon"></div>
              <div className="skeleton-content">
                <div className="skeleton-line small"></div>
                <div className="skeleton-line tiny"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Documents Skeleton */}
      <div className="documents-section skeleton-card">
        <div className="skeleton-line medium"></div>
        <div className="skeleton-documents">
          {[1, 2, 3].map((item) => (
            <div key={item} className="skeleton-document-item">
              <div className="skeleton-icon"></div>
              <div className="skeleton-content">
                <div className="skeleton-line small"></div>
                <div className="skeleton-line tiny"></div>
              </div>
              <div className="skeleton-button-small"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions Skeleton */}
      <div className="quick-actions">
        <div className="skeleton-button"></div>
        <div className="skeleton-button"></div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <>
        <Helmet>
          <title>My Project | Salfer Engineering</title>
        </Helmet>
        <SkeletonLoader />
      </>
    );
  }

  if (!project) {
    return (
      <div className="project-empty">
        <FaSolarPanel className="empty-icon" />
        <h2>No Active Project</h2>
        <p>You don't have any active project yet.</p>
        <button className="book-btn" onClick={() => navigate('/dashboard/schedule')}>
          Book an Assessment
        </button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Project | Salfer Engineering</title>
      </Helmet>
      
      <div className="project-container">
        {/* Header */}
        <div className="project-header">
          <h1>My Project</h1>
          <p>Track your solar panel installation progress</p>
        </div>

        {/* Project Overview Card */}
        <div className="project-overview">
          <div className="overview-header">
            <div>
              <h2>{project.name}</h2>
              <p className="project-id">{project.id}</p>
            </div>
            {getStatusBadge(project.status)}
          </div>
          
          <div className="overview-details">
            <div className="detail-item">
              <FaCalendarAlt />
              <span>Started: {new Date(project.startDate).toLocaleDateString()}</span>
            </div>
            <div className="detail-item">
              <FaCalendarAlt />
              <span>Est. Completion: {new Date(project.estimatedCompletion).toLocaleDateString()}</span>
            </div>
            <div className="detail-item">
              <FaSolarPanel />
              <span>{project.systemSize} System</span>
            </div>
            <div className="detail-item">
              <FaUser />
              <span>Engineer: {project.engineer}</span>
            </div>
          </div>

          <div className="progress-section">
            <div className="progress-label">
              <span>Overall Progress</span>
              <span>{project.progress}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${project.progress}%` }}></div>
            </div>
          </div>
        </div>

        {/* Project Address */}
        <div className="address-card">
          <FaMapMarkerAlt className="address-icon" />
          <div>
            <h3>Installation Address</h3>
            <p>{project.address}</p>
          </div>
        </div>

        {/* System Details */}
        <div className="system-details">
          <h3>System Details</h3>
          <div className="details-grid">
            <div className="detail-box">
              <FaSolarPanel />
              <span>Panels</span>
              <strong>{project.panels} pcs</strong>
            </div>
            <div className="detail-box">
              <FaTools />
              <span>Inverter</span>
              <strong>{project.inverter}</strong>
            </div>
            <div className="detail-box">
              <FaChartLine />
              <span>System Size</span>
              <strong>{project.systemSize}</strong>
            </div>
          </div>
        </div>

        {/* Milestones Timeline */}
        <div className="milestones-section">
          <h3>Project Timeline</h3>
          <div className="timeline">
            {project.milestones.map((milestone, index) => (
              <div key={milestone.id} className={`timeline-item ${milestone.status}`}>
                <div className="timeline-marker">
                  {getMilestoneIcon(milestone.status)}
                </div>
                <div className="timeline-content">
                  <h4>{milestone.name}</h4>
                  <p>{milestone.date ? new Date(milestone.date).toLocaleDateString() : 'Pending'}</p>
                </div>
                {index < project.milestones.length - 1 && <div className="timeline-line"></div>}
              </div>
            ))}
          </div>
        </div>

        {/* Documents */}
        <div className="documents-section">
          <h3>Project Documents</h3>
          <div className="documents-list">
            {project.documents.map(doc => (
              <div key={doc.id} className="document-item">
                <FaFileInvoice className="doc-icon" />
                <div className="doc-info">
                  <span className="doc-name">{doc.name}</span>
                  <span className="doc-meta">{doc.type} • {doc.size}</span>
                </div>
                <button className="download-btn">
                  <FaDownload /> Download
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <button className="action-btn" onClick={() => navigate('/dashboard/support')}>
            <FaClipboardList /> Need Help?
          </button>
          <button className="action-btn" onClick={() => navigate('/dashboard/performance')}>
            <FaChartLine /> View Performance
          </button>
        </div>
      </div>
    </>
  );
};

export default MyProject;