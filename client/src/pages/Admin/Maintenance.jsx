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
  FaCog,
  FaSolarPanel,
  FaBolt,
  FaBatteryFull,
  FaWrench,
  FaChartLine,
  FaDollarSign,
  FaCalculator,
  FaPercent
} from 'react-icons/fa';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import '../../styles/Admin/maintenance.css';

const MaintenancePanel = () => {
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeMainTab, setActiveMainTab] = useState('maintenance'); // 'maintenance' or 'systemconfig'
  
  // Maintenance Mode State
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
  
  // System Config State
  const [config, setConfig] = useState(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [activeConfigTab, setActiveConfigTab] = useState('equipment');
  const [reason, setReason] = useState('');
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState(null);
  
  // Equipment modal states
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [equipmentType, setEquipmentType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [equipmentForm, setEquipmentForm] = useState({
    name: '',
    price: 0,
    brand: '',
    warranty: 0,
    unit: 'piece',
    notes: ''
  });

  useEffect(() => {
    fetchMaintenanceData();
    fetchHistory();
    fetchSystemConfig();
  }, []);

  // ============ MAINTENANCE FUNCTIONS ============
  const fetchMaintenanceData = async () => {
    try {
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
    } catch (error) {
      console.error('Error fetching maintenance data:', error);
      showToast('Failed to load maintenance data', 'error');
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

  // ============ SYSTEM CONFIG FUNCTIONS ============
  const fetchSystemConfig = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/maintenance/config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConfig(response.data.config);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching config:', error);
      showToast('Failed to load configuration', 'error');
      setLoading(false);
    }
  };

  const handleConfigSave = async (updates) => {
    setPendingUpdates(updates);
    setShowReasonModal(true);
  };

  const confirmConfigSave = async () => {
    if (!reason.trim()) {
      showToast('Please enter a reason for the update', 'warning');
      return;
    }

    setSavingConfig(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(`${import.meta.env.VITE_API_URL}/api/maintenance/config?reason=${encodeURIComponent(reason)}`, 
        pendingUpdates,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast('Configuration updated successfully', 'success');
      setShowReasonModal(false);
      setReason('');
      fetchSystemConfig();
    } catch (error) {
      console.error('Error saving config:', error);
      showToast('Failed to update configuration', 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleResetConfig = async () => {
    if (!window.confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      return;
    }
    
    const reasonReset = prompt('Please enter a reason for resetting:');
    if (!reasonReset) return;
    
    setSavingConfig(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/maintenance/config/reset`, 
        { reason: reasonReset },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast('Configuration reset to defaults', 'success');
      fetchSystemConfig();
    } catch (error) {
      console.error('Error resetting config:', error);
      showToast('Failed to reset configuration', 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  const updateNestedValue = (path, value) => {
    const newConfig = { ...config };
    const keys = path.split('.');
    let current = newConfig;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setConfig(newConfig);
  };

  // Equipment Management Functions
  const openAddModal = (type) => {
    setEquipmentType(type);
    setEditingItem(null);
    setEquipmentForm({
      name: '',
      price: 0,
      brand: '',
      warranty: 0,
      unit: 'piece',
      notes: ''
    });
    setShowEquipmentModal(true);
  };

  const openEditModal = (type, item) => {
    setEquipmentType(type);
    setEditingItem(item);
    setEquipmentForm({
      name: item.name || '',
      price: item.price || 0,
      brand: item.brand || '',
      warranty: item.warranty || 0,
      unit: item.unit || 'piece',
      notes: item.notes || ''
    });
    setShowEquipmentModal(true);
  };

  const handleAddEquipment = async () => {
    if (!equipmentForm.name || equipmentForm.price <= 0) {
      showToast('Please enter name and valid price', 'warning');
      return;
    }

    setSavingConfig(true);
    try {
      const token = sessionStorage.getItem('token');
      const reasonText = prompt('Reason for adding this item:', `Added new ${equipmentType.slice(0, -1)}: ${equipmentForm.name}`);
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/maintenance/config/equipment?reason=${encodeURIComponent(reasonText || 'Added new equipment')}`,
        { 
          type: equipmentType, 
          ...equipmentForm 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showToast(response.data.message, 'success');
      setShowEquipmentModal(false);
      fetchSystemConfig();
    } catch (error) {
      console.error('Error adding equipment:', error);
      showToast(error.response?.data?.message || 'Failed to add equipment', 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleUpdateEquipment = async () => {
    if (!equipmentForm.name || equipmentForm.price <= 0) {
      showToast('Please enter name and valid price', 'warning');
      return;
    }

    setSavingConfig(true);
    try {
      const token = sessionStorage.getItem('token');
      const reasonText = prompt('Reason for updating this item:', `Updated ${equipmentType.slice(0, -1)}: ${equipmentForm.name}`);
      
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/maintenance/config/equipment/${equipmentType}/${editingItem._id}?reason=${encodeURIComponent(reasonText || 'Updated equipment')}`,
        equipmentForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showToast(response.data.message, 'success');
      setShowEquipmentModal(false);
      fetchSystemConfig();
    } catch (error) {
      console.error('Error updating equipment:', error);
      showToast(error.response?.data?.message || 'Failed to update equipment', 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleRemoveEquipment = async (type, item) => {
    if (!window.confirm(`Are you sure you want to remove "${item.name}"? This will hide it from selection.`)) {
      return;
    }
    
    setSavingConfig(true);
    try {
      const token = sessionStorage.getItem('token');
      const reasonText = prompt('Reason for removing this item:', `Removed ${type.slice(0, -1)}: ${item.name}`);
      
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/maintenance/config/equipment/${type}/${item._id}`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          data: { reason: reasonText || 'Removed equipment' }
        }
      );
      
      showToast(response.data.message, 'success');
      fetchSystemConfig();
    } catch (error) {
      console.error('Error removing equipment:', error);
      showToast(error.response?.data?.message || 'Failed to remove equipment', 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  // Equipment Card Component
  const EquipmentCard = ({ item, type }) => {
    const getIcon = () => {
      switch(type) {
        case 'solarPanels': return <FaSolarPanel />;
        case 'inverters': return <FaBolt />;
        case 'batteries': return <FaBatteryFull />;
        case 'mountingStructures': return <FaTools />;
        case 'electricalComponents': return <FaWrench />;
        case 'cablesAndWiring': return <FaWrench />;
        case 'safetyEquipment': return <FaTools />;
        case 'junctionBoxes': return <FaTools />;
        case 'disconnectSwitches': return <FaTools />;
        case 'meters': return <FaChartLine />;
        default: return <FaTools />;
      }
    };

    return (
      <div className="equipment-card-integrated">
        <div className="equipment-icon-integrated">{getIcon()}</div>
        <div className="equipment-info-integrated">
          <div className="equipment-name-integrated">{item.name}</div>
          <div className="equipment-details-integrated">
            <span className="price-integrated">₱{item.price.toLocaleString()}</span>
            {item.unit && <span className="unit-integrated">per {item.unit}</span>}
            {item.brand && <span className="brand-integrated">{item.brand}</span>}
            {item.warranty > 0 && <span className="warranty-integrated">{item.warranty} yrs</span>}
          </div>
        </div>
        <div className="equipment-actions-integrated">
          <button className="btn-edit-integrated" onClick={() => openEditModal(type, item)}>Edit</button>
          <button className="btn-remove-integrated" onClick={() => handleRemoveEquipment(type, item)}>Remove</button>
        </div>
      </div>
    );
  };

  const EquipmentSection = ({ title, type, icon: Icon, items }) => {
    const activeItems = items?.filter(item => item.isActive !== false) || [];
    
    return (
      <div className="equipment-section-integrated">
        <div className="section-header-integrated">
          <div className="section-title-integrated">
            <Icon /> <h4>{title}</h4>
            <span className="item-count-integrated">{activeItems.length} items</span>
          </div>
          <button className="btn-add-integrated" onClick={() => openAddModal(type)}>
            <FaPlus /> Add {title}
          </button>
        </div>
        <div className="equipment-list-integrated">
          {activeItems.length === 0 ? (
            <div className="empty-equipment-integrated">No {title.toLowerCase()} added yet.</div>
          ) : (
            activeItems.map((item) => (
              <EquipmentCard key={item._id} item={item} type={type} />
            ))
          )}
        </div>
      </div>
    );
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Maintenance & System Config | Admin | Salfer Engineering</title>
        </Helmet>
        <div className="maintenance-panel-admain">
          <div className="panel-header-admain">
            <div className="skeleton-line-admain large-admain"></div>
          </div>
          <div className="skeleton-card-admain"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Maintenance & System Config | Admin | Salfer Engineering</title>
      </Helmet>

      <div className="maintenance-panel-admain">
        <div className="panel-header-admain">
          <h1><FaTools /> Maintenance & System Configuration</h1>
          <p>Manage maintenance mode, system parameters, and equipment catalog</p>
        </div>

        {/* Main Tabs */}
        <div className="main-tabs-admain">
          <button 
            className={`main-tab-btn-admain ${activeMainTab === 'maintenance' ? 'active-admain' : ''}`}
            onClick={() => setActiveMainTab('maintenance')}
          >
            <FaPowerOff /> Maintenance Mode
          </button>
          <button 
            className={`main-tab-btn-admain ${activeMainTab === 'systemconfig' ? 'active-admain' : ''}`}
            onClick={() => setActiveMainTab('systemconfig')}
          >
            <FaCog /> System Configuration
          </button>
        </div>

        {/* MAINTENANCE MODE TAB */}
        {activeMainTab === 'maintenance' && (
          <>
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
                />
              </div>
              
              <div className="form-group-admain">
                <label>Message</label>
                <textarea 
                  rows="3" 
                  value={settings.message} 
                  onChange={(e) => setSettings({ ...settings, message: e.target.value })}
                />
              </div>
              
              <div className="form-row-admain">
                <div className="form-group-admain">
                  <label>Estimated Duration</label>
                  <input 
                    type="text" 
                    value={settings.estimatedDuration} 
                    onChange={(e) => setSettings({ ...settings, estimatedDuration: e.target.value })}
                  />
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
                  Show Countdown Timer
                </label>
                <label className="checkbox-label-admain">
                  <input 
                    type="checkbox" 
                    checked={settings.showProgressBar} 
                    onChange={(e) => setSettings({ ...settings, showProgressBar: e.target.checked })}
                  />
                  Show Progress Bar
                </label>
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
              <h3>Allowed IP Addresses</h3>
              <div className="add-ip-admain">
                <input 
                  type="text" 
                  value={newIP} 
                  onChange={(e) => setNewIP(e.target.value)}
                  placeholder="Enter IP address"
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
                  <p className="no-ips-admain">No IP addresses added.</p>
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
                    <p>No maintenance history available.</p>
                  ) : (
                    history.map((entry, index) => (
                      <div key={index} className="history-item-admain">
                        <div>Started: {new Date(entry.startDate).toLocaleString()}</div>
                        {entry.endDate && <div>Ended: {new Date(entry.endDate).toLocaleString()}</div>}
                        <div>Duration: {entry.endDate ? 
                          `${Math.round((new Date(entry.endDate) - new Date(entry.startDate)) / 1000 / 60)} minutes` : 
                          'Ongoing'}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* SYSTEM CONFIGURATION TAB */}
        {activeMainTab === 'systemconfig' && config && (
          <div className="system-config-integrated">
            <div className="config-actions-header">
              <button className="reset-config-btn" onClick={handleResetConfig} disabled={savingConfig}>
                <FaTools /> Reset to Defaults
              </button>
            </div>

            {/* Config Sub-tabs */}
            <div className="config-subtabs">
              <button className={`subtab-btn ${activeConfigTab === 'equipment' ? 'active' : ''}`} onClick={() => setActiveConfigTab('equipment')}>
                <FaSolarPanel /> Equipment Catalog
              </button>
              <button className={`subtab-btn ${activeConfigTab === 'calculations' ? 'active' : ''}`} onClick={() => setActiveConfigTab('calculations')}>
                <FaCalculator /> Calculations
              </button>
              <button className={`subtab-btn ${activeConfigTab === 'financial' ? 'active' : ''}`} onClick={() => setActiveConfigTab('financial')}>
                <FaDollarSign /> Financial
              </button>
              <button className={`subtab-btn ${activeConfigTab === 'taxes' ? 'active' : ''}`} onClick={() => setActiveConfigTab('taxes')}>
                <FaPercent /> Taxes
              </button>
            </div>

            {/* Equipment Catalog Tab */}
            {activeConfigTab === 'equipment' && (
              <div className="equipment-catalog-integrated">
                <div className="form-group-integrated">
                  <label>Pre-Assessment Fee</label>
                  <div className="input-group-integrated">
                    <span>₱</span>
                    <input
                      type="number"
                      value={config.assessmentFee || 1500}
                      onChange={(e) => setConfig({ ...config, assessmentFee: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <EquipmentSection title="Solar Panels" type="solarPanels" icon={FaSolarPanel} items={config.equipmentPrices?.solarPanels} />
                <EquipmentSection title="Inverters" type="inverters" icon={FaBolt} items={config.equipmentPrices?.inverters} />
                <EquipmentSection title="Batteries" type="batteries" icon={FaBatteryFull} items={config.equipmentPrices?.batteries} />
                <EquipmentSection title="Mounting Structures" type="mountingStructures" icon={FaTools} items={config.equipmentPrices?.mountingStructures} />
                <EquipmentSection title="Electrical Components" type="electricalComponents" icon={FaWrench} items={config.equipmentPrices?.electricalComponents} />
                <EquipmentSection title="Cables & Wiring" type="cablesAndWiring" icon={FaWrench} items={config.equipmentPrices?.cablesAndWiring} />
                <EquipmentSection title="Safety Equipment" type="safetyEquipment" icon={FaTools} items={config.equipmentPrices?.safetyEquipment} />
                <EquipmentSection title="Junction Boxes" type="junctionBoxes" icon={FaTools} items={config.equipmentPrices?.junctionBoxes} />
                <EquipmentSection title="Disconnect Switches" type="disconnectSwitches" icon={FaTools} items={config.equipmentPrices?.disconnectSwitches} />
                <EquipmentSection title="Meters" type="meters" icon={FaChartLine} items={config.equipmentPrices?.meters} />

                <h4>Labor Rates</h4>
                <div className="form-row-integrated">
                  <div className="form-group-integrated">
                    <label>Per kW Installation (₱)</label>
                    <input type="number" value={config.laborRates?.perKw || 5000} onChange={(e) => updateNestedValue('laborRates.perKw', parseFloat(e.target.value))} />
                  </div>
                  <div className="form-group-integrated">
                    <label>Per Panel Installation (₱)</label>
                    <input type="number" value={config.laborRates?.perPanel || 1000} onChange={(e) => updateNestedValue('laborRates.perPanel', parseFloat(e.target.value))} />
                  </div>
                  <div className="form-group-integrated">
                    <label>Minimum Labor Fee (₱)</label>
                    <input type="number" value={config.laborRates?.minimumFee || 10000} onChange={(e) => updateNestedValue('laborRates.minimumFee', parseFloat(e.target.value))} />
                  </div>
                </div>

                <button className="save-config-btn" onClick={() => handleConfigSave({ 
                  assessmentFee: config.assessmentFee, 
                  equipmentPrices: config.equipmentPrices, 
                  laborRates: config.laborRates 
                })} disabled={savingConfig}>
                  <FaSave /> Save Equipment Catalog
                </button>
              </div>
            )}

            {/* Calculations Tab */}
            {activeConfigTab === 'calculations' && (
              <div className="config-section-integrated">
                <h3>System Calculation Parameters</h3>
                <div className="form-row-integrated">
                  <div className="form-group-integrated">
                    <label>Average Sun Hours (hours/day)</label>
                    <input type="number" step="0.1" value={config.systemCalculations?.averageSunHours || 4.5} onChange={(e) => updateNestedValue('systemCalculations.averageSunHours', parseFloat(e.target.value))} />
                  </div>
                  <div className="form-group-integrated">
                    <label>System Losses (%)</label>
                    <input type="number" step="0.01" value={((config.systemCalculations?.systemLosses || 0.2) * 100).toFixed(1)} onChange={(e) => updateNestedValue('systemCalculations.systemLosses', parseFloat(e.target.value) / 100)} />
                  </div>
                </div>
                <div className="form-row-integrated">
                  <div className="form-group-integrated">
                    <label>Derating Factor</label>
                    <input type="number" step="0.01" value={config.systemCalculations?.deratingFactor || 0.77} onChange={(e) => updateNestedValue('systemCalculations.deratingFactor', parseFloat(e.target.value))} />
                  </div>
                  <div className="form-group-integrated">
                    <label>Panel Efficiency (%)</label>
                    <input type="number" step="0.01" value={((config.systemCalculations?.panelEfficiency || 0.18) * 100).toFixed(1)} onChange={(e) => updateNestedValue('systemCalculations.panelEfficiency', parseFloat(e.target.value) / 100)} />
                  </div>
                </div>
                <button className="save-config-btn" onClick={() => handleConfigSave({ systemCalculations: config.systemCalculations })} disabled={savingConfig}>
                  <FaSave /> Save Calculations
                </button>
              </div>
            )}

            {/* Financial Tab */}
            {activeConfigTab === 'financial' && (
              <div className="config-section-integrated">
                <h3>Financial Parameters</h3>
                <div className="form-row-integrated">
                  <div className="form-group-integrated">
                    <label>Electricity Rate (₱/kWh)</label>
                    <input type="number" step="0.5" value={config.financialParams?.electricityRate || 11.5} onChange={(e) => updateNestedValue('financialParams.electricityRate', parseFloat(e.target.value))} />
                  </div>
                  <div className="form-group-integrated">
                    <label>Inflation Rate (%)</label>
                    <input type="number" step="0.01" value={((config.financialParams?.inflationRate || 0.03) * 100).toFixed(1)} onChange={(e) => updateNestedValue('financialParams.inflationRate', parseFloat(e.target.value) / 100)} />
                  </div>
                </div>
                <button className="save-config-btn" onClick={() => handleConfigSave({ financialParams: config.financialParams })} disabled={savingConfig}>
                  <FaSave /> Save Financial Settings
                </button>
              </div>
            )}

            {/* Taxes Tab */}
            {activeConfigTab === 'taxes' && (
              <div className="config-section-integrated">
                <h3>Taxes and Fees</h3>
                <div className="form-row-integrated">
                  <div className="form-group-integrated">
                    <label>VAT Rate (%)</label>
                    <input type="number" step="0.01" value={((config.taxesAndFees?.vatRate || 0.12) * 100).toFixed(1)} onChange={(e) => updateNestedValue('taxesAndFees.vatRate', parseFloat(e.target.value) / 100)} />
                  </div>
                  <div className="form-group-integrated">
                    <label>Permit Fee (₱)</label>
                    <input type="number" value={config.taxesAndFees?.permitFee || 3000} onChange={(e) => updateNestedValue('taxesAndFees.permitFee', parseFloat(e.target.value))} />
                  </div>
                </div>
                <button className="save-config-btn" onClick={() => handleConfigSave({ taxesAndFees: config.taxesAndFees })} disabled={savingConfig}>
                  <FaSave /> Save Taxes & Fees
                </button>
              </div>
            )}
          </div>
        )}

        {/* Equipment Modal */}
        {showEquipmentModal && (
          <div className="modal-overlay" onClick={() => setShowEquipmentModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>{editingItem ? 'Edit' : 'Add'} {equipmentType?.slice(0, -1)}</h3>
              <div className="form-group">
                <label>Name *</label>
                <input type="text" value={equipmentForm.name} onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Price *</label>
                <input type="number" value={equipmentForm.price} onChange={(e) => setEquipmentForm({ ...equipmentForm, price: parseFloat(e.target.value) })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Unit</label>
                  <select value={equipmentForm.unit} onChange={(e) => setEquipmentForm({ ...equipmentForm, unit: e.target.value })}>
                    <option value="piece">Piece</option>
                    <option value="watt">Watt</option>
                    <option value="kw">kW</option>
                    <option value="meter">Meter</option>
                    <option value="set">Set</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Warranty (years)</label>
                  <input type="number" value={equipmentForm.warranty} onChange={(e) => setEquipmentForm({ ...equipmentForm, warranty: parseInt(e.target.value) })} />
                </div>
              </div>
              <div className="form-group">
                <label>Brand</label>
                <input type="text" value={equipmentForm.brand} onChange={(e) => setEquipmentForm({ ...equipmentForm, brand: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button onClick={() => setShowEquipmentModal(false)}>Cancel</button>
                <button onClick={editingItem ? handleUpdateEquipment : handleAddEquipment} disabled={savingConfig}>
                  {savingConfig ? <FaSpinner /> : <FaCheckCircle />} {editingItem ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reason Modal */}
        {showReasonModal && (
          <div className="modal-overlay" onClick={() => setShowReasonModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>Reason for Update</h3>
              <textarea rows="3" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Enter reason for these changes..." />
              <div className="modal-actions">
                <button onClick={() => setShowReasonModal(false)}>Cancel</button>
                <button onClick={confirmConfigSave} disabled={savingConfig}>
                  {savingConfig ? <FaSpinner /> : <FaCheckCircle />} Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      </div>
    </>
  );
};

export default MaintenancePanel;