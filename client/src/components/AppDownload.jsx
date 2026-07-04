// components/AppDownload.jsx
import React, { useState, useEffect } from 'react';
import { FaAndroid, FaDownload, FaSpinner } from 'react-icons/fa';
import axios from 'axios';

const AppDownload = () => {
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLatestApp();
  }, []);

  const fetchLatestApp = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/applications/latest`
      );
      if (response.data.success && response.data.app) {
        setApp(response.data.app);
      } else {
        setError('No application available');
      }
    } catch (error) {
      console.error('Error fetching latest app:', error);
      setError('Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (app && app.apkUrl) {
      window.open(app.apkUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="app-download-section loading">
        <FaSpinner className="spinner" />
        <span>Checking for updates...</span>
      </div>
    );
  }

  if (error || !app) {
    return null; // Don't show anything if no app available
  }

  return (
    <div className="app-download-section">
      <div className="app-download-content">
        <div className="app-icon">
          <FaAndroid />
        </div>
        <div className="app-info">
          <h3>Download Our App</h3>
          <div className="app-version">
            <span className="version-badge">v{app.version}</span>
            {app.releaseNotes && (
              <p className="release-notes">{app.releaseNotes}</p>
            )}
          </div>
        </div>
        <button 
          className="btn-download-app" 
          onClick={handleDownload}
        >
          <FaDownload /> Download APK
        </button>
      </div>
    </div>
  );
};

export default AppDownload;