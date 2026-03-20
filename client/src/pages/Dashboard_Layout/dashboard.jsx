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
  FaShieldAlt
} from 'react-icons/fa';
import logo from '../../assets/Salfare_Logo.png'; // Import logo
import '../../styles/Dashboard/dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Refs for click outside detection
  const profileRef = useRef(null);
  const notificationsRef = useRef(null);
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState('user');
  const [userName, setUserName] = useState('Customer User');
  const [userPhoto, setUserPhoto] = useState(null);
  const [userEmail, setUserEmail] = useState('');

  // Handle click outside for profile dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close profile dropdown if click is outside
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      
      // Close notifications dropdown if click is outside
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup
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

    // Redirect based on role when at the base dashboard path
    if (location.pathname === '/dashboard') {
      if (role === 'user') {
        navigate('/dashboard/customerdashboard');
      } else if (role === 'engineer') {
        navigate('/dashboard/engineerdashboard');
      }
      // Admin stays at /dashboard
    }
  }, [navigate, location.pathname]);

  // Mock notifications
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'New site assessment scheduled', time: '5 min ago', read: false },
    { id: 2, message: 'Payment received from Client A', time: '1 hour ago', read: false },
    { id: 3, message: 'IoT device offline: Site B', time: '3 hours ago', read: true },
    { id: 4, message: 'Project update: Site C - 75% complete', time: '5 hours ago', read: true },
  ]);

  // Role-based menu items
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
      { icon: <FaHome />, label: 'Dashboard', path: '/dashboard/customerdashboard' },
      { icon: <FaSolarPanel />, label: 'My Project', path: '/dashboard/customerproject' },
      { icon: <FaCalendarAlt />, label: 'Book Assessment', path: '/dashboard/schedule' },
      { icon: <FaFileInvoice />, label: 'Billing', path: '/dashboard/customerbilling' },
      { icon: <FaChartLine />, label: 'Performance', path: '/dashboard/performance' },
      { icon: <FaFileAlt />, label: 'Reports', path: '/dashboard/customerreports' },
      { icon: <FaHeadset />, label: 'Support', path: '/dashboard/support' },
      { icon: <FaUserCog />, label: 'Settings', path: '/dashboard/customersettings' }, // Changed to customersettings
    ],
  };

  const getRoleDisplay = () => {
    switch (userRole) {
      case 'admin': return 'Administrator';
      case 'engineer': return 'Solar Engineer';
      case 'user': return 'Customer';
      default: return 'User';
    }
  };

  // Get settings path based on user role
  const getSettingsPath = () => {
    switch (userRole) {
      case 'admin': return '/dashboard/settings';
      case 'engineer': return '/dashboard/engineersettings';
      case 'user': return '/dashboard/customersettings'; // Changed to customersettings
      default: return '/dashboard/settings';
    }
  };

  // Get profile path based on user role
  const getProfilePath = () => {
    switch (userRole) {
      case 'admin': return '/dashboard/profile';
      case 'engineer': return '/dashboard/engineerprofile';
      case 'user': return '/dashboard/customersettings'; // Users go to settings for profile
      default: return '/dashboard/profile';
    }
  };

  const currentMenu = menuItems[userRole] || menuItems.admin;
  const unreadCount = notifications.filter(n => !n.read).length;
  const isCustomer = userRole === 'user';

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
    // Close dropdowns when navigating
    setProfileOpen(false);
    setNotificationsOpen(false);
  };

  // Handle profile dropdown navigation
  const handleProfileNavigation = (path) => {
    navigate(path);
    setProfileOpen(false);
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };

  // Mark single notification as read
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

  // ========== CUSTOMER LAYOUT (NO SIDEBAR) ==========
  if (isCustomer) {
    return (
      <div className="dashboard customer-dashboard">
        <main className="customer-main-content">
          {/* Simple Header for Customer */}
          <header className="customer-header">
            <div className="customer-header-left">
              <div className="customer-logo">
                <img src={logo} alt="Salfer Engineering" className="customer-logo-img" />
                <span className="customer-logo-text">Salfer Engineering</span>
              </div>
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
                        onClick={() => handleProfileNavigation('/dashboard/customersettings')} 
                        className="dropdown-item"
                      >
                        <FaUserCircle /> My Profile
                      </button>
                      
                      <button 
                        onClick={() => handleProfileNavigation('/dashboard/customersettings')} 
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

          {/* Customer Navigation Tabs */}
          <nav className="customer-nav">
            {currentMenu.map((item, index) => (
              <button
                key={index}
                onClick={() => handleNavigation(item.path)}
                className={`customer-nav-item ${isActive(item.path) ? 'active' : ''}`}
              >
                <span className="customer-nav-icon">{item.icon}</span>
                <span className="customer-nav-label">{item.label}</span>
              </button>
            ))}
          </nav>

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
            {/* Notifications Dropdown */}
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
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="profile-wrapper" ref={profileRef}>
              
                

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