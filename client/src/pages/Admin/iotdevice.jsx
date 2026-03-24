// pages/Admin/IoTDevice.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import {
  FaMicrochip,
  FaSearch,
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
  FaSpinner,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
  FaBatteryFull,
  FaBatteryHalf,
  FaBatteryQuarter,
  FaBatteryEmpty,
  FaWifi,
  FaSignal,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSync,
  FaDownload,
  FaUpload,
  FaHistory,
  FaTools,
  FaChartLine,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaTimes,
  FaSave,
  FaUndo
} from 'react-icons/fa';
import '../../styles/Admin/iotDevice.css';

const IoTDevice = () => {
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [modalMode, setModalMode] = useState('view');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [preAssessments, setPreAssessments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    deviceName: '',
    model: '',
    manufacturer: 'Salfer Engineering',
    serialNumber: '',
    firmwareVersion: '1.0.0',
    preAssessmentId: '',
    deploymentNotes: '',
    maintenanceType: 'calibration',
    maintenanceNotes: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    deployed: 0,
    maintenance: 0,
    retired: 0
  });

  useEffect(() => {
    fetchDevices();
    fetchStats();
    fetchAvailablePreAssessments();
  }, [filter, currentPage]);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/devices`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: filter === 'all' ? undefined : filter, page: currentPage, limit: 10 }
      });
      setDevices(response.data.devices || []);
      setTotalPages(response.data.totalPages || 1);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching devices:', error);
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

  const fetchAvailablePreAssessments = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments?assessmentStatus=scheduled`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPreAssessments(response.data.assessments || []);
    } catch (error) {
      console.error('Error fetching pre-assessments:', error);
    }
  };

  const handleCreateDevice = async () => {
    if (!formData.deviceName || !formData.model) {
      alert('Please fill in device name and model');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/devices`,
        {
          deviceName: formData.deviceName,
          model: formData.model,
          manufacturer: formData.manufacturer,
          serialNumber: formData.serialNumber,
          firmwareVersion: formData.firmwareVersion
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Device created successfully!');
      setShowDeviceModal(false);
      resetForm();
      fetchDevices();
      fetchStats();
    } catch (error) {
      console.error('Error creating device:', error);
      alert(error.response?.data?.message || 'Failed to create device');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDevice = async () => {
    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.put(
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

      alert('Device updated successfully!');
      setShowDeviceModal(false);
      setSelectedDevice(null);
      fetchDevices();
    } catch (error) {
      console.error('Error updating device:', error);
      alert(error.response?.data?.message || 'Failed to update device');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDevice = async () => {
    if (!window.confirm('Are you sure you want to delete this device? This action cannot be undone.')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/devices/${selectedDevice._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Device deleted successfully!');
      setShowDeviceModal(false);
      setSelectedDevice(null);
      fetchDevices();
      fetchStats();
    } catch (error) {
      console.error('Error deleting device:', error);
      alert(error.response?.data?.message || 'Failed to delete device');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeployDevice = async () => {
    if (!formData.preAssessmentId) {
      alert('Please select a pre-assessment to deploy this device');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/pre-assessments/${formData.preAssessmentId}/deploy-device`,
        { deviceId: selectedDevice._id, notes: formData.deploymentNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Device deployed successfully!');
      setShowDeployModal(false);
      setSelectedDevice(null);
      setFormData({ ...formData, preAssessmentId: '', deploymentNotes: '' });
      fetchDevices();
      fetchStats();
    } catch (error) {
      console.error('Error deploying device:', error);
      alert(error.response?.data?.message || 'Failed to deploy device');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetrieveDevice = async (device) => {
    if (!window.confirm(`Are you sure you want to retrieve device ${device.deviceId}?`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/pre-assessments/${device.currentPreAssessmentId}/retrieve-device`,
        { notes: 'Device retrieved by admin' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Device retrieved successfully!');
      fetchDevices();
      fetchStats();
    } catch (error) {
      console.error('Error retrieving device:', error);
      alert(error.response?.data?.message || 'Failed to retrieve device');
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
            ...selectedDevice.maintenanceHistory,
            {
              type: formData.maintenanceType,
              notes: formData.maintenanceNotes,
              performedBy: req.user.id,
              date: new Date()
            }
          ]
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Device marked for maintenance');
      setShowMaintenanceModal(false);
      setSelectedDevice(null);
      fetchDevices();
      fetchStats();
    } catch (error) {
      console.error('Error updating maintenance:', error);
      alert('Failed to update device status');
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
      preAssessmentId: '',
      deploymentNotes: '',
      maintenanceType: 'calibration',
      maintenanceNotes: ''
    });
  };

  const openEditModal = (device) => {
    setSelectedDevice(device);
    setFormData({
      deviceName: device.deviceName,
      model: device.model,
      manufacturer: device.manufacturer,
      serialNumber: device.serialNumber || '',
      firmwareVersion: device.firmwareVersion,
      preAssessmentId: '',
      deploymentNotes: '',
      maintenanceType: 'calibration',
      maintenanceNotes: ''
    });
    setModalMode('edit');
    setShowDeviceModal(true);
  };

  const openViewModal = (device) => {
    setSelectedDevice(device);
    setModalMode('view');
    setShowDeviceModal(true);
  };

  const openDeployModal = (device) => {
    setSelectedDevice(device);
    setShowDeployModal(true);
  };

  const openMaintenanceModal = (device) => {
    setSelectedDevice(device);
    setShowMaintenanceModal(true);
  };

  const getBatteryIcon = (level) => {
    if (level >= 75) return <FaBatteryFull className="battery-high" />;
    if (level >= 50) return <FaBatteryHalf className="battery-medium" />;
    if (level >= 25) return <FaBatteryQuarter className="battery-low" />;
    return <FaBatteryEmpty className="battery-critical" />;
  };

  const getStatusBadge = (status) => {
    const badges = {
      'available': <span className="status-badge available"><FaCheckCircle /> Available</span>,
      'deployed': <span className="status-badge deployed"><FaUpload /> Deployed</span>,
      'maintenance': <span className="status-badge maintenance"><FaTools /> Maintenance</span>,
      'retired': <span className="status-badge retired">Retired</span>
    };
    return badges[status] || <span className="status-badge">{status}</span>;
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
      <div className="iot-loading">
        <FaSpinner className="spinner" />
        <p>Loading IoT devices...</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>IoT Device Management | Admin | Salfer Engineering</title>
      </Helmet>

      <div className="iot-device-management">
        <div className="iot-header">
          <div>
            <h1><FaMicrochip /> IoT Device Management</h1>
            <p>Manage IoT devices, track deployments, and monitor device health</p>
          </div>
          <button className="create-device-btn" onClick={() => { setModalMode('create'); resetForm(); setShowDeviceModal(true); }}>
            <FaPlus /> Add New Device
          </button>
        </div>

        <div className="iot-stats">
          <div className="stat-card total">
            <div className="stat-icon"><FaMicrochip /></div>
            <div className="stat-info"><span className="stat-value">{stats.total}</span><span className="stat-label">Total Devices</span></div>
          </div>
          <div className="stat-card available">
            <div className="stat-icon"><FaCheckCircle /></div>
            <div className="stat-info"><span className="stat-value">{stats.active}</span><span className="stat-label">Available</span></div>
          </div>
          <div className="stat-card deployed">
            <div className="stat-icon"><FaUpload /></div>
            <div className="stat-info"><span className="stat-value">{stats.deployed}</span><span className="stat-label">Deployed</span></div>
          </div>
          <div className="stat-card maintenance">
            <div className="stat-icon"><FaTools /></div>
            <div className="stat-info"><span className="stat-value">{stats.maintenance}</span><span className="stat-label">Maintenance</span></div>
          </div>
        </div>

        <div className="iot-filters">
          <div className="filter-group">
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Devices</option>
              <option value="available">Available</option>
              <option value="deployed">Deployed</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
          </div>
          <div className="search-group">
            <FaSearch className="search-icon" />
            <input type="text" placeholder="Search by ID, name, model, or serial..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="iot-table-container">
          <table className="iot-table">
            <thead>
              <tr><th>Device ID</th><th>Name</th><th>Model</th><th>Firmware</th><th>Status</th><th>Battery</th><th>Last Heartbeat</th><th>Current Assessment</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filteredDevices.length === 0 ? (
                <tr><td colSpan="9" className="empty-state"><FaMicrochip className="empty-icon" /><p>No devices found</p></td></tr>
              ) : (
                filteredDevices.map(device => (
                  <tr key={device._id}>
                    <td className="device-id">{device.deviceId}</td>
                    <td><strong>{device.deviceName}</strong></td>
                    <td>{device.model}</td>
                    <td>v{device.firmwareVersion}</td>
                    <td>{getStatusBadge(device.status)}</td>
                    <td className="battery-cell">{getBatteryIcon(device.batteryLevel)} <span>{device.batteryLevel}%</span></td>
                    <td>{formatDate(device.lastHeartbeat)}</td>
                    <td>{device.currentPreAssessmentId ? (device.currentPreAssessmentId?.bookingReference || 'Active') : '—'}</td>
                    <td className="actions-cell">
                      <button className="action-btn view" onClick={() => openViewModal(device)} title="View Details"><FaEye /></button>
                      {device.status === 'available' && (<><button className="action-btn edit" onClick={() => openEditModal(device)} title="Edit"><FaEdit /></button><button className="action-btn deploy" onClick={() => openDeployModal(device)} title="Deploy"><FaUpload /></button></>)}
                      {device.status === 'deployed' && (<button className="action-btn retrieve" onClick={() => handleRetrieveDevice(device)} title="Retrieve"><FaDownload /></button>)}
                      {device.status !== 'retired' && (<button className="action-btn maintenance" onClick={() => openMaintenanceModal(device)} title="Maintenance"><FaTools /></button>)}
                      <button className="action-btn delete" onClick={() => { setSelectedDevice(device); if (window.confirm('Delete this device?')) handleDeleteDevice(); }} title="Delete"><FaTrash /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (<div className="pagination"><button className="page-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><FaChevronLeft /> Previous</button><span className="page-info">Page {currentPage} of {totalPages}</span><button className="page-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next <FaChevronRight /></button></div>)}

        {/* Device Modal (Create/Edit/View) */}
        {showDeviceModal && (
          <div className="modal-overlay" onClick={() => setShowDeviceModal(false)}>
            <div className="modal-content device-modal" onClick={e => e.stopPropagation()}>
              <h3>{modalMode === 'create' ? 'Add New Device' : modalMode === 'edit' ? 'Edit Device' : 'Device Details'}</h3>
              {modalMode === 'view' && selectedDevice ? (
                <div className="device-details-view">
                  <div className="detail-section"><h4>Device Information</h4><p><strong>Device ID:</strong> {selectedDevice.deviceId}</p><p><strong>Name:</strong> {selectedDevice.deviceName}</p><p><strong>Model:</strong> {selectedDevice.model}</p><p><strong>Manufacturer:</strong> {selectedDevice.manufacturer}</p><p><strong>Serial Number:</strong> {selectedDevice.serialNumber || '—'}</p><p><strong>Firmware:</strong> v{selectedDevice.firmwareVersion}</p><p><strong>Status:</strong> {getStatusBadge(selectedDevice.status)}</p><p><strong>Battery:</strong> {selectedDevice.batteryLevel}%</p><p><strong>Last Heartbeat:</strong> {formatDate(selectedDevice.lastHeartbeat)}</p></div>
                  <div className="detail-section"><h4>Deployment History</h4>{selectedDevice.deploymentHistory?.length > 0 ? selectedDevice.deploymentHistory.map((h, i) => (<div key={i} className="history-item"><p><strong>Deployed:</strong> {formatDate(h.deployedAt)}</p><p><strong>Retrieved:</strong> {formatDate(h.retrievedAt) || 'Still deployed'}</p><p><strong>Notes:</strong> {h.notes || '—'}</p></div>)) : <p>No deployment history</p>}</div>
                  <div className="detail-section"><h4>Maintenance History</h4>{selectedDevice.maintenanceHistory?.length > 0 ? selectedDevice.maintenanceHistory.map((m, i) => (<div key={i} className="history-item"><p><strong>Type:</strong> {m.type}</p><p><strong>Date:</strong> {formatDate(m.date)}</p><p><strong>Notes:</strong> {m.notes}</p></div>)) : <p>No maintenance history</p>}</div>
                </div>
              ) : (
                <div className="device-form">
                  <div className="form-group"><label>Device Name *</label><input type="text" value={formData.deviceName} onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })} placeholder="e.g., IoT Sensor 01" disabled={modalMode === 'edit' && selectedDevice?.status === 'deployed'} /></div>
                  <div className="form-row"><div className="form-group"><label>Model *</label><input type="text" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} placeholder="e.g., ESP32-S3" /></div><div className="form-group"><label>Manufacturer</label><input type="text" value={formData.manufacturer} onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })} placeholder="Salfer Engineering" /></div></div>
                  <div className="form-row"><div className="form-group"><label>Serial Number</label><input type="text" value={formData.serialNumber} onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })} placeholder="Enter serial number" /></div><div className="form-group"><label>Firmware Version</label><input type="text" value={formData.firmwareVersion} onChange={(e) => setFormData({ ...formData, firmwareVersion: e.target.value })} placeholder="1.0.0" /></div></div>
                  <div className="modal-actions"><button className="cancel-btn" onClick={() => setShowDeviceModal(false)}>Cancel</button>{(modalMode === 'create' || modalMode === 'edit') && (<button className="save-btn" onClick={modalMode === 'create' ? handleCreateDevice : handleUpdateDevice} disabled={isSubmitting}>{isSubmitting ? <><FaSpinner className="spinner" /> Saving...</> : <><FaSave /> Save Device</>}</button>)}</div>
                </div>
              )}
              {modalMode === 'view' && (<div className="modal-actions"><button className="cancel-btn" onClick={() => setShowDeviceModal(false)}>Close</button></div>)}
            </div>
          </div>
        )}

        {/* Deploy Modal */}
        {showDeployModal && selectedDevice && (
          <div className="modal-overlay" onClick={() => setShowDeployModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>Deploy Device</h3>
              <p><strong>Device:</strong> {selectedDevice.deviceId} - {selectedDevice.deviceName}</p>
              <div className="form-group"><label>Select Pre-Assessment *</label><select value={formData.preAssessmentId} onChange={(e) => setFormData({ ...formData, preAssessmentId: e.target.value })}><option value="">Select a scheduled pre-assessment...</option>{preAssessments.map(pa => (<option key={pa._id} value={pa._id}>{pa.bookingReference} - {pa.clientId?.contactFirstName} {pa.clientId?.contactLastName}</option>))}</select></div>
              <div className="form-group"><label>Deployment Notes (Optional)</label><textarea rows="3" value={formData.deploymentNotes} onChange={(e) => setFormData({ ...formData, deploymentNotes: e.target.value })} placeholder="Add notes about this deployment..." /></div>
              <div className="modal-actions"><button className="cancel-btn" onClick={() => setShowDeployModal(false)}>Cancel</button><button className="deploy-btn" onClick={handleDeployDevice} disabled={!formData.preAssessmentId || isSubmitting}>{isSubmitting ? <><FaSpinner className="spinner" /> Deploying...</> : 'Deploy Device'}</button></div>
            </div>
          </div>
        )}

        {/* Maintenance Modal */}
        {showMaintenanceModal && selectedDevice && (
          <div className="modal-overlay" onClick={() => setShowMaintenanceModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3>Device Maintenance</h3>
              <p><strong>Device:</strong> {selectedDevice.deviceId} - {selectedDevice.deviceName}</p>
              <div className="form-group"><label>Maintenance Type</label><select value={formData.maintenanceType} onChange={(e) => setFormData({ ...formData, maintenanceType: e.target.value })}><option value="calibration">Calibration</option><option value="repair">Repair</option><option value="battery_replacement">Battery Replacement</option></select></div>
              <div className="form-group"><label>Notes</label><textarea rows="3" value={formData.maintenanceNotes} onChange={(e) => setFormData({ ...formData, maintenanceNotes: e.target.value })} placeholder="Describe maintenance performed..." /></div>
              <div className="modal-actions"><button className="cancel-btn" onClick={() => setShowMaintenanceModal(false)}>Cancel</button><button className="maintenance-btn" onClick={handleMaintenance} disabled={isSubmitting}>{isSubmitting ? <><FaSpinner className="spinner" /> Updating...</> : 'Mark for Maintenance'}</button></div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default IoTDevice;