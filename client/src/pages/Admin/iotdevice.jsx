// pages/Admin/IoTDevice.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import {
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
  FaSpinner,
  FaChevronLeft,
  FaChevronRight,
  FaExclamationTriangle,
  FaMicrochip,
  FaChevronDown,
  FaSearch,
  FaSyncAlt,
  FaTimes,
  FaCheck
} from 'react-icons/fa';
import '../../styles/Admin/iotdevice.css';
import { useToast, ToastNotification } from '../../assets/toastnotification';

// Recharts Imports
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const IoTDevice = () => {
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalMode, setModalMode] = useState('view');

  // --- Tabs ---
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 20 });
  const buttonRefs = useRef({});
  const dropdownRef = useRef(null);
  const [formData, setFormData] = useState({
    deviceName: '',
    model: '',
    manufacturer: 'Salfer Engineering',
    serialNumber: '',
    firmwareVersion: '1.0.0',
    status: 'available'
  });
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    assigned: 0,
    deployed: 0,
    maintenance: 0
  });

  // --- CHART DATA (4 Separate Bars) ---
  const [chartData, setChartData] = useState([
    { name: 'Available', count: 0 },
    { name: 'Assigned', count: 0 },
    { name: 'Deployed', count: 0 },
    { name: 'Maintenance', count: 0 }
  ]);

  // Status options for dropdown
  const STATUS_OPTIONS = [
    { value: 'available', label: 'Available' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'deployed', label: 'Deployed' },
    { value: 'data_collecting', label: 'Data Collecting' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'retired', label: 'Retired' },
    { value: 'retrieved', label: 'Retrieved' }
  ];

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    const statusMap = {
      available: 'available',
      assigned: 'assigned',
      deployed: 'deployed',
      data_collecting: 'data_collecting',
      maintenance: 'maintenance',
      retired: 'retired',
      retrieved: 'retrieved'
    };
    return statusMap[status] || status;
  };

  useEffect(() => {
    fetchDevices();
    fetchStats();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    };

    const handleScroll = () => {
      setOpenDropdownId(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [activeTab, currentPage]);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/devices`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: activeTab === 'all' ? undefined : activeTab, page: currentPage, limit: itemsPerPage }
      });
      setDevices(response.data.devices || []);
      setTotalItems(response.data.total || 0);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching devices:', error);
      showToast(error.response?.data?.message || 'Failed to fetch devices', 'error');
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/devices/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.stats);

      // Update chart data to 4 separate bars based on real stats
      const s = response.data.stats;
      setChartData([
        { name: 'Available', count: s.available || 0 },
        { name: 'Assigned', count: s.assigned || 0 },
        { name: 'Deployed', count: s.deployed || 0 },
        { name: 'Maintenance', count: s.maintenance || 0 }
      ]);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateDevice = async () => {
    if (!formData.deviceName || !formData.model) {
      showToast('Please fill in device name and model', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/devices`,
        {
          deviceName: formData.deviceName,
          model: formData.model,
          manufacturer: formData.manufacturer,
          serialNumber: formData.serialNumber,
          firmwareVersion: formData.firmwareVersion
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast('Device created successfully!', 'success');
      setShowDeviceModal(false);
      resetForm();
      fetchDevices();
      fetchStats();
    } catch (error) {
      console.error('Error creating device:', error);
      showToast(error.response?.data?.message || 'Failed to create device', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDevice = async () => {
    // Validate form
    if (!formData.deviceName || !formData.model) {
      showToast('Device name and model are required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');

      // Check if status is being changed
      const statusChanged = formData.status !== selectedDevice.status;

      const payload = {
        deviceName: formData.deviceName,
        model: formData.model,
        manufacturer: formData.manufacturer,
        serialNumber: formData.serialNumber,
        firmwareVersion: formData.firmwareVersion
      };

      // Only include status if it's changed and allowed
      if (statusChanged) {
        // Don't allow changing status of deployed/assigned devices
        if (['deployed', 'data_collecting'].includes(selectedDevice.status)) {
          showToast(`Cannot change status of a ${selectedDevice.status} device`, 'error');
          setIsSubmitting(false);
          return;
        }
        payload.status = formData.status;
      }

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/admin/devices/${selectedDevice._id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast('Device updated successfully!', 'success');
      setShowDeviceModal(false);
      setSelectedDevice(null);
      resetForm();
      fetchDevices();
      fetchStats();
    } catch (error) {
      console.error('Error updating device:', error);
      showToast(error.response?.data?.message || 'Failed to update device', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDevice = async () => {
    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/devices/${selectedDevice._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showToast('Device deleted successfully!', 'success');
      setShowDeleteModal(false);
      setSelectedDevice(null);
      fetchDevices();
      fetchStats();
    } catch (error) {
      console.error('Error deleting device:', error);
      showToast(error.response?.data?.message || 'Failed to delete device', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      deviceName: '',
      model: '',
      manufacturer: 'Salfer Engineering',
      serialNumber: '',
      firmwareVersion: '1.0.0',
      status: 'available'
    });
  };

  const openEditModal = (device) => {
    setSelectedDevice(device);
    setFormData({
      deviceName: device.deviceName || '',
      model: device.model || '',
      manufacturer: device.manufacturer || 'Salfer Engineering',
      serialNumber: device.serialNumber || '',
      firmwareVersion: device.firmwareVersion || '1.0.0',
      status: device.status || 'available'
    });
    setModalMode('edit');
    setShowDeviceModal(true);
  };

  const openViewModal = (device) => {
    setSelectedDevice(device);
    setModalMode('view');
    setShowDeviceModal(true);
  };

  const openDeleteModal = (device) => {
    setSelectedDevice(device);
    setShowDeleteModal(true);
  };

  const handleDropdownClick = (event, deviceId) => {
    event.stopPropagation();
    const buttonRect = event.currentTarget.getBoundingClientRect();
    setDropdownPosition({
      top: buttonRect.bottom + 5,
      right: window.innerWidth - buttonRect.right - 10,
    });
    setOpenDropdownId(openDropdownId === deviceId ? null : deviceId);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      available: 'available',
      assigned: 'assigned',
      deployed: 'deployed',
      data_collecting: 'data_collecting',
      maintenance: 'maintenance',
      retired: 'retired',
      retrieved: 'retrieved'
    };
    const className = statusMap[status] || status;
    return <span className={`status-badge-iotdevice ${className}`}>
      {status ? status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ') : 'Unknown'}
    </span>;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get available actions for a device
  const getAvailableActions = (device) => {
    const actions = [
      { label: 'View', icon: <FaEye />, action: () => openViewModal(device), color: 'primary' }
    ];

    // Allow edit for available, maintenance, and retrieved devices
    if (['available', 'maintenance', 'retrieved'].includes(device.status)) {
      actions.push({
        label: 'Edit',
        icon: <FaEdit />,
        action: () => openEditModal(device),
        color: 'warning'
      });
    }

    // Allow delete only for available, maintenance, and retrieved devices
    if (['available', 'maintenance', 'retrieved'].includes(device.status)) {
      actions.push({
        label: 'Delete',
        icon: <FaTrash />,
        action: () => openDeleteModal(device),
        color: 'danger'
      });
    }

    return actions;
  };

  const filteredDevices = devices.filter(device => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return device.deviceId?.toLowerCase().includes(searchLower) ||
      device.deviceName?.toLowerCase().includes(searchLower) ||
      device.model?.toLowerCase().includes(searchLower) ||
      device.serialNumber?.toLowerCase().includes(searchLower);
  });

  // Calculate pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  /* --- Recharts Custom Tooltip --- */
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="recharts-custom-tooltip-iotdevice">
          <p className="tooltip-label-iotdevice">{label}</p>
          <p className="tooltip-item-iotdevice" style={{ color: payload[0].color }}>
            Count: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
  };

  if (loading && devices.length === 0) {
    return (
      <div className="iot-device-management">
        <div className="iot-header-iotdevice">
          <div className="skeleton-title-iotdevice"></div>
          <div className="skeleton-subtitle-iotdevice"></div>
        </div>
        <div className="iot-chart-area-iotdevice skeleton-chart-iotdevice"></div>
        <div className="iot-tabs-iotdevice">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton-tab-iotdevice"></div>)}
        </div>
        <div className="iot-toolbar-iotdevice">
          <div className="skeleton-search-iotdevice"></div>
          <div className="skeleton-button-iotdevice"></div>
        </div>
        <div className="iot-table-container-iotdevice">
          <div className="skeleton-table-iotdevice"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>IoT Device Management | Admin | Salfer Engineering</title>
      </Helmet>

      <div className="iot-device-management">
        <ToastNotification
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          position="bottom-left"
        />



        {/* --- CHART: 4 Separate Bars with Glass Gradients --- */}
        {/* --- CHART: 4 Separate Bars with Glass Gradients - LIGHT THEME --- */}
        <div className="iot-chart-area-iotdevice">
          <div className="iot-chart-header-iotdevice">
            <h3>Device Status Distribution</h3>
            <span className="iot-chart-period-iotdevice">Current Inventory</span>
          </div>
          <div className="iot-chart-wrapper-iotdevice">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {/* Gradients for Glass Effect - Light Theme */}
                  <linearGradient id="colorAvailable" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient id="colorAssigned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient id="colorDeployed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.2} />
                  </linearGradient>
                  <linearGradient id="colorMaintenance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#EEF0ED" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#17212B', fontSize: 12, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#17212B', fontSize: 12, fontWeight: 500 }}
                  width={40}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />

                {/* 4 Magkakahiwalay na Bar na may iba't ibang kulay */}
                <Bar dataKey="count" fill="url(#colorAvailable)" radius={[4, 4, 0, 0]} barSize={35} />

              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- TABS --- */}
        <div className="iot-tabs-iotdevice">
          <button
            className={`iot-tab-btn-iotdevice ${activeTab === 'all' ? 'active-iotdevice' : ''}`}
            onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
          >
            All Devices
            <span className="iot-tab-badge-iotdevice">{stats.total}</span>
          </button>
          <button
            className={`iot-tab-btn-iotdevice ${activeTab === 'available' ? 'active-iotdevice' : ''}`}
            onClick={() => { setActiveTab('available'); setCurrentPage(1); }}
          >
            Available
            <span className="iot-tab-badge-iotdevice">{stats.available}</span>
          </button>
          <button
            className={`iot-tab-btn-iotdevice ${activeTab === 'assigned' ? 'active-iotdevice' : ''}`}
            onClick={() => { setActiveTab('assigned'); setCurrentPage(1); }}
          >
            Assigned
            <span className="iot-tab-badge-iotdevice">{stats.assigned}</span>
          </button>
          <button
            className={`iot-tab-btn-iotdevice ${activeTab === 'deployed' ? 'active-iotdevice' : ''}`}
            onClick={() => { setActiveTab('deployed'); setCurrentPage(1); }}
          >
            Deployed
            <span className="iot-tab-badge-iotdevice">{stats.deployed}</span>
          </button>
          <button
            className={`iot-tab-btn-iotdevice ${activeTab === 'maintenance' ? 'active-iotdevice' : ''}`}
            onClick={() => { setActiveTab('maintenance'); setCurrentPage(1); }}
          >
            Maintenance
            <span className="iot-tab-badge-iotdevice">{stats.maintenance}</span>
          </button>
        </div>

        {/* --- TOOLBAR --- */}
        <div className="iot-toolbar-iotdevice">
          <div className="iot-search-group-iotdevice">
            <FaSearch className="iot-search-icon-iotdevice" />
            <input
              type="text"
              placeholder="Search by ID, name, model, or serial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="iot-search-input-iotdevice"
            />
            {searchTerm && (
              <button
                className="iot-clear-search-iotdevice"
                onClick={clearSearch}
                type="button"
              >
                <FaTimes />
              </button>
            )}
          </div>
          <button className="iot-create-btn-iotdevice" onClick={() => { setModalMode('create'); resetForm(); setShowDeviceModal(true); }}>
            <FaPlus /> Add New Device
          </button>
        </div>

        {/* --- TABLE --- */}
        <div className="iot-table-container-iotdevice">
          <div className="iot-table-wrapper-iotdevice">
            <table className="iot-device-table-iotdevice">
              <thead>
                <tr>
                  <th>Device</th>
                  <th>Model</th>
                  <th>Serial</th>
                  <th>Firmware</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th style={{ width: '140px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="iot-empty-state-iotdevice">
                      <FaMicrochip className="empty-icon" />
                      <p>No devices found</p>
                      {searchTerm && <span>Try adjusting your search</span>}
                    </td>
                  </tr>
                ) : (
                  filteredDevices.map(device => {
                    const actions = getAvailableActions(device);
                    const isOpen = openDropdownId === device._id;

                    return (
                      <tr key={device._id} className={`device-row-${device.status}`}>
                        <td>
                          <div className="iot-device-cell-iotdevice">
                            <FaMicrochip className="iot-device-icon-table-iotdevice" />
                            <div>
                              <div className="iot-device-name-iotdevice">{device.deviceName}</div>
                              <div className="iot-device-id-iotdevice">{device.deviceId}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="iot-model-cell-iotdevice">
                            <span>{device.model}</span>
                            {device.manufacturer && (
                              <span className="iot-manufacturer-text-iotdevice">{device.manufacturer}</span>
                            )}
                          </div>
                        </td>
                        <td>{device.serialNumber || '—'}</td>
                        <td>v{device.firmwareVersion}</td>
                        <td>{getStatusBadge(device.status)}</td>
                        <td>{formatDate(device.createdAt)}</td>
                        <td style={{ textAlign: 'center' }}>
                          {actions.length === 1 ? (
                            <button
                              className={`iot-single-action-btn-iotdevice ${actions[0].color}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                actions[0].action();
                              }}
                              title={`View ${device.deviceName}`}
                            >
                              {actions[0].icon} {actions[0].label}
                            </button>
                          ) : (
                            <div className="iot-action-dropdown-container-iotdevice">
                              <button
                                className="iot-action-dropdown-toggle-iotdevice"
                                ref={el => buttonRefs.current[device._id] = el}
                                onClick={(e) => handleDropdownClick(e, device._id)}
                              >
                                Actions <FaChevronDown className={`iot-dropdown-arrow-iotdevice ${isOpen ? 'open-iotdevice' : ''}`} />
                              </button>

                              {isOpen && (
                                <div
                                  className="iot-action-dropdown-menu-iotdevice"
                                  ref={dropdownRef}
                                  style={{
                                    position: 'fixed',
                                    top: dropdownPosition.top,
                                    right: dropdownPosition.right,
                                    zIndex: 9999,
                                  }}
                                >
                                  {actions.map((action, idx) => (
                                    <button
                                      key={idx}
                                      className={`iot-dropdown-item-iotdevice ${action.color}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        action.action();
                                        setOpenDropdownId(null);
                                      }}
                                    >
                                      {action.icon} <span>{action.label}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- Pagination --- */}
        {totalPages > 1 && (
          <div className="iot-pagination-iotdevice">
            <div className="iot-pagination-info-iotdevice">
              Showing {startItem} to {endItem} of {totalItems} entries
            </div>
            <div className="iot-pagination-controls-iotdevice">
              <button
                className="iot-page-btn-iotdevice"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <FaChevronLeft /> Previous
              </button>

              {getPageNumbers().map(page => (
                <button
                  key={page}
                  className={`iot-page-number-iotdevice ${currentPage === page ? 'active-iotdevice' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

              <button
                className="iot-page-btn-iotdevice"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next <FaChevronRight />
              </button>
            </div>
          </div>
        )}

        {/* --- DEVICE MODAL (Create/Edit/View) --- */}
        {showDeviceModal && (
          <div className="iot-modal-overlay-iotdevice" onClick={() => setShowDeviceModal(false)}>
            <div className={`iot-modal-content-iotdevice ${modalMode}`} onClick={e => e.stopPropagation()}>
              <div className="iot-modal-header-iotdevice">
                <h3>
                  {modalMode === 'create' && 'Add New Device'}
                  {modalMode === 'edit' && 'Edit Device'}
                  {modalMode === 'view' && 'Device Details'}
                </h3>
                <button
                  className="iot-modal-close-btn-iotdevice"
                  onClick={() => setShowDeviceModal(false)}
                  type="button"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="iot-modal-body-iotdevice">
                {modalMode === 'view' && selectedDevice ? (
                  <div className="iot-device-details-view-iotdevice">
                    <div className="iot-detail-section-iotdevice">
                      <h4>Device Information</h4>
                      <div className="iot-detail-grid-iotdevice">
                        <div className="iot-detail-item">
                          <label>Device ID</label>
                          <p><strong>{selectedDevice.deviceId}</strong></p>
                        </div>
                        <div className="iot-detail-item">
                          <label>Device Name</label>
                          <p>{selectedDevice.deviceName}</p>
                        </div>
                        <div className="iot-detail-item">
                          <label>Model</label>
                          <p>{selectedDevice.model}</p>
                        </div>
                        <div className="iot-detail-item">
                          <label>Manufacturer</label>
                          <p>{selectedDevice.manufacturer || 'N/A'}</p>
                        </div>
                        <div className="iot-detail-item">
                          <label>Serial Number</label>
                          <p>{selectedDevice.serialNumber || '—'}</p>
                        </div>
                        <div className="iot-detail-item">
                          <label>Firmware Version</label>
                          <p>v{selectedDevice.firmwareVersion}</p>
                        </div>
                        <div className="iot-detail-item">
                          <label>Status</label>
                          <p>{getStatusBadge(selectedDevice.status)}</p>
                        </div>
                        <div className="iot-detail-item">
                          <label>Created</label>
                          <p>{formatDate(selectedDevice.createdAt)}</p>
                        </div>
                        <div className="iot-detail-item">
                          <label>Last Updated</label>
                          <p>{formatDate(selectedDevice.updatedAt)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Assigned Information */}
                    {selectedDevice.assignedToEngineerId && (
                      <div className="iot-detail-section-iotdevice">
                        <h4>Assignment Information</h4>
                        <div className="iot-detail-grid-iotdevice">
                          <div className="iot-detail-item">
                            <label>Assigned Engineer</label>
                            <p>{selectedDevice.assignedToEngineerId?.name || 'N/A'}</p>
                          </div>
                          {selectedDevice.assignedToPreAssessmentId && (
                            <div className="iot-detail-item">
                              <label>Assessment Reference</label>
                              <p>{selectedDevice.assignedToPreAssessmentId?.bookingReference || 'N/A'}</p>
                            </div>
                          )}
                          {selectedDevice.assignedAt && (
                            <div className="iot-detail-item">
                              <label>Assigned At</label>
                              <p>{formatDate(selectedDevice.assignedAt)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Deployment History */}
                    {selectedDevice.deploymentHistory?.length > 0 && (
                      <div className="iot-detail-section-iotdevice">
                        <h4>Deployment History</h4>
                        {selectedDevice.deploymentHistory.slice(-5).map((record, idx) => (
                          <div key={idx} className="iot-timeline-item-iotdevice">
                            <div className="timeline-dot"></div>
                            <div className="timeline-content">
                              {record.assignedAt && (
                                <p><strong>Assigned:</strong> {formatDate(record.assignedAt)}</p>
                              )}
                              {record.deployedAt && (
                                <p><strong>Deployed:</strong> {formatDate(record.deployedAt)}</p>
                              )}
                              {record.retrievedAt && (
                                <p><strong>Retrieved:</strong> {formatDate(record.retrievedAt)}</p>
                              )}
                              {record.notes && (
                                <p className="timeline-notes"><strong>Notes:</strong> {record.notes}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Maintenance History */}
                    {selectedDevice.maintenanceHistory?.length > 0 && (
                      <div className="iot-detail-section-iotdevice">
                        <h4>Maintenance History</h4>
                        {selectedDevice.maintenanceHistory.map((record, idx) => (
                          <div key={idx} className="iot-maintenance-record-iotdevice">
                            <p><strong>{record.type || 'Maintenance'}:</strong> {record.notes}</p>
                            <small>{formatDate(record.date)}</small>
                            {record.performedBy?.name && (
                              <small> by {record.performedBy.name}</small>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Alerts */}
                    {selectedDevice.alerts?.length > 0 && (
                      <div className="iot-detail-section-iotdevice">
                        <h4>Recent Alerts</h4>
                        {selectedDevice.alerts.slice(-5).map((alert, idx) => (
                          <div key={idx} className={`iot-alert-item-iotdevice ${alert.type || 'info'}`}>
                            <FaExclamationTriangle />
                            <div>
                              <p>{alert.message}</p>
                              <small>{formatDate(alert.createdAt)}</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="iot-device-form-iotdevice">
                    <div className="iot-form-group-iotdevice">
                      <label>Device Name *</label>
                      <input
                        type="text"
                        value={formData.deviceName}
                        onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
                        placeholder="e.g., IoT Sensor 01"
                        className="iot-form-input-iotdevice"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="iot-form-row-iotdevice">
                      <div className="iot-form-group-iotdevice">
                        <label>Model *</label>
                        <input
                          type="text"
                          value={formData.model}
                          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                          placeholder="e.g., ESP32-S3"
                          className="iot-form-input-iotdevice"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="iot-form-group-iotdevice">
                        <label>Manufacturer</label>
                        <input
                          type="text"
                          value={formData.manufacturer}
                          onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                          placeholder="Salfer Engineering"
                          className="iot-form-input-iotdevice"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                    <div className="iot-form-row-iotdevice">
                      <div className="iot-form-group-iotdevice">
                        <label>Serial Number</label>
                        <input
                          type="text"
                          value={formData.serialNumber}
                          onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                          placeholder="Enter serial number"
                          className="iot-form-input-iotdevice"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="iot-form-group-iotdevice">
                        <label>Firmware Version</label>
                        <input
                          type="text"
                          value={formData.firmwareVersion}
                          onChange={(e) => setFormData({ ...formData, firmwareVersion: e.target.value })}
                          placeholder="1.0.0"
                          className="iot-form-input-iotdevice"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    {/* Status Dropdown - Only show in Edit mode */}
                    {modalMode === 'edit' && (
                      <div className="iot-form-group-iotdevice">
                        <label>Status</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="iot-form-select-iotdevice"
                          disabled={isSubmitting || ['deployed', 'data_collecting'].includes(selectedDevice?.status)}
                        >
                          {STATUS_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {['deployed', 'data_collecting'].includes(selectedDevice?.status) && (
                          <small className="iot-status-warning-iotdevice">
                            <FaExclamationTriangle /> Status cannot be changed for {selectedDevice?.status} devices
                          </small>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="iot-modal-actions-iotdevice">
                <button
                  className="iot-cancel-btn-iotdevice"
                  onClick={() => setShowDeviceModal(false)}
                  disabled={isSubmitting}
                >
                  {modalMode === 'view' ? 'Close' : 'Cancel'}
                </button>
                {(modalMode === 'create' || modalMode === 'edit') && (
                  <button
                    className="iot-save-btn-iotdevice"
                    onClick={modalMode === 'create' ? handleCreateDevice : handleUpdateDevice}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <FaSpinner className="iot-spinning-iotdevice" />
                        {modalMode === 'create' ? 'Creating...' : 'Updating...'}
                      </>
                    ) : (
                      <>
                        <FaCheck />
                        {modalMode === 'create' ? 'Create Device' : 'Update Device'}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- DELETE MODAL --- */}
        {showDeleteModal && selectedDevice && (
          <div className="iot-modal-overlay-iotdevice" onClick={() => setShowDeleteModal(false)}>
            <div className="iot-modal-content-iotdevice delete-modal-iotdevice" onClick={e => e.stopPropagation()}>
              <div className="iot-modal-header-iotdevice">
                <h3 className="text-danger">Confirm Delete</h3>
                <button
                  className="iot-modal-close-btn-iotdevice"
                  onClick={() => setShowDeleteModal(false)}
                  type="button"
                  disabled={isSubmitting}
                >
                  <FaTimes />
                </button>
              </div>
              <div className="iot-modal-body-iotdevice">
                <div className="iot-delete-icon-container-iotdevice">
                  <FaExclamationTriangle className="iot-delete-warning-icon-iotdevice" />
                </div>
                <p className="iot-delete-message-iotdevice">
                  Are you sure you want to permanently delete this device?
                </p>
                <div className="iot-device-info-delete-iotdevice">
                  <div className="delete-info-row">
                    <span className="delete-label">Device Name:</span>
                    <span className="delete-value">{selectedDevice.deviceName}</span>
                  </div>
                  <div className="delete-info-row">
                    <span className="delete-label">Device ID:</span>
                    <span className="delete-value">{selectedDevice.deviceId}</span>
                  </div>
                  <div className="delete-info-row">
                    <span className="delete-label">Model:</span>
                    <span className="delete-value">{selectedDevice.model}</span>
                  </div>
                  <div className="delete-info-row">
                    <span className="delete-label">Status:</span>
                    <span className="delete-value">{getStatusBadge(selectedDevice.status)}</span>
                  </div>
                </div>
                <div className="iot-delete-warning-text-iotdevice">
                  <FaExclamationTriangle className="warning-icon" />
                  <p>This action cannot be undone. This will permanently delete the device and all its associated data.</p>
                </div>
              </div>
              <div className="iot-modal-actions-iotdevice">
                <button
                  className="iot-cancel-btn-iotdevice"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  className="iot-delete-btn-iotdevice"
                  onClick={handleDeleteDevice}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <FaSpinner className="iot-spinning-iotdevice" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FaTrash />
                      Delete Permanently
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default IoTDevice;