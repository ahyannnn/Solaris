import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FaHeadset
} from 'react-icons/fa';
import '../../styles/Dashboard/dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userRole, setUserRole] = useState('admin');
  const [userName, setUserName] = useState('Admin User');
  const [userPhoto, setUserPhoto] = useState(null); // New state for profile picture
  const [userEmail, setUserEmail] = useState(''); // New state for email

  // Get data from localStorage when dashboard loads
  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');
    const photo = localStorage.getItem('userPhotoURL');
    const email = localStorage.getItem('userEmail');
    
    if (role) {
      setUserRole(role);
    }
    if (name) {
      setUserName(name);
    }
    if (photo) {
      setUserPhoto(photo);
    }
    if (email) {
      setUserEmail(email);
    }
    
    // If no role, redirect to login
    if (!role) {
      navigate('/login');
    }
  }, [navigate]);

  // Mock notifications
  const notifications = [
    { id: 1, message: 'New site assessment scheduled', time: '5 min ago', read: false },
    { id: 2, message: 'Payment received from Client A', time: '1 hour ago', read: false },
    { id: 3, message: 'IoT device offline: Site B', time: '3 hours ago', read: true },
    { id: 4, message: 'Project update: Site C - 75% complete', time: '5 hours ago', read: true },
  ];

  // Role-based menu items
  const menuItems = {
    admin: [
      { icon: <FaTachometerAlt />, label: 'Dashboard', path: '#' },
      { icon: <FaClipboardList />, label: 'Site Assessments', path: '#' },
      { icon: <FaProjectDiagram />, label: 'Projects', path: '#' },
      { icon: <FaFileInvoiceDollar />, label: 'Billing', path: '#' },
      { icon: <FaMicrochip />, label: 'IoT Devices', path: '#' },
      { icon: <FaChartBar />, label: 'Reports', path: '#' },
      { icon: <FaUsers />, label: 'User Management', path: '#' },
      { icon: <FaCog />, label: 'Settings', path: '#' },
    ],
    
    engineer: [
      { icon: <FaTachometerAlt />, label: 'Dashboard', path: '#' },
      { icon: <FaClipboardCheck />, label: 'Site Assessments', path: '#' },
      { icon: <FaProjectDiagram />, label: 'My Projects', path: '#' },
      { icon: <FaMicrochip />, label: 'Device Data', path: '#' },
      { icon: <FaFileAlt />, label: 'Reports', path: '#' },
      { icon: <FaUserCog />, label: 'Profile', path: '#' },
    ],
    
    customer: [
      { icon: <FaTachometerAlt />, label: 'Dashboard', path: '#' },
      { icon: <FaCalendarAlt />, label: 'Schedule Assessment', path: '#' },
      { icon: <FaProjectDiagram />, label: 'My Project', path: '#' },
      { icon: <FaFileInvoice />, label: 'Quotations & Bills', path: '#' },
      { icon: <FaChartLine />, label: 'System Performance', path: '#' },
      { icon: <FaFileAlt />, label: 'Reports', path: '#' },
      { icon: <FaHeadset />, label: 'Support', path: '#' },
      { icon: <FaUserCog />, label: 'Profile', path: '#' },
    ],
  };

  // Get user role display name
  const getRoleDisplay = () => {
    switch(userRole) {
      case 'admin': return 'Administrator';
      case 'engineer': return 'Solar Engineer';
      case 'customer': return 'Customer';
      default: return 'User';
    }
  };

  const currentMenu = menuItems[userRole] || menuItems.admin;
  const unreadCount = notifications.filter(n => !n.read).length;

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userPhotoURL');
    navigate('/login');
  };

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
            {userPhoto ? (
              <img 
                src={userPhoto} 
                alt={userName}
                className="profile-image"
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <FaUserCircle style={{ fontSize: '50px', color: '#4f46e5' }} />
            )}
          </div>
          <div className="user-details">
            <span className="user-name">{userName}</span>
            <span className="user-role">{getRoleDisplay()}</span>
            {userEmail && <span className="user-email" style={{ fontSize: '12px', color: '#94a3b8' }}>{userEmail}</span>}
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
          <button onClick={handleLogout} className="nav-item logout" style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
            <span className="nav-icon"><FaSignOutAlt /></span>
            <span className="nav-label">Logout</span>
          </button>
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
                    <a href="#">View all</a>
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
                {userPhoto ? (
                  <img 
                    src={userPhoto} 
                    alt={userName}
                    className="profile-icon-image"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      marginRight: '8px'
                    }}
                  />
                ) : (
                  <FaUserCircle className="profile-icon" />
                )}
                <span className="profile-name">{userName}</span>
                <FaChevronDown className={`dropdown-icon ${profileOpen ? 'open' : ''}`} />
              </button>

              {profileOpen && (
                <div className="profile-dropdown">
                  <div className="dropdown-user-info" style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
                    {userPhoto ? (
                      <img 
                        src={userPhoto} 
                        alt={userName}
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          marginBottom: '8px'
                        }}
                      />
                    ) : (
                      <FaUserCircle style={{ fontSize: '48px', color: '#4f46e5', marginBottom: '8px' }} />
                    )}
                    <p style={{ fontWeight: 'bold', margin: '0' }}>{userName}</p>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0' }}>{userEmail}</p>
                    <p style={{ fontSize: '12px', color: '#4f46e5', margin: '4px 0 0', textTransform: 'capitalize' }}>{userRole}</p>
                  </div>
                  <a href="#" className="dropdown-item">
                    <FaUserCircle /> Profile
                  </a>
                  <a href="#" className="dropdown-item">
                    <FaCog /> Settings
                  </a>
                  <hr />
                  <button onClick={handleLogout} className="dropdown-item logout" style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
                    <FaSignOutAlt /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="content-area">
          <h1>{userRole.charAt(0).toUpperCase() + userRole.slice(1)} Dashboard</h1>
          <p>Welcome back, {userName}! You are logged in as {userRole}.</p>
          
          {/* Admin Content */}
          {userRole === 'admin' && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-info">
                  <h3>Total Users</h3>
                  <p className="stat-number">156</p>
                </div>
                <FaUsers className="stat-icon" />
              </div>
              <div className="stat-card">
                <div className="stat-info">
                  <h3>Active Sites</h3>
                  <p className="stat-number">23</p>
                </div>
                <FaMapMarkerAlt className="stat-icon" />
              </div>
              <div className="stat-card">
                <div className="stat-info">
                  <h3>IoT Devices</h3>
                  <p className="stat-number">45</p>
                </div>
                <FaMicrochip className="stat-icon" />
              </div>
              <div className="stat-card">
                <div className="stat-info">
                  <h3>Pending Bills</h3>
                  <p className="stat-number">12</p>
                </div>
                <FaFileInvoiceDollar className="stat-icon" />
              </div>
            </div>
          )}
          
          {/* Engineer Content */}
          {userRole === 'engineer' && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-info">
                  <h3>My Assessments</h3>
                  <p className="stat-number">8</p>
                </div>
                <FaClipboardCheck className="stat-icon" />
              </div>
              <div className="stat-card">
                <div className="stat-info">
                  <h3>Active Projects</h3>
                  <p className="stat-number">5</p>
                </div>
                <FaProjectDiagram className="stat-icon" />
              </div>
              <div className="stat-card">
                <div className="stat-info">
                  <h3>Devices Online</h3>
                  <p className="stat-number">12</p>
                </div>
                <FaMicrochip className="stat-icon" />
              </div>
              <div className="stat-card">
                <div className="stat-info">
                  <h3>Reports Due</h3>
                  <p className="stat-number">3</p>
                </div>
                <FaFileAlt className="stat-icon" />
              </div>
            </div>
          )}
          
          {/* Customer Content */}
          {userRole === 'customer' && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-info">
                  <h3>My Project</h3>
                  <p className="stat-number">In Progress</p>
                </div>
                <FaProjectDiagram className="stat-icon" />
              </div>
              <div className="stat-card">
                <div className="stat-info">
                  <h3>Next Bill</h3>
                  <p className="stat-number">₱15,000</p>
                </div>
                <FaFileInvoice className="stat-icon" />
              </div>
              <div className="stat-card">
                <div className="stat-info">
                  <h3>System Performance</h3>
                  <p className="stat-number">98%</p>
                </div>
                <FaChartLine className="stat-icon" />
              </div>
              <div className="stat-card">
                <div className="stat-info">
                  <h3>Support Tickets</h3>
                  <p className="stat-number">1</p>
                </div>
                <FaHeadset className="stat-icon" />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;