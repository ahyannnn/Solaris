// pages/Dashboard_Layout/dashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import axios from 'axios';
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
  FaKey,
  FaRegClock,
  FaRegCalendarAlt,
  FaTools
} from 'react-icons/fa';
import logo from '../../assets/Salfare_Logo.png';
import profileImage from '../../assets/profile.png';
import '../../styles/Dashboard/dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [initialized, setInitialized] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [maintenanceStatus, setMaintenanceStatus] = useState({ isUnderMaintenance: false, title: '' });

  const profileRef = useRef(null);
  const notificationsRef = useRef(null);
  const settingsDropdownRef = useRef(null);
  const supportDropdownRef = useRef(null);
  const sidebarSettingsDropdownRef = useRef(null);
  const sidebarSupportDropdownRef = useRef(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const [supportDropdownOpen, setSupportDropdownOpen] = useState(false);
  const [sidebarSettingsOpen, setSidebarSettingsOpen] = useState(false);
  const [sidebarSupportOpen, setSidebarSupportOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState('user');
  const [userName, setUserName] = useState('Customer User');
  const [userPhoto, setUserPhoto] = useState(null);
  const [userEmail, setUserEmail] = useState('');

  const [notifications, setNotifications] = useState([
    { id: 1, message: 'New site assessment scheduled', time: '5 min ago', read: false },
    { id: 2, message: 'Payment received from Client A', time: '1 hour ago', read: false },
    { id: 3, message: 'IoT device offline: Site B', time: '3 hours ago', read: true },
    { id: 4, message: 'Project update: Site C - 75% complete', time: '5 hours ago', read: true },
  ]);

  const menuItems = {
    admin: [
      { icon: <FaTachometerAlt />, label: 'Dashboard', path: '/app/admin' },
      { icon: <FaClipboardList />, label: 'Site Assessments', path: '/app/admin/siteassessment' },
      { icon: <FaProjectDiagram />, label: 'Projects', path: '/app/admin/project' },
      { icon: <FaFileInvoiceDollar />, label: 'Billing', path: '/app/admin/billing' },
      { icon: <FaMicrochip />, label: 'IoT Devices', path: '/app/admin/iotdevice' },
      { icon: <FaChartBar />, label: 'Reports', path: '/app/admin/reports' },
      { icon: <FaClipboardList />, label: 'Schedule', path: '/app/admin/schedule' },
      { icon: <FaUsers />, label: 'User Management', path: '/app/admin/usermanagement' },
      { icon: <FaTools />, label: 'Maintenance', path: '/app/admin/maintenance' },
      { icon: <FaCog />, label: 'Settings', path: '/app/admin/settings' },
    ],

    engineer: [
      { icon: <FaTachometerAlt />, label: 'Dashboard', path: '/app/engineer' },
      { icon: <FaClipboardCheck />, label: 'My Assessments', path: '/app/engineer/assessment' },
      { icon: <FaProjectDiagram />, label: 'My Projects', path: '/app/engineer/project' },
      { icon: <FaMicrochip />, label: 'Device Data', path: '/app/engineer/device' },
      //{ icon: <FaFileAlt />, label: 'Reports', path: '/app/engineer/reports' },
      { icon: <FaClipboardList />, label: 'Schedule', path: '/app/engineer/schedule' },
      //{ icon: <FaUserCog />, label: 'Profile', path: '/app/engineer/profile' },
    ],

    user: [
      { icon: <FaHome />, label: 'Dashboard', path: '/app/customer' },
      { icon: <FaProjectDiagram />, label: 'My Project', path: '/app/customer/project' },
      { icon: <FaCalendarAlt />, label: 'Book Assessment', path: '/app/customer/book-assessment' },
      { icon: <FaFileInvoiceDollar />, label: 'Billing', path: '/app/customer/billing' },
    ],
  };

  const settingsSubmenu = [
    { label: 'Profile', path: '/app/customer/settings?tab=profile' },
    { label: 'Addresses', path: '/app/customer/settings?tab=addresses' },
   
  ];

  const supportSubmenu = [
    { label: 'Contact Form', path: '/app/customer/support?tab=contact' },
    { label: 'Contact Info', path: '/app/customer/support?tab=info' },
  ];

  const isCustomer = userRole === 'user';
  const isAdmin = userRole === 'admin';
  const isEngineer = userRole === 'engineer';
  const isMobile = () => window.innerWidth <= 768;

  // Update datetime every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch maintenance status (Admin only)
  useEffect(() => {
    const fetchMaintenanceStatus = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/maintenance/status`);
        setMaintenanceStatus({
          isUnderMaintenance: response.data.isUnderMaintenance,
          title: response.data.title
        });
      } catch (error) {
        console.error('Error fetching maintenance status:', error);
      }
    };

    if (isAdmin) {
      fetchMaintenanceStatus();
      const interval = setInterval(fetchMaintenanceStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

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
      if (supportDropdownRef.current && !supportDropdownRef.current.contains(event.target)) {
        setSupportDropdownOpen(false);
      }
      if (sidebarSettingsDropdownRef.current && !sidebarSettingsDropdownRef.current.contains(event.target)) {
        setSidebarSettingsOpen(false);
      }
      if (sidebarSupportDropdownRef.current && !sidebarSupportDropdownRef.current.contains(event.target)) {
        setSidebarSupportOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle window resize for sidebar
  useEffect(() => {
    const handleResize = () => {
      if (isCustomer) {
        setSidebarOpen(false);
      } else {
        if (window.innerWidth > 768) {
          setSidebarOpen(true);
        } else {
          setSidebarOpen(false);
        }
      }
      setProfileOpen(false);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isCustomer]);

  // Handle user authentication and initial redirect
  useEffect(() => {
    if (initialized || isNavigating) return;

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const role = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');
    const name = localStorage.getItem('userName') || sessionStorage.getItem('userName');
    const photo = localStorage.getItem('userPhotoURL') || sessionStorage.getItem('userPhotoURL');
    const email = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');

    if (role) setUserRole(role);
    if (name) setUserName(name);
    if (photo) setUserPhoto(photo);
    if (email) setUserEmail(email);

    if (!token || !role) {
      setIsNavigating(true);
      navigate('/login');
      return;
    }

    if (!initialized && location.pathname === '/app') {
      setInitialized(true);

      setTimeout(() => {
        if (role === 'user') {
          navigate('/app/customer');
        } else if (role === 'engineer') {
          navigate('/app/engineer');
        } else if (role === 'admin') {
          navigate('/app/admin');
        }
      }, 0);
    } else {
      setInitialized(true);
    }
  }, [navigate, location.pathname, initialized, isNavigating]);

  // Generate breadcrumb based on current path
  const getBreadcrumb = () => {
    const pathnames = location.pathname.split('/').filter(x => x);
    const breadcrumbs = [];

    if (pathnames.length === 0) return [{ name: 'Dashboard', path: '/app' }];

    let currentPath = '';
    for (let i = 0; i < pathnames.length; i++) {
      currentPath += `/${pathnames[i]}`;
      let name = pathnames[i].charAt(0).toUpperCase() + pathnames[i].slice(1);
      if (name === 'App') name = 'Dashboard';
      if (name === 'Customer') continue;
      breadcrumbs.push({ name, path: currentPath });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumb();

  const getRoleDisplay = () => {
    switch (userRole) {
      case 'admin': return 'Administrator';
      case 'engineer': return 'Solar Engineer';
      case 'user': return 'Customer';
      default: return 'User';
    }
  };

  const getRoleBadgeClass = () => {
    switch (userRole) {
      case 'admin': return 'role-badge-admin';
      case 'engineer': return 'role-badge-engineer';
      default: return 'role-badge-user';
    }
  };

  const getSettingsPath = () => {
    switch (userRole) {
      case 'admin': return '/app/settings';
      case 'engineer': return '/app/engineersettings';
      case 'user': return '/app/customer/settings?tab=profile';
      default: return '/app/settings';
    }
  };

  const getProfilePath = () => {
    switch (userRole) {
      case 'admin': return '/app/profile';
      case 'engineer': return '/app/engineerprofile';
      case 'user': return '/app/customer/settings?tab=profile';
      default: return '/app/profile';
    }
  };

  const currentMenu = menuItems[userRole] || menuItems.admin;
  const unreadCount = notifications.filter(n => !n.read).length;

  const formatDateTime = () => {
    return currentDateTime.toLocaleDateString('en-PH', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) + ' | ' + currentDateTime.toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const isActive = (itemPath) => {
    const currentPath = location.pathname;

    if (itemPath === '/app/customer' || itemPath === '/app/engineer' || itemPath === '/app/admin') {
      return currentPath === itemPath;
    }

    if (currentPath === itemPath) return true;
    if (currentPath.startsWith(itemPath + '/')) return true;
    if (itemPath === '/app/customer/settings' && currentPath === '/app/customer/settings') return true;
    if (itemPath === '/app/customer/support' && currentPath === '/app/customer/support') return true;

    return false;
  };

  const isSettingsActive = () => {
    const currentPath = location.pathname;
    return currentPath === '/app/customer/settings' || currentPath.startsWith('/app/customer/settings?');
  };

  const isSupportActive = () => {
    const currentPath = location.pathname;
    return currentPath === '/app/customer/support' || currentPath.startsWith('/app/customer/support?');
  };

  const handleSettingsNavigation = (path) => {
    if (isNavigating) return;
    setIsNavigating(true);
    navigate(path);
    setSettingsDropdownOpen(false);
    setSidebarSettingsOpen(false);
    setTimeout(() => setIsNavigating(false), 500);
  };

  const handleSupportNavigation = (path) => {
    if (isNavigating) return;
    setIsNavigating(true);
    navigate(path);
    setSupportDropdownOpen(false);
    setSidebarSupportOpen(false);
    setTimeout(() => setIsNavigating(false), 500);
  };

  const handleLogout = () => {
    if (isNavigating) return;
    setIsNavigating(true);

    localStorage.clear();
    sessionStorage.clear();

    setTimeout(() => {
      navigate('/');
    }, 100);
  };

  const handleNavigation = (path) => {
    if (isNavigating) return;
    setIsNavigating(true);

    navigate(path);
    if (isMobile()) {
      setSidebarOpen(false);
    }
    setProfileOpen(false);
    setNotificationsOpen(false);
    setSettingsDropdownOpen(false);
    setSupportDropdownOpen(false);
    setSidebarSettingsOpen(false);
    setSidebarSupportOpen(false);

    setTimeout(() => setIsNavigating(false), 500);
  };

  const handleProfileNavigation = (path) => {
    if (isNavigating) return;
    setIsNavigating(true);
    navigate(path);
    setProfileOpen(false);
    setTimeout(() => setIsNavigating(false), 500);
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };

  const markAsRead = (id) => {
    setNotifications(notifications.map(notif =>
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const handleProfileClick = () => {
    if (isMobile()) return;
    if (isCustomer) {
      setProfileOpen(!profileOpen);
    }
  };

  // ========== CUSTOMER LAYOUT ==========
  if (isCustomer) {
    return (
      <div className="dashboard-layout-dashboard customer-dashboard-layout-dashboard">
        {/* Sidebar Overlay */}
        {sidebarOpen && isMobile() && <div className="sidebar-overlay-layout-dashboard" onClick={() => setSidebarOpen(false)} />}
        
        {/* Sidebar Drawer - ONLY for mobile, contains profile and all navigation */}
        <aside className={`customer-sidebar-layout-dashboard ${sidebarOpen && isMobile() ? 'open-layout-dashboard' : ''}`}>
          <div className="sidebar-header-layout-dashboard">
            <div className="logo-container-layout-dashboard">
              <div className="logo-icon-layout-dashboard">
                <img src={logo} alt="Salfer Engineering" className="sidebar-logo-img-layout-dashboard" />
              </div>
              <h1 className="logo-text-layout-dashboard">Salfer Engineering</h1>
            </div>
            <button 
              className="sidebar-close-btn"
              onClick={() => setSidebarOpen(false)}
            >
              <FaTimes />
            </button>
          </div>

          {/* Profile Section in Sidebar - Mobile only */}
          <div className="sidebar-user-info-layout-dashboard">
            <div className="sidebar-user-avatar-layout-dashboard">
              <img
                src={userPhoto || profileImage}
                alt={userName}
                className="sidebar-profile-image-layout-dashboard"
              />
            </div>
            <div className="sidebar-user-details-layout-dashboard">
              <span className="sidebar-user-name-layout-dashboard">{userName}</span>
              <span className="sidebar-user-role-layout-dashboard">{getRoleDisplay()}</span>
            </div>
          </div>

          <nav className="sidebar-nav-layout-dashboard">
            {currentMenu.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  handleNavigation(item.path);
                  setSidebarOpen(false);
                }}
                className={`nav-item-layout-dashboard ${isActive(item.path) ? 'active-layout-dashboard' : ''}`}
                disabled={isNavigating}
              >
                <span className="nav-icon-layout-dashboard">{item.icon}</span>
                <span className="nav-label-layout-dashboard">{item.label}</span>
              </button>
            ))}
            
            {/* Settings dropdown in sidebar */}
            <div className="settings-dropdown-wrapper-layout-dashboard" ref={sidebarSettingsDropdownRef}>
              <button
                onClick={() => setSidebarSettingsOpen(!sidebarSettingsOpen)}
                className={`nav-item-layout-dashboard ${isSettingsActive() ? 'active-layout-dashboard' : ''}`}
                disabled={isNavigating}
              >
                <span className="nav-icon-layout-dashboard"><FaCog /></span>
                <span className="nav-label-layout-dashboard">Settings</span>
                <FaChevronDown className={`dropdown-arrow-layout-dashboard ${sidebarSettingsOpen ? 'open-layout-dashboard' : ''}`} />
              </button>
              {sidebarSettingsOpen && (
                <div className="sidebar-dropdown-menu">
                  {settingsSubmenu.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        handleSettingsNavigation(item.path);
                        setSidebarOpen(false);
                      }}
                      className="sidebar-dropdown-item"
                      disabled={isNavigating}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Support dropdown in sidebar */}
            <div className="settings-dropdown-wrapper-layout-dashboard" ref={sidebarSupportDropdownRef}>
              <button
                onClick={() => setSidebarSupportOpen(!sidebarSupportOpen)}
                className={`nav-item-layout-dashboard ${isSupportActive() ? 'active-layout-dashboard' : ''}`}
                disabled={isNavigating}
              >
                <span className="nav-icon-layout-dashboard"><FaHeadset /></span>
                <span className="nav-label-layout-dashboard">Support</span>
                <FaChevronDown className={`dropdown-arrow-layout-dashboard ${sidebarSupportOpen ? 'open-layout-dashboard' : ''}`} />
              </button>
              {sidebarSupportOpen && (
                <div className="sidebar-dropdown-menu">
                  {supportSubmenu.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        handleSupportNavigation(item.path);
                        setSidebarOpen(false);
                      }}
                      className="sidebar-dropdown-item"
                      disabled={isNavigating}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Logout button */}
            <button
              onClick={() => {
                handleLogout();
                setSidebarOpen(false);
              }}
              className="nav-item-layout-dashboard logout-sidebar-btn"
              disabled={isNavigating}
            >
              <span className="nav-icon-layout-dashboard"><FaSignOutAlt /></span>
              <span className="nav-label-layout-dashboard">Logout</span>
            </button>
          </nav>
        </aside>

        <main className="customer-main-content-layout-dashboard">
          <header className="customer-header-layout-dashboard">
            <div className="customer-header-left-layout-dashboard">
              <div className="customer-logo-layout-dashboard">
                {/* Hamburger button INSIDE sidebar for mobile */}
                {isMobile() && (
                  <button 
                    className="mobile-hamburger-btn-sidebar"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <FaBars />
                  </button>
                )}
                <img src={logo} alt="Salfer Engineering" className="customer-logo-img-layout-dashboard" />
                <span className="customer-logo-text-layout-dashboard">Salfer Engineering</span>
              </div>

              {/* Desktop Navigation - Visible on desktop only */}
              <nav className="customer-nav-links-layout-dashboard desktop-nav">
                {currentMenu.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleNavigation(item.path)}
                    className={`customer-nav-link-layout-dashboard ${isActive(item.path) ? 'active-layout-dashboard' : ''}`}
                    disabled={isNavigating}
                  >
                    <span className="customer-nav-link-label-layout-dashboard">{item.label}</span>
                  </button>
                ))}

                {/* Support Dropdown in Header */}
                <div className="settings-dropdown-wrapper-layout-dashboard" ref={supportDropdownRef}>
                  <button
                    onClick={() => setSupportDropdownOpen(!supportDropdownOpen)}
                    className={`customer-nav-link-layout-dashboard settings-dropdown-btn-layout-dashboard ${isSupportActive() ? 'active-layout-dashboard' : ''}`}
                    disabled={isNavigating}
                  >
                    <span className="customer-nav-link-label-layout-dashboard">Support</span>
                    <FaChevronDown className={`dropdown-arrow-layout-dashboard ${supportDropdownOpen ? 'open-layout-dashboard' : ''}`} />
                  </button>

                  {supportDropdownOpen && (
                    <div className="settings-dropdown-menu-layout-dashboard">
                      {supportSubmenu.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => handleSupportNavigation(item.path)}
                          className="settings-dropdown-item-layout-dashboard"
                          disabled={isNavigating}
                        >
                          <span className="dropdown-item-label-layout-dashboard">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Settings Dropdown in Header */}
                <div className="settings-dropdown-wrapper-layout-dashboard" ref={settingsDropdownRef}>
                  <button
                    onClick={() => setSettingsDropdownOpen(!settingsDropdownOpen)}
                    className={`customer-nav-link-layout-dashboard settings-dropdown-btn-layout-dashboard ${isSettingsActive() ? 'active-layout-dashboard' : ''}`}
                    disabled={isNavigating}
                  >
                    <span className="customer-nav-link-label-layout-dashboard">Settings</span>
                    <FaChevronDown className={`dropdown-arrow-layout-dashboard ${settingsDropdownOpen ? 'open-layout-dashboard' : ''}`} />
                  </button>

                  {settingsDropdownOpen && (
                    <div className="settings-dropdown-menu-layout-dashboard">
                      {settingsSubmenu.map((item, index) => (
                        <button
                          key={index}
                          onClick={() => handleSettingsNavigation(item.path)}
                          className="settings-dropdown-item-layout-dashboard"
                          disabled={isNavigating}
                        >
                          <span className="dropdown-item-label-layout-dashboard">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </nav>
            </div>

            <div className="customer-header-right-layout-dashboard">
              {/* Notifications */}
              <div className="notification-wrapper-layout-dashboard" ref={notificationsRef}>
                <button
                  className="notification-btn-layout-dashboard"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  disabled={isNavigating}
                >
                  <FaBell />
                  {unreadCount > 0 && <span className="notification-badge-layout-dashboard">{unreadCount}</span>}
                </button>

                {notificationsOpen && (
                  <div className="notification-dropdown-layout-dashboard">
                    <div className="notification-header-layout-dashboard">
                      <h3>Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="mark-read-layout-dashboard" onClick={markAllAsRead}>
                          Mark all as read
                        </span>
                      )}
                    </div>
                    <div className="notification-list-layout-dashboard">
                      {notifications.length > 0 ? (
                        notifications.map(notif => (
                          <div
                            key={notif.id}
                            className={`notification-item-layout-dashboard ${!notif.read ? 'unread-layout-dashboard' : ''}`}
                            onClick={() => markAsRead(notif.id)}
                          >
                            <p className="notification-message-layout-dashboard">{notif.message}</p>
                            <span className="notification-time-layout-dashboard">{notif.time}</span>
                          </div>
                        ))
                      ) : (
                        <div className="notification-empty-layout-dashboard">
                          <FaBellSolid className="empty-icon-layout-dashboard" />
                          <p>No notifications</p>
                        </div>
                      )}
                    </div>
                    <div className="notification-footer-layout-dashboard">
                      <button onClick={() => handleNavigation('/app/notifications')} disabled={isNavigating}>
                        View all
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile - Desktop only, hidden on mobile */}
              {!isMobile() && (
                <div className="profile-wrapper-layout-dashboard" ref={profileRef}>
                  <div
                    className={`profile-btn-layout-dashboard clickable-profile`}
                    onClick={handleProfileClick}
                  >
                    <img
                      src={userPhoto || profileImage}
                      alt={userName}
                      className="profile-image-layout-dashboard"
                    />
                    <span className="profile-name-layout-dashboard">{userName}</span>
                    <FaChevronDown className={`dropdown-icon-layout-dashboard ${profileOpen ? 'open-layout-dashboard' : ''}`} />
                  </div>

                  {profileOpen && (
                    <div className="profile-dropdown-layout-dashboard">
                      <div className="profile-menu-layout-dashboard">
                        <button onClick={handleLogout} className="dropdown-item-layout-dashboard logout-layout-dashboard" disabled={isNavigating}>
                          <FaSignOutAlt /> Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </header>

          <div className="customer-content-area-layout-dashboard">
            <Outlet />
          </div>
        </main>
      </div>
    );
  }

  // ========== ADMIN/ENGINEER LAYOUT ==========
  return (
    <div className="dashboard-layout-dashboard">
      {/* Mobile Hamburger Button */}
      <button 
        className="mobile-hamburger-btn"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <FaBars />
      </button>

      {sidebarOpen && <div className="sidebar-overlay-layout-dashboard" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar-layout-dashboard ${sidebarOpen ? 'open-layout-dashboard' : ''} ${isAdmin ? 'admin-sidebar-layout-dashboard' : 'engineer-sidebar-layout-dashboard'}`}>
        <div className="sidebar-header-layout-dashboard">
          <div className="logo-container-layout-dashboard">
            <div className="logo-icon-layout-dashboard">
              <img src={logo} alt="Salfer Engineering" className="sidebar-logo-img-layout-dashboard" />
            </div>
            <h1 className="logo-text-layout-dashboard">Salfer Engineering</h1>
          </div>
        </div>

        <div className="user-info-layout-dashboard">
          <div className="user-avatar-layout-dashboard">
            {userPhoto ? (
              <img
                src={userPhoto}
                alt={userName}
                style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <img
                src={profileImage}
                alt="Profile"
                style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
              />
            )}
          </div>
          <div className="user-details-layout-dashboard">
            <span className="user-name-layout-dashboard">{userName}</span>
            <span className="user-role-layout-dashboard">{getRoleDisplay()}</span>
          </div>
        </div>

        <nav className="sidebar-nav-layout-dashboard">
          {currentMenu.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                handleNavigation(item.path);
                if (isMobile()) setSidebarOpen(false);
              }}
              className={`nav-item-layout-dashboard ${isActive(item.path) ? 'active-layout-dashboard' : ''}`}
              disabled={isNavigating}
            >
              <span className="nav-icon-layout-dashboard">{item.icon}</span>
              <span className="nav-label-layout-dashboard">{item.label}</span>
            </button>
          ))}
          <button
            onClick={() => {
              handleLogout();
              if (isMobile()) setSidebarOpen(false);
            }}
            className="nav-item-layout-dashboard logout-sidebar-btn"
            disabled={isNavigating}
          >
            <span className="nav-icon-layout-dashboard"><FaSignOutAlt /></span>
            <span className="nav-label-layout-dashboard">Logout</span>
          </button>
        </nav>
      </aside>

      <main className="main-content-layout-dashboard">
        <header className="dashboard-header-layout-dashboard">
          <div className="header-left-layout-dashboard">
            <div className="breadcrumb-layout-dashboard">
              <FaHome className="breadcrumb-home-icon" />
              {breadcrumbs.map((crumb, index) => (
                <span key={index}>
                  <span className="breadcrumb-separator">/</span>
                  <button
                    className="breadcrumb-link"
                    onClick={() => handleNavigation(crumb.path)}
                  >
                    {crumb.name}
                  </button>
                </span>
              ))}
            </div>
            <div className={`role-badge-layout-dashboard ${getRoleBadgeClass()}`}>
              {getRoleDisplay()}
            </div>
          </div>

          <div className="header-search-layout-dashboard">
            <FaSearch className="search-icon-layout-dashboard" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isNavigating}
            />
          </div>

          <div className="header-right-layout-dashboard">
            <div className="datetime-layout-dashboard">
              <FaRegCalendarAlt className="datetime-icon" />
              <span className="datetime-text">{formatDateTime()}</span>
            </div>

            {isAdmin && maintenanceStatus.isUnderMaintenance && (
              <div className="maintenance-warning">
                <FaTools className="maintenance-icon" />
                <span className="maintenance-text">Maintenance Mode Active</span>
              </div>
            )}

            <div className="header-actions-layout-dashboard">
              <div className="notification-wrapper-layout-dashboard" ref={notificationsRef}>
                <button
                  className="notification-btn-layout-dashboard"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  disabled={isNavigating}
                >
                  <FaBell />
                  {unreadCount > 0 && <span className="notification-badge-red-layout-dashboard">{unreadCount}</span>}
                </button>

                {notificationsOpen && (
                  <div className="notification-dropdown-layout-dashboard">
                    <div className="notification-header-layout-dashboard">
                      <h3>Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="mark-read-layout-dashboard" onClick={markAllAsRead}>
                          Mark all as read
                        </span>
                      )}
                    </div>
                    <div className="notification-list-layout-dashboard">
                      {notifications.map(notif => (
                        <div
                          key={notif.id}
                          className={`notification-item-layout-dashboard ${!notif.read ? 'unread-layout-dashboard' : ''}`}
                          onClick={() => markAsRead(notif.id)}
                        >
                          <p className="notification-message-layout-dashboard">{notif.message}</p>
                          <span className="notification-time-layout-dashboard">{notif.time}</span>
                        </div>
                      ))}
                    </div>
                    <div className="notification-footer-layout-dashboard">
                      <button onClick={() => handleNavigation('/app/notifications')} disabled={isNavigating}>
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="profile-wrapper-layout-dashboard" ref={profileRef}>
                <div className="profile-btn-layout-dashboard">
                  <img
                    src={userPhoto || profileImage}
                    alt={userName}
                    className="profile-image-layout-dashboard"
                  />
                  <span className="profile-name-layout-dashboard">{userName}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="content-area-layout-dashboard">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;