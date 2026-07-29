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
  FaPowerOff,
  FaPlay,
  FaCog,
  FaTimes,
  FaChevronDown,
  FaBox,
  FaCalculator,
  FaMoneyBillWave,
  FaReceipt,
  FaMobileAlt
} from 'react-icons/fa';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import '../../styles/Admin/maintenance.css';
import AppManagement from '../../components/Admin/AppManagement';

const MaintenancePanel = () => {
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeMainTab, setActiveMainTab] = useState('maintenance');
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);

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
  const [ipError, setIpError] = useState('');

  // System Config State
  const [config, setConfig] = useState(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [activeConfigTab, setActiveConfigTab] = useState('equipment');
  const [reason, setReason] = useState('');
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState(null);

  // Reset confirmation modal states
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetReason, setResetReason] = useState('');

  // Equipment modal states
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [equipmentType, setEquipmentType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [equipmentForm, setEquipmentForm] = useState({
    name: '',
    price: '',
    brand: '',
    warranty: '',
    capacity: {
      value: '',
      unit: 'W'
    },
    panelArea: '',
    dob: '',
    unit: 'piece',
    notes: ''
  });
  const [equipmentErrors, setEquipmentErrors] = useState({});

  // Remove equipment confirmation modal states
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [itemToRemove, setItemToRemove] = useState(null);
  const [removeReason, setRemoveReason] = useState('');

  // Settings validation errors
  const [settingsErrors, setSettingsErrors] = useState({});

  useEffect(() => {
    fetchMaintenanceData();
    fetchHistory();
    fetchSystemConfig();
  }, []);

  // ============ VALIDATION FUNCTIONS ============

  // Validate email - must be @gmail.com
  const validateEmail = (email) => {
    if (!email || email.trim() === '') {
      return 'Email is required';
    }
    if (!email.endsWith('@gmail.com')) {
      return 'Email must be a valid Gmail address (@gmail.com)';
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid Gmail address';
    }
    return null;
  };

  // Validate phone - must start with 09 and be exactly 11 digits
  const validatePhone = (phone) => {
    if (!phone || phone.trim() === '') {
      return 'Phone number is required';
    }
    const digitsOnly = phone.replace(/\D/g, '');
    if (!/^09\d{9}$/.test(digitsOnly)) {
      return 'Phone number must start with 09 and be exactly 11 digits';
    }
    return null;
  };

  // Validate IP address
  const validateIP = (ip) => {
    if (!ip || ip.trim() === '') {
      return 'IP address is required';
    }
    const ipv4Regex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (ipv4Regex.test(ip.trim())) {
      return null;
    }
    const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
    if (ipv6Regex.test(ip.trim())) {
      return null;
    }
    return 'Please enter a valid IP address (IPv4 or IPv6)';
  };

  // Validate estimated duration
  const validateDuration = (duration) => {
    if (!duration || duration.trim() === '') {
      return 'Estimated duration is required';
    }
    const durationRegex = /^\d+\s*(minutes?|mins?|hours?|hrs?|days?|weeks?)/i;
    if (!durationRegex.test(duration.trim())) {
      return 'Please enter a valid duration (e.g., 2 hours, 30 mins, 1 day)';
    }
    return null;
  };

  // ============ ENHANCED EQUIPMENT VALIDATION ============
  const validateEquipmentForm = () => {
    const errors = {};

    // --- Name Validation ---
    if (!equipmentForm.name || equipmentForm.name.trim() === '') {
      errors.name = 'Equipment name is required';
    } else if (equipmentForm.name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    } else if (equipmentForm.name.length > 100) {
      errors.name = 'Name must not exceed 100 characters';
    }

    // --- Price Validation ---
    const price = parseFloat(equipmentForm.price);
    if (!equipmentForm.price || equipmentForm.price === '') {
      errors.price = 'Price is required';
    } else if (isNaN(price)) {
      errors.price = 'Please enter a valid number';
    } else if (price < 1) {
      errors.price = 'Price must be at least ₱1';
    } else if (price > 999999999) {
      errors.price = 'Price cannot exceed ₱999,999,999';
    }

    // --- Brand Validation ---
    if (!equipmentForm.brand || equipmentForm.brand.trim() === '') {
      errors.brand = 'Brand is required';
    } else if (equipmentForm.brand.length > 50) {
      errors.brand = 'Brand must not exceed 50 characters';
    }

    // --- Warranty Validation ---
    const warranty = parseFloat(equipmentForm.warranty);
    if (!equipmentForm.warranty || equipmentForm.warranty === '') {
      errors.warranty = 'Warranty is required';
    } else if (isNaN(warranty)) {
      errors.warranty = 'Please enter a valid number';
    } else if (warranty < 0) {
      errors.warranty = 'Warranty cannot be negative';
    } else if (warranty > 50) {
      errors.warranty = 'Warranty cannot exceed 50 years';
    }

    // --- Capacity Validation ---
    const capacityValue = parseFloat(equipmentForm.capacity.value);
    if (!equipmentForm.capacity.value || equipmentForm.capacity.value === '') {
      errors['capacity.value'] = 'Capacity is required';
    } else if (isNaN(capacityValue)) {
      errors['capacity.value'] = 'Please enter a valid number';
    } else if (capacityValue < 0) {
      errors['capacity.value'] = 'Capacity cannot be negative';
    } else if (capacityValue > 999999) {
      errors['capacity.value'] = 'Capacity cannot exceed 999,999';
    }

    // --- Unit Validation ---
    if (!equipmentForm.unit || equipmentForm.unit === '') {
      errors.unit = 'Unit is required';
    }

    // --- Solar Panels Specific Validation ---
    if (equipmentType === 'solarPanels') {
      const panelArea = parseFloat(equipmentForm.panelArea);
      if (!equipmentForm.panelArea || equipmentForm.panelArea === '') {
        errors.panelArea = 'Panel area is required';
      } else if (isNaN(panelArea)) {
        errors.panelArea = 'Please enter a valid number';
      } else if (panelArea < 0.01) {
        errors.panelArea = 'Panel area must be at least 0.01 m²';
      } else if (panelArea > 1000) {
        errors.panelArea = 'Panel area cannot exceed 1000 m²';
      }
    }

    // --- Batteries Specific Validation ---
    if (equipmentType === 'batteries') {
      const dob = parseFloat(equipmentForm.dob);
      if (!equipmentForm.dob || equipmentForm.dob === '') {
        errors.dob = 'Depth of Discharge (DoD) is required';
      } else if (isNaN(dob)) {
        errors.dob = 'Please enter a valid number';
      } else if (dob < 0) {
        errors.dob = 'DoD cannot be negative';
      } else if (dob > 100) {
        errors.dob = 'DoD cannot exceed 100%';
      }
    }

    // --- Inverters Specific Validation ---
    if (equipmentType === 'inverters') {
      // Inverters might have additional validation
      // Could add efficiency rating validation if needed
    }

    return errors;
  };

  // Validate settings form
  const validateSettings = () => {
    const errors = {};

    const emailError = validateEmail(settings.contactEmail);
    if (emailError) errors.contactEmail = emailError;

    const phoneError = validatePhone(settings.contactPhone);
    if (phoneError) errors.contactPhone = phoneError;

    const durationError = validateDuration(settings.estimatedDuration);
    if (durationError) errors.estimatedDuration = durationError;

    if (!settings.title || settings.title.trim() === '') {
      errors.title = 'Title is required';
    } else if (settings.title.length > 100) {
      errors.title = 'Title must not exceed 100 characters';
    }

    if (!settings.message || settings.message.trim() === '') {
      errors.message = 'Message is required';
    }

    return errors;
  };

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
    const errors = validateSettings();
    if (Object.keys(errors).length > 0) {
      setSettingsErrors(errors);
      const firstError = Object.values(errors)[0];
      showToast(firstError, 'warning');
      return;
    }
    setSettingsErrors({});

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
    const error = validateIP(newIP);
    if (error) {
      setIpError(error);
      showToast(error, 'warning');
      return;
    }
    setIpError('');

    if (settings.allowedIPs.includes(newIP.trim())) {
      showToast('IP address already exists', 'warning');
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/maintenance/add-ip`,
        { ip: newIP.trim() },
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

  const openResetModal = () => {
    setShowResetModal(true);
    setResetReason('');
  };

  const confirmResetConfig = async () => {
    if (!resetReason.trim()) {
      showToast('Please enter a reason for resetting', 'warning');
      return;
    }

    setSavingConfig(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/maintenance/config/reset`,
        { reason: resetReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast('Configuration reset to defaults', 'success');
      setShowResetModal(false);
      setResetReason('');
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

  // ============ EQUIPMENT MANAGEMENT FUNCTIONS ============
  const openAddModal = (type) => {
    setEquipmentType(type);
    setEditingItem(null);
    setEquipmentForm({
      name: '',
      price: '',
      brand: '',
      warranty: '',
      capacity: {
        value: '',
        unit: type === "solarPanels" ? "W" : type === "inverters" ? "kW" : type === "batteries" ? "kWh" : ""
      },
      panelArea: '',
      dob: '',
      unit: "piece",
      notes: ''
    });
    setEquipmentErrors({});
    setShowEquipmentModal(true);
  };

  const openEditModal = (type, item) => {
    setEquipmentType(type);
    setEditingItem(item);
    setEquipmentForm({
      name: item.name || "",
      price: item.price ? String(item.price) : '',
      brand: item.brand || "",
      warranty: item.warranty ? String(item.warranty) : '',
      capacity: {
        value: item.capacity?.value ? String(item.capacity.value) : '',
        unit: item.capacity?.unit || ""
      },
      panelArea: item.panelArea ? String(item.panelArea) : '',
      dob: item.dob ? String(item.dob) : '',
      unit: item.unit || "piece",
      notes: item.notes || ""
    });
    setEquipmentErrors({});
    setShowEquipmentModal(true);
  };

  const openRemoveModal = (type, item) => {
    setItemToRemove({ type, item });
    setRemoveReason('');
    setShowRemoveModal(true);
  };

  const confirmRemoveEquipment = async () => {
    if (!removeReason.trim()) {
      showToast('Please enter a reason for removal', 'warning');
      return;
    }

    setSavingConfig(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/maintenance/config/equipment/${itemToRemove.type}/${itemToRemove.item._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { reason: removeReason }
        }
      );

      showToast(response.data.message, 'success');
      setShowRemoveModal(false);
      setItemToRemove(null);
      setRemoveReason('');
      fetchSystemConfig();
    } catch (error) {
      console.error('Error removing equipment:', error);
      showToast(error.response?.data?.message || 'Failed to remove equipment', 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleAddEquipment = async () => {
    const errors = validateEquipmentForm();
    if (Object.keys(errors).length > 0) {
      setEquipmentErrors(errors);
      const firstError = Object.values(errors)[0];
      showToast(firstError, 'warning');
      return;
    }
    setEquipmentErrors({});

    setSavingConfig(true);
    try {
      const token = sessionStorage.getItem('token');
      
      const equipmentData = {
        type: equipmentType,
        name: equipmentForm.name.trim(),
        price: parseFloat(equipmentForm.price) || 0,
        brand: equipmentForm.brand.trim(),
        warranty: parseFloat(equipmentForm.warranty) || 0,
        capacity: {
          value: parseFloat(equipmentForm.capacity.value) || 0,
          unit: equipmentForm.capacity.unit
        },
        panelArea: equipmentType === 'solarPanels' ? parseFloat(equipmentForm.panelArea) || 0 : 0,
        dob: equipmentType === 'batteries' ? parseFloat(equipmentForm.dob) || 0 : 0,
        unit: equipmentForm.unit,
        notes: equipmentForm.notes || '',
        reason: `Added new ${equipmentType?.slice(0, -1)}: ${equipmentForm.name}`
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/maintenance/config/equipment`,
        equipmentData,
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
    const errors = validateEquipmentForm();
    if (Object.keys(errors).length > 0) {
      setEquipmentErrors(errors);
      const firstError = Object.values(errors)[0];
      showToast(firstError, 'warning');
      return;
    }
    setEquipmentErrors({});

    setSavingConfig(true);
    try {
      const token = sessionStorage.getItem('token');
      
      const equipmentData = {
        name: equipmentForm.name.trim(),
        price: parseFloat(equipmentForm.price) || 0,
        brand: equipmentForm.brand.trim(),
        warranty: parseFloat(equipmentForm.warranty) || 0,
        capacity: {
          value: parseFloat(equipmentForm.capacity.value) || 0,
          unit: equipmentForm.capacity.unit
        },
        panelArea: equipmentType === 'solarPanels' ? parseFloat(equipmentForm.panelArea) || 0 : 0,
        dob: equipmentType === 'batteries' ? parseFloat(equipmentForm.dob) || 0 : 0,
        unit: equipmentForm.unit,
        notes: equipmentForm.notes || '',
        reason: `Updated ${equipmentType?.slice(0, -1)}: ${equipmentForm.name}`
      };

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/maintenance/config/equipment/${equipmentType}/${editingItem._id}`,
        equipmentData,
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

  const EquipmentCard = ({ item, type }) => {
    return (
      <div className="equipment-card-admain">
        <div className="equipment-info-admain">
          <div className="equipment-name-admain">{item.name}</div>
          <div className="equipment-details-admain">
            <span className="price-admain">₱{item.price.toLocaleString()}</span>
            {item.capacity?.value > 0 && (
              <span className="capacity-admain">
                {item.capacity.value} {item.capacity.unit}
              </span>
            )}
            {type === "solarPanels" && item.panelArea > 0 && (
              <span className="panel-area-admain">
                {item.panelArea} m²
              </span>
            )}
            {type === "batteries" && item.dob > 0 && (
              <span className="dob-admain">
                DoD: {item.dob}%
              </span>
            )}
            {item.unit && <span className="unit-admain">per {item.unit}</span>}
            {item.brand && <span className="brand-admain">{item.brand}</span>}
            {item.warranty > 0 && <span className="warranty-admain">{item.warranty} yrs</span>}
          </div>
        </div>
        <div className="equipment-actions-admain">
          <button className="btn-edit-admain" onClick={() => openEditModal(type, item)}>Edit</button>
          <button className="btn-remove-admain" onClick={() => openRemoveModal(type, item)}>Remove</button>
        </div>
      </div>
    );
  };

  const EquipmentSection = ({ title, type, items }) => {
    const activeItems = items?.filter(item => item.isActive !== false) || [];

    return (
      <div className="equipment-section-admain">
        <div className="section-header-admain">
          <div className="section-title-admain">
            <h4>{title}</h4>
            <span className="item-count-admain">{activeItems.length} items</span>
          </div>
          <button className="btn-add-admain" onClick={() => openAddModal(type)}>
            <FaPlus /> Add {title}
          </button>
        </div>
        <div className="equipment-list-admain">
          {activeItems.length === 0 ? (
            <div className="empty-equipment-admain">No {title.toLowerCase()} added yet.</div>
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

  const getSubTabLabel = () => {
    const labels = {
      equipment: 'Equipment Catalog',
      apps: 'App Management'
    };
    return labels[activeConfigTab] || 'Select Tab';
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
          <div></div>
        </div>

        {/* Main Tabs */}
        <div className="main-tabs-admain">
          <button
            className={`main-tab-btn-admain ${activeMainTab === 'maintenance' ? 'active-admain' : ''}`}
            onClick={() => setActiveMainTab('maintenance')}
          >
            <FaTools className="tab-icon-admain" />
            Maintenance Mode
          </button>
          <button
            className={`main-tab-btn-admain ${activeMainTab === 'systemconfig' ? 'active-admain' : ''}`}
            onClick={() => setActiveMainTab('systemconfig')}
          >
            <FaCog className="tab-icon-admain" />
            System Configuration
          </button>
        </div>

        {/* MAINTENANCE MODE TAB */}
        {activeMainTab === 'maintenance' && (
          <>
            <div className="toggle-card-admain">
              <div className="toggle-info-admain">
                <h3>Maintenance Mode</h3>
                <p>When enabled, users will see a maintenance page instead of the website.</p>
                {isEnabled && (
                  <div className="active-badge-admain">
                    Maintenance Mode ACTIVE
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

            <div className="settings-card-admain">
              <h3>Maintenance Page Settings</h3>

              <div className="form-group-admain">
                <label>Page Title *</label>
                <input
                  type="text"
                  value={settings.title}
                  onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                  className={settingsErrors.title ? 'error-admain' : ''}
                  placeholder="Enter page title"
                />
                {settingsErrors.title && <span className="error-text-admain">{settingsErrors.title}</span>}
              </div>

              <div className="form-group-admain">
                <label>Message *</label>
                <textarea
                  rows="3"
                  value={settings.message}
                  onChange={(e) => setSettings({ ...settings, message: e.target.value })}
                  className={settingsErrors.message ? 'error-admain' : ''}
                  placeholder="Enter maintenance message"
                />
                {settingsErrors.message && <span className="error-text-admain">{settingsErrors.message}</span>}
              </div>

              <div className="form-row-admain">
                <div className="form-group-admain">
                  <label>Estimated Duration *</label>
                  <input
                    type="text"
                    value={settings.estimatedDuration}
                    onChange={(e) => setSettings({ ...settings, estimatedDuration: e.target.value })}
                    className={settingsErrors.estimatedDuration ? 'error-admain' : ''}
                    placeholder="e.g., 2 hours, 30 mins, 1 day"
                  />
                  {settingsErrors.estimatedDuration && <small className="error-text-admain">{settingsErrors.estimatedDuration}</small>}
                </div>
              </div>

              <div className="form-row-admain">
                <div className="form-group-admain">
                  <label>Contact Email *</label>
                  <input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                    className={settingsErrors.contactEmail ? 'error-admain' : ''}
                    placeholder="name@gmail.com"
                  />
                  {settingsErrors.contactEmail && <small className="error-text-admain">{settingsErrors.contactEmail}</small>}
                </div>
                <div className="form-group-admain">
                  <label>Contact Phone *</label>
                  <input
                    type="text"
                    value={settings.contactPhone}
                    onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                    className={settingsErrors.contactPhone ? 'error-admain' : ''}
                    placeholder="09XXXXXXXXX"
                    maxLength="11"
                  />
                  {settingsErrors.contactPhone && <small className="error-text-admain">{settingsErrors.contactPhone}</small>}
                  <small>Must start with 09 and be exactly 11 digits</small>
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

            <div className="ips-card-admain">
              <h3>Allowed IP Addresses</h3>
              <div className="add-ip-admain">
                <div className="ip-input-wrapper-admain">
                  <input
                    type="text"
                    value={newIP}
                    onChange={(e) => {
                      setNewIP(e.target.value);
                      setIpError('');
                    }}
                    className={ipError ? 'error-admain' : ''}
                    placeholder="Enter IP address (IPv4 or IPv6)"
                  />
                  {ipError && <small className="error-text-admain">{ipError}</small>}
                </div>
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
          <div className="system-config-admain">
            <div className="config-header-tabs-wrapper-admain">
              <div className="config-subtabs-wrapper-admain">
                <button
                  className={`mobile-subtab-toggle-admain ${isSubMenuOpen ? 'open-admain' : ''}`}
                  onClick={() => setIsSubMenuOpen(!isSubMenuOpen)}
                  aria-label="Toggle configuration tabs"
                >
                  <span className="subtab-label-admain">{getSubTabLabel()}</span>
                  <FaChevronDown className={`toggle-arrow-admain ${isSubMenuOpen ? 'open-admain' : ''}`} />
                </button>

                <div className={`config-subtabs-admain ${isSubMenuOpen ? 'open-admain' : ''}`}>
                  <button
                    className={`subtab-btn-admain ${activeConfigTab === 'equipment' ? 'active-admain' : ''}`}
                    onClick={() => { setActiveConfigTab('equipment'); setIsSubMenuOpen(false); }}
                  >
                    <span className="subtab-icon-admain"></span>
                    Equipment Catalog
                    <span className="subtab-badge-admain">
                      {Object.values(config.equipmentPrices || {}).reduce((acc, items) => acc + (items?.filter(i => i.isActive !== false).length || 0), 0)}
                    </span>
                  </button>

                  <button
                    className={`subtab-btn-admain ${activeConfigTab === 'apps' ? 'active-admain' : ''}`}
                    onClick={() => { setActiveConfigTab('apps'); setIsSubMenuOpen(false); }}
                  >
                    <span className="subtab-icon-admain"></span>
                    App Management
                  </button>
                </div>
              </div>

              <button className="reset-config-btn-admain" onClick={openResetModal} disabled={savingConfig}>
                <FaTools /> Reset to Defaults
              </button>
            </div>

            {/* Equipment Tab Content */}
            {activeConfigTab === 'equipment' && (
              <div className="equipment-catalog-admain">
                <div className="form-group-admain">
                  <label>Pre-Assessment Fee</label>
                  <div className="input-group-admain">
                    <span>₱</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={config.assessmentFee || 1500}
                      onChange={(e) => setConfig({
                        ...config, assessmentFee:
                          e.target.value === ""
                            ? ""
                            : Number(e.target.value)
                      })}
                    />
                  </div>
                </div>

                <EquipmentSection title="Solar Panels" type="solarPanels" items={config.equipmentPrices?.solarPanels} />
                <EquipmentSection title="Inverters" type="inverters" items={config.equipmentPrices?.inverters} />
                <EquipmentSection title="Batteries" type="batteries" items={config.equipmentPrices?.batteries} />
                <EquipmentSection title="Mounting Structures" type="mountingStructures" items={config.equipmentPrices?.mountingStructures} />
                <EquipmentSection title="Electrical Components" type="electricalComponents" items={config.equipmentPrices?.electricalComponents} />
                <EquipmentSection title="Cables & Wiring" type="cablesAndWiring" items={config.equipmentPrices?.cablesAndWiring} />
                <EquipmentSection title="Safety Equipment" type="safetyEquipment" items={config.equipmentPrices?.safetyEquipment} />
                <EquipmentSection title="Junction Boxes" type="junctionBoxes" items={config.equipmentPrices?.junctionBoxes} />
                <EquipmentSection title="Disconnect Switches" type="disconnectSwitches" items={config.equipmentPrices?.disconnectSwitches} />
                <EquipmentSection title="Meters" type="meters" items={config.equipmentPrices?.meters} />

                <h4>Labor Rates</h4>
                <div className="form-row-admain">
                  <div className="form-group-admain">
                    <label>Per kW Installation (₱)</label>
                    <input type="number" min="0" step="100" value={config.laborRates?.perKw || 5000} onChange={(e) => updateNestedValue(
                      'laborRates.perKw',
                      e.target.value === ""
                        ? ""
                        : Number(e.target.value)
                    )} />
                  </div>
                  <div className="form-group-admain">
                    <label>Per Panel Installation (₱)</label>
                    <input type="number" min="0" step="100" value={config.laborRates?.perPanel || 1000} onChange={(e) => updateNestedValue(
                      'laborRates.perPanel',
                      e.target.value === ""
                        ? ""
                        : Number(e.target.value)
                    )} />
                  </div>
                  <div className="form-group-admain">
                    <label>Minimum Labor Fee (₱)</label>
                    <input type="number" min="0" step="100" value={config.laborRates?.minimumFee || 10000} onChange={(e) => updateNestedValue(
                      'laborRates.minimumFee',
                      e.target.value === ""
                        ? ""
                        : Number(e.target.value)
                    )} />
                  </div>
                </div>

                <button className="save-config-btn-admain" onClick={() => handleConfigSave({
                  assessmentFee: config.assessmentFee,
                  equipmentPrices: config.equipmentPrices,
                  laborRates: config.laborRates
                })} disabled={savingConfig}>
                  <FaSave /> Save Equipment Catalog
                </button>
              </div>
            )}

            {activeConfigTab === 'apps' && (
              <div className="config-section-admain">
                <AppManagement
                  config={config}
                  onConfigUpdate={fetchSystemConfig}
                  savingConfig={savingConfig}
                />
              </div>
            )}
          </div>
        )}

        {/* Equipment Modal with Enhanced Validation */}
        {showEquipmentModal && (
          <div className="modal-overlay-admain" onClick={() => setShowEquipmentModal(false)}>
            <div className="modal-content-admain" onClick={e => e.stopPropagation()}>
              <div className="modal-header-admain">
                <h3>{editingItem ? 'Edit' : 'Add'} {equipmentType?.slice(0, -1)}</h3>
              </div>
              <div className="modal-body-admain">
                {/* Name */}
                <div className="form-group-admain">
                  <label>Name *</label>
                  <input 
                    type="text" 
                    value={equipmentForm.name} 
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })}
                    className={equipmentErrors.name ? 'error-admain' : ''}
                    placeholder="Enter equipment name"
                    maxLength="100"
                  />
                  {equipmentErrors.name && <span className="error-text-admain">{equipmentErrors.name}</span>}
                 
                </div>

                {/* Price */}
                <div className="form-group-admain">
                  <label>Price *</label>
                  <input 
                    type="text"
                    inputMode="decimal"
                    value={equipmentForm.price} 
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      setEquipmentForm({ ...equipmentForm, price: value });
                    }}
                    className={equipmentErrors.price ? 'error-admain' : ''}
                    placeholder="Enter price"
                  />
                  {equipmentErrors.price && <span className="error-text-admain">{equipmentErrors.price}</span>}
                  
                </div>

                {/* Brand */}
                <div className="form-group-admain">
                  <label>Brand *</label>
                  <input 
                    type="text" 
                    value={equipmentForm.brand} 
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, brand: e.target.value })}
                    className={equipmentErrors.brand ? 'error-admain' : ''}
                    placeholder="Enter brand name"
                    maxLength="50"
                  />
                  {equipmentErrors.brand && <small className="error-text-admain">{equipmentErrors.brand}</small>}
                 
                </div>

                {/* Capacity */}
                <div className="form-row-admain">
                  <div className="form-group-admain">
                    <label>Capacity *</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={equipmentForm.capacity.value}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        setEquipmentForm({
                          ...equipmentForm,
                          capacity: {
                            ...equipmentForm.capacity,
                            value: value
                          }
                        });
                      }}
                      className={equipmentErrors['capacity.value'] ? 'error-admain' : ''}
                      placeholder="Enter capacity"
                    />
                    {equipmentErrors['capacity.value'] && <small className="error-text-admain">{equipmentErrors['capacity.value']}</small>}
                    
                  </div>

                  <div className="form-group-admain">
                    <label>Capacity Unit *</label>
                    <select
                      value={equipmentForm.capacity.unit}
                      onChange={(e) =>
                        setEquipmentForm({
                          ...equipmentForm,
                          capacity: {
                            ...equipmentForm.capacity,
                            unit: e.target.value
                          }
                        })
                      }
                      className={equipmentErrors.unit ? 'error-admain' : ''}
                    >
                      {equipmentType === "solarPanels" && (
                        <option value="W">W</option>
                      )}
                      {equipmentType === "inverters" && (
                        <option value="kW">kW</option>
                      )}
                      {equipmentType === "batteries" && (
                        <option value="kWh">kWh</option>
                      )}
                      {!["solarPanels", "inverters", "batteries"].includes(equipmentType) && (
                        <option value="">N/A</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Solar Panels - Panel Area */}
                {equipmentType === "solarPanels" && (
                  <div className="form-group-admain">
                    <label>Panel Area (m²) *</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={equipmentForm.panelArea}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        setEquipmentForm({
                          ...equipmentForm,
                          panelArea: value
                        });
                      }}
                      className={equipmentErrors.panelArea ? 'error-admain' : ''}
                      placeholder="Enter panel area in m²"
                    />
                    {equipmentErrors.panelArea && <small className="error-text-admain">{equipmentErrors.panelArea}</small>}
                   
                  </div>
                )}

                {/* Batteries - DoD */}
                {equipmentType === "batteries" && (
                  <div className="form-group-admain">
                    <label>Depth of Discharge (DoD) % *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={equipmentForm.dob}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setEquipmentForm({
                          ...equipmentForm,
                          dob: value
                        });
                      }}
                      className={equipmentErrors.dob ? 'error-admain' : ''}
                      placeholder="e.g., 80"
                    />
                    {equipmentErrors.dob && <small className="error-text-admain">{equipmentErrors.dob}</small>}
                    
                  </div>
                )}

                {/* Unit and Warranty */}
                <div className="form-row-admain">
                  <div className="form-group-admain">
                    <label>Unit *</label>
                    <select
                      value={equipmentForm.unit}
                      onChange={(e) =>
                        setEquipmentForm({
                          ...equipmentForm,
                          unit: e.target.value
                        })
                      }
                      className={equipmentErrors.unit ? 'error-admain' : ''}
                    >
                      <option value="piece">Piece</option>
                      <option value="set">Set</option>
                      <option value="meter">Meter</option>
                      <option value="roll">Roll</option>
                      <option value="box">Box</option>
                    </select>
                    {equipmentErrors.unit && <small className="error-text-admain">{equipmentErrors.unit}</small>}
                  </div>
                  <div className="form-group-admain">
                    <label>Warranty (years) *</label>
                    <input 
                      type="text"
                      inputMode="numeric"
                      value={equipmentForm.warranty} 
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setEquipmentForm({ ...equipmentForm, warranty: value });
                      }}
                      className={equipmentErrors.warranty ? 'error-admain' : ''}
                      placeholder="Enter warranty years"
                    />
                    {equipmentErrors.warranty && <small className="error-text-admain">{equipmentErrors.warranty}</small>}
                    
                  </div>
                </div>

                {/* Notes */}
                <div className="form-group-admain">
                  <label>Notes</label>
                  <textarea
                    rows="2"
                    value={equipmentForm.notes}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, notes: e.target.value })}
                    placeholder="Optional notes about this equipment"
                    maxLength="500"
                  />
                 
                </div>
              </div>
              <div className="modal-actions-admain">
                <button className="btn-cancel-admain" onClick={() => setShowEquipmentModal(false)}>Cancel</button>
                <button className="btn-confirm-admain" onClick={editingItem ? handleUpdateEquipment : handleAddEquipment} disabled={savingConfig}>
                  {savingConfig ? <FaSpinner className="spinner-admain" /> : <FaCheckCircle />} {editingItem ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reason Modal for Config Save */}
        {showReasonModal && (
          <div className="modal-overlay-admain" onClick={() => setShowReasonModal(false)}>
            <div className="modal-content-admain" onClick={e => e.stopPropagation()}>
              <div className="modal-header-admain">
                <h3>Reason for Update</h3>
              </div>
              <div className="modal-body-admain">
                <div className="form-group-admain">
                  <label>Reason *</label>
                  <textarea 
                    rows="3" 
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)} 
                    placeholder="Enter reason for these changes..." 
                  />
                  {!reason.trim() && <small className="error-text-admain">Reason is required</small>}
                </div>
              </div>
              <div className="modal-actions-admain">
                <button className="btn-cancel-admain" onClick={() => setShowReasonModal(false)}>Cancel</button>
                <button className="btn-confirm-admain" onClick={confirmConfigSave} disabled={savingConfig}>
                  {savingConfig ? <FaSpinner className="spinner-admain" /> : <FaCheckCircle />} Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reset Confirmation Modal */}
        {showResetModal && (
          <div className="modal-overlay-admain" onClick={() => setShowResetModal(false)}>
            <div className="modal-content-admain" onClick={e => e.stopPropagation()}>
              <div className="modal-header-admain">
                <h3>Reset to Defaults</h3>
              </div>
              <div className="modal-body-admain">
                <p>Are you sure you want to reset all settings to defaults? This action cannot be undone.</p>
                <div className="form-group-admain">
                  <label>Reason for reset *</label>
                  <textarea 
                    rows="2" 
                    value={resetReason} 
                    onChange={(e) => setResetReason(e.target.value)} 
                    placeholder="Enter reason for resetting..." 
                  />
                  {!resetReason.trim() && <small className="error-text-admain">Reason is required</small>}
                </div>
              </div>
              <div className="modal-actions-admain">
                <button className="btn-cancel-admain" onClick={() => setShowResetModal(false)}>Cancel</button>
                <button className="btn-confirm-admain" onClick={confirmResetConfig} disabled={savingConfig}>
                  {savingConfig ? <FaSpinner className="spinner-admain" /> : <FaCheckCircle />} Confirm Reset
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Remove Equipment Confirmation Modal */}
        {showRemoveModal && itemToRemove && (
          <div className="modal-overlay-admain" onClick={() => setShowRemoveModal(false)}>
            <div className="modal-content-admain" onClick={e => e.stopPropagation()}>
              <div className="modal-header-admain">
                <h3>Remove Equipment</h3>
              </div>
              <div className="modal-body-admain">
                <p>Are you sure you want to remove <strong>{itemToRemove.item.name}</strong>? This will hide it from selection.</p>
                <div className="form-group-admain">
                  <label>Reason for removal *</label>
                  <textarea 
                    rows="2" 
                    value={removeReason} 
                    onChange={(e) => setRemoveReason(e.target.value)} 
                    placeholder="Enter reason for removing this item..." 
                  />
                  {!removeReason.trim() && <small className="error-text-admain">Reason is required</small>}
                </div>
              </div>
              <div className="modal-actions-admain">
                <button className="btn-cancel-admain" onClick={() => setShowRemoveModal(false)}>Cancel</button>
                <button className="btn-confirm-admain btn-danger-admain" onClick={confirmRemoveEquipment} disabled={savingConfig}>
                  {savingConfig ? <FaSpinner className="spinner-admain" /> : <FaTrash />} Confirm Remove
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