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
  FaWifi,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaUpload,
  FaDownload,
  FaTools,
  FaTimes,
  FaSave,
  FaUserCheck,
  FaInfoCircle,
  FaUserCog,
  FaMicrochip,
  FaThermometerHalf,
  FaTint,
  FaSun,
  FaMapMarkerAlt,
  FaBatteryFull,
  FaBatteryThreeQuarters,
  FaBatteryHalf,
  FaBatteryQuarter,
  FaSignal,
  FaHistory,
  FaChartLine
} from 'react-icons/fa';
import '../../styles/Admin/iotdevice.css';
import { useToast, ToastNotification } from '../../assets/toastnotification';

const IoTDevice = () => {
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalMode, setModalMode] = useState('view');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    deviceName: '',
    model: '',
    manufacturer: 'Salfer Engineering',
    serialNumber: '',
    firmwareVersion: '1.0.0',
    maintenanceType: 'calibration',
    maintenanceNotes: ''
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
        params: { status: filter === 'all' ? undefined : filter, page: currentPage, limit: 12 }
      });
      setDevices(response.data.devices || []);
      setTotalPages(response.data.totalPages || 1);
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

  const handleMaintenance = async () => {
    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/admin/devices/${selectedDevice._id}`,
        {
          status: 'maintenance',
          maintenanceHistory: [
            ...(selectedDevice.maintenanceHistory || []),
            {
              type: formData.maintenanceType,
              notes: formData.maintenanceNotes,
              date: new Date()
            }
          ]
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast('Device marked for maintenance', 'success');
      setShowMaintenanceModal(false);
      setSelectedDevice(null);
      fetchDevices();
      fetchStats();
    } catch (error) {
      console.error('Error updating maintenance:', error);
      showToast('Failed to update device status', 'error');
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
      maintenanceType: 'calibration',
      maintenanceNotes: ''
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

  const openMaintenanceModal = (device) => {
    setSelectedDevice(device);
    setShowMaintenanceModal(true);
  };

  const openDeleteModal = (device) => {
    setSelectedDevice(device);
    setShowDeleteModal(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      'available': <span className="status-badge-adminiot available-adminiot">Available</span>,
      'assigned': <span className="status-badge-adminiot assigned-adminiot">Assigned</span>,
      'deployed': <span className="status-badge-adminiot deployed-adminiot">Deployed</span>,
      'maintenance': <span className="status-badge-adminiot maintenance-adminiot">Maintenance</span>
    };
    return badges[status] || <span className="status-badge-adminiot">{status}</span>;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  if (loading && devices.length === 0) {
    return (
      <div className="admin-iot-adminiot">
        <ToastNotification
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          position="bottom-left"
        />
        <div className="iot-header-adminiot">
          <div>
            <div className="skeleton-line-adminiot large-adminiot"></div>
            <div className="skeleton-line-adminiot medium-adminiot"></div>
          </div>
          <div className="skeleton-button-adminiot"></div>
        </div>
        <div className="stats-cards-adminiot">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="stat-card-adminiot skeleton-card-adminiot">
              <div className="skeleton-line-adminiot small-adminiot"></div>
              <div className="skeleton-line-adminiot large-adminiot"></div>
            </div>
          ))}
        </div>
        <div className="filters-section-adminiot">
          <div className="skeleton-select-adminiot"></div>
          <div className="skeleton-search-adminiot"></div>
        </div>
        <div className="devices-grid-adminiot">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="device-card-adminiot skeleton-card-adminiot">
              <div className="skeleton-line-adminiot medium-adminiot"></div>
              <div className="skeleton-line-adminiot small-adminiot"></div>
              <div className="skeleton-line-adminiot tiny-adminiot"></div>
              <div className="skeleton-badge-adminiot"></div>
              <div className="skeleton-button-group-adminiot">
                <div className="skeleton-button-adminiot small-adminiot"></div>
                <div className="skeleton-button-adminiot small-adminiot"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>IoT Device Management | Admin | Salfer Engineering</title>
      </Helmet>

      <div className="admin-iot-adminiot">
        <ToastNotification
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          position="bottom-left"
        />
        
        {/* Header */}
        <div className="iot-header-adminiot">
          <div>
            <h1>IoT Device Management</h1>
            <p>Monitor and manage IoT devices</p>
          </div>
          <button className="create-device-btn-adminiot" onClick={() => { setModalMode('create'); resetForm(); setShowDeviceModal(true); }}>
            <FaPlus /> Add New Device
          </button>
        </div>

        {/* Stats Cards - 4 statuses only */}
        <div className="stats-cards-adminiot">
          <div className="stat-card-adminiot total-adminiot">
            <div className="stat-info-adminiot">
              <span className="stat-value-adminiot">{stats.total || 0}</span>
              <span className="stat-label-adminiot">Total Devices</span>
            </div>
          </div>
          <div className="stat-card-adminiot available-adminiot">
            <div className="stat-info-adminiot">
              <span className="stat-value-adminiot">{stats.available || 0}</span>
              <span className="stat-label-adminiot">Available</span>
            </div>
          </div>
          <div className="stat-card-adminiot assigned-adminiot">
            <div className="stat-info-adminiot">
              <span className="stat-value-adminiot">{stats.assigned || 0}</span>
              <span className="stat-label-adminiot">Assigned</span>
            </div>
          </div>
          <div className="stat-card-adminiot deployed-adminiot">
            <div className="stat-info-adminiot">
              <span className="stat-value-adminiot">{stats.deployed || 0}</span>
              <span className="stat-label-adminiot">Deployed</span>
            </div>
          </div>
          <div className="stat-card-adminiot maintenance-adminiot">
            <div className="stat-info-adminiot">
              <span className="stat-value-adminiot">{stats.maintenance || 0}</span>
              <span className="stat-label-adminiot">Maintenance</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section-adminiot">
          <div className="filter-group-adminiot">
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Devices</option>
              <option value="available">Available</option>
              <option value="assigned">Assigned</option>
              <option value="deployed">Deployed</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <div className="search-group-adminiot">
            <FaSearch className="search-icon-adminiot" />
            <input 
              type="text" 
              placeholder="Search by ID, name, model, or serial..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        {/* Devices Grid - Simple Cards without sensor data */}
        <div className="devices-grid-adminiot">
          {filteredDevices.length === 0 ? (
            <div className="empty-state-adminiot">
              <FaMicrochip className="empty-icon-adminiot" />
              <p>No devices found</p>
            </div>
          ) : (
            filteredDevices.map(device => (
              <div key={device._id} className="device-card-adminiot">
                <div className="device-header-adminiot">
                  <div className="device-icon-adminiot">
                    <FaMicrochip />
                  </div>
                  <div className="device-info-adminiot">
                    <h3>{device.deviceName}</h3>
                    <span className="device-id-adminiot">{device.deviceId}</span>
                  </div>
                  {getStatusBadge(device.status)}
                </div>

                <div className="device-specs-adminiot">
                  <div className="spec-item-adminiot">
                    <span className="spec-label-adminiot">Model</span>
                    <span className="spec-value-adminiot">{device.model}</span>
                  </div>
                  <div className="spec-item-adminiot">
                    <span className="spec-label-adminiot">Firmware</span>
                    <span className="spec-value-adminiot">v{device.firmwareVersion}</span>
                  </div>
                  <div className="spec-item-adminiot">
                    <span className="spec-label-adminiot">Serial</span>
                    <span className="spec-value-adminiot">{device.serialNumber || '—'}</span>
                  </div>
                  <div className="spec-item-adminiot">
                    <span className="spec-label-adminiot">Created</span>
                    <span className="spec-value-adminiot">{formatDate(device.createdAt)}</span>
                  </div>
                </div>

                <div className="device-actions-adminiot">
                  <button className="action-btn-adminiot view-adminiot" onClick={() => openViewModal(device)} title="View Details">
                    <FaEye />
                  </button>
                  {(device.status === 'available' || device.status === 'maintenance') && (
                    <button className="action-btn-adminiot edit-adminiot" onClick={() => openEditModal(device)} title="Edit">
                      <FaEdit />
                    </button>
                  )}
                  {device.status !== 'retired' && device.status !== 'assigned' && device.status !== 'deployed' && device.status !== 'available' && (
                    <button className="action-btn-adminiot maintenance-btn-adminiot" onClick={() => openMaintenanceModal(device)} title="Maintenance">
                      <FaTools />
                    </button>
                  )}
                  {device.status === 'available' && (
                    <button className="action-btn-adminiot delete-adminiot" onClick={() => openDeleteModal(device)} title="Delete">
                      <FaTrash />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination-adminiot">
            <button className="page-btn-adminiot" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
              <FaChevronLeft /> Previous
            </button>
            <span className="page-info-adminiot">Page {currentPage} of {totalPages}</span>
            <button className="page-btn-adminiot" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              Next <FaChevronRight />
            </button>
          </div>
        )}

        {/* Device Modal (Create/Edit/View) - RETAINED */}
        {showDeviceModal && (
          <div className="modal-overlay-adminiot" onClick={() => setShowDeviceModal(false)}>
            <div className="modal-content-adminiot" onClick={e => e.stopPropagation()}>
              <button className="modal-close-adminiot" onClick={() => setShowDeviceModal(false)}>×</button>
              <h3>{modalMode === 'create' ? 'Add New Device' : modalMode === 'edit' ? 'Edit Device' : 'Device Details'}</h3>
              {modalMode === 'view' && selectedDevice ? (
                <div className="device-details-view-adminiot">
                  <div className="detail-section-adminiot">
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
                    <div className="detail-section-adminiot">
                      <h4>Maintenance History</h4>
                      {selectedDevice.maintenanceHistory.map((record, idx) => (
                        <div key={idx} className="maintenance-record-adminiot">
                          <p><strong>{record.type}:</strong> {record.notes}</p>
                          <small>{formatDate(record.date)}</small>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="device-form-adminiot">
                  <div className="form-group-adminiot">
                    <label>Device Name *</label>
                    <input 
                      type="text" 
                      value={formData.deviceName} 
                      onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })} 
                      placeholder="e.g., IoT Sensor 01" 
                    />
                  </div>
                  <div className="form-row-adminiot">
                    <div className="form-group-adminiot">
                      <label>Model *</label>
                      <input 
                        type="text" 
                        value={formData.model} 
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })} 
                        placeholder="e.g., ESP32-S3" 
                      />
                    </div>
                    <div className="form-group-adminiot">
                      <label>Manufacturer</label>
                      <input 
                        type="text" 
                        value={formData.manufacturer} 
                        onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })} 
                        placeholder="Salfer Engineering" 
                      />
                    </div>
                  </div>
                  <div className="form-row-adminiot">
                    <div className="form-group-adminiot">
                      <label>Serial Number</label>
                      <input 
                        type="text" 
                        value={formData.serialNumber} 
                        onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })} 
                        placeholder="Enter serial number" 
                      />
                    </div>
                    <div className="form-group-adminiot">
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
              <div className="modal-actions-adminiot">
                <button className="cancel-btn-adminiot" onClick={() => setShowDeviceModal(false)}>Cancel</button>
                {(modalMode === 'create' || modalMode === 'edit') && (
                  <button className="save-btn-adminiot" onClick={modalMode === 'create' ? handleCreateDevice : handleUpdateDevice} disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Device'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedDevice && (
          <div className="modal-overlay-adminiot" onClick={() => setShowDeleteModal(false)}>
            <div className="modal-content-adminiot delete-modal-adminiot" onClick={e => e.stopPropagation()}>
              <button className="modal-close-adminiot" onClick={() => setShowDeleteModal(false)}>×</button>
              <div className="delete-icon-container-adminiot">
                <FaExclamationTriangle className="delete-warning-icon-adminiot" />
              </div>
              <h3>Confirm Delete</h3>
              <p>Are you sure you want to delete this device?</p>
              <div className="device-info-delete-adminiot">
                <p><strong>Device Name:</strong> {selectedDevice.deviceName}</p>
                <p><strong>Device ID:</strong> {selectedDevice.deviceId}</p>
                <p><strong>Model:</strong> {selectedDevice.model}</p>
              </div>
              <p className="delete-warning-text-adminiot">This action cannot be undone. This will permanently delete the device and all its associated data.</p>
              <div className="modal-actions-adminiot">
                <button className="cancel-btn-adminiot" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button className="delete-btn-adminiot" onClick={handleDeleteDevice} disabled={isSubmitting}>
                  {isSubmitting ? <FaSpinner className="spinning" /> : <FaTrash />}
                  {isSubmitting ? 'Deleting...' : 'Delete Device'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Maintenance Modal */}
        {showMaintenanceModal && selectedDevice && (
          <div className="modal-overlay-adminiot" onClick={() => setShowMaintenanceModal(false)}>
            <div className="modal-content-adminiot" onClick={e => e.stopPropagation()}>
              <button className="modal-close-adminiot" onClick={() => setShowMaintenanceModal(false)}>×</button>
              <h3>Device Maintenance</h3>
              <p><strong>Device:</strong> {selectedDevice.deviceId} - {selectedDevice.deviceName}</p>
              <div className="form-group-adminiot">
                <label>Maintenance Type</label>
                <select value={formData.maintenanceType} onChange={(e) => setFormData({ ...formData, maintenanceType: e.target.value })}>
                  <option value="calibration">Calibration</option>
                  <option value="repair">Repair</option>
                  <option value="battery_replacement">Battery Replacement</option>
                  <option value="firmware_update">Firmware Update</option>
                </select>
              </div>
              <div className="form-group-adminiot">
                <label>Notes</label>
                <textarea 
                  rows="3" 
                  value={formData.maintenanceNotes} 
                  onChange={(e) => setFormData({ ...formData, maintenanceNotes: e.target.value })} 
                  placeholder="Describe maintenance performed..." 
                />
              </div>
              <div className="modal-actions-adminiot">
                <button className="cancel-btn-adminiot" onClick={() => setShowMaintenanceModal(false)}>Cancel</button>
                <button className="maintenance-btn-adminiot" onClick={handleMaintenance} disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Mark for Maintenance'}
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