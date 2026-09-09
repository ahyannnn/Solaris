// pages/Customer/myrequests.jsx - My Service Requests (separate page)
// Mirrors mobile MyServiceRequestsScreen: opened from Services via a
// "View My Requests" row, with back navigation to the Services tab.
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import {
  FaArrowLeft,
  FaClipboardList,
  FaTools,
  FaSpinner,
  FaTimes,
  FaCalendarAlt
} from 'react-icons/fa';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import { useRealtimeTable, applyRealtimeRecord } from '../../hooks/useRealtimeTable';
import '../../styles/Customer/supports.css';

const MyServiceRequests = () => {
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const [serviceRequests, setServiceRequests] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [cancellingServiceId, setCancellingServiceId] = useState(null);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchMyServiceRequests = async () => {
    setLoadingServices(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/service-requests/my-requests`, {
        headers: getAuthHeader()
      });
      setServiceRequests(res.data?.requests || []);
    } catch (e) {
      console.error('Fetch service requests failed:', e);
      showToast('Failed to load your requests', 'error');
    } finally {
      setLoadingServices(false);
    }
  };

  useEffect(() => {
    fetchMyServiceRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime: admin status updates appear without reload.
  useRealtimeTable(['service-requests'], (payload) => {
    setServiceRequests((prev) => applyRealtimeRecord(prev, payload));
    fetchMyServiceRequests();
  });

  const handleCancelService = async (id) => {
    setCancellingServiceId(id);
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/service-requests/${id}/cancel`,
        {},
        { headers: getAuthHeader() }
      );
      const updated = res.data?.request;
      if (updated) setServiceRequests(prev => prev.map(r => (r._id === id ? updated : r)));
      showToast('Service request cancelled', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel request', 'error');
    } finally {
      setCancellingServiceId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
      case 'pending':
        return <span className="status-badge-support open">{status === 'pending' ? 'Pending' : 'Open'}</span>;
      case 'in-progress':
      case 'contacted':
        return <span className="status-badge-support in-progress">{status === 'contacted' ? 'Contacted' : 'In Progress'}</span>;
      case 'scheduled':
        return <span className="status-badge-support in-progress">Scheduled</span>;
      case 'resolved':
      case 'completed':
        return <span className="status-badge-support resolved">{status === 'completed' ? 'Completed' : 'Resolved'}</span>;
      case 'cancelled':
        return <span className="status-badge-support">{`Cancelled`}</span>;
      default:
        return <span className="status-badge-support">{status}</span>;
    }
  };

  return (
    <>
      <Helmet>
        <title>My Service Requests | Salfer Engineering</title>
      </Helmet>

      <div className="cusup-container">
        <button className="cusup-page-back-btn" onClick={() => navigate('/app/customer/support?tab=services')} aria-label="Back to services">
          <FaArrowLeft /> Back to Services
        </button>
        <div className="cusup-header">
          <button className="cusup-back-btn" onClick={() => navigate('/app/customer/support?tab=services')} aria-label="Back to services">
            <FaArrowLeft />
          </button>
          <span className="cusup-header-title-mobile">My Requests</span>
          <div className="cusup-header-content">
            <h1>My Service Requests</h1>
            <p>Track your additional service requests and their status.</p>
          </div>
          <div className="cusup-header-icon">
            <FaClipboardList />
          </div>
        </div>

        {loadingServices ? (
          <div className="cusup-empty-page">
            <FaSpinner className="empty-icon spinning" />
            <p>Loading your requests...</p>
          </div>
        ) : serviceRequests.length === 0 ? (
          <div className="cusup-empty-page">
            <FaTools className="empty-icon" />
            <h3>No service requests yet</h3>
            <p>Go to Services to avail one</p>
            <button
              className="cusup-submit-btn"
              onClick={() => navigate('/app/customer/support?tab=services')}
            >
              Browse Services
            </button>
          </div>
        ) : (
          <div className="cusup-section">
            <div className="cusup-section-header">
              <FaClipboardList />
              <h2>My Service Requests {serviceRequests.length > 0 && `(${serviceRequests.length})`}</h2>
            </div>
            <div className="cusup-tickets-list">
              {serviceRequests.map(r => (
                <div key={r._id} className="cusup-ticket-card">
                  <div className="cusup-ticket-header">
                    <div className="cusup-ticket-id">{r.referenceNo || r._id.slice(-6).toUpperCase()}</div>
                    {getStatusBadge(r.status)}
                  </div>
                  <div className="cusup-ticket-subject">{r.serviceType}</div>
                  <div className="cusup-ticket-description">
                    {r.serviceAddress}
                    {r.preferredDate && (
                      <span> &nbsp;•&nbsp; <FaCalendarAlt style={{ display: 'inline' }} /> {new Date(r.preferredDate).toLocaleDateString()}</span>
                    )}
                  </div>
                  {r.notes && <div className="cusup-ticket-description" style={{ fontStyle: 'italic' }}>“{r.notes}”</div>}
                  {r.adminRemarks && (
                    <div className="cusup-message support" style={{ marginTop: '0.5rem' }}>
                      <strong>Update from our team:</strong>
                      <p>{r.adminRemarks}</p>
                    </div>
                  )}
                  <div className="cusup-ticket-footer">
                    <span className="cusup-ticket-date">{new Date(r.createdAt).toLocaleDateString()}</span>
                    {r.status === 'pending' && (
                      <button
                        className="cusup-view-ticket-btn"
                        onClick={() => handleCancelService(r._id)}
                        disabled={cancellingServiceId === r._id}
                      >
                        <FaTimes /> {cancellingServiceId === r._id ? 'Cancelling...' : 'Cancel request'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}
        </div>

      <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
    </>
  );
};

export default MyServiceRequests;
