// pages/Admin/IoTDevice.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import {
  FaSearch,
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
  FaSpinner,
  FaChevronLeft,
  FaChevronRight,
  FaExclamationTriangle,
  FaMicrochip
} from 'react-icons/fa';
import '../../styles/Admin/iotdevice.css';
import { useToast, ToastNotification } from '../../assets/toastnotification';

const IoTDevice = () => {
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalMode, setModalMode] = useState('view');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  useEffect(() => {
    fetchDevices();
    fetchStats();
  }, [filter, currentPage]);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/devices`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: filter === 'all' ? undefined : filter, page: currentPage, limit: itemsPerPage }
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

  const getStatusBadge = (status) => {
    const badges = {
      'available': <span className="status-badge-iot available">Available</span>,
      'assigned': <span className="status-badge-iot assigned">Assigned</span>,
      'deployed': <span className="status-badge-iot deployed">Deployed</span>,
      'maintenance': <span className="status-badge-iot maintenance">Maintenance</span>
    };
    return badges[status] || <span className="status-badge-iot">{status}</span>;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  if (loading && devices.length === 0) {
    return (
      <div className="admin-iot">
        <ToastNotification
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          position="bottom-left"
        />
        <div className="iot-header">
          <div>
            <div className="skeleton-line large"></div>
            <div className="skeleton-line medium"></div>
          </div>
          <div className="skeleton-button"></div>
        </div>
        <div className="iot-tabs">
          <div className="skeleton-tab"></div>
          <div className="skeleton-tab"></div>
          <div className="skeleton-tab"></div>
          <div className="skeleton-tab"></div>
          <div className="skeleton-tab"></div>
        </div>
        <div className="filters-section">
          <div className="skeleton-select"></div>
          <div className="skeleton-search"></div>
        </div>
        <div className="table-container">
          <div className="skeleton-table"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>IoT Device Management | Admin | Salfer Engineering</title>
      </Helmet>

      <div className="admin-iot">
        <ToastNotification
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          position="bottom-left"
        />
        
        {/* Header */}
        <div className="iot-header">
          <div>
            <h1>IoT Device Management</h1>
            <p>Monitor and manage IoT devices</p>
          </div>
          <button className="create-device-btn" onClick={() => { setModalMode('create'); resetForm(); setShowDeviceModal(true); }}>
            <FaPlus /> Add New Device
          </button>
        </div>

        {/* Tabs */}
        <div className="iot-tabs">
          <button 
            className={`tab-btn ${filter === 'all' ? 'active' : ''}`} 
            onClick={() => { setFilter('all'); setCurrentPage(1); }}
          >
            All Devices
            <span className="tab-badge">{stats.total}</span>
          </button>
          <button 
            className={`tab-btn ${filter === 'available' ? 'active' : ''}`} 
            onClick={() => { setFilter('available'); setCurrentPage(1); }}
          >
            Available
            <span className="tab-badge">{stats.available}</span>
          </button>
          <button 
            className={`tab-btn ${filter === 'assigned' ? 'active' : ''}`} 
            onClick={() => { setFilter('assigned'); setCurrentPage(1); }}
          >
            Assigned
            <span className="tab-badge">{stats.assigned}</span>
          </button>
          <button 
            className={`tab-btn ${filter === 'deployed' ? 'active' : ''}`} 
            onClick={() => { setFilter('deployed'); setCurrentPage(1); }}
          >
            Deployed
            <span className="tab-badge">{stats.deployed}</span>
          </button>
          <button 
            className={`tab-btn ${filter === 'maintenance' ? 'active' : ''}`} 
            onClick={() => { setFilter('maintenance'); setCurrentPage(1); }}
          >
            Maintenance
            <span className="tab-badge">{stats.maintenance}</span>
          </button>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <select value={filter} onChange={(e) => { setFilter(e.target.value); setCurrentPage(1); }}>
              <option value="all">All Devices</option>
              <option value="available">Available</option>
              <option value="assigned">Assigned</option>
              <option value="deployed">Deployed</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <div className="search-group">
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by ID, name, model, or serial..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <div className="table-wrapper">
            <table className="device-table">
              <thead>
                <tr>
                  <th>Device</th>
                  <th>Model</th>
                  <th>Serial</th>
                  <th>Firmware</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.length === 0 ? (
                  <tr><td colSpan="7" className="empty-state">No devices found</td></tr>
                ) : (
                  filteredDevices.map(device => (
                    <tr key={device._id}>
                      <td>
                        <div className="device-cell">
                          <FaMicrochip className="device-icon-table" />
                          <div>
                            <div className="device-name">{device.deviceName}</div>
                            <div className="device-id">{device.deviceId}</div>
                          </div>
                        </div>
                      </td>
                      <td>{device.model}</td>
                      <td>{device.serialNumber || '—'}</td>
                      <td>v{device.firmwareVersion}</td>
                      <td>{getStatusBadge(device.status)}</td>
                      <td>{formatDate(device.createdAt)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="action-buttons">
                          <button className="action-btn view" onClick={() => openViewModal(device)} title="View Details">
                            <FaEye />
                          </button>
                          {(device.status === 'available' || device.status === 'maintenance') && (
                            <button className="action-btn edit" onClick={() => openEditModal(device)} title="Edit">
                              <FaEdit />
                            </button>
                          )}
                          {device.status === 'available' && (
                            <button className="action-btn delete" onClick={() => openDeleteModal(device)} title="Delete">
                              <FaTrash />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <div className="pagination-info">
              Showing {startItem} to {endItem} of {totalItems} entries
            </div>
            <div className="pagination-controls">
              <button 
                className="page-btn" 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                disabled={currentPage === 1}
              >
                <FaChevronLeft /> Previous
              </button>
              
              {getPageNumbers().map(page => (
                <button
                  key={page}
                  className={`page-number ${currentPage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              
              <button 
                className="page-btn" 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                disabled={currentPage === totalPages}
              >
                Next <FaChevronRight />
              </button>
            </div>
          </div>
        )}

        {/* Device Modal (Create/Edit/View) */}
        {showDeviceModal && (
          <div className="modal-overlay" onClick={() => setShowDeviceModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowDeviceModal(false)}>×</button>
              <h3>{modalMode === 'create' ? 'Add New Device' : modalMode === 'edit' ? 'Edit Device' : 'Device Details'}</h3>
              {modalMode === 'view' && selectedDevice ? (
                <div className="device-details-view">
                  <div className="detail-section">
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
                    <div className="detail-section">
                      <h4>Maintenance History</h4>
                      {selectedDevice.maintenanceHistory.map((record, idx) => (
                        <div key={idx} className="maintenance-record">
                          <p><strong>{record.type}:</strong> {record.notes}</p>
                          <small>{formatDate(record.date)}</small>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="device-form">
                  <div className="form-group">
                    <label>Device Name *</label>
                    <input 
                      type="text" 
                      value={formData.deviceName} 
                      onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })} 
                      placeholder="e.g., IoT Sensor 01" 
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Model *</label>
                      <input 
                        type="text" 
                        value={formData.model} 
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })} 
                        placeholder="e.g., ESP32-S3" 
                      />
                    </div>
                    <div className="form-group">
                      <label>Manufacturer</label>
                      <input 
                        type="text" 
                        value={formData.manufacturer} 
                        onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })} 
                        placeholder="Salfer Engineering" 
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Serial Number</label>
                      <input 
                        type="text" 
                        value={formData.serialNumber} 
                        onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })} 
                        placeholder="Enter serial number" 
                      />
                    </div>
                    <div className="form-group">
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
              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowDeviceModal(false)}>Cancel</button>
                {(modalMode === 'create' || modalMode === 'edit') && (
                  <button className="save-btn" onClick={modalMode === 'create' ? handleCreateDevice : handleUpdateDevice} disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Device'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedDevice && (
          <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
              <div className="delete-icon-container">
                <FaExclamationTriangle className="delete-warning-icon" />
              </div>
              <h3>Confirm Delete</h3>
              <p>Are you sure you want to delete this device?</p>
              <div className="device-info-delete">
                <p><strong>Device Name:</strong> {selectedDevice.deviceName}</p>
                <p><strong>Device ID:</strong> {selectedDevice.deviceId}</p>
                <p><strong>Model:</strong> {selectedDevice.model}</p>
              </div>
              <p className="delete-warning-text">This action cannot be undone. This will permanently delete the device and all its associated data.</p>
              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button className="delete-btn" onClick={handleDeleteDevice} disabled={isSubmitting}>
                  {isSubmitting ? <FaSpinner className="spinning" /> : <FaTrash />}
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