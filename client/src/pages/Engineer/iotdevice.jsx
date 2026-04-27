// pages/Engineer/IoTDevice.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import {
  FaSearch,
  FaSpinner,
  FaChevronLeft,
  FaChevronRight,
  FaChartLine,
  FaCalendarAlt,
  FaMicrochip,
  FaDownload,
  FaThermometerHalf,
  FaClock,
  FaSun,
  FaTint,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaArrowCircleUp,
  FaBoxOpen
} from 'react-icons/fa';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';
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
  const [lastUpdated, setLastUpdated] = useState(null);
  const [gpsData, setGpsData] = useState(null);
  const [retrieving, setRetrieving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const getApiBaseUrl = () => {
    return import.meta.env.VITE_API_URL || '';
  };

  const API_BASE_URL = getApiBaseUrl();

  // ==================== TIMEZONE FIX ====================
  const subtract8Hours = (date) => {
    if (!date) return null;
    const originalDate = new Date(date);
    return new Date(originalDate.getTime() - (8 * 60 * 60 * 1000));
  };

  const formatPhilippineTime = (date) => {
    if (!date) return 'N/A';
    const adjustedDate = subtract8Hours(date);
    return adjustedDate.toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatPhilippineDateShort = (date) => {
    if (!date) return 'N/A';
    const adjustedDate = subtract8Hours(date);
    return adjustedDate.toLocaleString('en-PH', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTooltipDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const adjustedDate = subtract8Hours(timestamp);
    return adjustedDate.toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatAxisDate = (timestamp) => {
    if (!timestamp) return '';
    const adjustedDate = subtract8Hours(timestamp);
    return adjustedDate.toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric'
    });
  };

  // ==================== CUSTOM TOOLTIP ====================
  const CustomChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-chart-tooltip-fixed">
          <div className="tooltip-time">{formatTooltipDate(label)}</div>
          {payload.map((entry, index) => (
            <div key={index} className="tooltip-item" style={{ color: entry.color }}>
              <span className="tooltip-label">{entry.name}:</span>
              <span className="tooltip-value">
                {entry.value}
                {entry.name === 'Irradiance' ? ' W/m²' :
                  entry.name === 'Temperature' ? '°C' :
                    entry.name === 'Humidity' ? '%' : ''}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // ==================== DATA FETCHING (NO CALCULATIONS) ====================
  useEffect(() => {
    fetchMyDevices();
  }, [currentPage]);

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
      showToast('Failed to fetch your devices', 'error');
      setLoading(false);
    }
  };

  // Fetch sensor data - BACKEND PROVIDES CALCULATED STATS
  const fetchSensorData = async (assessmentId) => {
    if (!assessmentId) return;

    try {
      const token = sessionStorage.getItem('token');

      const response = await axios.get(
        `${API_BASE_URL}/api/pre-assessments/${assessmentId}/iot-data`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            limit: 10000,
            range: 'all'
          }
        }
      );

      // ✅ BACKEND PROVIDES: readings + pre-calculated stats
      const readings = response.data.readings || [];
      const stats = response.data.stats || {};

      // ✅ JUST DISPLAY - NO CALCULATIONS
      setSensorData(readings);
      setSensorStats({
        // Irradiance Metrics
        averageIrradiance: stats.averageIrradiance || 0,
        maxIrradiance: stats.maxIrradiance || 0,
        minIrradiance: stats.minIrradiance || 0,
        peakSunHours: stats.peakSunHours || 0,

        // Temperature Metrics
        averageTemperature: stats.averageTemperature || 0,
        minTemperature: stats.minTemperature || 0,
        maxTemperature: stats.maxTemperature || 0,

        // Humidity Metrics
        averageHumidity: stats.averageHumidity || 0,
        minHumidity: stats.minHumidity || 0,
        maxHumidity: stats.maxHumidity || 0,

        // Metadata
        totalReadings: stats.totalReadings || readings.length
      });
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

  const openConfirmModal = () => {
    setShowConfirmModal(true);
  };

  // ✅ SEND REQUEST - NO CALCULATIONS
  const handleRetrieveDevice = async () => {
    if (!selectedDevice) return;

    setRetrieving(true);
    setShowConfirmModal(false);

    try {
      const token = sessionStorage.getItem('token');

      const response = await axios.put(
        `${API_BASE_URL}/api/pre-assessments/${selectedDevice.assessmentId}/retrieve-device`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast(response.data.message || 'Device retrieved successfully!', 'success');

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

    const csvData = sensorData.map(reading => {
      const adjustedDate = subtract8Hours(reading.timestamp);
      return {
        timestamp: adjustedDate.toLocaleString('en-PH', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        irradiance: reading.irradiance || 0,
        temperature: reading.temperature || 0,
        humidity: reading.humidity || 0
      };
    });

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
    link.download = `sensor_data_${selectedDevice.deviceId}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const getDeviceStatusColor = (lastHeartbeat) => {
    if (!lastHeartbeat) return 'offline';
    const adjustedHeartbeat = subtract8Hours(lastHeartbeat);
    const hoursSince = (new Date() - adjustedHeartbeat) / (1000 * 60 * 60);
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
            <p>Monitor environmental data from your deployed devices</p>
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
              {paginatedDevices.map(device => (
                <div key={device._id} className="device-card-iotdevicead">
                  <div className="device-card-header-iotdevicead">
                    <div className="device-icon-iotdevicead">
                      <FaMicrochip />
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
                      <FaClock />
                      <span>{device.lastHeartbeat ? formatPhilippineDateShort(device.lastHeartbeat) : 'N/A'}</span>
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
              ))}
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
                <h3>Environmental Data: {selectedDevice.deviceName}</h3>
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
                      <p>{formatPhilippineDateShort(selectedDevice.deployedAt)}</p>
                    </div>
                  </div>
                  <div className="summary-item-iotdevicead">
                    <FaClock />
                    <div>
                      <label>Last Data</label>
                      <p>{lastUpdated ? formatPhilippineDateShort(lastUpdated) : 'N/A'}</p>
                    </div>
                  </div>
                </div>



                {/* Stats Cards - Display only */}
                {sensorStats && hasValidSensorData && (
                  <div className="stats-cards-iotdevicead">

                    <div className="stat-card-iotdevicead irradiance-iotdevicead">
                      <FaSun />
                      <div>
                        <span className="stat-value-iotdevicead">{sensorStats.peakSunHours?.toFixed(1) || 0} h/day</span>
                        <span className="stat-label-iotdevicead">Peak Sun Hours</span>
                      </div>
                    </div>
                    <div className="stat-card-iotdevicead irradiance-iotdevicead">
                      <FaSun />
                      <div>
                        <span className="stat-value-iotdevicead">{sensorStats.averageIrradiance?.toFixed(0) || 0} W/m²</span>
                        <span className="stat-label-iotdevicead">Avg Irradiance</span>
                        <span className="stat-trend-iotdevicead">Max: {sensorStats.maxIrradiance?.toFixed(0) || 0} | Min: {sensorStats.minIrradiance?.toFixed(0) || 0}</span>
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

                {/* Controls */}
                {hasValidSensorData && (
                  <div className="range-selector-iotdevicead">
                    <button onClick={downloadData} className="download-btn-iotdevicead" disabled={!sensorData.length}>
                      <FaDownload /> Export CSV
                    </button>
                  </div>
                )}

                {/* CHARTS */}
                {chartData.length > 0 && hasValidSensorData && (
                  <>
                    <div className="chart-container-iotdevicead">
                      <h4>Solar Irradiance (W/m²)</h4>
                      <div className="chart-iotdevicead">
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="timestamp" tickFormatter={formatAxisDate} domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
                            <YAxis
                              domain={[0, 'auto']}
                              label={{ value: 'Irradiance (W/m²)', angle: -90, position: 'insideLeft', style: { fontSize: '11px', fill: '#64748b' } }}
                              tick={{ fontSize: 11 }}
                            />
                            <Tooltip content={<CustomChartTooltip />} cursor={{ stroke: '#f97316', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                            <Area type="monotone" dataKey="irradiance" stroke="#f97316" fill="#fed7aa" name="Irradiance" isAnimationActive={false} activeDot={{ r: 6, strokeWidth: 2 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="chart-container-iotdevicead">
                      <h4>Temperature (°C) & Humidity (%)</h4>
                      <div className="chart-iotdevicead">
                        <ResponsiveContainer width="100%" height={300}>
                          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="timestamp" tickFormatter={formatAxisDate} domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
                            <YAxis
                              yAxisId="left"
                              domain={[0, 50]}  // ✅ Temperature range: 0 to 50°C
                              label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft', style: { fontSize: '11px', fill: '#64748b' } }}
                              tick={{ fontSize: 11 }}
                            />
                            <YAxis
                              yAxisId="right"
                              orientation="right"
                              domain={[0, 100]}  // ✅ Humidity range: 0 to 100%
                              label={{ value: 'Humidity (%)', angle: 90, position: 'insideRight', style: { fontSize: '11px', fill: '#64748b' } }}
                              tick={{ fontSize: 11 }}
                            />
                            <Tooltip content={<CustomChartTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                            <Line
                              yAxisId="left"
                              type="monotone"
                              dataKey="temperature"
                              stroke="#ef4444"
                              name="Temperature"
                              dot={false}
                              isAnimationActive={false}
                              activeDot={{ r: 6, strokeWidth: 2 }}
                            />
                            <Line
                              yAxisId="right"
                              type="monotone"
                              dataKey="humidity"
                              stroke="#3b82f6"
                              name="Humidity"
                              dot={false}
                              isAnimationActive={false}
                              activeDot={{ r: 6, strokeWidth: 2 }}
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
                    <h4>Recent Readings (Every 15 minutes)</h4>
                    <div className="table-container-iotdevicead">
                      <table className="readings-table">
                        <thead>
                          <tr><th>Timestamp</th><th>Irradiance (W/m²)</th><th>Temperature (°C)</th><th>Humidity (%)</th></tr>
                        </thead>
                        <tbody>
                          {sensorData.slice(0, 20).map((reading, idx) => (
                            <tr key={idx}>
                              <td>{formatPhilippineTime(reading.timestamp)}</td>
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
                    <a href={`https://www.google.com/maps?q=${gpsData.latitude},${gpsData.longitude}`} target="_blank" rel="noopener noreferrer" className="view-map-btn">
                      View on Google Maps
                    </a>
                  )}
                </div>
              )}

              <div className="modal-actions-iotdevicead">
                <button className="close-btn-iotdevicead" onClick={() => setShowDataModal(false)}>Close</button>
                {(selectedDevice.assessmentStatus === 'data_collecting' || selectedDevice.status === 'deployed') && (
                  <button className="retrieve-btn-iotdevicead" onClick={openConfirmModal} disabled={retrieving}>
                    {retrieving ? <FaSpinner className="spinner-enad" /> : <FaArrowCircleUp />}
                    {retrieving ? 'Retrieving...' : 'Retrieve Device'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && selectedDevice && (
          <div className="modal-overlay-iotdevicead" onClick={() => setShowConfirmModal(false)}>
            <div className="modal-content-iotdevicead confirm-modal-iotdevicead" onClick={e => e.stopPropagation()}>
              <div className="modal-header-iotdevicead">
                <h3>Confirm Device Retrieval</h3>
                <button className="modal-close-iotdevicead" onClick={() => setShowConfirmModal(false)}>×</button>
              </div>
              <div className="modal-body-iotdevicead confirm-modal-body-iotdevicead">
                <p>Are you sure you want to retrieve this device?</p>

                <div className="device-details-confirm-iotdevicead">
                  <div className="detail-row-iotdevicead"><span className="detail-label-iotdevicead">Device ID:</span><span className="detail-value-iotdevicead">{selectedDevice.deviceId}</span></div>
                  <div className="detail-row-iotdevicead"><span className="detail-label-iotdevicead">Device Name:</span><span className="detail-value-iotdevicead">{selectedDevice.deviceName}</span></div>
                  <div className="detail-row-iotdevicead"><span className="detail-label-iotdevicead">Assessment:</span><span className="detail-value-iotdevicead">{selectedDevice.bookingReference}</span></div>
                  <div className="detail-row-iotdevicead"><span className="detail-label-iotdevicead">Client:</span><span className="detail-value-iotdevicead">{selectedDevice.clientName}</span></div>
                </div>

                <div className="info-message-iotdevicead">
                  <p>This will:</p>
                  <ul>
                    <li>Mark the assessment status as "Data Analyzing"</li>
                    <li>Mark the device status as "Retrieved"</li>
                    <li>The device will no longer collect data for this assessment</li>
                  </ul>
                </div>
              </div>
              <div className="modal-actions-iotdevicead confirm-actions-iotdevicead">
                <button className="cancel-btn-iotdevicead" onClick={() => setShowConfirmModal(false)}>Cancel</button>
                <button className="confirm-retrieve-btn-iotdevicead" onClick={handleRetrieveDevice} disabled={retrieving}>
                  {retrieving ? <FaSpinner className="spinner-enad" /> : <FaArrowCircleUp />}
                  {retrieving ? 'Retrieving...' : 'Yes, Retrieve Device'}
                </button>
              </div>
            </div>
          </div>
        )}

        <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} position="bottom-right" />
      </div>
    </>
  );
};

export default IoTDevice;