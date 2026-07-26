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
  FaSyncAlt
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
    firmwareVersion: '1.0.0'
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
      showToast('Failed to fetch devices', 'error');
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
    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/admin/devices/${selectedDevice._id}`,
        {
          deviceName: formData.deviceName,
          model: formData.model,
          manufacturer: formData.manufacturer,
          serialNumber: formData.serialNumber,
          firmwareVersion: formData.firmwareVersion
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast('Device updated successfully!', 'success');
      setShowDeviceModal(false);
      setSelectedDevice(null);
      fetchDevices();
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
      firmwareVersion: '1.0.0'
    });
  };

  const openEditModal = (device) => {
    setSelectedDevice(device);
    setFormData({
      ...formData,
      deviceName: device.deviceName,
      model: device.model,
      manufacturer: device.manufacturer,
      serialNumber: device.serialNumber || '',
      firmwareVersion: device.firmwareVersion
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
    return <span className={`status-badge-iotdevice ${status}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
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

    if (device.status === 'available' || device.status === 'maintenance') {
      actions.push({ 
        label: 'Edit', 
        icon: <FaEdit />, 
        action: () => openEditModal(device), 
        color: 'warning' 
      });
    }

    if (device.status === 'available') {
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
        
        {/* --- Minimalist Header --- */}
        <div className="iot-header-iotdevice">
          <div></div>
        </div>

        {/* --- CHART: 4 Separate Bars with Glass Gradients --- */}
        <div className="iot-chart-area-iotdevice">
          <div className="iot-chart-header-iotdevice">
            <h3>Device Status Distribution</h3>
            <span className="iot-chart-period-iotdevice">Current Inventory</span>
          </div>
          <div className="iot-chart-wrapper-iotdevice">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {/* Gradients for Glass Effect */}
                  <linearGradient id="colorAvailable" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
                  </linearGradient>
                  <linearGradient id="colorAssigned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.2}/>
                  </linearGradient>
                  <linearGradient id="colorDeployed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.2}/>
                  </linearGradient>
                  <linearGradient id="colorMaintenance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#6B7280', fontSize: 12}} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#6B7280', fontSize: 12}} 
                  width={30} 
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{stroke: '#D1D5DB', strokeWidth: 1}} />
                
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
            />
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
                  <tr><td colSpan="7" className="iot-empty-state-iotdevice">No devices found</td></tr>
                ) : (
                  filteredDevices.map(device => {
                    const actions = getAvailableActions(device);
                    const isOpen = openDropdownId === device._id;

                    return (
                      <tr key={device._id}>
                        <td>
                          <div className="iot-device-cell-iotdevice">
                            <FaMicrochip className="iot-device-icon-table-iotdevice" />
                            <div>
                              <div className="iot-device-name-iotdevice">{device.deviceName}</div>
                              <div className="iot-device-id-iotdevice">{device.deviceId}</div>
                            </div>
                          </div>
                        </td>
                        <td>{device.model}</td>
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

        {/* --- DEVICE MODAL --- */}
        {showDeviceModal && (
          <div className="iot-modal-overlay-iotdevice" onClick={() => setShowDeviceModal(false)}>
            <div className="iot-modal-content-iotdevice" onClick={e => e.stopPropagation()}>
              <div className="iot-modal-header-iotdevice">
                <h3>{modalMode === 'create' ? 'Add New Device' : modalMode === 'edit' ? 'Edit Device' : 'Device Details'}</h3>
              </div>
              
              {modalMode === 'view' && selectedDevice ? (
                <div className="iot-device-details-view-iotdevice">
                  <div className="iot-detail-section-iotdevice">
                    <h4>Device Information</h4>
                    <p><strong>Device ID:</strong> {selectedDevice.deviceId}</p>
                    <p><strong>Name:</strong> {selectedDevice.deviceName}</p>
                    <p><strong>Model:</strong> {selectedDevice.model}</p>
                    <p><strong>Manufacturer:</strong> {selectedDevice.manufacturer}</p>
                    <p><strong>Serial Number:</strong> {selectedDevice.serialNumber || '—'}</p>
                    <p><strong>Firmware:</strong> v{selectedDevice.firmwareVersion}</p>
                    <p><strong>Status:</strong> {getStatusBadge(selectedDevice.status)}</p>
                    <p><strong>Created:</strong> {formatDate(selectedDevice.createdAt)}</p>
                    <p><strong>Last Updated:</strong> {formatDate(selectedDevice.updatedAt)}</p>
                  </div>
                  {selectedDevice.maintenanceHistory?.length > 0 && (
                    <div className="iot-detail-section-iotdevice">
                      <h4>Maintenance History</h4>
                      {selectedDevice.maintenanceHistory.map((record, idx) => (
                        <div key={idx} className="iot-maintenance-record-iotdevice">
                          <p><strong>{record.type}:</strong> {record.notes}</p>
                          <small>{formatDate(record.date)}</small>
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
                      />
                    </div>
                    <div className="iot-form-group-iotdevice">
                      <label>Manufacturer</label>
                      <input 
                        type="text" 
                        value={formData.manufacturer} 
                        onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })} 
                        placeholder="Salfer Engineering" 
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
                      />
                    </div>
                    <div className="iot-form-group-iotdevice">
                      <label>Firmware Version</label>
                      <input 
                        type="text" 
                        value={formData.firmwareVersion} 
                        onChange={(e) => setFormData({ ...formData, firmwareVersion: e.target.value })} 
                        placeholder="1.0.0" 
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="iot-modal-actions-iotdevice">
                <button className="iot-cancel-btn-iotdevice" onClick={() => setShowDeviceModal(false)}>Cancel</button>
                {(modalMode === 'create' || modalMode === 'edit') && (
                  <button className="iot-save-btn-iotdevice" onClick={modalMode === 'create' ? handleCreateDevice : handleUpdateDevice} disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Device'}
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
                <h3>Confirm Delete</h3>
              </div>
              <div className="iot-delete-icon-container-iotdevice">
                <FaExclamationTriangle className="iot-delete-warning-icon-iotdevice" />
              </div>
              <p className="iot-delete-message-iotdevice">Are you sure you want to delete this device?</p>
              <div className="iot-device-info-delete-iotdevice">
                <p><strong>Device Name:</strong> {selectedDevice.deviceName}</p>
                <p><strong>Device ID:</strong> {selectedDevice.deviceId}</p>
                <p><strong>Model:</strong> {selectedDevice.model}</p>
              </div>
              <p className="iot-delete-warning-text-iotdevice">This action cannot be undone. This will permanently delete the device and all its associated data.</p>
              <div className="iot-modal-actions-iotdevice">
                <button className="iot-cancel-btn-iotdevice" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button className="iot-delete-btn-iotdevice" onClick={handleDeleteDevice} disabled={isSubmitting}>
                  {isSubmitting ? <FaSpinner className="iot-spinning-iotdevice" /> : <FaTrash />}
                  {isSubmitting ? 'Deleting...' : 'Delete Device'}
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