import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import {
  FaTools,
  FaSearch,
  FaEye,
  FaTimes,
  FaSpinner,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
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

// Chart constants (module scope so chart memos stay dependency-clean)
const CHART_STATUSES = ['pending', 'contacted', 'scheduled', 'completed'];
const STATUS_COLORS = {
  pending: '#F39C12',
  contacted: '#3B82F6',
  scheduled: '#8B5CF6',
  completed: '#10B981'
};

const Services = () => {
  const { toast, showToast, hideToast } = useToast();
  // Server-side paging: `requests` holds ONE page (10 rows). Totals from the API.
  const [requests, setRequests] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selected, setSelected] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [adminRemarks, setAdminRemarks] = useState('');
  const [updating, setUpdating] = useState(false);
  const [brokenPhotos, setBrokenPhotos] = useState(() => new Set());
  // Charts from the stats endpoint (no row dumps).
  const [statusChartData, setStatusChartData] = useState([]);
  const [serviceChartData, setServiceChartData] = useState([]);
  const searchTimeoutRef = useRef(null);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchRequests = useCallback(async () => {
    try {
      // Server-side paging: ONE page of 10 rows (search/sort/filter by the API).
      const params = {
        page: currentPage,
        limit: 10,
        search: appliedSearch || undefined,
        sortBy,
        order: sortOrder
      };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (serviceFilter !== 'all') params.serviceType = serviceFilter;
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/service-requests`, {
        headers: getAuthHeader(),
        params
      });
      setRequests(res.data?.requests || []);
      setTotalItems(res.data?.total || 0);
      setTotalPages(res.data?.totalPages || 1);
      if (res.data?.page && res.data.page !== currentPage) {
        setCurrentPage(res.data.page);
      }
    } catch (err) {
      console.error('Fetch service requests failed:', err);
      showToast(err.response?.data?.message || 'Failed to load service requests', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, serviceFilter, currentPage, appliedSearch, sortBy, sortOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setLoading(true);
    fetchRequests();
    fetchChartStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchRequests]);

  // Debounced search: apply term + jump back to page 1 (batched single fetch).
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setAppliedSearch(searchTerm.trim());
      setCurrentPage(1);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Charts from the lightweight stats endpoint (no row dumps).
  const fetchChartStats = useCallback(async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/service-requests/stats`, {
        headers: getAuthHeader()
      });
      const stats = res.data?.stats || {};
      setStatusChartData(CHART_STATUSES.map((s) => ({
        name: s.charAt(0).toUpperCase() + s.slice(1),
        value: stats.byStatus?.[s] || 0
      })));
      const byService = stats.byService || {};
      setServiceChartData(SERVICE_OPTIONS.map((s) => ({
        name: s.length > 22 ? `${s.slice(0, 21)}…` : s,
        fullName: s,
        value: byService[s] || 0
      })));
    } catch (err) {
      console.error('Fetch chart stats failed:', err);
    }
  }, []);

  useRealtimeTable('service-requests', () => {
    // Refetch current page + stats (a merged row may not belong on this page).
    fetchRequests();
    fetchChartStats();
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
      // Status may move the row off this filtered page — refetch page + stats.
      fetchRequests();
      fetchChartStats();
      showToast('Service request updated. Customer has been notified.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  // NOTE: search/filter/sort now happen server-side (search/sortBy/order params).
  // `requests` already holds exactly ONE page of rows; totals from the API.

  // Server-side sort toggles: same field flips direction, new field starts asc.
  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const sortArrow = (field) => (sortBy === field ? (sortOrder === 'asc' ? ' ▲' : ' ▼') : '');

  // Schedule-style numbered pager window.
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * 10 + 1;
  const endItem = Math.min(currentPage * 10, totalItems);

  // Chart groupings come from fetchChartStats (stats endpoint state).
  // (Cancelled excluded from the status chart by design, same as before.)

  const badgeClass = (s) => `admsvc-badge ${s || ''}`;

  const StatusTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip-admsvc">
          <p className="tooltip-label-admsvc">{label}</p>
          <p className="tooltip-item-admsvc">
            Requests: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  const ServiceTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip-admsvc">
          <p className="tooltip-label-admsvc">{payload[0]?.payload?.fullName || payload[0].name}</p>
          <p className="tooltip-item-admsvc">
            Requests: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <Helmet>
        <title>Services | Salfer Engineering</title>
      </Helmet>

      <div className="admsvc-container">
        <div className="admsvc-charts-row">
          {/* CHART 1: Status pipeline (cancelled excluded) */}
          <div className="admsvc-chart-card">
            <div className="admsvc-chart-header">
              <h3>Request Status</h3>
              <span className="admsvc-chart-period">Pipeline overview</span>
            </div>
            <div className="admsvc-chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color, #EEF0ED)" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-secondary, #17212B)', fontSize: 12, fontWeight: 500 }}
                    dy={10}
                    interval={0}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-secondary, #17212B)', fontSize: 12, fontWeight: 500 }}
                    width={40}
                    allowDecimals={false}
                  />
                  <Tooltip content={<StatusTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={45}>
                    {statusChartData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name.toLowerCase()] || '#F39C12'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CHART 2: Requests by service type */}
          <div className="admsvc-chart-card">
            <div className="admsvc-chart-header">
              <h3>Requests by Service</h3>
              <span className="admsvc-chart-period">Most availed services</span>
            </div>
            <div className="admsvc-chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceChartData} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="var(--border-color, #EEF0ED)" />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-secondary, #17212B)', fontSize: 11, fontWeight: 500 }}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-secondary, #17212B)', fontSize: 11, fontWeight: 500 }}
                    width={110}
                  />
                  <Tooltip content={<ServiceTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                  <Bar
                    dataKey="value"
                    fill="#F39C12"
                    radius={[0, 4, 4, 0]}
                    barSize={22}
                    label={{
                      position: 'right',
                      fill: 'var(--text-primary, #17212B)',
                      fontSize: 12,
                      fontWeight: 600,
                      formatter: (value) => value > 0 ? value : ''
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
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
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={serviceFilter} onChange={(e) => { setServiceFilter(e.target.value); setCurrentPage(1); }}>
            <option value="all">All services</option>
            {SERVICE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="admsvc-table-wrap">
          {loading ? (
            <div className="admsvc-empty"><FaSpinner className="spinning" /><p>Loading service requests...</p></div>
          ) : requests.length === 0 ? (
            <div className="admsvc-empty">
              <FaTools className="empty-icon" />
              <h3>No service requests</h3>
              <p>{totalItems === 0 ? 'New customer requests will appear here.' : 'Try another page, filter, or search term.'}</p>
            </div>
          ) : (
            <table className="admsvc-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Reference</th>
                  <th className="sortable-th-admsvc" onClick={() => toggleSort('serviceType')} title="Sort by service">
                    Service{sortArrow('serviceType')}
                  </th>
                  <th>Preferred</th>
                  <th className="sortable-th-admsvc" onClick={() => toggleSort('status')} title="Sort by status">
                    Status{sortArrow('status')}
                  </th>
                  <th className="sortable-th-admsvc" onClick={() => toggleSort('createdAt')} title="Sort by date requested">
                    Requested{sortArrow('createdAt')}
                  </th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(r => {
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

        {/* Pagination (same design as schedule module) */}
        {totalPages > 1 && (
          <div className="pagination">
            <div className="pagination-info">
              Showing {startItem} to {endItem} of {totalItems} requests
            </div>
            <div className="pagination-controls">
              <button
                className="page-btn"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <FaChevronLeft /> Previous
              </button>
              {getPageNumbers().map(page => (
                <button
                  key={page}
                  className={`page-number ${currentPage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className="page-btn"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next <FaChevronRight />
              </button>
            </div>
          </div>
        )}

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
                    rows="2"
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
