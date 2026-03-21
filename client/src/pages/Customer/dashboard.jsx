// pages/Customer/CustomerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  FaBolt,
  FaLeaf,
  FaCalendarAlt,
  FaCheckCircle,
  FaArrowRight,
  FaFileInvoice,
  FaHeadset,
  FaUserCog
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../../styles/Customer/dashboard.css';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const name = sessionStorage.getItem('userName');
    if (name) setUserName(name);
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
    { title: 'Total Savings', value: '₱14,320', change: '+12%', icon: FaLeaf, color: '#10b981' },
    { title: 'Energy Produced', value: '1,245 kWh', change: '+8%', icon: FaBolt, color: '#f59e0b' },
    { title: 'CO₂ Offset', value: '872 kg', change: '-', icon: FaLeaf, color: '#3b82f6' }
  ];

  // Recent Activities
  const activities = [
    { id: 1, activity: 'Assessment scheduled', date: 'May 10, 2024' },
    { id: 2, activity: 'Payment received', date: 'May 8, 2024' },
    { id: 3, activity: 'Booking confirmed', date: 'May 5, 2024' }
  ];

  // Upcoming Schedule
  const schedule = {
    type: 'Site Assessment',
    date: 'May 15, 2024',
    time: '9:00 AM - 12:00 PM',
    location: '123 Rizal St., Barangay San Jose, Manila'
  };

  // Quick Actions
  const quickActions = [
    { icon: FaCalendarAlt, label: 'Book Assessment', path: '/dashboard/schedule', color: '#f59e0b' },
    { icon: FaFileInvoice, label: 'View Bills', path: '/dashboard/customerbilling', color: '#10b981' },
    { icon: FaHeadset, label: 'Support', path: '/dashboard/support', color: '#3b82f6' },
    { icon: FaUserCog, label: 'Profile', path: '/dashboard/customersettings?tab=profile', color: '#8b5cf6' }
  ];

  return (
    <>
      <Helmet>
        <title>Dashboard | Salfer Engineering</title>
      </Helmet>
      
      <div className="customer-dashboard">
        {/* Header */}
        <div className="dashboard-header">
          <h1>{getGreeting()}, {userName || 'Customer'}! </h1>
          <p>Track your solar project progress</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                <stat.icon />
              </div>
              <div className="stat-content">
                <span className="stat-title">{stat.title}</span>
                <strong className="stat-value">{stat.value}</strong>
                {stat.change !== '-' && <span className="stat-change">{stat.change}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Project Status */}
        <div className="project-card">
          <div className="project-header">
            <h3>Current Project</h3>
            <span className="status-badge in-progress">In Progress</span>
          </div>
          <p className="project-name">{projectData.name}</p>
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
            View Details <FaArrowRight />
          </button>
        </div>

        {/* Two Column Layout */}
        <div className="two-columns">
          {/* Recent Activities */}
          <div className="activities-card">
            <div className="card-header">
              <h3>Recent Activities</h3>
              <button className="view-all">View All</button>
            </div>
            <div className="activities-list">
              {activities.map(activity => (
                <div key={activity.id} className="activity-item">
                  <FaCheckCircle className="activity-icon" />
                  <div>
                    <span className="activity-name">{activity.activity}</span>
                    <span className="activity-date">{activity.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Schedule */}
          <div className="schedule-card">
            <div className="card-header">
              <h3>Upcoming Schedule</h3>
              <FaCalendarAlt className="schedule-icon" />
            </div>
            <div className="schedule-content">
              <div className="schedule-type">{schedule.type}</div>
              <div className="schedule-date">{schedule.date}</div>
              <div className="schedule-time">{schedule.time}</div>
              <div className="schedule-location">{schedule.location}</div>
            </div>
            <button className="manage-btn" onClick={() => navigate('/dashboard/appointment')}>
              Manage Schedule
            </button>
          </div>
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
                <action.icon style={{ color: action.color }} />
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