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
  FaThLarge,
  FaTasks
} from 'react-icons/fa';
import logo from '../../assets/Salfare_Logo.png';
import profileImage from '../../assets/profile.png';
import '../../styles/Dashboard/dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [initialized, setInitialized] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [maintenanceStatus, setMaintenanceStatus] = useState({ isUnderMaintenance: false, title: '' });
  const [unreadCount, setUnreadCount] = useState(0);

  const sidebarSettingsDropdownRef = useRef(null);
  const sidebarSupportDropdownRef = useRef(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarSettingsOpen, setSidebarSettingsOpen] = useState(false);
  const [sidebarSupportOpen, setSidebarSupportOpen] = useState(false);
  const [userRole, setUserRole] = useState('user');
  const [userName, setUserName] = useState('Customer User');
  const [userPhoto, setUserPhoto] = useState(null);

  // Fetch unread notification count
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Support submenu
  const supportSubmenu = [
    { label: 'FAQs', path: '/app/customer/support?tab=faq' },
    { label: 'Contact Form', path: '/app/customer/support?tab=contact' },
    { label: 'Contact Info', path: '/app/customer/support?tab=info' },
    { label: 'Tickets', path: '/app/customer/support?tab=tickets' },
    { label: 'Guides', path: '/app/customer/support?tab=guides' },
  ];

  // Settings submenu
  const settingsSubmenu = [
    { label: 'Profile', path: '/app/customer/settings?tab=profile' },
    { label: 'Addresses', path: '/app/customer/settings?tab=addresses' },
  ];

  // Page titles and descriptions based on role and path
  const getPageInfo = () => {
    const currentPath = location.pathname;
    const role = userRole;

    // Customer Pages
    if (role === 'user') {
      if (currentPath === '/app/customer') {
        return {
          title: 'Dashboard',
          description: 'Welcome back! Here\'s an overview of your solar projects and account status.'
        };
      }
      if (currentPath === '/app/customer/project') {
        return {
          title: 'My Projects',
          description: 'View and manage all your solar installation projects in one place.'
        };
      }
      if (currentPath === '/app/customer/book-assessment') {
        return {
          title: 'Book Assessment',
          description: 'Schedule a professional solar assessment for your property.'
        };
      }
      if (currentPath === '/app/customer/billing') {
        return {
          title: 'Billing',
          description: 'View your invoices, payment history, and manage your billing information.'
        };
      }
      if (currentPath === '/app/customer/notifications') {
        return {
          title: 'Notifications',
          description: 'Stay updated with the latest alerts and updates about your solar projects.'
        };
      }
      if (currentPath === '/app/customer/settings' || currentPath.startsWith('/app/customer/settings?')) {
        return {
          title: 'Settings',
          description: 'Manage your profile, addresses, and account preferences.'
        };
      }
      if (currentPath === '/app/customer/support' || currentPath.startsWith('/app/customer/support?')) {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        const titles = {
          'faq': 'FAQs',
          'contact': 'Contact Form',
          'info': 'Contact Information',
          'tickets': 'Support Tickets',
          'guides': 'User Guides'
        };
        const descriptions = {
          'faq': 'Find answers to commonly asked questions about our services.',
          'contact': 'Send us a message and we\'ll get back to you as soon as possible.',
          'info': 'Get in touch with us through our contact details.',
          'tickets': 'View and manage your support tickets.',
          'guides': 'Access helpful guides and resources.'
        };
        return {
          title: titles[tab] || 'Support',
          description: descriptions[tab] || 'Get help and support.'
        };
      }
    }

    // Engineer Pages
    if (role === 'engineer') {
      if (currentPath === '/app/engineer') {
        return {
          title: 'Dashboard',
          description: 'Welcome! Here\'s your engineering overview and assigned tasks.'
        };
      }
      if (currentPath === '/app/engineer/assessment') {
        return {
          title: 'My Assessments',
          description: 'View and manage all your assigned site assessments and evaluations.'
        };
      }
      if (currentPath === '/app/engineer/project') {
        return {
          title: 'My Projects',
          description: 'Track and manage your ongoing and completed solar projects.'
        };
      }
      if (currentPath === '/app/engineer/device') {
        return {
          title: 'Device Data',
          description: 'Monitor IoT device performance and analyze data from installations.'
        };
      }
      if (currentPath === '/app/engineer/schedule') {
        return {
          title: 'Schedule',
          description: 'View your work schedule, appointments, and site visit calendar.'
        };
      }
      if (currentPath === '/app/engineer/notifications') {
        return {
          title: 'Notifications',
          description: 'Stay updated with task assignments and project updates.'
        };
      }
    }

    // Admin Pages
    if (role === 'admin') {
      if (currentPath === '/app/admin') {
        return {
          title: 'Dashboard',
          description: 'Welcome back! Here\'s your administrative overview and system status.'
        };
      }
      if (currentPath === '/app/admin/siteassessment') {
        return {
          title: 'Site Assessments',
          description: 'Manage all site assessment requests, schedules, and technician assignments.'
        };
      }
      if (currentPath === '/app/admin/project') {
        return {
          title: 'Projects',
          description: 'Oversee all solar installation projects from start to completion.'
        };
      }
      if (currentPath === '/app/admin/iotdevice') {
        return {
          title: 'IoT Devices',
          description: 'Manage and monitor all IoT devices across all customer installations.'
        };
      }
      if (currentPath === '/app/admin/usermanagement') {
        return {
          title: 'User Management',
          description: 'Manage user accounts, roles, and permissions across the platform.'
        };
      }
      if (currentPath === '/app/admin/billing') {
        return {
          title: 'Billing',
          description: 'Oversee all customer billing, invoices, and payment transactions.'
        };
      }
      if (currentPath === '/app/admin/reports') {
        return {
          title: 'Reports',
          description: 'Generate and view comprehensive reports on system performance and analytics.'
        };
      }
      if (currentPath === '/app/admin/schedule') {
        return {
          title: 'Schedule',
          description: 'Manage appointments, site visits, and team schedules.'
        };
      }
      if (currentPath === '/app/admin/maintenance') {
        return {
          title: 'Maintenance',
          description: 'Manage system maintenance tasks and monitor service status.'
        };
      }
      if (currentPath === '/app/admin/notifications') {
        return {
          title: 'Notifications',
          description: 'Monitor system alerts, user activities, and important updates.'
        };
      }
      if (currentPath === '/app/admin/settings') {
        return {
          title: 'Settings',
          description: 'Configure system settings and manage application preferences.'
        };
      }
    }

    // Default fallback
    return {
      title: 'Dashboard',
      description: 'Welcome to your dashboard.'
    };
  };

  const pageInfo = getPageInfo();

  // Categorized menu items - NOTIFICATIONS NOW IN ITS OWN SECTION
  const menuItems = {
    admin: {
      sections: [
        {
          title: 'Main Navigation',
          icon: <FaThLarge />,
          items: [
            { icon: <FaTachometerAlt />, label: 'Dashboard', path: '/app/admin' },
            { icon: <FaClipboardList />, label: 'Site Assessments', path: '/app/admin/siteassessment' },
            { icon: <FaProjectDiagram />, label: 'Projects', path: '/app/admin/project' },
            { icon: <FaMicrochip />, label: 'IoT Devices', path: '/app/admin/iotdevice' },
          ]
        },
        {
          title: 'Management',
          icon: <FaTasks />,
          items: [
            { icon: <FaUsers />, label: 'User Management', path: '/app/admin/usermanagement' },
            { icon: <FaFileInvoiceDollar />, label: 'Billing', path: '/app/admin/billing' },
            { icon: <FaChartBar />, label: 'Reports', path: '/app/admin/reports' },
            { icon: <FaCalendarAlt />, label: 'Schedule', path: '/app/admin/schedule' },
            { icon: <FaTools />, label: 'Maintenance', path: '/app/admin/maintenance' },
            { icon: <FaCog />, label: 'Settings', path: '/app/admin/settings' },
          ]
        },
        {
          title: 'Notifications',
          icon: <FaBell />,
          items: [
            { icon: <FaBell />, label: 'Notifications', path: '/app/admin/notifications', badge: true },
          ]
        }
      ]
    },

    engineer: {
      sections: [
        {
          title: 'Main Navigation',
          icon: <FaThLarge />,
          items: [
            { icon: <FaTachometerAlt />, label: 'Dashboard', path: '/app/engineer' },
            { icon: <FaClipboardCheck />, label: 'My Assessments', path: '/app/engineer/assessment' },
            { icon: <FaProjectDiagram />, label: 'My Projects', path: '/app/engineer/project' },
          ]
        },
        {
          title: 'Management',
          icon: <FaTasks />,
          items: [
            { icon: <FaMicrochip />, label: 'Device Data', path: '/app/engineer/device' },
            { icon: <FaCalendarAlt />, label: 'Schedule', path: '/app/engineer/schedule' },
          ]
        },
        {
          title: 'Notifications',
          icon: <FaBell />,
          items: [
            { icon: <FaBell />, label: 'Notifications', path: '/app/engineer/notifications', badge: true },
          ]
        }
      ]
    },

    user: {
      sections: [
        {
          title: 'Main Navigation',
          icon: <FaThLarge />,
          items: [
            { icon: <FaHome />, label: 'Dashboard', path: '/app/customer' },
            { icon: <FaProjectDiagram />, label: 'My Project', path: '/app/customer/project' },
            { icon: <FaCalendarAlt />, label: 'Book Assessment', path: '/app/customer/book-assessment' },
          ]
        },
        {
          title: 'Management',
          icon: <FaTasks />,
          items: [
            { icon: <FaFileInvoiceDollar />, label: 'Billing', path: '/app/customer/billing' },
          ]
        },
        {
          title: 'Notifications',
          icon: <FaBell />,
          items: [
            { icon: <FaBell />, label: 'Notifications', path: '/app/customer/notifications', badge: true },
          ]
        }
      ]
    }
  };

  const isCustomer = userRole === 'user';
  const isAdmin = userRole === 'admin';
  const isEngineer = userRole === 'engineer';
  const isMobile = () => window.innerWidth <= 768;

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
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
      if (window.innerWidth > 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle user authentication and fetch unread count
  useEffect(() => {
    if (initialized || isNavigating) return;

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const role = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');
    const name = localStorage.getItem('userName') || sessionStorage.getItem('userName');
    const photo = localStorage.getItem('userPhotoURL') || sessionStorage.getItem('userPhotoURL');

    if (role) setUserRole(role);
    if (name) setUserName(name);
    if (photo) setUserPhoto(photo);

    if (!token || !role) {
      setIsNavigating(true);
      navigate('/login');
      return;
    }

    // Fetch unread count after authentication
    fetchUnreadCount();

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

  // Poll for unread count updates every 30 seconds
  useEffect(() => {
    if (!initialized) return;

    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [initialized]);

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

  const currentMenu = menuItems[userRole] || menuItems.admin;

  const isActive = (itemPath) => {
    const currentPath = location.pathname;
    
    if (currentPath === itemPath) return true;
    
    const isDashboardPath = itemPath === '/app/admin' || 
                            itemPath === '/app/engineer' || 
                            itemPath === '/app/customer';
    
    if (!isDashboardPath && currentPath.startsWith(itemPath + '/')) {
      return true;
    }
    
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
    setSidebarSettingsOpen(false);
    if (isMobile()) setSidebarOpen(false);
    setTimeout(() => setIsNavigating(false), 500);
  };

  const handleSupportNavigation = (path) => {
    if (isNavigating) return;
    setIsNavigating(true);
    navigate(path);
    setSidebarSupportOpen(false);
    if (isMobile()) setSidebarOpen(false);
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
    setSidebarSettingsOpen(false);
    setSidebarSupportOpen(false);
    setTimeout(() => setIsNavigating(false), 500);
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

      {/* Sidebar */}
      <aside className={`sidebar-layout-dashboard ${sidebarOpen ? 'open-layout-dashboard' : ''}`}>
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

        <nav className="sidebar-nav-layout-dashboard">
          {/* NOW 3 CATEGORIES with Notifications as separate section */}
          {currentMenu.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="sidebar-section-layout-dashboard">
              <div className="sidebar-section-header-layout-dashboard">
                <span className="sidebar-section-icon-layout-dashboard">{section.icon}</span>
                <span className="sidebar-section-title-layout-dashboard">{section.title}</span>
              </div>
              <div className="sidebar-section-items-layout-dashboard">
                {section.items.map((item, itemIndex) => (
                  <button
                    key={itemIndex}
                    onClick={() => {
                      handleNavigation(item.path);
                      if (isMobile()) setSidebarOpen(false);
                    }}
                    className={`nav-item-layout-dashboard ${isActive(item.path) ? 'active-layout-dashboard' : ''}`}
                    disabled={isNavigating}
                  >
                    <span className="nav-icon-layout-dashboard">{item.icon}</span>
                    <span className="nav-label-layout-dashboard">{item.label}</span>
                    {item.badge && unreadCount > 0 && (
                      <span className="notification-badge-sidebar">{unreadCount}</span>
                    )}
                  </button>
                ))}
                
                {/* Settings Dropdown - Only for Customer */}
                {isCustomer && section.title === 'Management' && (
                  <div className="dropdown-wrapper-sidebar-layout-dashboard" ref={sidebarSettingsDropdownRef}>
                    <button
                      onClick={() => setSidebarSettingsOpen(!sidebarSettingsOpen)}
                      className={`nav-item-layout-dashboard ${isSettingsActive() ? 'active-layout-dashboard' : ''}`}
                      disabled={isNavigating}
                    >
                      <span className="nav-icon-layout-dashboard"><FaCog /></span>
                      <span className="nav-label-layout-dashboard">Settings</span>
                      <FaChevronDown className={`dropdown-arrow-sidebar-layout-dashboard ${sidebarSettingsOpen ? 'open-layout-dashboard' : ''}`} />
                    </button>
                    {sidebarSettingsOpen && (
                      <div className="sidebar-dropdown-menu-layout-dashboard">
                        {settingsSubmenu.map((item, index) => (
                          <button
                            key={index}
                            onClick={() => handleSettingsNavigation(item.path)}
                            className="sidebar-dropdown-item-layout-dashboard"
                            disabled={isNavigating}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Support Dropdown - Only for Customer */}
                {isCustomer && section.title === 'Management' && (
                  <div className="dropdown-wrapper-sidebar-layout-dashboard" ref={sidebarSupportDropdownRef}>
                    <button
                      onClick={() => setSidebarSupportOpen(!sidebarSupportOpen)}
                      className={`nav-item-layout-dashboard ${isSupportActive() ? 'active-layout-dashboard' : ''}`}
                      disabled={isNavigating}
                    >
                      <span className="nav-icon-layout-dashboard"><FaHeadset /></span>
                      <span className="nav-label-layout-dashboard">Support</span>
                      <FaChevronDown className={`dropdown-arrow-sidebar-layout-dashboard ${sidebarSupportOpen ? 'open-layout-dashboard' : ''}`} />
                    </button>
                    {sidebarSupportOpen && (
                      <div className="sidebar-dropdown-menu-layout-dashboard">
                        {supportSubmenu.map((item, index) => (
                          <button
                            key={index}
                            onClick={() => handleSupportNavigation(item.path)}
                            className="sidebar-dropdown-item-layout-dashboard"
                            disabled={isNavigating}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* SPACER to push logout to bottom */}
          <div className="sidebar-spacer-layout-dashboard"></div>

          {/* Logout button at bottom */}
          <button
            onClick={handleLogout}
            className="nav-item-layout-dashboard logout-sidebar-btn"
            disabled={isNavigating}
          >
            <span className="nav-icon-layout-dashboard"><FaSignOutAlt /></span>
            <span className="nav-label-layout-dashboard">Logout</span>
          </button>
        </nav>
      </aside>

      <main className="main-content-layout-dashboard">
        {/* Header with Page Title and Description */}
        <header className="dashboard-header-layout-dashboard">
          <div className="header-left-layout-dashboard">
            <div className="page-header-info-layout-dashboard">
              <h1 className="page-title-layout-dashboard">{pageInfo.title}</h1>
              <p className="page-description-layout-dashboard">{pageInfo.description}</p>
            </div>
          </div>

          <div className="header-right-layout-dashboard">
            {isAdmin && maintenanceStatus.isUnderMaintenance && (
              <div className="maintenance-warning">
                <FaTools className="maintenance-icon" />
                <span className="maintenance-text">Maintenance Mode Active</span>
              </div>
            )}

            <div className="header-user-info-layout-dashboard">
              <img
                src={userPhoto || profileImage}
                alt={userName}
                className="header-profile-image-layout-dashboard"
              />
              <span className="header-user-name-layout-dashboard">{userName}</span>
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