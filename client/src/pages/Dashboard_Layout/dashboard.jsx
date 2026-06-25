// pages/Dashboard_Layout/dashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import axios from 'axios';
import {
  FaTachometerAlt,
  FaUsers,
  FaMicrochip,
  FaChartBar,
  FaCog,
  FaBell,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaChevronDown,
  FaClipboardList,
  FaProjectDiagram,
  FaFileInvoiceDollar,
  FaClipboardCheck,
  FaCalendarAlt,
  FaHeadset,
  FaHome,
  FaTools,
  FaSearch,
  FaRegCalendarAlt,
  FaSun
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

  const settingsDropdownRef = useRef(null);
  const supportDropdownRef = useRef(null);
  const sidebarSettingsDropdownRef = useRef(null);
  const sidebarSupportDropdownRef = useRef(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      { icon: <FaClipboardList />, label: 'Schedule', path: '/app/engineer/schedule' },
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

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
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
    setSettingsDropdownOpen(false);
    setSupportDropdownOpen(false);
    setSidebarSettingsOpen(false);
    setSidebarSupportOpen(false);

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

  // Get page title from pathname
  const getPageTitle = () => {
    const path = location.pathname;
    const segments = path.split('/').filter(x => x);
    
    const filtered = segments.filter(s => 
      s !== 'app' && s !== 'customer' && s !== 'admin' && s !== 'engineer'
    );
    
    if (filtered.length === 0) return 'Dashboard';
    
    const title = filtered[filtered.length - 1];
    return title.charAt(0).toUpperCase() + title.slice(1).replace(/-/g, ' ');
  };

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

      {/* SIDEBAR - Solar Theme */}
      <aside className={`sidebar-layout-dashboard ${sidebarOpen ? 'open-layout-dashboard' : ''}`}>
        <div className="sidebar-header-layout-dashboard">
          <div className="logo-container-layout-dashboard">
            <div className="logo-icon-layout-dashboard">
              <img src={logo} alt="Salfer Engineering" className="sidebar-logo-img-layout-dashboard" />
            </div>
            <h1 className="logo-text-layout-dashboard">
              <FaSun className="logo-sun-icon" />
              Salfer Engineering
            </h1>
          </div>
          <button 
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
          >
            <FaTimes />
          </button>
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
          
          {/* Settings dropdown */}
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
                      if (isMobile()) setSidebarOpen(false);
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

          {/* Support dropdown */}
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
                      if (isMobile()) setSidebarOpen(false);
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

          {/* Notifications */}
          <button
            onClick={() => {
              handleNavigation('/app/notifications');
              if (isMobile()) setSidebarOpen(false);
            }}
            className="nav-item-layout-dashboard"
            disabled={isNavigating}
          >
            <span className="nav-icon-layout-dashboard">
              <FaBell />
              {unreadCount > 0 && <span className="sidebar-notification-badge">{unreadCount}</span>}
            </span>
            <span className="nav-label-layout-dashboard">Notifications</span>
          </button>

          {/* Logout - at the bottom */}
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

      {/* MAIN CONTENT */}
      <main className="main-content-layout-dashboard">
        {/* HEADER */}
        <header className="dashboard-header-layout-dashboard">
          <div className="header-left-layout-dashboard">
            <h1 className="page-title-layout-dashboard">{getPageTitle()}</h1>
            {!isCustomer && (
              <div className={`role-badge-layout-dashboard ${getRoleBadgeClass()}`}>
                {getRoleDisplay()}
              </div>
            )}
            {isAdmin && maintenanceStatus.isUnderMaintenance && (
              <div className="maintenance-warning">
                <FaTools className="maintenance-icon" />
                <span className="maintenance-text">Maintenance Mode</span>
              </div>
            )}
          </div>

          <div className="header-right-layout-dashboard">
            {/* Search */}
            <div className="header-search-wrapper">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isNavigating}
                className="header-search-input"
              />
              <button className="search-btn-layout-dashboard">
                <FaSearch />
              </button>
            </div>

            {/* Calendar - Admin/Engineer only */}
            {!isCustomer && (
              <div className="datetime-layout-dashboard">
                <FaRegCalendarAlt className="datetime-icon" />
                <span className="datetime-text">{formatDateTime()}</span>
              </div>
            )}

            {/* Profile with Name - Rectangular rounded border */}
            <div className="profile-wrapper-layout-dashboard">
              <div className="profile-btn-layout-dashboard static-profile">
                <img
                  src={userPhoto || profileImage}
                  alt={userName}
                  className="profile-image-layout-dashboard"
                />
                <span className="profile-name-layout-dashboard">{userName}</span>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="content-area-layout-dashboard">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;