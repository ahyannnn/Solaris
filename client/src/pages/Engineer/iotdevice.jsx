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
  FaArrowLeft
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
  const [dataRange, setDataRange] = useState('7days');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetchMyDevices();
  }, [currentPage]);

  useEffect(() => {
    if (autoRefresh && selectedDevice) {
      const interval = setInterval(() => {
        fetchSensorData();
      }, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, selectedDevice, dataRange]);

  const fetchMyDevices = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      
      // Fetch pre-assessments assigned to engineer that have devices deployed
      const response = await axios.get('/api/pre-assessments/engineer/my-assessments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter assessments that have IoT devices deployed
      const assessmentsWithDevices = (response.data.assessments || []).filter(
        assessment => assessment.iotDeviceId && 
        (assessment.assessmentStatus === 'device_deployed' || assessment.assessmentStatus === 'data_collecting')
      );
      
      // Extract device information
      const deviceList = assessmentsWithDevices.map(assessment => ({
        _id: assessment.iotDeviceId._id,
        deviceId: assessment.iotDeviceId.deviceId,
        deviceName: assessment.iotDeviceId.deviceName,
        model: assessment.iotDeviceId.model,
        status: assessment.iotDeviceId.status,
        batteryLevel: assessment.iotDeviceId.batteryLevel || 100,
        lastHeartbeat: assessment.iotDeviceId.lastHeartbeat,
        assessmentId: assessment._id,
        bookingReference: assessment.bookingReference,
        clientName: `${assessment.clientId?.contactFirstName} ${assessment.clientId?.contactLastName}`,
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

  const fetchSensorData = async () => {
    if (!selectedDevice) return;
    
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(
        `/api/pre-assessments/${selectedDevice.assessmentId}/iot-data`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { range: dataRange, limit: 1000 }
        }
      );
      
      setSensorData(response.data.readings || []);
      setSensorStats(response.data.stats || {});
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      showToast('Failed to fetch sensor data', 'error');
    }
  };

  const handleViewDeviceData = async (device) => {
    setSelectedDevice(device);
    setShowDataModal(true);
    await fetchSensorData();
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

  const getBatteryIcon = (level) => {
    if (level >= 75) return <FaBatteryFull className="battery-icon-iotdevicead high-iotdevicead" />;
    if (level >= 50) return <FaBatteryHalf className="battery-icon-iotdevicead medium-iotdevicead" />;
    if (level >= 25) return <FaBatteryQuarter className="battery-icon-iotdevicead low-iotdevicead" />;
    return <FaBatteryEmpty className="battery-icon-iotdevicead critical-iotdevicead" />;
  };

  const getStatusBadge = (status) => {
    const badges = {
      'deployed': <span className="status-badge-iotdevicead deployed-iotdevicead"><FaCheckCircle /> Deployed</span>,
      'data_collecting': <span className="status-badge-iotdevicead collecting-iotdevicead"><FaChartLine /> Collecting Data</span>,
      'maintenance': <span className="status-badge-iotdevicead maintenance-iotdevicead"><FaTools /> Maintenance</span>,
      'retired': <span className="status-badge-iotdevicead retired-iotdevicead"><FaTimesCircle /> Retired</span>
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

  // Prepare chart data
  const chartData = sensorData.map(reading => ({
    timestamp: new Date(reading.timestamp).getTime(),
    irradiance: reading.irradiance || 0,
    temperature: reading.temperature || 0,
    humidity: reading.humidity || 0
  }));

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
                        {getBatteryIcon(device.batteryLevel)}
                        <span>{device.batteryLevel}%</span>
                      </div>
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
                    {getBatteryIcon(selectedDevice.batteryLevel)}
                    <div>
                      <label>Battery</label>
                      <p>{selectedDevice.batteryLevel}%</p>
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

                {/* Stats Cards */}
                {sensorStats && (
                  <div className="stats-cards-iotdevicead">
                    <div className="stat-card-iotdevicead irradiance-iotdevicead">
                      <FaSun />
                      <div>
                        <span className="stat-value-iotdevicead">{sensorStats.averageIrradiance?.toFixed(0) || 0} W/m²</span>
                        <span className="stat-label-iotdevicead">Avg Irradiance</span>
                        <span className="stat-trend-iotdevicead">Peak: {sensorStats.maxIrradiance?.toFixed(0) || 0}</span>
                      </div>
                    </div>
                    <div className="stat-card-iotdevicead temperature-iotdevicead">
                      <FaThermometerHalf />
                      <div>
                        <span className="stat-value-iotdevicead">{sensorStats.averageTemperature?.toFixed(1) || 0}°C</span>
                        <span className="stat-label-iotdevicead">Avg Temperature</span>
                        <span className="stat-trend-iotdevicead">{sensorStats.minTemperature?.toFixed(1) || 0}°C - {sensorStats.maxTemperature?.toFixed(1) || 0}°C</span>
                      </div>
                    </div>
                    <div className="stat-card-iotdevicead humidity-iotdevicead">
                      <FaTint />
                      <div>
                        <span className="stat-value-iotdevicead">{sensorStats.averageHumidity?.toFixed(0) || 0}%</span>
                        <span className="stat-label-iotdevicead">Avg Humidity</span>
                        <span className="stat-trend-iotdevicead">{sensorStats.minHumidity?.toFixed(0) || 0}% - {sensorStats.maxHumidity?.toFixed(0) || 0}%</span>
                      </div>
                    </div>
                    <div className="stat-card-iotdevicead readings-iotdevicead">
                      <FaTachometerAlt />
                      <div>
                        <span className="stat-value-iotdevicead">{sensorStats.totalReadings || 0}</span>
                        <span className="stat-label-iotdevicead">Total Readings</span>
                        <span className="stat-trend-iotdevicead">Peak Sun: {sensorStats.peakSunHours?.toFixed(1) || 0} hrs</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Data Range Selector */}
                <div className="range-selector-iotdevicead">
                  <label>Data Range:</label>
                  <div className="range-buttons-iotdevicead">
                    {['24h', '7days', '30days', 'all'].map(range => (
                      <button
                        key={range}
                        onClick={() => setDataRange(range)}
                        className={`range-btn-iotdevicead ${dataRange === range ? 'active-iotdevicead' : ''}`}
                      >
                        {range === '24h' ? '24 Hours' : range === '7days' ? '7 Days' : range === '30days' ? '30 Days' : 'All Time'}
                      </button>
                    ))}
                  </div>
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

                {/* Charts */}
                {chartData.length > 0 ? (
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
                ) : (
                  <div className="no-data-iotdevicead">
                    <FaExclamationTriangle />
                    <p>No data available for the selected time range</p>
                    <small>Device may still be collecting data</small>
                  </div>
                )}

                {/* Recent Readings Table */}
                {sensorData.length > 0 && (
                  <div className="readings-table-iotdevicead">
                    <h4>Recent Readings</h4>
                    <div className="table-container-iotdevicead">
                      <table>
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
              </div>

              <div className="modal-actions-iotdevicead">
                <button className="close-btn-iotdevicead" onClick={() => setShowDataModal(false)}>Close</button>
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