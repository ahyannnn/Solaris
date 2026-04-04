// pages/Admin/Maintenance.jsx - Updated toggle functionality

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { 
  FaTools, 
  FaToggleOn, 
  FaToggleOff, 
  FaSave, 
  FaHistory,
  FaPlus,
  FaTrash,
  FaSpinner,
  FaCheckCircle,
  FaClock,
  FaPowerOff,
  FaPlay
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

  // ✅ Updated toggle function - can disable at any time
  const handleToggleMaintenance = async () => {
    setIsToggling(true);
    try {
      const token = sessionStorage.getItem('token');
      
      if (!isEnabled) {
        // Enable maintenance
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
        // ✅ Disable maintenance - works regardless of duration
        await axios.post(`${import.meta.env.VITE_API_URL}/api/maintenance/disable`, {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showToast('Maintenance mode disabled', 'success');
      }
      
      setIsEnabled(!isEnabled);
      await fetchMaintenanceData(); // Refresh data
      await fetchHistory(); // Refresh history
      
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
        // If maintenance is active, refresh the page settings
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

  if (loading) {
    return (
      <div className="maintenance-panel">
        <div className="loading-container">
          <FaSpinner className="spinner" />
          <p>Loading maintenance settings...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Maintenance Mode | Admin | Salfer Engineering</title>
      </Helmet>

      <div className="maintenance-panel">
        <div className="panel-header">
          <h1><FaTools /> Maintenance Mode Control</h1>
          <p>Enable/disable maintenance mode and configure settings</p>
        </div>

        {/* Maintenance Toggle Card */}
        <div className="toggle-card">
          <div className="toggle-info">
            <h3>Maintenance Mode</h3>
            <p>When enabled, users will see a maintenance page instead of the website.</p>
            {isEnabled && (
              <div className="active-badge">
                <FaCheckCircle /> Maintenance Mode ACTIVE
                {settings.scheduledStart && (
                  <span className="start-time">
                    Started: {formatDate(settings.scheduledStart)}
                  </span>
                )}
              </div>
            )}
            {!isEnabled && settings.scheduledEnd && (
              <div className="last-maintenance">
                <FaClock /> Last maintenance ended: {formatDate(settings.scheduledEnd)}
              </div>
            )}
          </div>
          <button 
            className={`toggle-btn ${isEnabled ? 'active' : 'inactive'}`}
            onClick={handleToggleMaintenance}
            disabled={isToggling}
          >
            {isToggling ? <FaSpinner className="spinner" /> : isEnabled ? <FaPowerOff /> : <FaPlay />}
            {isEnabled ? 'Disable Maintenance' : 'Enable Maintenance'}
          </button>
        </div>

        {/* Settings Card - Only show when maintenance is active OR always show? */}
        <div className="settings-card">
          <h3>Maintenance Page Settings</h3>
          
          <div className="form-group">
            <label>Page Title</label>
            <input 
              type="text" 
              value={settings.title} 
              onChange={(e) => setSettings({ ...settings, title: e.target.value })}
              placeholder="Under Maintenance"
            />
          </div>
          
          <div className="form-group">
            <label>Message</label>
            <textarea 
              rows="3" 
              value={settings.message} 
              onChange={(e) => setSettings({ ...settings, message: e.target.value })}
              placeholder="We are currently performing scheduled maintenance..."
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
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
          
          <div className="form-row">
            <div className="form-group">
              <label>Contact Email</label>
              <input 
                type="email" 
                value={settings.contactEmail} 
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Contact Phone</label>
              <input 
                type="text" 
                value={settings.contactPhone} 
                onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
              />
            </div>
          </div>
          
          <div className="checkbox-group">
            <label>
              <input 
                type="checkbox" 
                checked={settings.showCountdown} 
                onChange={(e) => setSettings({ ...settings, showCountdown: e.target.checked })}
              />
              Show Countdown Timer
            </label>
            <label>
              <input 
                type="checkbox" 
                checked={settings.showProgressBar} 
                onChange={(e) => setSettings({ ...settings, showProgressBar: e.target.checked })}
              />
              Show Progress Bar
            </label>
          </div>
          
          <div className="social-links-section">
            <h4>Social Media Links (Optional)</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Facebook</label>
                <input 
                  type="url" 
                  value={settings.socialLinks.facebook} 
                  onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, facebook: e.target.value } })}
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div className="form-group">
                <label>Twitter</label>
                <input 
                  type="url" 
                  value={settings.socialLinks.twitter} 
                  onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, twitter: e.target.value } })}
                  placeholder="https://twitter.com/..."
                />
              </div>
              <div className="form-group">
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
            className="save-btn" 
            onClick={handleSaveSettings}
            disabled={isSubmitting}
          >
            <FaSave /> Save Settings
          </button>
        </div>

        {/* Allowed IPs Card */}
        <div className="ips-card">
          <h3>Allowed IP Addresses (Admin Access During Maintenance)</h3>
          <div className="add-ip">
            <input 
              type="text" 
              value={newIP} 
              onChange={(e) => setNewIP(e.target.value)}
              placeholder="Enter IP address (e.g., 192.168.1.1)"
            />
            <button onClick={handleAddIP}><FaPlus /> Add IP</button>
          </div>
          <div className="ip-list">
            {settings.allowedIPs.map((ip, index) => (
              <div key={index} className="ip-item">
                <span>{ip}</span>
                <button onClick={() => handleRemoveIP(ip)}><FaTrash /></button>
              </div>
            ))}
            {settings.allowedIPs.length === 0 && (
              <p className="no-ips">No IP addresses added. Only admins can access during maintenance.</p>
            )}
          </div>
        </div>

        {/* History Card */}
        <div className="history-card">
          <button 
            className="history-toggle" 
            onClick={() => setShowHistory(!showHistory)}
          >
            <FaHistory /> {showHistory ? 'Hide' : 'Show'} Maintenance History
          </button>
          
          {showHistory && (
            <div className="history-list">
              {history.length === 0 ? (
                <p>No maintenance history available.</p>
              ) : (
                history.map((entry, index) => (
                  <div key={index} className="history-item">
                    <div className="history-date">
                      <FaClock />
                      <span>Started: {new Date(entry.startDate).toLocaleString()}</span>
                    </div>
                    {entry.endDate && (
                      <div className="history-date">
                        <FaClock />
                        <span>Ended: {new Date(entry.endDate).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="history-details">
                      <p><strong>Reason:</strong> {entry.reason}</p>
                      <p><strong>Duration:</strong> {entry.endDate ? 
                        `${Math.round((new Date(entry.endDate) - new Date(entry.startDate)) / 1000 / 60)} minutes` : 
                        'Ongoing'}</p>
                      <p><strong>Initiated by:</strong> {entry.initiatedBy?.firstName} {entry.initiatedBy?.lastName}</p>
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