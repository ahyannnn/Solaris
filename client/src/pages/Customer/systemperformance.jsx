// pages/Customer/SystemPerformance.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/Customer/systemperformance.css';

const SystemPerformance = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [assessmentData, setAssessmentData] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      
      // Fetch completed assessments for the customer
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments/my-assessments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const completedAssessments = response.data.assessments?.filter(a => a.status === 'completed') || [];
      setAssessments(completedAssessments);
      
      if (completedAssessments.length > 0) {
        setSelectedAssessment(completedAssessments[0]);
        fetchAssessmentData(completedAssessments[0].id);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching assessments:', err);
      // Mock data for demo
      setTimeout(() => {
        const mockAssessments = [
          { id: 1, reference: 'ASM-2024-001', address: '123 Rizal St., Manila', period: 'March 1-7, 2024', status: 'completed' },
          { id: 2, reference: 'ASM-2024-002', address: '456 Mabini St., Quezon City', period: 'February 15-21, 2024', status: 'completed' }
        ];
        setAssessments(mockAssessments);
        setSelectedAssessment(mockAssessments[0]);
        fetchMockAssessmentData();
        setLoading(false);
      }, 1000);
    }
  };

  const fetchAssessmentData = async (assessmentId) => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments/${assessmentId}/data`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssessmentData(response.data);
    } catch (err) {
      console.error('Error fetching assessment data:', err);
      fetchMockAssessmentData();
    }
  };

  const fetchMockAssessmentData = () => {
    // Mock IoT data based on 7-day assessment
    const mockData = {
      assessment: {
        id: 'ASM-2024-001',
        reference: 'ASM-2024-001',
        address: '123 Rizal St., Barangay San Jose, Manila',
        period: {
          start: '2024-03-01',
          end: '2024-03-07'
        },
        status: 'completed',
        dataCompleteness: 98,
        expectedReadings: 336,
        actualReadings: 332,
        deviceStatus: {
          battery: 72,
          lastUpload: '2024-03-07 18:00:00',
          wifiStatus: 'connected',
          sdCardBackup: 'active'
        }
      },
      
      // Summary Statistics
      summary: {
        averageDailyIrradiance: 4850, // Wh/m²/day
        peakIrradiance: 985, // W/m²
        peakIrradianceTime: '2024-03-03 11:45:00',
        averageTemperature: 32.4,
        maxTemperature: 36.2,
        minTemperature: 26.8,
        averageHumidity: 68,
        siteClassification: 'Good',
        totalSolarResource: 33950, // Total Wh/m² over 7 days
        bestDay: { date: '2024-03-03', value: 5120 },
        worstDay: { date: '2024-03-05', value: 4120, condition: 'Cloudy' }
      },
      
      // Daily Data (7 days)
      dailyData: [
        { day: 1, date: '2024-03-01', irradiance: 4520, temperature: 31.2, humidity: 72, condition: 'Partly Cloudy' },
        { day: 2, date: '2024-03-02', irradiance: 4780, temperature: 32.5, humidity: 68, condition: 'Sunny' },
        { day: 3, date: '2024-03-03', irradiance: 5120, temperature: 33.8, humidity: 65, condition: 'Sunny' },
        { day: 4, date: '2024-03-04', irradiance: 4980, temperature: 34.2, humidity: 64, condition: 'Sunny' },
        { day: 5, date: '2024-03-05', irradiance: 4120, temperature: 29.5, humidity: 78, condition: 'Cloudy' },
        { day: 6, date: '2024-03-06', irradiance: 4680, temperature: 31.8, humidity: 71, condition: 'Partly Cloudy' },
        { day: 7, date: '2024-03-07', irradiance: 4850, temperature: 32.1, humidity: 69, condition: 'Sunny' }
      ],
      
      // Hourly Data for selected day (15-min intervals aggregated)
      hourlyData: [
        { hour: '6:00 AM', irradiance: 120, temperature: 26.5, humidity: 82 },
        { hour: '7:00 AM', irradiance: 280, temperature: 27.8, humidity: 78 },
        { hour: '8:00 AM', irradiance: 450, temperature: 29.2, humidity: 72 },
        { hour: '9:00 AM', irradiance: 620, temperature: 30.5, humidity: 68 },
        { hour: '10:00 AM', irradiance: 780, temperature: 31.8, humidity: 64 },
        { hour: '11:00 AM', irradiance: 890, temperature: 33.1, humidity: 60 },
        { hour: '12:00 PM', irradiance: 950, temperature: 34.2, humidity: 58 },
        { hour: '1:00 PM', irradiance: 920, temperature: 34.5, humidity: 57 },
        { hour: '2:00 PM', irradiance: 850, temperature: 33.8, humidity: 59 },
        { hour: '3:00 PM', irradiance: 720, temperature: 32.5, humidity: 63 },
        { hour: '4:00 PM', irradiance: 550, temperature: 31.2, humidity: 68 },
        { hour: '5:00 PM', irradiance: 320, temperature: 29.8, humidity: 74 },
        { hour: '6:00 PM', irradiance: 120, temperature: 28.5, humidity: 80 }
      ],
      
      // GPS & Location Data
      locationData: {
        latitude: 14.5995,
        longitude: 120.9842,
        optimalTiltAngle: 14,
        orientation: 'South',
        shadingAnalysis: {
          east: 'No significant shading',
          west: 'No significant shading',
          south: 'No significant shading',
          north: 'Tree shading between 3-5 PM'
        }
      },
      
      // Shading Analysis
      shadingData: [
        { time: '8:00 AM', status: 'clear', irradianceLoss: 0 },
        { time: '9:00 AM', status: 'clear', irradianceLoss: 0 },
        { time: '10:00 AM', status: 'clear', irradianceLoss: 0 },
        { time: '11:00 AM', status: 'clear', irradianceLoss: 0 },
        { time: '12:00 PM', status: 'clear', irradianceLoss: 0 },
        { time: '1:00 PM', status: 'clear', irradianceLoss: 0 },
        { time: '2:00 PM', status: 'clear', irradianceLoss: 0 },
        { time: '3:00 PM', status: 'partial', irradianceLoss: 15 },
        { time: '4:00 PM', status: 'shaded', irradianceLoss: 35 },
        { time: '5:00 PM', status: 'shaded', irradianceLoss: 50 }
      ],
      
      // Engineer Notes
      engineerNotes: [
        'Site has good solar exposure, especially between 9 AM - 2 PM',
        'North side has tree shading after 3 PM - consider panel placement away from this area',
        'Roof structure is concrete, suitable for standard mounting',
        'Recommended system size: 5-7 kW based on available roof space and irradiance data'
      ],
      
      // Downloadable Reports
      reports: {
        pdfUrl: '/reports/ASM-2024-001.pdf',
        csvUrl: '/data/ASM-2024-001.csv'
      }
    };
    
    setAssessmentData(mockData);
    setSelectedDay(mockData.dailyData[2]); // Default to best day
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-PH').format(num);
  };

  const getSiteClassificationClass = (classification) => {
    switch(classification) {
      case 'Excellent': return 'excellent-cusset';
      case 'Good': return 'good-cusset';
      case 'Fair': return 'fair-cusset';
      case 'Poor': return 'poor-cusset';
      default: return '';
    }
  };

  const getConditionIcon = (condition) => {
    switch(condition) {
      case 'Sunny': return '☀️';
      case 'Partly Cloudy': return '⛅';
      case 'Cloudy': return '☁️';
      default: return '🌤️';
    }
  };

  const handleExportData = async (type) => {
    setExporting(true);
    try {
      // Simulate export
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert(`${type.toUpperCase()} report downloaded successfully!`);
    } catch (err) {
      alert('Failed to download report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Skeleton Loader
  const SkeletonLoader = () => (
    <div className="performance-container-cusset">
      <div className="performance-header-cusset">
        <div className="skeleton-line-cusset large-cusset"></div>
        <div className="skeleton-line-cusset medium-cusset"></div>
      </div>
      <div className="stats-grid-cusset">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="stat-card-cusset skeleton-card-cusset">
            <div className="skeleton-line-cusset small-cusset"></div>
            <div className="skeleton-line-cusset large-cusset"></div>
            <div className="skeleton-line-cusset tiny-cusset"></div>
          </div>
        ))}
      </div>
      <div className="performance-grid-cusset">
        <div className="chart-card-cusset skeleton-card-cusset">
          <div className="skeleton-line-cusset medium-cusset"></div>
          <div className="skeleton-chart-cusset"></div>
        </div>
        <div className="chart-card-cusset skeleton-card-cusset">
          <div className="skeleton-line-cusset medium-cusset"></div>
          <div className="skeleton-chart-cusset"></div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Assessment Data | SOLARIS</title>
        </Helmet>
        <SkeletonLoader />
      </>
    );
  }

  if (!assessmentData || assessments.length === 0) {
    return (
      <div className="performance-empty-cusset">
        <h2>No Assessment Data Available</h2>
        <p>You don't have any completed site assessments yet. Book an assessment to view your site's solar potential data.</p>
        <button className="btn-primary-cusset" onClick={() => navigate('/dashboard/schedule')}>
          Book an Assessment
        </button>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Assessment Data | SOLARIS</title>
      </Helmet>

      <div className="performance-container-cusset">
        {/* Header */}
        <div className="performance-header-cusset">
          <div>
            <h1>Site Assessment Data</h1>
            <p>7-day IoT environmental data collected from your site</p>
          </div>
          {assessments.length > 1 && (
            <select 
              className="system-select-cusset"
              value={selectedAssessment?.id}
              onChange={(e) => {
                const selected = assessments.find(a => a.id === parseInt(e.target.value));
                setSelectedAssessment(selected);
                fetchAssessmentData(selected.id);
              }}
            >
              {assessments.map(assessment => (
                <option key={assessment.id} value={assessment.id}>
                  {assessment.reference} - {assessment.address}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Assessment Info Bar */}
        <div className="assessment-info-bar-cusset">
          <div className="info-item-cusset">
            <span className="info-label-cusset">Assessment ID</span>
            <strong>{assessmentData.assessment.reference}</strong>
          </div>
          <div className="info-item-cusset">
            <span className="info-label-cusset">Location</span>
            <strong>{assessmentData.assessment.address}</strong>
          </div>
          <div className="info-item-cusset">
            <span className="info-label-cusset">Period</span>
            <strong>{assessmentData.assessment.period.start} to {assessmentData.assessment.period.end}</strong>
          </div>
          <div className="info-item-cusset">
            <span className="info-label-cusset">Data Completeness</span>
            <strong>{assessmentData.assessment.dataCompleteness}%</strong>
            <span className="info-sub-cusset">({assessmentData.assessment.actualReadings}/{assessmentData.assessment.expectedReadings} readings)</span>
          </div>
        </div>

        {/* Device Status */}
        <div className="device-status-bar-cusset">
          <div className="status-item-cusset">
            <span>Device Battery</span>
            <div className="battery-bar-cusset">
              <div className="battery-fill-cusset" style={{ width: `${assessmentData.assessment.deviceStatus.battery}%` }}></div>
            </div>
            <span>{assessmentData.assessment.deviceStatus.battery}%</span>
          </div>
          <div className="status-item-cusset">
            <span>WiFi Status</span>
            <span className={`status-badge-cusset ${assessmentData.assessment.deviceStatus.wifiStatus === 'connected' ? 'good-cusset' : 'warning-cusset'}`}>
              {assessmentData.assessment.deviceStatus.wifiStatus === 'connected' ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="status-item-cusset">
            <span>SD Card Backup</span>
            <span className={`status-badge-cusset ${assessmentData.assessment.deviceStatus.sdCardBackup === 'active' ? 'good-cusset' : 'warning-cusset'}`}>
              {assessmentData.assessment.deviceStatus.sdCardBackup === 'active' ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="status-item-cusset">
            <span>Last Upload</span>
            <span>{new Date(assessmentData.assessment.deviceStatus.lastUpload).toLocaleString()}</span>
          </div>
        </div>

        {/* Summary Stats Cards */}
        <div className="stats-grid-cusset">
          <div className="stat-card-cusset">
            <span className="stat-label-cusset">Avg Daily Irradiance</span>
            <span className="stat-value-cusset">{formatNumber(assessmentData.summary.averageDailyIrradiance)} Wh/m²</span>
            <span className="stat-trend-cusset">Per day</span>
          </div>
          <div className="stat-card-cusset">
            <span className="stat-label-cusset">Peak Irradiance</span>
            <span className="stat-value-cusset">{assessmentData.summary.peakIrradiance} W/m²</span>
            <span className="stat-trend-cusset">{new Date(assessmentData.summary.peakIrradianceTime).toLocaleString()}</span>
          </div>
          <div className="stat-card-cusset">
            <span className="stat-label-cusset">Avg Temperature</span>
            <span className="stat-value-cusset">{assessmentData.summary.averageTemperature}°C</span>
            <span className="stat-trend-cusset">Range: {assessmentData.summary.minTemperature} - {assessmentData.summary.maxTemperature}°C</span>
          </div>
          <div className="stat-card-cusset">
            <span className="stat-label-cusset">Site Classification</span>
            <span className={`stat-value-cusset ${getSiteClassificationClass(assessmentData.summary.siteClassification)}`}>
              {assessmentData.summary.siteClassification}
            </span>
            <span className="stat-trend-cusset">Total: {formatNumber(assessmentData.summary.totalSolarResource)} Wh/m²</span>
          </div>
        </div>

        {/* Daily Data Table */}
        <div className="daily-data-section-cusset">
          <h2>7-Day Assessment Data</h2>
          <p className="section-desc-cusset">Data collected from 6:00 AM to 6:00 PM daily, readings every 15 minutes</p>
          
          <div className="daily-table-cusset">
            <div className="table-header-cusset">
              <div>Day</div>
              <div>Date</div>
              <div>Irradiance (Wh/m²)</div>
              <div>Temperature (°C)</div>
              <div>Humidity (%)</div>
              <div>Condition</div>
            </div>
            {assessmentData.dailyData.map((day, index) => (
              <div 
                key={index} 
                className={`table-row-cusset ${selectedDay?.date === day.date ? 'selected-cusset' : ''}`}
                onClick={() => setSelectedDay(day)}
              >
                <div>Day {day.day}</div>
                <div>{new Date(day.date).toLocaleDateString()}</div>
                <div className={`irradiance-value-cusset ${day.irradiance >= 4800 ? 'high-cusset' : day.irradiance >= 4000 ? 'medium-cusset' : 'low-cusset'}`}>
                  {formatNumber(day.irradiance)}
                </div>
                <div>{day.temperature}</div>
                <div>{day.humidity}</div>
                <div>{getConditionIcon(day.condition)} {day.condition}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Data for Selected Day */}
        {selectedDay && (
          <div className="hourly-section-cusset">
            <h2>Hourly Data - {new Date(selectedDay.date).toLocaleDateString()}</h2>
            <p className="section-desc-cusset">Readings every 15 minutes (aggregated hourly)</p>
            
            <div className="hourly-grid-cusset">
              {assessmentData.hourlyData.map((hour, index) => (
                <div key={index} className="hour-card-cusset">
                  <div className="hour-time-cusset">{hour.hour}</div>
                  <div className="hour-irradiance-cusset">
                    <span className="label-cusset">Irradiance</span>
                    <strong>{hour.irradiance} W/m²</strong>
                  </div>
                  <div className="hour-temp-cusset">
                    <span className="label-cusset">Temp</span>
                    <span>{hour.temperature}°C</span>
                  </div>
                  <div className="hour-humidity-cusset">
                    <span className="label-cusset">Humidity</span>
                    <span>{hour.humidity}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Irradiance Curve Visualization */}
        <div className="chart-section-cusset">
          <h2>Daily Irradiance Curve</h2>
          <p className="section-desc-cusset">Solar radiation pattern throughout the day</p>
          
          <div className="irradiance-chart-cusset">
            {assessmentData.hourlyData.map((hour, index) => (
              <div key={index} className="chart-bar-container-cusset">
                <div className="chart-label-cusset">{hour.hour.split(' ')[0]}</div>
                <div className="chart-bar-wrapper-cusset">
                  <div 
                    className="chart-bar-cusset" 
                    style={{ 
                      height: `${(hour.irradiance / 1000) * 100}%`,
                      background: '#f39c12'
                    }}
                  ></div>
                </div>
                <div className="chart-value-cusset">{hour.irradiance}</div>
              </div>
            ))}
          </div>
        </div>

        {/* GPS & Location Data */}
        <div className="location-section-cusset">
          <h2>Site Location Data</h2>
          <div className="location-grid-cusset">
            <div className="location-card-cusset">
              <h3>GPS Coordinates</h3>
              <p><strong>Latitude:</strong> {assessmentData.locationData.latitude}° N</p>
              <p><strong>Longitude:</strong> {assessmentData.locationData.longitude}° E</p>
            </div>
            <div className="location-card-cusset">
              <h3>Panel Orientation</h3>
              <p><strong>Optimal Tilt Angle:</strong> {assessmentData.locationData.optimalTiltAngle}°</p>
              <p><strong>Recommended Orientation:</strong> {assessmentData.locationData.orientation}</p>
            </div>
            <div className="location-card-cusset">
              <h3>Shading Analysis</h3>
              <p><strong>East:</strong> {assessmentData.locationData.shadingAnalysis.east}</p>
              <p><strong>West:</strong> {assessmentData.locationData.shadingAnalysis.west}</p>
              <p><strong>South:</strong> {assessmentData.locationData.shadingAnalysis.south}</p>
              <p><strong>North:</strong> {assessmentData.locationData.shadingAnalysis.north}</p>
            </div>
          </div>
        </div>

        {/* Shading Impact */}
        <div className="shading-section-cusset">
          <h2>Shading Impact Analysis</h2>
          <div className="shading-table-cusset">
            <div className="table-header-cusset">
              <div>Time</div>
              <div>Shading Status</div>
              <div>Irradiance Loss</div>
            </div>
            {assessmentData.shadingData.map((shade, index) => (
              <div key={index} className="table-row-cusset">
                <div>{shade.time}</div>
                <div>
                  <span className={`shading-status-cusset ${shade.status}`}>
                    {shade.status === 'clear' ? 'Clear' : shade.status === 'partial' ? 'Partial Shade' : 'Shaded'}
                  </span>
                </div>
                <div className={shade.irradianceLoss > 0 ? 'loss-cusset' : ''}>
                  {shade.irradianceLoss > 0 ? `-${shade.irradianceLoss}%` : 'No loss'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Engineer Notes */}
        <div className="notes-section-cusset">
          <h2>Engineer Assessment Notes</h2>
          <div className="notes-card-cusset">
            <ul>
              {assessmentData.engineerNotes.map((note, index) => (
                <li key={index}>{note}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recommended System Size */}
        <div className="recommendation-section-cusset">
          <h2>System Recommendation</h2>
          <div className="recommendation-card-cusset">
            <div className="recommendation-content-cusset">
              <div>
                <h3>Based on collected data</h3>
                <p className="recommendation-desc-cusset">
                  With an average daily irradiance of {formatNumber(assessmentData.summary.averageDailyIrradiance)} Wh/m², 
                  the site is classified as <strong>{assessmentData.summary.siteClassification}</strong> for solar installation.
                </p>
                <p className="recommendation-note-cusset">
                  A detailed quotation with system size options and cost breakdown will be provided by your assigned engineer.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="performance-actions-cusset">
          <button className="action-btn-cusset" onClick={() => handleExportData('pdf')} disabled={exporting}>
            {exporting ? 'Downloading...' : 'Download Full Report (PDF)'}
          </button>
          <button className="action-btn-cusset" onClick={() => handleExportData('csv')} disabled={exporting}>
            {exporting ? 'Exporting...' : 'Export Raw Data (CSV)'}
          </button>
          <button className="action-btn-cusset primary-cusset" onClick={() => navigate('/dashboard/quotation')}>
            View Quotation
          </button>
        </div>
      </div>
    </>
  );
};

export default SystemPerformance;