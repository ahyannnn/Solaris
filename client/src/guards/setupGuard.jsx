// guards/setupGuard.jsx
import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

const SetupGuard = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const checkSetupStatus = async () => {
      // Get auth data from storage
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const role = localStorage.getItem('userRole') || sessionStorage.getItem('userRole');
      const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');

      // Check if user is authenticated
      if (!token || !role) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);
      setUserRole(role);

      try {
        // Check if user needs setup by calling your API
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/clients/me/setup-status`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        // Assuming your API returns { needsSetup: true/false, accountSetup: true/false }
        // Adjust based on your actual API response structure
        const needsSetupStatus = response.data.needsSetup || !response.data.accountSetup;
        setNeedsSetup(needsSetupStatus);
        
      } catch (error) {
        console.error('Error checking setup status:', error);
        
        // If there's an error, check localStorage for setup status
        const hasCompletedSetup = localStorage.getItem('hasCompletedSetup') === 'true' ||
                                  sessionStorage.getItem('hasCompletedSetup') === 'true';
        
        // If we can't verify, assume they need setup (safer to show setup than to block)
        setNeedsSetup(!hasCompletedSetup);
      } finally {
        setLoading(false);
      }
    };

    checkSetupStatus();
  }, []);

  if (loading) {
    return (
      <div className="setup-guard-loading">
        <div className="loading-spinner"></div>
        <p>Checking account status...</p>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated but doesn't need setup, redirect to dashboard based on role
  if (!needsSetup) {
    if (userRole === 'admin') return <Navigate to="/app/admin" replace />;
    if (userRole === 'engineer') return <Navigate to="/app/engineer" replace />;
    return <Navigate to="/app/customer" replace />;
  }

  // If authenticated and needs setup, allow access to setup page
  return children;
};

export default SetupGuard;