// pages/Customer/CustomerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  FaBolt,
  FaLeaf,
  FaCalendarAlt,
  FaArrowRight,
  FaFileInvoice,
  FaHeadset,
  FaUserCog,
  FaSpinner
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../../styles/Customer/dashboard.css';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const loadData = async () => {
      setTimeout(() => {
        const name = sessionStorage.getItem('userName');
        if (name) setUserName(name);
        setLoading(false);
      }, 1000);
    };
    
    loadData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Project Data
  const projectData = {
    name: 'Residential Solar Installation',
    status: 'in-progress',
    progress: 45,
    nextStep: 'Installation Phase',
    engineer: 'Engr. Juan Dela Cruz',
    estimatedCompletion: 'June 30, 2024'
  };

  // Stats Cards
  const stats = [
    { title: 'Total Savings', value: '₱14,320', change: '+12%', icon: FaLeaf },
    { title: 'Energy Produced', value: '1,245 kWh', change: '+8%', icon: FaBolt }
  ];

  // Quick Actions
  const quickActions = [
    { icon: FaCalendarAlt, label: 'Book Assessment', path: '/dashboard/schedule' },
    { icon: FaFileInvoice, label: 'View Bills', path: '/dashboard/customerbilling' },
    { icon: FaHeadset, label: 'Support', path: '/dashboard/support' },
    { icon: FaUserCog, label: 'Profile', path: '/dashboard/customersettings?tab=profile' }
  ];

  // Skeleton Loader Component
  const SkeletonLoader = () => (
    <>
      {/* Header Skeleton */}
      <div className="skeleton-header">
        <div className="skeleton-line large"></div>
        <div className="skeleton-line small"></div>
      </div>

      {/* Stats Skeleton */}
      <div className="stats-grid">
        {[1, 2].map((item) => (
          <div key={item} className="skeleton-card">
            <div className="skeleton-icon"></div>
            <div className="skeleton-content">
              <div className="skeleton-line"></div>
              <div className="skeleton-line medium"></div>
              <div className="skeleton-line small"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Project Card Skeleton */}
      <div className="skeleton-project-card">
        <div className="skeleton-line medium"></div>
        <div className="skeleton-line large"></div>
        <div className="skeleton-progress"></div>
        <div className="skeleton-details">
          <div className="skeleton-line"></div>
          <div className="skeleton-line"></div>
          <div className="skeleton-line"></div>
        </div>
        <div className="skeleton-button"></div>
      </div>

      {/* Schedule Card Skeleton */}
      <div className="skeleton-schedule-card">
        <div className="skeleton-line medium"></div>
        <div className="skeleton-line"></div>
        <div className="skeleton-line"></div>
        <div className="skeleton-line small"></div>
        <div className="skeleton-button"></div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className="skeleton-quick-actions">
        <div className="skeleton-line medium"></div>
        <div className="actions-grid">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="skeleton-action-btn"></div>
          ))}
        </div>
      </div>
    </>
  );

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Dashboard | Salfer Engineering</title>
        </Helmet>
        <div className="customer-dashboard">
          <SkeletonLoader />
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dashboard | Salfer Engineering</title>
      </Helmet>
      
      <div className="customer-dashboard">
        {/* Header */}
        <div className="dashboard-header">
          <h1>{getGreeting()}, {userName || 'Customer'}! 👋</h1>
          <p>Welcome back to your solar dashboard</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-icon">
                <stat.icon />
              </div>
              <div className="stat-content">
                <span className="stat-title">{stat.title}</span>
                <strong className="stat-value">{stat.value}</strong>
                <span className="stat-change">{stat.change}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Project Card */}
        <div className="project-card">
          <div className="project-header">
            <div>
              <h3>Current Project</h3>
              <p className="project-name">{projectData.name}</p>
            </div>
            <span className="status-badge">In Progress</span>
          </div>
          
          <div className="progress-section">
            <div className="progress-label">
              <span>Overall Progress</span>
              <span>{projectData.progress}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${projectData.progress}%` }}></div>
            </div>
          </div>
          
          <div className="project-details">
            <div>
              <span>Next Step</span>
              <strong>{projectData.nextStep}</strong>
            </div>
            <div>
              <span>Engineer</span>
              <strong>{projectData.engineer}</strong>
            </div>
            <div>
              <span>Est. Completion</span>
              <strong>{projectData.estimatedCompletion}</strong>
            </div>
          </div>
          
          <button className="view-btn" onClick={() => navigate('/dashboard/customerproject')}>
            View Project Details <FaArrowRight />
          </button>
        </div>

        {/* Upcoming Schedule Card */}
        <div className="schedule-card">
          <div className="schedule-header">
            <h3>Upcoming Schedule</h3>
            <FaCalendarAlt />
          </div>
          <div className="schedule-content">
            <div className="schedule-type">Site Assessment</div>
            <div className="schedule-date">May 15, 2024</div>
            <div className="schedule-time">9:00 AM - 12:00 PM</div>
            <div className="schedule-location">123 Rizal St., Barangay San Jose, Manila</div>
          </div>
          <button className="manage-btn" onClick={() => navigate('/dashboard/appointment')}>
            Manage Schedule
          </button>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="actions-grid">
            {quickActions.map((action, index) => (
              <button 
                key={index} 
                className="action-btn"
                onClick={() => navigate(action.path)}
              >
                <action.icon />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomerDashboard;