// pages/Engineer/IoTDevice.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import {
  FaSearch,
  FaEye,
  FaSpinner,
  FaChevronLeft,
  FaChevronRight,
  FaChartLine,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaMicrochip,
  FaBatteryFull,
  FaBatteryHalf,
  FaBatteryQuarter,
  FaBatteryEmpty,
  FaWifi,
  FaDownload,
  FaThermometerHalf,
  FaTachometerAlt,
  FaClock,
  FaSun,
  FaTint,
  FaChartArea,
  FaChartBar,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaArrowLeft,
  FaTools,
  FaPlug,
  FaPowerOff,
  FaTemperatureHigh,
  FaCloudSun,
  FaPercent,
  FaArrowCircleUp,
  FaBoxOpen
} from 'react-icons/fa';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar } from 'recharts';
import '../../styles/Engineer/iotdevice.css';

const IoTDevice = () => {
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [sensorData, setSensorData] = useState([]);
  const [sensorStats, setSensorStats] = useState({});
  const [showDataModal, setShowDataModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [gpsData, setGpsData] = useState(null);
  const [retrieving, setRetrieving] = useState(false);

  const getApiBaseUrl = () => {
    return import.meta.env.VITE_API_URL || '';
  };

  const API_BASE_URL = getApiBaseUrl();

  // ✅ IMPROVED: Calculate shading percentage using multiple methods
  const calculateShadingPercentage = (readings) => {
    if (!readings || readings.length === 0) return 0;
    
    // Method 1: Look for sudden drops in irradiance (typical of passing clouds/shading)
    let shadingEvents = 0;
    let totalReadings = 0;
    
    for (let i = 1; i < readings.length; i++) {
      const prevIrradiance = readings[i-1].irradiance || 0;
      const currIrradiance = readings[i].irradiance || 0;
      
      // Only consider during peak sun hours (9 AM - 3 PM)
      const hour = new Date(readings[i].timestamp).getHours();
      if (hour >= 9 && hour <= 15 && prevIrradiance > 200) {
        totalReadings++;
        // A drop of more than 30% in irradiance within a short time indicates shading
        if (prevIrradiance > 0 && currIrradiance < prevIrradiance * 0.7) {
          shadingEvents++;
        }
      }
    }
    
    const shadingByDrops = totalReadings > 0 ? (shadingEvents / totalReadings) * 100 : 0;
    
    // Method 2: Compare to theoretical maximum irradiance for the location
    // Peak irradiance in Philippines typically 800-1000 W/m²
    const maxPossibleIrradiance = 950; // Typical for tropical regions
    
    // Find the maximum irradiance recorded
    const maxRecorded = Math.max(...readings.map(r => r.irradiance || 0));
    
    // Calculate shading based on how far below theoretical max
    const theoreticalMax = maxPossibleIrradiance;
    const shadingByMax = theoreticalMax > 0 ? ((theoreticalMax - maxRecorded) / theoreticalMax) * 100 : 0;
    
    // Method 3: Look at variance in irradiance - high variance indicates intermittent shading
    const daylightReadings = readings.filter(r => {
      const hour = new Date(r.timestamp).getHours();
      return hour >= 8 && hour <= 16;
    });
    
    let variance = 0;
    if (daylightReadings.length > 0) {
      const avg = daylightReadings.reduce((sum, r) => sum + (r.irradiance || 0), 0) / daylightReadings.length;
      variance = daylightReadings.reduce((sum, r) => sum + Math.pow((r.irradiance || 0) - avg, 2), 0) / daylightReadings.length;
      const stdDev = Math.sqrt(variance);
      const cv = avg > 0 ? (stdDev / avg) * 100 : 0; // Coefficient of variation
      // High coefficient of variation (>30%) indicates shading
      const shadingByVariance = Math.min(70, Math.max(0, cv - 20));
      
      // Combine all methods with weights
      let finalShading = (shadingByDrops * 0.4) + (shadingByMax * 0.3) + (shadingByVariance * 0.3);
      
      // Ensure value is between 0 and 100
      finalShading = Math.min(100, Math.max(0, finalShading));
      
      
      
      return finalShading;
    }
    
    return shadingByDrops;
  };

  // ✅ IMPROVED: Calculate temperature derating
  const calculateTemperatureDerating = (readings) => {
    if (!readings || readings.length === 0) return 0;
    
    // Standard Temperature Coefficient for typical solar panels: -0.4% per °C above 25°C
    const TEMP_COEFFICIENT = 0.4; // Positive value for derating calculation
    const STC_TEMPERATURE = 25;
    
    // Get readings during peak sun hours (10 AM - 2 PM) when panels are hottest
    const peakHoursReadings = readings.filter(reading => {
      const hour = new Date(reading.timestamp).getHours();
      return hour >= 10 && hour <= 14;
    });
    
    if (peakHoursReadings.length === 0) return 0;
    
    // Calculate average temperature during peak hours
    const avgTemp = peakHoursReadings.reduce((sum, r) => sum + (r.temperature || 0), 0) / peakHoursReadings.length;
    
    // Calculate temperature difference above STC
    const tempDiff = Math.max(0, avgTemp - STC_TEMPERATURE);
    
    // Calculate derating: each °C above 25°C reduces efficiency by 0.4%
    const derating = tempDiff * TEMP_COEFFICIENT;
    
    
    
    return Math.min(30, derating); // Cap at 30% max derating
  };

  // ✅ IMPROVED: Calculate peak sun hours using integration
  const calculatePeakSunHours = (readings) => {
    if (!readings || readings.length < 2) return 0;
    
    // Sort readings by timestamp
    const sortedReadings = [...readings].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Only consider readings during daylight hours (6 AM - 6 PM)
    const daylightReadings = sortedReadings.filter(r => {
      const hour = new Date(r.timestamp).getHours();
      return hour >= 6 && hour <= 18;
    });
    
    if (daylightReadings.length < 2) return 0;
    
    let totalIrradianceKwh = 0;
    
    // Trapezoidal integration to calculate area under the curve
    for (let i = 0; i < daylightReadings.length - 1; i++) {
      const timeDiff = (new Date(daylightReadings[i + 1].timestamp) - new Date(daylightReadings[i].timestamp)) / (1000 * 60 * 60); // hours
      const avgIrradiance = ((daylightReadings[i].irradiance || 0) + (daylightReadings[i + 1].irradiance || 0)) / 2;
      totalIrradianceKwh += (avgIrradiance * timeDiff) / 1000; // Convert W/m² * hours to kWh/m²
    }
    
    // Peak sun hours = total kWh/m² (since 1 peak sun hour = 1000 W/m² for 1 hour)
    const peakSunHours = totalIrradianceKwh;
    
    
    
    return Math.max(0, peakSunHours);
  };

  useEffect(() => {
    fetchMyDevices();
  }, [currentPage]);

  useEffect(() => {
    if (autoRefresh && selectedDevice) {
      const interval = setInterval(() => {
        fetchSensorData(selectedDevice.assessmentId);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, selectedDevice]);

  const fetchMyDevices = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');

      if (!token) {
        showToast('Please login again to continue', 'error');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/pre-assessments/engineer/my-assessments`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const assessmentsWithDevices = (response.data.assessments || []).filter(
        assessment => assessment.iotDeviceId &&
          (assessment.assessmentStatus === 'device_deployed' || 
           assessment.assessmentStatus === 'data_collecting')
      );

      const deviceList = assessmentsWithDevices.map(assessment => ({
        _id: assessment.iotDeviceId._id,
        deviceId: assessment.iotDeviceId.deviceId,
        deviceName: assessment.iotDeviceId.deviceName,
        model: assessment.iotDeviceId.model,
        status: assessment.iotDeviceId.status,
        batteryLevel: assessment.iotDeviceId.batteryLevel || 100,
        lastHeartbeat: assessment.iotDeviceId.lastHeartbeat,
        assessmentId: assessment._id,
        assessmentStatus: assessment.assessmentStatus,
        bookingReference: assessment.bookingReference,
        clientName: `${assessment.clientId?.contactFirstName || ''} ${assessment.clientId?.contactLastName || ''}`,
        propertyType: assessment.propertyType,
        address: assessment.addressId,
        deployedAt: assessment.deviceDeployedAt,
        dataCollectionStart: assessment.dataCollectionStart,
        dataCollectionEnd: assessment.dataCollectionEnd
      }));

      setDevices(deviceList);
      setTotalPages(Math.ceil(deviceList.length / 10));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching devices:', error);

      let errorMessage = 'Failed to fetch your devices. ';
      if (error.response?.status === 401) {
        errorMessage += 'Authentication failed. Please login again.';
      } else if (error.response?.status === 404) {
        errorMessage += 'API endpoint not found. Please check API configuration.';
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage += 'Network error. Cannot connect to server.';
      } else {
        errorMessage += error.response?.data?.message || error.message;
      }

      showToast(errorMessage, 'error');
      setLoading(false);
    }
  };

  const fetchSensorData = async (assessmentId) => {
    if (!assessmentId) return;

    try {
      const token = sessionStorage.getItem('token');

      if (!token) {
        showToast('Authentication failed. Please login again.', 'error');
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/pre-assessments/${assessmentId}/iot-data`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 10000 }
        }
      );

      const readings = response.data.readings || [];
      const stats = response.data.stats || {};
      
      // ✅ Calculate metrics from sensor data
      const calculatedPeakSunHours = calculatePeakSunHours(readings);
      const calculatedShadingPercentage = calculateShadingPercentage(readings);
      const calculatedTemperatureDerating = calculateTemperatureDerating(readings);
      
      // Merge backend stats with calculated values (prioritize calculated values)
      const enhancedStats = {
        ...stats,
        peakSunHours: calculatedPeakSunHours > 0 ? calculatedPeakSunHours : (stats.peakSunHours || 0),
        shadingPercentage: calculatedShadingPercentage > 0 ? calculatedShadingPercentage : (stats.shadingPercentage || 0),
        temperatureDerating: calculatedTemperatureDerating > 0 ? calculatedTemperatureDerating : (stats.temperatureDerating || 0),
        // Preserve original stats
        averageIrradiance: stats.averageIrradiance || 0,
        maxIrradiance: stats.maxIrradiance || 0,
        averageTemperature: stats.averageTemperature || 0,
        minTemperature: stats.minTemperature || 0,
        maxTemperature: stats.maxTemperature || 0,
        averageHumidity: stats.averageHumidity || 0,
        minHumidity: stats.minHumidity || 0,
        maxHumidity: stats.maxHumidity || 0
      };
      
      
      
      setSensorData(readings);
      setSensorStats(enhancedStats);
      setGpsData(stats.gps || null);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      showToast('Failed to fetch sensor data', 'error');
      setSensorData([]);
      setSensorStats({});
      setGpsData(null);
    }
  };

  const handleViewDeviceData = async (device) => {
    setSensorData([]);
    setSensorStats({});
    setGpsData(null);
    setLastUpdated(null);
    
    setSelectedDevice(device);
    setShowDataModal(true);
    
    await fetchSensorData(device.assessmentId);
  };

  const handleRetrieveDevice = async () => {
    if (!selectedDevice) return;

    const confirmed = window.confirm(
      `⚠️ RETRIEVE DEVICE CONFIRMATION ⚠️\n\n` +
      `Are you sure you want to retrieve this device?\n\n` +
      `📋 Device Details:\n` +
      `• Device ID: ${selectedDevice.deviceId}\n` +
      `• Device Name: ${selectedDevice.deviceName}\n\n` +
      `📍 Assessment: ${selectedDevice.bookingReference}\n` +
      `📍 Client: ${selectedDevice.clientName}\n\n` +
      `⚠️ This will:\n` +
      `• Mark the assessment status as "Data Analyzing"\n` +
      `• Mark the device status as "Retrieved"\n` +
      `• The device will no longer collect data for this assessment\n\n` +
      `Click OK to confirm retrieval.`
    );

    if (!confirmed) return;

    setRetrieving(true);
    try {
      const token = sessionStorage.getItem('token');
      
      const response = await axios.put(
        `${API_BASE_URL}/api/pre-assessments/${selectedDevice.assessmentId}/retrieve-device`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast(response.data.message || 'Device retrieved successfully! Data analysis can now begin.', 'success');
      
      setShowDataModal(false);
      setSelectedDevice(null);
      fetchMyDevices();
      
    } catch (error) {
      console.error('Error retrieving device:', error);
      showToast(error.response?.data?.message || 'Failed to retrieve device', 'error');
    } finally {
      setRetrieving(false);
    }
  };

  const downloadData = () => {
    if (!sensorData.length) return;

    const csvData = sensorData.map(reading => ({
      timestamp: new Date(reading.timestamp).toISOString(),
      irradiance: reading.irradiance || 0,
      temperature: reading.temperature || 0,
      humidity: reading.humidity || 0
    }));

    const headers = ['Timestamp', 'Irradiance (W/m²)', 'Temperature (°C)', 'Humidity (%)'];
    const csvRows = [headers];

    csvData.forEach(row => {
      csvRows.push([row.timestamp, row.irradiance, row.temperature, row.humidity]);
    });

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sensor_data_${selectedDevice.deviceId}_${new Date().toISOString()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status) => {
    const badges = {
      'deployed': <span className="status-badge-iotdevicead deployed-iotdevicead"><FaCheckCircle /> Deployed</span>,
      'data_collecting': <span className="status-badge-iotdevicead collecting-iotdevicead"><FaChartLine /> Collecting Data</span>,
      'maintenance': <span className="status-badge-iotdevicead maintenance-iotdevicead"><FaTools /> Maintenance</span>,
      'retired': <span className="status-badge-iotdevicead retired-iotdevicead"><FaTimesCircle /> Retired</span>,
      'retrieved': <span className="status-badge-iotdevicead retrieved-iotdevicead"><FaBoxOpen /> Retrieved</span>
    };
    return badges[status] || <span className="status-badge-iotdevicead">{status}</span>;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDeviceStatusColor = (lastHeartbeat) => {
    if (!lastHeartbeat) return 'offline';
    const hoursSince = (new Date() - new Date(lastHeartbeat)) / (1000 * 60 * 60);
    if (hoursSince < 1) return 'online';
    if (hoursSince < 24) return 'recent';
    return 'offline';
  };

  const filteredDevices = devices.filter(device => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return device.deviceId?.toLowerCase().includes(searchLower) ||
      device.deviceName?.toLowerCase().includes(searchLower) ||
      device.clientName?.toLowerCase().includes(searchLower) ||
      device.bookingReference?.toLowerCase().includes(searchLower);
  });

  const paginatedDevices = filteredDevices.slice((currentPage - 1) * 10, currentPage * 10);

  const chartData = sensorData.map(reading => ({
    timestamp: new Date(reading.timestamp).getTime(),
    irradiance: reading.irradiance || 0,
    temperature: reading.temperature || 0,
    humidity: reading.humidity || 0
  }));

  const hasValidSensorData = sensorData.length > 0 && sensorData.some(reading => 
    reading.irradiance > 0 || reading.temperature > 0 || reading.humidity > 0
  );

  const SkeletonLoader = () => (
    <div className="iot-device-engineer-iotdevicead">
      <div className="iot-header-iotdevicead">
        <div className="skeleton-line-iotdevicead large-iotdevicead"></div>
        <div className="skeleton-line-iotdevicead medium-iotdevicead"></div>
      </div>
      <div className="iot-filters-iotdevicead">
        <div className="skeleton-search-iotdevicead"></div>
      </div>
      <div className="devices-grid-iotdevicead">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="device-card-iotdevicead skeleton-card-iotdevicead">
            <div className="skeleton-line-iotdevicead small-iotdevicead"></div>
            <div className="skeleton-line-iotdevicead medium-iotdevicead"></div>
            <div className="skeleton-line-iotdevicead small-iotdevicead"></div>
            <div className="skeleton-button-iotdevicead"></div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading && devices.length === 0) {
    return <SkeletonLoader />;
  }

  return (
    <>
      <Helmet>
        <title>My IoT Devices | Engineer | Salfer Engineering</title>
      </Helmet>

      <div className="iot-device-engineer-iotdevicead">
        <div className="iot-header-iotdevicead">
          <div>
            <h1>My IoT Devices</h1>
            <p>Monitor and view data from your deployed devices</p>
          </div>
          <div className="stats-summary-iotdevicead">
            <div className="stat-item-iotdevicead">
              <span className="stat-value-iotdevicead">{devices.length}</span>
              <span className="stat-label-iotdevicead">Active Devices</span>
            </div>
            <div className="stat-item-iotdevicead">
              <span className="stat-value-iotdevicead">{devices.filter(d => getDeviceStatusColor(d.lastHeartbeat) === 'online').length}</span>
              <span className="stat-label-iotdevicead">Online</span>
            </div>
          </div>
        </div>

        <div className="iot-filters-iotdevicead">
          <div className="search-group-iotdevicead">
            <FaSearch className="search-icon-iotdevicead" />
            <input
              type="text"
              placeholder="Search by device ID, name, or client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredDevices.length === 0 ? (
          <div className="empty-state-iotdevicead">
            <FaMicrochip className="empty-icon-iotdevicead" />
            <h3>No devices found</h3>
            <p>You don't have any deployed devices yet.</p>
          </div>
        ) : (
          <>
            <div className="devices-grid-iotdevicead">
              {paginatedDevices.map(device => {
                const statusColor = getDeviceStatusColor(device.lastHeartbeat);
                return (
                  <div key={device._id} className="device-card-iotdevicead">
                    <div className="device-card-header-iotdevicead">
                      <div className="device-icon-iotdevicead">
                        <FaMicrochip />
                      </div>
                      <div className="device-status-iotdevicead">
                        <span className={`status-dot-iotdevicead ${statusColor}`}></span>
                        {statusColor === 'online' ? 'Online' : statusColor === 'recent' ? 'Recent' : 'Offline'}
                      </div>
                    </div>

                    <div className="device-info-iotdevicead">
                      <h3>{device.deviceName}</h3>
                      <p className="device-id-iotdevicead">{device.deviceId}</p>
                      <p className="client-name-iotdevicead">{device.clientName}</p>
                      <p className="booking-ref-iotdevicead">{device.bookingReference}</p>
                    </div>

                    <div className="device-stats-iotdevicead">
                      <div className="stat-iotdevicead">
                        <FaWifi />
                        <span>{getDeviceStatusColor(device.lastHeartbeat) === 'online' ? 'Connected' : 'Disconnected'}</span>
                      </div>
                      <div className="stat-iotdevicead">
                        <FaClock />
                        <span>{device.lastHeartbeat ? formatDate(device.lastHeartbeat) : 'N/A'}</span>
                      </div>
                    </div>

                    <div className="device-actions-iotdevicead">
                      <button
                        className="view-data-btn-iotdevicead"
                        onClick={() => handleViewDeviceData(device)}
                      >
                        <FaChartLine /> View Data
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="pagination-iotdevicead">
                <button
                  className="page-btn-iotdevicead"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <FaChevronLeft /> Previous
                </button>
                <span className="page-info-iotdevicead">Page {currentPage} of {totalPages}</span>
                <button
                  className="page-btn-iotdevicead"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next <FaChevronRight />
                </button>
              </div>
            )}
          </>
        )}

        {/* Device Data Modal */}
        {showDataModal && selectedDevice && (
          <div className="modal-overlay-iotdevicead" onClick={() => setShowDataModal(false)}>
            <div className="modal-content-iotdevicead data-modal-iotdevicead" onClick={e => e.stopPropagation()}>
              <div className="modal-header-iotdevicead">
                <h3>Device Data: {selectedDevice.deviceName}</h3>
                <button className="modal-close-iotdevicead" onClick={() => setShowDataModal(false)}>×</button>
              </div>

              <div className="modal-body-iotdevicead">
                {/* Device Info Summary */}
                <div className="device-summary-iotdevicead">
                  <div className="summary-item-iotdevicead">
                    <FaMicrochip />
                    <div>
                      <label>Device ID</label>
                      <p>{selectedDevice.deviceId}</p>
                    </div>
                  </div>
                  <div className="summary-item-iotdevicead">
                    <FaCalendarAlt />
                    <div>
                      <label>Deployed</label>
                      <p>{formatDate(selectedDevice.deployedAt)}</p>
                    </div>
                  </div>
                  <div className="summary-item-iotdevicead">
                    <FaClock />
                    <div>
                      <label>Last Data</label>
                      <p>{lastUpdated ? formatDate(lastUpdated) : 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* KEY METRICS SECTION - Peak Sun Hours, Shading, Derating */}
                {sensorStats && hasValidSensorData && (
                  <div className="key-metrics-iotdevicead">
                    <h4>Key Solar Metrics</h4>
                    <div className="metrics-grid-iotdevicead">
                      <div className="metric-card-iotdevicead">
                        <FaSun className="metric-icon" />
                        <div>
                          <span className="metric-value">{sensorStats.peakSunHours?.toFixed(1) || 0}</span>
                          <span className="metric-label">Peak Sun Hours (hrs/day)</span>
                        </div>
                      </div>
                      <div className="metric-card-iotdevicead">
                        <FaPercent className="metric-icon" />
                        <div>
                          <span className="metric-value">{sensorStats.shadingPercentage?.toFixed(0) || 0}%</span>
                          <span className="metric-label">Shading Percentage</span>
                        </div>
                      </div>
                      <div className="metric-card-iotdevicead">
                        <FaTemperatureHigh className="metric-icon" />
                        <div>
                          <span className="metric-value">{sensorStats.temperatureDerating?.toFixed(1) || 0}%</span>
                          <span className="metric-label">Temperature Derating</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stats Cards - Avg Irradiance, Temp, Humidity, Max Irradiance */}
                {sensorStats && hasValidSensorData && (
                  <div className="stats-cards-iotdevicead">
                    <div className="stat-card-iotdevicead irradiance-iotdevicead">
                      <FaSun />
                      <div>
                        <span className="stat-value-iotdevicead">{sensorStats.averageIrradiance?.toFixed(0) || 0} W/m²</span>
                        <span className="stat-label-iotdevicead">Avg Irradiance</span>
                        <span className="stat-trend-iotdevicead">Max: {sensorStats.maxIrradiance?.toFixed(0) || 0}</span>
                      </div>
                    </div>
                    <div className="stat-card-iotdevicead temperature-iotdevicead">
                      <FaThermometerHalf />
                      <div>
                        <span className="stat-value-iotdevicead">{sensorStats.averageTemperature?.toFixed(1) || 0}°C</span>
                        <span className="stat-label-iotdevicead">Avg Temperature</span>
                        <span className="stat-trend-iotdevicead">Range: {sensorStats.minTemperature?.toFixed(1) || 0}°C - {sensorStats.maxTemperature?.toFixed(1) || 0}°C</span>
                      </div>
                    </div>
                    <div className="stat-card-iotdevicead humidity-iotdevicead">
                      <FaTint />
                      <div>
                        <span className="stat-value-iotdevicead">{sensorStats.averageHumidity?.toFixed(0) || 0}%</span>
                        <span className="stat-label-iotdevicead">Avg Humidity</span>
                        <span className="stat-trend-iotdevicead">Range: {sensorStats.minHumidity?.toFixed(0) || 0}% - {sensorStats.maxHumidity?.toFixed(0) || 0}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Auto-refresh and Export buttons */}
                {hasValidSensorData && (
                  <div className="range-selector-iotdevicead">
                    <button onClick={downloadData} className="download-btn-iotdevicead" disabled={!sensorData.length}>
                      <FaDownload /> Export CSV
                    </button>
                    <button
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      className={`auto-refresh-btn-iotdevicead ${autoRefresh ? 'active-iotdevicead' : ''}`}
                    >
                      <FaClock /> {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
                    </button>
                  </div>
                )}

                {/* Charts */}
                {chartData.length > 0 && hasValidSensorData && (
                  <>
                    <div className="chart-container-iotdevicead">
                      <h4>Solar Irradiance</h4>
                      <div className="chart-iotdevicead">
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="timestamp"
                              tickFormatter={(ts) => new Date(ts).toLocaleDateString()}
                            />
                            <YAxis label={{ value: 'Irradiance (W/m²)', angle: -90, position: 'insideLeft' }} />
                            <Tooltip
                              labelFormatter={(label) => new Date(label).toLocaleString()}
                              formatter={(value) => [`${value} W/m²`, 'Irradiance']}
                            />
                            <Legend />
                            <Area
                              type="monotone"
                              dataKey="irradiance"
                              stroke="#f97316"
                              fill="#fed7aa"
                              name="Irradiance"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="chart-container-iotdevicead">
                      <h4>Temperature & Humidity</h4>
                      <div className="chart-iotdevicead">
                        <ResponsiveContainer width="100%" height={300}>
                          <ComposedChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="timestamp"
                              tickFormatter={(ts) => new Date(ts).toLocaleDateString()}
                            />
                            <YAxis yAxisId="left" label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }} />
                            <YAxis yAxisId="right" orientation="right" label={{ value: 'Humidity (%)', angle: 90, position: 'insideRight' }} />
                            <Tooltip
                              labelFormatter={(label) => new Date(label).toLocaleString()}
                            />
                            <Legend />
                            <Line
                              yAxisId="left"
                              type="monotone"
                              dataKey="temperature"
                              stroke="#ef4444"
                              name="Temperature"
                              dot={false}
                            />
                            <Line
                              yAxisId="right"
                              type="monotone"
                              dataKey="humidity"
                              stroke="#3b82f6"
                              name="Humidity"
                              dot={false}
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </>
                )}

                {/* Recent Readings Table */}
                {sensorData.length > 0 && hasValidSensorData && (
                  <div className="readings-table-iotdevicead">
                    <h4>Recent Readings</h4>
                    <div className="table-container-iotdevicead">
                      <table className="readings-table">
                        <thead>
                          <tr>
                            <th>Timestamp</th>
                            <th>Irradiance (W/m²)</th>
                            <th>Temperature (°C)</th>
                            <th>Humidity (%)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sensorData.slice(0, 20).map((reading, idx) => (
                            <tr key={idx}>
                              <td>{formatDate(reading.timestamp)}</td>
                              <td>{reading.irradiance || 0}</td>
                              <td>{reading.temperature?.toFixed(1) || 0}</td>
                              <td>{reading.humidity?.toFixed(0) || 0}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {!hasValidSensorData && (
                  <div className="no-data-iotdevicead">
                    <FaExclamationTriangle />
                    <p>No sensor data available for this device</p>
                    <small>The device may still be collecting data or no readings have been recorded yet.</small>
                  </div>
                )}
              </div>

              {/* GPS Location section */}
              {gpsData && (gpsData.latitude || gpsData.longitude) && (
                <div className="gps-location-iotdevicead">
                  <h4>Device Location</h4>
                  <div className="gps-coords">
                    <p><strong>Latitude:</strong> {gpsData.latitude || 'N/A'}</p>
                    <p><strong>Longitude:</strong> {gpsData.longitude || 'N/A'}</p>
                  </div>
                  {gpsData.latitude && gpsData.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${gpsData.latitude},${gpsData.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="view-map-btn"
                    >
                      View on Google Maps
                    </a>
                  )}
                </div>
              )}

              <div className="modal-actions-iotdevicead">
                <button className="close-btn-iotdevicead" onClick={() => setShowDataModal(false)}>Close</button>
                {(selectedDevice.assessmentStatus === 'data_collecting' || selectedDevice.status === 'deployed') && (
                  <button 
                    className="retrieve-btn-iotdevicead" 
                    onClick={handleRetrieveDevice}
                    disabled={retrieving}
                  >
                    {retrieving ? <FaSpinner className="spinner-enad" /> : <FaArrowCircleUp />}
                    {retrieving ? 'Retrieving...' : 'Retrieve Device'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <ToastNotification
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          position="bottom-right"
        />
      </div>
    </>
  );
};

export default IoTDevice;