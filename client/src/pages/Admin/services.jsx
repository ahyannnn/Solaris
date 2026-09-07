import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import {
  FaTools,
  FaSearch,
  FaEye,
  FaTimes,
  FaSpinner,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaCalendarAlt
} from 'react-icons/fa';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import { useRealtimeTable, applyRealtimeRecord } from '../../hooks/useRealtimeTable';
import '../../styles/Admin/services.css';

const STATUS_OPTIONS = ['pending', 'contacted', 'scheduled', 'completed', 'cancelled'];
const SERVICE_OPTIONS = [
  'Electrical Design and Wiring',
  'CCTV Installation',
  'Broadcast system integration',
  'Lighting system design and integration',
  'Solar Installation Course with hands on training',
  'Maintenance'
];

const Services = () => {
  const { toast, showToast, hideToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [adminRemarks, setAdminRemarks] = useState('');
  const [updating, setUpdating] = useState(false);
  const [brokenPhotos, setBrokenPhotos] = useState(() => new Set());

  const getAuthHeader = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchRequests = useCallback(async () => {
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (serviceFilter !== 'all') params.serviceType = serviceFilter;
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/service-requests`, {
        headers: getAuthHeader(),
        params
      });
      setRequests(res.data?.requests || []);
    } catch (err) {
      console.error('Fetch service requests failed:', err);
      showToast(err.response?.data?.message || 'Failed to load service requests', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, serviceFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLoading(true);
    fetchRequests();
  }, [fetchRequests]);

  useRealtimeTable('service-requests', (payload) => {
    // Live-merge creates/updates; refetch when filters active to stay correct
    if (statusFilter !== 'all' || serviceFilter !== 'all') {
      fetchRequests();
      return;
    }
    setRequests(prev => applyRealtimeRecord(prev, payload));
  });

  const openDetail = (req) => {
    setSelected(req);
    setNewStatus(req.status);
    setAdminRemarks(req.adminRemarks || '');
  };

  const handleStatusUpdate = async () => {
    if (!selected || !newStatus) return;
    if (newStatus === selected.status && adminRemarks === (selected.adminRemarks || '')) {
      showToast('No changes to save', 'warning');
      return;
    }
    setUpdating(true);
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/service-requests/${selected._id}/status`,
        { status: newStatus, adminRemarks },
        { headers: getAuthHeader() }
      );
      const updated = res.data?.request;
      if (updated) {
        setRequests(prev => prev.map(r => (r._id === updated._id ? { ...r, ...updated } : r)));
        setSelected(prev => ({ ...prev, ...updated }));
      }
      showToast('Service request updated. Customer has been notified.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const filtered = requests.filter(r => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (r.referenceNo || '').toLowerCase().includes(q) ||
      (r.fullName || '').toLowerCase().includes(q) ||
      (r.email || '').toLowerCase().includes(q) ||
      (r.phone || '').toLowerCase().includes(q) ||
      (r.serviceType || '').toLowerCase().includes(q)
    );
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    contacted: requests.filter(r => r.status === 'contacted').length,
    scheduled: requests.filter(r => r.status === 'scheduled').length,
    completed: requests.filter(r => r.status === 'completed').length
  };

  const badgeClass = (s) => `admsvc-badge ${s || ''}`;

  return (
    <>
      <Helmet>
        <title>Services | Salfer Engineering</title>
      </Helmet>

      <div className="admsvc-container">
        <div className="admsvc-stats">
          <div className="admsvc-stat"><span className="stat-num">{stats.pending}</span><span className="stat-label">Pending</span></div>
          <div className="admsvc-stat"><span className="stat-num">{stats.contacted}</span><span className="stat-label">Contacted</span></div>
          <div className="admsvc-stat"><span className="stat-num">{stats.scheduled}</span><span className="stat-label">Scheduled</span></div>
          <div className="admsvc-stat"><span className="stat-num">{stats.completed}</span><span className="stat-label">Completed</span></div>
        </div>

        <div className="admsvc-toolbar">
          <div className="admsvc-search">
            <FaSearch />
            <input
              type="text"
              placeholder="Search name, reference, phone, service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)}>
            <option value="all">All services</option>
            {SERVICE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="admsvc-table-wrap">
          {loading ? (
            <div className="admsvc-empty"><FaSpinner className="spinning" /><p>Loading service requests...</p></div>
          ) : filtered.length === 0 ? (
            <div className="admsvc-empty">
              <FaTools className="empty-icon" />
              <h3>No service requests</h3>
              <p>New customer requests will appear here.</p>
            </div>
          ) : (
            <table className="admsvc-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Reference</th>
                  <th>Contact</th>
                  <th>Service</th>
                  <th>Preferred</th>
                  <th>Status</th>
                  <th>Requested</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const photoURL = typeof r.clientId === 'object' ? r.clientId?.userId?.photoURL : null;
                  const displayName = r.fullName || ((r.clientId && typeof r.clientId === 'object') ? `${r.clientId?.contactFirstName || ''} ${r.clientId?.contactLastName || ''}`.trim() : '') || 'N/A';
                  const initials = displayName !== 'N/A' ? displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : '—';
                  const photoKey = r._id;
                  return (
                  <tr key={r._id}>
                    <td data-label="Customer">
                      <div className="admsvc-customer-profile">
                        {photoURL && !brokenPhotos.has(photoKey) ? (
                          <img
                            src={photoURL}
                            alt=""
                            className="admsvc-customer-photo"
                            onError={() => setBrokenPhotos((prev) => new Set(prev).add(photoKey))}
                          />
                        ) : (
                          <span className="admsvc-customer-initials">{initials}</span>
                        )}
                        <span className="admsvc-customer-name">{displayName}</span>
                      </div>
                    </td>
                    <td className="mono" data-label="Reference">{r.referenceNo}</td>
                    <td data-label="Contact">
                      <div className="contact-cell">
                        <span><FaPhone /> {r.phone}</span>
                        <span className="muted"><FaEnvelope /> {r.email}</span>
                      </div>
                    </td>
                    <td data-label="Service">{r.serviceType}</td>
                    <td data-label="Preferred">{r.preferredDate ? new Date(r.preferredDate).toLocaleDateString() : '—'}</td>
                    <td data-label="Status"><span className={badgeClass(r.status)}>{r.status}</span></td>
                    <td data-label="Requested">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td data-label="Action">
                      <button className="admsvc-view-btn" onClick={() => openDetail(r)}>
                        <FaEye /> View
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {selected && (
          <div className="admsvc-modal-overlay" onClick={() => setSelected(null)}>
            <div className="admsvc-modal" onClick={e => e.stopPropagation()}>
              <div className="admsvc-modal-header">
                <h3>{selected.referenceNo} <span className={badgeClass(selected.status)}>{selected.status}</span></h3>
                <button className="admsvc-modal-close" onClick={() => setSelected(null)}><FaTimes /></button>
              </div>
              <div className="admsvc-modal-body">
                <div className="detail-grid">
                  <div><label>Customer</label><p>{selected.fullName}</p></div>
                  <div><label>Phone</label><p><a href={`tel:${selected.phone}`}>{selected.phone}</a></p></div>
                  <div><label>Email</label><p><a href={`mailto:${selected.email}`}>{selected.email}</a></p></div>
                  <div><label>Service</label><p>{selected.serviceType}</p></div>
                  <div><label>Preferred date</label><p>{selected.preferredDate ? new Date(selected.preferredDate).toLocaleDateString() : 'Not specified'}</p></div>
                  <div><label>Requested</label><p>{new Date(selected.createdAt).toLocaleString()}</p></div>
                </div>
                <div className="detail-full">
                  <label><FaMapMarkerAlt /> Service address</label>
                  <p>{selected.serviceAddress}</p>
                </div>
                {selected.notes && (
                  <div className="detail-full">
                    <label>Customer notes</label>
                    <p className="notes">“{selected.notes}”</p>
                  </div>
                )}
                <div className="detail-row">
                  <div className="form-group">
                    <label>Update status *</label>
                    <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <small>Flow: pending → contacted → scheduled → completed (or cancelled).</small>
                  </div>
                </div>
                <div className="form-group">
                  <label>Remarks to customer (shown in their request list)</label>
                  <textarea
                    rows="3"
                    value={adminRemarks}
                    onChange={(e) => setAdminRemarks(e.target.value)}
                    placeholder="e.g. Called customer, scheduled site visit on..."
                  />
                </div>
                <div className="detail-contact-hint">
                  <FaCalendarAlt /> Contact the customer via phone/email above, then update the status so they see progress.
                </div>
              </div>
              <div className="admsvc-modal-footer">
                <button className="btn-cancel" onClick={() => setSelected(null)}>Close</button>
                <button className="btn-save" onClick={handleStatusUpdate} disabled={updating}>
                  {updating ? <><FaSpinner className="spinning" /> Saving...</> : 'Save & Notify Customer'}
                </button>
              </div>
            </div>
          </div>
        )}

        <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      </div>
    </>
  );
};

export default Services;
