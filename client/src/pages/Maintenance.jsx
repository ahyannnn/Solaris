// pages/Maintenance.adminsc.jsx
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

  // Skeleton Loader
  const SkeletonLoader = () => (
    <div className="maintenance-container-adminsc">
      <div className="maintenance-content-adminsc">
        <div className="skeleton-icon-adminsc"></div>
        <div className="skeleton-line-adminsc large-adminsc"></div>
        <div className="skeleton-line-adminsc medium-adminsc"></div>
        <div className="skeleton-line-adminsc small-adminsc"></div>
        <div className="skeleton-button-adminsc"></div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Maintenance | Salfer Engineering</title>
        </Helmet>
        <SkeletonLoader />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{maintenanceData.title} | Salfer Engineering</title>
      </Helmet>

      <div className="maintenance-container-adminsc">
        <div className="maintenance-content-adminsc">
          <div className="maintenance-icon-adminsc">
            <FaTools />
          </div>
          
          <h1>{maintenanceData.title}</h1>
          <p className="maintenance-message-adminsc">{maintenanceData.message}</p>
          
          <div className="maintenance-details-adminsc">
            <div className="detail-item-adminsc">
              <FaClock />
              <span>Estimated Duration: {maintenanceData.estimatedDuration}</span>
            </div>
          </div>
          
          {maintenanceData.showCountdown && timeRemaining && (
            <div className="countdown-timer-adminsc">
              <h3>Expected to be back in:</h3>
              <div className="timer-adminsc">
                <div className="timer-unit-adminsc">
                  <span className="timer-value-adminsc">{String(timeRemaining.hours).padStart(2, '0')}</span>
                  <span className="timer-label-adminsc">Hours</span>
                </div>
                <div className="timer-separator-adminsc">:</div>
                <div className="timer-unit-adminsc">
                  <span className="timer-value-adminsc">{String(timeRemaining.minutes).padStart(2, '0')}</span>
                  <span className="timer-label-adminsc">Minutes</span>
                </div>
                <div className="timer-separator-adminsc">:</div>
                <div className="timer-unit-adminsc">
                  <span className="timer-value-adminsc">{String(timeRemaining.seconds).padStart(2, '0')}</span>
                  <span className="timer-label-adminsc">Seconds</span>
                </div>
              </div>
            </div>
          )}
          
          {maintenanceData.showProgressBar && (
            <div className="progress-section-adminsc">
              <div className="progress-bar-container-adminsc">
                <div className="progress-bar-adminsc" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="progress-text-adminsc">{Math.round(progress)}% Complete</p>
            </div>
          )}
          
          <div className="contact-info-adminsc">
            <h3>Need immediate assistance?</h3>
            <div className="contact-details-adminsc">
              <a href={`mailto:${maintenanceData.contactEmail}`} className="contact-link-adminsc">
                <FaEnvelope /> {maintenanceData.contactEmail}
              </a>
              <a href={`tel:${maintenanceData.contactPhone}`} className="contact-link-adminsc">
                <FaPhone /> {maintenanceData.contactPhone}
              </a>
            </div>
          </div>
          
          {(maintenanceData.socialLinks?.facebook || 
            maintenanceData.socialLinks?.twitter || 
            maintenanceData.socialLinks?.instagram) && (
            <div className="social-links-adminsc">
              <h3>Follow us for updates:</h3>
              <div className="social-icons-adminsc">
                {maintenanceData.socialLinks.facebook && (
                  <a href={maintenanceData.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="social-icon-adminsc facebook-adminsc">
                    <FaFacebook />
                  </a>
                )}
                {maintenanceData.socialLinks.twitter && (
                  <a href={maintenanceData.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="social-icon-adminsc twitter-adminsc">
                    <FaTwitter />
                  </a>
                )}
                {maintenanceData.socialLinks.instagram && (
                  <a href={maintenanceData.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="social-icon-adminsc instagram-adminsc">
                    <FaInstagram />
                  </a>
                )}
              </div>
            </div>
          )}
          
          <div className="refresh-message-adminsc">
            <small>Please refresh the page after maintenance is complete.</small>
          </div>
        </div>
      </div>
    </>
  );
};

export default Maintenance;