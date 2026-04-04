// pages/Admin/Maintenance.admain.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { 
  FaTools, 
  FaSave, 
  FaHistory,
  FaPlus,
  FaTrash,
  FaSpinner,
  FaCheckCircle,
  FaClock,
  FaPowerOff,
  FaPlay,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import '../../styles/Admin/maintenance.css';

const MaintenancePanel = () => {
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [settings, setSettings] = useState({
    title: 'Under Maintenance',
    message: 'We are currently performing scheduled maintenance. Please check back soon.',
    estimatedDuration: '2 hours',
    scheduledStart: null,
    scheduledEnd: null,
    showCountdown: true,
    showProgressBar: true,
    contactEmail: 'support@salferengineering.com',
    contactPhone: '+63 XXX XXX XXXX',
    allowedIPs: [],
    allowedRoles: ['admin'],
    whitelistedRoutes: ['/api/auth/login', '/api/auth/register', '/api/maintenance/status'],
    socialLinks: {
      facebook: '',
      twitter: '',
      instagram: ''
    }
  });
  const [newIP, setNewIP] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMaintenanceData();
    fetchHistory();
  }, []);

  const fetchMaintenanceData = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/maintenance/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsEnabled(response.data.isUnderMaintenance);
      setSettings({
        ...settings,
        title: response.data.title,
        message: response.data.message,
        estimatedDuration: response.data.estimatedDuration,
        scheduledStart: response.data.scheduledStart,
        scheduledEnd: response.data.scheduledEnd,
        showCountdown: response.data.showCountdown,
        showProgressBar: response.data.showProgressBar,
        contactEmail: response.data.contactEmail,
        contactPhone: response.data.contactPhone,
        allowedIPs: response.data.allowedIPs || [],
        socialLinks: response.data.socialLinks || {}
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching maintenance data:', error);
      showToast('Failed to load maintenance data', 'error');
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/maintenance/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(response.data.history || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleToggleMaintenance = async () => {
    setIsToggling(true);
    try {
      const token = sessionStorage.getItem('token');
      
      if (!isEnabled) {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/maintenance/enable`, 
          { 
            title: settings.title, 
            message: settings.message, 
            estimatedDuration: settings.estimatedDuration,
            showCountdown: settings.showCountdown,
            showProgressBar: settings.showProgressBar
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showToast('Maintenance mode enabled', 'success');
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/maintenance/disable`, {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showToast('Maintenance mode disabled', 'success');
      }
      
      setIsEnabled(!isEnabled);
      await fetchMaintenanceData();
      await fetchHistory();
      
    } catch (error) {
      console.error('Error toggling maintenance:', error);
      showToast(error.response?.data?.message || 'Failed to toggle maintenance mode', 'error');
    } finally {
      setIsToggling(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(`${import.meta.env.VITE_API_URL}/api/maintenance/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('Settings saved successfully', 'success');
      if (isEnabled) {
        await fetchMaintenanceData();
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('Failed to save settings', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddIP = async () => {
    if (!newIP) return;
    
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/maintenance/add-ip`, 
        { ip: newIP },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast('IP address added', 'success');
      setNewIP('');
      fetchMaintenanceData();
    } catch (error) {
      console.error('Error adding IP:', error);
      showToast('Failed to add IP', 'error');
    }
  };

  const handleRemoveIP = async (ip) => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/maintenance/remove-ip/${ip}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('IP address removed', 'success');
      fetchMaintenanceData();
    } catch (error) {
      console.error('Error removing IP:', error);
      showToast('Failed to remove IP', 'error');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  // Skeleton Loader Component
  const SkeletonLoader = () => (
    <div className="maintenance-panel-admain">
      <div className="panel-header-admain">
        <div className="skeleton-line-admain large-admain"></div>
        <div className="skeleton-line-admain medium-admain"></div>
      </div>
      
      {/* Toggle Card Skeleton */}
      <div className="toggle-card-admain skeleton-card-admain">
        <div className="toggle-info-admain">
          <div className="skeleton-line-admain medium-admain"></div>
          <div className="skeleton-line-admain small-admain"></div>
          <div className="skeleton-badge-admain"></div>
        </div>
        <div className="skeleton-button-admain"></div>
      </div>
      
      {/* Settings Card Skeleton */}
      <div className="settings-card-admain skeleton-card-admain">
        <div className="skeleton-line-admain medium-admain"></div>
        <div className="skeleton-input-admain"></div>
        <div className="skeleton-input-admain"></div>
        <div className="skeleton-input-admain"></div>
        <div className="skeleton-button-admain"></div>
      </div>
      
      {/* IPs Card Skeleton */}
      <div className="ips-card-admain skeleton-card-admain">
        <div className="skeleton-line-admain medium-admain"></div>
        <div className="skeleton-input-admain"></div>
        <div className="skeleton-ip-item-admain"></div>
        <div className="skeleton-ip-item-admain"></div>
      </div>
      
      {/* History Card Skeleton */}
      <div className="history-card-admain skeleton-card-admain">
        <div className="skeleton-button-admain"></div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Maintenance Mode | Admin | Salfer Engineering</title>
        </Helmet>
        <SkeletonLoader />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Maintenance Mode | Admin | Salfer Engineering</title>
      </Helmet>

      <div className="maintenance-panel-admain">
        <div className="panel-header-admain">
          <h1><FaTools /> Maintenance Mode Control</h1>
          <p>Enable/disable maintenance mode and configure settings</p>
        </div>

        {/* Maintenance Toggle Card */}
        <div className="toggle-card-admain">
          <div className="toggle-info-admain">
            <h3>Maintenance Mode</h3>
            <p>When enabled, users will see a maintenance page instead of the website.</p>
            {isEnabled && (
              <div className="active-badge-admain">
                <FaCheckCircle /> Maintenance Mode ACTIVE
                {settings.scheduledStart && (
                  <span className="start-time-admain">
                    Started: {formatDate(settings.scheduledStart)}
                  </span>
                )}
              </div>
            )}
            {!isEnabled && settings.scheduledEnd && (
              <div className="last-maintenance-admain">
                <FaClock /> Last maintenance ended: {formatDate(settings.scheduledEnd)}
              </div>
            )}
          </div>
          <button 
            className={`toggle-btn-admain ${isEnabled ? 'active-admain' : 'inactive-admain'}`}
            onClick={handleToggleMaintenance}
            disabled={isToggling}
          >
            {isToggling ? <FaSpinner className="spinner-admain" /> : isEnabled ? <FaPowerOff /> : <FaPlay />}
            {isEnabled ? 'Disable Maintenance' : 'Enable Maintenance'}
          </button>
        </div>

        {/* Settings Card */}
        <div className="settings-card-admain">
          <h3>Maintenance Page Settings</h3>
          
          <div className="form-group-admain">
            <label>Page Title</label>
            <input 
              type="text" 
              value={settings.title} 
              onChange={(e) => setSettings({ ...settings, title: e.target.value })}
              placeholder="Under Maintenance"
            />
          </div>
          
          <div className="form-group-admain">
            <label>Message</label>
            <textarea 
              rows="3" 
              value={settings.message} 
              onChange={(e) => setSettings({ ...settings, message: e.target.value })}
              placeholder="We are currently performing scheduled maintenance..."
            />
          </div>
          
          <div className="form-row-admain">
            <div className="form-group-admain">
              <label>Estimated Duration (for display only)</label>
              <input 
                type="text" 
                value={settings.estimatedDuration} 
                onChange={(e) => setSettings({ ...settings, estimatedDuration: e.target.value })}
                placeholder="e.g., 2 hours"
              />
              <small>This is just for display. You can disable maintenance anytime.</small>
            </div>
          </div>
          
          <div className="form-row-admain">
            <div className="form-group-admain">
              <label>Contact Email</label>
              <input 
                type="email" 
                value={settings.contactEmail} 
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              />
            </div>
            <div className="form-group-admain">
              <label>Contact Phone</label>
              <input 
                type="text" 
                value={settings.contactPhone} 
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
              />
            </div>
          </div>
          
          <div className="checkbox-group-admain">
            <label className="checkbox-label-admain">
              <input 
                type="checkbox" 
                checked={settings.showCountdown} 
                onChange={(e) => setSettings({ ...settings, showCountdown: e.target.checked })}
              />
              <span>Show Countdown Timer</span>
            </label>
            <label className="checkbox-label-admain">
              <input 
                type="checkbox" 
                checked={settings.showProgressBar} 
                onChange={(e) => setSettings({ ...settings, showProgressBar: e.target.checked })}
              />
              <span>Show Progress Bar</span>
            </label>
          </div>
          
          <div className="social-links-section-admain">
            <h4>Social Media Links (Optional)</h4>
            <div className="form-row-admain">
              <div className="form-group-admain">
                <label>Facebook</label>
                <input 
                  type="url" 
                  value={settings.socialLinks.facebook} 
                  onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, facebook: e.target.value } })}
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div className="form-group-admain">
                <label>Twitter</label>
                <input 
                  type="url" 
                  value={settings.socialLinks.twitter} 
                  onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, twitter: e.target.value } })}
                  placeholder="https://twitter.com/..."
                />
              </div>
              <div className="form-group-admain">
                <label>Instagram</label>
                <input 
                  type="url" 
                  value={settings.socialLinks.instagram} 
                  onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, instagram: e.target.value } })}
                  placeholder="https://instagram.com/..."
                />
              </div>
            </div>
          </div>
          
          <button 
            className="save-btn-admain" 
            onClick={handleSaveSettings}
            disabled={isSubmitting}
          >
            <FaSave /> Save Settings
          </button>
        </div>

        {/* Allowed IPs Card */}
        <div className="ips-card-admain">
          <h3>Allowed IP Addresses (Admin Access During Maintenance)</h3>
          <div className="add-ip-admain">
            <input 
              type="text" 
              value={newIP} 
              onChange={(e) => setNewIP(e.target.value)}
              placeholder="Enter IP address (e.g., 192.168.1.1)"
            />
            <button onClick={handleAddIP}><FaPlus /> Add IP</button>
          </div>
          <div className="ip-list-admain">
            {settings.allowedIPs.map((ip, index) => (
              <div key={index} className="ip-item-admain">
                <span>{ip}</span>
                <button onClick={() => handleRemoveIP(ip)}><FaTrash /></button>
              </div>
            ))}
            {settings.allowedIPs.length === 0 && (
              <p className="no-ips-admain">No IP addresses added. Only admins can access during maintenance.</p>
            )}
          </div>
        </div>

        {/* History Card */}
        <div className="history-card-admain">
          <button 
            className="history-toggle-admain" 
            onClick={() => setShowHistory(!showHistory)}
          >
            <FaHistory /> {showHistory ? 'Hide' : 'Show'} Maintenance History
          </button>
          
          {showHistory && (
            <div className="history-list-admain">
              {history.length === 0 ? (
                <p className="no-history-admain">No maintenance history available.</p>
              ) : (
                history.map((entry, index) => (
                  <div key={index} className="history-item-admain">
                    <div className="history-date-admain">
                      <FaClock />
                      <span>Started: {new Date(entry.startDate).toLocaleString()}</span>
                    </div>
                    {entry.endDate && (
                      <div className="history-date-admain">
                        <FaClock />
                        <span>Ended: {new Date(entry.endDate).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="history-details-admain">
                      <p><strong>Reason:</strong> {entry.reason || 'Scheduled maintenance'}</p>
                      <p><strong>Duration:</strong> {entry.endDate ? 
                        `${Math.round((new Date(entry.endDate) - new Date(entry.startDate)) / 1000 / 60)} minutes` : 
                        'Ongoing'}</p>
                      <p><strong>Initiated by:</strong> {entry.initiatedBy?.firstName} {entry.initiatedBy?.lastName || 'Admin'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <ToastNotification
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      </div>
    </>
  );
};

export default MaintenancePanel;