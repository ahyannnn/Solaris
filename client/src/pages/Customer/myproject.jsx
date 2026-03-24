import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
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
        return <span className="status-badge-cusset pending-cusset">Pending</span>;
      case 'assessment':
        return <span className="status-badge-cusset assessment-cusset">Assessment</span>;
      case 'in-progress':
        return <span className="status-badge-cusset in-progress-cusset">In Progress</span>;
      case 'completed':
        return <span className="status-badge-cusset completed-cusset">Completed</span>;
      default:
        return <span className="status-badge-cusset">{status}</span>;
    }
  };

  const getMilestoneStatus = (status) => {
    switch(status) {
      case 'completed':
        return <span className="milestone-status-cusset completed-cusset">✓</span>;
      case 'in-progress':
        return <span className="milestone-status-cusset in-progress-cusset">●</span>;
      default:
        return <span className="milestone-status-cusset pending-cusset">○</span>;
    }
  };

  // Skeleton Loader Component
  const SkeletonLoader = () => (
    <div className="project-container-cusset">
      <div className="project-header-cusset">
        <div className="skeleton-line-cusset large-cusset"></div>
        <div className="skeleton-line-cusset small-cusset"></div>
      </div>

      {/* Overview Skeleton */}
      <div className="project-overview-cusset skeleton-card-cusset">
        <div className="skeleton-line-cusset medium-cusset"></div>
        <div className="skeleton-line-cusset small-cusset"></div>
        <div className="skeleton-details-grid-cusset">
          <div className="skeleton-line-cusset"></div>
          <div className="skeleton-line-cusset"></div>
          <div className="skeleton-line-cusset"></div>
          <div className="skeleton-line-cusset"></div>
        </div>
        <div className="skeleton-progress-cusset"></div>
      </div>

      {/* Address Skeleton */}
      <div className="address-card-cusset skeleton-card-cusset">
        <div className="skeleton-line-cusset medium-cusset"></div>
        <div className="skeleton-line-cusset"></div>
      </div>

      {/* System Details Skeleton */}
      <div className="system-details-cusset skeleton-card-cusset">
        <div className="skeleton-line-cusset medium-cusset"></div>
        <div className="skeleton-details-grid-cusset">
          <div className="skeleton-box-cusset"></div>
          <div className="skeleton-box-cusset"></div>
          <div className="skeleton-box-cusset"></div>
        </div>
      </div>

      {/* Milestones Skeleton */}
      <div className="milestones-section-cusset skeleton-card-cusset">
        <div className="skeleton-line-cusset medium-cusset"></div>
        <div className="skeleton-timeline-cusset">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="skeleton-timeline-item-cusset">
              <div className="skeleton-icon-cusset"></div>
              <div className="skeleton-content-cusset">
                <div className="skeleton-line-cusset small-cusset"></div>
                <div className="skeleton-line-cusset tiny-cusset"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Documents Skeleton */}
      <div className="documents-section-cusset skeleton-card-cusset">
        <div className="skeleton-line-cusset medium-cusset"></div>
        <div className="skeleton-documents-cusset">
          {[1, 2, 3].map((item) => (
            <div key={item} className="skeleton-document-item-cusset">
              <div className="skeleton-icon-cusset"></div>
              <div className="skeleton-content-cusset">
                <div className="skeleton-line-cusset small-cusset"></div>
                <div className="skeleton-line-cusset tiny-cusset"></div>
              </div>
              <div className="skeleton-button-small-cusset"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions Skeleton */}
      <div className="quick-actions-cusset">
        <div className="skeleton-button-cusset"></div>
        <div className="skeleton-button-cusset"></div>
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
      <div className="project-empty-cusset">
        <h2>No Active Project</h2>
        <p>You don't have any active project yet.</p>
        <button className="book-btn-cusset" onClick={() => navigate('/dashboard/schedule')}>
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
      
      <div className="project-container-cusset">
        {/* Header */}
        <div className="project-header-cusset">
          <h1>My Project</h1>
          <p>Track your solar panel installation progress</p>
        </div>

        {/* Project Overview Card */}
        <div className="project-overview-cusset">
          <div className="overview-header-cusset">
            <div>
              <h2>{project.name}</h2>
              <p className="project-id-cusset">{project.id}</p>
            </div>
            {getStatusBadge(project.status)}
          </div>
          
          <div className="overview-details-cusset">
            <div className="detail-item-cusset">
              <span>Started: {new Date(project.startDate).toLocaleDateString()}</span>
            </div>
            <div className="detail-item-cusset">
              <span>Est. Completion: {new Date(project.estimatedCompletion).toLocaleDateString()}</span>
            </div>
            <div className="detail-item-cusset">
              <span>{project.systemSize} System</span>
            </div>
            <div className="detail-item-cusset">
              <span>Engineer: {project.engineer}</span>
            </div>
          </div>

          <div className="progress-section-cusset">
            <div className="progress-label-cusset">
              <span>Overall Progress</span>
              <span>{project.progress}%</span>
            </div>
            <div className="progress-bar-cusset">
              <div className="progress-fill-cusset" style={{ width: `${project.progress}%` }}></div>
            </div>
          </div>
        </div>

        {/* Project Address */}
        <div className="address-card-cusset">
          <div>
            <h3>Installation Address</h3>
            <p>{project.address}</p>
          </div>
        </div>

        {/* System Details */}
        <div className="system-details-cusset">
          <h3>System Details</h3>
          <div className="details-grid-cusset">
            <div className="detail-box-cusset">
              <span>Panels</span>
              <strong>{project.panels} pcs</strong>
            </div>
            <div className="detail-box-cusset">
              <span>Inverter</span>
              <strong>{project.inverter}</strong>
            </div>
            <div className="detail-box-cusset">
              <span>System Size</span>
              <strong>{project.systemSize}</strong>
            </div>
          </div>
        </div>

        {/* Milestones Timeline */}
        <div className="milestones-section-cusset">
          <h3>Project Timeline</h3>
          <div className="timeline-cusset">
            {project.milestones.map((milestone, index) => (
              <div key={milestone.id} className={`timeline-item-cusset ${milestone.status}-cusset`}>
                <div className="timeline-marker-cusset">
                  {getMilestoneStatus(milestone.status)}
                </div>
                <div className="timeline-content-cusset">
                  <h4>{milestone.name}</h4>
                  <p>{milestone.date ? new Date(milestone.date).toLocaleDateString() : 'Pending'}</p>
                </div>
                {index < project.milestones.length - 1 && <div className="timeline-line-cusset"></div>}
              </div>
            ))}
          </div>
        </div>

        {/* Documents */}
        <div className="documents-section-cusset">
          <h3>Project Documents</h3>
          <div className="documents-list-cusset">
            {project.documents.map(doc => (
              <div key={doc.id} className="document-item-cusset">
                <div className="doc-info-cusset">
                  <span className="doc-name-cusset">{doc.name}</span>
                  <span className="doc-meta-cusset">{doc.type} • {doc.size}</span>
                </div>
                <button className="download-btn-cusset">
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-cusset">
          <button className="action-btn-cusset" onClick={() => navigate('/dashboard/support')}>
            Need Help?
          </button>
          <button className="action-btn-cusset" onClick={() => navigate('/dashboard/performance')}>
            View Performance
          </button>
        </div>
      </div>
    </>
  );
};

export default MyProject;