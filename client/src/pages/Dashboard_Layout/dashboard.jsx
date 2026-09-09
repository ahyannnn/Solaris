// pages/Dashboard_Layout/dashboard.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  FaExclamationTriangle,
  FaChevronDown,
  FaChevronUp,
  FaChevronRight,
  FaChevronLeft,
  FaLifeRing,
  FaUserCog,
  FaCheckCircle,
  FaClock,
  FaBell as FaBellSolid,
  FaInfoCircle as FaInfoIcon,
  FaExclamationCircle,
  FaTimes as FaTimesIcon,
  FaBullhorn,
  FaMoon,
  FaSun
} from 'react-icons/fa';
import logo from '../../assets/Salfare_Logo.png';
import '../../styles/Dashboard/dashboard.css';
import socketService from '../../services/socketService';
import { useToastContext } from '../../context/ToastContext';

// Helper to reliably get current authenticated user ID
const getAuthUserId = () => {
  let userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
  if (userId) return userId;

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) {
    try {
      const base64Url = token.split('.')[1];
      if (base64Url) {
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const decoded = JSON.parse(jsonPayload);
        if (decoded.id) {
          userId = decoded.id;
          sessionStorage.setItem('userId', userId);
          return userId;
        }
      }
    } catch (e) {
      console.warn('Could not decode token for userId', e);
    }
  }
  return null;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotificationToast } = useToastContext();
  const [initialized, setInitialized] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [maintenanceStatus, setMaintenanceStatus] = useState({ isUnderMaintenance: false, title: '' });
  const [unreadCount, setUnreadCount] = useState(0);
  // Red-dot action alerts (customer only): book needs accept-action,
  // billing has pending payable.
  const [bookNeedsAction, setBookNeedsAction] = useState(false);
  const [billingPending, setBillingPending] = useState(false);
  // Admin sidebar badges: items waiting on admin action (view-only excluded).
  // Site Assessments = approve/reject, verify payments, assign engineer,
  // process refund, pending free quotes. Billing = verify payments, draft
  // invoices to send, invoices/bank transfers to verify.
  const [siteActionCount, setSiteActionCount] = useState(0);
  const [billingActionCount, setBillingActionCount] = useState(0);
  const [projectActionCount, setProjectActionCount] = useState(0);
  // Engineer sidebar badge: my projects waiting on my update (start/update).
  const [engineerProjectCount, setEngineerProjectCount] = useState(0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [dashboardReady, setDashboardReady] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notificationRef = useRef(null);
  const buttonRef = useRef(null);
  // Mobile stacked sheet: null | 'main' | 'settings' | 'support'
  // (mirrors mobile PremiumProfileMenu -> Settings/Support modals)
  const [mobileSheetView, setMobileSheetView] = useState(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState('user');
  const [userName, setUserName] = useState('Customer User');
  const [userPhoto, setUserPhoto] = useState(() =>
    localStorage.getItem('userPhotoURL') || sessionStorage.getItem('userPhotoURL') || ''
  );
  
  // Dark mode state - initialize from localStorage
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Dropdown states
  const [openDropdowns, setOpenDropdowns] = useState({
    support: false,
    settingsSub: false
  });

  // Apply dark mode class to body when darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  // OPTIMIZED: Set dashboard as ready immediately
  useEffect(() => {
    requestAnimationFrame(() => {
      setDashboardReady(true);
    });
    return () => { };
  }, []);

  // Auto-open dropdowns based on current path
  useEffect(() => {
    const currentPath = location.pathname;
    
    const isInSupport = currentPath.includes('/app/customer/support');
    const isInSettings = currentPath.includes('/app/customer/settings');
    
    if (isInSupport || isInSettings) {
      setOpenDropdowns(prev => ({
        ...prev,
        support: isInSupport,
        settingsSub: isInSettings
      }));
    }
  }, [location]);

  // Handle click outside notification popover
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowNotifications(false);
        setMobileSheetView(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
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

  // Fetch red-dot action alerts (customer only, mirrors page predicates):
  // Book = quotation ready to accept; Billing = pending payable.
  // Stable identity (role via ref) so socket handlers never go stale.
  const userRoleRef = useRef(userRole);
  userRoleRef.current = userRole;
  const fetchActionAlerts = useCallback(async () => {
    if (userRoleRef.current !== 'user') return;
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };
      const base = import.meta.env.VITE_API_URL;
      const [quotesRes, assessmentsRes, invoicesRes] = await Promise.all([
        axios.get(`${base}/api/free-quotes/my-quotes`, { headers }),
        axios.get(`${base}/api/pre-assessments/my-bookings`, { headers }),
        axios.get(`${base}/api/solar-invoices/my-invoices`, { headers }),
      ]);

      const quotes = quotesRes.data?.quotes || [];
      const assessments = assessmentsRes.data?.assessments || [];
      const invoices = invoicesRes.data?.invoices || [];

      const needsAction =
        assessments.some((a) => a?.assessmentStatus === 'quotation_generated') ||
        quotes.some((q) => (q?.quotationFile || q?.quotationUrl) && q?.status !== 'accepted');

      // Billable assessments only — mirrors the billing screens, which list
      // an assessment only once it has an invoice (never while pending
      // review). Otherwise bookings awaiting review would wrongly light the
      // dot since their paymentStatus is already 'pending'.
      const billableAssessments = assessments.filter((a) =>
        a?.invoiceNumber != null && a?.assessmentStatus !== 'pending_review'
      );
      // Resolved = paid/verified/cancelled/refunded/failed (mirrors billing:
      // cancelled and refund-flow bookings are never payable again).
      const isPayableAssessment = (a) => {
        if (!a || a.assessmentStatus === 'cancelled') return false;
        return !['paid', 'for_verification', 'cancelled', 'failed', 'refund_pending', 'refunded', 'no_refund'].includes(a?.paymentStatus);
      };

      const pendingPayable =
        billableAssessments.some((a) => isPayableAssessment(a)) ||
        invoices.some((inv) => inv?.paymentStatus === 'pending' && (inv?.balance ?? 1) > 0);

      setBookNeedsAction(needsAction);
      setBillingPending(pendingPayable);
    } catch (error) {
      console.error('Error fetching action alerts:', error);
    }
  }, []);

  // Fetch admin sidebar action counts (admin only):
  // number badges = items waiting on admin action (view-only excluded).
  const fetchSidebarActionCounts = useCallback(async () => {
    if (userRoleRef.current !== 'admin') return;
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/maintenance/action-counts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSiteActionCount(response.data?.total || 0);
      setBillingActionCount(response.data?.billing?.total || 0);
      setProjectActionCount(response.data?.projects?.total || 0);
    } catch (error) {
      console.error('Error fetching sidebar action counts:', error);
    }
  }, []);

  // Fetch engineer project action counts (engineer only):
  // my projects where it's my turn (start/update), view-only excluded.
  const fetchEngineerActionCounts = useCallback(async () => {
    if (userRoleRef.current !== 'engineer') return;
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects/engineer/action-counts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEngineerProjectCount(response.data?.total || 0);
    } catch (error) {
      console.error('Error fetching engineer action counts:', error);
    }
  }, []);

  // Fetch notifications for popover
  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 3 }
      });
      
      // Process notifications - ensure read status is properly set
      const processedNotifications = (response.data.notifications || []).map(notif => ({
        ...notif,
        isRead: notif.read === true || notif.isRead === true,
        read: notif.read === true || notif.isRead === true
      }));
      
      setNotifications(processedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Toggle notification popover, except customer mobile which goes straight
  // to the notifications page (mirrors mobile _navigateToNotifications).
  // Staff keep the popover since they keep the sidebar drawer.
  const toggleNotifications = () => {
    if (userRole === 'user' && isMobile()) {
      handleNavigation(getNotificationsPath());
      return;
    }
    if (!showNotifications) {
      fetchNotifications();
    }
    setShowNotifications(!showNotifications);
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) return;

      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state - mark as read
      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId ? { ...n, isRead: true, read: true } : n
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) return;

      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/notifications/read-all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state - mark all as read
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true, read: true }))
      );
      
      // Update unread count
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (notification) => {
    const type = notification.type || notification.notificationType || '';
    const isBroadcast = notification.isAdminBroadcast === true;
    
    if (isBroadcast) {
      return <FaBullhorn className="notif-icon-broadcast" />;
    }
    
    switch(type) {
      case 'payment':
      case 'Payment':
      case 'payment_success':
        return <FaCheckCircle className="notif-icon-payment" />;
      case 'project':
      case 'Project':
      case 'project_update':
        return <FaProjectDiagram className="notif-icon-project" />;
      case 'assessment':
      case 'Assessment':
      case 'site_assessment':
        return <FaClipboardList className="notif-icon-assessment" />;
      case 'schedule':
      case 'Schedule':
      case 'appointment':
        return <FaCalendarAlt className="notif-icon-schedule" />;
      case 'info':
        return <FaInfoIcon className="notif-icon-info" />;
      case 'warning':
        return <FaExclamationCircle className="notif-icon-warning" />;
      case 'error':
        return <FaTimesIcon className="notif-icon-error" />;
      case 'success':
        return <FaCheckCircle className="notif-icon-success" />;
      default:
        return <FaBellSolid className="notif-icon-default" />;
    }
  };

  // Get notification icon background class
  const getIconBgClass = (notification) => {
    const type = notification.type || notification.notificationType || '';
    const isBroadcast = notification.isAdminBroadcast === true;
    
    if (isBroadcast) return 'icon-bg-broadcast';
    
    switch(type) {
      case 'payment':
      case 'Payment':
      case 'payment_success':
        return 'icon-bg-success';
      case 'project':
      case 'Project':
      case 'project_update':
        return 'icon-bg-info';
      case 'assessment':
      case 'Assessment':
      case 'site_assessment':
        return 'icon-bg-assessment';
      case 'schedule':
      case 'Schedule':
      case 'appointment':
        return 'icon-bg-warning';
      case 'info':
        return 'icon-bg-info';
      case 'warning':
        return 'icon-bg-warning';
      case 'error':
        return 'icon-bg-error';
      case 'success':
        return 'icon-bg-success';
      default:
        return 'icon-bg-default';
    }
  };

  // Get time ago string
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffMonth / 12);

    if (diffYear > 0) return `${diffYear}y`;
    if (diffMonth > 0) return `${diffMonth}m`;
    if (diffDay > 0) return diffDay === 1 ? '1d' : `${diffDay}d`;
    if (diffHour > 0) return `${diffHour}h`;
    if (diffMin > 0) return `${diffMin}m`;
    return 'Just now';
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
      if (currentPath === '/app/customer/my-requests') {
        return {
          title: 'My Requests',
          description: 'Track your additional service requests and their status.'
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
          'guides': 'User Guides',
          'services': 'Services'
        };
        const descriptions = {
          'faq': 'Find answers to commonly asked questions about our services.',
          'info': 'Get in touch with us through our contact details.',
          'guides': 'Access helpful guides and resources.',
          'services': 'Avail additional services — we will contact you.'
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
      if (currentPath === '/app/admin/services') {
        return {
          title: 'Services',
          description: 'View who availed additional services and contact them.'
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

  // Profile / Addresses / FAQs / Contact Info / Guides / Notifications act as
  // pushed full screens on customer mobile (like the mobile app): dashboard
  // header + bottom nav hidden, each page's own back button returns.
  // Admin/Engineer keep the sidebar drawer on mobile, so no fullscreen.
  const isFullScreenPage = userRole === 'user' && (
    location.pathname.endsWith('/notifications') ||
    location.pathname === '/app/customer/settings' ||
    location.pathname === '/app/customer/support'
  );

  // Get user initials from name
  const getUserInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    const firstInitial = parts[0].charAt(0).toUpperCase();
    const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
    return firstInitial + lastInitial;
  };

  // Toggle dropdown - only toggle dropdown, not navigation
  const toggleDropdown = (key, e) => {
    if (e) {
      e.stopPropagation();
    }
    setOpenDropdowns(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Handle navigation for dropdown items
  const handleDropdownItemClick = (path) => {
    handleNavigation(path);
  };

  // Menu items
  const menuItems = {
    admin: {
      sections: [
        {
          key: 'main',
          title: 'Main Navigation',
          icon: <FaThLarge />,
          isDropdown: false,
          items: [
            { icon: <FaTachometerAlt />, label: 'Dashboard', path: '/app/admin' },
            { icon: <FaClipboardList />, label: 'Site Assessments', path: '/app/admin/siteassessment', actionCountKey: 'siteAssessments' },
            { icon: <FaFileInvoiceDollar />, label: 'Billing', path: '/app/admin/billing', actionCountKey: 'billing' },
            { icon: <FaProjectDiagram />, label: 'Projects', path: '/app/admin/project', actionCountKey: 'projects' },
            { icon: <FaMicrochip />, label: 'IoT Devices', path: '/app/admin/iotdevice' },
          ]
        },
        {
          key: 'management',
          title: 'Management',
          icon: <FaTasks />,
          isDropdown: false,
          items: [
            { icon: <FaUsers />, label: 'User Management', path: '/app/admin/usermanagement' },
            { icon: <FaChartBar />, label: 'Reports', path: '/app/admin/reports' },
            { icon: <FaCalendarAlt />, label: 'Schedule', path: '/app/admin/schedule' },
            { icon: <FaTools />, label: 'Maintenance', path: '/app/admin/maintenance' },
            { icon: <FaHeadset />, label: 'Services', path: '/app/admin/services' },
          ]
        },
        {
          key: 'notifications',
          title: 'Notifications',
          icon: <FaBell />,
          isDropdown: false,
          items: [
            { icon: <FaBell />, label: 'Notifications', path: '/app/admin/notifications', badge: true },
          ]
        }
      ]
    },

    engineer: {
      sections: [
        {
          key: 'main',
          title: 'Main Navigation',
          icon: <FaThLarge />,
          isDropdown: false,
          items: [
            { icon: <FaTachometerAlt />, label: 'Dashboard', path: '/app/engineer' },
            { icon: <FaClipboardCheck />, label: 'My Assessments', path: '/app/engineer/assessment' },
            { icon: <FaProjectDiagram />, label: 'My Projects', path: '/app/engineer/project', actionCountKey: 'engineerProjects' },
          ]
        },
        {
          key: 'management',
          title: 'Management',
          icon: <FaTasks />,
          isDropdown: false,
          items: [
            { icon: <FaMicrochip />, label: 'Device Data', path: '/app/engineer/device' },
            { icon: <FaCalendarAlt />, label: 'Schedule', path: '/app/engineer/schedule' },
          ]
        },
        {
          key: 'notifications',
          title: 'Notifications',
          icon: <FaBell />,
          isDropdown: false,
          items: [
            { icon: <FaBell />, label: 'Notifications', path: '/app/engineer/notifications', badge: true },
          ]
        }
      ]
    },

    user: {
      sections: [
        {
          key: 'main',
          title: 'Main Navigation',
          icon: <FaThLarge />,
          isDropdown: false,
          items: [
            { icon: <FaHome />, label: 'Dashboard', path: '/app/customer' },
            { icon: <FaCalendarAlt />, label: 'Book Assessment', shortLabel: 'Book', path: '/app/customer/book-assessment' },
            { icon: <FaProjectDiagram />, label: 'My Project', path: '/app/customer/project' },
            { icon: <FaReceipt />, label: 'Billing', path: '/app/customer/billing' },
          ]
        },
        {
          key: 'settings',
          title: 'Settings',
          icon: <FaCog />,
          isDropdown: false,
          isNested: true,
          items: [
            {
              type: 'dropdown',
              key: 'support',
              icon: <FaLifeRing />,
              label: 'Support',
              isDropdown: true,
              path: '/app/customer/support',
              items: [
                { icon: <FaQuestionCircle />, label: 'FAQs', path: '/app/customer/support?tab=faq' },
                { icon: <FaInfoCircle />, label: 'Contact Info', path: '/app/customer/support?tab=info' },
                { icon: <FaBook />, label: 'Guides', path: '/app/customer/support?tab=guides' },
                { icon: <FaTools />, label: 'Services', path: '/app/customer/support?tab=services' },
              ]
            },
            {
              type: 'dropdown',
              key: 'settingsSub',
              icon: <FaUserCog />,
              label: 'Settings',
              isDropdown: true,
              path: '/app/customer/settings',
              items: [
                { icon: <FaUser />, label: 'Profile', path: '/app/customer/settings?tab=profile' },
                { icon: <FaAddressCard />, label: 'Addresses', path: '/app/customer/settings?tab=addresses' },
              ]
            }
          ]
        },
        {
          key: 'notifications',
          title: 'Notifications',
          icon: <FaBell />,
          isDropdown: false,
          items: [
            { icon: <FaBell />, label: 'Notifications', path: '/app/customer/notifications', badge: true },
          ]
        }
      ]
    }
  };

  const isAdmin = userRole === 'admin';
  const isEngineer = userRole === 'engineer';
  const isCustomer = userRole === 'user';
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

    if (role) setUserRole(role);
    if (name) setUserName(name);

    if (!token || !role) {
      setIsNavigating(true);
      navigate('/login');
      return;
    }

    fetchUnreadCount();

    if (!initialized && location.pathname === '/app') {
      setInitialized(true);
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

  // Connect real-time socket and listen for notifications
  useEffect(() => {
    const userId = getAuthUserId();
    if (!userId) return;

    const storedRole = localStorage.getItem('userRole') || sessionStorage.getItem('userRole') || userRoleRef.current;
    socketService.connect(userId, storedRole);

    const handleNewNotification = (data) => {
      console.log('🔔 [DashboardLayout] Real-time notification received:', data);
      const notification = data?.notification || data;
      if (!notification) return;

      // 1. Update unread count immediately in real time
      setUnreadCount((prev) => prev + 1);

      // 1b. Billing/assessment/quotation changes arrive as notifications —
      // refresh the red-dot flags instantly instead of waiting for the poll.
      fetchActionAlerts();

      // 2. Update notifications list for popover
      const processedNotif = {
        ...notification,
        isRead: false,
        read: false,
      };
      setNotifications((prev) => [processedNotif, ...prev.slice(0, 2)]);

      // 3. Show stackable toast immediately in real time
      showNotificationToast(processedNotif);
    };

    const handleNotificationRead = (data) => {
      const notifId = data?.notificationId;
      if (!notifId) return;

      setNotifications((prev) =>
        prev.map((n) => (n._id === notifId ? { ...n, isRead: true, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    const handleReadAll = () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, read: true })));
      setUnreadCount(0);
    };

    const handleNotificationDeleted = (data) => {
      const notifId = data?.notificationId;
      if (!notifId) return;

      setNotifications((prev) => prev.filter((n) => n._id !== notifId));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    socketService.on('notification:new', handleNewNotification);
    socketService.on('notification:read', handleNotificationRead);
    socketService.on('notifications:readAll', handleReadAll);
    socketService.on('notification:deleted', handleNotificationDeleted);

    // Pre-assessment / free-quote / invoice / bank-transfer / project changes
    // affect the admin sidebar badges — refresh instantly instead of waiting.
    // Project changes also refresh the engineer badge.
    const handleTableChanged = (data) => {
      if (['pre-assessments', 'free-quotes', 'bank-transfers', 'solar-invoices', 'projects'].includes(data?.entity)) {
        fetchSidebarActionCounts();
        fetchEngineerActionCounts();
      }
    };
    socketService.on('table:changed', handleTableChanged);

    return () => {
      socketService.off('notification:new', handleNewNotification);
      socketService.off('notification:read', handleNotificationRead);
      socketService.off('notifications:readAll', handleReadAll);
      socketService.off('notification:deleted', handleNotificationDeleted);
      socketService.off('table:changed', handleTableChanged);
    };
  }, [showNotificationToast, fetchActionAlerts, fetchSidebarActionCounts, fetchEngineerActionCounts]);

  // Poll for unread count as fallback
  useEffect(() => {
    if (!initialized) return;

    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [initialized]);

  // Poll red-dot action alerts as fallback (customer only)
  useEffect(() => {
    if (!initialized || userRole !== 'user') return;

    fetchActionAlerts();
    const interval = setInterval(fetchActionAlerts, 30000);
    return () => clearInterval(interval);
  }, [initialized, userRole, fetchActionAlerts]);

  // Poll admin sidebar action counts as fallback (admin only)
  useEffect(() => {
    if (!initialized || userRole !== 'admin') return;

    fetchSidebarActionCounts();
    const interval = setInterval(fetchSidebarActionCounts, 30000);
    return () => clearInterval(interval);
  }, [initialized, userRole, fetchSidebarActionCounts]);

  // Poll engineer project action counts as fallback (engineer only)
  useEffect(() => {
    if (!initialized || userRole !== 'engineer') return;

    fetchEngineerActionCounts();
    const interval = setInterval(fetchEngineerActionCounts, 30000);
    return () => clearInterval(interval);
  }, [initialized, userRole, fetchEngineerActionCounts]);

  // Refresh profile photo (Google users get theirs at login via storage;
  // customers refresh from clients/me, staff from auth/me — so an admin-set
  // photo appears without re-login).
  useEffect(() => {
    if (!initialized || !userRole) return;

    (async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) return;
        const endpoint = userRole === 'user' ? '/api/clients/me' : '/api/auth/me';
        const res = await axios.get(`${import.meta.env.VITE_API_URL}${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const url = res.data?.client?.photoURL || res.data?.photoURL || '';
        setUserPhoto(url);
        if (url) sessionStorage.setItem('userPhotoURL', url);
        else sessionStorage.removeItem('userPhotoURL');
      } catch {
        // Keep storage fallback (initials when empty)
      }
    })();
  }, [initialized, userRole]);

  // Instant header photo refresh right after Settings save (same tab).
  useEffect(() => {
    const onPhotoUpdated = (e) => {
      setUserPhoto(e?.detail || sessionStorage.getItem('userPhotoURL') || '');
    };
    window.addEventListener('user-photo-updated', onPhotoUpdated);
    return () => window.removeEventListener('user-photo-updated', onPhotoUpdated);
  }, []);

  // Refresh alert flags immediately after in-app navigation (e.g. back
  // from paying a bill or requesting an assessment) — no waiting for poll.
  useEffect(() => {
    if (!initialized || userRole !== 'user') return;

    fetchActionAlerts();
  }, [location.pathname, initialized, userRole, fetchActionAlerts]);

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

  // ---- Mobile bottom nav model (mirrors mobile dashboard_layout.dart) ----
  // Customer: 4 main tabs. Admin/Engineer: first 4 + the rest in profile menu.
  const mobileBottomNavItems = (() => {
    const sections = currentMenu.sections || [];
    const main = sections.find((s) => s.key === 'main');
    if (userRole === 'engineer') {
      const mgmt = sections.find((s) => s.key === 'management');
      return [...(main?.items || []), ...((mgmt?.items || []).slice(0, 1))].slice(0, 4);
    }
    return (main?.items || []).slice(0, 4);
  })();

  // Items NOT in the bottom pill — reachable via the mobile profile menu
  const mobileOverflowNavItems = (() => {
    const sections = currentMenu.sections || [];
    const pillPaths = new Set(mobileBottomNavItems.map((i) => i.path));
    const items = [];
    sections.forEach((s) => {
      if (s.key === 'main' || s.isNested) return;
      (s.items || []).forEach((i) => { if (!pillPaths.has(i.path)) items.push(i); });
    });
    if (userRole === 'engineer') {
      const mgmt = sections.find((s) => s.key === 'management');
      (mgmt?.items || []).slice(1).forEach((i) => { if (!pillPaths.has(i.path)) items.push(i); });
    }
    return items;
  })();

  // Customer Settings/Support submenus (mirrors mobile _settingsSubmenu/_supportSubmenu)
  const customerSettingsSection = (menuItems.user.sections || []).find((s) => s.key === 'settings');
  const customerSupportDropdown = (customerSettingsSection?.items || []).find((d) => d.key === 'support');
  const customerSettingsDropdown = (customerSettingsSection?.items || []).find((d) => d.key === 'settingsSub');

  // Check if a path is active
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

  // Find which sidebar item is active (for the header section indicator)
  const getActiveSidebarItem = () => {
    const sections = currentMenu.sections || [];
    for (const section of sections) {
      for (const item of section.items || []) {
        if (item.items) {
          const sub = item.items.find((subItem) => subItem.path && isActive(subItem.path));
          if (sub) return sub;
        }
        if (item.path && isActive(item.path)) return item;
      }
    }
    return null;
  };

  const activeSidebarItem = getActiveSidebarItem();

  // Check if a dropdown button should be highlighted
  const isDropdownActive = (item) => {
    if (!item || !item.items) return false;
    
    return item.items.some(subItem => isActive(subItem.path));
  };

  const handleLogoutClick = () => {
    setMobileSheetView(null);
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    setShowLogoutModal(false);
    socketService.disconnect();
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
    setShowNotifications(false);
    setMobileSheetView(null);
    navigate(path);
    if (isMobile()) {
      setSidebarOpen(false);
    }
    setTimeout(() => setIsNavigating(false), 300);
  };

  const closeSidebar = () => {
    if (isMobile()) {
      setSidebarOpen(false);
    }
  };

  // Get notifications page path based on role
  const getNotificationsPath = () => {
    const paths = {
      admin: '/app/admin/notifications',
      engineer: '/app/engineer/notifications',
      user: '/app/customer/notifications'
    };
    return paths[userRole] || '/app/customer/notifications';
  };

  // Clicking a notification only marks it as read — no redirection.
  // Use "View All Notifications" (or the Notifications page) to navigate.
  const handleNotificationClick = (notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
  };

  return (
    <div className={`dashboard-layout-dashboard role-${userRole} ${dashboardReady ? 'dashboard-ready' : ''} ${isFullScreenPage ? 'on-fullscreen-page' : ''}`}>
      {/* Hamburger (staff mobile only — customer uses the bottom nav) */}
      {!isCustomer && (
        <button
          className={`mobile-hamburger-btn ${sidebarOpen ? 'hidden' : ''}`}
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
      )}

      {/* Sidebar Overlay */}
      <div
        className={`sidebar-overlay-layout-dashboard ${sidebarOpen ? 'visible' : ''}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`sidebar-layout-dashboard ${sidebarOpen ? 'open-layout-dashboard' : ''}`}>
        <div className="sidebar-header-layout-dashboard">
          <div className="logo-container-layout-dashboard">
            <div className="logo-icon-layout-dashboard">
              <img src={logo} alt="Salfer Engineering" className="sidebar-logo-img-layout-dashboard" />
            </div>
            <h1 className="logo-text-layout-dashboard">Salfer Engineering</h1>
          </div>
        </div>

        <nav className="sidebar-nav-layout-dashboard">
          {currentMenu.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="sidebar-section-layout-dashboard">
              {/* Section Header */}
              <div className="sidebar-section-header-layout-dashboard">
                <span className="sidebar-section-icon-layout-dashboard">{section.icon}</span>
                <span className="sidebar-section-title-layout-dashboard">{section.title}</span>
              </div>
              
              {/* Section Items */}
              <div className="sidebar-section-items-layout-dashboard">
                {section.isNested ? (
                  section.items.map((item, itemIndex) => {
                    if (item.type === 'dropdown') {
                      const isDropdownOpen = openDropdowns[item.key] || false;
                      const isDropdownHighlighted = isDropdownActive(item);
                      
                      return (
                        <div key={itemIndex} className="sidebar-dropdown-wrapper">
                          <button
                            className={`nav-item-layout-dashboard ${isDropdownHighlighted ? 'active-layout-dashboard' : ''}`}
                            onClick={(e) => toggleDropdown(item.key, e)}
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              width: '100%',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0.8rem 1rem 0.8rem 0.75rem',
                              borderRadius: 'var(--radius-md)',
                              color: isDropdownHighlighted ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                              backgroundColor: isDropdownHighlighted ? 'var(--sidebar-active)' : 'transparent',
                              fontFamily: 'var(--font-family)',
                              fontSize: '0.92rem',
                              fontWeight: '500'
                            }}
                          >
                            <span className="nav-icon-layout-dashboard">{item.icon}</span>
                            <span className="nav-label-layout-dashboard">{item.label}</span>
                            <span className="sidebar-section-arrow-layout-dashboard">
                              {isDropdownOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                            </span>
                          </button>
                          
                          <div className={`dropdown-items-wrapper ${isDropdownOpen ? 'open' : 'closed'}`}>
                            {item.items.map((subItem, subIndex) => (
                              <button
                                key={subIndex}
                                onClick={() => {
                                  handleDropdownItemClick(subItem.path);
                                  if (isMobile()) setSidebarOpen(false);
                                }}
                                className={`nav-item-layout-dashboard sub-item ${isActive(subItem.path) ? 'active-layout-dashboard' : ''}`}
                                disabled={isNavigating}
                                style={{ paddingLeft: '2.5rem' }}
                              >
                                <span className="nav-icon-layout-dashboard">{subItem.icon}</span>
                                <span className="nav-label-layout-dashboard">{subItem.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })
                ) : (
                  section.items.map((item, itemIndex) => (
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
                      {item.actionCountKey === 'siteAssessments' && siteActionCount > 0 && (
                        <span className="notification-badge-sidebar">{siteActionCount > 99 ? '99+' : siteActionCount}</span>
                      )}
                      {item.actionCountKey === 'billing' && billingActionCount > 0 && (
                        <span className="notification-badge-sidebar">{billingActionCount > 99 ? '99+' : billingActionCount}</span>
                      )}
                      {item.actionCountKey === 'projects' && projectActionCount > 0 && (
                        <span className="notification-badge-sidebar">{projectActionCount > 99 ? '99+' : projectActionCount}</span>
                      )}
                      {item.actionCountKey === 'engineerProjects' && engineerProjectCount > 0 && (
                        <span className="notification-badge-sidebar">{engineerProjectCount > 99 ? '99+' : engineerProjectCount}</span>
                      )}
                      {((item.path === '/app/customer/book-assessment' && bookNeedsAction) ||
                        (item.path === '/app/customer/billing' && billingPending)) && (
                        <span className="nav-alert-dot" aria-label="Action needed" />
                      )}
                    </button>
                  ))
                )}
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
      <main className="main-content-layout-dashboard">
        {/* Header */}
        <header className="dashboard-header-layout-dashboard">
          <div className="header-left-layout-dashboard">
            <div className="page-header-info-layout-dashboard">
              <div className="page-title-row-layout-dashboard">
                <h1 className="page-title-layout-dashboard">{pageInfo.title}</h1>
                {/* Customer mobile only: title arrow opens the stacked sheet modals */}
                {isCustomer && (
                  <button
                    className="page-title-chevron-btn"
                    onClick={() => setMobileSheetView('main')}
                    aria-label="Open menu"
                  >
                    <FaChevronRight size={16} />
                  </button>
                )}
              </div>
              <p className="page-description-layout-dashboard">{pageInfo.description}</p>
              {!isCustomer && activeSidebarItem && (
                <span className="header-active-section-layout-dashboard">{activeSidebarItem.label}</span>
              )}
            </div>
          </div>

          <div className="header-right-layout-dashboard">
            {isAdmin && maintenanceStatus.isUnderMaintenance && (
              <div className="maintenance-warning">
                <FaTools className="maintenance-icon" />
                <span className="maintenance-text">Maintenance Mode Active</span>
              </div>
            )}

            {/* Dark Mode Toggle Button */}
            <button
              className="dark-mode-toggle-btn"
              onClick={toggleDarkMode}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <FaSun className="dark-mode-icon" /> : <FaMoon className="dark-mode-icon" />}
            </button>

            {/* Notification Button */}
            <div className="notification-wrapper">
              <button 
                ref={buttonRef}
                className={`notification-btn ${showNotifications ? 'active' : ''} ${unreadCount > 0 ? 'has-unread' : ''}`}
                onClick={toggleNotifications}
                aria-label="Notifications"
              >
                <FaBell />
                {unreadCount > 0 && (
                  <span className="notification-badge-header">{unreadCount}</span>
                )}
              </button>

              {/* Notification Popover */}
              {showNotifications && (
                <div className="notification-popover" ref={notificationRef}>
                  <div className="notification-popover-header">
                    <h3>Notifications</h3>
                    {unreadCount > 0 && (
                      <button 
                        className="mark-all-read-btn"
                        onClick={markAllAsRead}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="notification-popover-body">
                    {loadingNotifications ? (
                      <div className="notif-loading">
                        <FaBell className="loading-icon" />
                        <span>Loading notifications...</span>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="notif-empty">
                        <FaBell className="empty-icon" />
                        <span>No notifications yet</span>
                        <p>We'll notify you when something happens</p>
                      </div>
                    ) : (
                      <>
                        {notifications.slice(0, 3).map((notif) => {
                          const isUnread = !notif.isRead;
                          
                          return (
                            <div 
                              key={notif._id} 
                              className={`notif-item ${isUnread ? 'unread' : 'read'}`}
                              onClick={() => handleNotificationClick(notif)}
                            >
                              <div className={`notif-icon ${getIconBgClass(notif)}`}>
                                {getNotificationIcon(notif)}
                              </div>
                              <div className="notif-content">
                                <div className="notif-title">{notif.title || 'Notification'}</div>
                                <div className="notif-message">{notif.message}</div>
                                <div className="notif-time">
                                  <FaClock className="time-icon" />
                                  {getTimeAgo(notif.createdAt)}
                                </div>
                              </div>
                              {isUnread && (
                                <div className="notif-unread-dot"></div>
                              )}
                            </div>
                          );
                        })}

                        {notifications.length > 3 && (
                          <div className="notif-view-all">
                            <button 
                              className="view-all-btn"
                              onClick={() => handleNavigation(getNotificationsPath())}
                            >
                              View All Notifications
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Static user pill (not clickable) */}
            <div className="header-user-info-layout-dashboard">
              {userPhoto ? (
                <img
                  src={userPhoto}
                  alt=""
                  className="header-user-photo-img"
                  onError={() => setUserPhoto('')}
                />
              ) : (
                <div className="header-user-initials-avatar">
                  {getUserInitials(userName)}
                </div>
              )}
              <span className="header-user-name-layout-dashboard">{userName}</span>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="content-area-layout-dashboard">
          <Outlet />
        </div>
      </main>

      {/* Customer mobile bottom floating nav (mirrors mobile PremiumFloatingBottomNav).
          Staff keep the hamburger + sidebar drawer. */}
      {isCustomer && (
      <nav className="mobile-bottom-nav-layout-dashboard" aria-label="Mobile navigation">
        <div className="mobile-bottom-nav-pill">
          {mobileBottomNavItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                className={`mobile-bottom-nav-item ${active ? 'active' : ''}`}
                onClick={() => handleNavigation(item.path)}
                disabled={isNavigating}
                aria-label={item.label}
              >
                {/* Dashboard uses the grid icon like mobile (dashboard_outlined);
                    Book shows its short label — bottom nav only, sidebar keeps full items */}
                <span className="mobile-bottom-nav-icon">
                  {item.path === '/app/customer' ? <FaThLarge /> : item.icon}
                </span>
                {active && <span className="mobile-bottom-nav-label">{item.shortLabel || item.label}</span>}
                {item.badge && unreadCount > 0 && (
                  <span className="notification-badge-sidebar floating">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
                {((item.path === '/app/customer/book-assessment' && bookNeedsAction) ||
                  (item.path === '/app/customer/billing' && billingPending)) && (
                  <span className="nav-alert-dot floating" aria-label="Action needed" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
      )}

      {/* Mobile stacked sheet modals
          (mirrors mobile PremiumProfileMenu -> PremiumSettingsModal/PremiumSupportModal) */}
      {mobileSheetView && (
        <div className="mobile-sheet-overlay" onClick={() => setMobileSheetView(null)}>
          <div className="mobile-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-sheet-handle" />

            {mobileSheetView === 'main' && (
              <>
                <div className="mobile-sheet-profile">
                  {userPhoto ? (
                    <img
                      src={userPhoto}
                      alt=""
                      className="header-user-photo-img large"
                      onError={() => setUserPhoto('')}
                    />
                  ) : (
                    <div className="header-user-initials-avatar large">
                      {getUserInitials(userName)}
                    </div>
                  )}
                  <div className="mobile-sheet-meta">
                    <strong>{userName}</strong>
                      <span>{userRole === 'admin' ? 'Administrator' : userRole === 'engineer' ? 'Engineer' : 'Customer'}</span>
                    </div>
                  </div>
                {userRole === 'user' ? (
                  <>
                    <button className="mobile-sheet-item" onClick={() => setMobileSheetView('settings')} disabled={isNavigating}>
                      <span className="mobile-sheet-icon"><FaUserCog /></span>Settings
                      <FaChevronRight size={14} className="mobile-sheet-chevron" />
                    </button>
                    <button className="mobile-sheet-item" onClick={() => setMobileSheetView('support')} disabled={isNavigating}>
                      <span className="mobile-sheet-icon"><FaLifeRing /></span>Support
                      <FaChevronRight size={14} className="mobile-sheet-chevron" />
                    </button>
                  </>
                ) : (
                  <>
                    {mobileOverflowNavItems.length > 0 && (
                      <>
                        <div className="mobile-sheet-section">More</div>
                        {mobileOverflowNavItems.map((item) => (
                          <button key={item.path} className={`mobile-sheet-item ${isActive(item.path) ? 'active' : ''}`} onClick={() => handleNavigation(item.path)} disabled={isNavigating}>
                            <span className="mobile-sheet-icon">{item.icon}</span>{item.label}
                            {item.badge && unreadCount > 0 && (
                              <span className="notification-badge-sidebar">{unreadCount}</span>
                            )}
                          </button>
                        ))}
                      </>
                    )}
                  </>
                )}
                <div className="mobile-sheet-divider" />
                <button className="mobile-sheet-item logout" onClick={handleLogoutClick} disabled={isNavigating}>
                  <span className="mobile-sheet-icon"><FaSignOutAlt /></span>Logout
                </button>
              </>
            )}

            {mobileSheetView === 'settings' && (
              <>
                <div className="mobile-sheet-titlebar">
                  <button className="mobile-sheet-back" onClick={() => setMobileSheetView('main')} aria-label="Back">
                    <FaChevronLeft size={14} />
                  </button>
                  <span className="mobile-sheet-title">Settings</span>
                </div>
                {(customerSettingsDropdown?.items || []).map((s) => (
                  <button key={s.path} className="mobile-sheet-item" onClick={() => handleDropdownItemClick(s.path)} disabled={isNavigating}>
                    <span className="mobile-sheet-icon">{s.icon}</span>{s.label}
                    <FaChevronRight size={14} className="mobile-sheet-chevron" />
                  </button>
                ))}
              </>
            )}

            {mobileSheetView === 'support' && (
              <>
                <div className="mobile-sheet-titlebar">
                  <button className="mobile-sheet-back" onClick={() => setMobileSheetView('main')} aria-label="Back">
                    <FaChevronLeft size={14} />
                  </button>
                  <span className="mobile-sheet-title">Support</span>
                </div>
                {(customerSupportDropdown?.items || []).map((s) => (
                  <button key={s.path} className="mobile-sheet-item" onClick={() => handleDropdownItemClick(s.path)} disabled={isNavigating}>
                    <span className="mobile-sheet-icon">{s.icon}</span>{s.label}
                    <FaChevronRight size={14} className="mobile-sheet-chevron" />
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="logout-modal-overlay" onClick={cancelLogout}>
          <div className="logout-modal-container" onClick={(e) => e.stopPropagation()}>
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