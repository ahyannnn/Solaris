// pages/Maintenance.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { 
  FaTools, 
  FaClock, 
  FaEnvelope, 
  FaPhone, 
  FaFacebook, 
  FaTwitter, 
  FaInstagram,
  FaSpinner
} from 'react-icons/fa';
import '../styles/maintenance.css';

const Maintenance = () => {
  const [maintenanceData, setMaintenanceData] = useState({
    title: 'Under Maintenance',
    message: 'We are currently performing scheduled maintenance. Please check back soon.',
    estimatedDuration: '2 hours',
    scheduledStart: null,
    scheduledEnd: null,
    showCountdown: true,
    showProgressBar: true,
    contactEmail: 'support@salferengineering.com',
    contactPhone: '+63 XXX XXX XXXX',
    socialLinks: {}
  });
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchMaintenanceStatus();
  }, []);

  useEffect(() => {
    if (maintenanceData.scheduledEnd && maintenanceData.showCountdown) {
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [maintenanceData.scheduledEnd]);

  useEffect(() => {
    if (maintenanceData.scheduledStart && maintenanceData.scheduledEnd && maintenanceData.showProgressBar) {
      const interval = setInterval(updateProgress, 1000);
      return () => clearInterval(interval);
    }
  }, [maintenanceData.scheduledStart, maintenanceData.scheduledEnd]);

  const fetchMaintenanceStatus = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/maintenance/status`);
      setMaintenanceData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching maintenance status:', error);
      setLoading(false);
    }
  };

  const updateCountdown = () => {
    if (!maintenanceData.scheduledEnd) return;
    
    const end = new Date(maintenanceData.scheduledEnd);
    const now = new Date();
    const diff = end - now;
    
    if (diff <= 0) {
      setTimeRemaining(null);
      return;
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    setTimeRemaining({ hours, minutes, seconds });
  };

  const updateProgress = () => {
    if (!maintenanceData.scheduledStart || !maintenanceData.scheduledEnd) return;
    
    const start = new Date(maintenanceData.scheduledStart);
    const end = new Date(maintenanceData.scheduledEnd);
    const now = new Date();
    
    const total = end - start;
    const elapsed = now - start;
    
    if (elapsed <= 0) {
      setProgress(0);
    } else if (elapsed >= total) {
      setProgress(100);
    } else {
      setProgress((elapsed / total) * 100);
    }
  };

  if (loading) {
    return (
      <div className="maintenance-container">
        <div className="maintenance-content">
          <FaSpinner className="spinner" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{maintenanceData.title} | Salfer Engineering</title>
      </Helmet>

      <div className="maintenance-container">
        <div className="maintenance-content">
          <div className="maintenance-icon">
            <FaTools />
          </div>
          
          <h1>{maintenanceData.title}</h1>
          <p className="maintenance-message">{maintenanceData.message}</p>
          
          <div className="maintenance-details">
            <div className="detail-item">
              <FaClock />
              <span>Estimated Duration: {maintenanceData.estimatedDuration}</span>
            </div>
          </div>
          
          {maintenanceData.showCountdown && timeRemaining && (
            <div className="countdown-timer">
              <h3>Expected to be back in:</h3>
              <div className="timer">
                <div className="timer-unit">
                  <span className="timer-value">{String(timeRemaining.hours).padStart(2, '0')}</span>
                  <span className="timer-label">Hours</span>
                </div>
                <div className="timer-separator">:</div>
                <div className="timer-unit">
                  <span className="timer-value">{String(timeRemaining.minutes).padStart(2, '0')}</span>
                  <span className="timer-label">Minutes</span>
                </div>
                <div className="timer-separator">:</div>
                <div className="timer-unit">
                  <span className="timer-value">{String(timeRemaining.seconds).padStart(2, '0')}</span>
                  <span className="timer-label">Seconds</span>
                </div>
              </div>
            </div>
          )}
          
          {maintenanceData.showProgressBar && (
            <div className="progress-section">
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="progress-text">{Math.round(progress)}% Complete</p>
            </div>
          )}
          
          <div className="contact-info">
            <h3>Need immediate assistance?</h3>
            <div className="contact-details">
              <a href={`mailto:${maintenanceData.contactEmail}`}>
                <FaEnvelope /> {maintenanceData.contactEmail}
              </a>
              <a href={`tel:${maintenanceData.contactPhone}`}>
                <FaPhone /> {maintenanceData.contactPhone}
              </a>
            </div>
          </div>
          
          {(maintenanceData.socialLinks?.facebook || 
            maintenanceData.socialLinks?.twitter || 
            maintenanceData.socialLinks?.instagram) && (
            <div className="social-links">
              <h3>Follow us for updates:</h3>
              <div className="social-icons">
                {maintenanceData.socialLinks.facebook && (
                  <a href={maintenanceData.socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                    <FaFacebook />
                  </a>
                )}
                {maintenanceData.socialLinks.twitter && (
                  <a href={maintenanceData.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                    <FaTwitter />
                  </a>
                )}
                {maintenanceData.socialLinks.instagram && (
                  <a href={maintenanceData.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                    <FaInstagram />
                  </a>
                )}
              </div>
            </div>
          )}
          
          <div className="refresh-message">
            <small>Please refresh the page after maintenance is complete.</small>
          </div>
        </div>
      </div>
    </>
  );
};

export default Maintenance;