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
  FaClipboardList,
  FaProjectDiagram,
  FaFileInvoiceDollar,
  FaClipboardCheck,
  FaCalendarAlt,
  FaHeadset,
  FaHome,
  FaTools,
  FaThLarge,
  FaTasks,
  FaReceipt,
  FaQuestionCircle,
  FaInfoCircle,
  FaBook,
  FaUser,
  FaAddressCard,
  FaExclamationTriangle
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
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [animationState, setAnimationState] = useState('idle'); // idle → animating → contentAnimating → complete

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState('user');
  const [userName, setUserName] = useState('Customer User');
  const [userPhoto, setUserPhoto] = useState(null);

  // PREMIUM ENTRANCE ANIMATION SEQUENCE - Sabay ang sidebar at header
  useEffect(() => {
    // Use requestAnimationFrame to ensure layout is painted
    requestAnimationFrame(() => {
      // Step 1: Dashboard mounts silently
      // Step 2 & 3: Sidebar AND Header start simultaneously
      setAnimationState('animating');

      // Step 4 & 5: Content appears after both animations complete
      const totalDuration = 1000; // 1000ms for sidebar + header
      
      setTimeout(() => {
        setAnimationState('contentAnimating');
        
        // After content fade-in completes (500-700ms)
        setTimeout(() => {
          setAnimationState('complete');
        }, 600);
      }, totalDuration + 100); // Small buffer after animations
    });

    return () => {};
  }, []);

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
          title: 'Billing & Quotations',
          description: 'View your invoices, quotations, payment history, and manage your billing information.'
        };
      }
      if (currentPath === '/app/customer/notifications') {
        return {
          title: 'Notifications',
          description: 'Stay updated with the latest alerts and updates about your solar projects.'
        };
      }
      if (currentPath === '/app/customer/settings' || currentPath.startsWith('/app/customer/settings?')) {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        const titles = {
          'profile': 'Profile',
          'addresses': 'Addresses'
        };
        const descriptions = {
          'profile': 'Manage your personal profile information.',
          'addresses': 'Manage your saved addresses.'
        };
        return {
          title: titles[tab] || 'Settings',
          description: descriptions[tab] || 'Manage your profile and preferences.'
        };
      }
      if (currentPath === '/app/customer/support' || currentPath.startsWith('/app/customer/support?')) {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        const titles = {
          'faq': 'FAQs',
          'info': 'Contact Information',
          'guides': 'User Guides'
        };
        const descriptions = {
          'faq': 'Find answers to commonly asked questions about our services.',
          'info': 'Get in touch with us through our contact details.',
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
          title: 'Billing & Quotations',
          description: 'Oversee all customer billing, invoices, quotations, and payment transactions.'
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

  // Categorized menu items
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
            { icon: <FaUser />, label: 'Profile', path: '/app/engineer/profile' },
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
            { icon: <FaReceipt />, label: 'Billing', path: '/app/customer/billing' },
          ]
        },
        {
          title: 'Support',
          icon: <FaHeadset />,
          items: [
            { icon: <FaQuestionCircle />, label: 'FAQs', path: '/app/customer/support?tab=faq' },
            { icon: <FaInfoCircle />, label: 'Contact Info', path: '/app/customer/support?tab=info' },
            { icon: <FaBook />, label: 'Guides', path: '/app/customer/support?tab=guides' },
          ]
        },
        {
          title: 'Settings',
          icon: <FaCog />,
          items: [
            { icon: <FaUser />, label: 'Profile', path: '/app/customer/settings?tab=profile' },
            { icon: <FaAddressCard />, label: 'Addresses', path: '/app/customer/settings?tab=addresses' },
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

  // Handle user authentication
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

    fetchUnreadCount();

    if (!initialized && location.pathname === '/app') {
      setInitialized(true);
      // Use requestAnimationFrame for immediate navigation
      requestAnimationFrame(() => {
        if (role === 'user') {
          navigate('/app/customer', { replace: true });
        } else if (role === 'engineer') {
          navigate('/app/engineer', { replace: true });
        } else if (role === 'admin') {
          navigate('/app/admin', { replace: true });
        }
      });
    } else {
      setInitialized(true);
    }
  }, [navigate, location.pathname, initialized, isNavigating]);

  // Poll for unread count
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
    const currentSearch = location.search;
    const fullPath = currentPath + currentSearch;

    if (fullPath === itemPath) return true;

    if (!itemPath.includes('?')) {
      const isDashboardPath = itemPath === '/app/admin' ||
        itemPath === '/app/engineer' ||
        itemPath === '/app/customer';

      if (isDashboardPath) {
        return currentPath === itemPath;
      }

      if (currentPath.startsWith(itemPath) && currentPath !== itemPath) {
        const nextChar = currentPath[itemPath.length];
        if (!nextChar || nextChar === '/') {
          return true;
        }
      }
    }

    return false;
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    setShowLogoutModal(false);
    localStorage.clear();
    sessionStorage.clear();
    setTimeout(() => {
      navigate('/');
    }, 100);
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleNavigation = (path) => {
    if (isNavigating) return;
    setIsNavigating(true);
    navigate(path);
    if (isMobile()) {
      setSidebarOpen(false);
    }
    setTimeout(() => setIsNavigating(false), 300);
  };

  // Determine if content should be visible
  const isContentVisible = animationState === 'contentAnimating' || animationState === 'complete';
  const isAnimating = animationState === 'animating';
  const isAnimationComplete = animationState === 'complete';

  return (
    <div className={`dashboard-layout-dashboard ${animationState !== 'idle' ? 'dashboard-mounted' : ''}`}>
      {/* Mobile Hamburger Button - Hidden during initial animation */}
      {animationState !== 'idle' && (
        <button
          className="mobile-hamburger-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <FaBars />
        </button>
      )}

      {sidebarOpen && <div className="sidebar-overlay-layout-dashboard" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar - Slides from LEFT with premium easing */}
      <aside 
        className={`sidebar-layout-dashboard 
          ${sidebarOpen ? 'open-layout-dashboard' : ''} 
          ${isAnimating ? 'sidebar-entering' : ''}
          ${isAnimationComplete ? 'sidebar-entered' : ''}
        `}
      >
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
              </div>
            </div>
          ))}

          <div className="sidebar-spacer-layout-dashboard"></div>

          <button
            onClick={handleLogoutClick}
            className="nav-item-layout-dashboard logout-sidebar-btn"
            disabled={isNavigating}
          >
            <span className="nav-icon-layout-dashboard"><FaSignOutAlt /></span>
            <span className="nav-label-layout-dashboard">Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`main-content-layout-dashboard`}>
        {/* Header - Slides from TOP - Sabay sa sidebar */}
        <header className={`dashboard-header-layout-dashboard 
          ${isAnimating ? 'header-sliding' : ''} 
          ${isAnimationComplete ? 'header-entered' : ''}
          ${isContentVisible ? 'header-visible' : ''}
        `}>
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

        {/* Content Area - Fades in with slight upward motion */}
        <div className={`content-area-layout-dashboard ${isContentVisible ? 'content-visible' : 'content-hidden'}`}>
          <Outlet />
        </div>
      </main>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="logout-modal-overlay" onClick={cancelLogout}>
          <div className="logout-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="logout-modal-icon">
              <FaExclamationTriangle />
            </div>
            <h2 className="logout-modal-title">Confirm Logout</h2>
            <p className="logout-modal-message">Are you sure you want to logout?</p>
            <p className="logout-modal-sub-message">You will need to login again to access your account.</p>
            <div className="logout-modal-actions">
              <button
                className="logout-modal-btn logout-modal-btn-cancel"
                onClick={cancelLogout}
              >
                Cancel
              </button>
              <button
                className="logout-modal-btn logout-modal-btn-confirm"
                onClick={confirmLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;