import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
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
  FaSearch,
  FaClipboardList,
  FaProjectDiagram,
  FaFileInvoiceDollar,
  FaClipboardCheck,
  FaUserCog,
  FaCalendarAlt,
  FaFileInvoice,
  FaChartLine,
  FaHeadset,
  FaHome,
  FaCreditCard,
  FaQuestionCircle,
  FaBell as FaBellSolid,
  FaAddressBook,
  FaLock,
  FaShieldAlt,
  FaPalette,
  FaKey
} from 'react-icons/fa';
import logo from '../../assets/Salfare_Logo.png';
import '../../styles/Dashboard/dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const profileRef = useRef(null);
  const notificationsRef = useRef(null);
  const settingsDropdownRef = useRef(null);
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState('user');
  const [userName, setUserName] = useState('Customer User');
  const [userPhoto, setUserPhoto] = useState(null);
  const [userEmail, setUserEmail] = useState('');

  // Handle click outside for all dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target)) {
        setSettingsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const role = sessionStorage.getItem('userRole');
    const name = sessionStorage.getItem('userName');
    const photo = sessionStorage.getItem('userPhotoURL');
    const email = sessionStorage.getItem('userEmail');

    if (role) setUserRole(role);
    if (name) setUserName(name);
    if (photo) setUserPhoto(photo);
    if (email) setUserEmail(email);

    if (!role) {
      navigate('/login');
      return;
    }

    if (location.pathname === '/dashboard') {
      if (role === 'user') {
        navigate('/dashboard/customerdashboard');
      } else if (role === 'engineer') {
        navigate('/dashboard/engineerdashboard');
      }
    }
  }, [navigate, location.pathname]);

  const [notifications, setNotifications] = useState([
    { id: 1, message: 'New site assessment scheduled', time: '5 min ago', read: false },
    { id: 2, message: 'Payment received from Client A', time: '1 hour ago', read: false },
    { id: 3, message: 'IoT device offline: Site B', time: '3 hours ago', read: true },
    { id: 4, message: 'Project update: Site C - 75% complete', time: '5 hours ago', read: true },
  ]);

  const menuItems = {
    admin: [
      { icon: <FaTachometerAlt />, label: 'Dashboard', path: '/dashboard' },
      { icon: <FaClipboardList />, label: 'Site Assessments', path: '/dashboard/siteassessment' },
      { icon: <FaProjectDiagram />, label: 'Projects', path: '/dashboard/project' },
      { icon: <FaFileInvoiceDollar />, label: 'Billing', path: '/dashboard/billing' },
      { icon: <FaMicrochip />, label: 'IoT Devices', path: '/dashboard/iotdevice' },
      { icon: <FaChartBar />, label: 'Reports', path: '/dashboard/reports' },
      { icon: <FaUsers />, label: 'User Management', path: '/dashboard/usermanagement' },
      { icon: <FaCog />, label: 'Settings', path: '/dashboard/settings' },
    ],

    engineer: [
      { icon: <FaTachometerAlt />, label: 'Dashboard', path: '/dashboard/engineerdashboard' },
      { icon: <FaClipboardCheck />, label: 'Site Assessments', path: '/dashboard/siteassessment' },
      { icon: <FaProjectDiagram />, label: 'My Projects', path: '/dashboard/engineerproject' },
      { icon: <FaMicrochip />, label: 'Device Data', path: '/dashboard/iotdevice' },
      { icon: <FaFileAlt />, label: 'Reports', path: '/dashboard/engineerreports' },
      { icon: <FaUserCog />, label: 'Profile', path: '/dashboard/engineerprofile' },
      { icon: <FaCog />, label: 'Settings', path: '/dashboard/engineersettings' },
    ],

    user: [
      { label: 'Dashboard', path: '/dashboard/customerdashboard' },
      { label: 'My Project', path: '/dashboard/customerproject' },
      { label: 'Book Assessment', path: '/dashboard/schedule' },
      { label: 'Billing', path: '/dashboard/customerbilling' },
      { label: 'Performance', path: '/dashboard/performance' },
      { label: 'Reports', path: '/dashboard/customerreports' },
      { label: 'Support', path: '/dashboard/support' },
    ],
  };

  // Settings submenu items for customer - NO ICONS
  const settingsSubmenu = [
    { label: 'Profile', path: '/dashboard/customersettings?tab=profile' },
    { label: 'Addresses', path: '/dashboard/customersettings?tab=addresses' },
    { label: 'Notifications', path: '/dashboard/customersettings?tab=notifications' },
    { label: 'Security', path: '/dashboard/customersettings?tab=security' },
    { label: 'Preferences', path: '/dashboard/customersettings?tab=preferences' },
    { label: 'Billing', path: '/dashboard/customersettings?tab=billing' },
  ];

  const getRoleDisplay = () => {
    switch (userRole) {
      case 'admin': return 'Administrator';
      case 'engineer': return 'Solar Engineer';
      case 'user': return 'Customer';
      default: return 'User';
    }
  };

  const getSettingsPath = () => {
    switch (userRole) {
      case 'admin': return '/dashboard/settings';
      case 'engineer': return '/dashboard/engineersettings';
      case 'user': return '/dashboard/customersettings?tab=profile';
      default: return '/dashboard/settings';
    }
  };

  const getProfilePath = () => {
    switch (userRole) {
      case 'admin': return '/dashboard/profile';
      case 'engineer': return '/dashboard/engineerprofile';
      case 'user': return '/dashboard/customersettings?tab=profile';
      default: return '/dashboard/profile';
    }
  };

  const currentMenu = menuItems[userRole] || menuItems.admin;
  const unreadCount = notifications.filter(n => !n.read).length;
  const isCustomer = userRole === 'user';

  // Check if any settings submenu is active
  const isSettingsActive = () => {
    return location.pathname === '/dashboard/customersettings' || 
           location.pathname.startsWith('/dashboard/customersettings');
  };

  // Handle settings dropdown navigation
  const handleSettingsNavigation = (path) => {
    navigate(path);
    setSettingsDropdownOpen(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userName');
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userPhotoURL');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('clientData');
    navigate('/');
  };

  const handleNavigation = (path) => {
    navigate(path);
    setSidebarOpen(false);
    setProfileOpen(false);
    setNotificationsOpen(false);
    setSettingsDropdownOpen(false);
  };

  const handleProfileNavigation = (path) => {
    navigate(path);
    setProfileOpen(false);
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const isActive = (itemPath) => {
    if (itemPath === '/dashboard' || itemPath === '/dashboard/customerdashboard' || itemPath === '/dashboard/engineerdashboard') {
      return location.pathname === itemPath;
    }
    return location.pathname.startsWith(itemPath);
  };

  // ========== CUSTOMER LAYOUT (WITH DROPDOWN SETTINGS) ==========
  if (isCustomer) {
    return (
      <div className="dashboard customer-dashboard">
        <main className="customer-main-content">
          {/* Header with Logo and Navigation Links */}
          <header className="customer-header">
            <div className="customer-header-left">
              <div className="customer-logo">
                <img src={logo} alt="Salfer Engineering" className="customer-logo-img" />
                <span className="customer-logo-text">Salfer Engineering</span>
              </div>

              {/* Navigation Links - No Icons */}
              <nav className="customer-nav-links">
                {currentMenu.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleNavigation(item.path)}
                    className={`customer-nav-link ${isActive(item.path) ? 'active' : ''}`}
                  >
                    <span className="customer-nav-link-label">{item.label}</span>
                  </button>
                ))}
                
                {/* Settings Dropdown Button */}
                <div className="settings-dropdown-wrapper" ref={settingsDropdownRef}>
                  <button
                    onClick={() => setSettingsDropdownOpen(!settingsDropdownOpen)}
                    className={`customer-nav-link settings-dropdown-btn ${isSettingsActive() ? 'active' : ''}`}
                  >
                    <span className="customer-nav-link-label">Settings</span>
                    <FaChevronDown className={`dropdown-arrow ${settingsDropdownOpen ? 'open' : ''}`} />
                  </button>
                  
                  {settingsDropdownOpen && (
                    <div className="settings-dropdown-menu">
                      {settingsSubmenu.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => handleSettingsNavigation(item.path)}
                          className="settings-dropdown-item"
                        >
                          <span className="dropdown-item-label">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </nav>
            </div>

            <div className="customer-header-right">
              {/* Notifications */}
              <div className="notification-wrapper" ref={notificationsRef}>
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
                      {unreadCount > 0 && (
                        <span className="mark-read" onClick={markAllAsRead}>
                          Mark all as read
                        </span>
                      )}
                    </div>
                    <div className="notification-list">
                      {notifications.length > 0 ? (
                        notifications.map(notif => (
                          <div 
                            key={notif.id} 
                            className={`notification-item ${!notif.read ? 'unread' : ''}`}
                            onClick={() => markAsRead(notif.id)}
                          >
                            <p className="notification-message">{notif.message}</p>
                            <span className="notification-time">{notif.time}</span>
                          </div>
                        ))
                      ) : (
                        <div className="notification-empty">
                          <FaBellSolid className="empty-icon" />
                          <p>No notifications</p>
                        </div>
                      )}
                    </div>
                    <div className="notification-footer">
                      <button onClick={() => handleNavigation('/dashboard/notifications')}>
                        View all
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile */}
              <div className="profile-wrapper" ref={profileRef}>
                <button
                  className="profile-btn"
                  onClick={() => setProfileOpen(!profileOpen)}
                >
                  {userPhoto ? (
                    <img
                      src={userPhoto}
                      alt={userName}
                      className="customer-profile-img"
                    />
                  ) : (
                    <FaUserCircle className="profile-icon" />
                  )}
                  <span className="profile-name">{userName}</span>
                  <FaChevronDown className={`dropdown-icon ${profileOpen ? 'open' : ''}`} />
                </button>

                {profileOpen && (
                  <div className="profile-dropdown">
                    <div className="profile-menu">
                      <button 
                        onClick={() => handleProfileNavigation('/dashboard/customersettings?tab=profile')} 
                        className="dropdown-item"
                      >
                        <FaUserCircle /> My Profile
                      </button>
                      
                      <button 
                        onClick={() => handleProfileNavigation('/dashboard/customersettings?tab=preferences')} 
                        className="dropdown-item"
                      >
                        <FaCog /> Settings
                      </button>
          
                      <hr />
                      
                      <button onClick={handleLogout} className="dropdown-item logout">
                        <FaSignOutAlt /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Content Area */}
          <div className="customer-content-area">
            <Outlet />
          </div>
        </main>
      </div>
    );
  }

  // ========== ADMIN/ENGINEER LAYOUT (WITH SIDEBAR) ==========
  return (
    <div className="dashboard">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon">
              <img src={logo} alt="Salfer Engineering" className="sidebar-logo-img" />
            </div>
            <h1 className="logo-text">Salfer Engineering</h1>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            <FaTimes />
          </button>
        </div>

        <div className="user-info">
          <div className="user-avatar">
            {userPhoto ? (
              <img
                src={userPhoto}
                alt={userName}
                style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <FaUserCircle style={{ fontSize: '50px', color: '#f39c12' }} />
            )}
          </div>
          <div className="user-details">
            <span className="user-name">{userName}</span>
            <span className="user-role">{getRoleDisplay()}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {currentMenu.map((item, index) => (
            <button
              key={index}
              onClick={() => handleNavigation(item.path)}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-content">
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
            <div className="notification-wrapper" ref={notificationsRef}>
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
                    {unreadCount > 0 && (
                      <span className="mark-read" onClick={markAllAsRead}>
                        Mark all as read
                      </span>
                    )}
                  </div>
                  <div className="notification-list">
                    {notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        className={`notification-item ${!notif.read ? 'unread' : ''}`}
                        onClick={() => markAsRead(notif.id)}
                      >
                        <p className="notification-message">{notif.message}</p>
                        <span className="notification-time">{notif.time}</span>
                      </div>
                    ))}
                  </div>
                  <div className="notification-footer">
                    <button onClick={() => handleNavigation('/dashboard/notifications')}>
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="profile-wrapper" ref={profileRef}>
              <button
                className="profile-btn"
                onClick={() => setProfileOpen(!profileOpen)}
              >
                {userPhoto ? (
                  <img
                    src={userPhoto}
                    alt={userName}
                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', marginRight: '8px' }}
                  />
                ) : (
                  <FaUserCircle className="profile-icon" />
                )}
                <span className="profile-name">{userName}</span>
                <FaChevronDown className={`dropdown-icon ${profileOpen ? 'open' : ''}`} />
              </button>

              {profileOpen && (
                <div className="profile-dropdown">
                  <div className="profile-menu">
                    <button 
                      onClick={() => handleProfileNavigation(getProfilePath())} 
                      className="dropdown-item"
                    >
                      <FaUserCircle /> My Profile
                    </button>
                    
                    <button 
                      onClick={() => handleProfileNavigation(getSettingsPath())} 
                      className="dropdown-item"
                    >
                      <FaCog /> Settings
                    </button>
                    
                    <hr />
                    
                    <button onClick={handleLogout} className="dropdown-item logout">
                      <FaSignOutAlt /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;