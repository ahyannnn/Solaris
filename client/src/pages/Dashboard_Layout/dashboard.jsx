import React, { useState } from 'react';
import { 
  FaSolarPanel, 
  FaTachometerAlt, 
  FaUsers, 
  FaMapMarkerAlt, 
  FaMicrochip,
  FaChartBar,
  FaFileAlt,
  FaCog,
  FaBell,
  FaUserCircle,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaChevronDown,
  FaSearch
} from 'react-icons/fa';
import '../../styles/Dashboard/dashboard.css';

const Dashboard = ({ children, userRole = 'admin' }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock notifications
  const notifications = [
    { id: 1, message: 'New site data available', time: '5 min ago', read: false },
    { id: 2, message: 'Device offline: Site A', time: '1 hour ago', read: false },
    { id: 3, message: 'Report ready for download', time: '3 hours ago', read: true },
  ];

  // Role-based menu items
  const menuItems = {
    admin: [
      { icon: <FaTachometerAlt />, label: 'Dashboard', path: '/dashboard/admin' },
      { icon: <FaUsers />, label: 'User Management', path: '/dashboard/admin/users' },
      { icon: <FaMapMarkerAlt />, label: 'Sites', path: '/dashboard/admin/sites' },
      { icon: <FaMicrochip />, label: 'Devices', path: '/dashboard/admin/devices' },
      { icon: <FaChartBar />, label: 'Analytics', path: '/dashboard/admin/analytics' },
      { icon: <FaFileAlt />, label: 'Reports', path: '/dashboard/admin/reports' },
      { icon: <FaCog />, label: 'Settings', path: '/dashboard/admin/settings' },
    ],
    engineer: [
      { icon: <FaTachometerAlt />, label: 'Dashboard', path: '/dashboard/engineer' },
      { icon: <FaMapMarkerAlt />, label: 'My Sites', path: '/dashboard/engineer/sites' },
      { icon: <FaMicrochip />, label: 'Devices', path: '/dashboard/engineer/devices' },
      { icon: <FaChartBar />, label: 'Analysis', path: '/dashboard/engineer/analysis' },
      { icon: <FaFileAlt />, label: 'Reports', path: '/dashboard/engineer/reports' },
    ],
    customer: [
      { icon: <FaTachometerAlt />, label: 'Dashboard', path: '/dashboard/customer' },
      { icon: <FaMapMarkerAlt />, label: 'My Sites', path: '/dashboard/customer/my-sites' },
      { icon: <FaFileAlt />, label: 'Reports', path: '/dashboard/customer/reports' },
      { icon: <FaCog />, label: 'Settings', path: '/dashboard/customer/profile' },
    ],
  };

  const currentMenu = menuItems[userRole] || menuItems.admin;
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="dashboard">
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon">
              <FaSolarPanel />
            </div>
            <h1 className="logo-text">SOLARIS</h1>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            <FaTimes />
          </button>
        </div>

        <div className="user-info">
          <div className="user-avatar">
            <FaUserCircle />
          </div>
          <div className="user-details">
            <span className="user-name">John Doe</span>
            <span className="user-role">{userRole.charAt(0).toUpperCase() + userRole.slice(1)}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {currentMenu.map((item, index) => (
            <a key={index} href={item.path} className="nav-item">
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="sidebar-footer">
          <a href="/logout" className="nav-item logout">
            <span className="nav-icon"><FaSignOutAlt /></span>
            <span className="nav-label">Logout</span>
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="dashboard-header">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <FaBars />
          </button>

          <div className="header-search">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="header-actions">
            {/* Notifications */}
            <div className="notification-wrapper">
              <button 
                className="notification-btn"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <FaBell />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </button>
              
              {notificationsOpen && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h3>Notifications</h3>
                    <span className="mark-read">Mark all as read</span>
                  </div>
                  <div className="notification-list">
                    {notifications.map(notif => (
                      <div key={notif.id} className={`notification-item ${!notif.read ? 'unread' : ''}`}>
                        <p className="notification-message">{notif.message}</p>
                        <span className="notification-time">{notif.time}</span>
                      </div>
                    ))}
                  </div>
                  <div className="notification-footer">
                    <a href="/notifications">View all</a>
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="profile-wrapper">
              <button 
                className="profile-btn"
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <FaUserCircle className="profile-icon" />
                <span className="profile-name">John Doe</span>
                <FaChevronDown className={`dropdown-icon ${profileOpen ? 'open' : ''}`} />
              </button>

              {profileOpen && (
                <div className="profile-dropdown">
                  <a href="/profile" className="dropdown-item">
                    <FaUserCircle /> Profile
                  </a>
                  <a href="/settings" className="dropdown-item">
                    <FaCog /> Settings
                  </a>
                  <hr />
                  <a href="/logout" className="dropdown-item logout">
                    <FaSignOutAlt /> Logout
                  </a>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="content-area">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;